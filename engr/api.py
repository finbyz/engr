# -*- coding: utf-8 -*-
# Copyright (c) 2021, Finbyz Tech. Pvt. Ltd. and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
from frappe import _
from frappe.utils import flt,cint,get_url_to_form


def validate_sales_person(self):
	if self.sales_team:
		self.sales_person=self.sales_team[0].sales_person
