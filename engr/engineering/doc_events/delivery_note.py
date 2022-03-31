# -*- coding: utf-8 -*-

from __future__ import unicode_literals
import frappe
from frappe.model.mapper import get_mapped_doc
from frappe import _
from frappe.utils import flt, cint, get_url_to_form
from erpnext.stock.doctype.batch.batch import set_batch_nos
from erpnext.stock.doctype.delivery_note.delivery_note import DeliveryNote
from datetime import datetime

def on_submit(self, method):
	create_purchase_receipt(self)

def create_purchase_receipt(self):
	def get_purchase_receipt_entry(source_name, target_doc=None, ignore_permissions= True):

		def set_missing_values(source, target):

			target.company = source.customer
			target.supplier = source.company
			target.set_posting_time = 1
			target.posting_date = source.posting_date
			
			target_company_abbr = frappe.db.get_value("Company", target.company, "abbr")
			source_company_abbr = frappe.db.get_value("Company", source.company, "abbr")
			if source.taxes_and_charges:
				target_taxes_and_charges = source.taxes_and_charges.replace(source_company_abbr, target_company_abbr)
				if frappe.db.exists("Purchase Taxes and Charges Template", target_taxes_and_charges):
					target.taxes_and_charges = target_taxes_and_charges
				else:
					frappe.throw("Please Create Sales Taxes and Charges Template Like Purchase Taxes and Charges Template {}".format(frappe.bold(source.taxes_and_charges)))
					
			# if source_parent.purchase_naming_series:
			# 	target_doc.name = source_parent.purchase_naming_series
			# else:
			# 	target_doc.name = source_name
			# if source.packages:
			# 	target.packages = source.packages
			target.letter_head =  frappe.db.get_value("Company",self.customer,'default_letter_head')

			if self.amended_from:
				name = frappe.db.get_value("Purchase Receipt", {'dn_ref': self.amended_from}, "name")
				target.amended_from = name
			
		def update_items(source_doc, target_doc, source_parent):
			source_company_abbr = frappe.db.get_value("Company", source_parent.company, "abbr")
			target_company_abbr = frappe.db.get_value("Company", source_parent.customer, "abbr")

			if source_doc.warehouse:
				# target_doc.warehouse = source_doc.warehouse.replace(source_company_abbr, target_company_abbr)
				target_doc.warehouse = self.set_target_warehouse
			target_doc.cost_center = source_doc.cost_center.replace(source_company_abbr, target_company_abbr)
			

		def update_pack(source_doc, target_doc, source_parent):
			# frappe.msgprint(str(source_parent.packages[0].item_code))
			for item in source_parent.items:
					# frappe.msgprint(str(pkg.item_code))
				if source_doc.item_code == item.item_code and source_doc.merge == item.merge and source_doc.grade == item.grade:
					if not target_doc.row_ref:
						target_doc.row_ref = item.idx
		def update_taxes(source_doc, target_doc, source_parent):
			source_company_abbr = frappe.db.get_value("Company", source_parent.company, "abbr")
			target_company_abbr = frappe.db.get_value("Company", source_parent.customer, "abbr")

			if source_doc.account_head:
				target_doc.account_head = source_doc.account_head.replace(source_company_abbr, target_company_abbr)

			if source_doc.cost_center:
				target_doc.cost_center = source_doc.cost_center.replace(source_company_abbr, target_company_abbr)

		fields = {
			"Delivery Note": {
				"doctype": "Purchase Receipt",
				"field_map": {
					"set_posting_time": "set_posting_time",
					"selling_price_list": "buying_price_list",
					"shipping_address_name": "shipping_address",
					"shipping_address": "shipping_address_display",
					"posting_date": "posting_date",
					"posting_time": "posting_time",
					"ignore_pricing_rule": "ignore_pricing_rule",
					"target_warehouse": "set_warehouse",
					"name": "supplier_delivery_note",
					"posting_date": "supplier_delivery_note_date",
					"purchase_naming_series": "naming_series",
				},
				"field_no_map": [
					# "taxes_and_charges",
					"series_value",
					"letter_head",
				],

			},
			"Delivery Note Item": {
				"doctype": "Purchase Receipt Item",
				"field_map": {
					"purchase_order_item": "purchase_order_item",
					"serial_no": "serial_no",
					"batch_no": "batch_no",
				},
				"field_no_map": [
					"warehouse",
					"cost_center",
					"expense_account",
					"income_account",
				],
				"postprocess": update_items,
			},
			"Sales Taxes and Charges": {
				"doctype": "Purchase Taxes and Charges",
				"postprocess": update_taxes,
			},
			"Delivery Note Package Detail":{
				"doctype": "Purchase Receipt Package Detail",
				"field_map": {
					"consumed_qty": "net_weight",
				},
				"field_no_map": [
					"item_code"
				],
				"postprocess": update_pack,
			}

		}

		doc = get_mapped_doc(
			"Delivery Note",
			source_name,
			fields,
			target_doc,
			set_missing_values,
			ignore_permissions=ignore_permissions
		)

		return doc

	check_inter_company_transaction = None
	if frappe.db.exists("Company", self.customer):
		check_inter_company_transaction = frappe.get_value("Company", self.customer, "allow_inter_company_transaction")
	
	if check_inter_company_transaction:
		company = frappe.get_doc("Company", self.customer)
		inter_company_list = [item.company for item in company.allowed_to_transact_with]

		if self.company in inter_company_list:
			pr = get_purchase_receipt_entry(self.name)
			pr.save(ignore_permissions = True)

			for index, item in enumerate(self.items):
				# price_list = self.selling_price_list
				# if price_list:
				# 	valid_price_list = frappe.db.get_value("Price List", {"name": price_list, "buying": 1, "selling": 1})
				# else:
				# 	frappe.throw(_("Selected Price List should have buying and selling fields checked."))

				# if not valid_price_list:
				# 	frappe.throw(_("Selected Price List should have buying and selling fields checked."))

				against_sales_order = self.items[index].against_sales_order

				purchase_order = None
				if frappe.db.exists("Sales Order", against_sales_order):
					purchase_order = frappe.db.get_value("Sales Order", against_sales_order, 'inter_company_order_reference')

				if purchase_order:
					pr.items[index].schedule_date = frappe.db.get_value("Purchase Order", purchase_order, 'schedule_date')
					pr.items[index].purchase_order = purchase_order
				self.items[index].pr_detail = pr.items[index].name
				# frappe.db.set_value("Delivery Note Item", self.items[index].name, 'pr_detail', pr.items[index].name)
			
			pr.save(ignore_permissions = True)

			pr.submit()
			
			self.db_set('inter_company_receipt_reference', pr.name)
			self.db_set('pr_ref', pr.name)

			pr.db_set('inter_company_delivery_reference', self.name)
			pr.db_set('supplier_delivery_note', self.name)
			pr.db_set('dn_ref', self.name)

			url = get_url_to_form("Purchase Receipt", pr.name)
			frappe.msgprint(_("Purchase Receipt <b><a href='{url}'>{name}</a></b> has been created successfully!".format(url=url, name=frappe.bold(pr.name))), title="Purchase Receipt Created", indicator="green")


def on_cancel(self, method):
	cancel_all(self)	
	# update_packages(self, method)
	# cancel_pallet_stock_entry(self)
	# for item in self.items:
	# 	if item.against_pick_list:
	# 		pick_list_item = frappe.get_doc("Pick List Item", item.against_pick_list)
	# 		delivered_qty = pick_list_item.delivered_qty - item.qty
	# 		if delivered_qty < 0:
	# 			delivered_qty = 0
	# 			# frappe.throw("You can not deliver more tha picked qty")
	# 			pass
	# 		pick_list_item.db_set("delivered_qty", delivered_qty)
	# calculate_pick_delivered(self)

def cancel_all(self):
	if self.get('pr_ref'):
		doc = frappe.get_doc("Purchase Receipt", self.pr_ref)

		if doc.docstatus == 1:
			doc.cancel()

def on_trash(self, method):
	# pass
 	delete_all(self)

def delete_all(self):
	if self.get('pr_ref'):
		pr_ref = self.pr_ref
		frappe.db.set_value("Purchase Receipt", self.pr_ref, 'inter_company_delivery_reference', '')
		frappe.db.set_value("Purchase Receipt", self.pr_ref, 'dn_ref', '')

		self.db_set("pr_ref", '')
		self.db_set("inter_company_receipt_reference", '')

		doc = frappe.get_doc("Purchase Receipt", pr_ref)
		doc.delete()
		frappe.msgprint(_("Purchase Receipt <b>{name}</b> has been deleted!".format(name=pr_ref)), title="Purchase Receipt Deleted", indicator="red")
		
def update_packages(self, method):
	if method == "on_submit":
		if self.is_return:
			for row in self.packages:
				doc = frappe.get_doc("Package", row.package)
				doc.add_consumption(self.doctype, self.name, -row.consumed_qty, self.posting_date, self.posting_time)
				doc.save(ignore_permissions=True)
		else:
			for row in self.packages:
				doc = frappe.get_doc("Package", row.package)
				doc.add_consumption(self.doctype, self.name, row.consumed_qty, self.posting_date, self.posting_time)
				doc.save(ignore_permissions=True)

	elif method == "on_cancel":
		for row in self.packages:
			doc = frappe.get_doc("Package", row.package)
			if doc.warehouse != row.warehouse:
				frappe.throw(_("Row:{}  Package {} does not belong to warehouse {}.Please cancel the tranfer and reselect the package".format(row.idx,row.package,row.warehouse)))
			doc.remove_consumption(self.doctype, self.name)
			doc.save(ignore_permissions=True)

def cancel_pallet_stock_entry(self):
	if self.pallet_item:
		se = frappe.get_doc("Stock Entry",{'reference_doctype': self.doctype,'reference_docname':self.name})
		se.flags.ignore_permissions = True
		try:
			se.cancel()
		except Exception as e:
			raise e
		se.db_set('reference_doctype','')
		se.db_set('reference_docname','')


def calculate_pick_delivered(self):
	pick_list_list = list(set([row.against_pick_list for row in self.items]))
	for item in pick_list_list:
		if item:
			parent = frappe.db.get_value("Pick List Item", item, 'parent')
			pick_doc = frappe.get_doc("Pick List", parent)
			qty = 0
			delivered_qty = 0
			for row in pick_doc.locations:
				qty += row.qty
				delivered_qty += row.delivered_qty

			pick_doc.per_delivered = flt((delivered_qty / qty) * 100, 2)
			if pick_doc.per_delivered > 99.99:
				pick_doc.status = 'Delivered'
			elif pick_doc.per_delivered > 0.0 and pick_doc.per_delivered < 99.99:
				pick_doc.status = 'Partially Delivered'
			else:
				pick_doc.status = 'To Deliver'
			pick_doc.save()

