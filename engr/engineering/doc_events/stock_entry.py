import frappe

def validate_work_order_items(self,method):
    if self.stock_entry_type =="Manufacture":
        if self.work_order:
            wo_item_list=frappe.db.get_all("Work Order Item",{"parent":self.work_order},pluck='item_code')
            st_item_list=[item.item_code for item in self.items if item.s_warehouse]
            for x in wo_item_list:
                if x not in st_item_list:
                    frappe.throw(f"Item :{frappe.bold(x)} is required to Manufacture material" )
