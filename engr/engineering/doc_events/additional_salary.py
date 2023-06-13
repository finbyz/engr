import frappe
from frappe import _, bold




def on_validate(self,method):
    site_allow = frappe.db.get_value("Employee",self.employee,"site_allowances")
    if self.present_days_at_site:
        amount = (site_allow*self.present_days_at_site)
        self.amount = amount
   