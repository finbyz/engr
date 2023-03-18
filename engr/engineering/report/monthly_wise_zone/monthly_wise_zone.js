// Copyright (c) 2023, Finbyz Tech. Pvt. Ltd. and contributors
// For license information, please see license.txt
/* eslint-disable */

frappe.query_reports["Monthly Wise Zone"] = {
	"filters": [
		{
			"fieldname":"fiscal_year1",
			"label": __("Fiscal Year1"),
			"fieldtype": "Link",
			"options": "Fiscal Year",
			"reqd": 1
		},
		{
			"fieldname":"fiscal_year2",
			"label": __("Fiscal Year2"),
			"fieldtype": "Link",
			"options": "Fiscal Year",
			"reqd": 1
		},
		
	]
};
