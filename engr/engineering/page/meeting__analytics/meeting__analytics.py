
"""
Meeting Analytics — Ultra Pro
Backend for the Meeting Analytics page.
"""

import csv
import io
import json

import frappe
from frappe.utils import add_days, add_months, get_last_day, getdate, nowdate


# ──────────────────────────────────────────────────────────────────────────
# CONFIGURATION — Field names matching your setup
# ──────────────────────────────────────────────────────────────────────────

# Field name in Customer doc that holds the grade/category (A, B, C, D, etc.)
CUSTOMER_CATEGORY_FIELD = "customer_category_"

# Field name in Target Detail child table that holds the meeting target
MEETING_TARGET_FIELD = "target_reach"


# ──────────────────────────────────────────────────────────────────────────
# Meta
# ──────────────────────────────────────────────────────────────────────────

CARD_META = {
    "scheduled_meetings": {
        "label": "Scheduled Meetings", "fieldtype": "Int", "icon": "calendar",
        "color": "purple", "route": "/app/meeting-schedule",
        "description": "Total rows in Meeting Schedule whose scheduled date falls in the selected period.",
    },
    "actual_meetings": {
        "label": "Actual Meetings", "fieldtype": "Int", "icon": "check",
        "color": "blue", "route": "/app/meeting",
        "description": "Submitted Meeting records held with a Customer in the selected period.",
    },
    "achievement_pct": {
        "label": "Achievement %", "fieldtype": "percentage", "icon": "target",
        "color": "green", "route": None,
        "description": "Actual Meetings divided by Scheduled Meetings for the period.",
    },
    "new_customers": {
        "label": "New Customers", "fieldtype": "Int", "icon": "users",
        "color": "orange", "route": "/app/customer",
        "description": "Customers whose earliest-ever Meeting or Meeting Schedule falls on/after the period start.",
    },
    "avg_per_day": {
        "label": "Avg Meetings / Day", "fieldtype": "Float", "icon": "trending-up",
        "color": "teal", "route": None,
        "description": "Actual Meetings divided by the number of days in the selected period.",
    },
}

CHART_META = {
    "meeting_trend":         {"label": "Meeting Trend", "route": "/app/meeting"},
    "grade_donut":           {"label": "Meetings by Customer Grade", "route": "/app/customer"},
    "territory_achievement": {"label": "Achievement % by Territory", "route": "/app/territory"},
}


# ──────────────────────────────────────────────────────────────────────────
# Entry points
# ──────────────────────────────────────────────────────────────────────────

@frappe.whitelist()
def get_users():
    rows = frappe.db.sql(
        """
        SELECT DISTINCT u.name, u.full_name
        FROM `tabUser` u
        WHERE u.name IN (
            SELECT DISTINCT meeting_arranged_by FROM `tabMeeting` WHERE meeting_arranged_by IS NOT NULL
            UNION
            SELECT DISTINCT meeting_arranged_by FROM `tabMeeting Schedule` WHERE meeting_arranged_by IS NOT NULL
        )
        ORDER BY u.full_name ASC
        """,
        as_dict=True,
    )
    return rows


@frappe.whitelist()
def get_territories():
    return frappe.get_all("Territory", pluck="name", order_by="name asc")


@frappe.whitelist()
def get_page_data(filters=None):
    f = _filters_dict(filters)
    preset = f.get("period_preset") or "this_month"
    from_date, to_date = get_period_range(f)
    prev_from, prev_to = _previous_period(from_date, to_date, preset)

    common = {
        "from_date": from_date, "to_date": to_date,
        "user": f.get("user") or None, "territory": f.get("territory") or None,
        "preset": preset,
    }
    prev_common = dict(common, from_date=prev_from, to_date=prev_to)

    cards, ctx = _build_cards(common)
    prev_cards, _ = _build_cards(prev_common, light=True)
    _attach_deltas(cards, prev_cards)

    target_multiplier = get_target_multiplier(preset, from_date, to_date)

    return {
        "from_date": str(from_date), "to_date": str(to_date),
        "prev_from_date": str(prev_from), "prev_to_date": str(prev_to),
        "period_label": PERIOD_LABELS.get(preset, "This Month"),
        "target_multiplier": target_multiplier,
        "cards": cards,
        "charts": {
            "meeting_trend": get_trend_chart(common),
            "grade_donut": get_grade_donut(ctx["meetings"], ctx["customer_info"]),
            "territory_achievement": get_territory_chart(common, ctx["all_scheduled"]),
        },
        "team_table": get_team_table(common, ctx["all_scheduled"]),
        "territory_table": get_territory_chart(common, ctx["all_scheduled"]),
        "daily_activity": get_daily_activity(common),
        "period_meetings": get_period_meetings(ctx["meetings"], ctx["customer_info"]),
        "meta": {"card_meta": CARD_META, "chart_meta": CHART_META, "generated_at": frappe.utils.now_datetime().isoformat()},
    }


@frappe.whitelist()
def refresh_data(filters=None):
    frappe.local.no_cache = True
    return get_page_data(filters)


@frappe.whitelist()
def get_kpi_trends(filters=None):
    f = _filters_dict(filters)
    from_date, to_date = get_period_range(f)
    common = {"from_date": from_date, "to_date": to_date, "user": f.get("user"), "territory": f.get("territory")}
    trend = get_trend_chart(common)
    return {"labels": trend["labels"], "actual": trend["actual"], "scheduled": trend["scheduled"]}


@frappe.whitelist()
def export_chart_csv(chart_key, filters=None):
    f = _filters_dict(filters)
    from_date, to_date = get_period_range(f)
    common = {"from_date": from_date, "to_date": to_date, "user": f.get("user"), "territory": f.get("territory")}

    if chart_key == "meeting_trend":
        chart = get_trend_chart(common)
        labels, datasets = chart["labels"], [
            {"name": "Actual Meetings", "values": chart["actual"]},
            {"name": "Scheduled Meetings", "values": chart["scheduled"]},
        ]
    elif chart_key == "grade_donut":
        meetings = get_meetings_in_range(common)
        customer_info = get_customer_info([r.get("party") for r in meetings if r.get("party")])
        donut = get_grade_donut(meetings, customer_info)
        labels = [s["label"] for s in donut["segments"]]
        datasets = [{"name": "Meetings", "values": [s["count"] for s in donut["segments"]]}]
    elif chart_key == "territory_achievement":
        all_scheduled = get_all_scheduled_in_range(common)
        rows = get_territory_chart(common, all_scheduled)
        labels = [r["territory"] for r in rows]
        datasets = [
            {"name": "Actual", "values": [r["actual"] for r in rows]},
            {"name": "Scheduled", "values": [r["scheduled"] for r in rows]},
            {"name": "Achievement %", "values": [r["achievement_pct"] for r in rows]},
        ]
    else:
        frappe.throw(frappe._("Unknown chart: {0}").format(chart_key))

    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(["Label"] + [ds["name"] for ds in datasets])
    for i, label in enumerate(labels):
        writer.writerow([label] + [(ds["values"][i] if i < len(ds["values"]) else "") for ds in datasets])

    frappe.response.filename = f"{chart_key}.csv"
    frappe.response.filecontent = buf.getvalue()
    frappe.response.type = "binary"


@frappe.whitelist()
def get_grade_meetings(grade, filters=None, limit=50):
    f = _filters_dict(filters)
    from_date, to_date = get_period_range(f)
    common = {"from_date": from_date, "to_date": to_date, "user": f.get("user"), "territory": f.get("territory")}
    meetings = get_meetings_in_range(common)
    customer_info = get_customer_info([r.get("party") for r in meetings if r.get("party")])
    rows = get_period_meetings(meetings, customer_info)
    rows = [r for r in rows if r["grade"] == grade]
    limit = min(max(int(limit or 50), 1), 200)
    return {"grade": grade, "total": len(rows), "rows": rows[:limit]}


@frappe.whitelist()
def get_meetings_by_category(filters=None):
    f = _filters_dict(filters)
    from_date, to_date = get_period_range(f)
    common = {"from_date": from_date, "to_date": to_date, "user": f.get("user"), "territory": f.get("territory")}
    meetings = get_meetings_in_range(common)
    customer_info = get_customer_info([r.get("party") for r in meetings if r.get("party")])
    rows = get_period_meetings(meetings, customer_info)

    grouped = {}
    for r in rows:
        grouped.setdefault(r["grade"], []).append(r)

    result = [{"grade": grade, "count": len(items), "meetings": items} for grade, items in grouped.items()]
    result.sort(key=lambda x: -x["count"])
    return result


@frappe.whitelist()
def get_employee_meetings_by_category(employee_email, filters=None):
    """
    Get meetings for a specific employee grouped by customer category (A, B, C, etc.)
    Used when clicking the + button next to an employee name in the team table.
    """
    f = _filters_dict(filters)
    from_date, to_date = get_period_range(f)
    common = {
        "from_date": from_date, "to_date": to_date,
        "user": employee_email,
        "territory": f.get("territory") or None,
    }
    meetings = get_meetings_in_range(common)
    customer_info = get_customer_info([r.get("party") for r in meetings if r.get("party")])
    rows = get_period_meetings(meetings, customer_info)

    grouped = {}
    for r in rows:
        grouped.setdefault(r["grade"], []).append(r)

    # Sort grades: A first, then B, C, D, etc., then Unclassified last
    def grade_sort_key(item):
        g = item[0]
        if g == "Unclassified":
            return (999, g)
        if len(g) == 1 and g.isalpha():
            return (ord(g.upper()), g)
        return (500, g)

    sorted_groups = sorted(grouped.items(), key=grade_sort_key)

    result = [
        {
            "grade": grade,
            "count": len(items),
            "meetings": items,
            "employee_email": employee_email,
        }
        for grade, items in sorted_groups
    ]
    return result


# ──────────────────────────────────────────────────────────────────────────
# Filters / period helpers
# ──────────────────────────────────────────────────────────────────────────

PERIOD_LABELS = {
    "today": "Today", "this_week": "This Week", "this_month": "This Month",
    "last_month": "Last Month", "this_quarter": "This Quarter",
    "this_half_year": "This Half Year", "this_year": "This Year",
    "custom": "Custom Range",
}

PERIOD_TARGET_MULTIPLIER = {
    "today": 1,
    "this_week": 1,
    "this_month": 1,
    "last_month": 1,
    "this_quarter": 3,
    "this_half_year": 6,
    "this_year": 12,
}


def get_target_multiplier(preset, from_date, to_date):
    if preset in PERIOD_TARGET_MULTIPLIER:
        return PERIOD_TARGET_MULTIPLIER[preset]
    days = (getdate(to_date) - getdate(from_date)).days + 1
    months = round(days / 30.44)
    return max(months, 1)


def _filters_dict(filters=None):
    if isinstance(filters, str) and filters.strip():
        filters = frappe.parse_json(filters)
    if not filters:
        return frappe._dict()
    return frappe._dict(filters)


def get_period_range(filters):
    preset = filters.get("period_preset") or "this_month"
    today = getdate(nowdate())

    if preset == "custom" and filters.get("from_date") and filters.get("to_date"):
        return getdate(filters["from_date"]), getdate(filters["to_date"])
    if preset == "today":
        return today, today
    if preset == "this_week":
        return add_days(today, -today.weekday()), today
    if preset == "this_month":
        return today.replace(day=1), get_last_day(today)
    if preset == "last_month":
        first_this_month = today.replace(day=1)
        last_month_end = add_days(first_this_month, -1)
        return last_month_end.replace(day=1), last_month_end
    if preset == "this_quarter":
        q_start_month = ((today.month - 1) // 3) * 3 + 1
        return today.replace(month=q_start_month, day=1), today
    if preset == "this_half_year":
        half_start_month = 1 if today.month <= 6 else 7
        return today.replace(month=half_start_month, day=1), today
    if preset == "this_year":
        return today.replace(month=1, day=1), today
    return today.replace(day=1), get_last_day(today)


def _previous_period(from_date, to_date, preset=None):
    if preset == "this_year":
        return getdate(add_months(from_date, -12)), getdate(add_months(to_date, -12))
    if preset == "this_half_year":
        return getdate(add_months(from_date, -6)), getdate(add_months(to_date, -6))
    if preset in ("this_month", "last_month"):
        return getdate(add_months(from_date, -1)), getdate(add_months(to_date, -1))
    if preset == "this_quarter":
        return getdate(add_months(from_date, -3)), getdate(add_months(to_date, -3))
    span = (to_date - from_date).days + 1
    prev_to = add_days(from_date, -1)
    prev_from = add_days(prev_to, -(span - 1))
    return getdate(prev_from), getdate(prev_to)


# ──────────────────────────────────────────────────────────────────────────
# Shared WHERE-clause builders
# ──────────────────────────────────────────────────────────────────────────

def get_meeting_conditions(common, alias="m"):
    conditions = ["1=1", f"{alias}.party_type = 'Customer'", f"{alias}.docstatus = 1"]
    values = {"from_date": common["from_date"], "to_date": common["to_date"]}
    conditions.append(f"DATE({alias}.meeting_from) >= %(from_date)s")
    conditions.append(f"DATE({alias}.meeting_from) <= %(to_date)s")
    if common.get("user"):
        conditions.append(f"{alias}.meeting_arranged_by = %(user)s")
        values["user"] = common["user"]
    return " AND ".join(conditions), values


def get_schedule_conditions(common, alias="ms"):
    conditions = ["1=1", f"{alias}.party_type = 'Customer'"]
    values = {"from_date": common["from_date"], "to_date": common["to_date"]}
    conditions.append(f"DATE({alias}.scheduled_from) >= %(from_date)s")
    conditions.append(f"DATE({alias}.scheduled_from) <= %(to_date)s")
    if common.get("user"):
        conditions.append(f"{alias}.meeting_arranged_by = %(user)s")
        values["user"] = common["user"]
    return " AND ".join(conditions), values


# ──────────────────────────────────────────────────────────────────────────
# Raw row fetchers
# ──────────────────────────────────────────────────────────────────────────

def get_meetings_in_range(common):
    cond, values = get_meeting_conditions(common, alias="m")
    rows = frappe.db.sql(
        f"""
        SELECT m.name, m.party AS party, m.meeting_arranged_by AS user_email,
            u.full_name AS user_name, m.meeting_from
        FROM `tabMeeting` m
        LEFT JOIN `tabUser` u ON u.name = m.meeting_arranged_by
        WHERE {cond}
        """,
        values, as_dict=True,
    )
    return filter_by_territory(rows, common.get("territory"))


def get_all_scheduled_in_range(common):
    cond, values = get_schedule_conditions(common, alias="ms")
    rows = frappe.db.sql(
        f"""
        SELECT ms.name, ms.party AS party, ms.meeting_arranged_by AS user_email,
            u.full_name AS user_name, ms.scheduled_from
        FROM `tabMeeting Schedule` ms
        LEFT JOIN `tabUser` u ON u.name = ms.meeting_arranged_by
        WHERE {cond}
        """,
        values, as_dict=True,
    )
    return filter_by_territory(rows, common.get("territory"))


def get_scheduled_in_range(common):
    cond, values = get_schedule_conditions(common, alias="ms")
    rows = frappe.db.sql(
        f"""
        SELECT ms.name, ms.party AS party, ms.meeting_arranged_by AS user_email,
            u.full_name AS user_name, ms.scheduled_from
        FROM `tabMeeting Schedule` ms
        LEFT JOIN `tabUser` u ON u.name = ms.meeting_arranged_by
        WHERE {cond}
        AND NOT EXISTS (
            SELECT 1 FROM `tabMeeting` m2
            WHERE m2.meeting_arranged_by = ms.meeting_arranged_by
              AND m2.party              = ms.party
              AND DATE(m2.meeting_from) = DATE(ms.scheduled_from)
              AND m2.docstatus          = 1
        )
        """,
        values, as_dict=True,
    )
    return filter_by_territory(rows, common.get("territory"))


def filter_by_territory(rows, territory):
    if not territory:
        return rows
    parties = list({r["party"] for r in rows if r.get("party")})
    if not parties:
        return []
    allowed = set(frappe.db.get_all(
        "Customer", filters={"name": ["in", parties], "territory": territory}, pluck="name",
    ))
    return [r for r in rows if r.get("party") in allowed]


def get_customer_info(party_names):
    """Fetch customer info including customer_category_ field."""
    party_names = list({p for p in party_names if p})
    if not party_names:
        return {}
    rows = frappe.db.get_all(
        "Customer",
        filters={"name": ["in", party_names]},
        fields=["name", CUSTOMER_CATEGORY_FIELD, "territory", "customer_name"],
    )
    # Build dict using the dynamic field name
    result = {}
    for r in rows:
        grade = r.get(CUSTOMER_CATEGORY_FIELD) or "Unclassified"
        result[r.name] = {
            "customer_name": r.customer_name,
            "territory": r.territory,
            "grade": grade,
        }
    return result


# ──────────────────────────────────────────────────────────────────────────
# KPI cards
# ──────────────────────────────────────────────────────────────────────────
def _build_cards(common, light=False):
    meetings = get_meetings_in_range(common)
    all_scheduled = get_all_scheduled_in_range(common)
    customer_info = get_customer_info([r.get("party") for r in (meetings + all_scheduled) if r.get("party")])

    actual_count = len(meetings)
    scheduled_count = len(all_scheduled)
    
    # Achievement = Actual / Scheduled. If Scheduled is 0, show N/A
    if scheduled_count > 0:
        achievement_pct = round((actual_count / scheduled_count) * 100, 1)
    else:
        achievement_pct = "N/A"

    days = max((common["to_date"] - common["from_date"]).days + 1, 1)
    avg_per_day = round(actual_count / days, 2)

    cards = {
        "scheduled_meetings": _card("scheduled_meetings", scheduled_count),
        "actual_meetings": _card("actual_meetings", actual_count),
        "achievement_pct": _card("achievement_pct", achievement_pct),
        "avg_per_day": _card("avg_per_day", avg_per_day),
    }
    if not light:
        cards["new_customers"] = _card("new_customers", count_new_customers(
            {r["party"] for r in meetings if r.get("party")}, common["from_date"]))

    return cards, {"meetings": meetings, "all_scheduled": all_scheduled, "customer_info": customer_info}

def _card(key, value):
    meta = CARD_META[key].copy()
    meta["value"] = value
    return meta


def _attach_deltas(cards, prev_cards):
    for key, card in cards.items():
        prev = prev_cards.get(key)
        if prev is None:
            continue
        prev_val = prev.get("value") or 0
        curr_val = card.get("value")
        
        # Skip math for non-numeric values like "N/A"
        if curr_val == "N/A" or prev_val == "N/A" or not isinstance(curr_val, (int, float)):
            card["previous"] = prev_val if isinstance(prev_val, (int, float)) else 0
            card["delta_pct"] = None
            continue

        if prev_val == 0:
            card["previous"] = prev_val
            card["delta_pct"] = None if curr_val == 0 else 100.0
        else:
            card["previous"] = prev_val
            card["delta_pct"] = round((curr_val - prev_val) / abs(prev_val) * 100, 2)


def count_new_customers(parties_in_period, from_date):
    if not parties_in_period:
        return 0
    new_count = 0
    for party in parties_in_period:
        earliest = frappe.db.sql(
            """
            SELECT MIN(d) AS earliest FROM (
                SELECT DATE(meeting_from) AS d FROM `tabMeeting`
                WHERE party = %(party)s AND party_type = 'Customer' AND docstatus = 1
                UNION ALL
                SELECT DATE(scheduled_from) AS d FROM `tabMeeting Schedule`
                WHERE party = %(party)s AND party_type = 'Customer'
            ) x
            """,
            {"party": party}, as_dict=True,
        )
        if earliest and earliest[0]["earliest"] and getdate(earliest[0]["earliest"]) >= getdate(from_date):
            new_count += 1
    return new_count


# ──────────────────────────────────────────────────────────────────────────
# Charts
# ──────────────────────────────────────────────────────────────────────────

def get_trend_chart(common):
    cond_m, values_m = get_meeting_conditions(common, alias="m")
    cond_ms, values_ms = get_schedule_conditions(common, alias="ms")

    actual_rows = frappe.db.sql(
        f"""SELECT DATE(m.meeting_from) AS d, COUNT(*) AS cnt FROM `tabMeeting` m
        WHERE {cond_m} GROUP BY DATE(m.meeting_from)""", values_m, as_dict=True,
    )
    scheduled_rows = frappe.db.sql(
        f"""SELECT DATE(ms.scheduled_from) AS d, COUNT(*) AS cnt FROM `tabMeeting Schedule` ms
        WHERE {cond_ms} GROUP BY DATE(ms.scheduled_from)""", values_ms, as_dict=True,
    )

    actual_map = {str(r["d"]): r["cnt"] for r in actual_rows}
    scheduled_map = {str(r["d"]): r["cnt"] for r in scheduled_rows}
    all_dates = sorted(set(actual_map) | set(scheduled_map))

    return {
        "labels": [getdate(d).strftime("%b %d") for d in all_dates],
        "actual": [actual_map.get(d, 0) for d in all_dates],
        "scheduled": [scheduled_map.get(d, 0) for d in all_dates],
    }


def get_grade_donut(meetings, customer_info):
    counts = {}
    for m in meetings:
        # Use the "grade" key from customer_info dict
        grade = (customer_info.get(m.get("party")) or {}).get("grade") or "Unclassified"
        counts[grade] = counts.get(grade, 0) + 1
    total = sum(counts.values())
    segments = [
        {"label": g, "count": c, "pct": round((c / total) * 100, 1) if total else 0}
        for g, c in sorted(counts.items(), key=lambda x: -x[1])
    ]
    return {"total": total, "segments": segments}


def get_territory_chart(common, all_scheduled):
    cond_m, values_m = get_meeting_conditions(common, alias="m")
    actual_rows = frappe.db.sql(
        f"""
        SELECT IFNULL(cust.territory, 'Unassigned') AS territory, COUNT(*) AS cnt
        FROM `tabMeeting` m LEFT JOIN `tabCustomer` cust ON cust.name = m.party
        WHERE {cond_m} GROUP BY IFNULL(cust.territory, 'Unassigned')
        """, values_m, as_dict=True,
    )
    actual_by_territory = {r["territory"]: r["cnt"] for r in actual_rows}

    parties = list({r["party"] for r in all_scheduled if r.get("party")})
    customer_territory = {}
    if parties:
        cust_rows = frappe.db.get_all("Customer", filters={"name": ["in", parties]}, fields=["name", "territory"])
        customer_territory = {c.name: c.territory or "Unassigned" for c in cust_rows}

    scheduled_by_territory = {}
    for r in all_scheduled:
        t = customer_territory.get(r.get("party"), "Unassigned")
        scheduled_by_territory[t] = scheduled_by_territory.get(t, 0) + 1

    result = []
    for t in set(actual_by_territory) | set(scheduled_by_territory):
        actual, scheduled = actual_by_territory.get(t, 0), scheduled_by_territory.get(t, 0)
        result.append({
            "territory": t, "actual": actual, "scheduled": scheduled,
            "achievement_pct": round((actual / scheduled) * 100, 1) if scheduled else None,
        })
    result.sort(key=lambda x: -x["actual"])
    return result


def get_period_meetings(meetings, customer_info):
    result = []
    for m in meetings:
        cust = customer_info.get(m.get("party")) or {}
        result.append({
            "date": frappe.utils.format_date(m["meeting_from"]) if m.get("meeting_from") else "",
            "time": frappe.utils.format_datetime(m["meeting_from"], "hh:mm a") if m.get("meeting_from") else "",
            "employee": m.get("user_name") or m.get("user_email") or "Unassigned",
            "employee_email": m.get("user_email") or "",
            "customer": cust.get("customer_name") or m.get("party") or "",
            "grade": cust.get("grade") or "Unclassified",
            "meeting_name": m.get("name"),
        })
    result.sort(key=lambda x: x.get("date", "") + x.get("time", ""))
    return result


# ──────────────────────────────────────────────────────────────────────────
# Team performance
# ──────────────────────────────────────────────────────────────────────────

def get_team_table(common, all_scheduled):
    cond_m, values_m = get_meeting_conditions(common, alias="m")

    # Meeting Target on Sales Person is a MONTHLY figure — scale it
    multiplier = get_target_multiplier(common.get("preset"), common["from_date"], common["to_date"])

    # Determine fiscal year for the period start
    fiscal_year = frappe.get_value("Fiscal Year", {
        "year_start_date": ["<=", common["from_date"]],
        "year_end_date": [">=", common["from_date"]]
    }, "name")

    sp_rows = frappe.db.sql(
        """
        SELECT sp.name AS sales_person, sp.sales_person_name AS employee_name, e.user_id AS user_email
        FROM `tabSales Person` sp LEFT JOIN `tabEmployee` e ON e.name = sp.employee
        WHERE sp.enabled = 1
        """, as_dict=True,
    )

    # Bulk-fetch meeting targets using target_reach field
    sales_person_names = [r["sales_person"] for r in sp_rows]
    target_map = {}
    if sales_person_names and fiscal_year:
        try:
            target_rows = frappe.db.get_all(
                "Target Detail",
                filters={
                    "parent": ["in", sales_person_names],
                    "parenttype": "Sales Person",
                    "fiscal_year": fiscal_year
                },
                fields=["parent", MEETING_TARGET_FIELD]  # "target_reach"
            )
            target_map = {r["parent"]: (r.get(MEETING_TARGET_FIELD) or 0) for r in target_rows}
        except Exception:
            target_map = {}

    actual_rows = frappe.db.sql(
        f"""
        SELECT m.meeting_arranged_by AS user_email, COUNT(*) AS actual, COUNT(DISTINCT m.party) AS customers
        FROM `tabMeeting` m WHERE {cond_m} GROUP BY m.meeting_arranged_by
        """, values_m, as_dict=True,
    )
    actual_map = {r["user_email"]: r for r in actual_rows}

    scheduled_map = {}
    for r in all_scheduled:
        u = r.get("user_email")
        scheduled_map[u] = scheduled_map.get(u, 0) + 1

    filtered_user, territory = common.get("user"), common.get("territory")
    table = []
    for r in sp_rows:
        if filtered_user and r["user_email"] != filtered_user:
            continue
        stats = actual_map.get(r["user_email"], {"actual": 0, "customers": 0})
        actual, scheduled = stats["actual"], scheduled_map.get(r["user_email"], 0)
        # Use target_reach value
        base_meeting_target = int(target_map.get(r["sales_person"], 0) or 0)
        meeting_target = base_meeting_target * multiplier

        if actual == 0 and scheduled == 0 and meeting_target == 0:
            continue
        if territory and not has_meeting_in_territory(r["user_email"], territory, common):
            continue

        # Achievement vs (period-scaled) meeting target when set, otherwise fall back to scheduled
        if meeting_target:
            achievement_pct = round((actual / meeting_target) * 100, 1)
        else:
            achievement_pct = round((actual / scheduled) * 100, 1) if scheduled else 0.0

        table.append({
            "employee": r["employee_name"] or r["user_email"] or "Unassigned",
            "employee_email": r["user_email"] or "",
            "meeting_target": meeting_target,
            "base_meeting_target": base_meeting_target,
            "target_multiplier": multiplier,
            "target": scheduled,
            "actual": actual,
            "achievement_pct": achievement_pct,
            "customers": stats["customers"],
        })
    table.sort(key=lambda x: -x["actual"])
    return table


def has_meeting_in_territory(user_email, territory, common):
    if not user_email:
        return False
    cond_m, values_m = get_meeting_conditions(common, alias="m")
    values_m.update({"user_email": user_email, "territory": territory})
    rows = frappe.db.sql(
        f"""
        SELECT 1 FROM `tabMeeting` m LEFT JOIN `tabCustomer` cust ON cust.name = m.party
        WHERE {cond_m} AND m.meeting_arranged_by = %(user_email)s AND cust.territory = %(territory)s LIMIT 1
        """, values_m,
    )
    return bool(rows)


# ──────────────────────────────────────────────────────────────────────────
# Daily activity (today)
# ──────────────────────────────────────────────────────────────────────────

def get_daily_activity(common=None):
    today = nowdate()
    f = {
        "from_date": today,
        "to_date": today,
        "user": (common or {}).get("user"),
        "territory": (common or {}).get("territory"),
    }
    held = get_meetings_in_range(f)
    scheduled = get_scheduled_in_range(f)

    parties = [r.get("party") for r in (held + scheduled) if r.get("party")]
    customer_info = get_customer_info(parties)

    activity = []
    for r in held:
        cust = customer_info.get(r["party"], {})
        activity.append({
            "date": frappe.utils.format_date(r["meeting_from"]) if r.get("meeting_from") else "",
            "time": frappe.utils.format_datetime(r["meeting_from"], "hh:mm a") if r.get("meeting_from") else "",
            "sort_time": str(r.get("meeting_from") or ""),
            "employee": r.get("user_name") or r.get("user_email") or "Unassigned",
            "customer": cust.get("customer_name") or r.get("party") or "",
            "grade": cust.get("grade") or "Unclassified",
            "meeting_name": r.get("name"), "meeting_type": "Held",
        })
    for r in scheduled:
        cust = customer_info.get(r["party"], {})
        activity.append({
            "date": frappe.utils.format_date(r["scheduled_from"]) if r.get("scheduled_from") else "",
            "time": frappe.utils.format_datetime(r["scheduled_from"], "hh:mm a") if r.get("scheduled_from") else "",
            "sort_time": str(r.get("scheduled_from") or ""),
            "employee": r.get("user_name") or r.get("user_email") or "Unassigned",
            "customer": cust.get("customer_name") or r.get("party") or "",
            "grade": cust.get("grade") or "Unclassified",
            "meeting_name": r.get("name"), "meeting_type": "Scheduled",
        })
    activity.sort(key=lambda x: x["sort_time"])
    return activity