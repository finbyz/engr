import frappe, json
from frappe.utils import flt, cint
from six import string_types
from frappe.model.mapper import get_mapped_doc
from erpnext.buying.doctype.purchase_order.purchase_order import set_missing_values

def before_validate(self, method):
    set_conversion_fact(self)

def set_conversion_fact(self):
	for row in self.items:
		if row.stock_uom == row.uom:
			row.reverse_conversion_factor = row.conversion_factor = 1
			row.stock_qty = row.qty
		else:
			if row.qty and row.stock_qty:
				frappe.db.set_value("Purchase Receipt Item", row.name, "stock_qty", round(row.stock_qty / row.qty, 0))


@frappe.whitelist()
def make_purchase_receipt_from_order(source_name, target_doc=None, args=None):
	
	if args is None:
		args = {}
	if isinstance(args, string_types):
		args = json.loads(args)
	
	def update_item(obj, target, source_parent):
		target.qty = flt(obj.qty) - flt(obj.received_qty)
		target.stock_qty = (flt(obj.qty) - flt(obj.received_qty)) * flt(obj.conversion_factor)
		target.amount = (flt(obj.qty) - flt(obj.received_qty)) * flt(obj.rate)
		target.base_amount = (
			(flt(obj.qty) - flt(obj.received_qty)) * flt(obj.rate) * flt(source_parent.conversion_rate)
		)

	def select_item(doc):
		filtered_items = args.get("filtered_children", [])
		child_filter = doc.name in filtered_items if filtered_items else True

		return abs(doc.received_qty) < abs(doc.qty) and doc.delivered_by_supplier != 1 and child_filter

	doc = get_mapped_doc(
		"Purchase Order",
		source_name,
		{
			"Purchase Order": {
				"doctype": "Purchase Receipt",
				"field_map": {"supplier_warehouse": "supplier_warehouse"},
				"validation": {
					"docstatus": ["=", 1],
				},
			},
			"Purchase Order Item": {
				"doctype": "Purchase Receipt Item",
				"field_map": {
					"name": "purchase_order_item",
					"parent": "purchase_order",
					"bom": "bom",
					"material_request": "material_request",
					"material_request_item": "material_request_item",
				},
				"postprocess": update_item,
				"condition": select_item,
			},
			"Purchase Taxes and Charges": {"doctype": "Purchase Taxes and Charges", "add_if_empty": True},
		},
		target_doc,
		set_missing_values,
	)

	doc.set_onload("ignore_price_list", True)

	return doc

@frappe.whitelist()
def make_purchase_receipt_from_invoice(source_name, target_doc=None, args=None):

	if args is None:
		args = {}
	if isinstance(args, string_types):
		args = json.loads(args)

	def update_item(obj, target, source_parent):
		target.qty = flt(obj.qty) - flt(obj.received_qty)
		target.received_qty = flt(obj.qty) - flt(obj.received_qty)
		target.stock_qty = (flt(obj.qty) - flt(obj.received_qty)) * flt(obj.conversion_factor)
		target.amount = (flt(obj.qty) - flt(obj.received_qty)) * flt(obj.rate)
		target.base_amount = (
			(flt(obj.qty) - flt(obj.received_qty)) * flt(obj.rate) * flt(source_parent.conversion_rate)
		)

	def select_item(doc):
		filtered_items = args.get("filtered_children", [])
		child_filter = doc.name in filtered_items if filtered_items else True

		return abs(doc.received_qty) < abs(doc.qty) and child_filter

	doc = get_mapped_doc(
		"Purchase Invoice",
		source_name,
		{
			"Purchase Invoice": {
				"doctype": "Purchase Receipt",
				"validation": {
					"docstatus": ["=", 1],
				},
			},
			"Purchase Invoice Item": {
				"doctype": "Purchase Receipt Item",
				"field_map": {
					"name": "purchase_invoice_item",
					"parent": "purchase_invoice",
					"bom": "bom",
					"purchase_order": "purchase_order",
					"po_detail": "purchase_order_item",
					"material_request": "material_request",
					"material_request_item": "material_request_item",
				},
				"postprocess": update_item,
				"condition": select_item
			},
			"Purchase Taxes and Charges": {"doctype": "Purchase Taxes and Charges"},
		},
		target_doc,
	)

	return doc
