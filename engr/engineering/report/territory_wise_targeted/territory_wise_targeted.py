# # Copyright (c) 2023, Finbyz Tech. Pvt. Ltd. and contributors
# # For license information, please see license.txt

# import frappe
# from frappe.utils import flt

# def execute(filters=None):
#     columns, data = [], []
#     columns = get_cols()
#     data  = get_data()
#     return columns, data

# def get_cols():
#     columns = [
#         {
#             "fieldname": "territory",
#             "label": ("Territory"),
#             "fieldtype": "Link",
#             "options":"Territory",
#             "width": 100
#         },
#         {
#             "fieldname": "parent_territory",
#             "label": ("Parent Territory"),
#             "fieldtype": "Data",
#             "width": 100
#         },
#         {
#             "fieldname": "old_parent",
#             "label": ("Old Parent Territory"),
#             "fieldtype": "Data",
#             "width": 100
#         },
#         {
#             "label":"Target Amount",
#             "fieldname":("target_amount"),
#             "fieldtype":"Int",
#             "width": 100
#         },
#         {
#             "fieldname":"distribution_id",
#             "label":("Quater"),
#             "fieldtype":"Link",
#             "options":"Monthly Distribution",
#             "width": 100
#         },
#         {
#             "fieldname":"fiscal_year",
#             "label":("Fiscal Year"),
#             "fieldtype":"Data",
#             "width": 100
#         }
        
        
#     ]
#     return columns
# def get_data():


# data = frappe.db.sql(f''' SELECT te.name as territory , te.parent_territory ,te.territory_type
#                         From `tabTerritory` as te
#                         where te.territory_type="Zone" and is_group=1
#                         ''',as_dict=1)

# for row in data:

#     lft,rgt=frappe.db.get_value("Territory",row.get('territory'),['lft','rgt'])
#     l1=frappe.db.sql(f"""
#                         select te.name as territory , te.parent_territory, td.target_amount as target_amount, te.old_parent ,td.fiscal_year,td.distribution_id
#                         From `tabTerritory` as te
#                         left join`tabTarget Detail` as td ON te.name = td.parent 
#                         where td.target_amount > 0 and te.lft >= {lft} and te.rgt <= {rgt} 
#                         """,as_dict=1)
#     print(l1)
#     return l1
    # data = frappe.db.sql(f''' SELECT te.name as territory , te.parent_territory ,te.territory_type
    #                         From `tabTerritory` as te
    # 						where te.territory_type="Zone" and is_group=1
    #                        ''',as_dict=1)

    # # terr = frappe.db.sql(f"""
    # # 		SELECT Distinct name, lft, rgt from `tabTerritory` where territory_type = 'Zone' and is_group=1
    # # 	""", as_dict =1)

    # # terr_dict = {f"{row.name}": (row.lft, row.rgt) for row in terr}
    # if filters.get('Zone'):
    # 	for row in data:
            
    # 		lft,rgt=frappe.db.get_value("Territory",{"is_group":1},['lft','rgt'])
    # 		l1=frappe.db.sql(f"""
    # 			select te.name as territory , te.parent_territory, sum(td.target_amount) as target_amount, te.old_parent ,td.fiscal_year,td.distribution_id
    #  			From `tabTerritory` as te
    #  			left join`tabTarget Detail` as td ON te.name = td.parent 
    # 			where td.target_amount>0 and te.lft >= {lft} and te.rgt <= {rgt} 
    # 			""",as_dict=1)


# Copyright (c) 2023, Finbyz Tech. Pvt. Ltd. and contributors
# For license information, please see license.txt

import frappe
from frappe.utils import flt

def execute(filters=None):
    columns, data = [], []
    columns = get_cols(filters)
    data  = get_data(filters)
    return columns, data

def get_cols(filters):
    columns = [
        {
            "fieldname": "territory",
            "label": ("Territory"),
            "fieldtype": "Link",
            "options":"Territory",
            "width": 100
        },
        {
            "fieldname": "parent_territory",
            "label": ("Parent Territory"),
            "fieldtype": "Data",
            "width": 100
        },
        {
            "fieldname": "old_parent",
            "label": ("Old Parent Territory"),
            "fieldtype": "Data",
            "width": 100
        },
        {
            "label":"Target Amount",
            "fieldname":("target_amount"),
            "fieldtype":"Int",
            "width": 100
        },
        {
            "fieldname":"distribution_id",
            "label":("Quater"),
            "fieldtype":"Link",
            "options":"Monthly Distribution",
            "width": 100
        },
        {
            "fieldname":"fiscal_year",
            "label":("Fiscal Year"),
            "fieldtype":"Data",
            "width": 100
        }
        
        
    ]
    return columns
def get_data(filters):
  
    data = frappe.db.sql(f''' SELECT te.name as territory , te.parent_territory ,te.territory_type
                        From `tabTerritory` as te
                        where te.territory_type='{filters.get('territory_type')}' and is_group=1
                        ''',as_dict=1)
    
    data1 = frappe.db.sql("""select te.name as territory , te.parent_territory from `tabTerritory` as te""",as_dict=1)
    terr_map = {}
    for row in data1:
        terr_map[row.territory] = row.parent_territory
        print(terr_map)

    final_data=[]
    for row in data:

        lft,rgt=frappe.db.get_value("Territory",row.get('territory'),['lft','rgt'])
        l1=frappe.db.sql(f"""
                        select te.name as territory , te.parent_territory,te.old_parent, td.target_amount as target_amount ,td.fiscal_year,td.distribution_id
                        From `tabTerritory` as te
                        left join`tabTarget Detail` as td ON te.name = td.parent 
                        where td.target_amount > 0 and te.lft >= {lft} and te.rgt <= {rgt} and td.fiscal_year = '{filters.get('fiscal_year')}' 
                        """,as_dict=1)
        # print(l1)
        
        final_data.append(l1)

    # print(l1)

    return final_data

        




    

    

    



    