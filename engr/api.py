# -*- coding: utf-8 -*-
# Copyright (c) 2021, Finbyz Tech. Pvt. Ltd. and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
from frappe import _
from frappe.utils import flt,cint,get_url_to_form
from frappe.contacts.doctype.address.address import get_company_address
from erpnext.accounts.utils import get_fiscal_year, getdate
import datetime

from frappe.desk.notifications import get_filters_for
from frappe.model.mapper import get_mapped_doc

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
