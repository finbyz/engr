
// Copyright (c) 2026, Finbyz Tech. Pvt. Ltd. and contributors
// For license information, please see license.txt
/* eslint-disable */

frappe.query_reports["Sales Order Summary"] = {

	filters: [

		{
			fieldname: "from_date",
			label: __("From Date"),
			fieldtype: "Date",
			default: frappe.datetime.add_months(frappe.datetime.get_today(), -12),
			reqd: 1
		},

		{
			fieldname: "to_date",
			label: __("To Date"),
			fieldtype: "Date",
			default: frappe.datetime.get_today(),
			reqd: 1
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
					{ value: "On Hold",description: "" },
					{ value: "To Deliver and Bill",description: "" },
					{ value: "To Bill",description: "" },
					{ value: "To Deliver",description: "" },
					{ value: "Completed",description: "" },
					{ value: "Proforma Raised",description: "" },
					{ value: "Closed",description: "" }
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

				return [
					{ value: "PMG",description: "" },
					{ value: "SAG",description: "" },
					{ value: "HCG",description: "" },
					{ value: "HFG",description: "" },
					{ value: "Internal",description: "" },
					{ value: "Others",description: "" }
				].filter(function (d) {

					return !txt || d.value.toLowerCase().includes(txt.toLowerCase());

				});
			}
		}
	],

	onload: function (report) {

		report.page.fields_dict["period"].df.onchange = function () {
			report.refresh();
		};

		report.page.fields_dict["chart_type"].df.onchange = function () {
			report.refresh();
		};

		report.page.fields_dict["status"].df.onchange = function () {
			report.refresh();
		};

		report.page.fields_dict["product_group"].df.onchange = function () {
			report.refresh();
		};
	},

	after_datatable_render: function () {

		const rows = document.querySelectorAll(".dt-row");

		rows.forEach(function (row) {

			const cell = row.querySelector(".dt-cell--0-0 .dt-cell__content");

			if (cell && cell.innerText.trim() === "Total") {

				row.style.fontWeight = "bold";
				row.style.background = "var(--subtle-accent)";
			}
		});
	}
};