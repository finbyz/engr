# -*- coding: utf-8 -*-
# Copyright (c) 2021, Finbyz Tech. Pvt. Ltd. and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
from frappe.utils import flt,cint

def update_proforma_details(docname,action):
    doc = frappe.get_doc("Proforma Invoice",docname)
    if doc.payment_percentage:
        if action == "submit":
            if doc.payment_percentage > 100:
                frappe.throw("Payment Percentage cannot be more than 100%")

            for item in doc.items:
                proforma_query = frappe.db.sql("""
                    select sum(poi.payment_amount) as payment_amount,soi.net_amount
                    from `tabProforma Invoice Item` as poi
                    JOIN `tabProforma Invoice` as pi on pi.name = poi.parent
                    JOIN `tabSales Order Item` as soi on soi.name = poi.sales_order_item
                    where poi.sales_order = '{}' and poi.sales_order_item = '{}'
                    and pi.name != '{}' and pi.docstatus=1
                """.format(item.sales_order,item.sales_order_item,doc.name))

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

        elif action == "cancel":
            for item in doc.items:
                proforma_query = frappe.db.sql("""
                    select sum(poi.payment_amount) as payment_amount,soi.net_amount
                    from `tabProforma Invoice Item` as poi
                    JOIN `tabProforma Invoice` as pi on pi.name = poi.parent
                    JOIN `tabSales Order Item` as soi on soi.name = poi.sales_order_item
                    where poi.sales_order = '{}' and poi.sales_order_item = '{}'
                    and pi.name != '{}' and pi.docstatus=1
                """.format(item.sales_order,item.sales_order_item,doc.name))

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
