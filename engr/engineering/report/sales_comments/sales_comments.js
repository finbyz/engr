// Copyright (c) 2016, FinByz Tech Pvt. Ltd. and contributors
// For license information, please see license.txt
/* eslint-disable */

frappe.query_reports["Sales Comments"] = {
	"filters": [
		{
			fieldname: "from_date",
			label:__("From Date"),
			fieldtype: "Date",
			default : frappe.datetime.add_days(frappe.datetime.nowdate(), -30)
		},
		{
			fieldname: "to_date",
			label:__("To Date"),
			fieldtype: "Date",
			default : frappe.datetime.nowdate()
		},
		{
			fieldname: "doctype",
			label: __("DocType"),
			fieldtype: "Select",
			options: "\nLead\nCustomer\nQuotation\nOpportunity\nSales Invoice\nSales Order\nDelivery Note"
		},
		{
			fieldname: "user",
			label: __("User"),
			fieldtype: "Link",
			options: "User"
		}
	]
}