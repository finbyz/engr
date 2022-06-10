
import frappe
import frappe.defaults
from frappe import msgprint, _
from frappe.utils import nowdate, flt, cint, cstr ,get_link_to_form
from six import itervalues
from erpnext.manufacturing.doctype.work_order.work_order import StockOverProductionError


@frappe.whitelist()
def make_stock_entry(work_order_id, purpose, qty=None):
	#from erpnext.stock.doctype.stock_entry.stock_entry import get_additional_costs
	work_order = frappe.get_doc("Work Order", work_order_id)
	if not frappe.db.get_value("Warehouse", work_order.wip_warehouse, "is_group") \
			and not work_order.skip_transfer:
		wip_warehouse = work_order.wip_warehouse
	else:
		wip_warehouse = None
	stock_entry = frappe.new_doc("Stock Entry")
	stock_entry.purpose = purpose
	stock_entry.work_order = work_order_id
	stock_entry.company = work_order.company
	stock_entry.from_bom = 1
	stock_entry.bom_no = work_order.bom_no
	stock_entry.use_multi_level_bom = work_order.use_multi_level_bom
	stock_entry.fg_completed_qty = qty or (flt(work_order.qty) - flt(work_order.produced_qty))
	# stock_entry.fg_completed_quantity = qty or (flt(work_order.qty) - flt(work_order.produced_quantity))
	if work_order.bom_no:
		stock_entry.inspection_required = frappe.db.get_value('BOM',
			work_order.bom_no, 'inspection_required')
	
	if purpose=="Material Transfer for Manufacture":
		stock_entry.to_warehouse = wip_warehouse
		stock_entry.project = work_order.project
		stock_entry.stock_entry_type = "Material Transfer for Manufacture"
	else:
		stock_entry.from_warehouse = wip_warehouse
		stock_entry.to_warehouse = work_order.fg_warehouse
		stock_entry.project = work_order.project
		# if purpose=="Manufacture":
			# additional_costs = get_additional_costs(work_order, fg_qty=stock_entry.fg_completed_qty)
			# stock_entry.set("additional_costs", additional_costs)

	stock_entry.set_stock_entry_type()
	get_items(stock_entry)
	if purpose=='Manufacture':
		if 0 and work_order.bom_no:
			bom_multi_doc = frappe.get_doc("BOM",work_order.bom_no)
			for finish_items in bom_multi_doc.multiple_finish_item:
				if stock_entry.items[-1].item_code == finish_items.item_code:
					if stock_entry.items[-1].transfer_qty == work_order.qty:
						stock_entry.items.remove(stock_entry.items[-1]) 					
				bom = frappe.db.sql(''' select name from tabBOM where item = %s and docstatus=1''',finish_items.item_code)
				if bom:
					bom = bom[0][0]
				else:
					bom = None
				stock_entry.append("items",{
					'item_code': finish_items.item_code,
					't_warehouse': work_order.fg_warehouse,
					'qty': work_order.qty * finish_items.qty_ratio / 100,
					'uom': frappe.db.get_value('Item',finish_items.item_code,'stock_uom'),
					'stock_uom': frappe.db.get_value('Item',finish_items.item_code,'stock_uom'),
					'conversion_factor': 1 ,
					'batch_yield':finish_items.batch_yield,
					'bom_no':bom
				})
		# if hasattr(work_order, 'second_item'):
		# 	if work_order.second_item:
		# 		bom = frappe.db.sql(''' select name from tabBOM where item = %s ''',work_order.second_item)
		# 		if bom:
		# 			bom = bom[0][0]
		# 			stock_entry.append('items',{
		# 				'item_code': work_order.second_item,
		# 				't_warehouse': work_order.fg_warehouse,
		# 				'qty': work_order.second_item_qty,
		# 				'uom': frappe.db.get_value('Item',work_order.second_item,'stock_uom'),
		# 				'stock_uom': frappe.db.get_value('Item',work_order.second_item,'stock_uom'),
		# 				'conversion_factor': 1 ,
		# 				'bom_no': bom
		# 			})
		# 		else:
		# 			frappe.throw(_('Please create BOM for item {}'.format(work_order.second_item)))
	return stock_entry.as_dict()


@frappe.whitelist()
def get_items(self):
	self.set('items', [])
	self.validate_work_order()

	if not self.posting_date or not self.posting_time:
		frappe.throw(_("Posting date and posting time is mandatory"))

	self.set_work_order_details()

	if self.bom_no:

		if self.purpose in ["Material Issue", "Material Transfer", "Manufacture", "Repack",
				"Subcontract", "Material Transfer for Manufacture", "Material Consumption for Manufacture"]:

			if self.work_order and self.purpose == "Material Transfer for Manufacture":
				item_dict = self.get_pending_raw_materials()
				if self.to_warehouse and self.pro_doc:
					for item in itervalues(item_dict):
						item["to_warehouse"] = self.pro_doc.wip_warehouse
				self.add_to_stock_entry_detail(item_dict)

			elif (self.work_order and (self.purpose == "Manufacture" or self.purpose == "Material Consumption for Manufacture")
				and not self.pro_doc.skip_transfer and frappe.db.get_single_value("Manufacturing Settings",
				"backflush_raw_materials_based_on")== "Material Transferred for Manufacture"):
				get_transfered_raw_materials(self)

			elif (self.work_order and (self.purpose == "Manufacture" or self.purpose == "Material Consumption for Manufacture")
				and self.pro_doc.skip_transfer and frappe.db.get_single_value("Manufacturing Settings",
				"backflush_raw_materials_based_on")== "Material Transferred for Manufacture"):
				get_material_transfered_raw_materials(self)

			elif self.work_order and (self.purpose == "Manufacture" or self.purpose == "Material Consumption for Manufacture") and \
				frappe.db.get_single_value("Manufacturing Settings", "backflush_raw_materials_based_on")== "BOM" and \
				frappe.db.get_single_value("Manufacturing Settings", "material_consumption")== 1:
				self.get_unconsumed_raw_materials()

			else:
				if not self.fg_completed_qty:
					frappe.throw(_("Manufacturing Quantity is mandatory"))

				item_dict = self.get_bom_raw_materials(self.fg_completed_qty)
				
				#Get PO Supplied Items Details
				if self.purchase_order and self.purpose == "Subcontract":
					#Get PO Supplied Items Details
					item_wh = frappe._dict(frappe.db.sql("""
						select rm_item_code, reserve_warehouse
						from `tabPurchase Order` po, `tabPurchase Order Item Supplied` poitemsup
						where po.name = poitemsup.parent
							and po.name = %s""",self.purchase_order))
				for item in itervalues(item_dict):
					if self.pro_doc and (cint(self.pro_doc.from_wip_warehouse) or not self.pro_doc.skip_transfer):
						item["from_warehouse"] = self.pro_doc.wip_warehouse
					#Get Reserve Warehouse from PO
					if self.purchase_order and self.purpose=="Subcontract":
						item["from_warehouse"] = item_wh.get(item.item_code)
					item["to_warehouse"] = self.to_warehouse if self.purpose=="Subcontract" else ""

				self.add_to_stock_entry_detail(item_dict)

				if self.purpose != "Subcontract":
					scrap_item_dict = self.get_bom_scrap_material(self.fg_completed_qty)
					for item in itervalues(scrap_item_dict):
						if self.pro_doc and self.pro_doc.scrap_warehouse:
							item["to_warehouse"] = self.pro_doc.scrap_warehouse

					self.add_to_stock_entry_detail(scrap_item_dict, bom_no=self.bom_no)

		# fetch the serial_no of the first stock entry for the second stock entry
		if self.work_order and self.purpose == "Manufacture":
			self.set_serial_nos(self.work_order)
			work_order = frappe.get_doc('Work Order', self.work_order)
			add_additional_cost(self, work_order,self.fg_completed_qty)

		# add finished goods item
		if self.purpose in ("Manufacture", "Repack"):
			self.load_items_from_bom()

	self.set_actual_qty()
	self.calculate_rate_and_amount(raise_error_if_no_rate=False)


def add_additional_cost(stock_entry,self,qty=None):
	abbr = frappe.db.get_value("Company",self.company,'abbr')
	bom = frappe.get_doc("BOM",self.bom_no)
	for additional_cost in bom.additional_cost:
		if additional_cost.uom == "FG QTY":
			stock_entry.append("additional_costs",{
				'expense_account': 'Expenses Included In Valuation - {}'.format(abbr),
				'description': additional_cost.description,
				'qty': stock_entry.fg_completed_qty,
				'rate': additional_cost.rate,
				'amount': flt(additional_cost.rate) * flt(stock_entry.fg_completed_qty),
				'base_amount':flt(additional_cost.rate) * flt(stock_entry.fg_completed_qty),
				'uom':"FG QTY"
			})
		else:
			stock_entry.append("additional_costs",{
				'expense_account': 'Expenses Included In Valuation - {}'.format(abbr),
				'description': additional_cost.description,
				'qty': (flt((flt(qty)*flt(additional_cost.qty)))),
				'rate': additional_cost.rate,
				'amount': (flt(qty)*flt(additional_cost.qty)),
				'base_amount':(flt(qty)*flt(additional_cost.qty))
			})

def get_transfered_raw_materials(self):
	transferred_materials = frappe.db.sql("""
		select
			item_name, original_item, item_code, qty, sed.t_warehouse as warehouse, sed.s_warehouse as s_warehouse,
			description, stock_uom, expense_account, cost_center, batch_no
		from `tabStock Entry` se,`tabStock Entry Detail` sed
		where
			se.name = sed.parent and se.docstatus=1 and se.purpose='Material Transfer for Manufacture'
			and se.work_order= %s and ifnull(sed.t_warehouse, '') != ''
	""", self.work_order, as_dict=1)

	materials_already_backflushed = frappe.db.sql("""
		select
			item_code, sed.s_warehouse as warehouse, sum(qty) as qty
		from
			`tabStock Entry` se, `tabStock Entry Detail` sed
		where
			se.name = sed.parent and se.docstatus=1
			and (se.purpose='Manufacture' or se.purpose='Material Consumption for Manufacture')
			and se.work_order= %s and ifnull(sed.s_warehouse, '') != ''
	""", self.work_order, as_dict=1)

	backflushed_materials= {}
	for d in materials_already_backflushed:
		backflushed_materials.setdefault(d.item_code,[]).append({d.warehouse: d.qty})

	po_qty = frappe.db.sql("""select qty, produced_qty, material_transferred_for_manufacturing from
		`tabWork Order` where name=%s""", self.work_order, as_dict=1)[0]

	manufacturing_qty = flt(po_qty.qty)
	produced_qty = flt(po_qty.produced_qty)
	trans_qty = flt(po_qty.material_transferred_for_manufacturing)

	for item in transferred_materials:
		qty= item.qty
		item_code = item.original_item or item.item_code
		req_items = frappe.get_all('Work Order Item',
			filters={'parent': self.work_order,'item_code':item_code},
			fields=["required_qty", "consumed_qty"]
			)
		if not req_items:
			wo = frappe.get_doc("Work Order",self.work_order)
			wo.append('required_items',{
				'item_code': item.item_code,
				'source_wareouse': item.s_warehouse
			})
			wo.save()
			req_items = frappe.get_all('Work Order Item',
				filters={'parent': self.work_order,'item_code':item_code},
				fields=["required_qty", "consumed_qty"]
			)
			# frappe.msgprint(_("Did not found transfered item {0} in Work Order {1}, the item not added in Stock Entry")
			# 	.format(item_code, self.work_order))


		req_qty = flt(req_items[0].required_qty)
		req_qty_each = flt(req_qty / manufacturing_qty)
		consumed_qty = flt(req_items[0].consumed_qty)

		if trans_qty and manufacturing_qty >= (produced_qty + flt(self.fg_completed_qty)):
			# if qty >= req_qty:
			# 	qty = (req_qty/trans_qty) * flt(self.fg_completed_qty)
			# else:
			qty = qty - consumed_qty

			if self.purpose == 'Manufacture':
				# If Material Consumption is booked, must pull only remaining components to finish product
				if consumed_qty != 0:
					remaining_qty = consumed_qty - (produced_qty * req_qty_each)
					exhaust_qty = req_qty_each * produced_qty
					if remaining_qty > exhaust_qty :
						if (remaining_qty/(req_qty_each * flt(self.fg_completed_qty))) >= 1:
							qty =0
						else:
							qty = (req_qty_each * flt(self.fg_completed_qty)) - remaining_qty
				# else:
				# 	qty = req_qty_each * flt(self.fg_completed_qty)


		elif backflushed_materials.get(item.item_code):
			for d in backflushed_materials.get(item.item_code):
				if d.get(item.warehouse):
					if (qty > req_qty):
						qty = req_qty
						qty-= d.get(item.warehouse)
		
		if qty > 0:
			add_to_stock_entry_detail(self, {
				item.item_code: {
					"from_warehouse": item.warehouse,
					"to_warehouse": "",
					"qty": qty,
					"item_name": item.item_name,
					"description": item.description,
					"stock_uom": item.stock_uom,
					"expense_account": item.expense_account,
					"cost_center": item.buying_cost_center,
					"original_item": item.original_item,
					"batch_no": item.batch_no
				}
			})

def get_material_transfered_raw_materials(self):
	mti_data = frappe.db.sql("""select name
		from `tabMaterial Transfer Instruction`
		where docstatus = 1
			and work_order = %s """, self.work_order, as_dict = 1)

	if not mti_data:
		frappe.msgprint(_("No Material Transfer Instruction found!"))
		return

	transfer_data = []

	for mti in mti_data:
		mti_doc = frappe.get_doc("Material Transfer Instruction", mti.name)
		for row in mti_doc.items:
			self.append('items', {
				'item_code': row.item_code,
				'item_name': row.item_name,
				'description': row.description,
				'uom': row.uom,
				'stock_uom': row.stock_uom,
				'qty': row.qty,
				'batch_no': row.batch_no,
				'transfer_qty': row.transfer_qty,
				'conversion_factor': row.conversion_factor,
				's_warehouse': row.s_warehouse,
				'bom_no': row.bom_no,
				'lot_no': row.lot_no,
				'packaging_material': row.packaging_material,
				'packing_size': row.packing_size,
				'batch_yield': row.batch_yield,
				'concentration': row.concentration,
			})

def add_to_stock_entry_detail(self, item_dict, bom_no=None):
	cost_center = frappe.db.get_value("Company", self.company, 'cost_center')

	for d in item_dict:
		stock_uom = item_dict[d].get("stock_uom") or frappe.db.get_value("Item", d, "stock_uom")

		se_child = self.append('items')
		se_child.s_warehouse = item_dict[d].get("from_warehouse")
		se_child.t_warehouse = item_dict[d].get("to_warehouse")
		se_child.item_code = item_dict[d].get('item_code') or cstr(d)
		se_child.item_name = item_dict[d]["item_name"]
		se_child.description = item_dict[d]["description"]
		se_child.uom = item_dict[d]["uom"] if item_dict[d].get("uom") else stock_uom
		se_child.stock_uom = stock_uom
		se_child.qty = flt(item_dict[d]["qty"], se_child.precision("qty"))
		# se_child.quantity = flt(item_dict[d]["quantity"], se_child.precision("quantity"))
		se_child.expense_account = item_dict[d].get("expense_account")
		se_child.cost_center = item_dict[d].get("cost_center") or cost_center
		se_child.allow_alternative_item = item_dict[d].get("allow_alternative_item", 0)
		se_child.subcontracted_item = item_dict[d].get("main_item_code")
		se_child.original_item = item_dict[d].get("original_item")
		se_child.batch_no = item_dict[d].get("batch_no")

		if item_dict[d].get("idx"):
			se_child.idx = item_dict[d].get("idx")

		if se_child.s_warehouse==None:
			se_child.s_warehouse = self.from_warehouse
		if se_child.t_warehouse==None:
			se_child.t_warehouse = self.to_warehouse

		# in stock uom
		se_child.conversion_factor = flt(item_dict[d].get("conversion_factor")) or 1
		se_child.transfer_qty = flt(item_dict[d]["qty"]*se_child.conversion_factor, se_child.precision("qty"))


		# to be assigned for finished item
		se_child.bom_no = bom_no

#Work Order Override function
def get_status(self, status=None):

	'''Return the status based on stock entries against this Work Order'''
	if not status:
		status = self.status

	if self.docstatus==0:
		status = 'Draft'
	elif self.docstatus==1:
		if status != 'Stopped':
			# Finbyz Changes: fg_completed_qty to fg_completed_quantity
			stock_entries = frappe._dict(frappe.db.sql("""select purpose, sum(fg_completed_qty)
				from `tabStock Entry` where work_order=%s and docstatus=1
				group by purpose""", self.name))

			status = "Not Started"
			if stock_entries:
				status = "In Process"
				produced_qty = stock_entries.get("Manufacture")
				
				#Finbyz Changes: for under production allowance
				under_production = 0 #flt(frappe.db.get_single_value("Manufacturing Settings", "under_production_allowance_percentage"))
				allowed_qty = flt(self.qty) * (100 - under_production) / 100.0

				if flt(produced_qty) >= abs(flt(allowed_qty)):
					status = "Completed"
	else:
		status = 'Cancelled'
	return status

def update_work_order_qty(self):
	"""Update **Manufactured Qty** and **Material Transferred for Qty** in Work Order
		based on Stock Entry"""

	allowance_percentage = flt(frappe.db.get_single_value("Manufacturing Settings",
		"overproduction_percentage_for_work_order"))

	for purpose, fieldname in (("Manufacture", "produced_qty"),
		("Material Transfer for Manufacture", "material_transferred_for_manufacturing")):
		if (purpose == 'Material Transfer for Manufacture' and
			self.operations and self.transfer_material_against == 'Job Card'):
			continue
		
		#Finbyz Changes: changed from fg_completed_qty to fg_completed_quantity
		qty = flt(frappe.db.sql("""select sum(fg_completed_qty)
			from `tabStock Entry` where work_order=%s and docstatus=1
			and purpose=%s""", (self.name, purpose))[0][0])

		completed_qty = self.qty + (allowance_percentage/100 * self.qty)

		#Finbyz Changes: For multiple material transfer
		if not self.skip_transfer:
			if purpose == "Material Transfer for Manufacture":
				qty = min(qty,self.qty)
				
		if qty > completed_qty:
			frappe.throw(_("{0} ({1}) cannot be greater than planned quantity ({2}) in Work Order {3}").format(\
				self.meta.get_label(fieldname), qty, completed_qty, self.name), StockOverProductionError)
		
		self.db_set(fieldname, qty)

		from erpnext.selling.doctype.sales_order.sales_order import update_produced_qty_in_so_item

		if self.sales_order and self.sales_order_item:
			update_produced_qty_in_so_item(self.sales_order, self.sales_order_item)

	if self.production_plan:
		self.update_production_plan_status()

#Work Order Override function
def update_transaferred_qty_for_required_items(self):
	''' Override for quantity remaining things are same
		update transferred qty from submitted stock entries for that item against
			the work order'''

	for d in self.required_items:
		# Finbyz Changes: changed qty to quantity
		transferred_qty = frappe.db.sql('''select sum(qty)
			from `tabStock Entry` entry, `tabStock Entry Detail` detail
			where
				entry.work_order = %(name)s
				and entry.purpose = "Material Transfer for Manufacture"
				and entry.docstatus = 1
				and detail.parent = entry.name
				and (detail.item_code = %(item)s or detail.original_item = %(item)s)''', {
					'name': self.name,
					'item': d.item_code
				})[0][0]
		

		d.db_set('transferred_qty', flt(transferred_qty), update_modified = False)

#Work Order Override function
def update_consumed_qty_for_required_items(self):
	'''Override for quantity remaining things same
	update consumed qty from submitted stock entries for that item against
			the work order'''
	for d in self.required_items:
		#Finbyz Changes: changed qty to quantity
		consumed_qty = frappe.db.sql('''select sum(qty)
			from `tabStock Entry` entry, `tabStock Entry Detail` detail
			where
				entry.work_order = %(name)s
				and (entry.purpose = "Material Consumption for Manufacture"
				or entry.purpose = "Manufacture")
				and entry.docstatus = 1
				and detail.parent = entry.name
				and (detail.item_code = %(item)s or detail.original_item = %(item)s)''', {
					'name': self.name,
					'item': d.item_code
				})[0][0]

		d.db_set('consumed_qty', flt(consumed_qty), update_modified = False)		


def create_job_card(work_order, row, enable_capacity_planning=False, auto_create=False):
	doc = frappe.new_doc("Job Card")
	doc.update(
		{
			"work_order": work_order.name,
			"operation": row.get("operation"),
			"workstation": row.get("workstation"),
			"posting_date": nowdate(),
			"for_quantity": row.job_card_qty or work_order.get("qty", 0),
			"operation_id": row.get("name"),
			"bom_no": work_order.bom_no,
			"project": work_order.project,
			"company": work_order.company,
			"sequence_id": row.get("sequence_id"),
			"wip_warehouse": work_order.wip_warehouse,
			"hour_rate": row.get("hour_rate"),
			"serial_no": row.get("serial_no"),
			"parent_work_order":work_order.parent_work_order,
		}
	)

	if work_order.transfer_material_against == "Job Card" and not work_order.skip_transfer:
		doc.get_required_items()

	if auto_create:
		doc.flags.ignore_mandatory = True
		if enable_capacity_planning:
			doc.schedule_time_logs(row)

		doc.insert()
		frappe.msgprint(
			_("Job card {0} created").format(get_link_to_form("Job Card", doc.name)), alert=True
		)

	if enable_capacity_planning:
		# automatically added scheduling rows shouldn't change status to WIP
		doc.db_set("status", "Open")

	return doc