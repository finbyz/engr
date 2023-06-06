# -*- coding: utf-8 -*-
# Copyright (c) 2021, Finbyz Tech. Pvt. Ltd. and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
from frappe import _
from frappe.utils import flt,cint, get_url_to_form, getdate, nowdate, today
from frappe.contacts.doctype.address.address import get_company_address
from erpnext.accounts.utils import get_fiscal_year, getdate
import datetime
from email.utils import formataddr
from frappe.desk.notifications import get_filters_for
from frappe.model.mapper import get_mapped_doc
from erpnext.assets.doctype.asset.depreciation import get_depreciation_accounts,get_credit_and_debit_accounts
from erpnext.accounts.doctype.accounting_dimension.accounting_dimension import (
	get_checks_for_pl_and_bs_accounts,
)

def validate_sales_person(self):
	if self.sales_team:
		self.sales_person=self.sales_team[0].sales_person

def get_inter_company_details(doc, doctype):
	party = None
	company = None

	if doctype in ["Sales Invoice", "Delivery Note", "Sales Order"]:
		party = frappe.db.get_value("Supplier", {"disabled": 0, "is_internal_supplier": 1, "represents_company": doc.company}, "name")
		company = frappe.get_cached_value("Customer", doc.customer, "represents_company")
	elif doctype in ["Purchase Order", "Purchase Receipt", "Purchase Invoice"]:
		party = frappe.db.get_value("Customer", {"disabled": 0, "is_internal_customer": 1, "represents_company": doc.company}, "name")
		company = frappe.get_cached_value("Supplier", doc.supplier, "represents_company")

	return {
		"party": party,
		"company": company
	}

def validate_inter_company_transaction(doc, doctype):
	# price_list = None
	details = get_inter_company_details(doc, doctype)

	# if doctype in ["Sales Invoice", "Delivery Note", "Sales Order"]:
	# 	price_list = doc.selling_price_list
	# elif doctype in ["Purchase Order", "Purchase Receipt", "Purchase Invoice"]:
	# 	price_list = doc.buying_price_list
	
	# if price_list:
	# 	valid_price_list = frappe.db.get_value("Price List", {"name": price_list, "buying": 1, "selling": 1})
	# else:
	# 	frappe.throw(_("Selected Price List should have buying and selling fields checked."))
	
	# if not valid_price_list:
	# 	frappe.throw(_("Selected Price List should have buying and selling fields checked."))
	
	party = details.get("party")
	if not party:
		partytype = "Supplier" if doctype in ["Sales Invoice", "Delivery Note", "Sales Order"] else "Customer"
		frappe.throw(_("No {0} found for Inter Company Transactions.").format(partytype))
	
	company = details.get("company")
	if company:
		default_currency = frappe.get_cached_value('Company', company, "default_currency")
		if default_currency != doc.currency:
			frappe.throw(_("Company currencies of both the companies should match for Inter Company Transactions."))
	else:
		frappe.throw(_("Company currencies of both the companies should match for Inter Company Transactions."))
	
	return


@frappe.whitelist()
def sales_invoice_payment_remainder():
	if cint(frappe.db.get_value("Accounts Settings",None,"auto_send_payment_reminder_mails")):
		# mail on every sunday
		if getdate().weekday() == 6:
			frappe.enqueue(send_sales_invoice_mails, queue='long', timeout=8000, job_name='Payment Reminder Mails')
			return "Payment Reminder Mails Send"

@frappe.whitelist()
def send_sales_invoice_mails():
	from frappe.utils import fmt_money

	def header(customer):
		return """<strong>""" + customer + """</strong><br><br>Dear Sir,<br><br>
		Kind attention account department.<br>
		We wish to invite your kind immediate attention to our following bill/s which have remained unpaid till date and are overdue for payment.<br>
		<div align="center">
			<table border="1" cellspacing="0" cellpadding="0" width="100%">
				<thead>
					<tr>
						<th width="16%" valign="top">Bill No</th>
						<th width="12%" valign="top">Bill Date</th>
						<th width="21%" valign="top">Order No</th>
						<th width="15%" valign="top">Order Date</th>
						<th width="16%" valign="top">Actual Amt</th>
						<th width="18%" valign="top">Rem. Amt</th>
					</tr></thead><tbody>"""
				
	def table_content(name, posting_date, po_no, po_date, rounded_total, outstanding_amount):
		posting_date = posting_date.strftime("%d-%m-%Y") if bool(posting_date) else '-'
		po_date = po_date.strftime("%d-%m-%Y") if bool(po_date) else '-'

		rounded_total = fmt_money(rounded_total, 2, 'INR')
		outstanding_amount = fmt_money(outstanding_amount, 2, 'INR')

		return """<tr>
				<td width="16%" valign="top"> {0} </td>
				<td width="12%" valign="top"> {1} </td>
				<td width="21%" valign="top"> {2} </td>
				<td width="15%" valign="top"> {3} </td>
				<td width="16%" valign="top" align="right"> {4} </td>
				<td width="18%" valign="top" align="right"> {5} </td>
			</tr>""".format(name, posting_date, po_no or '-', po_date, rounded_total, outstanding_amount)

	def footer(actual_amount, outstanding_amount):
		actual_amt = fmt_money(sum(actual_amount), 2, 'INR')
		outstanding_amt = fmt_money(sum(outstanding_amount), 2, 'INR')
		return """<tr>
					<td width="68%" colspan="4" valign="top" align="right">
						<strong>Net Receivable &nbsp; </strong>
					</td>
					<td align="right" width="13%" valign="top">
						<strong> {} </strong>
					</td>
					<td align="right" width="18%" valign="top">
						<strong> {} </strong>
					</td>
				</tr></tbody></table></div><br>
				We request you to look into the matter and release the payment/s without Further delay. <br><br>
				If you need any clarifications for any of above invoice/s, please reach out to our Accounts Receivable Team by sending email to accounts@innotech.co.in.<br><br>
				We will appreciate your immediate response in this regard.<br><br>
				
				Thanking you in anticipation.<br><br>For, INNOVATIVE TECHNOLOGIES.
				""".format(actual_amt, outstanding_amt)

	non_customers = ()
	data = frappe.get_list("Sales Invoice", filters={
			'status': ['in', ('Overdue')],
			'outstanding_amount':(">", 5000),
			'currency': 'INR',
			'docstatus': 1,
			'customer': ['not in', non_customers],},
			order_by='posting_date',
			fields=["name", "customer", "posting_date", "po_no", "po_date", "rounded_total", "outstanding_amount", "contact_email", "naming_series"])

	def get_customers():
		customers_list = list(set([d.customer for d in data if d.customer]))
		customers_list.sort()

		for customer in customers_list:
			yield customer

	def get_customer_si(customer):
		for d in data:
			if d.customer == customer:
				yield d

	customers = get_customers()

	sender = formataddr(("Innovative Technologies", "accounts@innotech.co.in"))
	for customer in customers:
		attachments, outstanding, actual_amount, recipients = [], [], [], []
		table = ''

		# customer_si = [d for d in data if d.customer == customer]
		customer_si = get_customer_si(customer)

		for si in customer_si:
			name = "Previous Year Outstanding"
			if si.naming_series != "OSINV-":
				name = si.name
				try:
					attachments.append(frappe.attach_print('Sales Invoice', si.name, print_format="Sales Invoice", print_letterhead=True))
				except:
					pass

			table += table_content(name, si.posting_date, si.po_no, si.po_date,
						si.rounded_total, si.outstanding_amount)

			outstanding.append(si.outstanding_amount)
			actual_amount.append(si.rounded_total or 0.0)

			if bool(si.contact_email) and si.contact_email not in recipients:
				recipients.append(si.contact_email)


		message = header(customer) + '' + table + '' + footer(actual_amount, outstanding)
		# recipients = "anandp@innotech.co.in"
		try:
			frappe.sendmail(
				recipients=recipients,
				# cc = 'accounts@innotech.co.in',
				subject = 'Overdue Invoices: ' + customer,
				sender = sender,
				message = message,
				attachments = attachments
			)
		except:
			frappe.log_error("Mail Sending Issue", frappe.get_traceback())
			continue




def get_data():
	return {
		'fieldname': 'prevdoc_docname',
		'non_standard_fieldnames': {
			'Auto Repeat': 'reference_document',
			'Work Order Master':'quotation_no'
		},
		'transactions': [
			{
				'label': _('Sales Order'),
				'items': ['Sales Order']
			},
			{
				'label': _('Subscription'),
				'items': ['Auto Repeat']
			},
			{
				'label': _('WOM'),
				'items': ['Work Order Master']
			},
		]
	}

def before_naming(self,method):
	self.name = self.bank_account + "-" + self.from_date + "-" + self.to_date
	if self.bank:
		mapper_name = self.bank + "-Statement-Settings"
		if not frappe.db.exists("Bank Statement Settings", mapper_name):
			self.create_settings(self.bank)
		self.bank_settings = mapper_name

def set_wom_status():
	from datetime import datetime
	now = datetime.now()
	if str(now) > "07:00:00" and str(now) < "22:00:00":
		doc_list = frappe.db.sql(""" SELECT name , status , work_order_master_ref From `tabSales Invoice` Where docstatus = 1 Order by modified desc LIMIT 50 """ , as_dict = 1)
		for row in doc_list:
			if row.get('status') in ["Paid" , "Partly Paid"]:
				frappe.db.set_value("Work Order Master" , row.get("work_order_master_ref") , "payment_status" , row.get('status') , update_modified=False)
			if row.get('status') in ["Overdue" , "Unpaid"]:
				frappe.db.set_value("Work Order Master" , row.get("work_order_master_ref") , "payment_status" , "Unpaid" , update_modified=False)
	set_wom_status_from_pro()
	import datetime
	current_datetime = datetime.datetime.now()
	new_datetime = current_datetime - datetime.timedelta(minutes=5)
	frappe.db.delete("Scheduled Job Log" , {"creation":["<",str(new_datetime)] , 'scheduled_job_type':"api.set_wom_status"})
	
def set_wom_status_from_pro():
	doc_list = frappe.db.sql(""" SELECT name , status , work_order_master_ref From `tabProforma Invoice` Where docstatus = 1 Order by modified desc LIMIT 2000 """ , as_dict = 1)
	for row in doc_list:
		if row.get('status') == "Paid":
			frappe.db.set_value("Work Order Master" , row.get("work_order_master_ref") , "payment_status" , "Paid" , update_modified=False)
		if row.get('status') == "Partially Paid":
			frappe.db.set_value("Work Order Master" , row.get("work_order_master_ref") , "payment_status" , "Partly Paid" , update_modified=False)
		if row.get('status') in ["Overdue" , "Unpaid"]:
			frappe.db.set_value("Work Order Master" , row.get("work_order_master_ref") , "payment_status" , "Unpaid" , update_modified=False)

def delete_schedule_job_log():
	import datetime
	tod = datetime.datetime.now()
	d = datetime.timedelta(days = 2)
	a = tod -d
	frappe.db.delete("Scheduled Job Log" , {"creation":["<",str(a)]})

def remove_cancel_referance():
	doc_list = frappe.db.get_list("Sales Invoice" ,{'docstatus' : 2})
	for row in doc_list:
		doc = frappe.get_doc("Sales Invoice" , row.get('name'))
		if doc.work_order_master_ref:
			if frappe.db.get_value("Work Order Master", doc.work_order_master_ref , 'tax_invoice_no') == doc.name:
				frappe.db.set_value("Work Order Master" , doc.work_order_master_ref , 'tax_invoice_no' , None , update_modified = False)




@frappe.whitelist()
def make_depreciation_entry(asset_name, date=None):
	frappe.has_permission("Journal Entry", throw=True)

	if not date:
		date = today()

	asset = frappe.get_doc("Asset", asset_name)
	(
		fixed_asset_account,
		accumulated_depreciation_account,
		depreciation_expense_account,
	) = get_depreciation_accounts(asset)

	depreciation_cost_center, depreciation_series = frappe.get_cached_value(
		"Company", asset.company, ["depreciation_cost_center", "series_for_depreciation_entry"]
	)

	depreciation_cost_center = asset.cost_center or depreciation_cost_center

	accounting_dimensions = get_checks_for_pl_and_bs_accounts()

	for d in asset.get("schedules"):
		if not d.journal_entry and getdate(d.schedule_date) <= getdate(date):
			je = frappe.new_doc("Journal Entry")
			je.voucher_type = "Depreciation Entry"
			je.naming_series = depreciation_series
			je.posting_date = d.schedule_date
			je.company = asset.company
			je.finance_book = d.finance_book
			je.branch = asset.get("branch")
			je.remark = "Depreciation Entry against {0} worth {1}".format(asset_name, d.depreciation_amount)

			credit_account, debit_account = get_credit_and_debit_accounts(
				accumulated_depreciation_account, depreciation_expense_account
			)

			credit_entry = {
				"account": credit_account,
				"credit_in_account_currency": d.depreciation_amount,
				"reference_type": "Asset",
				"reference_name": asset.name,
				"cost_center": depreciation_cost_center,
			}

			debit_entry = {
				"account": debit_account,
				"debit_in_account_currency": d.depreciation_amount,
				"reference_type": "Asset",
				"reference_name": asset.name,
				"cost_center": depreciation_cost_center,
			}

			for dimension in accounting_dimensions:
				if asset.get(dimension["fieldname"]) or dimension.get("mandatory_for_bs"):
					credit_entry.update(
						{
							dimension["fieldname"]: asset.get(dimension["fieldname"])
							or dimension.get("default_dimension")
						}
					)

				if asset.get(dimension["fieldname"]) or dimension.get("mandatory_for_pl"):
					debit_entry.update(
						{
							dimension["fieldname"]: asset.get(dimension["fieldname"])
							or dimension.get("default_dimension")
						}
					)

			je.append("accounts", credit_entry)

			je.append("accounts", debit_entry)

			je.flags.ignore_permissions = True
			je.flags.planned_depr_entry = True
			je.save()
			if not je.meta.get_workflow():
				je.submit()

			d.db_set("journal_entry", je.name)

			idx = cint(d.finance_book_id)
			finance_books = asset.get("finance_books")[idx - 1]
			finance_books.value_after_depreciation -= d.depreciation_amount
			finance_books.db_update()

	asset.db_set("depr_entry_posting_status", "Successful")

	asset.set_status()

	return asset