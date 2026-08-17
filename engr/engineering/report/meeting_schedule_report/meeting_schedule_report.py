


# Copyright (c) 2026, Finbyz Tech. Pvt. Ltd. and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.utils import nowdate, flt, getdate


def execute(filters=None):
    filters = filters or {}

    group_by = filters.get("group_by")
    if group_by == "Group By Customer":
        return get_group_by_customer(filters)
    if group_by == "Group By Grade":
        return get_group_by_grade(filters)
    if group_by == "Group By Employee":
        return get_group_by_employee(filters)

    periods  = get_period_list(filters)
    columns  = get_columns(periods)
    data     = get_data(filters, periods)
    chart    = get_chart_data(data, periods)
    return columns, data, None, chart


# ──────────────────────────────────────────────────────────────────────────
# "Group By Customer" / "Group By Grade"
# ──────────────────────────────────────────────────────────────────────────

def get_group_by_customer_columns():
    return [
        {"label": _("Customer"),        "fieldname": "customer",         "fieldtype": "Data",    "width": 220},
        {"label": _("Grade"),           "fieldname": "grade",            "fieldtype": "Data",    "width": 100},
        {"label": _("Total Scheduled"), "fieldname": "total_scheduled",  "fieldtype": "Int",     "width": 130},
        {"label": _("Total Meetings"),  "fieldname": "total_meetings",   "fieldtype": "Int",     "width": 130},
        {"label": _("Achievement %"),   "fieldname": "achievement",      "fieldtype": "Percent", "width": 130},
    ]


def get_group_by_grade_columns():
    return [
        {"label": _("Grade"),           "fieldname": "grade",            "fieldtype": "Data",    "width": 150},
        {"label": _("Total Scheduled"), "fieldname": "total_scheduled",  "fieldtype": "Int",     "width": 150},
        {"label": _("Total Meetings"),  "fieldname": "total_meetings",   "fieldtype": "Int",     "width": 150},
        {"label": _("Achievement %"),   "fieldname": "achievement",      "fieldtype": "Percent", "width": 150},
    ]


def get_customer_group_data(filters):
    """Shared aggregation: total scheduled / meetings per customer, plus grade."""
    conditions_ms = get_conditions(filters)
    conditions_m  = get_conditions_meeting(filters)

    rows = frappe.db.sql(
        f"""
        SELECT party AS customer,
               SUM(scheduled_count) AS total_scheduled,
               SUM(meeting_count)   AS total_meetings
        FROM (

            SELECT ms.party AS party, COUNT(*) AS scheduled_count, 0 AS meeting_count
            FROM `tabMeeting Schedule` ms
            WHERE {conditions_ms}
            AND NOT EXISTS (
                SELECT 1 FROM `tabMeeting` m
                WHERE m.meeting_arranged_by = ms.meeting_arranged_by
                AND   m.party               = ms.party
                AND   DATE(m.scheduled_time) = DATE(ms.scheduled_from)
            )
            GROUP BY ms.party

            UNION ALL

            SELECT m.party AS party, 0 AS scheduled_count, COUNT(*) AS meeting_count
            FROM `tabMeeting` m
            WHERE {conditions_m}
            GROUP BY m.party

        ) combined
        WHERE party IS NOT NULL AND party != ''
        GROUP BY party
        """,
        filters,
        as_dict=True,
    )

    customers = [r.customer for r in rows if r.customer]
    grades = {}
    if customers:
        cat_rows = frappe.db.get_all(
            "Customer",
            filters={"name": ["in", customers]},
            fields=["name", "customer_category_"],
        )
        grades = {c.name: c.customer_category_ for c in cat_rows}

    data = []
    for r in rows:
        total_scheduled = int(r.total_scheduled or 0)
        total_meetings  = int(r.total_meetings or 0)
        achievement = round((total_meetings / total_scheduled * 100), 2) if total_scheduled else 0
        data.append({
            "customer":        r.customer,
            "grade":           grades.get(r.customer) or "",
            "total_scheduled": total_scheduled,
            "total_meetings":  total_meetings,
            "achievement":     achievement,
        })

    return data


def get_group_by_customer(filters):
    data = get_customer_group_data(filters)
    data.sort(key=lambda x: x["customer"] or "")
    return get_group_by_customer_columns(), data, None, None


def get_group_by_grade(filters):
    customer_data = get_customer_group_data(filters)

    grade_map = {}
    order = []
    for row in customer_data:
        grade = row["grade"] or "Unspecified"
        if grade not in grade_map:
            grade_map[grade] = {"grade": grade, "total_scheduled": 0, "total_meetings": 0}
            order.append(grade)
        grade_map[grade]["total_scheduled"] += row["total_scheduled"]
        grade_map[grade]["total_meetings"]  += row["total_meetings"]

    data = []
    for g in order:
        entry = grade_map[g]
        ts, tm = entry["total_scheduled"], entry["total_meetings"]
        entry["achievement"] = round((tm / ts * 100), 2) if ts else 0
        data.append(entry)

    data.sort(key=lambda x: x["grade"] or "")
    return get_group_by_grade_columns(), data, None, None


def get_group_by_employee_columns():
    return [
        {"label": _("Employee"),        "fieldname": "employee",         "fieldtype": "Data",    "width": 200},
        {"label": _("Meeting Target"),  "fieldname": "meeting_target",   "fieldtype": "Float",   "width": 130},
        {"label": _("Scheduled"),       "fieldname": "scheduled",        "fieldtype": "Int",     "width": 120},
        {"label": _("Actual"),          "fieldname": "actual",           "fieldtype": "Int",     "width": 120},
        {"label": _("Achievement %"),   "fieldname": "achievement",      "fieldtype": "Percent", "width": 130},
    ]


def get_group_by_employee(filters):
    conditions_ms = get_conditions(filters)
    conditions_m  = get_conditions_meeting(filters)

    rows = frappe.db.sql(
        f"""
        SELECT
            user_email, user_name,
            SUM(scheduled_count) AS scheduled,
            SUM(meeting_count)   AS actual,
            MAX(target_reach)    AS meeting_target
        FROM (

            SELECT
                ms.meeting_arranged_by            AS user_email,
                u.full_name                       AS user_name,
                COUNT(*)                          AS scheduled_count,
                0                                  AS meeting_count,
                MAX(IFNULL(td.target_reach, 0))   AS target_reach
            FROM `tabMeeting Schedule` ms
            LEFT JOIN `tabUser` u ON u.name = ms.meeting_arranged_by
            LEFT JOIN `tabEmployee` e ON e.user_id = u.name
            LEFT JOIN `tabSales Person` sp ON sp.employee = e.name
            LEFT JOIN `tabTarget Detail` td
                ON td.parent = sp.name AND td.parenttype = 'Sales Person'
            WHERE {conditions_ms}
            AND NOT EXISTS (
                SELECT 1 FROM `tabMeeting` m
                WHERE m.meeting_arranged_by = ms.meeting_arranged_by
                AND   m.party               = ms.party
                AND   DATE(m.scheduled_time) = DATE(ms.scheduled_from)
            )
            GROUP BY ms.meeting_arranged_by

            UNION ALL

            SELECT
                m.meeting_arranged_by             AS user_email,
                u.full_name                       AS user_name,
                0                                  AS scheduled_count,
                COUNT(*)                          AS meeting_count,
                MAX(IFNULL(td.target_reach, 0))   AS target_reach
            FROM `tabMeeting` m
            LEFT JOIN `tabUser` u ON u.name = m.meeting_arranged_by
            LEFT JOIN `tabEmployee` e ON e.user_id = u.name
            LEFT JOIN `tabSales Person` sp ON sp.employee = e.name
            LEFT JOIN `tabTarget Detail` td
                ON td.parent = sp.name AND td.parenttype = 'Sales Person'
            WHERE {conditions_m}
            GROUP BY m.meeting_arranged_by

        ) combined
        GROUP BY user_email, user_name
        ORDER BY user_name
        """,
        filters,
        as_dict=True,
    )

    data = []
    for r in rows:
        scheduled = int(r.scheduled or 0)
        actual    = int(r.actual or 0)
        target    = flt(r.meeting_target or 0)
        achievement = round((actual / target * 100), 2) if target else 0
        data.append({
            "employee":       r.user_name or r.user_email or "Unassigned",
            "meeting_target": target,
            "scheduled":      scheduled,
            "actual":         actual,
            "achievement":    achievement,
        })

    return get_group_by_employee_columns(), data, None, None


def get_period_list(filters):
    from_date   = getdate(filters.get("from_date") or nowdate())
    to_date     = getdate(filters.get("to_date")   or nowdate())
    period_type = filters.get("period") or "Monthly"

    periods = []
    seen    = set()
    current = from_date.replace(day=1)

    while current <= to_date:
        if period_type == "Quarterly":
            q      = (current.month - 1) // 3 + 1
            label  = f"Q{q}-{current.strftime('%y')}"       # Q2-26
            fname  = f"q{q}_{current.strftime('%y')}"

        elif period_type == "Half Yearly":
            h      = 1 if current.month <= 6 else 2
            label  = f"H{h}-{current.strftime('%y')}"       # H1-26
            fname  = f"h{h}_{current.strftime('%y')}"

        elif period_type == "Yearly":
            label  = current.strftime("%Y")                  # 2026
            fname  = f"yr_{current.year}"

        else:  # Monthly (default)
            label  = current.strftime("%b-%y")               # May-26
            fname  = "m_" + current.strftime("%b_%y").lower()

        if label not in seen:
            seen.add(label)
            periods.append({"label": label, "fieldname": fname})

        # advance one month
        if current.month == 12:
            current = current.replace(year=current.year + 1, month=1)
        else:
            current = current.replace(month=current.month + 1)

    return periods


def get_columns(periods):
    columns = [
        {"label": _("User Name"),  "fieldname": "user_name",  "fieldtype": "Data", "width": 160},
        {"label": _("User Email"), "fieldname": "user_email", "fieldtype": "Data", "width": 220},
        {"label": _("Party"),      "fieldname": "party",      "fieldtype": "Data", "width": 220},
    ]

    for p in periods:
        columns += [
            {
                "label":     _(p["label"] + " Total Scheduled"),
                "fieldname": p["fieldname"] + "_scheduled",
                "fieldtype": "Int",
                "width":     150,
            },
            {
                "label":     _(p["label"] + " Total Meetings"),
                "fieldname": p["fieldname"] + "_meetings",
                "fieldtype": "Int",
                "width":     150,
            },
            {
                "label":     _(p["label"] + " Target Meet"),
                "fieldname": p["fieldname"] + "_target",
                "fieldtype": "Float",
                "width":     140,
            },
        ]

    return columns


def get_period_expression(period_type):
    if period_type == "Quarterly":
        return (
            "CONCAT('Q', QUARTER(ms.scheduled_from), '-',"
            " DATE_FORMAT(ms.scheduled_from, '%%y'))"
        )
    elif period_type == "Half Yearly":
        return (
            "CONCAT('H', IF(MONTH(ms.scheduled_from) <= 6, 1, 2), '-',"
            " DATE_FORMAT(ms.scheduled_from, '%%y'))"
        )
    elif period_type == "Yearly":
        return "DATE_FORMAT(ms.scheduled_from, '%%Y')"
    else:
        return "DATE_FORMAT(ms.scheduled_from, '%%b-%%y')"


def get_conditions(filters):
    conditions = ["1=1", "ms.party_type = 'Customer'"]

    if filters.get("from_date"):
        conditions.append("DATE(ms.scheduled_from) >= %(from_date)s")

    if filters.get("to_date"):
        conditions.append("DATE(ms.scheduled_from) <= %(to_date)s")

    if filters.get("user"):
        conditions.append("ms.meeting_arranged_by = %(user)s")

    return " AND ".join(conditions)


def get_data(filters, periods):
    conditions_ms  = get_conditions(filters)
    conditions_m   = get_conditions_meeting(filters)
    today          = nowdate()
    period_type    = filters.get("period") or "Monthly"
    period_expr_ms = get_period_expression(period_type)
    period_expr_m  = get_period_expression_meeting(period_type)
    label_to_fname = {p["label"]: p["fieldname"] for p in periods}

    rows = frappe.db.sql(
        f"""
        SELECT
            period_label, yr, mo,
            user_email, user_name, party,
            scheduled_count, meeting_count, target_reach
        FROM (

            -- ── Meeting Schedule → scheduled_count ────────────────
            SELECT
                {period_expr_ms}                    AS period_label,
                YEAR(ms.scheduled_from)             AS yr,
                MONTH(ms.scheduled_from)            AS mo,
                ms.meeting_arranged_by              AS user_email,
                u.full_name                         AS user_name,
                ms.party,
                COUNT(*)                            AS scheduled_count,
                0                                   AS meeting_count,
                MAX(IFNULL(td.target_reach, 0))     AS target_reach

            FROM `tabMeeting Schedule` ms
            LEFT JOIN `tabUser` u ON u.name = ms.meeting_arranged_by
            LEFT JOIN `tabEmployee` e ON e.user_id = u.name
            LEFT JOIN `tabSales Person` sp ON sp.employee = e.name
            LEFT JOIN `tabTarget Detail` td
                ON td.parent = sp.name AND td.parenttype = 'Sales Person'

            WHERE {conditions_ms}
            AND NOT EXISTS (
                SELECT 1 FROM `tabMeeting` m
                WHERE m.meeting_arranged_by = ms.meeting_arranged_by
                AND   m.party               = ms.party
                AND   DATE(m.scheduled_time) = DATE(ms.scheduled_from)
            )

            GROUP BY period_label, yr, mo, ms.meeting_arranged_by, ms.party

            UNION ALL

            -- ── Meeting → meeting_count ───────────────────────────
            SELECT
                {period_expr_m}                     AS period_label,
                YEAR(m.meeting_from)                AS yr,
                MONTH(m.meeting_from)               AS mo,
                m.meeting_arranged_by               AS user_email,
                u.full_name                         AS user_name,
                m.party,
                0                                   AS scheduled_count,
                COUNT(*)                            AS meeting_count,
                MAX(IFNULL(td.target_reach, 0))     AS target_reach

            FROM `tabMeeting` m
            LEFT JOIN `tabUser` u ON u.name = m.meeting_arranged_by
            LEFT JOIN `tabEmployee` e ON e.user_id = u.name
            LEFT JOIN `tabSales Person` sp ON sp.employee = e.name
            LEFT JOIN `tabTarget Detail` td
                ON td.parent = sp.name AND td.parenttype = 'Sales Person'

            WHERE {conditions_m}

            GROUP BY period_label, yr, mo, m.meeting_arranged_by, m.party

        ) combined

        ORDER BY yr, mo, user_name, party
        """,
        filters,
        as_dict=True,
    )

    pivot = {}
    order = []

    for row in rows:
        key = (row.get("user_email") or "", row.get("party") or "")

        if key not in pivot:
            order.append(key)
            entry = {
                "user_name":       row.get("user_name") or row.get("user_email") or "Unassigned",
                "user_email":      row.get("user_email") or "Unassigned",
                "party":           row.get("party") or "",
                "total_scheduled": 0,
                "total_meetings":  0,
                "target_reach":    0.0,
            }
            for p in periods:
                entry[p["fieldname"] + "_scheduled"] = 0
                entry[p["fieldname"] + "_meetings"]  = 0
                entry[p["fieldname"] + "_target"]    = 0.0
            pivot[key] = entry

        period_label    = row.get("period_label") or ""
        fieldname       = label_to_fname.get(period_label)
        scheduled_count = int(row.get("scheduled_count") or 0)
        meeting_count   = int(row.get("meeting_count")   or 0)
        target_reach    = flt(row.get("target_reach")    or 0)

        if fieldname:
            pivot[key][fieldname + "_scheduled"] += scheduled_count
            pivot[key][fieldname + "_meetings"]  += meeting_count
            if target_reach > pivot[key][fieldname + "_target"]:
                pivot[key][fieldname + "_target"] = target_reach

        pivot[key]["total_scheduled"] += scheduled_count
        pivot[key]["total_meetings"]  += meeting_count
        if target_reach > pivot[key]["target_reach"]:
            pivot[key]["target_reach"] = target_reach

    return [pivot[k] for k in order]


def get_chart_data(data, periods):
    labels          = [p["label"] for p in periods]
    scheduled_vals  = []
    meetings_vals   = []

    for p in periods:
        scheduled_vals.append(sum(row.get(p["fieldname"] + "_scheduled", 0) or 0 for row in data))
        meetings_vals.append(sum(row.get(p["fieldname"] + "_meetings",  0) or 0 for row in data))

    return {
        "data": {
            "labels":   labels,
            "datasets": [
                {"name": "Scheduled", "values": scheduled_vals},
                {"name": "Meetings",  "values": meetings_vals},
            ],
        },
        "type":   "bar",
        "height": 320,
        "colors": ["#1565c0", "#2e7d32"],
    }


def get_period_expression_meeting(period_type):
    if period_type == "Quarterly":
        return (
            "CONCAT('Q', QUARTER(m.meeting_from), '-',"
            " DATE_FORMAT(m.meeting_from, '%%y'))"
        )
    elif period_type == "Half Yearly":
        return (
            "CONCAT('H', IF(MONTH(m.meeting_from) <= 6, 1, 2), '-',"
            " DATE_FORMAT(m.meeting_from, '%%y'))"
        )
    elif period_type == "Yearly":
        return "DATE_FORMAT(m.meeting_from, '%%Y')"
    else:
        return "DATE_FORMAT(m.meeting_from, '%%b-%%y')"


def get_conditions_meeting(filters):
    conditions = ["1=1", "m.party_type = 'Customer'"]

    if filters.get("from_date"):
        conditions.append("DATE(m.meeting_from) >= %(from_date)s")

    if filters.get("to_date"):
        conditions.append("DATE(m.meeting_from) <= %(to_date)s")

    if filters.get("user"):
        conditions.append("m.meeting_arranged_by = %(user)s")

    return " AND ".join(conditions)