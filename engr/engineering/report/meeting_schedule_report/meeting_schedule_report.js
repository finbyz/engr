




// Copyright (c) 2026, Finbyz Tech. Pvt. Ltd. and contributors
// For license information, please see license.txt
/* eslint-disable */

frappe.query_reports["Meeting Schedule Report"] = {
	filters: [
		// ── Date Range ──────────────────────────────────────────────────────
		{
			fieldname: "from_date",
			label: __("From Date"),
			fieldtype: "Date",
			default: frappe.datetime.add_months(frappe.datetime.get_today(), -1),
			reqd: 1,
		},
		{
			fieldname: "to_date",
			label: __("To Date"),
			fieldtype: "Date",
			default: frappe.datetime.get_today(),
			reqd: 1,
		},

		// ── Period Type ─────────────────────────────────────────────────────
		{
			fieldname: "period",
			label: __("Period"),
			fieldtype: "Select",
			options: "\nMonthly\nQuarterly\nHalf Yearly\nYearly",
			default: "Monthly",
		},

		// ── User Filter ─────────────────────────────────────────────────────
		{
			fieldname: "user",
			label: __("User"),
			fieldtype: "Link",
			options: "User",
		},

		// ── Group By Filter ─────────────────────────────────────────────────
		{
			fieldname: "group_by",
			label: __("Group By"),
			fieldtype: "Select",
			options: "\nGroup By Customer\nGroup By Grade\nGroup By Employee",
			default: "",
		},
	],

	// ── Column formatter ────────────────────────────────────────────────────
	formatter: function (value, row, column, data, default_formatter) {
		value = default_formatter(value, row, column, data);

		if (!data) return value;

		// Highlight "Total Scheduled" / "Scheduled" in blue
		if (column.fieldname === "total_scheduled" || column.fieldname === "scheduled") {
			value = `<span style="color:#1565c0; font-weight:600;">${value}</span>`;
		}

		// Highlight "Total Meetings" / "Actual" in green
		if (column.fieldname === "total_meetings" || column.fieldname === "actual") {
			value = `<span style="color:#2e7d32; font-weight:600;">${value}</span>`;
		}

		// Color "Achievement %" based on performance
		if (column.fieldname === "achievement") {
			const num = parseFloat(data.achievement) || 0;
			const color = num >= 75 ? "#2e7d32" : num >= 40 ? "#ef6c00" : "#c62828";
			value = `<span style="color:${color}; font-weight:600;">${value}%</span>`;
		}

		// Dim zero values in period columns so non-zero stand out
		if (
			column.fieldname &&
			(column.fieldname.startsWith("m_") ||
				column.fieldname.startsWith("q") ||
				column.fieldname.startsWith("h") ||
				column.fieldname.startsWith("yr_")) &&
			(value === "0" || value === 0)
		) {
			value = `<span style="color:#bdbdbd;">0</span>`;
		}

		return value;
	},
};