# -*- coding: utf-8 -*-
# Copyright (c) 2021, Finbyz Tech. Pvt. Ltd. and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
from frappe import _
from frappe.utils import flt,cint

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