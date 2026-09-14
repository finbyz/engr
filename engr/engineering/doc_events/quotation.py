import frappe

from erpnext.selling.doctype.quotation.quotation import _make_customer
from frappe.model.mapper import get_mapped_doc
from frappe.query_builder.functions import Sum
from frappe.utils import flt, nowdate


def _make_sales_order(source_name, target_doc=None, ignore_permissions=False, args=None):
	customer = _make_customer(source_name, ignore_permissions)

	# Get already ordered quantities from submitted Sales Orders
	SalesOrderItem = frappe.qb.DocType("Sales Order Item")

	ordered_items_data = (
		frappe.qb.from_(SalesOrderItem)
		.select(
			SalesOrderItem.item_code,
			Sum(SalesOrderItem.qty).as_("qty"),
		)
		.where(
			(SalesOrderItem.prevdoc_docname == source_name)
			& (SalesOrderItem.docstatus == 1)
		)
		.groupby(SalesOrderItem.item_code)
	).run(as_dict=True)

	ordered_items = {
		row.item_code: flt(row.qty)
		for row in ordered_items_data
	}

	selected_rows = [
		x.get("name")
		for x in frappe.flags.get("args", {}).get("selected_items", [])
	]

	def set_missing_values(source, target):
		if customer:
			target.customer = customer.name
			target.customer_name = customer.customer_name

		if source.referral_sales_partner:
			target.sales_partner = source.referral_sales_partner
			target.commission_rate = frappe.get_value(
				"Sales Partner",
				source.referral_sales_partner,
				"commission_rate",
			)

		target.flags.ignore_permissions = ignore_permissions
		target.delivery_date = nowdate()

		target.run_method("set_missing_values")
		target.run_method("calculate_taxes_and_totals")

	def update_item(obj, target, source_parent):
		balance_qty = obj.qty - ordered_items.get(obj.item_code, 0.0)

		target.qty = balance_qty if balance_qty > 0 else 0
		target.stock_qty = flt(target.qty) * flt(obj.conversion_factor)
		target.delivery_date = nowdate()

		if obj.against_blanket_order:
			target.against_blanket_order = obj.against_blanket_order
			target.blanket_order = obj.blanket_order
			target.blanket_order_rate = obj.blanket_order_rate

	def can_map_row(item) -> bool:
		"""
		Row mapping from Quotation to Sales Order:

		1. If no selections, map all non-alternative rows.

		2. If selections exist:
		   - Alternative Item / Has Alternative Item:
		     Map only if selected and adequate quantity exists.

		3. Simple row:
		   Map if adequate quantity exists.
		"""
		has_qty = item.qty > 0

		if not selected_rows:
			return not item.is_alternative

		if item.is_alternative or item.has_alternative_item:
			return (item.name in selected_rows) and has_qty

		return has_qty

	doclist = get_mapped_doc(
		"Quotation",
		source_name,
		{
			"Quotation": {
				"doctype": "Sales Order",
				"validation": {
					"docstatus": ["=", 1],
				},
			},
			"Quotation Item": {
				"doctype": "Sales Order Item",
				"field_map": {
					"parent": "prevdoc_docname",
					"name": "quotation_item",
				},
				"postprocess": update_item,
				"condition": can_map_row,
			},
			"Sales Taxes and Charges": {
				"doctype": "Sales Taxes and Charges",
				"add_if_empty": True,
			},
			"Sales Team": {
				"doctype": "Sales Team",
				"add_if_empty": True,
			},
			"Payment Schedule": {
				"doctype": "Payment Schedule",
				"add_if_empty": True,
			},
		},
		target_doc,
		set_missing_values,
		ignore_permissions=ignore_permissions,
	)

	doclist.set_onload("ignore_price_list", True)

	return doclist