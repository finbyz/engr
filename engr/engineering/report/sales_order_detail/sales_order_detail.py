# import frappe
# from frappe import _


# def execute(filters=None):
#     columns = get_columns()
#     data = get_data(filters)
#     return columns, data


# def get_columns():
#     return [
#         {
#             "label": _("ID"),
#             "fieldname": "name",
#             "fieldtype": "Link",
#             "options": "Sales Order",
#             "width": 160,
#         },
#         {
#             "label": _("Customer Name"),
#             "fieldname": "customer",
#             "fieldtype": "Link",
#             "options": "Customer",
#             "width": 200,
#         },
#         {
#             "label": _("Date"),
#             "fieldname": "transaction_date",
#             "fieldtype": "Date",
#             "width": 100,
#         },
#         {
#             "label": _("Territory"),
#             "fieldname": "territory",
#             "fieldtype": "Link",
#             "options": "Territory",
#             "width": 120,
#         },
#         {
#             "label": _("Item Code"),
#             "fieldname": "item_code",
#             "fieldtype": "Link",
#             "options": "Item",
#             "width": 150,
#         },
#         {
#             "label": _("Item Group"),
#             "fieldname": "item_group",
#             "fieldtype": "Link",
#             "options": "Item Group",
#             "width": 130,
#         },
#         {
#             "label": _("Delivery Date"),
#             "fieldname": "delivery_date",
#             "fieldtype": "Date",
#             "width": 110,
#         },
#         {
#             "label": _("QTY"),
#             "fieldname": "qty",
#             "fieldtype": "Float",
#             "width": 80,
#         },
#         {
#             "label": _("Rate"),
#             "fieldname": "rate",
#             "fieldtype": "Currency",
#             "width": 110,
#         },
#         {
#             "label": _("Amount"),
#             "fieldname": "amount",
#             "fieldtype": "Currency",
#             "width": 130,
#         },
#         {
#             "label": _("Delivered QTY"),
#             "fieldname": "delivered_qty",
#             "fieldtype": "Float",
#             "width": 110,
#         },
#         {
#             "label": _("Pending QTY"),
#             "fieldname": "pending_qty",
#             "fieldtype": "Float",
#             "width": 100,
#         },
#         {
#             "label": _("Pending Amount"),
#             "fieldname": "pending_amount",
#             "fieldtype": "Currency",
#             "width": 130,
#         },
#         {
#             "label": _("MR No"),
#             "fieldname": "mr_no",
#             "fieldtype": "Link",
#             "options": "Material Request",
#             "width": 150,
#         },
#         {
#             "label": _("MR QTY"),
#             "fieldname": "mr_qty",
#             "fieldtype": "Float",
#             "width": 90,
#         },
#         {
#             "label": _("PO No"),
#             "fieldname": "po_no",
#             "fieldtype": "Link",
#             "options": "Purchase Order",
#             "width": 160,
#         },
#         {
#             "label": _("PO QTY"),
#             "fieldname": "po_qty",
#             "fieldtype": "Float",
#             "width": 90,
#         },
#         {
#             "label": _("Age (Days)"),
#             "fieldname": "age",
#             "fieldtype": "Int",
#             "width": 95,
#         },
#         {
#             "label": _("Status"),
#             "fieldname": "status",
#             "fieldtype": "Data",
#             "width": 130,
#         },
#         {
#             "label": _("Sales Person"),
#             "fieldname": "sales_person",
#             "fieldtype": "Data",
#             "width": 160,
#         },
#         {
#             "label": _("Product Group"),
#             "fieldname": "product_group",
#             "fieldtype": "Data",
#             "width": 130,
#         },
#     ]


# def get_data(filters):
#     conditions, values = get_conditions(filters)

#     data = frappe.db.sql(
#         """
#         SELECT
#             so.name,
#             so.customer,
#             so.transaction_date,
#             so.territory,
#             soi.item_code,
#             soi.item_group,
#             soi.delivery_date,
#             soi.qty,
#             soi.rate,
#             soi.amount,
#             soi.delivered_qty,
#             (soi.qty - soi.delivered_qty)               AS pending_qty,
#             ((soi.qty - soi.delivered_qty) * soi.rate)  AS pending_amount,

#             /* MR No — look up Material Request Item child table via sales_order field */
#             (
#                 SELECT GROUP_CONCAT(DISTINCT mri.parent ORDER BY mri.parent SEPARATOR ', ')
#                 FROM `tabMaterial Request Item` mri
#                 WHERE mri.sales_order = so.name
#                   AND mri.item_code   = soi.item_code
#             ) AS mr_no,

#             /* MR QTY — total qty across all matching MR items */
#             (
#                 SELECT IFNULL(SUM(mri.qty), 0)
#                 FROM `tabMaterial Request Item` mri
#                 WHERE mri.sales_order = so.name
#                   AND mri.item_code   = soi.item_code
#             ) AS mr_qty,

#             /* PO No — Purchase Order name from PO Item child table via sales_order field */
#             (
#                 SELECT GROUP_CONCAT(DISTINCT poi.parent ORDER BY poi.parent SEPARATOR ', ')
#                 FROM `tabPurchase Order Item` poi
#                 INNER JOIN `tabPurchase Order` po
#                     ON po.name = poi.parent AND po.docstatus = 1
#                 WHERE poi.sales_order = so.name
#                   AND poi.item_code   = soi.item_code
#             ) AS po_no,

#             /* PO QTY — total qty ordered across all linked submitted POs */
#             (
#                 SELECT IFNULL(SUM(poi.qty), 0)
#                 FROM `tabPurchase Order Item` poi
#                 INNER JOIN `tabPurchase Order` po
#                     ON po.name = poi.parent AND po.docstatus = 1
#                 WHERE poi.sales_order = so.name
#                   AND poi.item_code   = soi.item_code
#             ) AS po_qty,

#             DATEDIFF(CURDATE(), so.transaction_date) AS age,
#             so.status,
#             (
#                 SELECT GROUP_CONCAT(st2.sales_person ORDER BY st2.idx SEPARATOR ', ')
#                 FROM `tabSales Team` st2
#                 WHERE st2.parent = so.name
#                   AND st2.parenttype = 'Sales Order'
#             ) AS sales_person,
#             (
#                 SELECT GROUP_CONCAT(st3.product_group ORDER BY st3.idx SEPARATOR ', ')
#                 FROM `tabSales Team` st3
#                 WHERE st3.parent = so.name
#                   AND st3.parenttype = 'Sales Order'
#             ) AS product_group

#         FROM
#             `tabSales Order` so
#         INNER JOIN
#             `tabSales Order Item` soi ON soi.parent = so.name
#                                       AND soi.parenttype = 'Sales Order'
#         WHERE
#             so.docstatus = 1
#             {conditions}
#         ORDER BY
#             so.transaction_date DESC, so.name, soi.idx
#         """.format(
#             conditions=conditions
#         ),
#         values,
#         as_dict=True,
#     )

#     return data


# def get_conditions(filters):
#     conditions = ""
#     values = {}

#     if not filters:
#         return conditions, values

#     # Filter: Sales Order ID
#     if filters.get("name"):
#         conditions += " AND so.name = %(name)s"
#         values["name"] = filters["name"]
#     if filters.get("internal_customer"):
#         conditions += """
#             AND IFNULL(
#                 (SELECT is_internal_customer
#                 FROM `tabCustomer`
#                 WHERE name = so.customer),
#                 0
#             ) != 1
#         """
#     # Filter: Customer
#     if filters.get("customer"):
#         conditions += " AND so.customer = %(customer)s"
#         values["customer"] = filters["customer"]

#     # Filter: Item Code
#     if filters.get("item_code"):
#         conditions += " AND soi.item_code = %(item_code)s"
#         values["item_code"] = filters["item_code"]

#     # Filter: From Date
#     if filters.get("from_date"):
#         conditions += " AND so.transaction_date >= %(from_date)s"
#         values["from_date"] = filters["from_date"]

#     # Filter: To Date
#     if filters.get("to_date"):
#         conditions += " AND so.transaction_date <= %(to_date)s"
#         values["to_date"] = filters["to_date"]

#     # Filter: Product Group (multi-select — stored in Sales Team child table)
#     if filters.get("product_group"):
#         pg = filters["product_group"]
#         if isinstance(pg, list) and len(pg) > 0:
#             conditions += (
#                 " AND so.name IN ("
#                 "  SELECT parent FROM `tabSales Team`"
#                 "  WHERE product_group IN %(product_group)s"
#                 "    AND parenttype = 'Sales Order'"
#                 ")"
#             )
#             values["product_group"] = tuple(pg)
#         elif isinstance(pg, str) and pg:
#             conditions += (
#                 " AND so.name IN ("
#                 "  SELECT parent FROM `tabSales Team`"
#                 "  WHERE product_group = %(product_group)s"
#                 "    AND parenttype = 'Sales Order'"
#                 ")"
#             )
#             values["product_group"] = pg

#     # Filter: Status (multi-select)
#     if filters.get("status"):
#         st = filters["status"]
#         if isinstance(st, list) and len(st) > 0:
#             conditions += " AND so.status IN %(status)s"
#             values["status"] = tuple(st)
#         elif isinstance(st, str) and st:
#             conditions += " AND so.status = %(status)s"
#             values["status"] = st

#     return conditions, values




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
            "options": "Sales Order",
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
            "fieldname": "transaction_date",
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
            "label": _("Delivery Date"),
            "fieldname": "delivery_date",
            "fieldtype": "Date",
            "width": 110,
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
            "label": _("Delivered QTY"),
            "fieldname": "delivered_qty",
            "fieldtype": "Float",
            "width": 110,
        },
        {
            "label": _("Pending QTY"),
            "fieldname": "pending_qty",
            "fieldtype": "Float",
            "width": 100,
        },
        {
            "label": _("Pending Amount"),
            "fieldname": "pending_amount",
            "fieldtype": "Currency",
            "width": 130,
        },
        {
            "label": _("MR No"),
            "fieldname": "mr_no",
            "fieldtype": "Link",
            "options": "Material Request",
            "width": 150,
        },
        {
            "label": _("MR QTY"),
            "fieldname": "mr_qty",
            "fieldtype": "Float",
            "width": 90,
        },
        {
            "label": _("PO No"),
            "fieldname": "po_no",
            "fieldtype": "Link",
            "options": "Purchase Order",
            "width": 160,
        },
        {
            "label": _("PO QTY"),
            "fieldname": "po_qty",
            "fieldtype": "Float",
            "width": 90,
        },
        {
            "label": _("Age (Days)"),
            "fieldname": "age",
            "fieldtype": "Int",
            "width": 95,
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
    ]


def get_data(filters):
    conditions, values = get_conditions(filters)

    data = frappe.db.sql(
        """
        SELECT
            so.name,
            so.customer,
            so.transaction_date,
            so.territory,
            soi.item_code,
            soi.item_group,
            soi.delivery_date,
            soi.qty,
            soi.rate,
            soi.base_amount                            AS amount,
            soi.delivered_qty,
            (soi.qty - soi.delivered_qty)               AS pending_qty,
            ((soi.qty - soi.delivered_qty) * soi.rate)  AS pending_amount,

            /* MR No — look up Material Request Item child table via sales_order field */
            (
                SELECT GROUP_CONCAT(DISTINCT mri.parent ORDER BY mri.parent SEPARATOR ', ')
                FROM `tabMaterial Request Item` mri
                WHERE mri.sales_order = so.name
                  AND mri.item_code   = soi.item_code
            ) AS mr_no,

            /* MR QTY — total qty across all matching MR items */
            (
                SELECT IFNULL(SUM(mri.qty), 0)
                FROM `tabMaterial Request Item` mri
                WHERE mri.sales_order = so.name
                  AND mri.item_code   = soi.item_code
            ) AS mr_qty,

            /* PO No — Purchase Order name from PO Item child table via sales_order field */
            (
                SELECT GROUP_CONCAT(DISTINCT poi.parent ORDER BY poi.parent SEPARATOR ', ')
                FROM `tabPurchase Order Item` poi
                INNER JOIN `tabPurchase Order` po
                    ON po.name = poi.parent AND po.docstatus = 1
                WHERE poi.sales_order = so.name
                  AND poi.item_code   = soi.item_code
            ) AS po_no,

            /* PO QTY — total qty ordered across all linked submitted POs */
            (
                SELECT IFNULL(SUM(poi.qty), 0)
                FROM `tabPurchase Order Item` poi
                INNER JOIN `tabPurchase Order` po
                    ON po.name = poi.parent AND po.docstatus = 1
                WHERE poi.sales_order = so.name
                  AND poi.item_code   = soi.item_code
            ) AS po_qty,

            DATEDIFF(CURDATE(), so.transaction_date) AS age,
            so.status,
            (
                SELECT GROUP_CONCAT(st2.sales_person ORDER BY st2.idx SEPARATOR ', ')
                FROM `tabSales Team` st2
                WHERE st2.parent = so.name
                  AND st2.parenttype = 'Sales Order'
            ) AS sales_person,
            (
                SELECT GROUP_CONCAT(st3.product_group ORDER BY st3.idx SEPARATOR ', ')
                FROM `tabSales Team` st3
                WHERE st3.parent = so.name
                  AND st3.parenttype = 'Sales Order'
            ) AS product_group

        FROM
            `tabSales Order` so
        INNER JOIN
            `tabSales Order Item` soi ON soi.parent = so.name
                                      AND soi.parenttype = 'Sales Order'
        WHERE
            so.docstatus = 1
            {conditions}
        ORDER BY
            so.transaction_date DESC, so.name, soi.idx
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

    # Filter: Sales Order ID
    if filters.get("name"):
        conditions += " AND so.name = %(name)s"
        values["name"] = filters["name"]
    if filters.get("internal_customer"):
        conditions += """
            AND IFNULL(
                (SELECT is_internal_customer
                FROM `tabCustomer`
                WHERE name = so.customer),
                0
            ) != 1
        """
    # Filter: Customer
    if filters.get("customer"):
        conditions += " AND so.customer = %(customer)s"
        values["customer"] = filters["customer"]

    # Filter: Item Code
    if filters.get("item_code"):
        conditions += " AND soi.item_code = %(item_code)s"
        values["item_code"] = filters["item_code"]

    # Filter: From Date
    if filters.get("from_date"):
        conditions += " AND so.transaction_date >= %(from_date)s"
        values["from_date"] = filters["from_date"]

    # Filter: To Date
    if filters.get("to_date"):
        conditions += " AND so.transaction_date <= %(to_date)s"
        values["to_date"] = filters["to_date"]

    # Filter: Product Group (multi-select — stored in Sales Team child table)
    if filters.get("product_group"):
        pg = filters["product_group"]
        if isinstance(pg, list) and len(pg) > 0:
            conditions += (
                " AND so.name IN ("
                "  SELECT parent FROM `tabSales Team`"
                "  WHERE product_group IN %(product_group)s"
                "    AND parenttype = 'Sales Order'"
                ")"
            )
            values["product_group"] = tuple(pg)
        elif isinstance(pg, str) and pg:
            conditions += (
                " AND so.name IN ("
                "  SELECT parent FROM `tabSales Team`"
                "  WHERE product_group = %(product_group)s"
                "    AND parenttype = 'Sales Order'"
                ")"
            )
            values["product_group"] = pg

    # Filter: Status (multi-select)
    if filters.get("status"):
        st = filters["status"]
        if isinstance(st, list) and len(st) > 0:
            conditions += " AND so.status IN %(status)s"
            values["status"] = tuple(st)
        elif isinstance(st, str) and st:
            conditions += " AND so.status = %(status)s"
            values["status"] = st

    return conditions, values