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

def on_submit(self,method):
    update_proforma_billed_percent(self)

def on_cancel(self,method):
    update_proforma_billed_percent(self)
    
def update_proforma_billed_percent(self):
    so = self.items[0].sales_order
    pi = self.items[0].proforma_invoice
    if so and pi:
        per_billed = frappe.db.get_value("Sales Order",so,"per_billed")
        frappe.db.set_value("Proforma Invoice",pi,"per_billed",per_billed)
 
@frappe.whitelist()
def make_sales_invoice(source_name, target_doc=None, ignore_permissions=False):
	def postprocess(source, target):
		set_missing_values(source, target)
		#Get the advance paid Journal Entries in Sales Invoice Advance
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