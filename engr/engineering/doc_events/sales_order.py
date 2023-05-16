# -*- coding: utf-8 -*-
# Copyright (c) 2021, Finbyz Tech. Pvt. Ltd. and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
from frappe import _
from frappe.utils import flt,cint,get_url_to_form
from erpnext.controllers.status_updater import StatusUpdater
from engr.api import validate_sales_person
from frappe.model.mapper import get_mapped_doc
from frappe.model.utils import get_fetch_values
from erpnext.stock.doctype.item.item import get_item_defaults
from erpnext.selling.doctype.customer.customer import check_credit_limit
from erpnext.setup.doctype.item_group.item_group import get_item_group_defaults
from erpnext.stock.doctype.item.item import get_item_defaults
from erpnext.stock.stock_balance import get_reserved_qty, update_bin_qty

def update_proforma_details(docname,action):
	doc = frappe.get_doc("Proforma Invoice",docname)
	if doc.payment_percentage:
		if action == "submit":
			if doc.payment_percentage > 100:
				frappe.throw("Payment Percentage cannot be more than 100%")

			sales_order_list = []

			for item in doc.items:
				if item.sales_order and item.sales_order_item:
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
			if sales_order_list:
				for so in sales_order_list:
					if so:
						so_doc = frappe.get_doc("Sales Order",so)

						so_doc.db_set("proforma_amount",flt(doc.payment_due_amount) + flt(so_doc.proforma_amount))
						so_doc.db_set("proforma_percentage",flt(so_doc.proforma_amount) / flt(so_doc.rounded_total) * 100)
						change_sales_order_status(so_doc)

		elif action == "cancel":
			sales_order_list = []
			for item in doc.items:
				if item.sales_order and item.sales_order_item:
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
						if proforma_amount and net_amount:
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
			if sales_order_list:
				for so in sales_order_list:
					if so:
						so_doc  = frappe.get_doc("Sales Order",so)
						so_doc.db_set("proforma_amount",flt(so_doc.proforma_amount) - flt(doc.payment_due_amount))
						so_doc.db_set("proforma_percentage",flt(so_doc.proforma_amount) / flt(so_doc.rounded_total) * 100)
						change_sales_order_status(so_doc)

def change_sales_order_status(so_doc, update_modified= True):
	pi_status = frappe.db.sql("""select pi.status
		from `tabProforma Invoice` as pi
		JOIN `tabProforma Invoice Item` as pii on pii.parent = pi.name
		where pii.sales_order = '{}' and pi.docstatus=1
	""".format(so_doc.name),as_dict=1)
	status_list = list(set(status.status for status in pi_status))
	if ("Unpaid" in status_list or "Partially Paid" in status_list) and so_doc.get('docstatus') == 1:
		so_doc.db_set("status","Proforma Raised", update_modified= update_modified)
	elif so_doc.get('docstatus') == 1:
		StatusUpdater.set_status(so_doc,update=True, update_modified=update_modified)


@frappe.whitelist()
def get_last_5_transaction_details(name, item_code, customer):
	data = frappe.db.sql("""
		SELECT soi.qty, soi.rate, so.transaction_date, so.company,so.name 
		FROM `tabSales Order Item` as soi JOIN `tabSales Order` as so on soi.parent=so.name 
		WHERE soi.name != '{}' and so.customer = '{}' and soi.item_code = '{}' and so.docstatus = 1
		ORDER By so.transaction_date DESC LIMIT 5	
	""".format(name, customer, item_code), as_dict = 1)

	table = """<table class="table table-bordered" style="margin: 0; font-size:80%;">
		<thead>
			<tr>
				<th>Sales Order</th>
				<th>Company</th>
				<th>Date</th>
				<th>Qty</th>
				<th>Rate</th>

			<tr>
		</thead>
	<tbody>"""
	for i in data:
		table += f"""
			<tr>
				<td>{"<a href='{0}' target='_blank'>{1}</a>".format(get_url_to_form("Sales Order",i.name),i.name)}</td>
				<td>{i.company}</td>
				<td>{frappe.format(i.transaction_date, {'fieldtype': 'Date'})}</td>
				<td>{i.qty}</td>
				<td>{i.rate}</td>
			</tr>
		"""
	
	table += """
	</tbody></table>
	"""
	return table

def on_trash(self , method):
	if self.work_order_master_ref:
		frappe.db.set_value("Work Order Master" , self.work_order_master_ref , "sales_order" , None)

def on_cancel(self , method):
	if self.work_order_master_ref:
		frappe.db.set_value("Work Order Master" , self.work_order_master_ref , "sales_order" , None)

def validate_item_group(self):
	for row in self.items:
		if row.item_group=="GENERIC ITEM":
			frappe.throw("Row: {} has item of GENERIC ITEM group.".format(frappe.bold(row.idx)))

def validate(self,method):
	validate_sales_person(self)
	validate_item_group(self)
	validate_wom(self)

def validate_wom(self):
	if self.work_order_master_ref:
		frappe.db.set_value("Work Order Master" , self.work_order_master_ref , "sales_order" , self.name)

@frappe.whitelist()
def make_sales_invoice(source_name, target_doc=None, ignore_permissions=False):
	def postprocess(source, target):
		set_missing_values(source, target)
		#Get the advance paid Journal Entries in Sales Invoice Advance
		if target.get("allocate_advances_automatically"):
			target.set_advances()

	def set_missing_values(source, target):
		target.ignore_pricing_rule = 1
		target.flags.ignore_permissions = True
		target.run_method("set_missing_values")
		target.run_method("set_po_nos")
		target.run_method("calculate_taxes_and_totals")

		if source.company_address:
			target.update({'company_address': source.company_address})
		else:
			# set company address
			target.update(get_company_address(target.company))

		if target.company_address:
			target.update(get_fetch_values("Sales Invoice", 'company_address', target.company_address))

		# set the redeem loyalty points if provided via shopping cart
		if source.loyalty_points and source.order_type == "Shopping Cart":
			target.redeem_loyalty_points = 1

	def update_item(source, target, source_parent):
		target.amount = flt(source.amount) - flt(source.billed_amt)
		target.base_amount = target.amount * flt(source_parent.conversion_rate)
		target.qty = target.amount / flt(source.rate) if (source.rate and source.billed_amt) else source.qty - source.returned_qty

		if source_parent.project:
			target.cost_center = frappe.db.get_value("Project", source_parent.project, "cost_center")
		if target.item_code:
			item = get_item_defaults(target.item_code, source_parent.company)
			item_group = get_item_group_defaults(target.item_code, source_parent.company)
			cost_center = item.get("selling_cost_center") \
				or item_group.get("selling_cost_center")

			if cost_center:
				target.cost_center = cost_center

	doclist = get_mapped_doc("Sales Order", source_name, {
		"Sales Order": {
			"doctype": "Sales Invoice",
			"field_map": {
				"party_account_currency": "party_account_currency",
				"payment_terms_template": "payment_terms_template",
				"ref_letter":"ref_letter",
				"po_site_details":"po_site_details",
				"work_order_master_ref":"work_order_master_ref",
				"job_id":"job_id"
			},
			"field_no_map": ["payment_terms_template"],
			"validation": {
				"docstatus": ["=", 1]
			}
		},
		"Sales Order Item": {
			"doctype": "Sales Invoice Item",
			"field_map": {
				"name": "so_detail",
				"parent": "sales_order",
				'rate':"rate",
				"qty":'so_quantity',
			},
			"postprocess": update_item,
			"condition": lambda doc: doc.qty and (doc.base_amount==0 or abs(doc.billed_amt) < abs(doc.amount))
		},
		"Sales Taxes and Charges": {
			"doctype": "Sales Taxes and Charges",
			"add_if_empty": True
		},
		"Sales Team": {
			"doctype": "Sales Team",
			"add_if_empty": True
		}
	}, target_doc, postprocess, ignore_permissions=ignore_permissions)

	automatically_fetch_payment_terms = cint(frappe.db.get_single_value('Accounts Settings', 'automatically_fetch_payment_terms'))
	if automatically_fetch_payment_terms:
		doclist.set_payment_schedule()

	return doclist



def set_payment_status(self , method):
	if(self.work_order_master_ref):
		contract_work = frappe.db.get_value("Work Order Master" , self.work_order_master_ref ,"contract_work")
	if self.per_billed == 0.0  and self.work_order_master_ref and contract_work != 1:
		frappe.db.set_value("Work Order Master",self.work_order_master_ref,"payment_status","Unpaid",update_modified=False)
	if self.per_billed == 0.0 and self.work_order_master_ref and contract_work == 1:
		frappe.db.set_value("Work Order Master",self.work_order_master_ref,"payment_status","Unpaid-Contract Work",update_modified=False)
	if self.per_billed > 0 and round(self.per_billed) < 100 and self.work_order_master_ref:
		frappe.db.set_value("Work Order Master",self.work_order_master_ref,"payment_status","Partially paid",update_modified=False)
	if round(self.per_billed) == 100 and self.work_order_master_ref:
		frappe.db.set_value("Work Order Master",self.work_order_master_ref,"payment_status","Paid",update_modified=False)
	if round(self.advance_paid)  == round(self.grand_total) and self.work_order_master_ref:
		frappe.db.set_value("Work Order Master",self.work_order_master_ref,"payment_status","Advance Paid",update_modified=False)

def set_quotation_ref(self,method):
	if not self.quotation_no:
		self.quotation_no = frappe.db.get_value("Work Order Master",self.work_order_master_ref,'quotation_no')
	if self.quotation_no:
		frappe.db.set_value('Quotation',self.quotation_no,'status','Ordered',update_modified=False)