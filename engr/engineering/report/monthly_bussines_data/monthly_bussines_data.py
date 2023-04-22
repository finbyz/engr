# Copyright (c) 2022, FinByz Tech Pvt. Ltd. and contributors
# For license information, please see license.txt

import frappe
from frappe import _

def execute(filters=None):
    if not filters.get('from_date') or not filters.get('to_date'):
        frappe.throw('give a Filter From Date and To Date')
    columns, data = [], []
    columns = get_columns(filters)
    data = get_data(filters)
    return columns, data
def get_columns(filters):
    if not filters.get('st'):
        columns = [
            {
                "label": _("Customer Name"),
                "fieldname": "party_name",
                "fieldtype": "Link", 
                "options":"Customer",
                "width": 200
            },
            {
                "label": _("Visit Number"),
                "fieldname": "visit_number",
                "fieldtype": "Data", 
                "width": 200
            },
            {
                "label": _("Sales Person"),
                "fieldname": "sales_person",
                "fieldtype": "Data", 
                "width": 200
            },
            {
                "label": _("Territory"),
                "fieldname": "territory",
                "fieldtype": "Link", 
                "options":"Territory",
                "width": 200
            },
            
            {
                "label": _("Quotation Net Value"),
                "fieldname": "net_quotation_value",
                "fieldtype": "Float", 
                "width": 200
            },
            
            {
                "label": _("Sales Order Net Value"),
                "fieldname": "net_sales_order_value",
                "fieldtype": "Float", 
                "width": 150
            },
           
            {
                "label": _("Invoice Net Value"), 
                "fieldname": "invoice_net_value",
                "fieldtype": "Float",
                "width": 150
            }]
    if filters.get('st'):
        columns = [
            {
            "label": _("Sales Person"),
            "fieldname": "sales_person",
            "fieldtype": "Link", 
            "options":"Sales Person",
            "width": 200
            },
            {
            "label": _("Quotation Net Value"),
            "fieldname": "net_quotation_value",
            "fieldtype": "Float", 
            "width": 200
            },
            {
                "label": _("Sales Order Net Value"),
                "fieldname": "net_sales_order_value",
                "fieldtype": "Float", 
                "width": 150
            },
            {
                "label": _("Invoice Net Value"), 
                "fieldname": "invoice_net_value",
                "fieldtype": "Float",
                "width": 150
            }
        ]
    return columns

def get_data(filters):
    if not filters.get('st'):
        condition = ""
        if filters.get('customer'):
            condition += f" and me.party = '{filters.get('customer')}'"
        if filters.get('user'):
            condition += f" and me.meeting_arranged_by = '{filters.get('user')}'"
        if filters.get('from_date') and filters.get('to_date'):
            condition += f" and me.meeting_from BETWEEN '{filters.get('from_date')}' and '{filters.get('to_date')}'"


        data = frappe.db.sql(f"""
            SELECT 
                me.party as customer_name,COUNT(me.name) as visit_number, GROUP_CONCAT(DISTINCT me.meeting_arranged_by) as sales_person
            from
                `tabMeeting` me
            where 
                me.docstatus=1 and me.party_type = 'Customer' {condition} 
            GROUP BY
                me.party
            
        """, as_dict = 1)
        qo_condition_trns = ""
        si_condition_trns = ""
        so_condition_trns = ""
        condition_trns = ""
        if filters.get('customer'):
            qo_condition_trns += f" and qo.party_name = '{filters.get('customer')}'"
            so_condition_trns += f" and customer = '{filters.get('customer')}'"
            si_condition_trns += f" and customer = '{filters.get('customer')}'"
        if filters.get('territory'):
            qo_condition_trns += f" and qo.territory = '{filters.get('territory')}'"
            so_condition_trns += f" and territory = '{filters.get('territory')}'"
            si_condition_trns += f" and territory = '{filters.get('territory')}'"

        if filters.get('from_date') and filters.get('to_date'):
            qo_condition = f" and qo.transaction_date BETWEEN '{filters.get('from_date')}' and '{filters.get('to_date')}'"
            so_condition = f" and transaction_date BETWEEN '{filters.get('from_date')}' and '{filters.get('to_date')}'"
            si_condition = f" and posting_date BETWEEN '{filters.get('from_date')}' and '{filters.get('to_date')}'"
        qo_data = frappe.db.sql(f""" SELECT sum(qo.grand_total) as quotatoin_grand_total, sum(net_total) as net_quotation_value,  qo.territory , qo.party_name  From `tabQuotation` as qo Where qo.docstatus = 1  {qo_condition_trns} {qo_condition} Group By qo.party_name""",as_dict= True)
        so_data = frappe.db.sql(f""" SELECT sum(grand_total) as sales_order_grand_total,sum(total) as net_sales_order_value,  territory , customer From `tabSales Order`  Where docstatus = 1  {so_condition_trns} {so_condition} Group By customer""",as_dict=True)
        si_data = frappe.db.sql(f""" SELECT sum(grand_total) as sales_invoice_grand_total,territory ,sum(total) as invoice_net_value,customer From `tabSales Invoice`  Where docstatus = 1  {si_condition_trns} {si_condition} Group By customer""",as_dict=True)

        so_map = {}
        for row in so_data:
            so_map[row.customer] = row

        si_map = {}
        for row in si_data:
            si_map[row.customer] = row

        map_data = {}
        for row in data:
            map_data[row.customer_name] = row
        final_data=[]
        if filters.get('user'):
            for row in qo_data:
                if so_map.get(row.party_name):
                    if row.party_name == so_map[row.party_name].customer:
                        row.update(so_map[row.party_name])
                if si_map.get(row.party_name):    
                    if row.party_name == si_map[row.party_name].customer:
                        row.update(si_map[row.party_name]) 
                if map_data.get(row.party_name):
                    if row.party_name ==  map_data[row.party_name].customer_name:
                        row.update(map_data[row.party_name])
                if not row.net_quotation_value:
                    row.update({'net_quotation_value':0})
                if not row.net_sales_order_value:
                    row.update({'net_sales_order_value':0})
                if not row.invoice_net_value:
                    row.update({'invoice_net_value':0})
                if row.sales_person:
                    final_data.append(row)
            return final_data
        else:
            for row in qo_data:
                if so_map.get(row.party_name):
                    if row.party_name == so_map[row.party_name].customer:
                        row.update(so_map[row.party_name])
                if si_map.get(row.party_name):    
                    if row.party_name == si_map[row.party_name].customer:
                        row.update(si_map[row.party_name]) 
                if map_data.get(row.party_name):
                    if row.party_name ==  map_data[row.party_name].customer_name:
                        row.update(map_data[row.party_name])
                if not row.net_quotation_value:
                    row.update({'net_quotation_value':0})
                if not row.net_sales_order_value:
                    row.update({'net_sales_order_value':0})
                if not row.invoice_net_value:
                    row.update({'invoice_net_value':0})
            return qo_data
    qo_con = ''
    so_con = ''
    si_con = ''
    if filters.get('st'):
        sales_person = ""
        con = ""
        if filters.get('territory'):
            qo_con += f" and qo.territory  = '{filters.get('territory')}'"
            so_con += f" and so.territory  = '{filters.get('territory')}'"
            si_con += f" and si.territory  = '{filters.get('territory')}'"
        if filters.get('customer'):
            qo_con += f" and qo.party_name  = '{filters.get('customer')}'"
            so_con += f" and so.customer  = '{filters.get('customer')}'"
            si_con += f" and si.customer  = '{filters.get('customer')}'"
        if filters.get('sales_person'):
            sales_person += f" and st.sales_person = '{filters.get('sales_person')}'"
        if filters.get('from_date') and filters.get('to_date'):
            qo_con += f" and qo.transaction_date BETWEEN '{filters.get('from_date')}' and '{filters.get('to_date')}'"
            so_con += f" and so.transaction_date BETWEEN '{filters.get('from_date')}' and '{filters.get('to_date')}'"
            si_con += f" and si.posting_date BETWEEN '{filters.get('from_date')}' and '{filters.get('to_date')}'"

        qo_data = frappe.db.sql(f""" SELECT  sum(qo.net_total) as net_quotation_value  , st.sales_person
                                From `tabQuotation` as qo 
                                left join `tabSales Team` as st on st.parent = qo.name 
                                where qo.docstatus = 1 and st.sales_person is not null {sales_person} {qo_con} Group By st.sales_person """,as_dict= True)


        so_data = frappe.db.sql(f""" SELECT sum(so.total) as net_sales_order_value ,st.sales_person
                                From `tabSales Order` as so
                                left join `tabSales Team` as st on st.parent = so.name where so.docstatus = 1 and st.sales_person is not null  {sales_person} {so_con} Group By st.sales_person""",as_dict=True)

        si_data = frappe.db.sql(f""" SELECT sum(si.total) as invoice_net_value , st.sales_person
                                From `tabSales Invoice` as si
                                left join `tabSales Team` as st on st.parent = si.name Where si.docstatus = 1 and  st.sales_person is not null {sales_person} {si_con} Group By st.sales_person""",as_dict=True)
                    
        si_map = {}
        for row in si_data:
            si_map[row.sales_person] = row

        so_map = {}
        for row in so_data:
            so_map[row.sales_person] = row

        for row in qo_data:
            if so_map.get(row.sales_person):
                if row.sales_person == so_map[row.sales_person].sales_person:
                    row.update(so_map[row.sales_person])
            if si_map.get(row.sales_person):    
                if row.sales_person == si_map[row.sales_person].sales_person:
                    row.update(si_map[row.sales_person]) 
        return qo_data
    


