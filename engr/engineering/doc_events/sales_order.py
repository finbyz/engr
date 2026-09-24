# -*- coding: utf-8 -*-
# Copyright (c) 2021, Finbyz Tech. Pvt. Ltd. and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
from frappe import _
from frappe.utils import flt,cint,get_url_to_form, escape_html
from erpnext.controllers.status_updater import StatusUpdater
from engr.api import validate_sales_person

def update_proforma_details(docname,action):
    doc = frappe.get_doc("Proforma Invoice",docname)
    if doc.payment_percentage:
        if action == "submit":
            if doc.payment_percentage > 100:
                frappe.throw("Payment Percentage cannot be more than 100%")

            sales_order_list = []

            for item in doc.items:
                proforma_query = frappe.db.sql("""
                    select sum(poi.payment_amount) as payment_amount,soi.net_amount
                    from `tabProforma Invoice Item` as poi
                    JOIN `tabProforma Invoice` as pi on pi.name = poi.parent
                    JOIN `tabSales Order Item` as soi on soi.name = poi.sales_order_item
                    where poi.sales_order = '{}' and poi.sales_order_item = '{}'
                    and pi.name != '{}' and pi.docstatus=1
                """.format(item.sales_order,item.sales_order_item,doc.name))
 
                sales_order_list.append(item.sales_order)

                update_value = False
                if proforma_query:
                    proforma_amount = proforma_query[0][0]
                    net_amount = proforma_query[0][1] 
                    if proforma_amount:
                        proforma_percentage = (flt(proforma_amount) + flt(item.payment_amount)) / flt(net_amount) * 100
                        if cint(proforma_percentage) > 100:
                            frappe.throw("<b>Row {}</b>: Proforma Invoice has already been raised".format(item.idx))

                        frappe.db.set_value("Sales Order Item",{"name":item.sales_order_item,"parent":item.sales_order},\
                            'proforma_amount',flt(proforma_amount) + flt(item.payment_amount))
                        frappe.db.set_value("Sales Order Item",{"name":item.sales_order_item,"parent":item.sales_order},\
                            'proforma_percentage',proforma_percentage)
                        update_value = True
  
                if not update_value:
                    frappe.db.set_value("Sales Order Item",{"name":item.sales_order_item,"parent":item.sales_order},\
                        'proforma_amount',item.payment_amount)
                    proforma_percentage = frappe.db.get_value("Sales Order Item", {"name":item.sales_order_item,"parent":item.sales_order}, 'net_amount') or 0
                    frappe.db.set_value("Sales Order Item",{"name":item.sales_order_item,"parent":item.sales_order},\
                        'proforma_percentage',((flt(item.payment_amount) / flt(proforma_percentage)) * 100))
            sales_order_list = list(set(sales_order_list))
            for so in sales_order_list:
                if so:
                    so_doc = frappe.get_doc("Sales Order",so)
                    so_doc.db_set("proforma_amount",flt(doc.payment_due_amount) + flt(so_doc.proforma_amount))
                    if so_doc.disable_rounded_total:
                        so_doc.db_set("proforma_percentage",flt(so_doc.proforma_amount) / flt(so_doc.grand_total) * 100)
                    else:
                        so_doc.db_set("proforma_percentage",flt(so_doc.proforma_amount) / flt(so_doc.rounded_total) * 100)

                    change_sales_order_status(so_doc)

        elif action == "cancel":
            sales_order_list = []
            for item in doc.items:
                proforma_query = frappe.db.sql("""
                    select sum(poi.payment_amount) as payment_amount,soi.net_amount
                    from `tabProforma Invoice Item` as poi
                    JOIN `tabProforma Invoice` as pi on pi.name = poi.parent
                    JOIN `tabSales Order Item` as soi on soi.name = poi.sales_order_item
                    where poi.sales_order = '{}' and poi.sales_order_item = '{}'
                    and pi.name != '{}' and pi.docstatus=1
                """.format(item.sales_order,item.sales_order_item,doc.name))

                sales_order_list.append(item.sales_order)

                update_value = False
                if proforma_query:
                    proforma_amount = proforma_query[0][0]
                    net_amount = proforma_query[0][1] 
                    if proforma_amount and net_amount:
                        proforma_percentage = flt(proforma_amount) / flt(net_amount) * 100

                    if proforma_amount:
                        frappe.db.set_value("Sales Order Item",{"name":item.sales_order_item,"parent":item.sales_order},\
                            'proforma_amount',proforma_amount)
                        frappe.db.set_value("Sales Order Item",{"name":item.sales_order_item,"parent":item.sales_order},\
                            'proforma_percentage',proforma_percentage)
                        update_value = True

                if not update_value:
                    frappe.db.set_value("Sales Order Item",{"name":item.sales_order_item,"parent":item.sales_order},\
                        'proforma_amount',0)                    
                    frappe.db.set_value("Sales Order Item",{"name":item.sales_order_item,"parent":item.sales_order},\
                        'proforma_percentage',0)

            sales_order_list = list(set(sales_order_list))
            for so in sales_order_list:
                if so:
                    so_doc  = frappe.get_doc("Sales Order",so)
    
                    so_doc.db_set("proforma_amount",flt(so_doc.proforma_amount) - flt(doc.payment_due_amount))
                    so_doc.db_set("proforma_percentage",flt(so_doc.proforma_amount) / flt(so_doc.rounded_total) * 100)
                    change_sales_order_status(so_doc)

def change_sales_order_status(so_doc, update_modified= True):
    pi_status = frappe.db.sql("""select pi.status
        from `tabProforma Invoice` as pi
        JOIN `tabProforma Invoice Item` as pii on pii.parent = pi.name
        where pii.sales_order = '{}' and pi.docstatus=1
    """.format(so_doc.name),as_dict=1)
    status_list = list(set(status.status for status in pi_status))
    if ("Unpaid" in status_list or "Partially Paid" in status_list) and so_doc.docstatus == 1:
        so_doc.db_set("status","Proforma Raised", update_modified= update_modified)
    elif so_doc.get('docstatus') == 1:
        StatusUpdater.set_status(so_doc,update=True, update_modified=update_modified)


@frappe.whitelist()
def get_last_5_transaction_details(name, item_code, customer):
	data = frappe.db.sql("""
		SELECT soi.qty, soi.rate, so.transaction_date, so.company,so.name 
		FROM `tabSales Order Item` as soi JOIN `tabSales Order` as so on soi.parent=so.name 
		WHERE soi.name != '{}' and so.customer = '{}' and soi.item_code = '{}' and so.docstatus = 1
		ORDER By so.transaction_date DESC LIMIT 5	
	""".format(name, customer, item_code), as_dict = 1)

	table = """<table class="table table-bordered" style="margin: 0; font-size:80%;">
		<thead>
			<tr>
				<th>Sales Order</th>
				<th>Company</th>
				<th>Date</th>
				<th>Qty</th>
				<th>Rate</th>

			<tr>
		</thead>
	<tbody>"""
	for i in data:
		table += f"""
			<tr>
				<td>{"<a href='{0}' target='_blank'>{1}</a>".format(get_url_to_form("Sales Order",i.name),i.name)}</td>
				<td>{i.company}</td>
				<td>{frappe.format(i.transaction_date, {'fieldtype': 'Date'})}</td>
				<td>{i.qty}</td>
				<td>{i.rate}</td>
			</tr>
		"""
	
	table += """
	</tbody></table>
	"""
	return table

@frappe.whitelist()
def get_sales_order_item_details(items, company=None):
	if isinstance(items, str):
		items = frappe.parse_json(items)

	items = items or []
	if not items:
		return ""

	item_codes = tuple({item.get("item_code") for item in items if item.get("item_code")})
	warehouses = tuple({item.get("warehouse") for item in items if item.get("warehouse")})
	warehouse_qty = {}
	company_qty = {}
	if item_codes:
		stock_scope = "warehouse.company = %(company)s"
		values = {"item_codes": item_codes, "company": company}
		if warehouses:
			stock_scope += " OR bin.warehouse IN %(warehouses)s"
			values["warehouses"] = warehouses

		for stock in frappe.db.sql(
			f"""
			SELECT bin.item_code, bin.warehouse, bin.actual_qty, warehouse.company
			FROM `tabBin` bin
			INNER JOIN `tabWarehouse` warehouse ON warehouse.name = bin.warehouse
			WHERE bin.item_code IN %(item_codes)s AND ({stock_scope})
			""",
			values,
			as_dict=True,
		):
			qty = flt(stock.actual_qty)
			warehouse_qty[(stock.item_code, stock.warehouse)] = qty
			if company and stock.company == company:
				company_qty[stock.item_code] = company_qty.get(stock.item_code, 0) + qty

	def format_qty(qty):
		color, background = ("#17603a", "#e7f5eb") if qty > 0 else ("#9a3412", "#fff0e8")
		return (
			f'<span style="display:inline-block;min-width:56px;text-align:right;'
			f'padding:3px 9px;border-radius:12px;font-weight:600;'
			f'color:{color};background:{background};">'
			f'{frappe.format(qty, {"fieldtype": "Float"})}</span>'
		)

	table = """<div style="overflow-x:auto;border:1px solid #d8e4f0;border-radius:8px;">
	<table class="table" style="margin:0;width:100%;font-size:13px;color:#243746;">
		<thead>
			<tr>
				<th style="padding:10px 12px;background:#f3f3f3;color:#17324d;white-space:nowrap;">Item Code</th>
				<th style="padding:10px 12px;background:#f3f3f3;color:#17324d;">Item Name</th>
				<th style="padding:10px 12px;background:#f3f3f3;color:#17324d;white-space:nowrap;">Warehouse</th>
				<th style="padding:10px 12px;background:#f3f3f3;color:#17324d;text-align:right;white-space:nowrap;">Available Qty</th>
				<th style="padding:10px 12px;background:#f3f3f3;color:#17324d;text-align:right;white-space:nowrap;">Available Qty in Company</th>
			</tr>
		</thead>
	<tbody>"""

	for index, item in enumerate(items):
		item_code = item.get("item_code")
		warehouse = item.get("warehouse")
		actual_qty = warehouse_qty.get((item_code, warehouse), 0)
		company_actual_qty = company_qty.get(item_code, 0)
		row_background = "#f3f8fc" if index % 2 else "#fff"

		table += f"""
			<tr>
				<td style="padding:9px 12px;background:{row_background};font-weight:600;color:#234e70;">{escape_html(item_code or "")}</td>
				<td style="padding:9px 12px;background:{row_background};">{escape_html(item.get("item_name") or "")}</td>
				<td style="padding:9px 12px;background:{row_background};">{escape_html(warehouse or "")}</td>
				<td style="padding:9px 12px;background:{row_background};text-align:right;">{format_qty(actual_qty)}</td>
				<td style="padding:9px 12px;background:{row_background};text-align:right;">{format_qty(company_actual_qty)}</td>
			</tr>
		"""

	table += """
	</tbody></table></div>
	"""
	return table

def validate_item_group(self):
    for row in self.items:
        if row.item_group=="GENERIC ITEM":
            frappe.throw("Row: {} has item of GENERIC ITEM group.".format(frappe.bold(row.idx)))

def validate(self,method):
    validate_sales_person(self)
    validate_item_group(self)