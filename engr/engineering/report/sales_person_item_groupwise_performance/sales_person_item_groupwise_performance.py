# Copyright (c) 2013, Finbyz Tech. Pvt. Ltd. and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
from frappe import _
from frappe.utils import flt

def execute(filters=None):
	columns, data = [], []

	columns = get_columns(filters)
	columns, data, chart = get_data(filters,columns)

	return columns, data, None, chart
	
def get_data(filters,columns):
	doc = filters.get('doctype')
	item_doc = filters.get('doctype') + " Item"
	date = "transaction_date" if doc in ('Quotation','Sales Order') else 'posting_date' 

	doc_query = frappe.db.sql("""
		select
			st.sales_person, item.item_group, SUM(item.base_net_amount) as net_amount
		from `tab{doc}` as doc
			JOIN `tab{item_doc}` as item on item.parent = doc.name
			JOIN `tabSales Team` as st on st.parent = doc.name
		where
			doc.company = '{company}' and doc.{date} BETWEEN '{from_date}' AND '{to_date}' and doc.docstatus = 1
		group by st.sales_person, item.item_group
	""".format(item_doc=item_doc, doc=doc, company=filters.get('company'), from_date=filters.get('from_date'),
				to_date=filters.get('to_date'), date=date), as_dict=1)
	sales_person_dict = {}
	sales_item_dict = {}
	columns_list = []
	new_data = []
	for row in doc_query:
		if row.item_group not in columns_list:
			columns_list.append(row.item_group)
			columns += [{"label": _(row.item_group), "fieldname": row.item_group, "fieldtype": "Currency", "width": 120},]
		row[row.item_group] = row.net_amount

		sales_item_dict.setdefault(row.sales_person,{}).setdefault(row.item_group,frappe._dict({
			"net_amount":0.0
		}))
		sales_dict = sales_item_dict[row.sales_person][row.item_group]
		sales_dict['net_amount'] += flt(row.net_amount)

	sales_person_list = []
	datapoints = []

	for key, value in sales_item_dict.items():
		total_net_amount = 0
		dct = frappe._dict({'sales_person':key})
		for k,v in value.items():
			total_net_amount += v.net_amount
			dct.update({'total_net_amount':total_net_amount,k:v.net_amount})

		new_data.append(dct)

		sales_person_list.append(key)
		datapoints.append(total_net_amount)
	
	chart = {
		"data": {
			'labels': sales_person_list,
			'datasets': [
				{
					"name":"Net Amount",
					"values":datapoints
				}
			]
		},
		"type":"pie"
	}

	return columns, new_data, chart


def get_columns(filters):
	columns = [
		{
			"fieldname": "sales_person",
			"label": _("Sales Person"),
			"fieldtype": "Link",
			"options": "Sales Person",
			"width": 150
		},
		{
			"fieldname": "total_net_amount",
			"label": _("Total Net Amount"),
			"fieldtype": "Currency",
			"width": 150
		},
	]

	return columns