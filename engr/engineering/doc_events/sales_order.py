# -*- coding: utf-8 -*-
# Copyright (c) 2021, Finbyz Tech. Pvt. Ltd. and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
from frappe import _
from frappe.utils import flt,cint,get_url_to_form
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
                    frappe.db.set_value("Sales Order Item",{"name":item.sales_order_item,"parent":item.sales_order},\
                        'proforma_percentage',doc.payment_percentage)

            sales_order_list = list(set(sales_order_list))
            for so in sales_order_list:
                so_doc = frappe.get_doc("Sales Order",so)

                so_doc.db_set("proforma_amount",flt(doc.payment_due_amount) + flt(so_doc.proforma_amount))
                so_doc.db_set("proforma_percentage",flt(so_doc.proforma_amount) / flt(so_doc.total) * 100)
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
    elif so_doc.docstatus == 1:
        StatusUpdater.set_status(so_doc,update=True, update_modified= update_modified)


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

def validate_item_group(self):
    for row in self.items:
        if row.item_group=="GENERIC ITEM":
            frappe.throw("Row: {} has item of GENERIC ITEM group.".format(frappe.bold(row.idx)))

def pending_qty(self,method):
    for row in self.items:
        if(row.qty):
            frappe.db.set_value("Sales Order Item" ,row.name ,"pending_delivered_qty", flt(row.qty - row.delivered_qty))

def validate(self,method):
    validate_sales_person(self)
    validate_item_group(self)
    update_pending_delivery_qty(self)

def update_sales_order_pending_qty(self,method):
    for each in self.items:
        if each.against_sales_order:
            so_doc = frappe.get_doc("Sales Order",each.against_sales_order)
            pending_qty(so_doc,method)

def update_pending_delivery_qty(self):
    for each in self.items:
        each.pending_delivered_qty = each.qty - (each.delivered_qty or 0)

