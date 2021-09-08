# -*- coding: utf-8 -*-
# Copyright (c) 2021, Finbyz Tech. Pvt. Ltd. and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
from frappe import _,scrub
from frappe.utils import flt,cint ,comma_or, nowdate, getdate
from erpnext.accounts.party import get_party_account
from erpnext.accounts.utils import get_account_currency
from erpnext.accounts.doctype.journal_entry.journal_entry import get_default_bank_cash_account
from erpnext.accounts.doctype.bank_account.bank_account import get_party_bank_account
from engr.engineering.doctype.proforma_invoice.proforma_invoice import set_status

def before_validate(self,method):
	update_performa_reference_si(self)

def update_performa_reference_si(self):
	if self.get('references'):
		for ref in self.references:
			if not ref.get('proforma_invoice') and ref.reference_doctype == "Sales Invoice":
				proforma_invoice = frappe.db.get_value("Sales Invoice Item",{"parent":ref.reference_name,"idx":1,"docstatus":1},"proforma_invoice")
				if proforma_invoice and frappe.db.exists("Proforma Invoice",proforma_invoice) and frappe.db.get_value("Proforma Invoice",proforma_invoice,"docstatus") == 1:
					ref.proforma_invoice = proforma_invoice	

def on_submit(self,method):
	update_proforma_invoice(self,"submit")

def on_cancel(self,method):
	update_proforma_invoice(self,"cancel")

def update_proforma_invoice(self,method):
	if method == "submit":
		if self.get('references'):
			for ref in self.references:
				if ref.get('proforma_invoice'):
					doc = frappe.get_doc("Proforma Invoice",ref.proforma_invoice)

					doc.db_set("advance_paid",doc.advance_paid + ref.allocated_amount)
					if flt(doc.advance_paid) > flt(doc.payment_due_amount) and not doc.allow_over_billing_payment:
						frappe.throw("You cannot Allocate more than Proforma Amount.")
					set_status(doc)

	elif method == "cancel":
		if self.get('references'):
			for ref in self.references:
				if ref.get('proforma_invoice'):
					doc = frappe.get_doc("Proforma Invoice",ref.proforma_invoice)

					doc.db_set("advance_paid",doc.advance_paid - ref.allocated_amount)
					set_status(doc)
	
@frappe.whitelist()
def create_payment_entry(dt, dn, ref_dt, ref_dn):
	party_type = "Customer"
	payment_type = "Receive"

	doc = frappe.get_doc(dt, dn)
	pri_doc = frappe.get_doc(ref_dt,ref_dn)
	
	if flt(doc.per_billed, 2) > 0:
		frappe.throw(_("Can only make payment against unbilled {0}").format(dt))

	party_account = get_party_account(party_type, doc.get(party_type.lower()), doc.company)

	party_account_currency = doc.get("party_account_currency") or get_account_currency(party_account)
	# payment type

	# amounts
	grand_total = outstanding_amount = pri_grand_total = pri_outstanding_amount = 0
	if party_account_currency == doc.company_currency:
		grand_total = flt(doc.get("base_rounded_total") or doc.base_grand_total)
	else:
		grand_total = flt(doc.get("rounded_total") or doc.grand_total)

	outstanding_amount = grand_total - flt(doc.advance_paid)

	bank_account = None
	# bank or cash
	bank = get_default_bank_cash_account(doc.company, "Bank", mode_of_payment=doc.get("mode_of_payment"),
		account=bank_account)

	if not bank:
		bank = get_default_bank_cash_account(doc.company, "Cash", mode_of_payment=doc.get("mode_of_payment"),
			account=bank_account)

	paid_amount = received_amount = 0
	if party_account_currency == bank.account_currency:
		paid_amount = received_amount = abs(outstanding_amount)
	elif payment_type == "Receive":
		paid_amount = abs(outstanding_amount)
		received_amount = paid_amount * doc.conversion_rate

	# Proforma Invoice
	pri_paid_amount = pri_received_amount = 0
	if party_account_currency == bank.account_currency:
		pri_paid_amount = pri_received_amount = abs(pri_doc.payment_due_amount - pri_doc.advance_paid)
	elif payment_type == "Receive":
		pri_paid_amount = abs(pri_doc.payment_due_amount - pri_doc.advance_paid)
		pri_received_amount = pri_paid_amount * pri_doc.conversion_rate

	pe = frappe.new_doc("Payment Entry")
	pe.payment_type = payment_type
	pe.company = doc.company
	pe.cost_center = doc.get("cost_center")
	pe.posting_date = nowdate()
	pe.mode_of_payment = doc.get("mode_of_payment")
	pe.party_type = party_type
	pe.party = doc.get(scrub(party_type))
	pe.contact_person = doc.get("contact_person")
	pe.contact_email = doc.get("contact_email")
	pe.ensure_supplier_is_not_blocked()

	pe.paid_from = party_account if payment_type=="Receive" else bank.account
	pe.paid_to = party_account if payment_type=="Pay" else bank.account
	pe.paid_from_account_currency = party_account_currency \
		if payment_type=="Receive" else bank.account_currency
	pe.paid_to_account_currency = party_account_currency if payment_type=="Pay" else bank.account_currency
	pe.paid_amount = pri_paid_amount
	pe.received_amount = pri_received_amount
	pe.letter_head = doc.get("letter_head")

	if pe.party_type in ["Customer", "Supplier"]:
		bank_account = get_party_bank_account(pe.party_type, pe.party)
		pe.set("bank_account", bank_account)
		pe.set_bank_account_data()


	pe.append("references", {
		'reference_doctype': dt,
		'reference_name': dn,
		"proforma_invoice":ref_dn,
		"bill_no": doc.get("bill_no"),
		"due_date": doc.get("due_date"),
		'total_amount': grand_total,
		'outstanding_amount': outstanding_amount,
		'allocated_amount': pri_paid_amount
	})

	pe.setup_party_account_field()
	pe.set_missing_values()
	if party_account and bank:
		pe.set_exchange_rate()
		pe.set_amounts()
	return pe
