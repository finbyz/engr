// Copyright (c) 2022, Finbyz Tech. Pvt. Ltd. and contributors
// For license information, please see license.txt
/* eslint-disable */

frappe.query_reports["Sales Invoice Trends GraphicArb"] = {
	"filters": [
		{
			"fieldname":"period",
			"label": __("Period"),
			"fieldtype": "Select",
			"options": [
				{ "value": "Monthly", "label": __("Monthly") },
				{ "value": "Quarterly", "label": __("Quarterly") },
				{ "value": "Half-Yearly", "label": __("Half-Yearly") },
				{ "value": "Yearly", "label": __("Yearly") }
			],
			"default": "Monthly"
		},
		{
			"fieldname":"based_on",
			"label": __("Based On"),
			"fieldtype": "Select",
			"options": [
				{ "value": "Item", "label": __("Item") },
				{ "value": "Item Group", "label": __("Item Group") },
				{ "value": "Customer", "label": __("Customer") },
				{ "value": "Customer Group", "label": __("Customer Group") },
				{ "value": "Territory", "label": __("Territory") },
				{ "value": "Project", "label": __("Project") }
			],
			"default": "Customer",
			"on_change": function(){
				if (frappe.query_report.get_filter_value('based_on') == "Customer"){
					frappe.query_report.get_filter('customer').toggle(true)
				}
				else{
					frappe.query_report.get_filter('customer').toggle(false)
				}
				frappe.query_report.refresh();
			},
			"dashboard_config": {
				"read_only": 1,
			}
		},
		{
			"fieldname":"group_by",
			"label": __("Group By"),
			"fieldtype": "Select",
			"options": [
				"",
				{ "value": "Item", "label": __("Item") },
				{ "value": "Customer", "label": __("Customer") }
			],
			"default": "Item",
			"on_change": function(){
				if (frappe.query_report.get_filter_value('group_by') == "Customer"){
					frappe.query_report.get_filter('customer').toggle(true)
				}
				else{
					frappe.query_report.get_filter('customer').toggle(false)
				}
				frappe.query_report.refresh();
			},
		},
		{
			"fieldname":"fiscal_year",
			"label": __("Fiscal Year"),
			"fieldtype": "Link",
			"options":'Fiscal Year',
			"default": frappe.sys_defaults.fiscal_year
		},
		{
			"fieldname":"company",
			"label": __("Company"),
			"fieldtype": "Link",
			"options": "Company",
			"default": frappe.defaults.get_user_default("Company")
		},
		{
			"fieldname":"branch",
			"label": __("Branch"),
			"fieldtype": "MultiSelectList",
			get_data: function(txt) {
				return frappe.db.get_link_options('Branch', txt);
			}
		},
		{
			"fieldname":"customer",
			"label": __("Customer"),
			"fieldtype": "Link",
			"options": "Customer",
			"hidden":0
		},
	]
};

