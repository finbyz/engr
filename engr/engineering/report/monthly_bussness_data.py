import frappe

def execute(filters={'from_date' : '2022-05-01' , 'to_date' : '2023-03-06'}):
    if not filters.get('from_date') or not filters.get('to_date'):
        frappe.throw('give a Filter From Date and To Date')
    columns, data = [], []
    # columns = get_columns(filters)
    data = get_data(filters)
    return  data

def get_data(filters):
    condition = ""
    if filters.get('customer'):
        condition += f" and me.party = '{filters.get('customer')}'"
    if filters.get('from_date') and filters.get('to_date'):
        condition += f" and me.meeting_from BETWEEN '{filters.get('from_date')}' and '{filters.get('to_date')}'"

    data = frappe.db.sql(f"""
            SELECT 
                me.party as customer_name,COUNT(me.name) as visit_number , me.meeting_arranged_by
            from
                `tabMeeting` me
            where 
                me.docstatus=1 and me.party_type = 'Customer' {condition}
            GROUP BY
                me.party
            order by
                me.party
            
        """, as_dict = 1)
    
    return data
# from engr.engineering.report.monthly_bussness_data import execute
