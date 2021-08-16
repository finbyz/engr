# Copyright (c) 2015, Frappe Technologies Pvt. Ltd. and Contributors
# License: GNU General Public License v3. See license.txt

from __future__ import unicode_literals
import frappe
from engr.engineering.report.item_group_wise_sales_target_variance import get_data_column

def execute(filters=None):
	data = []
	columns, data = get_data_column(filters, "Sales Person")
	chart = get_chart_data(data)
	return columns, data, None, chart

def get_chart_data(data):
	total_target = []
	total_achieved = []
	labels = []
	for row in data:
		total_target.append(row.get('total_target'))
		total_achieved.append(row.get('total_achieved'))
		labels.append(row.get('sales_person'))
	datasets = []
	if total_target:
		datasets.append({
			'name': "Total Target",
			'values': total_target
		})
	
	if total_achieved:
		datasets.append({
			'name': "Total Achieved",
			'values': total_achieved
		})

	chart = {
		"data": {
			'labels': labels,
			'datasets': datasets
		}
	}
	chart["type"] = "bar"
	return chart

