# -*- coding: utf-8 -*-
# Copyright (c) 2021, Finbyz Tech. Pvt. Ltd. and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
from frappe.utils import flt,cint
from erpnext.controllers.status_updater import StatusUpdater

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
                so_doc.db_set("proforma_percentage",flt(so_doc.proforma_amount) / flt(so_doc.grand_total) * 100)
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
                so_doc.db_set("proforma_percentage",flt(so_doc.proforma_amount) / flt(so_doc.grand_total) * 100)
                change_sales_order_status(so_doc)

def change_sales_order_status(so_doc):
    pi_status = frappe.db.sql("""select pi.status
        from `tabProforma Invoice` as pi
        JOIN `tabProforma Invoice Item` as pii on pii.parent = pi.name
        where pii.sales_order = '{}' and pi.docstatus=1
    """.format(so_doc.name),as_dict=1)
    status_list = list(set(status.status for status in pi_status))
    if ("Unpaid" in status_list or "Partially Paid" in status_list) and so_doc.docstatus == 1:
        so_doc.db_set("status","Proforma Raised")
    elif so_doc.docstatus == 1:
        StatusUpdater.set_status(so_doc,update=True)

