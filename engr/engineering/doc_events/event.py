import frappe
def on_submit(self,method):
    frappe.db.set_value("Work Order Master Item", self.wom_row_ref ,'blank_format',self.blank_format)