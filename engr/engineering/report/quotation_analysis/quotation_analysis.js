// Copyright (c) 2016, Finbyz Tech. Pvt. Ltd. and contributors
// For license information, please see license.txt
/* eslint-disable */

frappe.query_reports["Quotation Analysis"] = {
	"filters": [
		{
			"fieldname":"sales_person",
				"label": __("Sales Person"),
				"fieldtype": "Link",
				"options": "Sales Person",
			},
	]
};
