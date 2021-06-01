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
			# customer_ig[row.customer] = [{row.item_group:'{} | {}'.format(str(int(row.potential)),str(int(row.target)))}]
			customer_ig[row.customer] = [{row.item_group:'<div style="display: flex;"><p style="margin: 0;text-align:left !important;padding: 0; width: 90px;">{}</p>|<p style="margin: 0;text-align:right !important;padding: 0; width: 90px;">{}</p></div>'.format(str(int(row.potential or 0)),str(int(row.target or 0)))}]
			customer_ig[row.customer].append({'sales_person':row.sales_person})
		else:
			# customer_ig[row.customer].append({row.item_group:'<table width="100%"  style="border: 0px;"><tr><td width="49%"><p style="margin: 0;padding: 0;">{}</p></td><td width="2%"><p style="margin: 0;padding: 0;">|</p></td><td width="49%"><p style="margin: 0;text-align:right !important;padding: 0;">{}</p></td></tr></table>'.format(str(int(row.potential or 0)),str(int(row.target or 0)))})
			customer_ig[row.customer].append({row.item_group:'<div style="display: flex;"><p style="margin: 0;text-align:left !important;padding: 0; width: 90px;">{}</p>|<p style="margin: 0;text-align:right !important;padding: 0; width: 90px;">{}</p></div>'.format(str(int(row.potential or 0)),str(int(row.target or 0)))})

			# <p><spam style="text-align:right !important; margin: 0;padding: 0;">{}| <spam style="text-align:right !important;text-align:right;margin: 0;padding: 0;">{}</spam></spam></p>
	data=customize_data(customer_ig)
	return data,list(set(item_group_list))

def customize_data(customer_ig):
	lst=[]
	if customer_ig:
		lst.append({"customer":'',"sales_person":'',"potential":0,"target":0})
		for key,value in customer_ig.items():
			total_potential,total_target = 0,0
			each_customer={}
			each_customer["customer"]= key
			# each_customer['sales_person']=
			for each in value:
				for ka,va in each.items():
					if ka !='sales_person':
						lst[0].update({ka:'	<div style="display: flex;"><p style="margin: 0;text-align:left !important;padding: 0; width: 90px;">Potential</p>|<p style="margin: 0;text-align:right !important;padding: 0; width: 90px;">Target</p></div>'})
						each_customer[ka]=va
						if (va):
							try:
								total_potential_value= (va.split('padding: 0; width: 90px;">'))
								total_potential += flt(total_potential_value[1].split('</p>')[0])
								total_target += flt(total_potential_value[2].split('</p>')[0])
							except:
								total_potential += 0
								total_target += 0			
							each_customer['potential'] = flt(total_potential)
							each_customer['target'] = flt(total_target)
					else:
						each_customer['sales_person']=va
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
			'width': '180'
		},)
	return columns
