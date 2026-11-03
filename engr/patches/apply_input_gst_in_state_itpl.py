"""Document-only GST correction for selected submitted ITPL purchase invoices.

Frappe migrations call execute() to update the target invoices. For a read-only
preflight, call execute(dry_run=True) manually before migrating.

This does not cancel invoices. After updating them, it submits one Repost
Accounting Ledger document containing all 26 invoices. ERPNext then reposts
their GL entries in a background job after the transaction commits.
"""

from decimal import Decimal

import frappe
from frappe.utils import flt, money_in_words


INVOICES = tuple(
	"PINV-ITPL-2627-" + suffix
	for suffix in (
		"00679", "00680", "00682", "00683", "00684", "00687", "00688",
		"00689", "00691", "00693", "00694", "00695", "00698", "00699",
		"00700", "00701", "00702", "00716", "00719", "00720", "00727",
		"00728", "00730", "00731", "00737", "00738","01853"
	)
)
TEMPLATE_NAME = "Input GST In-state - ITPL"
TAX_TYPES = {
	"Input Tax SGST - ITPL": "sgst",
	"Input Tax CGST - ITPL": "cgst",
}


def _amount(value):
	return Decimal(str(value or 0)).quantize(Decimal("0.01"))


def _check(condition, message):
	if not condition:
		raise ValueError(message)


def _source_item_for(purchase_item, source_items):
	matches = [
		row for row in source_items
		if row.purchase_order_item == purchase_item.po_detail
		and row.item_code == purchase_item.item_code
	]
	if len(matches) != 1:
		matches = [
			row for row in source_items
			if row.item_code == purchase_item.item_code
			and _amount(row.net_amount) == _amount(purchase_item.net_amount)
			and flt(row.qty) == flt(purchase_item.qty)
		]
	_check(len(matches) == 1, f"Cannot uniquely match item {purchase_item.name}")
	return matches[0]


def _preflight():
	template = frappe.get_doc("Purchase Taxes and Charges Template", TEMPLATE_NAME)
	_check(not template.disabled, "Tax template is disabled")
	_check(len(template.taxes) == 2, "Tax template must contain exactly two rows")
	_check({r.account_head for r in template.taxes} == set(TAX_TYPES), "Unexpected tax accounts")
	for row in template.taxes:
		_check(row.charge_type == "On Net Total" and flt(row.rate) == 9, "Unexpected tax calculation")
		_check(row.add_deduct_tax == "Add", "Template tax row must add to total")

	missing = [name for name in INVOICES if not frappe.db.exists("Purchase Invoice", name)]
	_check(not missing, "Missing purchase invoices: " + ", ".join(missing))
	plans = []
	for name in INVOICES:
		invoice = frappe.get_doc("Purchase Invoice", name)
		_check(invoice.docstatus == 1, f"{name}: invoice is not submitted")
		_check(invoice.company == template.company, f"{name}: company differs from template")
		_check(not invoice.taxes and not flt(invoice.total_taxes_and_charges), f"{name}: already has taxes")
		_check(not invoice.taxes_and_charges, f"{name}: already has a tax template")
		_check(not invoice.is_return and not invoice.is_reverse_charge, f"{name}: unsupported invoice type")
		_check(invoice.currency == "INR" and flt(invoice.conversion_rate) == 1, f"{name}: unsupported currency")
		_check(_amount(invoice.grand_total) == _amount(invoice.net_total), f"{name}: existing total differs from net")
		_check(
			_amount(invoice.grand_total) + _amount(invoice.rounding_adjustment)
			== _amount(invoice.rounded_total),
			f"{name}: existing rounded total is inconsistent",
		)
		_check(_amount(invoice.outstanding_amount) == _amount(invoice.rounded_total), f"{name}: invoice has allocations")
		_check(len(invoice.payment_schedule) == 1, f"{name}: expected one payment schedule row")
		_check(_amount(invoice.payment_schedule[0].outstanding) == _amount(invoice.rounded_total), f"{name}: payment schedule has allocations")
		_check(not frappe.db.exists("Payment Entry Reference", {"reference_doctype": "Purchase Invoice", "reference_name": name}), f"{name}: payment entry exists")

		source = frappe.get_doc("Sales Invoice", invoice.bill_no)
		_check(source.docstatus == 1, f"{name}: supplier sales invoice is not submitted")
		_check(source.company == invoice.supplier and source.customer == invoice.company, f"{name}: supplier sales invoice parties differ")
		_check(not source.pi_ref or source.pi_ref == name, f"{name}: supplier sales invoice references another purchase invoice")
		_check(_amount(source.net_total) == _amount(invoice.net_total), f"{name}: supplier net amount differs")
		_check(source.disable_rounded_total == invoice.disable_rounded_total, f"{name}: rounding settings differ")
		_check(len(source.taxes) == 2, f"{name}: supplier invoice tax rows differ")
		_check({r.gst_tax_type for r in source.taxes} == {"sgst", "cgst"}, f"{name}: supplier GST types differ")

		item_values = []
		for item in invoice.items:
			source_item = _source_item_for(item, source.items)
			_check(source_item.gst_treatment == "Taxable", f"{name}: supplier item is not taxable")
			_check(flt(source_item.sgst_rate) == 9 and flt(source_item.cgst_rate) == 9, f"{name}: supplier item rate differs")
			_check(_amount(source_item.net_amount) == _amount(item.net_amount), f"{name}: item taxable amount differs")
			item_values.append((item, source_item))

		amounts = {tax_type: _amount(sum(getattr(row, f"{tax_type}_amount") for _, row in item_values)) for tax_type in ("sgst", "cgst")}
		for row in source.taxes:
			_check(flt(row.rate) == 9 and _amount(row.tax_amount) == amounts[row.gst_tax_type], f"{name}: supplier tax totals differ")
		new_total = _amount(invoice.net_total) + sum(amounts.values())
		_check(new_total == _amount(source.grand_total), f"{name}: supplier grand total differs")
		_check(
			new_total + _amount(source.rounding_adjustment) == _amount(source.rounded_total),
			f"{name}: supplier rounded total is inconsistent",
		)
		_check(
			_amount(source.base_rounding_adjustment) == _amount(source.rounding_adjustment)
			and _amount(source.base_rounded_total) == _amount(source.rounded_total),
			f"{name}: supplier base rounding differs",
		)
		plans.append((invoice, source, item_values, amounts, new_total))
	return template, plans


def _apply_one(template, invoice, source, item_values, amounts, new_total):
	name = invoice.name
	running_total = _amount(invoice.net_total)
	for index, template_row in enumerate(template.taxes, 1):
		tax_type = TAX_TYPES[template_row.account_head]
		tax_amount = amounts[tax_type]
		running_total += tax_amount
		row = frappe.get_doc({
			"doctype": "Purchase Taxes and Charges",
			"parent": name, "parenttype": "Purchase Invoice", "parentfield": "taxes",
			"idx": index, "docstatus": 1,
			"category": template_row.category,
			"add_deduct_tax": template_row.add_deduct_tax,
			"charge_type": template_row.charge_type,
			"account_head": template_row.account_head,
			"description": template_row.description,
			"rate": template_row.rate,
			"gst_tax_type": tax_type,
			"cost_center": template_row.cost_center,
			"account_currency": template_row.account_currency,
			"allocate_full_amount_to_stock_items": template_row.allocate_full_amount_to_stock_items,
			"net_amount": invoice.net_total, "base_net_amount": invoice.base_net_total,
			"tax_amount": tax_amount, "base_tax_amount": tax_amount,
			"tax_amount_after_discount_amount": tax_amount,
			"base_tax_amount_after_discount_amount": tax_amount,
			"total": running_total, "base_total": running_total,
		})
		row.db_insert()
		for item_index, (item, source_item) in enumerate(item_values, 1):
			frappe.get_doc({
				"doctype": "Item Wise Tax Detail",
				"parent": name, "parenttype": "Purchase Invoice",
				"parentfield": "item_wise_tax_details",
				"idx": (index - 1) * len(item_values) + item_index,
				"docstatus": 1, "item_row": item.name, "tax_row": row.name,
				"rate": 9, "amount": getattr(source_item, f"{tax_type}_amount"),
				"taxable_amount": item.net_amount,
			}).db_insert()

	for item, source_item in item_values:
		frappe.db.set_value("Purchase Invoice Item", item.name, {
			"gst_treatment": "Taxable",
			"sgst_rate": 9, "cgst_rate": 9,
			"sgst_amount": source_item.sgst_amount,
			"cgst_amount": source_item.cgst_amount,
			"item_tax_amount": _amount(source_item.sgst_amount) + _amount(source_item.cgst_amount),
			"item_tax_rate": frappe.as_json({account: 9 for account in TAX_TYPES}),
		}, update_modified=False)

	total_tax = sum(amounts.values())
	payable_total = _amount(source.rounded_total)
	frappe.db.set_value("Purchase Invoice", name, {
		"taxes_and_charges": TEMPLATE_NAME,
		"tax_category": template.tax_category,
		"base_taxes_and_charges_added": total_tax,
		"taxes_and_charges_added": total_tax,
		"base_total_taxes_and_charges": total_tax,
		"total_taxes_and_charges": total_tax,
		"grand_total": new_total, "base_grand_total": new_total,
		"rounding_adjustment": source.rounding_adjustment,
		"base_rounding_adjustment": source.base_rounding_adjustment,
		"rounded_total": payable_total, "base_rounded_total": payable_total,
		"outstanding_amount": payable_total,
		"in_words": source.in_words or money_in_words(payable_total, invoice.currency),
		"base_in_words": source.base_in_words or money_in_words(payable_total, invoice.currency),
		"other_charges_calculation": source.other_charges_calculation,
	})
	frappe.db.set_value("Payment Schedule", invoice.payment_schedule[0].name, {
		"payment_amount": payable_total, "base_payment_amount": payable_total,
		"outstanding": payable_total, "base_outstanding": payable_total,
	}, update_modified=False)


def execute(dry_run=False):
	"""Validate all invoices, then update and queue their accounting repost."""
	template, plans = _preflight()
	for invoice, source, _items, amounts, new_total in plans:
		print(f"{invoice.name}: {invoice.grand_total} -> {new_total}, payable {source.rounded_total} (SGST {amounts['sgst']}, CGST {amounts['cgst']})")
	if dry_run:
		print(f"Preflight passed for {len(plans)} invoices; one accounting repost will be queued. No changes made.")
		return
	for invoice, source, item_values, amounts, new_total in plans:
		_apply_one(template, invoice, source, item_values, amounts, new_total)
	repost = frappe.new_doc("Repost Accounting Ledger")
	repost.company = template.company
	repost.delete_cancelled_entries = 0
	for invoice, *_ in plans:
		repost.append("vouchers", {
			"voucher_type": "Purchase Invoice",
			"voucher_no": invoice.name,
		})
	repost.insert()
	repost.submit()
	print(f"Updated {len(plans)} purchase invoices; Repost Accounting Ledger {repost.name} will queue after the migration commits.")
