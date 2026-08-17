import frappe
from erpnext.setup.doctype.sales_person.sales_person import SalesPerson as _SalesPerson
from frappe.utils import flt
from frappe import _

class SalesPerson(_SalesPerson):
	def validate(self):
		if not self.parent_sales_person:
			self.parent_sales_person = get_root_of("Sales Person")

		for d in self.get("targets") or []:
			if not flt(d.target_qty) and not flt(d.target_amount) and not flt(d.target_reach):
				frappe.throw(_("Either target qty or target amount is mandatory."))
		self.validate_employee_id()