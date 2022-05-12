# /home/finbyz/innovative/apps/engr/engr/engineering/report/sales_invoice_trends_graphicarb/sales_invoice_trends_graphicarb.py

# Copyright (c) 2022, Finbyz Tech. Pvt. Ltd. and contributors
# For license information, please see license.txt

# import frappe

from frappe.utils import getdate
from frappe import _
import frappe


def execute(filters=None):
	if not filters:
		filters = {}
	data = []
	conditions = get_columns(filters, "Sales Invoice")
	data = get_data(filters, conditions)
	return conditions["columns"], data

# Copyright (c) 2015, Frappe Technologies Pvt. Ltd. and Contributors
# License: GNU General Public License v3. See license.txt


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
		+[_("Branch") + ":Link/Branch:120"]
	)
	if group_by_cols:
		columns = (
			based_on_details["based_on_cols"]
			+ group_by_cols
			+ period_cols
			+ [_("Total(Qty)") + ":Float:120",
			   _("Total(Amt)") + ":Currency:120"]
			+[_("Branch") + ":Link/Branch:120"]
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
		frappe.throw(_("Fiscal Year {0} Does Not Exist").format(
			filters.get("fiscal_year")))

	if filters.get("based_on") == filters.get("group_by"):
		frappe.throw(_("'Based On' and 'Group By' can not be same"))


def get_data(filters, conditions):
	data = []
	inc, cond = "", ""
	query_details = conditions["based_on_select"] + \
		conditions["period_wise_select"]

	posting_date = "t1.transaction_date"
	if conditions.get("trans") in [
			"Sales Invoice",
			"Purchase Invoice",
			"Purchase Receipt",
			"Delivery Note",
	]:
		posting_date = "t1.posting_date"
		if filters.period_based_on:
			posting_date = "t1." + filters.period_based_on

	if conditions["based_on_select"] in ["t1.project,", "t2.project,"]:
		cond = " and " + conditions["based_on_select"][:-1] + " IS Not NULL"
	if conditions.get("trans") in ["Sales Order", "Purchase Order"]:
		cond += " and t1.status != 'Closed'"

	if conditions.get("trans") == "Quotation" and filters.get("group_by") == "Customer":
		cond += " and t1.quotation_to = 'Customer'"

	if filters.get("branch"):
		cond += " and id.branch in {} ".format("(" + ", ".join([f'"{l}"' for l in filters.get("branch")]) + ")")

	# if filters.get("branch"):
	#     cond += " and id.branch = '{}'".format(filters.get("branch"))
	
	# if filters.get("customer") and filters.get("based_on") == "Customer" :
	#     cond += " and t1.customer = '{}'".format(filters.get("customer"))
	
	if filters.get("customer"):
		cond += " and t1.customer = '{}'".format(filters.get("customer"))

	year_start_date, year_end_date = frappe.db.get_value(
		"Fiscal Year", filters.get("fiscal_year"), [
			"year_start_date", "year_end_date"]
	)

	if filters.get("group_by"):
		sel_col = ""
		ind = conditions["columns"].index(conditions["grbc"][0])

		if filters.get("group_by") == "Item":
			sel_col = "t2.item_code"
		elif filters.get("group_by") == "Customer":
			sel_col = "t1.party_name" if conditions.get(
				"trans") == "Quotation" else "t1.customer"
		elif filters.get("group_by") == "Supplier":
			sel_col = "t1.supplier"

		if filters.get("based_on") in ["Item", "Customer", "Supplier"]:
			inc = 2
		else:
			inc = 1

		data1 = frappe.db.sql(
			""" select %s, id.branch from `tab%s` t1, `tab%s Item` t2 %s
				left join `tabItem` id on t2.item_code = id.item_code
					where t2.parent = t1.name and t1.company = %s and %s between %s and %s and
					t1.docstatus = 1 %s %s
					group by %s
				"""
			% (
				query_details,
				conditions["trans"],
				conditions["trans"],
				conditions["addl_tables"],
				"%s",
				posting_date,
				"%s",
				"%s",
				conditions.get("addl_tables_relational_cond"),
				cond,
				conditions["group_by"],
			),
			(filters.get("company"), year_start_date, year_end_date),
			as_list=1,
		)

		for d in range(len(data1)):
			# to add blanck column
			dt = data1[d]
			dt.insert(ind, "")
			data.append(dt)

			# to get distinct value of col specified by group_by in filter
			row = frappe.db.sql(
				"""select DISTINCT(%s),'' as branch from `tab%s` t1, `tab%s Item` t2 %s
				left join `tabItem` id on t2.item_code = id.item_code
						where t2.parent = t1.name and t1.company = %s and %s between %s and %s
						and t1.docstatus = 1 and %s = %s %s %s
					"""
				% (
					sel_col,
					conditions["trans"],
					conditions["trans"],
					conditions["addl_tables"],
					"%s",
					posting_date,
					"%s",
					"%s",
					conditions["group_by"],
					"%s",
					conditions.get("addl_tables_relational_cond"),
					cond,
				),
				(filters.get("company"), year_start_date,
				 year_end_date, data1[d][0]),
				as_list=1,
			)

			for i in range(len(row)):
				des = ["" for q in range(len(conditions["columns"]))]

				# get data for group_by filter
				row1 = frappe.db.sql(
					""" select %s , %s,id.branch from `tab%s` t1, `tab%s Item` t2 %s
					left join `tabItem` id on t2.item_code = id.item_code
							where t2.parent = t1.name and t1.company = %s and %s between %s and %s
							and t1.docstatus = 1 and %s = %s and %s = %s %s %s
						"""
					% (
						sel_col,
						conditions["period_wise_select"],
						conditions["trans"],
						conditions["trans"],
						conditions["addl_tables"],
						"%s",
						posting_date,
						"%s",
						"%s",
						sel_col,
						"%s",
						conditions["group_by"],
						"%s",
						conditions.get("addl_tables_relational_cond"),
						cond,
					),
					(filters.get("company"), year_start_date,
					 year_end_date, row[i][0], data1[d][0]),
					as_list=1,
				)

				des[ind] = row[i][0]

				for j in range(1, len(conditions["columns"]) - inc):
					try:
						des[j + inc] = row1[0][j]
					except:
						pass
						# frappe.msgprint(str(j)+"  "+str(conditions["columns"])+"  "+str(inc) )

				data.append(des)
	else:
		data = frappe.db.sql(
			""" select %s, id.branch from `tab%s` t1, `tab%s Item` t2 %s
				left join `tabItem` id on t2.item_code = id.item_code
					where t2.parent = t1.name and t1.company = %s and %s between %s and %s and
					t1.docstatus = 1 %s %s
					group by %s
				"""
			% (
				query_details,
				conditions["trans"],
				conditions["trans"],
				conditions["addl_tables"],
				"%s",
				posting_date,
				"%s",
				"%s",
				cond,
				conditions.get("addl_tables_relational_cond", ""),
				conditions["group_by"],
			),
			(filters.get("company"), year_start_date, year_end_date),
			as_list=1,
		)
	return data


def get_mon(dt):
	return getdate(dt).strftime("%b")


def period_wise_columns_query(filters, trans):
	query_details = ""
	pwc = []
	bet_dates = get_period_date_ranges(
		filters.get("period"), filters.get("fiscal_year"))

	if trans in ["Purchase Receipt", "Delivery Note", "Purchase Invoice", "Sales Invoice"]:
		trans_date = "posting_date"
		if filters.period_based_on:
			trans_date = filters.period_based_on
	else:
		trans_date = "transaction_date"

	if filters.get("period") != "Yearly":
		for dt in bet_dates:
			get_period_wise_columns(dt, filters.get("period"), pwc)
			query_details = get_period_wise_query(
				dt, trans_date, query_details)
	else:
		pwc = [
			_(filters.get("fiscal_year")) + " (" + _("Qty") + "):Float:120",
			_(filters.get("fiscal_year")) + " (" + _("Amt") + "):Currency:120",
		]
		query_details = " SUM(t2.stock_qty), SUM(t2.base_net_amount),"

	query_details += "SUM(t2.stock_qty), SUM(t2.base_net_amount)"
	return pwc, query_details


def get_period_wise_columns(bet_dates, period, pwc):
	if period == "Monthly":
		pwc += [
			_(get_mon(bet_dates[0])) + " (" + _("Qty") + "):Float:120",
			_(get_mon(bet_dates[0])) + " (" + _("Amt") + "):Currency:120",
		]
	else:
		pwc += [
			_(get_mon(bet_dates[0])) + "-" + _(get_mon(bet_dates[1])
											   ) + " (" + _("Qty") + "):Float:120",
			_(get_mon(bet_dates[0])) + "-" + _(get_mon(bet_dates[1])
											   ) + " (" + _("Amt") + "):Currency:120",
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


@frappe.whitelist(allow_guest=True)
def get_period_date_ranges(period, fiscal_year=None, year_start_date=None):
	from dateutil.relativedelta import relativedelta

	if not year_start_date:
		year_start_date, year_end_date = frappe.db.get_value(
			"Fiscal Year", fiscal_year, ["year_start_date", "year_end_date"]
		)

	increment = {"Monthly": 1, "Quarterly": 3,
				 "Half-Yearly": 6, "Yearly": 12}.get(period)

	period_date_ranges = []
	for i in range(1, 13, increment):
		period_end_date = getdate(year_start_date) + \
			relativedelta(months=increment, days=-1)
		if period_end_date > getdate(year_end_date):
			period_end_date = year_end_date
		period_date_ranges.append([year_start_date, period_end_date])
		year_start_date = period_end_date + relativedelta(days=1)
		if period_end_date == year_end_date:
			break

	return period_date_ranges


def get_period_month_ranges(period, fiscal_year):
	from dateutil.relativedelta import relativedelta

	period_month_ranges = []

	for start_date, end_date in get_period_date_ranges(period, fiscal_year):
		months_in_this_period = []
		while start_date <= end_date:
			months_in_this_period.append(start_date.strftime("%B"))
			start_date += relativedelta(months=1)
		period_month_ranges.append(months_in_this_period)

	return period_month_ranges


def based_wise_columns_query(based_on, trans):
	based_on_details = {}

	# based_on_cols, based_on_select, based_on_group_by, addl_tables
	if based_on == "Item":
		based_on_details["based_on_cols"] = [
			"Item:Link/Item:120", "Item Name:Data:120"]
		# based_on_details["based_on_cols"] = [
		#     {
		# 	"label": _("Item"),
		# 	"fieldname": "item",
		# 	"fieldtype": "Link",
		# 	"options": "Item",
		# 	"width": 140,
		#     "align" : "left"
		# },
		# {
		# 	"label": _("Item Name"),
		# 	"fieldname": "item_name",
		# 	"fieldtype": "Data",
		# 	"width": 140,
		#     "align" : "left"
		# },
		# ]
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
			# "Branch:Link/Branch:120",
		]
		based_on_details["based_on_select"] = "t1.customer_name, t1.territory, "
		based_on_details["based_on_group_by"] = (
			"t1.party_name" if trans == "Quotation" else "t1.customer"
		)
		based_on_details["addl_tables"] = ""

	elif based_on == "Customer Group":
		based_on_details["based_on_cols"] = [
			"Customer Group:Link/Customer Group"]
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
		based_on_details["based_on_cols"] = [
			"Supplier Group:Link/Supplier Group:140"]
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
		return [{
			"label": _(group_by),
			"fieldname": group_by,
			"fieldtype": "Link",
			"options":group_by,
			"width": 140,
			"align" : "left"
		}]
		# return [group_by + ":Link/" + group_by +":left"+ ":120"]
	else:
		return []
