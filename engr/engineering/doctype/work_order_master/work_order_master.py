# Copyright (c) 2022, Finbyz Tech. Pvt. Ltd. and contributors
# For license information, please see license.txt

# import frappe

import frappe , datetime
from frappe.model.document import Document
from frappe.model.mapper import get_mapped_doc
from frappe.model.naming import make_autoname

class WorkOrderMaster(Document):
	def validate(self):
		self.job_id = self.name.replace("WOM-" + datetime.date.today().strftime('%y'), '')
		for row in self.item_master:
			row.job_id = self.job_id

@frappe.whitelist()
def make_WOM(source_name, target_doc=None):	
	doclist = get_mapped_doc("Sales Order", source_name, {
			"Sales Order":{
				"doctype": "Work Order Master",
				"field_map": {
					"name":"sales_order",
					"customer_name": "customer_name",
					"sales_partner": "sales_partner",
					"contact_mobile":"mobile_no",
					'address_display':"address",
					"contact_email":"email_id",
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

