import frappe
from frappe.utils import add_days, cint, cstr, flt, get_link_to_form, getdate, nowdate, strip_html
from frappe import _



def on_cancel(self,method):
    check_nextdoc_docstatus(self,method)


def check_nextdoc_docstatus(self,method):
    submit_rv = frappe.db.sql_list("""select t1.name
        from `tabSales Invoice` t1,`tabSales Invoice Item` t2
        where t1.name = t2.parent and t2.proforma_invoice = %s and t1.docstatus < 2""",
        self.name)

    if submit_rv:
        submit_rv = [get_link_to_form("Sales Invoice", si) for si in submit_rv]
        frappe.throw(_("Sales Invoice {0} must be cancelled before cancelling this Sales Order")
            .format(", ".join(submit_rv)))