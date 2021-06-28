# -*- coding: utf-8 -*-
# Copyright (c) 2021, Finbyz Tech. Pvt. Ltd. and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
from frappe import _
from frappe.model.mapper import get_mapped_doc
from frappe.utils import flt,cint,get_url_to_form
from erpnext.controllers.status_updater import StatusUpdater
from erpnext.stock.doctype.item.item import get_item_defaults
from erpnext.setup.doctype.item_group.item_group import get_item_group_defaults
from frappe.contacts.doctype.address.address import get_company_address
from frappe.model.utils import get_fetch_values
from engr.api import validate_sales_person
from engr.engineering.doctype.proforma_invoice.proforma_invoice import set_status

from frappe.model.mapper import get_mapped_doc
from erpnext.accounts.utils import get_fiscal_year
from erpnext.accounts.doctype.sales_invoice.sales_invoice import SalesInvoice

def on_submit(self,method):
	create_purchase_invoice(self)
	update_proforma_billed_percent(self,"submit")

def on_cancel(self,method):
	cancel_all(self)
	update_proforma_billed_percent(self,"cancel")
	
def update_proforma_billed_percent(self,method):
	so = self.items[0].sales_order
	pi = self.items[0].proforma_invoice
	if so and pi:
		per_billed = frappe.db.get_value("Sales Order",so,"per_billed")
		frappe.db.set_value("Proforma Invoice",pi,"per_billed",per_billed)

		if method == "cancel" and not frappe.db.exists("Payment Entry Reference",{"proforma_invoice":pi,"docstatus":1}):
			frappe.db.set_value("Proforma Invoice",pi,"advance_paid",0)
			set_status(frappe.get_doc("Proforma Invoice",pi))
			
@frappe.whitelist()
def make_sales_invoice(source_name, target_doc=None, ignore_permissions=False):
	def postprocess(source, target):
		set_missing_values(source, target)
		#Get the advance paid Journal Entries in Sales Invoice Advance
		if source.status == "Paid" and source.payment_percentage == 100:
			target.allocate_advances_automatically = 1

		if target.get("allocate_advances_automatically"):
			target.set_advances()

	def set_missing_values(source, target):
		target.ignore_pricing_rule = 1
		target.flags.ignore_permissions = True
		target.run_method("set_missing_values")
		target.run_method("set_po_nos")
		target.run_method("calculate_taxes_and_totals")

		if source.company_address:
			target.update({'company_address': source.company_address})
		else:
			# set company address
			target.update(get_company_address(target.company))

		if target.company_address:
			target.update(get_fetch_values("Sales Invoice", 'company_address', target.company_address))

		# set the redeem loyalty points if provided via shopping cart
		if source.loyalty_points and source.order_type == "Shopping Cart":
			target.redeem_loyalty_points = 1
		
	def update_item(source, target, source_parent):
		target.amount = flt(source.amount) - flt(source.billed_amt)
		target.base_amount = target.amount * flt(source_parent.conversion_rate)
		target.qty = target.amount / flt(source.rate) if (source.rate and source.billed_amt) else source.qty - source.returned_qty

		if source_parent.project:
			target.cost_center = frappe.db.get_value("Project", source_parent.project, "cost_center")
		if target.item_code:
			item = get_item_defaults(target.item_code, source_parent.company)
			item_group = get_item_group_defaults(target.item_code, source_parent.company)
			cost_center = item.get("selling_cost_center") \
				or item_group.get("selling_cost_center")

			if cost_center:
				target.cost_center = cost_center

	doclist = get_mapped_doc("Proforma Invoice", source_name, {
		"Proforma Invoice": {
			"doctype": "Sales Invoice",
			"field_map": {
				"party_account_currency": "party_account_currency",
				"payment_terms_template": "payment_terms_template"
			},
			"field_no_map":{
				"naming_series",
				"amended_from",
				"status"
			},
			"validation": {
				"docstatus": ["=", 1]
			}
		},
		"Proforma Invoice Item": {
			"doctype": "Sales Invoice Item",
			"field_map": {
				"name": "proforma_invoice_item",
				"parent": "proforma_invoice",
				"sales_order":"sales_order",
				"sales_order_item":"so_detail"
			},
			"postprocess": update_item,
		},
		"Sales Taxes and Charges": {
			"doctype": "Sales Taxes and Charges",
			"add_if_empty": True
		},
		"Sales Team": {
			"doctype": "Sales Team",
			"add_if_empty": True
		}
	}, target_doc, postprocess, ignore_permissions=ignore_permissions)

	return doclist


def validate(self,method):
	validate_hsn_code(self)
	validate_sales_person(self)

def validate_hsn_code(self):
	for row in self.items:
		if row.gst_hsn_code:
			if len(row.gst_hsn_code) < 6:
				frappe.throw("Row {}: HSN Code cannot be less then 6 digits".format(row.idx))

# def on_submit(self, method):
	

def on_trash(self, method):
	delete_all(self)

# def on_cancel(self, method):
# 	cancel_all(self)

def create_purchase_invoice(self):
	check_inter_company_transaction = None

	if frappe.db.exists("Company",self.customer):
		check_inter_company_transaction = frappe.get_value(
			"Company", self.customer, "allow_inter_company_transaction"
		)
	
	if check_inter_company_transaction:
		
		company = frappe.get_doc("Company", self.customer)
		inter_company_list = [item.company for item in company.allowed_to_transact_with]
	
		if self.company in inter_company_list:
			pi = make_inter_company_transaction(self)

			for index, item in enumerate(self.items):
				if item.delivery_note:
					pi.items[index].purchase_receipt = frappe.db.get_value(
						"Delivery Note",
						item.delivery_note,
						'inter_company_receipt_reference'
					)

				if item.sales_order:
					pi.items[index].purchase_order = frappe.db.get_value(
						"Sales Order",
						item.sales_order,
						'inter_company_order_reference'
					)
		
			# authority = frappe.db.get_value("Company", pi.company, 'authority')
				
			# if authority == "Unauthorized" and (not pi.amended_from) and self.si_ref:
				
			# 	alternate_company = self.alternate_company
			# 	company_series = frappe.db.get_value("Company", alternate_company, 'company_series')

			# 	pi.company_series = frappe.db.get_value("Company", pi.name, "company_series")
			# 	pi.series_value = check_counter_series(pi.naming_series, company_series) - 1
			# 	pi.naming_series = 'A' + pi.naming_series
			
			pi.si_ref = self.name

			pi.save()
			if self.update_stock:
				pi.db_set('update_stock', 1)
			
			pi.submit()
			
			if self.si_ref:
				si_ref = frappe.db.get_value("Sales Invoice", self.name, 'si_ref')
				pi_ref = frappe.db.get_value("Sales Invoice", self.name, 'pi_ref')
				
				frappe.db.set_value("Purchase Invoice", pi.name, 'si_ref', self.name)
				frappe.db.set_value("Purchase Invoice", pi_ref, 'si_ref', si_ref)

			self.db_set('pi_ref', pi.name)

def cancel_all(self):
	if self.get('pi_ref'):
		doc = frappe.get_doc("Purchase Invoice", self.pi_ref)

		if doc.docstatus == 1:
			doc.cancel()

def delete_all(self):


	if self.get('pi_ref'):
		pi_ref = self.pi_ref
		frappe.db.set_value("Purchase Invoice", self.pi_ref, 'inter_company_invoice_reference', None)
		frappe.db.set_value("Purchase Invoice", self.pi_ref, 'si_ref', None)

		self.db_set("pi_ref", None)
		self.db_set("inter_company_invoice_reference", None)
		
		doc = frappe.get_doc("Purchase Invoice", pi_ref)
		doc.delete()

def make_inter_company_transaction(self, target_doc=None):
	source_doc  = frappe.get_doc("Sales Invoice", self.name)

	validate_inter_company_transaction(source_doc, "Sales Invoice")
	details = get_inter_company_details(source_doc, "Sales Invoice")

	def set_missing_values(source, target):
		if self.amended_from:
			name = frappe.db.get_value("Purchase Invoice", {'si_ref': self.amended_from}, "name")
			target.amended_from = name
		
		target.company = source.customer
		target.supplier = source.company
		# target.buying_price_list = source.selling_price_list
		target.posting_date = source.posting_date


		abbr = frappe.db.get_value("Company", target.company, 'abbr')

		target.set_warehouse = self.set_target_warehouse

		if source.taxes_and_charges:
			target_company_abbr = frappe.db.get_value("Company", target.company, "abbr")
			source_company_abbr = frappe.db.get_value("Company", source.company, "abbr")
			
			taxes_and_charges = source.taxes_and_charges.replace(
				source_company_abbr, target_company_abbr
			)

			if frappe.db.exists("Purchase Taxes and Charges Template", taxes_and_charges):
				target.taxes_and_charges = taxes_and_charges

			target.taxes = source.taxes
			
			for index, item in enumerate(source.taxes):
				target.taxes[index].account_head = item.account_head.replace(
					source_company_abbr, target_company_abbr
				)
			
		target.run_method("set_missing_values")
	
	def update_accounts(source_doc, target_doc, source_parent):
		target_company = source_parent.customer
		doc = frappe.get_doc("Company", target_company)

		if source_doc.pr_detail:
			target_doc.purchase_receipt = frappe.db.get_value("Purchase Receipt Item", source_doc.pr_detail, 'parent')
		if source_doc.purchase_order_item:
			target_doc.purchase_order = frappe.db.get_value("Purchase Order Item", source_doc.purchase_order_item, 'parent')

		target_doc.income_account = doc.default_income_account
		target_doc.expense_account = doc.default_expense_account
		target_doc.cost_center = doc.cost_center
	
	doclist = get_mapped_doc("Sales Invoice", self.name,	{
		"Sales Invoice": {
			"doctype": "Purchase Invoice",
			"field_map": {
				"name": "bill_no",
				"posting_date": "bill_date",
				"set_target_warehouse":"set_warehouse",
				"shipping_address_name": "shipping_address",
				"shipping_address": "shipping_address_display",
			},
			"field_no_map": [
				"taxes_and_charges",
				"series_value",
				"update_stock",
				"real_difference_amount"
			],
		},
		"Sales Invoice Item": {
			"doctype": "Purchase Invoice Item",
			"field_map": {
				"pr_detail": "pr_detail",
				"purchase_order_item": "po_detail",
			},
			"field_no_map": [
				"income_account",
				"expense_account",
				"cost_center",
				"warehouse",
				"proforma_invoice"
			], "postprocess": update_accounts,
		}
	}, target_doc, set_missing_values)

	return doclist

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
	
def is_internal_transfer(self):
		"""
			It will an internal transfer if its an internal customer and representation
			company is same as billing company
		"""
		if self.doctype in ('Sales Invoice', 'Delivery Note', 'Sales Order'):
			internal_party_field = 'is_internal_customer'
		elif self.doctype in ('Purchase Invoice', 'Purchase Receipt', 'Purchase Order'):
			internal_party_field = 'is_internal_supplier'

		if self.get(internal_party_field) and (self.represents_company == self.company):
			return True

		return False
		
def get_inter_company_details(doc, doctype):
	if doctype in ["Sales Invoice", "Sales Order", "Delivery Note"]:
		parties = frappe.db.get_all("Supplier", fields=["name"], filters={"disabled": 0, "is_internal_supplier": 1, "represents_company": doc.company})
		company = frappe.get_cached_value("Customer", doc.customer, "represents_company")

		if not parties:
			frappe.throw(_('No Supplier found for Inter Company Transactions which represents company {0}').format(frappe.bold(doc.company)))

		party = get_internal_party(parties, "Supplier", doc)
	else:
		parties = frappe.db.get_all("Customer", fields=["name"], filters={"disabled": 0, "is_internal_customer": 1, "represents_company": doc.company})
		company = frappe.get_cached_value("Supplier", doc.supplier, "represents_company")

		if not parties:
			frappe.throw(_('No Customer found for Inter Company Transactions which represents company {0}').format(frappe.bold(doc.company)))

		party = get_internal_party(parties, "Customer", doc)

	return {
		"party": party,
		"company": company
	}

def get_internal_party(parties, link_doctype, doc):
	if len(parties) == 1:
			party = parties[0].name
	else:
		# If more than one Internal Supplier/Customer, get supplier/customer on basis of address
		if doc.get('company_address') or doc.get('shipping_address'):
			party = frappe.db.get_value("Dynamic Link", {"parent": doc.get('company_address') or doc.get('shipping_address'),
			"parenttype": "Address", "link_doctype": link_doctype}, "link_name")

			if not party:
				party = parties[0].name
		else:
			party = parties[0].name

	return party

