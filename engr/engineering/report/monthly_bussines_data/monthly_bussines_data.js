// Copyright (c) 2016, Finbyz Tech. Pvt. Ltd. and contributors
// For license information, please see license.txt
/* eslint-disable */

frappe.query_reports["Monthly Bussines Data"] = {
	"filters": [
		{
			"fieldname":"from_date",
			"label": __("From"),
			"fieldtype": "Date",
			"default": frappe.datetime.add_months(frappe.datetime.get_today(),-1),
			"reqd": 1,
			"width": "100px"
		},
		{
			"fieldname":"to_date",
			"label": __("To"),
			"fieldtype": "Date",
			"default": frappe.datetime.get_today(),
			"reqd": 1,
			"width": "100px"
		},
		{
			"fieldname":"territory",
			"label": __("Territory"),
			"fieldtype": "Link",
			"options": 'Territory',
			"width": "100px",
			
		},
		{
			"label":"Sales Person",
			"fieldname":"user",
			"fieldtype":"Link",
			"options":"User",
		},
		{
			"label":"Customer",
			"fieldname":"customer",
			"fieldtype":"Link",
			"options":"Customer"			
		},
		{
			"label":"Sales Person Wise Data",
			"fieldname":"st",
			"fieldtype":"Check",			
		},
		{
			"label":"Sales Person",
			"fieldname":"sales_person",
			"fieldtype":"Link",
			"options":"Sales Person",
			"depends_on": "eval: doc.st == 1",
		},
	]
};
