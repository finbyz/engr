# Copyright (c) 2022, Finbyz tech pvt ltd and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
from frappe import _
from erpnext.stock.utils import update_included_uom_in_report
from datetime import datetime

def execute(filters=None):
	include_uom = filters.get("include_uom")
	filters.transaction_status_perm = frappe.db.exists("User Permission",{"user":frappe.session.user, "allow":"Transaction Status"})
	columns = get_columns(filters)
	items = get_items(filters)
	sl_entries = get_stock_ledger_entries(filters, items)
	item_details = get_item_details(items, sl_entries, include_uom)
	opening_row = get_opening_balance(filters, columns)

	data = []
	conversion_factors = []
	if opening_row:
		data.append(opening_row)

	actual_qty = stock_value = 0

	for sle in sl_entries:
		item_detail = item_details[sle.item_code]

		sle.update(item_detail)

		if filters.get("batch_no"):
			actual_qty += sle.actual_qty
			stock_value += sle.stock_value_difference

			if sle.voucher_type == 'Stock Reconciliation':
				actual_qty = sle.qty_after_transaction
				stock_value = sle.stock_value

			sle.update({
				"qty_after_transaction": actual_qty,
				"stock_value": stock_value
			})
		
		if sle.actual_qty >= 0 :
			sle.inward_qty = sle.actual_qty
			sle.outward_qty = 0
			sle.inward_value = sle.stock_value_difference
			sle.outward_rate = 0
			sle.outward_amt = 0
		elif sle.actual_qty < 0:
			sle.outward_qty = abs(sle.actual_qty)
			sle.inward_qty = 0
			sle.inward_value = 0
			sle.outward_rate = abs(sle.stock_value_difference / sle.outward_qty)
			sle.outward_amt = abs(sle.stock_value_difference)
		data.append(sle)
		if include_uom:
			conversion_factors.append(item_detail.conversion_factor)

	update_included_uom_in_report(columns, data, include_uom, conversion_factors)
	
	pr_map = {}
	pri_data = frappe.db.sql(f""" SELECT parent , item_code ,lot_no
									From `tabPurchase Receipt Item` Where (lot_no is not null or lot_no != "") and docstatus = 1""" , as_dict = 1)
	for row in pri_data:
		pr_map[(row.parent , row.item_code)] = row 

	# pi_map = {}
	# pii_data = frappe.db.sql(f""" SELECT parent , item_code 
	# 								From `tabPurchase Invoice Item` Where (lot_no is not null or lot_no != "") and docstatus = 1""" , as_dict = 1)
	# for row in pii_data:
	# 	pi_map[(row.parent , row.item_code)] = row 

	dn_map = {}
	dni_data = frappe.db.sql(f""" SELECT parent , item_code ,lot_no
									From `tabDelivery Note Item` Where (lot_no is not null or lot_no != "") and docstatus = 1""" , as_dict = 1)
	for row in dni_data:
		dn_map[(row.parent , row.item_code)] = row 

	si_map = {}
	sii_data = frappe.db.sql(f""" SELECT parent , item_code ,lot_no
									From `tabSales Invoice Item` Where (lot_no is not null or lot_no != "") and docstatus = 1""" , as_dict = 1)
	for row in sii_data:
		si_map[(row.parent , row.item_code)] = row 

	se_map = {}
	sei_data = frappe.db.sql(f""" SELECT parent , item_code ,lot_no
									From `tabStock Entry Detail` Where (lot_no is not null or lot_no != "") and docstatus = 1""" , as_dict = 1)
	for row in sei_data:
		se_map[(row.parent , row.item_code)] = row 

	for row in data:
		if pr_map.get((row.voucher_no,row.item_code)):
			row.update({'lot_no': pr_map.get((row.voucher_no,row.item_code)).get('lot_no')})
		if se_map.get((row.voucher_no,row.item_code)):
			row.update({'lot_no' : se_map.get((row.voucher_no,row.item_code)).get('lot_no')})
		if si_map.get((row.voucher_no,row.item_code)):
			row.update({'lot_no' : si_map.get((row.voucher_no,row.item_code)).get('lot_no')})
		if dn_map.get((row.voucher_no,row.item_code)):
			row.update({'lot_no' : dn_map.get((row.voucher_no,row.item_code)).get('lot_no')})

	return columns, data

def get_columns(filters):
	columns = []
	columns += [{"label": _("Date"), "fieldname": "date", "fieldtype": "Datetime", "width": 140},
		{"label": _("Voucher Type"), "fieldname": "voucher_type", "width": 130},
		{"label": _("Voucher #"), "fieldname": "voucher_no", "fieldtype": "Dynamic Link", "options": "voucher_type", "width": 150},
		{"label": _("Particular"), "fieldname": "particular", "fieldtype": "Data","width": 150},
	]
	if not filters.get('item_code'):
		columns += [{"label": _("Item"), "fieldname": "item_code", "fieldtype": "Link", "options": "Item", "width": 240},]
	columns += [
		# {"label": _("Item Name"), "fieldname": "item_name", "width": 100},
		{"label": _("UOM"), "fieldname": "stock_uom", "fieldtype": "Link", "options": "UOM", "width": 50},
		# {"label": _("Qty"), "fieldname": "actual_qty", "fieldtype": "Float", "width": 70, "precision": 2, "convertible": "qty"},
		{"label": _("Inward Qty"), "fieldname": "inward_qty", "fieldtype": "Float","precision": 2, "width": 90, "convertible": "qty"},
		{"label": _("Incoming Rate"), "fieldname": "incoming_rate", "fieldtype": "Currency", "width": 90,
			"options": "Company:company:default_currency", "convertible": "rate"},
		{"label": _("Inward Amt"), "fieldname": "inward_value", "fieldtype": "Currency", "width": 90,
			"options": "Company:company:default_currency", "convertible": "rate"},
		{"label": _("Outward Qty"), "fieldname": "outward_qty", "fieldtype": "Float","precision": 2, "width": 90, "convertible": "qty"},

		 {"label": _("Outward Rate"), "fieldname": "outward_rate", "fieldtype": "Currency", "width": 90,
			"options": "Company:company:default_currency", "convertible": "rate"},
		{"label": _("Outward Amt"), "fieldname": "outward_amt", "fieldtype": "Currency", "width": 90,
			"options": "Company:company:default_currency", "convertible": "rate"},
		{"label": _("Balance Qty"), "fieldname": "qty_after_transaction", "fieldtype": "Float","precision": 2,  "width": 95, "convertible": "qty"},
		{"label": _("Valuation Rate"), "fieldname": "valuation_rate", "fieldtype": "Currency", "width": 90,
			"options": "Company:company:default_currency", "convertible": "rate"},
		{"label": _("Balance Value"), "fieldname": "stock_value", "fieldtype": "Currency", "width": 110,
			"options": "Company:company:default_currency"},
		{"label": _("Batch"), "fieldname": "batch_no", "fieldtype": "Link", "options": "Batch", "width": 100},
		{"label": _("Lot No"), "fieldname": "lot_no", "fieldtype": "Data", "width": 100},
		{"label": _("Serial #"), "fieldname": "serial_no", "width": 100},
		{"label": _("Item Group"), "fieldname": "item_group", "fieldtype": "Link", "options": "Item Group", "width": 150},
		{"label": _("Warehouse"), "fieldname": "warehouse", "fieldtype": "Link", "options": "Warehouse", "width": 150},
		{"label": _("Company"), "fieldname": "company", "fieldtype": "Link", "options": "Company", "width": 110},
		{"label": _("Project"), "fieldname": "project", "fieldtype": "Link", "options": "Project", "width": 100},

	# 	{"label": _("Brand"), "fieldname": "brand", "fieldtype": "Link", "options": "Brand", "width": 100},
	# 	{"label": _("Description"), "fieldname": "description", "width": 200},

	]

	return columns

def get_stock_ledger_entries(filters, items):
	item_conditions_sql  = serial_no_condition = transaction_status_cond = ''

	if items:
		item_conditions_sql = 'and sle.item_code in ({})'\
			.format(', '.join([frappe.db.escape(i) for i in items]))

	if filters.get('serial_no'):
		serial_no_condition = "and instr(sle.serial_no,'%s') > 0" % filters.serial_no

	if filters.transaction_status_perm:
		transaction_status_cond = " and (sle.transaction_status = 'New' or sle.transaction_status IS NULL)"

	return frappe.db.sql("""select concat_ws(" ", sle.posting_date, sle.posting_time) as date,
			sle.item_code, sle.warehouse, sle.actual_qty, sle.qty_after_transaction, sle.incoming_rate, sle.valuation_rate,
			sle.stock_value, sle.voucher_type, sle.voucher_no, sle.batch_no, sle.serial_no, sle.company, sle.project, sle.stock_value_difference,
			IFNULL(pr.supplier, IFNULL(pi.supplier,IFNULL(dn.customer,IFNULL(si.customer,se.stock_entry_type)))) as particular
		from `tabStock Ledger Entry` as sle
		LEFT JOIN `tabPurchase Receipt` as pr on pr.name = sle.voucher_no
		LEFT JOIN `tabPurchase Invoice` as pi on pi.name = sle.voucher_no
		LEFT JOIN `tabDelivery Note` as dn on dn.name = sle.voucher_no
		LEFT JOIN `tabSales Invoice` as si on si.name = sle.voucher_no
		LEFT JOIN `tabStock Entry` as se on se.name = sle.voucher_no
		where
			sle.posting_date between %(from_date)s and %(to_date)s and sle.is_cancelled = 0
			{transaction_status_cond} 
			{sle_conditions}
			{item_conditions_sql}
			{serial_no_condition}
			order by sle.posting_date asc, sle.posting_time asc, sle.creation asc"""\
		.format(
			transaction_status_cond= transaction_status_cond,
			sle_conditions=get_sle_conditions(filters),
			item_conditions_sql = item_conditions_sql,
			serial_no_condition = serial_no_condition
		), filters, as_dict=1)

def get_items(filters):
	conditions = []
	if filters.get("item_code"):
		conditions.append("item.name=%(item_code)s")
	else:
		if filters.get("brand"):
			conditions.append("item.brand=%(brand)s")
		if filters.get("item_group"):
			conditions.append(get_item_group_condition(filters.get("item_group")))

	items = []
	if conditions:
		items = frappe.db.sql_list("""select name from `tabItem` item where {}"""
			.format(" and ".join(conditions)), filters)
	return items

def get_item_details(items, sl_entries, include_uom):
	item_details = {}
	if not items:
		items = list(set([d.item_code for d in sl_entries]))

	if not items:
		return item_details

	cf_field = cf_join = ""
	if include_uom:
		cf_field = ", ucd.conversion_factor"
		cf_join = "left join `tabUOM Conversion Detail` ucd on ucd.parent=item.name and ucd.uom=%s" \
			% frappe.db.escape(include_uom)

	res = frappe.db.sql("""
		select
			item.name, item.item_name, item.description, item.item_group, item.brand, item.stock_uom {cf_field}
		from
			`tabItem` item
			{cf_join}
		where
			item.name in ({item_codes})
	""".format(cf_field=cf_field, cf_join=cf_join, item_codes=','.join(['%s'] *len(items))), items, as_dict=1)

	for item in res:
		item_details.setdefault(item.name, item)

	return item_details

def get_sle_conditions(filters):
	conditions = []
	if filters.get("warehouse"):
		warehouse_condition = get_warehouse_condition(filters.get("warehouse"))
		if warehouse_condition:
			conditions.append(warehouse_condition)
	if filters.get("voucher_no"):
		conditions.append("sle.voucher_no=%(voucher_no)s")
	if filters.get("batch_no"):
		conditions.append("sle.batch_no=%(batch_no)s")
	if filters.get("company"):
		conditions.append("sle.company=%(company)s")
	return "and {}".format(" and ".join(conditions)) if conditions else ""

def get_opening_balance(filters, columns):
	if not (filters.item_code and filters.warehouse and filters.from_date):
		return

	from erpnext.stock.stock_ledger import get_previous_sle
	last_entry = get_previous_sle({
		"item_code": filters.item_code,
		"warehouse_condition": get_warehouse_condition(filters.warehouse),
		"posting_date": filters.from_date,
		"posting_time": "00:00:00",
	})

	if filters.transaction_status_perm:

		last_old_entry = frappe.db.sql(f"""
			select *, timestamp(posting_date, posting_time) as "timestamp"
			from `tabStock Ledger Entry`
			FORCE INDEX (item_posting_creation_index)
			where item_code = '{filters.item_code}'
			and is_cancelled = 0
			and transaction_status = 'Old'
			and {get_warehouse_condition(filters.warehouse)}
			order by timestamp(posting_date, posting_time) desc, creation desc
			limit 1""",as_dict=1)

		if last_old_entry:
			last_old_entry = last_old_entry[0]
			
		if last_old_entry and last_entry:
			if last_old_entry.timestamp > last_entry.timestamp:
				last_entry = last_old_entry
		elif last_old_entry and not last_entry:
			last_entry = last_old_entry

	row = {}
	row["item_code"] = _("'Opening'")
	for dummy, v in ((9, 'qty_after_transaction'), (11, 'valuation_rate'), (12, 'stock_value')):
			row[v] = last_entry.get(v, 0)

	return row

def get_warehouse_condition(warehouse):
	warehouse_details = frappe.db.get_value("Warehouse", warehouse, ["lft", "rgt"], as_dict=1)
	if warehouse_details:
		return " exists (select name from `tabWarehouse` wh \
			where wh.lft >= %s and wh.rgt <= %s and warehouse = wh.name)"%(warehouse_details.lft,
			warehouse_details.rgt)

	return ''

def get_item_group_condition(item_group):
	item_group_details = frappe.db.get_value("Item Group", item_group, ["lft", "rgt"], as_dict=1)
	if item_group_details:
		return "item.item_group in (select ig.name from `tabItem Group` ig \
			where ig.lft >= %s and ig.rgt <= %s and item.item_group = ig.name)"%(item_group_details.lft,
			item_group_details.rgt)

	return ''