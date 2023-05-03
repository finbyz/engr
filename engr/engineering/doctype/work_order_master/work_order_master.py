# Copyright (c) 2022, Finbyz Tech. Pvt. Ltd. and contributors
# For license information, please see license.txt

# import frappe

import frappe , datetime
from frappe.model.document import Document
from frappe.model.mapper import get_mapped_doc
from frappe.model.naming import make_autoname
from datetime import datetime
import datetime 
from frappe.utils import (
	add_days,
	add_months,
	cint,
	date_diff,
	flt,
	get_first_day,
	get_last_day,
	get_link_to_form,
	getdate,
	rounded,
	today,
)

class WorkOrderMaster(Document):
	def before_naming(self):
		date = frappe.format(self.date , {'fieldtype':'Date'})
		date = date.split('-')

		if(self.branch == 'Nasik'):
			self.branch_name = 'NK'
		if(self.branch == 'Aurangabad'):
			self.branch_name = 'AU'
		self.wom_name = make_autoname("WOM-{}{}-{}-{}-{}".format(self.branch_name,date[2],date[1],date[0],".##"))
		job_id = self.wom_name.split("-")
		self.job_id = "{}-{}-{}-{}".format(job_id[-3],job_id[-2],job_id[-1], self.branch_name)

	def validate(self):
		if(self.contract_work or self.contract_work == 1):
			self.payment_status = 'Unpaid-Contract Work'
		date_list = []
		for row in self.item_master:
			row.job_id = self.job_id
			date_list.append(row.expected_date)
		if self.quotation_no:
			self.prevdoc_docname = self.quotation_no
		
		self.date_of_test_report = max(date_list)

		if(self.tax_invoice_no):
			frappe.db.set_value("Sales Invoice",self.tax_invoice_no ,"job_id" , self.job_id)
	def after_rename(self, olddn, newdn, merge=False):
		job_id = newdn.split("-")
		self.job_id = "{}-{}-{}".format(job_id[-3],job_id[-2],job_id[-1])

	def on_submit(self):
		if self.workflow_state == 'Test in Progress':
			for i , row in enumerate(self.item_master):
				if not row.assign_to_user:
					frappe.throw('Please Assign to User For Test Item <b>{}</b>'.format(row.item_code))
	def on_update_after_submit(self):
		if self.workflow_state == 'Test Report Preparation':
			for row in self.item_master:
				if not row.test_report_prepared:
					frappe.throw('Test report is not Prepared for Item {} '.format(row.item_code))
		if self.workflow_state == 'Final Report Prepared':
			for row in self.item_master:
				if not row.report_delivered:
					frappe.throw('<p>If Report is Ready To Send ,<br> tick check Box Report Delivered in row {} </p>'.format(i))

@frappe.whitelist()
def make_WOM(source_name, target_doc=None):	
	doclist = get_mapped_doc("Sales Order", source_name, {
			"Sales Order":{
				"doctype": "Work Order Master",
				"field_map": {
					"name":"sales_order",
					"customer_name": "customer_name",
					"sales_partner": "referred_by",
					"contact_mobile":"mobile_no",
					'address_display':"address",
					"contact_email":"email_id",
					"po_no":"ref_letter",
					"po_site_details":"po_site_details",
					'project':"project"
					},
				},
				"Sales Order Item": {
					"doctype": "Work Order Master Item",
					"field_map":  {
						"name": "sales_order_item",
						"parent": "sales_order",
						"item_code": "item_code",
						"item_name": "item_name",
						"item_group": "item_group",
					}
			    }
	}, target_doc)

	return doclist

@frappe.whitelist()
def make_sales_invoice(source_name, target_doc=None):	
	doclist = get_mapped_doc("Work Order Master", source_name, {
			"Work Order Master":{
				"doctype": "Sales Invoice",
				"field_map": {
					"name":"Work Order Master",
					"customer_name": "customer",
					"ref_letter":"po_no",
					"po_site_details":"po_site_details",
					"job_id":"job_id",
					"description":"description",
					},
				},
				"Work Order Master Item": {
					"doctype": "Sales Invoice Item",
					"field_map":  {
						"name": "Work Order Master Item",
						"parent": "sales_invoice",
						"item_code": "item_code",
						"item_name": "item_name",
						"sample_quantity":"qty"
						
					}
			    }
	}, target_doc)

	return doclist

@frappe.whitelist()
def make_proforma_invoice(source_name, target_doc=None):	
	doclist = get_mapped_doc("Work Order Master", source_name, {
			"Work Order Master":{
				"doctype": "Proforma Invoice",
				"field_map": {
					"name":"Work Order Master",
					"customer_name": "customer",
					"job_id":"job_id",
					"description":"description",
					"ref_letter":"po_no",
					"po_site_details":"po_site_details",
					'work_order_master_ref':'name'
					

					},
				},
				"Work Order Master Item": {
					"doctype": "Proforma Invoice Item",
					"field_map":  {
						"name": "Work Order Master Item",
						"parent": "Proforma Invoice",
						"item_code": "item_code",
						"item_name": "item_name",
						"sample_quantity":"qty",
						
						
					}
			    }
	}, target_doc)

	return doclist

@frappe.whitelist()
def make_sales_order(source_name, target_doc=None):
	def set_missing_values(source, target):
		target.ignore_pricing_rule = 1
		target.flags.ignore_permissions = True
		target.run_method("set_missing_values")
	doclist = get_mapped_doc("Work Order Master", source_name, {
			"Work Order Master":{
				"doctype": "Sales Order",
				"field_map": {
					"name":"Work Order Master",
					"customer_name": "customer",
					"job_id":"job_id",
					"description":"description",
					"ref_letter":"po_no",
					"po_site_details":"po_site_details",
					"job_id" : "job_id",
					"name" : "work_order_master_ref",
					"ignore_pricing_rule":"ignore_pricing_rule",
					"taxes_and_charges":"taxes_and_charges",
					},
				},
				"Work Order Master Item": {
					"doctype": "Sales Order Item",
					"field_map":  {
						"name": "Work Order Master Item",
						"parent": "Sales Order",
						"item_code": "item_code",
						"item_name": "item_name",
						"sample_quantity":"qty",
						"rate":"rate",
					}
			    }
	}, target_doc,set_missing_values)


	return doclist

@frappe.whitelist()
def get_events(start, end, filters=None):
	"""Returns events for Gantt / Calendar view rendering.
	:param start: Start date-time.
	:param end: End date-time.
	:param filters: Filters (JSON).
	"""
	#filters = json.loads(filters)
	from frappe.desk.calendar import get_event_conditions
	conditions = get_event_conditions("Work Order Master", filters).replace("`tabWork Order Master`.","wom.")

	data = frappe.db.sql("""
			select 
				womi.description, womi.parent as name,womi.expected_date,wom.workflow_state,CONCAT(womi.job_id, ' ', IFNULL(womi.priority,' ')) as job_id , womi.report_delivered
			from 
				`tabWork Order Master Item` as womi
			left join 
				`tabWork Order Master` as wom on womi.parent= wom.name
			where
				(womi.expected_date <= %(end)s and womi.expected_date >= %(start)s) {conditions}
			""".format(conditions=conditions),
				{
					"start": start,
					"end": end
				}, as_dict=True, update={"allDay": 1})

	return data

	# if not data:
	# 	return []
		
	# data = [x.name for x in data]

	# return frappe.db.get_list("Meeting",
	# 	{ "name": ("in", data), "docstatus":1 },
	# 	["name", "meeting_from", "meeting_to", "organization", "party"]
	# )