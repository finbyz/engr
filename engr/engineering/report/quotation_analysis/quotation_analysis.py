# Copyright (c) 2013, Finbyz Tech. Pvt. Ltd. and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
from frappe import _
import frappe

def execute(filters=None):
	columns=get_columns()
	data = get_data(filters)

	return columns, data


def get_columns():
	columns=[
		{ "label": _("Sales Person"),"fieldname": "sales_person","fieldtype": "Data","width": 100},
		{ "label": _("Status"),"fieldname": "doc_status","fieldtype": "Data","width": 100},
		{ "label": _("Status Count"),"fieldname": "total_status_count","fieldtype": "Data","width": 100},
		{ "label": _("Sum Of Net Amount"),"fieldname": "total_net_amount","fieldtype": "Currency","width": 100},
	]
	return columns

def get_conditions(filters):
	conditions=''
	if filters.get("sales_person"):
		conditions +=" and child.sales_person='{}' ".format(filters.get('sales_person'))
	return conditions

def get_data(filters):
	conditions=get_conditions(filters)
	data_sql=frappe.db.sql("""
	SELECT child.parent,child.sales_person,child.docstatus,qu.name,qu.net_total,qu.status
	from `tabSales Team` as child 
	LEFT JOIN `tabQuotation` as qu ON qu.name=child.parent
	where child.parenttype="Quotation" {}
	ORDER BY child.sales_person
	""".format(conditions),as_dict=1)
	formatted_data=[]
	data={}
	for each in data_sql:
		if each.sales_person not in data.keys() :
			data[each.sales_person]={each.status:[{'name':each.parent,'docstatus':each.status,'amount':each.net_total}]}
		else:
			if each.status not in data[each.sales_person].keys():
				data[each.sales_person][each.status]=[{'name':each.parent,'docstatus':each.status,'amount':each.net_total}]
			else:
				data[each.sales_person][each.status].append({'name':each.parent,'docstatus':each.status,'amount':each.net_total})


	for each_sales_person in data.keys():
		sales_person_total=0
		sales_person_doc_total=0
		for each_docstatus in data[each_sales_person]:
			total_net_total=0
			total_net_total = sum(d.get('amount', 0) for d in data[each_sales_person][each_docstatus])
			sales_person_total+=total_net_total
			sales_person_doc_total+=len(data[each_sales_person][each_docstatus])
			formatted_data.append({'sales_person':each_sales_person,"doc_status":each_docstatus,'total_status_count':len(data[each_sales_person][each_docstatus]),'total_net_amount':total_net_total})
		formatted_data.append({'sales_person':frappe.bold(each_sales_person),"doc_status":frappe.bold("Total"),'total_status_count':frappe.bold(sales_person_doc_total),'total_net_amount':sales_person_total})
	return formatted_data

