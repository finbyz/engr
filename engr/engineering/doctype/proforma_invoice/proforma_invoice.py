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
from engr.api import validate_sales_person


class ProformaInvoice(Document):
	# def __init__(self, *args, **kwargs):
	# 	super(SalesOrder, self).__init__(*args, **kwargs)
		
	def validate(self):
		if self.payment_percentage:
			self.payment_due_amount = flt(self.rounded_total) * flt(self.payment_percentage) / 100
		for item in self.items:
			item.payment_amount = flt(item.net_amount) * flt(self.payment_percentage) / 100
		validate_sales_person(self)  
		self.set_taxes_on_payment_percentage()  
	def set_taxes_on_payment_percentage(self):
		if self.gst_paid: 
			doc = frappe.get_doc('GST Settings')
			account_list = []
			for row in doc.get('gst_accounts'):
				account_list.append(row.get('cgst_account'))
				account_list.append(row.get('sgst_account'))
				account_list.append(row.get('igst_account'))
			self.sgst = None
			self.cgst = None
			self.igst = None
			if self.taxes:
				for row in self.taxes:
					if row.account_head in account_list:
						if "SGST" in str(row.account_head) or "sgst" in str(row.account_head):
							payment_percent = (flt(self.total) * flt(self.payment_percentage))/100
							sgst_percent = (payment_percent * row.rate)/100
							self.sgst = sgst_percent 
						if "CGST" in str(row.account_head) or "cgst" in str(row.account_head):
							payment_percent = (flt(self.total) * flt(self.payment_percentage))/100
							cgst_percent = (payment_percent * row.rate)/100
							self.cgst = cgst_percent
						if "IGST" in str(row.account_head) or "igst" in str(row.account_head):
							payment_percent = (flt(self.total) * flt(self.payment_percentage))/100
							igst_percent = (flt(payment_percent) * flt(row.rate))/100
							self.igst = igst_percent
	def on_submit(self):
		self.db_set('submitted_by', frappe.session.user)
		if self.payment_percentage == 0:
			frappe.throw("Please Enter Payment Percentage")
		update_proforma_details(self.name,"submit")
		set_status(self)
		if(self.job_id):
			frappe.db.set_value("Work Order Master",self.work_order_master_ref ,"proforma_invoice",self.name)
		if(self.work_order_master_ref):
			frappe.db.set_value("Work Order Master",self.work_order_master_ref ,"proforma_invoice",self.name)
	def before_save(self):
		if(self.job_id):
			Wom=frappe.db.exists("Work Order Master",{"job_id":self.job_id})
			self.work_order_master_ref = Wom
		

	
	def on_cancel(self):
		update_proforma_details(self.name,"cancel")

	@frappe.whitelist()
	def set_status(self, status):
		self.db_set('status', status)
		set_status(self)

def set_status(self, update_modified= True):
	if self.status != "Closed":
		if flt(self.advance_paid) == flt(self.payment_due_amount) or (flt(self.advance_paid) > flt(self.payment_due_amount) and self.allow_over_billing_payment):
			self.db_set('status','Paid', update_modified= update_modified)
		elif flt(self.advance_paid) > 0:
			self.db_set('status','Partially Paid', update_modified= update_modified)
		else:
			self.db_set('status','Unpaid', update_modified= update_modified)
	change_sales_order_status(frappe.get_doc("Sales Order",self.items[0].sales_order), update_modified= update_modified)

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
				"name" : "sales_order",
				"project":"project",
			},
			"field_no_map":{
				"naming_series",
				"skip_delivery_note",
				"amended_from",
				"scan_barcode",
				"inter_company_order_reference",
				"status",
				"delivery_status",
				"per_delivered",
				"per_billed",
				"billing_status",
				"auto_repeat",
			},
		},
		"Sales Order Item": {
			"doctype": "Proforma Invoice Item",
			"field_map": {
				"parent": "sales_order",
				"name":"sales_order_item",
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


	