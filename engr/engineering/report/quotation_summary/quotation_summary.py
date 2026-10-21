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
        # Fiscal quarters: Q1 Apr-Jun, Q2 Jul-Sep, Q3 Oct-Dec, Q4 Jan-Mar
        qs_month = ((from_date.month - 4) % 12) // 3 * 3 + 4
        if qs_month > 12:
            qs_month -= 12
        qs_year = from_date.year if qs_month <= from_date.month else from_date.year - 1
        current = getdate(f"{qs_year}-{qs_month:02d}-01")
        while current <= to_date:
            fq_num   = ((current.month - 4) % 12) // 3 + 1
            fy_start = current.year if current.month >= 4 else current.year - 1
            fy_label = f"{fy_start}-{str(fy_start + 1)[-2:]}"
            p_end    = getdate(get_last_day(add_months(current, 2)))
            if p_end > to_date:
                p_end = to_date
            periods.append({
                "label": f"Q{fq_num} {fy_label}",
                "from":  current,
                "to":    p_end,
                "key":   f"Q{fq_num}_{fy_start}",
            })
            current = getdate(add_months(current, 3))

    elif period_type == "Half Yearly":
        # H1 = Apr-Sep, H2 = Oct-Mar
        m = from_date.month
        if 4 <= m <= 9:
            hs_year, hs_month = from_date.year, 4
        elif m >= 10:
            hs_year, hs_month = from_date.year, 10
        else:
            hs_year, hs_month = from_date.year - 1, 10
        current = getdate(f"{hs_year}-{hs_month:02d}-01")
        while current <= to_date:
            h_num    = 1 if current.month == 4 else 2
            fy_start = current.year if current.month >= 4 else current.year - 1
            fy_label = f"{fy_start}-{str(fy_start + 1)[-2:]}"
            p_end    = getdate(get_last_day(add_months(current, 5)))
            if p_end > to_date:
                p_end = to_date
            periods.append({
                "label": f"H{h_num} {fy_label}",
                "from":  current,
                "to":    p_end,
                "key":   f"H{h_num}_{fy_start}",
            })
            current = getdate(add_months(current, 6))


    elif period_type == "Yearly":
        # FY: 1 Apr - 31 Mar
        fy_start = from_date.year if from_date.month >= 4 else from_date.year - 1
        current  = getdate(f"{fy_start}-04-01")
        while current <= to_date:
            p_end = getdate(f"{current.year + 1}-03-31")
            if p_end > to_date:
                p_end = to_date
            periods.append({
                "label": f"FY {current.year}-{str(current.year + 1)[-2:]}",
                "from":  current,
                "to":    p_end,
                "key":   f"Y_{current.year}",
            })
            current = getdate(f"{current.year + 1}-04-01")

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
    
    if filters.get("company"):
        conditions += " AND q.company = %(company)s"
        query_filters["company"] = filters.get("company")

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