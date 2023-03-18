# Copyright (c) 2023, Finbyz Tech. Pvt. Ltd. and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.utils import flt, getdate
from itertools import zip_longest


def execute(filters=None):
	data = get_data(filters)
	return data


def get_data(filters):

	columns = [
		{
			"fieldname": "month",
			"label": ("Month"),
			"fieldtype": "Data",
			"width": 100
		},
	]

	terr = frappe.db.sql(f"""
			SELECT Distinct name, lft, rgt from `tabTerritory` where name in ('NASHIK', 'PUNE')
		""", as_dict =1)

	# terr = frappe.db.sql(f"""
	# 		SELECT Distinct name, lft, rgt from `tabTerritory` where territory_type = 'Zone'
	# 	""", as_dict =1)

	terr_dict = {}
	for row in terr:
		columns.append(
			{ "label": _(f"{row.name} - {filters.get('fiscal_year1')}"),"fieldname": f"{row.name}_{filters.get('fiscal_year1')}","fieldtype": "Currency", "width": 300})
		columns.append(
			{ "label": _(f"{row.name} - {filters.get('fiscal_year2')}"),"fieldname": f"{row.name}_{filters.get('fiscal_year2')}","fieldtype": "Currency", "width": 300})
	
		terr_dict.update({row.name : [row.lft, row.rgt]})

	bet_dates1 = get_period_date_ranges(period = "Monthly", fiscal_year = filters.get("fiscal_year1"))
	bet_dates2 = get_period_date_ranges(period = "Monthly", fiscal_year = filters.get("fiscal_year2"))

	month_list1 = []
	if bet_dates1:
		for dt in bet_dates1:
			if get_mon(dt[0]) not in month_list1:
				month_list1.append(get_mon(dt[0]))
	
	month_list2 = []
	if bet_dates2:
		for dt in bet_dates2:
			if get_mon(dt[0]) not in month_list2:
				month_list2.append(get_mon(dt[0]))
	
	result1 = {f"{month_list1[i]}_{filters.get('fiscal_year1')}": bet_dates1[i] for i in range(len(month_list1))}
	result2 = {f"{month_list2[i]}_{filters.get('fiscal_year1')}": bet_dates1[i] for i in range(len(month_list2))}

	final_data = []
	# fiscal1 = frappe.db.get_value("Fiscal Year", filters.get('fiscal_year1'), "fiscal")
	# fiscal2 = frappe.db.get_value("Fiscal Year", filters.get('fiscal_year2'), "fiscal")

	# si_data_1 = []
	# si_data_2 = []
	# for terr in terr_dict:
	# 	si_data_1 += [frappe.db.sql(f"""
	# 		SELECT 
	# 			si.total, '{terr}' as Zone, si.posting_date
	# 		FROM
	# 			`tabSales Invoice` as si
	# 		JOIN
	# 			`tabTerritory` as ter on ter.name = si.territory
	# 		WHERE
	# 			si.docstatus = 1 and si.fiscal = '{fiscal1}' and ter.lft >= {flt(terr_dict[terr][0])} and ter.rgt <= {flt(terr_dict[terr][1])}
	# 	""", as_dict = 1)]
	
	# 	si_data_2 += [frappe.db.sql(f"""
	# 		SELECT 
	# 			si.total, '{terr}' as Zone,  si.posting_date
	# 		FROM
	# 			`tabSales Invoice` as si
	# 		JOIN
	# 			`tabTerritory` as ter on ter.name = si.territory
	# 		WHERE
	# 			si.docstatus = 1 and si.fiscal = '{fiscal2}' and ter.lft >= {flt(terr_dict[terr][0])} and ter.rgt <= {flt(terr_dict[terr][1])}
	# 	""", as_dict = 1)]


	
	for row in month_list1:
		for terr in terr_dict:
			si_data = frappe.db.sql(f"""
				SELECT 
					SUM(si.total)
				FROM
					`tabSales Invoice` as si
				JOIN 
					`tabTerritory` as ter
				WHERE
					si.docstatus = 1 and ter.lft >= {flt(terr_dict[terr][0])} and ter.rgt <= {flt(terr_dict[terr][1])} and si.posting_date >= '{result1[f"{row}_{filters.get('fiscal_year1')}"][0]}' and si.posting_date <= '{result1[f"{row}_{filters.get('fiscal_year1')}"][1]}'
			""", as_dict = 1)

	return columns, final_data

def get_mon(dt):
	return getdate(dt).strftime("%b")

def diff_month(d1, d2):
	return (d1.year - d2.year) * 12 + d1.month - d2.month

def get_period_date_ranges(period, fiscal_year=None, year_start_date=None):
	from dateutil.relativedelta import relativedelta

	if not year_start_date:
		year_start_date, year_end_date = frappe.get_cached_value(
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
