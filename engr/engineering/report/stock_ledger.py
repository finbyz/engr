# Copyright (c) 2022, Finbyz tech pvt ltd and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.query_builder.functions import CombineDatetime
from frappe.utils import cint, flt

from erpnext.stock.doctype.inventory_dimension.inventory_dimension import get_inventory_dimensions
from erpnext.stock.doctype.serial_no.serial_no import get_serial_nos
from erpnext.stock.doctype.stock_reconciliation.stock_reconciliation import get_stock_balance_for
from erpnext.stock.doctype.warehouse.warehouse import apply_warehouse_filter
from erpnext.stock.utils import (
	is_reposting_item_valuation_in_progress,
	update_included_uom_in_report,
)
from erpnext.stock.report.stock_ledger.stock_ledger import get_inventory_dimension_fields
from erpnext.stock.report.stock_ledger.stock_ledger import check_inventory_dimension_filters_applied
from erpnext.stock.report.stock_ledger.stock_ledger import get_columns
from erpnext.stock.report.stock_ledger.stock_ledger import get_stock_ledger_entries
from erpnext.stock.report.stock_ledger.stock_ledger import get_items
from erpnext.stock.report.stock_ledger.stock_ledger import get_item_details
from erpnext.stock.report.stock_ledger.stock_ledger import get_item_group_condition
from erpnext.stock.report.stock_ledger.stock_ledger import get_warehouse_condition
from erpnext.stock.report.stock_ledger.stock_ledger import get_opening_balance
from erpnext.stock.report.stock_ledger.stock_ledger import get_sle_conditions

def execute(filters=None):
	is_reposting_item_valuation_in_progress()
	include_uom = filters.get("include_uom")
	columns = get_columns(filters)
	items = get_items(filters)
	sl_entries = get_stock_ledger_entries(filters, items)
	item_details = get_item_details(items, sl_entries, include_uom)
	opening_row = get_opening_balance(filters, columns, sl_entries)
	precision = cint(frappe.db.get_single_value("System Settings", "float_precision"))

	data = []
	conversion_factors = []
	if opening_row:
		data.append(opening_row)
		conversion_factors.append(0)

	actual_qty = stock_value = 0
	if opening_row:
		actual_qty = opening_row.get("qty_after_transaction")
		stock_value = opening_row.get("stock_value")

	available_serial_nos = {}
	inventory_dimension_filters_applied = check_inventory_dimension_filters_applied(filters)

	for sle in sl_entries:
		item_detail = item_details[sle.item_code]

		sle.update(item_detail)

		if filters.get("batch_no") or inventory_dimension_filters_applied:
			actual_qty += flt(sle.actual_qty, precision)
			stock_value += sle.stock_value_difference

			if sle.voucher_type == "Stock Reconciliation" and not sle.actual_qty:
				actual_qty = sle.qty_after_transaction
				stock_value = sle.stock_value

			sle.update({"qty_after_transaction": actual_qty, "stock_value": stock_value})

		sle.update({"in_qty": max(sle.actual_qty, 0), "out_qty": min(sle.actual_qty, 0)})

		if sle.serial_no:
			update_available_serial_nos(available_serial_nos, sle)

		if sle.actual_qty:
			sle["in_out_rate"] = flt(sle.stock_value_difference / sle.actual_qty, precision)

		elif sle.voucher_type == "Stock Reconciliation":
			sle["in_out_rate"] = sle.valuation_rate

		data.append(sle)

		if include_uom:
			conversion_factors.append(item_detail.conversion_factor)

	update_included_uom_in_report(columns, data, include_uom, conversion_factors)

	# FINBYZ CHANGES START
	pr_map = {}
	pri_data = frappe.db.sql(f""" SELECT parent , item_code ,lot_no
									From `tabPurchase Receipt Item` Where (lot_no is not null or lot_no != "") and docstatus = 1""" , as_dict = 1)
	for row in pri_data:
		pr_map[(row.parent , row.item_code)] = row 
	# frappe.throw(str(pr_map))
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

	# frappe.msgprint(str(data))
	for row in data:
		if (row.get('voucher_no') and row.get('item_code')):
			if pr_map.get((row.voucher_no,row.item_code)):
				row.update({'lot_no': pr_map.get((row.voucher_no,row.item_code)).get('lot_no')})
			if se_map.get((row.voucher_no,row.item_code)):
				row.update({'lot_no' : se_map.get((row.voucher_no,row.item_code)).get('lot_no')})
			if si_map.get((row.voucher_no,row.item_code)):
				row.update({'lot_no' : si_map.get((row.voucher_no,row.item_code)).get('lot_no')})
			if dn_map.get((row.voucher_no,row.item_code)):
				row.update({'lot_no' : dn_map.get((row.voucher_no,row.item_code)).get('lot_no')})
	# FINBYZ CHANGES END
	return columns, data
