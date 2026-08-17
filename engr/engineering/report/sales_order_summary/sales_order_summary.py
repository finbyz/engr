import frappe
from frappe import _
from frappe.utils import getdate, add_months, get_first_day, get_last_day, nowdate
import calendar


ROW_STATUSES = [
    "On Hold",
    "To Deliver and Bill",
    "To Bill",
    "To Deliver",
    "Completed",
    "Proforma Raised",
    "Closed",
]


STATUS_COLORS = {
    "On Hold": "#6c757d",
    "To Deliver and Bill": "#5e64ff",
    "To Bill": "#ffa00a",
    "To Deliver": "#28a745",
    "Completed": "#00BCD4",
    "Proforma Raised": "#9c27b0",
    "Closed": "#ff5858",
}


# =========================================================
# EXECUTE
# =========================================================

def execute(filters=None):

    filters = frappe._dict(filters or {})

    from_date = getdate(
        filters.get("from_date") or add_months(nowdate(), -12)
    )

    to_date = getdate(
        filters.get("to_date") or nowdate()
    )

    period_type = filters.get("period") or "Monthly"

    chart_type = filters.get("chart_type") or "Bar"

    periods = get_periods(from_date, to_date, period_type)

    counts = fetch_counts(filters, from_date, to_date, periods)

    columns = get_columns(periods)

    data = get_data(filters, periods, counts)

    chart = get_chart(periods, counts, chart_type)

    return columns, data, None, chart


# =========================================================
# COLUMNS
# Each period gets two columns: Orders (count) + Amount INR
# =========================================================

def get_columns(periods):

    columns = [
        {
            "label": _("Status"),
            "fieldname": "status",
            "fieldtype": "Data",
            "width": 220,
        }
    ]

    for p in periods:

        # --- Orders (count) sub-column ---
        columns.append({
            "label": _(f"{p['label']} | Orders"),
            "fieldname": f"{p['key']}_orders",
            "fieldtype": "Int",
            "width": 110,
        })

        # --- Amount (INR) sub-column ---
        columns.append({
            "label": _(f"{p['label']} | Amount (INR)"),
            "fieldname": f"{p['key']}_amount",
            "fieldtype": "Currency",
            "options": "INR",
            "width": 150,
        })

    return columns


# =========================================================
# PERIODS
# =========================================================

def get_periods(from_date, to_date, period_type):

    periods = []

    # -----------------------------------------------------
    # MONTHLY
    # -----------------------------------------------------

    if period_type == "Monthly":

        current = getdate(get_first_day(from_date))

        while current <= to_date:

            p_end = getdate(get_last_day(current))

            if p_end > to_date:
                p_end = to_date

            label = current.strftime("%b %Y")

            key = "m_" + current.strftime("%b_%Y")

            periods.append({
                "label": label,
                "from": current,
                "to": p_end,
                "key": key
            })

            current = getdate(add_months(current, 1))

    # -----------------------------------------------------
    # QUARTERLY
    # -----------------------------------------------------

    elif period_type == "Quarterly":

        year = from_date.year
        month = from_date.month

        qs = ((month - 1) // 3) * 3 + 1

        current = getdate(f"{year}-{qs:02d}-01")

        while current <= to_date:

            q_num = (current.month - 1) // 3 + 1

            end_month = current.month + 2

            end_day = calendar.monthrange(current.year, end_month)[1]

            p_end = getdate(
                f"{current.year}-{end_month:02d}-{end_day:02d}"
            )

            if p_end > to_date:
                p_end = to_date

            label = f"Q{q_num} {current.year}"

            key = f"Q{q_num}_{current.year}"

            periods.append({
                "label": label,
                "from": current,
                "to": p_end,
                "key": key
            })

            current = getdate(add_months(current, 3))

    # -----------------------------------------------------
    # HALF YEARLY
    # -----------------------------------------------------

    elif period_type == "Half Yearly":

        year = from_date.year

        month = from_date.month

        hs = 1 if month <= 6 else 7

        current = getdate(f"{year}-{hs:02d}-01")

        while current <= to_date:

            h_num = 1 if current.month <= 6 else 2

            end_month = 6 if current.month <= 6 else 12

            end_day = calendar.monthrange(current.year, end_month)[1]

            p_end = getdate(
                f"{current.year}-{end_month:02d}-{end_day:02d}"
            )

            if p_end > to_date:
                p_end = to_date

            label = f"H{h_num} {current.year}"

            key = f"H{h_num}_{current.year}"

            periods.append({
                "label": label,
                "from": current,
                "to": p_end,
                "key": key
            })

            current = getdate(add_months(current, 6))

    # -----------------------------------------------------
    # YEARLY
    # -----------------------------------------------------

    elif period_type == "Yearly":

        year = from_date.year

        current = getdate(f"{year}-01-01")

        while current <= to_date:

            p_end = getdate(f"{current.year}-12-31")

            if p_end > to_date:
                p_end = to_date

            label = str(current.year)

            key = f"Y_{current.year}"

            periods.append({
                "label": label,
                "from": current,
                "to": p_end,
                "key": key
            })

            current = getdate(f"{current.year + 1}-01-01")

    return periods


# =========================================================
# FETCH COUNTS
# Now fetches both COUNT(DISTINCT name) and SUM(net_total)
# Excludes Sales Orders raised against Internal Customers
# =========================================================

def fetch_counts(filters, from_date, to_date, periods):

    product_groups = filters.get("product_group") or []

    if isinstance(product_groups, str):
        product_groups = [product_groups]

    conditions = ""

    query_filters = {
        "from_date": from_date,
        "to_date": to_date,
        "statuses": tuple(ROW_STATUSES),
    }

    # -----------------------------------------------------
    # PRODUCT GROUP FILTER
    # -----------------------------------------------------

    if product_groups:

        conditions += """
        AND EXISTS (
            SELECT 1
            FROM `tabSales Team` st
            WHERE st.parent = so.name
            AND st.product_group IN %(product_groups)s
        )
        """

        query_filters["product_groups"] = tuple(product_groups)

    raw = frappe.db.sql(
        f"""
        SELECT
            so.status,
            so.transaction_date,
            COUNT(DISTINCT so.name)  AS cnt,
            SUM(so.base_net_total)        AS total_amount

        FROM `tabSales Order` so

        INNER JOIN `tabCustomer` cust
            ON cust.name = so.customer

        WHERE
            so.docstatus < 2
            AND so.transaction_date BETWEEN %(from_date)s AND %(to_date)s
            AND so.status IN %(statuses)s
            AND IFNULL(cust.is_internal_customer, 0) = 0

            {conditions}

        GROUP BY so.status, so.transaction_date
        """,
        query_filters,
        as_dict=True,
    )

    # counts[status][period_key] = {"orders": N, "amount": X}
    counts = {
        s: {
            p["key"]: {"orders": 0, "amount": 0.0}
            for p in periods
        }
        for s in ROW_STATUSES
    }

    for row in raw:

        txn_date = getdate(row["transaction_date"])

        for p in periods:

            if p["from"] <= txn_date <= p["to"]:

                if row["status"] in counts:

                    counts[row["status"]][p["key"]]["orders"] += row["cnt"]
                    counts[row["status"]][p["key"]]["amount"] += (row["total_amount"] or 0.0)

                break

    return counts


# =========================================================
# TABLE DATA
# =========================================================

def get_data(filters, periods, counts):

    status_filter = filters.get("status") or []

    if isinstance(status_filter, str):
        status_filter = [status_filter]

    allowed = (
        [s for s in ROW_STATUSES if s in status_filter]
        if status_filter
        else ROW_STATUSES
    )

    data = []

    # -----------------------------------------------------
    # STATUS ROWS
    # -----------------------------------------------------

    for status in allowed:

        row = {"status": status}

        for p in periods:

            row[f"{p['key']}_orders"] = counts[status][p["key"]]["orders"]
            row[f"{p['key']}_amount"] = counts[status][p["key"]]["amount"]

        data.append(row)

    # -----------------------------------------------------
    # TOTAL ROW
    # -----------------------------------------------------

    total_row = {"status": "Total"}

    for p in periods:

        total_row[f"{p['key']}_orders"] = sum(
            counts[s][p["key"]]["orders"] for s in allowed
        )

        total_row[f"{p['key']}_amount"] = sum(
            counts[s][p["key"]]["amount"] for s in allowed
        )

    data.append(total_row)

    return data


# =========================================================
# CHART  (uses order counts for the chart, same as before)
# =========================================================

def get_chart(periods, counts, chart_type):

    labels = [p["label"] for p in periods]

    # -----------------------------------------------------
    # PIE / DONUT
    # -----------------------------------------------------

    if chart_type in ("Pie", "Donut"):

        totals = {
            s: sum(counts[s][p["key"]]["orders"] for p in periods)
            for s in ROW_STATUSES
        }

        active = {s: v for s, v in totals.items() if v > 0}

        return {
            "data": {
                "labels": list(active.keys()),
                "datasets": [{"values": list(active.values())}],
            },
            "type": chart_type.lower(),
            "colors": [STATUS_COLORS[s] for s in active],
        }

    # -----------------------------------------------------
    # BAR / LINE / STACKED BAR
    # -----------------------------------------------------

    datasets = []
    colors = []

    for status in ROW_STATUSES:

        values = [counts[status][p["key"]]["orders"] for p in periods]

        if any(v > 0 for v in values):

            datasets.append({"name": status, "values": values})
            colors.append(STATUS_COLORS[status])

    chart = {
        "data": {
            "labels": labels,
            "datasets": datasets,
        },
        "type": "line" if chart_type == "Line" else "bar",
        "colors": colors,
    }

    if chart_type == "Stacked Bar":

        chart["barOptions"] = {"stacked": True}

    return chart

##############################################################################################


# Copyright (c) 2026, Finbyz Tech. Pvt. Ltd. and contributors
# For license information, please see license.txt

# import frappe
# from frappe import _
# from frappe.utils import getdate, add_months, get_first_day, get_last_day, nowdate
# import calendar


# ROW_STATUSES = [
#     "On Hold",
#     "To Deliver and Bill",
#     "To Bill",
#     "To Deliver",
#     "Completed",
#     "Proforma Raised",
#     "Closed",
# ]


# STATUS_COLORS = {
#     "On Hold": "#6c757d",
#     "To Deliver and Bill": "#5e64ff",
#     "To Bill": "#ffa00a",
#     "To Deliver": "#28a745",
#     "Completed": "#00BCD4",
#     "Proforma Raised": "#9c27b0",
#     "Closed": "#ff5858",
# }


# # =========================================================
# # EXECUTE
# # =========================================================

# def execute(filters=None):

#     filters = frappe._dict(filters or {})

#     from_date = getdate(
#         filters.get("from_date") or add_months(nowdate(), -12)
#     )

#     to_date = getdate(
#         filters.get("to_date") or nowdate()
#     )

#     period_type = filters.get("period") or "Monthly"

#     chart_type = filters.get("chart_type") or "Bar"

#     periods = get_periods(from_date, to_date, period_type)

#     counts = fetch_counts(filters, from_date, to_date, periods)

#     columns = get_columns(periods)

#     data = get_data(filters, periods, counts)

#     chart = get_chart(periods, counts, chart_type)

#     return columns, data, None, chart


# # =========================================================
# # COLUMNS
# # =========================================================

# def get_columns(periods):

#     columns = [
#         {
#             "label": _("Status"),
#             "fieldname": "status",
#             "fieldtype": "Data",
#             "width": 220,
#         }
#     ]

#     for p in periods:

#         columns.append({
#             "label": _(p["label"]),
#             "fieldname": p["key"],
#             "fieldtype": "Float",
#             "width": 120,
#         })

#     return columns


# # =========================================================
# # PERIODS
# # =========================================================

# def get_periods(from_date, to_date, period_type):

#     periods = []

#     # -----------------------------------------------------
#     # MONTHLY
#     # -----------------------------------------------------

#     if period_type == "Monthly":

#         current = getdate(get_first_day(from_date))

#         while current <= to_date:

#             p_end = getdate(get_last_day(current))

#             if p_end > to_date:
#                 p_end = to_date

#             label = current.strftime("%b %Y")

#             key = "m_" + current.strftime("%b_%Y")

#             periods.append({
#                 "label": label,
#                 "from": current,
#                 "to": p_end,
#                 "key": key
#             })

#             current = getdate(add_months(current, 1))

#     # -----------------------------------------------------
#     # QUARTERLY
#     # -----------------------------------------------------

#     elif period_type == "Quarterly":

#         year = from_date.year
#         month = from_date.month

#         qs = ((month - 1) // 3) * 3 + 1

#         current = getdate(f"{year}-{qs:02d}-01")

#         while current <= to_date:

#             q_num = (current.month - 1) // 3 + 1

#             end_month = current.month + 2

#             end_day = calendar.monthrange(current.year, end_month)[1]

#             p_end = getdate(
#                 f"{current.year}-{end_month:02d}-{end_day:02d}"
#             )

#             if p_end > to_date:
#                 p_end = to_date

#             label = f"Q{q_num} {current.year}"

#             key = f"Q{q_num}_{current.year}"

#             periods.append({
#                 "label": label,
#                 "from": current,
#                 "to": p_end,
#                 "key": key
#             })

#             current = getdate(add_months(current, 3))

#     # -----------------------------------------------------
#     # HALF YEARLY
#     # -----------------------------------------------------

#     elif period_type == "Half Yearly":

#         year = from_date.year

#         month = from_date.month

#         hs = 1 if month <= 6 else 7

#         current = getdate(f"{year}-{hs:02d}-01")

#         while current <= to_date:

#             h_num = 1 if current.month <= 6 else 2

#             end_month = 6 if current.month <= 6 else 12

#             end_day = calendar.monthrange(current.year, end_month)[1]

#             p_end = getdate(
#                 f"{current.year}-{end_month:02d}-{end_day:02d}"
#             )

#             if p_end > to_date:
#                 p_end = to_date

#             label = f"H{h_num} {current.year}"

#             key = f"H{h_num}_{current.year}"

#             periods.append({
#                 "label": label,
#                 "from": current,
#                 "to": p_end,
#                 "key": key
#             })

#             current = getdate(add_months(current, 6))

#     # -----------------------------------------------------
#     # YEARLY
#     # -----------------------------------------------------

#     elif period_type == "Yearly":

#         year = from_date.year

#         current = getdate(f"{year}-01-01")

#         while current <= to_date:

#             p_end = getdate(f"{current.year}-12-31")

#             if p_end > to_date:
#                 p_end = to_date

#             label = str(current.year)

#             key = f"Y_{current.year}"

#             periods.append({
#                 "label": label,
#                 "from": current,
#                 "to": p_end,
#                 "key": key
#             })

#             current = getdate(f"{current.year + 1}-01-01")

#     return periods


# # =========================================================
# # FETCH COUNTS
# # =========================================================

# def fetch_counts(filters, from_date, to_date, periods):

#     product_groups = filters.get("product_group") or []

#     if isinstance(product_groups, str):
#         product_groups = [product_groups]

#     conditions = ""

#     query_filters = {
#         "from_date": from_date,
#         "to_date": to_date,
#         "statuses": tuple(ROW_STATUSES),
#     }

#     # -----------------------------------------------------
#     # PRODUCT GROUP FILTER
#     # -----------------------------------------------------

#     if product_groups:

#         conditions += """
#         AND EXISTS (
#             SELECT 1
#             FROM `tabSales Team` st
#             WHERE st.parent = so.name
#             AND st.product_group IN %(product_groups)s
#         )
#         """

#         query_filters["product_groups"] = tuple(product_groups)

#     raw = frappe.db.sql(
#         f"""
#         SELECT
#             so.status,
#             so.transaction_date,
#             COUNT(DISTINCT so.name) AS cnt

#         FROM `tabSales Order` so

#         WHERE
#             so.docstatus < 2
#             AND so.transaction_date BETWEEN %(from_date)s AND %(to_date)s
#             AND so.status IN %(statuses)s

#             {conditions}

#         GROUP BY so.status, so.transaction_date
#         """,
#         query_filters,
#         as_dict=True,
#     )

#     counts = {
#         s: {p["key"]: 0 for p in periods}
#         for s in ROW_STATUSES
#     }

#     for row in raw:

#         txn_date = getdate(row["transaction_date"])

#         for p in periods:

#             if p["from"] <= txn_date <= p["to"]:

#                 if row["status"] in counts:

#                     counts[row["status"]][p["key"]] += row["cnt"]

#                 break

#     return counts


# # =========================================================
# # TABLE DATA
# # =========================================================

# def get_data(filters, periods, counts):

#     status_filter = filters.get("status") or []

#     if isinstance(status_filter, str):
#         status_filter = [status_filter]

#     allowed = (
#         [s for s in ROW_STATUSES if s in status_filter]
#         if status_filter
#         else ROW_STATUSES
#     )

#     data = []

#     # -----------------------------------------------------
#     # STATUS ROWS
#     # -----------------------------------------------------

#     for status in allowed:

#         row = {
#             "status": status
#         }

#         for p in periods:

#             row[p["key"]] = counts[status][p["key"]]

#         data.append(row)

#     # -----------------------------------------------------
#     # TOTAL ROW
#     # -----------------------------------------------------

#     total_row = {
#         "status": "Total"
#     }

#     for p in periods:

#         total_row[p["key"]] = sum(
#             counts[s][p["key"]]
#             for s in allowed
#         )

#     data.append(total_row)

#     return data


# # =========================================================
# # CHART
# # =========================================================

# def get_chart(periods, counts, chart_type):

#     labels = [p["label"] for p in periods]

#     # -----------------------------------------------------
#     # PIE / DONUT
#     # -----------------------------------------------------

#     if chart_type in ("Pie", "Donut"):

#         totals = {
#             s: sum(counts[s][p["key"]] for p in periods)
#             for s in ROW_STATUSES
#         }

#         active = {
#             s: v
#             for s, v in totals.items()
#             if v > 0
#         }

#         return {
#             "data": {
#                 "labels": list(active.keys()),
#                 "datasets": [
#                     {
#                         "values": list(active.values())
#                     }
#                 ],
#             },
#             "type": chart_type.lower(),
#             "colors": [
#                 STATUS_COLORS[s]
#                 for s in active
#             ],
#         }

#     # -----------------------------------------------------
#     # BAR / LINE
#     # -----------------------------------------------------

#     datasets = []

#     colors = []

#     for status in ROW_STATUSES:

#         values = [
#             counts[status][p["key"]]
#             for p in periods
#         ]

#         if any(v > 0 for v in values):

#             datasets.append({
#                 "name": status,
#                 "values": values
#             })

#             colors.append(STATUS_COLORS[status])

#     chart = {
#         "data": {
#             "labels": labels,
#             "datasets": datasets,
#         },
#         "type": "line" if chart_type == "Line" else "bar",
#         "colors": colors,
#     }

#     if chart_type == "Stacked Bar":

#         chart["barOptions"] = {
#             "stacked": True
#         }

#     return chart