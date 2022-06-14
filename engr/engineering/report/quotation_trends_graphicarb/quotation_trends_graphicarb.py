# Copyright (c) 2015, Frappe Technologies Pvt. Ltd. and Contributors
# License: GNU General Public License v3. See license.txt


import frappe
from frappe import _
from frappe.utils import getdate

from erpnext.controllers.trends import get_columns, get_data


def execute(filters=None):
	if not filters:
		filters = {}
	data = []
	conditions = get_columns(filters, "Quotation")
	data = get_data(filters, conditions)

	chart_data = get_chart_data(data, conditions, filters)

	return conditions["columns"], data, None, chart_data


def get_chart_data(data, conditions, filters):
	if not (data and conditions):
		return []

	datapoints = []

	start = 2 if filters.get("based_on") in ["Item", "Customer"] else 1
	if filters.get("group_by"):
		start += 1

	# fetch only periodic columns as labels
	columns = conditions.get("columns")[start:-2][1::2]
	labels = [column.split(":")[0] for column in columns]
	datapoints = [0] * len(labels)

	for row in data:
		# If group by filter, don't add first row of group (it's already summed)
		if not row[start - 1]:
			continue
		# Remove None values and compute only periodic data
		row = [x if x else 0 for x in row[start:-2]]
		row = row[1::2]

		for i in range(len(row)):
			datapoints[i] += row[i]

	return {
		"data": {
			"labels": labels,
			"datasets": [
				{"name": _("{0}").format(filters.get("period")) + _(" Quoted Amount"), "values": datapoints}
			],
		},
		"type": "line",
		"lineOptions": {"regionFill": 1},
		"fieldtype": "Currency",
	}

def get_columns(filters, trans):
	validate_filters(filters)

	# get conditions for based_on filter cond
	based_on_details = based_wise_columns_query(filters.get("based_on"), trans)
	# get conditions for periodic filter cond
	period_cols, period_select = period_wise_columns_query(filters, trans)
	# get conditions for grouping filter cond
	group_by_cols = group_wise_column(filters.get("group_by"))

	columns = (
		based_on_details["based_on_cols"]
		+ period_cols
		+ [_("Total(Qty)") + ":Float:120", _("Total(Amt)") + ":Currency:120"]
	)
	if group_by_cols:
		columns = (
			based_on_details["based_on_cols"]
			+ group_by_cols
			+ period_cols
			+ [_("Total(Qty)") + ":Float:120", _("Total(Amt)") + ":Currency:120"]
		)

	conditions = {
		"based_on_select": based_on_details["based_on_select"],
		"period_wise_select": period_select,
		"columns": columns,
		"group_by": based_on_details["based_on_group_by"],
		"grbc": group_by_cols,
		"trans": trans,
		"addl_tables": based_on_details["addl_tables"],
		"addl_tables_relational_cond": based_on_details.get("addl_tables_relational_cond", ""),
	}

	return conditions
def validate_filters(filters):
	for f in ["Fiscal Year", "Based On", "Period", "Company"]:
		if not filters.get(f.lower().replace(" ", "_")):
			frappe.throw(_("{0} is mandatory").format(f))

	if not frappe.db.exists("Fiscal Year", filters.get("fiscal_year")):
		frappe.throw(_("Fiscal Year {0} Does Not Exist").format(filters.get("fiscal_year")))

	if filters.get("based_on") == filters.get("group_by"):
		frappe.throw(_("'Based On' and 'Group By' can not be same"))

def based_wise_columns_query(based_on, trans):
	based_on_details = {}

	# based_on_cols, based_on_select, based_on_group_by, addl_tables
	if based_on == "Item":
		based_on_details["based_on_cols"] = ["Item:Link/Item:120", "Item Name:Data:120"]
		based_on_details["based_on_select"] = "t2.item_code, t2.item_name,"
		based_on_details["based_on_group_by"] = "t2.item_code"
		based_on_details["addl_tables"] = ""

	elif based_on == "Item Group":
		based_on_details["based_on_cols"] = ["Item Group:Link/Item Group:120"]
		based_on_details["based_on_select"] = "t2.item_group,"
		based_on_details["based_on_group_by"] = "t2.item_group"
		based_on_details["addl_tables"] = ""

	elif based_on == "Customer":
		based_on_details["based_on_cols"] = [
			"Customer:Link/Customer:120",
			"Territory:Link/Territory:120",
		]
		based_on_details["based_on_select"] = "t1.customer_name, t1.territory, "
		based_on_details["based_on_group_by"] = (
			"t1.party_name" if trans == "Quotation" else "t1.customer"
		)
		based_on_details["addl_tables"] = ""

	elif based_on == "Customer Group":
		based_on_details["based_on_cols"] = ["Customer Group:Link/Customer Group"]
		based_on_details["based_on_select"] = "t1.customer_group,"
		based_on_details["based_on_group_by"] = "t1.customer_group"
		based_on_details["addl_tables"] = ""

	elif based_on == "Supplier":
		based_on_details["based_on_cols"] = [
			"Supplier:Link/Supplier:120",
			"Supplier Group:Link/Supplier Group:140",
		]
		based_on_details["based_on_select"] = "t1.supplier, t3.supplier_group,"
		based_on_details["based_on_group_by"] = "t1.supplier"
		based_on_details["addl_tables"] = ",`tabSupplier` t3"
		based_on_details["addl_tables_relational_cond"] = " and t1.supplier = t3.name"

	elif based_on == "Supplier Group":
		based_on_details["based_on_cols"] = ["Supplier Group:Link/Supplier Group:140"]
		based_on_details["based_on_select"] = "t3.supplier_group,"
		based_on_details["based_on_group_by"] = "t3.supplier_group"
		based_on_details["addl_tables"] = ",`tabSupplier` t3"
		based_on_details["addl_tables_relational_cond"] = " and t1.supplier = t3.name"

	elif based_on == "Territory":
		based_on_details["based_on_cols"] = ["Territory:Link/Territory:120"]
		based_on_details["based_on_select"] = "t1.territory,"
		based_on_details["based_on_group_by"] = "t1.territory"
		based_on_details["addl_tables"] = ""

	elif based_on == "Project":
		if trans in ["Sales Invoice", "Delivery Note", "Sales Order"]:
			based_on_details["based_on_cols"] = ["Project:Link/Project:120"]
			based_on_details["based_on_select"] = "t1.project,"
			based_on_details["based_on_group_by"] = "t1.project"
			based_on_details["addl_tables"] = ""
		elif trans in ["Purchase Order", "Purchase Invoice", "Purchase Receipt"]:
			based_on_details["based_on_cols"] = ["Project:Link/Project:120"]
			based_on_details["based_on_select"] = "t2.project,"
			based_on_details["based_on_group_by"] = "t2.project"
			based_on_details["addl_tables"] = ""
		else:
			frappe.throw(_("Project-wise data is not available for Quotation"))

	return based_on_details

def group_wise_column(group_by):
	if group_by:
		return [group_by + ":Link/" + group_by + ":120"]
	else:
		return []

def period_wise_columns_query(filters, trans):
	query_details = ""
	pwc = []
	bet_dates = get_period_date_ranges(filters.get("period"), filters.get("fiscal_year"))

	if trans in ["Purchase Receipt", "Delivery Note", "Purchase Invoice", "Sales Invoice"]:
		trans_date = "posting_date"
		if filters.period_based_on:
			trans_date = filters.period_based_on
	else:
		trans_date = "transaction_date"

	if filters.get("period") != "Yearly":
		for dt in bet_dates:
			get_period_wise_columns(dt, filters.get("period"), pwc)
			query_details = get_period_wise_query(dt, trans_date, query_details)
	else:
		pwc = [
			_(filters.get("fiscal_year")) + " (" + _("Qty") + "):Float:120",
			_(filters.get("fiscal_year")) + " (" + _("Amt") + "):Currency:120",
		]
		query_details = " SUM(t2.stock_qty), SUM(t2.base_net_amount),"

	query_details += "SUM(t2.stock_qty), SUM(t2.base_net_amount)"
	return pwc, query_details


@frappe.whitelist(allow_guest=True)
def get_period_date_ranges(period, fiscal_year=None, year_start_date=None):
	from dateutil.relativedelta import relativedelta

	if not year_start_date:
		year_start_date, year_end_date = frappe.db.get_value(
			"Fiscal Year", fiscal_year, ["year_start_date", "year_end_date"]
		)

	increment = {"Monthly": 1, "Quarterly": 3, "Half-Yearly": 6, "Yearly": 12}.get(period)

	period_date_ranges = []
	for i in range(1, 13, increment):
		period_end_date = getdate(year_start_date) + relativedelta(months=increment, days=-1)
		if period_end_date > getdate(year_end_date):
			period_end_date = year_end_date
		period_date_ranges.append([year_start_date, period_end_date])
		year_start_date = period_end_date + relativedelta(days=1)
		if period_end_date == year_end_date:
			break

	return period_date_ranges

def get_period_wise_columns(bet_dates, period, pwc):
	if period == "Monthly":
		pwc += [
			_(get_mon(bet_dates[0])) + " (" + _("Qty") + "):Float:120",
			_(get_mon(bet_dates[0])) + " (" + _("Amt") + "):Currency:120",
		]
	else:
		pwc += [
			_(get_mon(bet_dates[0])) + "-" + _(get_mon(bet_dates[1])) + " (" + _("Qty") + "):Float:120",
			_(get_mon(bet_dates[0])) + "-" + _(get_mon(bet_dates[1])) + " (" + _("Amt") + "):Currency:120",
		]


def get_period_wise_query(bet_dates, trans_date, query_details):
	query_details += """SUM(IF(t1.%(trans_date)s BETWEEN '%(sd)s' AND '%(ed)s', t2.stock_qty, NULL)),
					SUM(IF(t1.%(trans_date)s BETWEEN '%(sd)s' AND '%(ed)s', t2.base_net_amount, NULL)),
				""" % {
		"trans_date": trans_date,
		"sd": bet_dates[0],
		"ed": bet_dates[1],
	}
	return query_details

def get_mon(dt):
	return getdate(dt).strftime("%b")