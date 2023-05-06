# Copyright (c) 2021, FinByz Tech Pvt. Ltd. and contributors
# For license information, please see license.txt

import frappe, json
from frappe.model.document import Document
from frappe.utils import nowdate,get_url_to_form
from frappe import _
from erpnext.controllers.accounts_controller import get_taxes_and_charges
from frappe.utils import flt,cint,round_based_on_smallest_currency_fraction
from erpnext.controllers.taxes_and_totals import calculate_taxes_and_totals
from erpnext.stock.get_item_details import get_item_tax_map
from frappe.model.mapper import get_mapped_doc

from finbyzerp.finbyzerp.doctype.credit_and_debit_note.credit_and_debit_note import CreditandDebitNote

class CustomCreditandDebitNote(CreditandDebitNote):
	# Create Purchase Or Sales Invoice Entry based on customer and supplier.
	def create_debit_credit_entry(self):
		def get_entry(source_name,target_doc=None):
			source_doc = frappe.get_doc("Credit and Debit Note",source_name)
			target_doctype = "Sales Invoice" if source_doc.party_type == "Customer" else "Purchase Invoice"
			if target_doctype == "Sales Invoice":
				target_item_doctype = "Sales Invoice Item"
				target_tax_doctype = "Sales Taxes and Charges"
			else:
				target_item_doctype = "Purchase Invoice Item"
				target_tax_doctype = "Purchase Taxes and Charges"

			def set_missing_values(source, target):
				target.is_return=source.is_return
				if source.set_posting_time:
					target.set_posting_time=1
					target.posting_time=source.posting_time
					target.posting_date=source.posting_date
				if target_doctype == "Sales Invoice":
					target.customer = source.party
					target.naming_series="SI-CR-.fiscal.-" if source.type=="Credit Note" else 'SI-DR-.fiscal.-'
				else:
					target.supplier = source.party
					target.naming_series=' PI-DR-.fiscal.-' if source.type=="Debit Note" else "PI-CR-.fiscal.-"
					
				target.remarks = source.remarks
				target.series_value = source.series_value
				target.run_method("set_missing_values")
				target.run_method("calculate_taxes_and_totals")
				for row in source.items:
					row.item_code=frappe.db.get_value("Item",row.item_name,"item_code")
				
			def update_item(source,target,source_parent):
				if not frappe.db.exists("Item",target.item_name):
					doc=frappe.new_doc("Item")
					doc.item_code=target.item_name
					doc.item_group="All Item Groups"
					doc.save()
				target.item_code=frappe.db.get_value("Item",target.item_name,"item_code")
				target.uom = frappe.db.get_value("Stock Settings",None,"stock_uom")
				target.description = source.item_name
				target.concentration = 100
				target.update_stock = 0
				target.conversion_factor = 1
				if source_parent.is_return:
					target.quantity = -(target.quantity)
					target.qty = -(target.qty)	
				if target_doctype == "Purchase Invoice":
					if source_parent.is_return:
						target.received_qty = -(target.received_qty)
						target.stock_qty = -(target.stock_qty)
				if target_doctype == "Sales Invoice":
					target.income_account = frappe.db.get_value("Company",source_parent.company,"default_income_account")

			doclist = get_mapped_doc(source_doc.doctype, source_doc.name, {
				source_doc.doctype: {
					"doctype": target_doctype,
				},
				"Credit and Debit Note Item": {
					"doctype": target_item_doctype,
					"field_map": [
						["qty","quantity"],
						["rate","price"],
					],
					"postprocess": update_item
				},
				target_tax_doctype: {
					"doctype": target_tax_doctype,
				},
			}, target_doc, set_missing_values)

			return doclist

		return_entry = get_entry(self.name)
		try:
			return_entry.flags.ignore_permissions = True
			return_entry.save()
			return_entry.submit()
			if return_entry.doctype == "Sales Invoice":
				self.db_set('si_ref',return_entry.name)
				self.db_set('pi_ref',None)
				url = get_url_to_form("Sales Invoice",return_entry.name)
				frappe.msgprint(_("Sales Invoice <b><a href='{url}'>{name}</a></b> has been submitted!".format(url=url, name=return_entry.name)), title="Sales Invoice submitted", indicator="green")
			else:
				self.db_set('pi_ref',return_entry.name)
				self.db_set('si_ref',None)
				url = get_url_to_form("Purchase Invoice",return_entry.name)
				frappe.msgprint(_("Purchase Invoice <b><a href='{url}'>{name}</a></b> has been submitted!".format(url=url, name=return_entry.name)), title="Purchase Invoice submitted", indicator="green")

		except Exception as e:
			frappe.throw(_(str(e)))

	def get_current_tax_amount(self, item, tax, item_tax_map):
		tax_rate = self._get_tax_rate(tax, item_tax_map)
		current_tax_amount = 0.0

		if tax.charge_type == "Actual":
			# distribute the tax amount proportionally to each item row
			actual = flt(tax.tax_amount, tax.precision("tax_amount"))
			current_tax_amount = item.net_amount*actual / self.doc.net_total if self.doc.net_total else 0.0

		elif tax.charge_type == "On Net Total":
			current_tax_amount = (tax_rate / 100.0) * item.net_amount
		elif tax.charge_type == "On Previous Row Amount":
			current_tax_amount = (tax_rate / 100.0) * \
				self.doc.get("taxes")[cint(tax.row_id) - 1].tax_amount_for_current_item
		elif tax.charge_type == "On Previous Row Total":
			current_tax_amount = (tax_rate / 100.0) * \
				self.doc.get("taxes")[cint(tax.row_id) - 1].grand_total_for_current_item
		elif tax.charge_type == "On Item Quantity":
			current_tax_amount = tax_rate * item.qty

		if not self.doc.get("is_consolidated"):
			self.set_item_wise_tax(item, tax, tax_rate, current_tax_amount)

		return current_tax_amount

	def set_item_wise_tax(self, item, tax, tax_rate, current_tax_amount):
		# store tax breakup for each item
		key = item.item_code or item.item_name
		item_wise_tax_amount = current_tax_amount*self.doc.conversion_rate
		if tax.item_wise_tax_detail.get(key):
			item_wise_tax_amount += tax.item_wise_tax_detail[key][1]

		tax.item_wise_tax_detail[key] = [tax_rate,flt(item_wise_tax_amount)]

	def set_rounded_total(self):
		if self.doc.meta.get_field("rounded_total"):
			from erpnext.controllers.accounts_controller import AccountsController
			if AccountsController.is_rounded_total_disabled(self.doc):
				self.doc.rounded_total = self.doc.base_rounded_total = 0
				return

			self.doc.rounded_total = round_based_on_smallest_currency_fraction(self.doc.grand_total,
				self.doc.currency, self.doc.precision("rounded_total"))

			self.doc.base_rounded_total = round_based_on_smallest_currency_fraction(self.doc.base_grand_total,
				self.doc.currency, self.doc.precision("base_rounded_total"))

			#if print_in_rate is set, we would have already calculated rounding adjustment
			self.doc.rounding_adjustment += flt(self.doc.rounded_total - self.doc.grand_total,
				self.doc.precision("rounding_adjustment"))

			self._set_in_company_currency(self.doc, ["rounding_adjustment", "rounded_total"])