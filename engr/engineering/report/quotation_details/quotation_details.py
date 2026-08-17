# Copyright (c) 2026, Finbyz Tech. Pvt. Ltd. and contributors
# For license information, please see license.txt

import frappe
from frappe import _


def execute(filters=None):
    columns = get_columns()
    data = get_data(filters)
    return columns, data


def get_columns():
    return [
        {
            "label": _("ID"),
            "fieldname": "name",
            "fieldtype": "Link",
            "options": "Quotation",
            "width": 160,
        },
        {
            "label": _("Customer Name"),
            "fieldname": "party_name",
            "fieldtype": "Data",
            "width": 200,
        },
        {
            "label": _("Date"),
            "fieldname": "transaction_date",
            "fieldtype": "Date",
            "width": 100,
        },
        {
            "label": _("Valid Up To"),
            "fieldname": "valid_till",
            "fieldtype": "Date",
            "width": 110,
        },
        {
            "label": _("Item Code"),
            "fieldname": "item_code",
            "fieldtype": "Link",
            "options": "Item",
            "width": 150,
        },
        {
            "label": _("QTY"),
            "fieldname": "qty",
            "fieldtype": "Float",
            "width": 80,
        },
        {
            "label": _("Rate"),
            "fieldname": "rate",
            "fieldtype": "Currency",
            "width": 110,
        },
        {
            "label": _("Amount"),
            "fieldname": "amount",
            "fieldtype": "Currency",
            "width": 130,
        },
        {
            "label": _("Item Group"),
            "fieldname": "item_group",
            "fieldtype": "Link",
            "options": "Item Group",
            "width": 130,
        },
        {
            "label": _("Age (Days)"),
            "fieldname": "age",
            "fieldtype": "Int",
            "width": 95,
        },
        {
            "label": _("Win Probability"),
            "fieldname": "win_probability",
            "fieldtype": "Percent",
            "width": 120,
        },
        {
            "label": _("Sales Person"),
            "fieldname": "sales_person",
            "fieldtype": "Data",
            "width": 160,
        },
        {
            "label": _("Product Group"),
            "fieldname": "product_group",
            "fieldtype": "Data",
            "width": 130,
        },
        {
            "label": _("Enquiry From Supplier"),
            "fieldname": "enquiry_from_supplier",
            "fieldtype": "Data",
            "width": 160,
        },
        {
            "label": _("Territory"),
            "fieldname": "territory",
            "fieldtype": "Link",
            "options": "Territory",
            "width": 120,
        },
        {
            "label": _("Status"),
            "fieldname": "status",
            "fieldtype": "Data",
            "width": 120,
        },
    ]


def get_data(filters):
    conditions, values = get_conditions(filters)

    data = frappe.db.sql(
        """
        SELECT
            q.name,
            q.party_name,
            q.transaction_date,
            q.valid_till,
            qi.item_code,
            qi.qty,
            qi.rate,
            qi.amount,
            qi.item_group,
            DATEDIFF(CURDATE(), q.transaction_date)    AS age,
            IFNULL(q.win_probability, 0)               AS win_probability,
            (
                SELECT GROUP_CONCAT(st2.sales_person ORDER BY st2.idx SEPARATOR ', ')
                FROM `tabSales Team` st2
                WHERE st2.parent = q.name
                  AND st2.parenttype = 'Quotation'
            ) AS sales_person,
            (
                SELECT GROUP_CONCAT(st3.product_group ORDER BY st3.idx SEPARATOR ', ')
                FROM `tabSales Team` st3
                WHERE st3.parent = q.name
                  AND st3.parenttype = 'Quotation'
            ) AS product_group,
            IFNULL(q.enquiry_from_supplier, '')        AS enquiry_from_supplier,
            q.territory,
            q.status
        FROM
            `tabQuotation` q
        INNER JOIN
            `tabQuotation Item` qi ON qi.parent = q.name
                                   AND qi.parenttype = 'Quotation'
        WHERE
            q.docstatus < 2
            {conditions}
        ORDER BY
            q.transaction_date DESC, q.name, qi.idx
        """.format(
            conditions=conditions
        ),
        values,
        as_dict=True,
    )

    return data


def get_conditions(filters):
    conditions = ""
    values = {}

    if not filters:
        return conditions, values

    # Filter: Quotation ID
    if filters.get("name"):
        conditions += " AND q.name = %(name)s"
        values["name"] = filters["name"]

    # Filter: Customer Name
    if filters.get("customer"):
        conditions += " AND q.party_name = %(customer)s"
        values["customer"] = filters["customer"]

    if filters.get("internal_customer"):
        conditions += """
            AND q.party_name NOT IN (
                SELECT name
                FROM `tabCustomer`
                WHERE IFNULL(is_internal_customer, 0) = 1
            )
        """

    # Filter: From Date
    if filters.get("from_date"):
        conditions += " AND q.transaction_date >= %(from_date)s"
        values["from_date"] = filters["from_date"]

    # Filter: To Date
    if filters.get("to_date"):
        conditions += " AND q.transaction_date <= %(to_date)s"
        values["to_date"] = filters["to_date"]

    # Filter: Status (multi-select)
    if filters.get("status"):
        st = filters["status"]
        if isinstance(st, list) and len(st) > 0:
            conditions += " AND q.status IN %(status)s"
            values["status"] = tuple(st)
        elif isinstance(st, str) and st:
            conditions += " AND q.status = %(status)s"
            values["status"] = st

    # Filter: Sales Person (link filter — exact match from Sales Team child)
    if filters.get("sales_person"):
        conditions += (
            " AND q.name IN ("
            "  SELECT parent FROM `tabSales Team`"
            "  WHERE sales_person = %(sales_person)s"
            "    AND parenttype = 'Quotation'"
            ")"
        )
        values["sales_person"] = filters["sales_person"]

    # Filter: Product Group (multi-select — from Sales Team child table)
    if filters.get("product_group"):
        pg = filters["product_group"]
        if isinstance(pg, list) and len(pg) > 0:
            conditions += (
                " AND q.name IN ("
                "  SELECT parent FROM `tabSales Team`"
                "  WHERE product_group IN %(product_group)s"
                "    AND parenttype = 'Quotation'"
                ")"
            )
            values["product_group"] = tuple(pg)
        elif isinstance(pg, str) and pg:
            conditions += (
                " AND q.name IN ("
                "  SELECT parent FROM `tabSales Team`"
                "  WHERE product_group = %(product_group)s"
                "    AND parenttype = 'Quotation'"
                ")"
            )
            values["product_group"] = pg

    return conditions, values