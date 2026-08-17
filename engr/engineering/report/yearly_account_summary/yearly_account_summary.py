# Copyright (c) 2025, Finbyz Tech. Pvt. Ltd. and contributors
# For license information, please see license.txt

# import frappe

import frappe
from erpnext.accounts.report.financial_statements import get_period_list, get_data

def execute(filters=None):
    columns = [
        {
            "label": "Account",
            "fieldname": "account",
            "fieldtype": "Link",
            "options": "Account",
            "width": 200
        },
        {
            "label": "Debit",
            "fieldname": "debit",
            "fieldtype": "Currency",
            "width": 120
        },
        {
            "label": "Credit",
            "fieldname": "credit",
            "fieldtype": "Currency",
            "width": 120
        },
        {
            "label": "Amount in PNL",
            "fieldname": "amount_in_pnl",
            "fieldtype": "Currency",
            "width": 120
        },
        {
            "label": "Difference",
            "fieldname": "difference",
            "fieldtype": "Currency",
            "width": 120
        }
    ]

    data = []
    pnl_map = {}
    if filters and filters.get("fiscal_year") and filters.get("company"):
        fiscal_year = frappe.get_doc("Fiscal Year", filters["fiscal_year"])
        from_date = fiscal_year.year_start_date
        to_date = fiscal_year.year_end_date

        # Fetch P&L data for the fiscal year and company
        period_list = get_period_list(
            filters["fiscal_year"], filters["fiscal_year"], from_date, to_date,
            "Fiscal Year", "Yearly", company=filters["company"]
        )
        # Income accounts
        income_data = get_data(
            filters["company"], "Income", "Credit", period_list,
            filters=filters, accumulated_values=1, ignore_closing_entries=True, ignore_accumulated_values_for_fy=True
        )
        # Expense accounts
        expense_data = get_data(
            filters["company"], "Expense", "Debit", period_list,
            filters=filters, accumulated_values=1, ignore_closing_entries=True, ignore_accumulated_values_for_fy=True
        )
        # Map account to total for the year
        for row in (income_data or []):
            if row.get("account") and row.get("total") is not None:
                pnl_map[row["account"]] = row["total"]
        for row in (expense_data or []):
            if row.get("account") and row.get("total") is not None:
                pnl_map[row["account"]] = row["total"]

        # Main report data
        data = frappe.db.sql('''
            SELECT
                gle.account,
                SUM(gle.debit) AS debit,
                SUM(gle.credit) AS credit
            FROM
                `tabGL Entry` gle
            WHERE
                gle.company = %s
                AND gle.posting_date BETWEEN %s AND %s
                AND gle.voucher_type = 'Period Closing Voucher'
                AND is_cancelled = 0
            GROUP BY
                gle.account
            ORDER BY
                gle.account
        ''', (filters["company"], from_date, to_date), as_dict=True)

        # Add Amount in PNL and Difference columns
        for row in data:
            row["amount_in_pnl"] = pnl_map.get(row["account"], 0)
            row["difference"] = abs(abs(row["debit"] - row["credit"]) - abs(row["amount_in_pnl"]))

    return columns, data
