import frappe

def before_submit(self,method):
    data = frappe.get_doc("Work Order" , self.work_order)
    for i in data.required_items:
        if i.transferred_qty < i.required_qty: 
            frappe.throw("In Work Order ({}), Transferred Qty({}) can not be less then Required Qty ({}) to complete Production".format(frappe.bold(self.work_order) ,frappe.bold(i.transferred_qty) , frappe.bold(i.required_qty)))
