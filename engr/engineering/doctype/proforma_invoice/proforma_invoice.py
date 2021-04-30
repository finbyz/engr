# -*- coding: utf-8 -*-
# Copyright (c) 2021, Finbyz Tech. Pvt. Ltd. and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
from frappe.model.document import Document
from frappe.utils import flt,cint ,comma_or, nowdate, getdate
from frappe.model.mapper import get_mapped_doc
from engr.engineering.doc_events.sales_order import update_proforma_details,change_sales_order_status
from erpnext.controllers.status_updater import StatusUpdater

class ProformaInvoice(Document):
	# def __init__(self, *args, **kwargs):
	# 	super(SalesOrder, self).__init__(*args, **kwargs)
		
	def on_validate(self):
		if self.payment_percentage:
			self.payment_due_amount = flt(self.rounded_total) * self.payment_percentage / 100
		for item in self.items:
			item.payment_amount = flt(item.net_amount) * self.payment_percentage / 100

	def on_submit(self):
		if self.payment_percentage == 0:
			frappe.throw("Please Enter Payment Percentage")
		update_proforma_details(self.name,"submit")
		set_status(self)

	def on_cancel(self):
		update_proforma_details(self.name,"cancel")

def set_status(self):
	if flt(self.advance_paid) == flt(self.payment_due_amount):
		self.db_set('status','Paid')
	elif flt(self.advance_paid) > 0:
		self.db_set('status','Partially Paid')
	else:
		self.db_set('status','Unpaid')
	change_sales_order_status(frappe.get_doc("Sales Order",self.items[0].sales_order))

@frappe.whitelist()
def create_proforma_invoice(source_name, target_doc=None):
	def set_missing_value(source, target):
		target.run_method('set_missing_values')
		target.run_method('calculate_taxes_and_totals')
		
	fields = {
		"Sales Order": {
			"doctype": "Proforma Invoice",
			"field_map": {
				"company": "company",
			},
			"field_no_map":{
				"naming_series",
				"order_type",
				"skip_delivery_note",
				"amended_from",
				"delivery_date",
				"po_no",
				"po_date",
				"set_warehouse",
				"scan_barcode",
				"loyalty_points_redemption",
				"loyalty_points",
				"loyalty_amount",
				"packed_items",
				"payment_terms_template",
				"payment_schedule",
				"inter_company_order_reference",
				"project",
				"party_account_currency",
				"source",
				"campaign",
				"group_same_items",
				"status",
				"delivery_status",
				"per_delivered",
				"per_billed",
				"billing_status",
				"sales_partner",
				"commission_rate",
				"total_commission",
				"sales_team",
				"from_date",
				"to_date",
				"auto_repeat",
			},
		},
		"Sales Order Item": {
			"doctype": "Proforma Invoice Item",
			"field_map": {
				"parent": "sales_order",
				"name":"sales_order_item",
			},
			"field_no_map":{
				"ensure_delivery_based_on_produced_serial_no",
				"delivery_date",
				"margin_type",
				"margin_rate_or_amount",
				"rate_with_margin",
				"discount_percentage",
				"discount_amount",
				"base_rate_with_margin"
				"is_free_item",
				"delivered_by_supplier",
				"supplier",
				"warehouse",
				"target_warehouse",
				"prevdoc_docname",
				"blanket_order",
				"blanket_order_rate",
				"projected_qty",
				"actual_qty",
				"ordered_qty",
				"planned_qty",
				"work_order_qty",
				"delivered_qty",
				"produced_qty",
				"returned_qty",
				"additional_notes",
				"transaction_date"
			},
			"condition": lambda doc: (doc.proforma_percentage) < 100
		},
	}
	doclist = get_mapped_doc(
		"Sales Order",
		source_name,
		fields,
		target_doc,
		set_missing_value,
		ignore_permissions=True
	)
	return doclist


