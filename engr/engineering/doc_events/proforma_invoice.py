import frappe
from frappe.utils import add_days, cint, cstr, flt, get_link_to_form, getdate, nowdate, strip_html
from frappe import _

def set_taxes_on_payment_percentage(self,method):
    doc = frappe.get_doc('GST Settings')
    account_list = []
    for row in doc.get('gst_accounts'):
        account_list.append(row.get('cgst_account'))
        account_list.append(row.get('sgst_account'))
        account_list.append(row.get('igst_account'))
    self.sgst = None
    self.cgst = None
    self.igst = None
   
    for row in self.taxes:
        if row.account_head in account_list:
            if "SGST" in str(row.account_head) or "sgst" in str(row.account_head):
                payment_percent = (self.total * self.payment_percentage)/100
                sgst_percent = (payment_percent * row.rate)/100
                self.sgst = sgst_percent 
            if "CGST" in str(row.account_head) or "cgst" in str(row.account_head):
                payment_percent = (self.total * self.payment_percentage)/100
                cgst_percent = (payment_percent * row.rate)/100
                self.cgst = cgst_percent
            if "IGST" in str(row.account_head) or "igst" in str(row.account_head):
                payment_percent = (self.total * self.payment_percentage)/100
                igst_percent = (payment_percent * row.rate)/100
                self.igst = igst_percent

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