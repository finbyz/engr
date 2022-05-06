# -*- coding: utf-8 -*-
# Copyright (c) 2021, Finbyz Tech. Pvt. Ltd. and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
from frappe import _
from frappe.model.mapper import get_mapped_doc
from frappe.utils import flt,cint
from frappe.model.naming import make_autoname


@frappe.whitelist()
def get_item_group_list():
    item_query=frappe.db.sql("""
    SELECT name From `tabItem Group` Where for_customer_potential = 1
    """,as_dict=1)
    if item_query:
        return item_query
    else:
        frappe.msgprint("No Item group selected")


def validate_customer_potential(self,method):
    if self.customer_potential:
        to_remove=[]
        for row in self.customer_potential:
            if not row.target and not row.potential:
                to_remove.append(row)
        
        [self.customer_potential.remove(d) for d in to_remove]
    return self

@frappe.whitelist()
def create_task(source_name, target_doc=None, ignore_permissions= True):
    fields = {
        "Customer": {
            "doctype": "Task",
            "field_map": {
                'name':'customer'
            }}}
    doc = get_mapped_doc(
        "Customer",
        source_name,
        fields,
        target_doc,
        ignore_permissions=ignore_permissions
    )
    return doc

def before_validate(self,method):
    self.customer_id = make_autoname("{}".format(".#####"))

@frappe.whitelist()
def make_WOM_from_customer(source_name, target_doc=None):	
	doclist = get_mapped_doc("Customer", source_name, {
			"Customer":{
				"doctype": "Work Order Master",
				"field_map": {
					"customer_name": "customer_name",
					},
				}
				# "Sales Order Item": {
				# 	"doctype": "Work Order Master Item",
				# 	"field_map":  {
				# 		"name": "sales_order_item",
				# 		"parent": "sales_order",
				# 		"item_code": "item_code",
				# 		"item_name": "item_name",
				# 		"item_group": "item_group",
				# 	}
			    # }
	}, target_doc)

	return doclist
