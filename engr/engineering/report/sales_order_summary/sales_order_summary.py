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


    elif period_type == "Quarterly":

        # Fiscal quarters: Q1 Apr-Jun, Q2 Jul-Sep, Q3 Oct-Dec, Q4 Jan-Mar
        # Snap from_date to the start of its fiscal quarter
        qs_month = ((from_date.month - 4) % 12) // 3 * 3 + 4
        if qs_month > 12:
            qs_month -= 12
        qs_year = from_date.year if qs_month <= from_date.month else from_date.year - 1

        current = getdate(f"{qs_year}-{qs_month:02d}-01")

        while current <= to_date:

            fq_num = ((current.month - 4) % 12) // 3 + 1

            # fiscal year start year: Jan-Mar belongs to the FY that began previous April
            fy_start = current.year if current.month >= 4 else current.year - 1
            fy_label = f"{fy_start}-{str(fy_start + 1)[-2:]}"

            p_end = getdate(get_last_day(add_months(current, 2)))

            if p_end > to_date:
                p_end = to_date

            label = f"Q{fq_num} {fy_label}"
            key = f"Q{fq_num}_{fy_start}"

            periods.append({
                "label": label,
                "from": current,
                "to": p_end,
                "key": key
            })

            current = getdate(add_months(current, 3))


    elif period_type == "Half Yearly":

        m = from_date.month

        if 4 <= m <= 9:
            hs_year, hs_month = from_date.year, 4
        elif m >= 10:
            hs_year, hs_month = from_date.year, 10
        else:  # Jan-Mar belongs to H2 that began previous October
            hs_year, hs_month = from_date.year - 1, 10

        current = getdate(f"{hs_year}-{hs_month:02d}-01")

        while current <= to_date:

            h_num = 1 if current.month == 4 else 2

            fy_start = current.year if current.month >= 4 else current.year - 1
            fy_label = f"{fy_start}-{str(fy_start + 1)[-2:]}"

            p_end = getdate(get_last_day(add_months(current, 5)))

            if p_end > to_date:
                p_end = to_date

            periods.append({
                "label": f"H{h_num} {fy_label}",
                "from": current,
                "to": p_end,
                "key": f"H{h_num}_{fy_start}",
            })

            current = getdate(add_months(current, 6))

    elif period_type == "Yearly":

        fy_start = from_date.year if from_date.month >= 4 else from_date.year - 1

        current = getdate(f"{fy_start}-04-01")

        while current <= to_date:

            p_end = getdate(f"{current.year + 1}-03-31")

            if p_end > to_date:
                p_end = to_date

            periods.append({
                "label": f"FY {current.year}-{str(current.year + 1)[-2:]}",
                "from": current,
                "to": p_end,
                "key": f"Y_{current.year}",
            })

            current = getdate(f"{current.year + 1}-04-01")


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
    
    # -----------------------------------------------------
    # COMPANY FILTER
    # -----------------------------------------------------

    # if filters.get("company"):

    #     conditions += " AND so.company = %(company)s"

    #     query_filters["company"] = filters.get("company")

    companies = filters.get("company") or []

    if isinstance(companies, str):
        companies = [companies]

    if companies:
        conditions += " AND so.company IN %(companies)s"
        query_filters["companies"] = tuple(companies)

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