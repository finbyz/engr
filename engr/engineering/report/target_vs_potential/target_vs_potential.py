# Copyright (c) 2013, Finbyz Tech. Pvt. Ltd. and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
from frappe import _
from frappe.utils import flt

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

def get_split(filters):
	conditions=get_data_filters(filters)
	data_sql= frappe.db.sql("""
	SELECT cp.potential,cp.target,cp.parent as customer,cp.item_group, st.sales_person
	FROM `tabCustomer Potential` AS cp  
	left join `tabSales Team` as st ON cp.parent=st.parent where cp.parenttype = 'Customer' {} 
	""".format(conditions), as_dict=1)
	customer_ig = {}
	item_group_list = []
	for row in data_sql:
		item_group_list.append(row.item_group)
		total_potential = 0
	
	
def get_data(filters):
	conditions=get_data_filters(filters)
	data_sql= frappe.db.sql("""
	SELECT cp.potential,cp.target,cp.parent as customer,cp.item_group, st.sales_person
	FROM `tabCustomer Potential` AS cp  
	left join `tabSales Team` as st ON cp.parent=st.parent where cp.parenttype = 'Customer' {} 
	""".format(conditions), as_dict=1)
	customer_ig = {}
	item_group_list = []
	for row in data_sql:
		item_group_list.append(row.item_group)
		total_potential = 0
		if row.customer not in customer_ig:
			customer_ig[row.customer] = [{'P_{}'.format(row.item_group):row.potential }]
			customer_ig[row.customer].append({'T_{}'.format(row.item_group):row.target })
			customer_ig[row.customer].append({'sales_person':row.sales_person})
		else:
			customer_ig[row.customer].append({'T_{}'.format(row.item_group):row.target })
			customer_ig[row.customer].append({'P_{}'.format(row.item_group):row.potential })

	data=customize_data(customer_ig)
	return data,list(set(item_group_list))

def customize_data(customer_ig):
	lst=[]
	if customer_ig:
		for key,value in customer_ig.items():
			total_potential,total_target = 0,0
			each_customer={}
			each_customer["customer"]= key
			for each in value:
				for ka,va in each.items():
					if ka !='sales_person':
						each_customer[ka]=va
						if (va):
							if (ka.startswith('P_')):
								total_potential += flt(va)
							elif(ka.startswith('T_')):
								total_target += flt(va)		
					else:
						each_customer['sales_person']=va or ''
				each_customer['potential'] = flt(total_potential)
				each_customer['target'] = flt(total_target)
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
			'fieldname': 'potential',
			'label': _('Potential'),
			'fieldtype': 'Currency',
			'width': '120'
		},
		{
			'fieldname': 'target',
			'label': _('Target'),
			'fieldtype': 'Currency',
			'width': '120',
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
		if frappe.db.exists("Item Group",ig):
			columns.append({
				'fieldname': 'P_{}'.format(ig),
				'label': _('P_{}'.format(ig)),
				'fieldtype': 'Currency',
				'width': '120'
			},)
			columns.append({
				'fieldname': 'T_{}'.format(ig),
				'label': _('T_{}'.format(ig)),
				'fieldtype': 'Currency',
				'width': '120'
			},)
		
	return columns
