import frappe
import copy
import json

import frappe
from frappe import _, msgprint
from frappe.model.document import Document

from frappe.utils import (
	add_days,
	ceil,
	cint,
	comma_and,
	flt,
	get_link_to_form,
	getdate,
	now_datetime,
	nowdate,
)
from frappe.utils.csvutils import build_csv_response
from six import iteritems

from erpnext.manufacturing.doctype.bom.bom import get_children, validate_bom_no
from erpnext.manufacturing.doctype.work_order.work_order import get_item_details
from erpnext.setup.doctype.item_group.item_group import get_item_group_defaults

@frappe.whitelist()
def make_work_order(self):
    from erpnext.manufacturing.doctype.work_order.work_order import get_default_warehouse

    wo_list, po_list = [], []
    subcontracted_po = {}
    default_warehouses = get_default_warehouse()

    work_order_main = make_work_order_for_finished_goods(self,wo_list, default_warehouses)
    make_work_order_for_subassembly_items(self,wo_list, subcontracted_po, default_warehouses,work_order_main)
    make_subcontracted_purchase_order(self,subcontracted_po, po_list)
    self.show_list_created_message("Work Order", wo_list)
    self.show_list_created_message("Purchase Order", po_list)

def make_work_order_for_subassembly_items(self,wo_list,subcontracted_po,default_warehouses,work_order_main):
    for row in self.sub_assembly_items:
        if row.type_of_manufacturing == "Subcontract":
            subcontracted_po.setdefault(row.supplier, []).append(row)
            continue

        work_order_data = {
            "wip_warehouse": default_warehouses.get("wip_warehouse"),
            "fg_warehouse": default_warehouses.get("fg_warehouse"),
            "company": self.get("company"),
        }

        self.prepare_data_for_sub_assembly_items(row, work_order_data)
        work_order = self.create_work_order(work_order_data)
        frappe.db.set_value("Work Order", work_order ,"parent_work_order",work_order_main)
        if work_order:
            wo_list.append(work_order)

def show_list_created_message(self, doctype, doc_list=None):
    if not doc_list:
        return

    frappe.flags.mute_messages = False
    if doc_list:
        doc_list = [get_link_to_form(doctype, p) for p in doc_list]
        msgprint(_("{0} created").format(comma_and(doc_list)))


def make_work_order_for_finished_goods(self, wo_list, default_warehouses):
    items_data = self.get_production_items()

    for key, item in items_data.items():
        if self.sub_assembly_items:
            item["use_multi_level_bom"] = 0

        set_default_warehouses(item, default_warehouses)
        work_order_main = self.create_work_order(item)
        if work_order_main:
            wo_list.append(work_order_main)
    return str(work_order_main)

def set_default_warehouses(row, default_warehouses):
	for field in ["wip_warehouse", "fg_warehouse"]:
		if not row.get(field):
			row[field] = default_warehouses.get(field)

def get_production_items(self):
    item_dict = {}

    for d in self.po_items:
        item_details = {
            "production_item": d.item_code,
            "use_multi_level_bom": d.include_exploded_items,
            "sales_order": d.sales_order,
            "sales_order_item": d.sales_order_item,
            "material_request": d.material_request,
            "material_request_item": d.material_request_item,
            "bom_no": d.bom_no,
            "description": d.description,
            "stock_uom": d.stock_uom,
            "company": self.company,
            "fg_warehouse": d.warehouse,
            "production_plan": self.name,
            "production_plan_item": d.name,
            "product_bundle_item": d.product_bundle_item,
            "planned_start_date": d.planned_start_date,
            "project": self.project,
        }

        if not item_details["project"] and d.sales_order:
            item_details["project"] = frappe.get_cached_value("Sales Order", d.sales_order, "project")

        if self.get_items_from == "Material Request":
            item_details.update({"qty": d.planned_qty})
            item_dict[(d.item_code, d.material_request_item, d.warehouse)] = item_details
        else:
            item_details.update(
                {
                    "qty": flt(item_dict.get((d.item_code, d.sales_order, d.warehouse), {}).get("qty"))
                    + (flt(d.planned_qty) - flt(d.ordered_qty))
                }
            )
            item_dict[(d.item_code, d.sales_order, d.warehouse)] = item_details

    return item_dict



def prepare_data_for_sub_assembly_items(self, row, wo_data):
    for field in [
        "production_item",
        "item_name",
        "qty",
        "fg_warehouse",
        "description",
        "bom_no",
        "stock_uom",
        "bom_level",
        "production_plan_item",
        "schedule_date",
    ]:
        if row.get(field):
            wo_data[field] = row.get(field)

    wo_data.update(
        {
            "use_multi_level_bom": 0,
            "production_plan": self.name,
            "production_plan_sub_assembly_item": row.name,
        }
    )

def make_subcontracted_purchase_order(self, subcontracted_po, purchase_orders):
    if not subcontracted_po:
        return

    for supplier, po_list in subcontracted_po.items():
        po = frappe.new_doc("Purchase Order")
        po.company = self.company
        po.supplier = supplier
        po.schedule_date = getdate(po_list[0].schedule_date) if po_list[0].schedule_date else nowdate()
        po.is_subcontracted = "Yes"
        for row in po_list:
            po_data = {
                "item_code": row.production_item,
                "warehouse": row.fg_warehouse,
                "production_plan_sub_assembly_item": row.name,
                "bom": row.bom_no,
                "production_plan": self.name,
            }

            for field in [
                "schedule_date",
                "qty",
                "uom",
                "stock_uom",
                "item_name",
                "description",
                "production_plan_item",
            ]:
                po_data[field] = row.get(field)

            po.append("items", po_data)

        po.set_missing_values()
        po.flags.ignore_mandatory = True
        po.flags.ignore_validate = True
        po.insert()
        purchase_orders.append(po.name)

def create_work_order(self, item):
    from erpnext.manufacturing.doctype.work_order.work_order import OverProductionError

    wo = frappe.new_doc("Work Order")
    wo.update(item)
    wo.planned_start_date = item.get("planned_start_date") or item.get("schedule_date")
    
    if item.get("warehouse"):
        wo.fg_warehouse = item.get("warehouse")

    wo.set_work_order_operations()
    wo.set_required_items()

    try:
        wo.flags.ignore_mandatory = True
        wo.flags.ignore_validate = True
        wo.insert()
        return wo.name
    except OverProductionError:
        pass



@frappe.whitelist()
def make_material_request(self):
    '''Create Material Requests grouped by Sales Order and Material Request Type'''
    material_request_list = []
    material_request_map = {}

    for item in self.mr_items:
        item_doc = frappe.get_cached_doc('Item', item.item_code)

        material_request_type = item.material_request_type or item_doc.default_material_request_type

        # key for Sales Order:Material Request Type:Customer
        key = '{}:{}:{}'.format(item.sales_order, material_request_type, item_doc.customer or '')
        schedule_date = add_days(nowdate(), cint(item_doc.lead_time_days))

        if not key in material_request_map:
            # make a new MR for the combination
            material_request_map[key] = frappe.new_doc("Material Request")
            material_request = material_request_map[key]
            material_request.update({
                "transaction_date": nowdate(),
                "status": "Draft",
                "company": self.company,
                'material_request_type': material_request_type,
                'customer': item_doc.customer or ''
            })
            material_request_list.append(material_request)
        else:
            material_request = material_request_map[key]

        # add item
        material_request.append("items", {
            "item_code": item.item_code,
            "from_warehouse": item.from_warehouse,
            "qty": item.quantity,
            "schedule_date": schedule_date,
            "warehouse": item.warehouse,
            "sales_order": item.sales_order,
            'production_plan': self.name,
            'material_request_plan_item': item.name,
            'branch': self.branch,
            "project": frappe.db.get_value("Sales Order", item.sales_order, "project") \
                if item.sales_order else None
        })

    for material_request in material_request_list:
        # submit
        material_request.flags.ignore_permissions = 1
        material_request.run_method("set_missing_values")

        if self.get('submit_material_request'):
            material_request.submit()
        else:
            material_request.save()
        if material_request.docstatus == 1:
            frappe.db.set_value('Material Request' , material_request.name , 'status' , 'Pending' )
    frappe.flags.mute_messages = False

    if material_request_list:
        material_request_list = ["""<a href="/app/Form/Material Request/{0}">{1}</a>""".format(m.name, m.name) \
            for m in material_request_list]
        msgprint(_("{0} created").format(comma_and(material_request_list)))
    else :
        msgprint(_("No material request created"))
