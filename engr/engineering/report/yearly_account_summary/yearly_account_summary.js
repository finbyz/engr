// Copyright (c) 2025, Finbyz Tech. Pvt. Ltd. and contributors
// For license information, please see license.txt
/* eslint-disable */



frappe.query_reports["Yearly Account Summary"] = {
    "filters": [
        {
            "fieldname": "company",
            "label": "Company",
            "fieldtype": "Link",
            "options": "Company",
            "reqd": 1
        },
        {
            "fieldname": "fiscal_year",
            "label": "Fiscal Year",
            "fieldtype": "Link",
            "options": "Fiscal Year",
            "reqd": 1
        }
    ]
};
