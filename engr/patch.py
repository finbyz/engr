import frappe
def execute():
	remove_cancel_referance()
def remove_cancel_referance():
	doc_list = frappe.db.get_list("Sales Invoice" ,{'docstatus' : 2})
	for row in doc_list:
		doc = frappe.get_doc("Sales Invoice" , row.get('name'))
		if doc.work_order_master_ref:
			if frappe.db.get_value("Work Order Master", doc.work_order_master_ref , 'tax_invoice_no') == doc.name:
				frappe.db.set_value("Work Order Master" , doc.work_order_master_ref , 'tax_invoice_no' , None , update_modified = False)