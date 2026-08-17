// Copyright (c) 2026, Finbyz Tech. Pvt. Ltd. and contributors
// For license information, please see license.txt
/* eslint-disable */

frappe.query_reports["Sales Invoice Detail"] = {
	filters: [
		{
			fieldname: "from_date",
			label: __("From Date"),
			fieldtype: "Date",
			default: frappe.datetime.add_months(frappe.datetime.get_today(), -1),
			width: "100px"
		},
		{
			fieldname: "to_date",
			label: __("To Date"),
			fieldtype: "Date",
			default: frappe.datetime.get_today(),
			width: "100px"
		},
		{
			fieldname: "customer",
			label: __("Customer Name"),
			fieldtype: "Link",
			options: "Customer",
			width: "100px"
		},
		
		{
			fieldname: "product_group",
			label: __("Product Group"),
			fieldtype: "MultiSelectList",
			width: "100px",
			get_data: function (txt) {
				return [
					{ value: "PMG", description: "" },
					{ value: "SAG", description: "" },
					{ value: "HCG", description: "" },
					{ value: "HFG", description: "" },
					{ value: "Internal", description: "" },
					{ value: "Others", description: "" }
				].filter(function (d) {
					return !txt || d.value.toLowerCase().includes(txt.toLowerCase());
				});
			}
		},
		{
			fieldname: "status",
			label: __("Status"),
			fieldtype: "MultiSelectList",
			width: "100px",
			get_data: function (txt) {
				return [
					
					
					{ value: "Return", description: "" },
					{ value: "Credit Note Issued", description: "" },
					{ value: "Unpaid", description: "" },
					{ value: "Partly Paid", description: "" },
					{ value: "Paid", description: "" },
					{ value: "Overdue", description: "" },
					
				].filter(function (d) {
					return !txt || d.value.toLowerCase().includes(txt.toLowerCase());
				});
			}
		},
		{
			fieldname: "is_internal_customer",
			label: __("Don't Show Internal Customer"),
			fieldtype: "Check",
			default: 1,
			width: "100px"
		}
	]
};