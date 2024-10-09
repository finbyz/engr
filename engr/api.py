# -*- coding: utf-8 -*-
# Copyright (c) 2021, Finbyz Tech. Pvt. Ltd. and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
from frappe import _
from frappe.utils import flt,cint, get_url_to_form, nowdate
from frappe.contacts.doctype.address.address import get_company_address
from erpnext.accounts.utils import get_fiscal_year, getdate
import datetime
from email.utils import formataddr
from frappe.desk.notifications import get_filters_for
from frappe.model.mapper import get_mapped_doc
from frappe.utils import (
    add_days,
    cint,
    cstr,
    formatdate,
    get_datetime,
    get_link_to_form,
    getdate,
    nowdate,
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
            frappe.enqueue(send_sales_invoice_mails, queue='long', timeout=5000, job_name='Payment Reminder Mails')
            # frappe.enqueue(send_proforma_invoice_mails, queue='long', timeout=5000, job_name='Payment Reminder Mails')
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
            print(recipients)

        message = header(customer) + '' + table + '' + footer(actual_amount, outstanding)
        # recipients = "anandp@innotech.co.in"
        try:
            frappe.sendmail(
                recipients=recipients,
                cc = '',
                subject = 'Overdue Invoices: ' + customer,
                sender = 'accounts@innotech.co.in',
                message = message,
                attachments = attachments
            )
        except:
            frappe.log_error("Mail Sending Issue", frappe.get_traceback())
            continue

@frappe.whitelist()
def proforma_invoice_payment_remainder():
    # mail on every sunday
    if cint(frappe.db.get_value("Accounts Settings",None,"auto_send_payment_reminder_mails")):
        if getdate().weekday() == 6:
            frappe.enqueue(send_proforma_invoice_mails, queue='long', timeout=5000, job_name='Payment Reminder Mails')
            return "Payment Reminder Mails Send"

@frappe.whitelist()
def send_proforma_invoice_mails():
    from frappe.utils import fmt_money

    # def show_progress(status, customer, invoice):
    # 	frappe.publish_realtime(event="cities_progress", message={'status': status, 'customer': customer, 'invoice': invoice}, user=frappe.session.user)

    def header(customer):
        return """<strong>""" + customer + """</strong><br><br>Dear Sir,<br><br>
        
        We wish to invite your kind immediate attention to our following Proforma Invoices which are unpaid till date and are overdue for payment.<br>
        <div align="center">
            <table border="1" cellspacing="0" cellpadding="0" width="100%">
                <thead>
                    <tr>
                        <th width="20%" valign="top">Proforma No</th>
                        <th width="20%" valign="top">Proforma Date</th>
                        <th width="20%" valign="top">Net Total</th>
                        <th width="20%" valign="top">Total Amount</th>
                        <th width="20%" valign="top">Outstanding Amount</th>
                    </tr></thead><tbody>"""

    def table_content(name, transaction_date, net_total, rounded_total, outstanding_amount):
        transaction_date = transaction_date.strftime("%d-%m-%Y") if bool(transaction_date) else '-'
        
        rounded_total = fmt_money(rounded_total, 2, 'INR')
        net_total = fmt_money(net_total, 2, 'INR')
        outstanding_amount = fmt_money(outstanding_amount, 2, 'INR')

        return """<tr>
                <td width="20%" valign="top" align="center"> {0} </td>
                <td width="20%" valign="top" align="center"> {1} </td>
                <td width="20%" valign="top" align="right"> {2} </td>
                <td width="20%" valign="top" align="right"> {3} </td>
                <td width="20%" valign="top" align="right"> {4} </td>
            </tr>""".format(name, transaction_date, net_total, rounded_total, outstanding_amount)
    
    def footer(net_amount,actual_amount, outstanding_amount):
        net_amt = fmt_money(sum(net_amount), 2, 'INR')
        actual_amt = fmt_money(sum(actual_amount), 2, 'INR')
        outstanding_amt = fmt_money(sum(outstanding_amount), 2, 'INR')
        return """<tr>
                    <td width="40%" colspan="2" valign="top" align="right">
                        <strong>Net Receivable &nbsp; </strong>
                    </td>
                    <td align="right" width="20%" valign="top">
                        <strong> {} </strong>
                    </td>
                    <td align="right" width="20%" valign="top">
                        <strong> {} </strong>
                    </td>
                    <td align="right" width="20%" valign="top">
                        <strong> {} </strong>
                    </td>
                </tr></tbody></table></div><br>
                Request you to release the payment at earliest. <br><br>
                If you need any clarifications for any of above proforma invoice, please reach out to our Accounts Team by sending email to accounts@innotech.co.in <br><br>
                We will appreciate your immediate response in this regard.<br><br>
                If payment already made from your end, kindly provide details of the payment/s made to enable us to reconcile and credit your account.<br><br>
                Kindly Regards,<br>
                Atul Pawar <br><br>
                Innovative Technologies and P. K. Sales Automations Pvt. Ltd.<br>(formerly​known as P. K. Sales Corporation)
                
                <div>
                <table cellpadding="4px" cellspacing="0" style="background: none; margin: 0; padding: 0px;">
                    <tbody><tr>
                        <td style="padding-top: 0; padding-bottom: 0; padding-left: 12px; padding-right: 0;">
                            <table border="0" cellpadding="4px" cellspacing="0" style="background: none; border-width: 0px; border: 0px; margin: 0; padding: 1px;">
                                <tbody><tr>
                                    <td colspan="2" style="padding-bottom: 2px; color: #a0ce4e; font-size: 18px; font-family: Arial, Helvetica, sans-serif;">Accounts Team</td>
                                </tr>
                                <tr>
                                    <td colspan="2" style="padding-bottom: 0px; color: #333333; font-size: 14px; font-family: Arial, Helvetica, sans-serif;"><strong>Innovative Technologies and P. K. Sales Automations Pvt. Ltd. (formerly ​known as P. K. Sales Corporation)</strong></td>
                                </tr>
                                <tr>
                                    <td style="padding-bottom: 0px; vertical-align: top; width: 20px; color: #a0ce4e; font-size: 14px; font-family: Arial, Helvetica, sans-serif;" valign="top" width="20">M:</td>
                                    <td style="padding-bottom: 0px; color: #333333; font-size: 14px; font-family: Arial, Helvetica, sans-serif;">9987024735</td>
                                </tr>
                                <tr>
                                    <td style="padding-bottom: 0px; vertical-align: top; width: 20px; color: #a0ce4e; font-size: 14px; font-family: Arial, Helvetica, sans-serif;" valign="top" width="20">E:</td>
                                    <td style="padding-bottom: 0px; color: #333333; font-size: 14px; font-family: Arial, Helvetica, sans-serif;">atulp@innotech.co.in</td>
                                </tr>
                            </tbody></table>
                        </td>
                    </tr>
                </tbody></table>
                <p></p>
                
                """.format(net_amt,actual_amt, outstanding_amt)

    non_customers = ()

    data = frappe.get_list("Proforma Invoice", filters={
            'status': ['in', ('Unpaid','Partially Paid')],
            'delivery_date': ("<", nowdate()),
            'currency': 'INR',
            # 'docstatus': 1,
            # 'dont_send_payment_reminder': 0,
            'customer': ['not in', non_customers]
            },
            order_by='transaction_date',
            fields=["name", "customer", "transaction_date","net_total", "rounded_total", "advance_paid", "contact_email", "naming_series","owner"])

    def get_customers():
        customers_list = list(set([d.customer for d in data if d.customer]))
        customers_list.sort()

        for customer in customers_list:
            yield customer

    def get_customer_pi(customer):
        for d in data:
            if d.customer == customer:
                yield d

    cnt = 0
    customers = get_customers()

    sender = formataddr(("Innovative Technologies", "accounts@innotech.co.in"))
    for customer in customers:
        print(customer)
        attachments, outstanding, actual_amount, net_amount,recipients = [], [], [], [], []
        table = ''

        # customer_si = [d for d in data if d.customer == customer]
        customer_pi = get_customer_pi(customer)

        for pi in customer_pi:
            # show_progress('In Progress', customer, si.name)
            name = "Previous Year Outstanding"
            if pi.naming_series != "OPINV-":
                name = pi.name
                try:
                    attachments.append({
                        "print_format_attachment": 1,
                        "doctype": "Proforma Invoice",
                        "name": pi.name,
                        "print_format": 'Proforma Invoice',
                        "print_letterhead": 1,
                        "lang": 'en'
                    })
                except:
                    pass

            table += table_content(name, pi.transaction_date, pi.net_total,
                        pi.rounded_total, (pi.rounded_total-pi.advance_paid))

            outstanding.append((pi.rounded_total-pi.advance_paid))
            actual_amount.append(pi.rounded_total or 0.0)
            net_amount.append(pi.net_total or 0.0)

            if bool(pi.contact_email) and pi.contact_email not in recipients:
                recipients.append(pi.contact_email)
                # owner = pi.owner if pi.owner != "Administrator" else None
                # if owner:
                # 	cc = cc + ', ' + owner
        
            # other_contact_list = []
            # other_contact_dict = frappe.db.sql("select oc.email_id from `tabOther Contact` as oc JOIN `tabProforma Invoice` as pi ON pi.name = oc.parent where pi.name = '{}'".format(pi.name),as_dict=True)
            # if other_contact_dict:
            # 	for email in other_contact_dict:
            # 		other_contact_list.append(email.email_id)
            # recipients = recipients + other_contact_list
        # recipients = list(set(recipients))
        message = header(customer) + '' + table + '' + footer(net_amount, actual_amount, outstanding)
        # recipients = ['kushal.chokshi@finbyz.tech']
        try:
            frappe.sendmail(
                recipients=recipients,
                cc = '',
                subject = 'Overdue Invoices: ' + customer,
                sender = 'accounts@innotech.co.in',
                message = message,
                attachments = attachments
            )
            
            # cnt += 1
            # show_progress('Mail Sent', customer, "All")
        except:
            frappe.log_error("Mail Sending Issue", frappe.get_traceback())
            continue

# @frappe.whitelist()
# def send_proforma_invoice_mails():
# 	from frappe.utils import fmt_money

# 	def header(customer):
# 		return """<strong>""" + customer + """</strong><br><br>Dear Sir,<br><br>
# 		Kind attention account department.<br>
# 		We wish to invite your kind immediate attention to our following bill/s which have remained unpaid till date and are overdue for payment.<br>
# 		<div align="center">
# 			<table border="1" cellspacing="0" cellpadding="0" width="100%">
# 				<thead>
# 					<tr>
# 						<th width="16%" valign="top">Bill No</th>
# 						<th width="12%" valign="top">Bill Date</th>
# 						<th width="21%" valign="top">Order No</th>
# 						<th width="15%" valign="top">Order Date</th>
# 						<th width="16%" valign="top">Actual Amt</th>
# 						<th width="18%" valign="top">Rem. Amt</th>
# 					</tr></thead><tbody>"""
                
# 	def table_content(name, posting_date, po_no, po_date, rounded_total, outstanding_amount):
# 		posting_date = posting_date.strftime("%d-%m-%Y") if bool(posting_date) else '-'
# 		po_date = po_date.strftime("%d-%m-%Y") if bool(po_date) else '-'

# 		rounded_total = fmt_money(rounded_total, 2, 'INR')
# 		outstanding_amount = fmt_money(outstanding_amount, 2, 'INR')

# 		return """<tr>
# 				<td width="16%" valign="top"> {0} </td>
# 				<td width="12%" valign="top"> {1} </td>
# 				<td width="21%" valign="top"> {2} </td>
# 				<td width="15%" valign="top"> {3} </td>
# 				<td width="16%" valign="top" align="right"> {4} </td>
# 				<td width="18%" valign="top" align="right"> {5} </td>
# 			</tr>""".format(name, posting_date, po_no or '-', po_date, rounded_total, outstanding_amount)

# 	def footer(actual_amount, outstanding_amount):
# 		actual_amt = fmt_money(sum(actual_amount), 2, 'INR')
# 		outstanding_amt = fmt_money(sum(outstanding_amount), 2, 'INR')
# 		return """<tr>
# 					<td width="68%" colspan="4" valign="top" align="right">
# 						<strong>Net Receivable &nbsp; </strong>
# 					</td>
# 					<td align="right" width="13%" valign="top">
# 						<strong> {} </strong>
# 					</td>
# 					<td align="right" width="18%" valign="top">
# 						<strong> {} </strong>
# 					</td>
# 				</tr></tbody></table></div><br>
# 				We request you to look into the matter and release the payment/s without Further delay. <br><br>
# 				If you need any clarifications for any of above invoice/s, please reach out to our Accounts Receivable Team by sending email to accounts@innotech.co.in.<br><br>
# 				We will appreciate your immediate response in this regard.<br><br>
                
# 				Thanking you in anticipation.<br><br>For, INNOVATIVE TECHNOLOGIES.
# 				""".format(actual_amt, outstanding_amt)

# 	non_customers = ()
# 	data = frappe.get_list("Proforma Invoice", filters={
# 			'status': ['not in', ('Closed', 'Paid')],
# 			'currency': 'INR',
# 			'docstatus': 1,
# 			'customer': ['not in', non_customers],},
# 			order_by='transaction_date',
# 			fields=["name", "customer", "transaction_date", "po_no", "po_date", "payment_due_amount", "advance_paid", "contact_email", "naming_series"])

# 	def get_customers():
# 		customers_list = list(set([d.customer for d in data if d.customer]))
# 		customers_list.sort()

# 		for customer in customers_list:
# 			yield customer

# 	def get_customer_si(customer):
# 		for d in data:
# 			if d.customer == customer:
# 				yield d

# 	customers = get_customers()

# 	sender = formataddr(("Innovative Technologies", "accounts@innotech.co.in"))
# 	for customer in customers:
# 		attachments, outstanding, actual_amount, recipients = [], [], [], []
# 		table = ''

# 		# customer_si = [d for d in data if d.customer == customer]
# 		customer_si = get_customer_si(customer)

# 		for si in customer_si:
# 			name = "Previous Year Outstanding"
# 			if si.naming_series != "OPRO-":
# 				name = si.name
# 				try:
# 					attachments.append({
# 						"print_format_attachment": 1,
# 						"doctype": "Proforma Invoice",
# 						"name": si.name,
# 						"print_format": 'Proforma Invoice',
# 						"print_letterhead": 1,
# 						"lang": 'en'
# 					})
# 				except:
# 					pass

# 			table += table_content(name, si.transaction_date, si.po_no, si.po_date,
# 						si.payment_due_amount, (si.payment_due_amount - si.advance_paid))

# 			outstanding.append(si.payment_due_amount - si.advance_paid)
# 			actual_amount.append(si.payment_due_amount or 0.0)

# 			if bool(si.contact_email) and si.contact_email not in recipients:
# 				recipients.append(si.contact_email)


# 		message = header(customer) + '' + table + '' + footer(actual_amount, outstanding)
# 		# recipients = "anandp@innotech.co.in"
# 		try:
# 			frappe.sendmail(
# 				recipients=recipients,
# 				cc = 'accounts@innotech.co.in',
# 				subject = 'Overdue Invoices: ' + customer,
# 				sender = sender,
# 				message = message,
# 				attachments = attachments
# 			)
# 		except:
# 			frappe.log_error("Mail Sending Issue", frappe.get_traceback())
# 			continue



@frappe.whitelist()
def mark_bulk_attendance(data):
    import json
    from pprint import pprint
    if isinstance(data, frappe.string_types):
        data = json.loads(data)
    data = frappe._dict(data)
    company = frappe.get_value('Employee', data.employee, 'company')
    if not data.unmarked_days:
        frappe.throw(_("Please select a date."))
        return

    for date in data.unmarked_days:
        doc_dict = {
            'doctype': 'Attendance',
            'employee': data.employee,
            'attendance_date': get_datetime(date),
            'status': data.status,
            'company': company,
        }
        attendance = frappe.get_doc(doc_dict).insert()
        attendance.submit()
