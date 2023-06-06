// Copyright (c) 2023, Frappe Technologies Pvt. Ltd. and contributors
// For license information, please see license.txt
/* eslint-disable */

frappe.query_reports["Territory Wise Target"] = {
	"filters": [
		{
			"fieldname": "fiscal_year",
			"label": __(" Fiscal Year"),
			"fieldtype": "Select",
			"options" : ['2021-2022','2022-2023','2023-2024','2024-2025'],
			"reqd":1
		},
		{
			"fieldname": "territory_type",
			"label": __("Territory Type"),
			"fieldtype": "Select",
			"options" : ['Division' ,'Sub Division', 'Zone'],
			"reqd":1
		},
	]
};
