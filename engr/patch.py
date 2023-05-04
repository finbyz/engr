import frappe
def update_job_id():
    doc_list = frappe.db.get_list("Work Order Master" , pluck="name")
    for row in doc_list:
        doc = frappe.get_doc("Work Order Master" , row)
        if doc.proforma_invoice:
            pro_doc = frappe.db.get_value("Proforma Invoice" , doc.proforma_invoice , 'customer')
            if doc.customer_name == pro_doc:
                frappe.db.set_value("Proforma Invoice" , doc.proforma_invoice , 'wom_ref' , row , update_modified =False)
                frappe.db.set_value("Proforma Invoice" , doc.proforma_invoice , 'work_order_master_ref' , row , update_modified =False)