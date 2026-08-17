# import frappe
# from frappe import _
# from frappe.utils import getdate, add_months, get_first_day, get_last_day, nowdate
# import calendar

# ROW_STATUSES = ["Ordered", "Lost", "Open", "Expired", "Replied", "Partially Ordered"]

# STATUS_LABEL_MAP = {
#     "Ordered":           "Ordered",
#     "Lost":              "Lost",
#     "Open":              "Open",
#     "Expired":           "Expiry",
#     "Replied":           "Replied",
#     "Partially Ordered": "Partially Ordered",
# }

# STATUS_COLORS = {
#     "Ordered":           "#5e64ff",
#     "Lost":              "#ff5858",
#     "Open":              "#28a745",
#     "Expired":           "#ffa00a",
#     "Replied":           "#6c757d",
#     "Partially Ordered": "#ff00ff",
# }


# def execute(filters=None):
#     filters     = frappe._dict(filters or {})
#     from_date   = getdate(filters.get("from_date") or add_months(nowdate(), -12))
#     to_date     = getdate(filters.get("to_date")   or nowdate())
#     if from_date > to_date:
#         frappe.throw(_("From Date cannot be greater than To Date"))

#     period_type = filters.get("period")     or "Monthly"
#     chart_type  = filters.get("chart_type") or "Bar"

#     periods = get_periods(from_date, to_date, period_type)
#     counts  = fetch_counts(filters, from_date, to_date, periods)

#     columns = get_columns(periods)
#     data    = get_data(filters, periods, counts)
#     chart   = get_chart(periods, counts, chart_type)

#     return columns, data, None, chart


# # ──────────────────────────────────────────────
# # COLUMNS  — Orders + Amount per period
# # ──────────────────────────────────────────────
# def get_columns(periods):
#     columns = [
#         {
#             "label":     _("Status"),
#             "fieldname": "status",
#             "fieldtype": "Data",
#             "width":     160,
#         }
#     ]
#     for p in periods:
#         columns.append({
#             "label":     _(f"{p['label']} | Orders"),
#             "fieldname": f"{p['key']}__cnt",
#             "fieldtype": "Int",
#             "width":     110,
#         })
#         columns.append({
#             "label":     _(f"{p['label']} | Amount"),
#             "fieldname": f"{p['key']}__amt",
#             "fieldtype": "Currency",
#             "width":     150,
#         })
#     return columns


# # ──────────────────────────────────────────────
# # PERIODS  (unchanged)
# # ──────────────────────────────────────────────
# def get_periods(from_date, to_date, period_type):
#     periods = []

#     if period_type == "Monthly":
#         current = getdate(get_first_day(from_date))
#         while current <= to_date:
#             p_end = getdate(get_last_day(current))
#             if p_end > to_date:
#                 p_end = to_date
#             label = current.strftime("%b %Y")
#             key   = "m_" + current.strftime("%b_%Y")
#             periods.append({"label": label, "from": current, "to": p_end, "key": key})
#             current = getdate(add_months(current, 1))

#     elif period_type == "Quarterly":
#         year  = from_date.year
#         month = from_date.month
#         qs    = ((month - 1) // 3) * 3 + 1
#         current = getdate(f"{year}-{qs:02d}-01")
#         while current <= to_date:
#             q_num     = (current.month - 1) // 3 + 1
#             end_month = current.month + 2
#             end_day   = calendar.monthrange(current.year, end_month)[1]
#             p_end     = getdate(f"{current.year}-{end_month:02d}-{end_day:02d}")
#             if p_end > to_date:
#                 p_end = to_date
#             label = f"Q{q_num} {current.year}"
#             key   = f"Q{q_num}_{current.year}"
#             periods.append({"label": label, "from": current, "to": p_end, "key": key})
#             current = getdate(add_months(current, 3))

#     elif period_type == "Half Yearly":
#         year  = from_date.year
#         month = from_date.month
#         hs    = 1 if month <= 6 else 7
#         current = getdate(f"{year}-{hs:02d}-01")
#         while current <= to_date:
#             h_num     = 1 if current.month <= 6 else 2
#             end_month = 6 if current.month <= 6 else 12
#             end_day   = calendar.monthrange(current.year, end_month)[1]
#             p_end     = getdate(f"{current.year}-{end_month:02d}-{end_day:02d}")
#             if p_end > to_date:
#                 p_end = to_date
#             label = f"H{h_num} {current.year}"
#             key   = f"H{h_num}_{current.year}"
#             periods.append({"label": label, "from": current, "to": p_end, "key": key})
#             current = getdate(add_months(current, 6))

#     elif period_type == "Yearly":
#         year    = from_date.year
#         current = getdate(f"{year}-01-01")
#         while current <= to_date:
#             p_end = getdate(f"{current.year}-12-31")
#             if p_end > to_date:
#                 p_end = to_date
#             label = str(current.year)
#             key   = f"Y_{current.year}"
#             periods.append({"label": label, "from": current, "to": p_end, "key": key})
#             current = getdate(f"{current.year + 1}-01-01")

#     return periods


# # ──────────────────────────────────────────────
# # FETCH RAW COUNTS + AMOUNTS
# # ──────────────────────────────────────────────
# def fetch_counts(filters, from_date, to_date, periods):
#     product_groups = filters.get("product_group") or []
#     if isinstance(product_groups, str):
#         product_groups = [product_groups]

#     conditions   = ""
#     query_filters = {
#         "from_date": from_date,
#         "to_date":   to_date,
#         "statuses":  tuple(ROW_STATUSES),
#     }

#     if product_groups:
#         conditions += """
#         AND EXISTS (
#             SELECT 1
#             FROM `tabSales Team` st
#             WHERE st.parent = q.name
#               AND st.parenttype = 'Quotation'
#               AND st.product_group IN %(product_groups)s
#         )
#         """
#         query_filters["product_groups"] = tuple(product_groups)

#     raw = frappe.db.sql(
#         f"""
#         SELECT
#             q.status,
#             q.transaction_date,
#             COUNT(DISTINCT q.name)  AS cnt,
#             SUM(q.grand_total)      AS amt

#         FROM `tabQuotation` q

#         WHERE
#             q.docstatus < 2
#             AND q.transaction_date BETWEEN %(from_date)s AND %(to_date)s
#             AND q.status IN %(statuses)s
#             {conditions}

#         GROUP BY q.status, q.transaction_date
#         """,
#         query_filters,
#         as_dict=True,
#     )

#     # Initialise buckets: counts[status][period_key] = {"cnt": 0, "amt": 0}
#     counts = {
#         s: {p["key"]: {"cnt": 0, "amt": 0.0} for p in periods}
#         for s in ROW_STATUSES
#     }

#     for row in raw:
#         txn_date = getdate(row["transaction_date"])
#         for p in periods:
#             if p["from"] <= txn_date <= p["to"]:
#                 if row["status"] in counts:
#                     counts[row["status"]][p["key"]]["cnt"] += row["cnt"]
#                     counts[row["status"]][p["key"]]["amt"] += float(row["amt"] or 0)
#                 break

#     return counts


# # ──────────────────────────────────────────────
# # TABLE DATA
# # ──────────────────────────────────────────────
# def get_data(filters, periods, counts):
#     status_filter = filters.get("status") or []
#     if isinstance(status_filter, str) and status_filter:
#         status_filter = [status_filter]

#     allowed = (
#         [s for s in ROW_STATUSES if s in status_filter]
#         if status_filter
#         else ROW_STATUSES
#     )

#     data = []
#     for status in allowed:
#         row = {"status": STATUS_LABEL_MAP.get(status, status)}
#         for p in periods:
#             row[f"{p['key']}__cnt"] = counts[status][p["key"]]["cnt"]
#             row[f"{p['key']}__amt"] = counts[status][p["key"]]["amt"]
#         data.append(row)

#     # Grand-total row
#     total_row = {"status": "Total"}
#     for p in periods:
#         total_row[f"{p['key']}__cnt"] = sum(counts[s][p["key"]]["cnt"] for s in allowed)
#         total_row[f"{p['key']}__amt"] = sum(counts[s][p["key"]]["amt"] for s in allowed)
#     data.append(total_row)

#     return data


# # ──────────────────────────────────────────────
# # CHART  (driven by count values, same logic)
# # ──────────────────────────────────────────────
# def get_chart(periods, counts, chart_type):
#     labels = [p["label"] for p in periods]

#     if chart_type in ("Pie", "Donut"):
#         totals = {
#             s: sum(counts[s][p["key"]]["cnt"] for p in periods)
#             for s in ROW_STATUSES
#         }
#         active     = {s: v for s, v in totals.items() if v > 0}
#         pie_labels = [STATUS_LABEL_MAP.get(s, s) for s in active]
#         pie_values = list(active.values())
#         pie_colors = [STATUS_COLORS[s] for s in active]
#         return {
#             "data":   {"labels": pie_labels, "datasets": [{"values": pie_values}]},
#             "type":   chart_type.lower(),
#             "colors": pie_colors,
#         }

#     datasets = []
#     colors   = []
#     for status in ROW_STATUSES:
#         values = [counts[status][p["key"]]["cnt"] for p in periods]
#         if any(v > 0 for v in values):
#             datasets.append({
#                 "name":   STATUS_LABEL_MAP.get(status, status),
#                 "values": values,
#             })
#             colors.append(STATUS_COLORS[status])

#     chart = {
#         "data":   {"labels": labels, "datasets": datasets},
#         "type":   "line" if chart_type == "Line" else "bar",
#         "colors": colors,
#     }
#     if chart_type == "Stacked Bar":
#         chart["barOptions"] = {"stacked": True}

#     return chart




import frappe
from frappe import _
from frappe.utils import getdate, add_months, get_first_day, get_last_day, nowdate
import calendar

ROW_STATUSES = ["Draft", "Ordered", "Lost", "Open", "Expired", "Replied", "Partially Ordered"]

STATUS_LABEL_MAP = {
    "Draft":             "Draft",
    "Ordered":           "Ordered",
    "Lost":              "Lost",
    "Open":              "Open",
    "Expired":           "Expiry",
    "Replied":           "Replied",
    "Partially Ordered": "Partially Ordered",
}

STATUS_COLORS = {
    "Draft":             "#a6a6a6",
    "Ordered":           "#5e64ff",
    "Lost":              "#ff5858",
    "Open":              "#28a745",
    "Expired":           "#ffa00a",
    "Replied":           "#6c757d",
    "Partially Ordered": "#ff00ff",
}


def execute(filters=None):
    filters     = frappe._dict(filters or {})
    from_date   = getdate(filters.get("from_date") or add_months(nowdate(), -12))
    to_date     = getdate(filters.get("to_date")   or nowdate())
    if from_date > to_date:
        frappe.throw(_("From Date cannot be greater than To Date"))

    period_type = filters.get("period")     or "Monthly"
    chart_type  = filters.get("chart_type") or "Bar"

    periods = get_periods(from_date, to_date, period_type)
    counts  = fetch_counts(filters, from_date, to_date, periods)

    columns = get_columns(periods)
    data    = get_data(filters, periods, counts)
    chart   = get_chart(periods, counts, chart_type)

    return columns, data, None, chart


# ──────────────────────────────────────────────
# COLUMNS  — Orders + Amount per period
# ──────────────────────────────────────────────
def get_columns(periods):
    columns = [
        {
            "label":     _("Status"),
            "fieldname": "status",
            "fieldtype": "Data",
            "width":     160,
        }
    ]
    for p in periods:
        columns.append({
            "label":     _(f"{p['label']} | Orders"),
            "fieldname": f"{p['key']}__cnt",
            "fieldtype": "Int",
            "width":     110,
        })
        columns.append({
            "label":     _(f"{p['label']} | Amount"),
            "fieldname": f"{p['key']}__amt",
            "fieldtype": "Currency",
            "width":     150,
        })
    return columns


# ──────────────────────────────────────────────
# PERIODS  (unchanged)
# ──────────────────────────────────────────────
def get_periods(from_date, to_date, period_type):
    periods = []

    if period_type == "Monthly":
        current = getdate(get_first_day(from_date))
        while current <= to_date:
            p_end = getdate(get_last_day(current))
            if p_end > to_date:
                p_end = to_date
            label = current.strftime("%b %Y")
            key   = "m_" + current.strftime("%b_%Y")
            periods.append({"label": label, "from": current, "to": p_end, "key": key})
            current = getdate(add_months(current, 1))

    elif period_type == "Quarterly":
        year  = from_date.year
        month = from_date.month
        qs    = ((month - 1) // 3) * 3 + 1
        current = getdate(f"{year}-{qs:02d}-01")
        while current <= to_date:
            q_num     = (current.month - 1) // 3 + 1
            end_month = current.month + 2
            end_day   = calendar.monthrange(current.year, end_month)[1]
            p_end     = getdate(f"{current.year}-{end_month:02d}-{end_day:02d}")
            if p_end > to_date:
                p_end = to_date
            label = f"Q{q_num} {current.year}"
            key   = f"Q{q_num}_{current.year}"
            periods.append({"label": label, "from": current, "to": p_end, "key": key})
            current = getdate(add_months(current, 3))

    elif period_type == "Half Yearly":
        year  = from_date.year
        month = from_date.month
        hs    = 1 if month <= 6 else 7
        current = getdate(f"{year}-{hs:02d}-01")
        while current <= to_date:
            h_num     = 1 if current.month <= 6 else 2
            end_month = 6 if current.month <= 6 else 12
            end_day   = calendar.monthrange(current.year, end_month)[1]
            p_end     = getdate(f"{current.year}-{end_month:02d}-{end_day:02d}")
            if p_end > to_date:
                p_end = to_date
            label = f"H{h_num} {current.year}"
            key   = f"H{h_num}_{current.year}"
            periods.append({"label": label, "from": current, "to": p_end, "key": key})
            current = getdate(add_months(current, 6))

    elif period_type == "Yearly":
        year    = from_date.year
        current = getdate(f"{year}-01-01")
        while current <= to_date:
            p_end = getdate(f"{current.year}-12-31")
            if p_end > to_date:
                p_end = to_date
            label = str(current.year)
            key   = f"Y_{current.year}"
            periods.append({"label": label, "from": current, "to": p_end, "key": key})
            current = getdate(f"{current.year + 1}-01-01")

    return periods


# ──────────────────────────────────────────────
# FETCH RAW COUNTS + AMOUNTS
# ──────────────────────────────────────────────
def fetch_counts(filters, from_date, to_date, periods):
    product_groups = filters.get("product_group") or []
    if isinstance(product_groups, str):
        product_groups = [product_groups]

    conditions   = ""
    query_filters = {
        "from_date": from_date,
        "to_date":   to_date,
        "statuses":  tuple(ROW_STATUSES),
    }

    if product_groups:
        conditions += """
        AND EXISTS (
            SELECT 1
            FROM `tabSales Team` st
            WHERE st.parent = q.name
              AND st.parenttype = 'Quotation'
              AND st.product_group IN %(product_groups)s
        )
        """
        query_filters["product_groups"] = tuple(product_groups)

    raw = frappe.db.sql(
        f"""
        SELECT
            q.status,
            q.transaction_date,
            COUNT(DISTINCT q.name)   AS cnt,
            SUM(q.base_net_total)    AS amt

        FROM `tabQuotation` q

        WHERE
            q.docstatus < 2
            AND q.transaction_date BETWEEN %(from_date)s AND %(to_date)s
            AND q.status IN %(statuses)s
            {conditions}

        GROUP BY q.status, q.transaction_date
        """,
        query_filters,
        as_dict=True,
    )

    # Initialise buckets: counts[status][period_key] = {"cnt": 0, "amt": 0}
    counts = {
        s: {p["key"]: {"cnt": 0, "amt": 0.0} for p in periods}
        for s in ROW_STATUSES
    }

    for row in raw:
        txn_date = getdate(row["transaction_date"])
        for p in periods:
            if p["from"] <= txn_date <= p["to"]:
                if row["status"] in counts:
                    counts[row["status"]][p["key"]]["cnt"] += row["cnt"]
                    counts[row["status"]][p["key"]]["amt"] += float(row["amt"] or 0)
                break

    return counts


# ──────────────────────────────────────────────
# TABLE DATA
# ──────────────────────────────────────────────
def get_data(filters, periods, counts):
    status_filter = filters.get("status") or []
    if isinstance(status_filter, str) and status_filter:
        status_filter = [status_filter]

    allowed = (
        [s for s in ROW_STATUSES if s in status_filter]
        if status_filter
        else ROW_STATUSES
    )

    data = []
    for status in allowed:
        row = {"status": STATUS_LABEL_MAP.get(status, status)}
        for p in periods:
            row[f"{p['key']}__cnt"] = counts[status][p["key"]]["cnt"]
            row[f"{p['key']}__amt"] = counts[status][p["key"]]["amt"]
        data.append(row)

    # Grand-total row
    total_row = {"status": "Total"}
    for p in periods:
        total_row[f"{p['key']}__cnt"] = sum(counts[s][p["key"]]["cnt"] for s in allowed)
        total_row[f"{p['key']}__amt"] = sum(counts[s][p["key"]]["amt"] for s in allowed)
    data.append(total_row)

    return data


# ──────────────────────────────────────────────
# CHART  (driven by count values, same logic)
# ──────────────────────────────────────────────
def get_chart(periods, counts, chart_type):
    labels = [p["label"] for p in periods]

    if chart_type in ("Pie", "Donut"):
        totals = {
            s: sum(counts[s][p["key"]]["cnt"] for p in periods)
            for s in ROW_STATUSES
        }
        active     = {s: v for s, v in totals.items() if v > 0}
        pie_labels = [STATUS_LABEL_MAP.get(s, s) for s in active]
        pie_values = list(active.values())
        pie_colors = [STATUS_COLORS[s] for s in active]
        return {
            "data":   {"labels": pie_labels, "datasets": [{"values": pie_values}]},
            "type":   chart_type.lower(),
            "colors": pie_colors,
        }

    datasets = []
    colors   = []
    for status in ROW_STATUSES:
        values = [counts[status][p["key"]]["cnt"] for p in periods]
        if any(v > 0 for v in values):
            datasets.append({
                "name":   STATUS_LABEL_MAP.get(status, status),
                "values": values,
            })
            colors.append(STATUS_COLORS[status])

    chart = {
        "data":   {"labels": labels, "datasets": datasets},
        "type":   "line" if chart_type == "Line" else "bar",
        "colors": colors,
    }
    if chart_type == "Stacked Bar":
        chart["barOptions"] = {"stacked": True}

    return chart