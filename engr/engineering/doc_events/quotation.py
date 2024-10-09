import frappe
from erpnext.selling.doctype.quotation.quotation import _make_customer
from frappe.model.mapper import get_mapped_doc
from frappe.utils import flt, getdate, nowdate

def _make_sales_order(source_name, target_doc=None, ignore_permissions=False):
	customer = _make_customer(source_name, ignore_permissions)
	ordered_items = frappe._dict(
		frappe.db.get_all(
			"Sales Order Item",
			{"prevdoc_docname": source_name, "docstatus": 1},
			["item_code", "sum(qty)"],
			group_by="item_code",
			as_list=1,
		)
	)

	selected_rows = [x.get("name") for x in frappe.flags.get("args", {}).get("selected_items", [])]

	def set_missing_values(source, target):
		if customer:
			target.customer = customer.name
			target.customer_name = customer.customer_name
		if source.referral_sales_partner:
			target.sales_partner = source.referral_sales_partner
			target.commission_rate = frappe.get_value(
				"Sales Partner", source.referral_sales_partner, "commission_rate"
			)

		# sales team
		# for d in customer.get("sales_team") or []:
		# 	target.append(
		# 		"sales_team",
		# 		{
		# 			"sales_person": d.sales_person,
		# 			"allocated_percentage": d.allocated_percentage or None,
		# 			"commission_rate": d.commission_rate,
		# 		},
		# 	)

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
		Row mapping from Quotation to Sales order:
		1. If no selections, map all non-alternative rows (that sum up to the grand total)
		2. If selections: Is Alternative Item/Has Alternative Item: Map if selected and adequate qty
		3. If selections: Simple row: Map if adequate qty
		"""
		has_qty = item.qty > 0

		if not selected_rows:
			return not item.is_alternative

		if selected_rows and (item.is_alternative or item.has_alternative_item):
			return (item.name in selected_rows) and has_qty

		# Simple row
		return has_qty

	doclist = get_mapped_doc(
		"Quotation",
		source_name,
		{
			"Quotation": {"doctype": "Sales Order", "validation": {"docstatus": ["=", 1]}},
			"Quotation Item": {
				"doctype": "Sales Order Item",
				"field_map": {"parent": "prevdoc_docname", "name": "quotation_item"},
				"postprocess": update_item,
				"condition": can_map_row,
			},
			"Sales Taxes and Charges": {"doctype": "Sales Taxes and Charges", "add_if_empty": True},
			"Sales Team": {"doctype": "Sales Team", "add_if_empty": True},
			"Payment Schedule": {"doctype": "Payment Schedule", "add_if_empty": True},
		},
		target_doc,
		set_missing_values,
		ignore_permissions=ignore_permissions,
	)

	# postprocess: fetch shipping address, set missing values
	doclist.set_onload("ignore_price_list", True)

	return doclist
