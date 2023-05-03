import frappe
def update_job_id():
    doc_list = frappe.db.get_list("Work Order Master" , pluck="name")
    for row in doc_list:
        doc = frappe.get_doc("Work Order Master" , row)
        if doc.branch_name:
            job_id = str(doc.job_id)+"-"+str(doc.branch_name)
            print(job_id)
            frappe.db.set_value("Work Order Master" , row , 'job_id' , job_id , update_modified = False)

    frappe.db.sql(""" Update `tabWork Order Master Item` as woi left join `tabWork Order Master` as wom ON wom.name = woi.parent set woi.job_id = wom.job_id """)
