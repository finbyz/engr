# Copyright (c) 2013, Finbyz Tech. Pvt. Ltd. and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
from frappe import _
from frappe.utils import flt

def execute(filters=None):
	columns, data = [], []
	data,item_group_list= get_data()
	columns=get_columns(item_group_list)
	return columns, data


def get_data():
	data_sql= frappe.db.sql("""
	SELECT cp.potential,cp.target,cp.parent as customer,cp.item_group, st.sales_person
	FROM `tabCustomer Potential` AS cp  
	left join `tabSales Team` as st ON cp.parent=st.parent where cp.parenttype = 'Customer';
	""", as_dict=1)
	customer_ig = {}
	item_group_list = []
	new_data = []
	columns = []
	for row in data_sql:
		item_group_list.append(row.item_group)
		total_potential = 0
		if row.customer not in customer_ig:

			customer_ig[row.customer] = [{row.item_group:str(row.potential)+ " | " + str(row.target),"sales_person":row.sales_person}]
		else:
			customer_ig[row.customer].append({row.item_group:str(row.potential)+ " | " + str(row.target)})
	data=customize_data(customer_ig)
	return data,item_group_list

def customize_data(customer_ig):
	lst=[]
	lst.append({"customer":''})
	for key,value in customer_ig.items():
		total_potential,total_target = 0.0,0.0
		each_customer={}
		each_customer["customer"]=key
		for each in value:
			for ka,va in each.items():
				lst[0].update({ka:"Potential | Target"})
				each_customer[ka]=va
				if (va):
					try:
						total_potential += flt(va.split(' | ')[0])
						total_target += flt(va.split(' | ')[1])
					except:
						total_potential += 0
						total_target += 0			
					each_customer['potential'] = total_potential
					each_customer['target'] = total_target
		lst.append(each_customer)
	return lst
	

def get_columns(ig_columns):
	columns=[
		{
			'fieldname': 'customer',
			'label': _('Customer'),
			'fieldtype': 'Link',
			'options': 'Customer',
			'width': '120'
		},
		{
			'fieldname': 'potential',
			'label': _('Potential'),
			'fieldtype': 'Currency',
			'width': '120'
		},
		{
			'fieldname': 'target',
			'label': _('Target'),
			'fieldtype': 'Currency',
			'width': '120'
		},
		{
			'fieldname': 'sales_person',
			'label': _('Engineer'),
			'fieldtype': 'Link',
			'options': 'Sales Person',
			'width': '120'
		},
	]
	# columns += ig_columns
	columns += get_item_columns(ig_columns)
	return columns

def get_item_columns(ig_columns):	
	columns = []
	for ig in ig_columns:
		columns.append({
			'fieldname': '{}'.format(ig),
			'label': _('{}'.format(ig)),
			'fieldtype': 'data',
			'width': '120'
		},)
	return columns
