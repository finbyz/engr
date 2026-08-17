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
            "options": "Sales Invoice",
            "width": 160,
        },
        {
            "label": _("Customer Name"),
            "fieldname": "customer",
            "fieldtype": "Link",
            "options": "Customer",
            "width": 200,
        },
        {
            "label": _("Date"),
            "fieldname": "posting_date",
            "fieldtype": "Date",
            "width": 100,
        },
        {
            "label": _("Territory"),
            "fieldname": "territory",
            "fieldtype": "Link",
            "options": "Territory",
            "width": 120,
        },
        {
            "label": _("Item Code"),
            "fieldname": "item_code",
            "fieldtype": "Link",
            "options": "Item",
            "width": 150,
        },
        {
            "label": _("Item Group"),
            "fieldname": "item_group",
            "fieldtype": "Link",
            "options": "Item Group",
            "width": 130,
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
            "label": _("Status"),
            "fieldname": "status",
            "fieldtype": "Data",
            "width": 130,
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
            "label": _("Customer PO No"),
            "fieldname": "po_no",
            "fieldtype": "Data",
            "width": 140,
        },
        {
            "label": _("Age (Days)"),
            "fieldname": "age",
            "fieldtype": "Int",
            "width": 95,
        },
    ]


def get_data(filters):
    conditions, values = get_conditions(filters)

    data = frappe.db.sql(
        """
        SELECT
            si.name,
            si.customer,
            si.posting_date,
            si.territory,
            sii.item_code,
            sii.item_group,
            sii.qty,
            sii.rate,
            sii.amount,
            si.status,
            (
                SELECT GROUP_CONCAT(st2.sales_person ORDER BY st2.idx SEPARATOR ', ')
                FROM `tabSales Team` st2
                WHERE st2.parent = si.name
                  AND st2.parenttype = 'Sales Invoice'
            ) AS sales_person,
            (
                SELECT GROUP_CONCAT(st3.product_group ORDER BY st3.idx SEPARATOR ', ')
                FROM `tabSales Team` st3
                WHERE st3.parent = si.name
                  AND st3.parenttype = 'Sales Invoice'
            ) AS product_group,
            si.po_no,
            DATEDIFF(CURDATE(), si.posting_date) AS age
        FROM
            `tabSales Invoice` si
        INNER JOIN
            `tabSales Invoice Item` sii ON sii.parent = si.name
                                       AND sii.parenttype = 'Sales Invoice'
        WHERE
            si.docstatus = 1
            {conditions}
        ORDER BY
            si.posting_date DESC, si.name, sii.idx
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

    # Filter: Customer
    if filters.get("customer"):
        conditions += " AND si.customer = %(customer)s"
        values["customer"] = filters["customer"]

    # Filter: From Date
    if filters.get("from_date"):
        conditions += " AND si.posting_date >= %(from_date)s"
        values["from_date"] = filters["from_date"]

    # Filter: To Date
    if filters.get("to_date"):
        conditions += " AND si.posting_date <= %(to_date)s"
        values["to_date"] = filters["to_date"]

    # Filter: Product Group (multi-select — stored in Sales Team child table)
    if filters.get("product_group"):
        pg = filters["product_group"]
        if isinstance(pg, list) and len(pg) > 0:
            conditions += (
                " AND si.name IN ("
                "  SELECT parent FROM `tabSales Team`"
                "  WHERE product_group IN %(product_group)s"
                "    AND parenttype = 'Sales Invoice'"
                ")"
            )
            values["product_group"] = tuple(pg)
        elif isinstance(pg, str) and pg:
            conditions += (
                " AND si.name IN ("
                "  SELECT parent FROM `tabSales Team`"
                "  WHERE product_group = %(product_group)s"
                "    AND parenttype = 'Sales Invoice'"
                ")"
            )
            values["product_group"] = pg

    # Filter: Status (multi-select)
    if filters.get("status"):
        st = filters["status"]
        if isinstance(st, list) and len(st) > 0:
            conditions += " AND si.status IN %(status)s"
            values["status"] = tuple(st)
        elif isinstance(st, str) and st:
            conditions += " AND si.status = %(status)s"
            values["status"] = st


    # Filter: Don't Show Internal Customer
    if filters.get("is_internal_customer"):
        conditions += """
            AND IFNULL(
                (SELECT is_internal_customer
                FROM `tabCustomer`
                WHERE name = si.customer),
                0
            ) != 1
        """
 
    return conditions, values