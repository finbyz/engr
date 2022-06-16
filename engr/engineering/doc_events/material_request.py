import frappe, json
from six import string_types
from frappe import _
from frappe.model.mapper import get_mapped_doc
from frappe.utils import cstr, flt, get_link_to_form, getdate, new_line_sep, nowdate
from erpnext.stock.doctype.item.item import get_item_defaults

@frappe.whitelist()
@frappe.validate_and_sanitize_search_inputs
def get_default_supplier_query(doctype, txt, searchfield, start, page_len, filters):

	doc = frappe.get_doc("Material Request", filters.get("doc"))
	item_list = []
	for d in doc.items:
		item_list.append(d.item_code)

	supplier_data = frappe.db.sql("""select default_supplier
		from `tabItem Default`
		where parent in ({0}) and
		default_supplier IS NOT NULL
		""".format(', '.join(['%s']*len(item_list))),tuple(item_list))
	

	supplier_data += frappe.db.sql("""select supplier
		from `tabItem Supplier`
		where parent in ({0}) and
		supplier IS NOT NULL
		""".format(', '.join(['%s']*len(item_list))),tuple(item_list))
	
	return supplier_data

@frappe.whitelist()
def make_purchase_order(source_name, target_doc=None, args=None):
	if args is None:
		args = {}
	if isinstance(args, string_types):
		args = json.loads(args)

	def postprocess(source, target_doc):
		if frappe.flags.args and frappe.flags.args.default_supplier:
			# items only for given default supplier
			supplier_items = []
			target_doc.supplier = frappe.flags.args.default_supplier
			for d in target_doc.items:
				supplier_list = [get_item_defaults(d.item_code, target_doc.company).get('default_supplier')]
				supplier_list += frappe.db.get_all("Item Supplier", {"parent":d.item_code}, pluck="supplier") or []
				supplier_list = list(set([x for x in supplier_list if x]))
				if frappe.flags.args.default_supplier in supplier_list:
					supplier_items.append(d)
			target_doc.items = supplier_items

		set_missing_values(source, target_doc)

	def select_item(d):
		filtered_items = args.get('filtered_children', [])
		child_filter = d.name in filtered_items if filtered_items else True

		return d.ordered_qty < d.stock_qty and child_filter

	doclist = get_mapped_doc("Material Request", source_name, {
		"Material Request": {
			"doctype": "Purchase Order",
			"validation": {
				"docstatus": ["=", 1],
				"material_request_type": ["=", "Purchase"]
			}
		},
		"Material Request Item": {
			"doctype": "Purchase Order Item",
			"field_map": [
				["name", "material_request_item"],
				["parent", "material_request"],
				["uom", "stock_uom"],
				["uom", "uom"],
				["sales_order", "sales_order"],
				["sales_order_item", "sales_order_item"]
			],
			"postprocess": update_item,
			"condition": select_item
		}
	}, target_doc, postprocess)

	return doclist

def set_missing_values(source, target_doc):
	if target_doc.doctype == "Purchase Order" and getdate(target_doc.schedule_date) <  getdate(nowdate()):
		target_doc.schedule_date = None
	target_doc.run_method("set_missing_values")
	target_doc.run_method("calculate_taxes_and_totals")

def update_item(obj, target, source_parent):
	target.conversion_factor = obj.conversion_factor
	target.qty = flt(flt(obj.stock_qty) - flt(obj.ordered_qty))/ target.conversion_factor
	target.stock_qty = (target.qty * target.conversion_factor)
	if getdate(target.schedule_date) < getdate(nowdate()):
		target.schedule_date = None
	
def before_validate(self, method):
	set_conversion_factor(self)

def set_conversion_factor(self):
	for row in self.items:
		if row.stock_uom == row.uom:
			row.reverse_conversion_factor = row.conversion_factor = 1
			row.stock_qty = row.qty