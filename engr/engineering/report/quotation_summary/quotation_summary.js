// // Copyright (c) 2026, Finbyz Tech. Pvt. Ltd. and contributors
// // For license information, please see license.txt
// /* eslint-disable */
frappe.query_reports["Quotation Summary"] = {
	filters: [
		{
			fieldname: "from_date",
			label: __("From Date"),
			fieldtype: "Date",
			default: frappe.datetime.add_months(
				frappe.datetime.get_today(),
				-12
			),
			reqd: 1,

			on_change: function () {
				validate_dates("from_date");
			}
		},
		{
			fieldname: "to_date",
			label: __("To Date"),
			fieldtype: "Date",
			default: frappe.datetime.get_today(),
			reqd: 1,

			on_change: function () {
				validate_dates("to_date");
			}
		},
		{
			fieldname: "period",
			label: __("Period"),
			fieldtype: "Select",
			options: "Monthly\nQuarterly\nHalf Yearly\nYearly",
			default: "Monthly",
			reqd: 1
		},
		{
			fieldname: "chart_type",
			label: __("Chart Type"),
			fieldtype: "Select",
			options: "Bar\nStacked Bar\nLine\nPie\nDonut",
			default: "Bar",
			reqd: 1
		},
		{
			fieldname: "status",
			label: __("Status"),
			fieldtype: "MultiSelectList",

			get_data: function (txt) {
				return [
					{ value: "Ordered",description: "" },
					{ value: "Lost",description: "" },
					{ value: "Open",description: "" },
					{ value: "Expired",description: "" },
					{ value: "Replied",description: "" },
					{ value: "Partially Ordered",description: "" }
				].filter(function (d) {
					return !txt || d.value.toLowerCase().includes(txt.toLowerCase());
				});
			}
		},
		{
			fieldname: "product_group",
			label: __("Product Group"),
			fieldtype: "MultiSelectList",

			get_data: function (txt) {

				let options = [
					{
						label: "PMG",
						value: "PMG",
						description: ""
					},
					{
						label: "SAG",
						value: "SAG",
						description: ""
					},
					{
						label: "HCG",
						value: "HCG",
						description: ""
					},
					{
						label: "HFG",
						value: "HFG",
						description: ""
					},
					{
						label: "Internal",
						value: "Internal",
						description: ""
					},
					{
						label: "Others",
						value: "Others",
						description: ""
					}
				];

				return options.filter(function (d) {

					return !txt || d.value.toLowerCase().includes(txt.toLowerCase());

				});
			}
		}
	],

	
};


// Date Validation
function validate_dates(fieldname) {

	let from_date = frappe.query_report.get_filter_value("from_date");
	let to_date = frappe.query_report.get_filter_value("to_date");

	if (from_date && to_date && from_date > to_date) {

		frappe.msgprint({
			title: __("Invalid Date Range"),
			message: __("From Date cannot be greater than To Date"),
			indicator: "red"
		});

		// Remove wrong date
		frappe.query_report.set_filter_value(fieldname, "");

		// Refresh automatically
		frappe.query_report.refresh();
	}
}