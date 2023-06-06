// Copyright (c) 2023, Frappe Technologies Pvt. Ltd. and contributors
// For license information, please see license.txt
/* eslint-disable */

frappe.query_reports["territory Wise Targeted"] = {
	"filters": [
		{
			"fieldname": "fiscal_year",
			"label": __(" Fiscal Year"),
			"fieldtype": "Link",
			"options" : "Fiscal Year",
			"reqd":1
		},
		{
			"fieldname": "territory_type",
			"label": __("Territory Type"),
			"fieldtype": "Select",
			"options" : ['Division' ,'Sub Division', 'Zone'],
			"reqd":1
		},
		{
			"fieldname": "parent_territory",
			"label": __("Parent Teritory"),
			"fieldtype": "Link",
			"options": "Territory",
			get_query: () => {
						var terr = frappe.query_report.get_filter_value('territory_type');
						return{
							filters:{
								"is_group":1,
								"territory_type":terr
		
							}
						};
					}
					
			},
	]
};

