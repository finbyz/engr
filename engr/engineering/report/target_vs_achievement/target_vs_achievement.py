# Copyright (c) 2013, Finbyz Tech. Pvt. Ltd. and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
from frappe import _
from frappe.utils import flt
import math

def execute(filters):
	columns, data = [], []
	data,item_group_list= get_data(filters)
	columns=get_columns(item_group_list)
	return columns, data

def get_data_filters(filters):
	where_clause = ''
	if filters.get('customer'):
		where_clause += " and cp.parent='{}'  ".format(filters.get('customer'))
	if filters.get('item_group'):
		where_clause += " and cp.item_group='{}'  ".format(filters.get('item_group'))
	return where_clause
	
def get_data(filters):
	conditions=get_data_filters(filters)

	data_sql= frappe.db.sql("""
		select sii.net_amount as achievement, si.customer,sii.item_group
		from `tabSales Invoice Item` as sii
		JOIN `tabSales Invoice` as si on si.name = sii.parent
		where si.docstatus = 1 and (sii.item_group is not null or sii.item_group != '') {}
	""".format(conditions),as_dict=1) 
	customer_potential=frappe.db.sql("""select cp.parent as customer ,cp.item_group,cp.target from `tabCustomer Potential` as cp where cp.target != 0 and cp.parenttype='Customer'""".format(conditions),as_dict=1)
	customer_ig = {}
	item_group_list = []
	achievement_map = {}
	for row in data_sql:
		
		if (row.customer + row.item_group) not in achievement_map:
			achievement_map[row.customer + row.item_group] = flt(row.achievement)
		else:
			achievement_map[row.customer + row.item_group] += flt(row.achievement)
	for cust in customer_potential:
		item_group_list.append(cust.item_group)
		achievement = flt(achievement_map.get(cust.customer + cust.item_group))
		if cust.customer not in customer_ig.keys():
			customer_ig[cust.customer]=[{'T_{}'.format(cust.item_group):flt(cust.target)}]
			customer_ig[cust.customer].append({'A_{}'.format(cust.item_group):flt(achievement)})
			item_group_list.append(cust.item_group)
		else:
			customer_ig[cust.customer].append({'T_{}'.format(cust.item_group):flt(cust.target)})
			customer_ig[cust.customer].append({'A_{}'.format(cust.item_group):flt(achievement)})
			item_group_list.append(cust.item_group)
	list_item=list(set(item_group_list))
	data=customize_data(customer_ig,list_item)
	return data,list_item


def customize_data(customer_ig,list_item):
	lst=[]
	if customer_ig:
		for key,value in customer_ig.items():
			print(key,value)
			total_target = 0
			total_achievement = 0
			each_customer={}
			each_customer["customer"]= key
			for each in value:
				for ka,va in each.items():
					each_customer[ka]=flt(va,2)
					if (va):
						if(ka.startswith('T_')):
							total_target += (va)
						if(ka.startswith('A_')):
							total_achievement += (va)		

				each_customer['target'] = (total_target)
				each_customer['achievement'] = (total_achievement)
			for each_group_item in list_item:
				if 'T_{}'.format(each_group_item) not in each_customer.keys():
					if each_group_item != None: 
						each_customer['T_{}'.format(each_group_item)]=0.0
						each_customer['A_{}'.format(each_group_item)]=0.0
			lst.append(each_customer)
	return lst
	

def get_columns(ig_columns):
	columns=[
		{
			'fieldname': 'customer',
			'label': _('Customer'),
			'fieldtype': 'Link',
			'options':"Customer",
			'width': '220'
		},
		{
			'fieldname': 'target',
			'label': _('Target'),
			'fieldtype': 'Currency',
			'width': '120',
		},
		{
			'fieldname': 'achievement',
			'label': _('Achievement'),
			'fieldtype': 'Currency',
			'width': '120'
		},
	]
	columns += get_item_columns(ig_columns)
	return columns

def get_item_columns(ig_columns):	
	columns = []
	for ig in ig_columns:
		if frappe.db.exists("Item Group",ig):
			columns.append({
				'fieldname': 'A_{}'.format(ig),
				'label': _('A_{}'.format(ig)),
				'fieldtype': 'Currency',
				'width': '120',
				'default':0.0
			},)
			columns.append({
				'fieldname': 'T_{}'.format(ig),
				'label': _('T_{}'.format(ig)),
				'fieldtype': 'Currency',
				'width': '120',
				'default':0.0
			},)
		
	return columns
