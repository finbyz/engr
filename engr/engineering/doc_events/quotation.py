import frappe
from frappe.utils import flt, getdate, nowdate
from frappe import _
from erpnext.controllers.selling_controller import SellingController
from frappe.model.mapper import get_mapped_doc
def _make_sales_order(source_name, target_doc=None, ignore_permissions=False):
	customer = _make_customer(source_name, ignore_permissions)

	def set_missing_values(source, target):
		if customer:
			target.customer = customer.name
			target.customer_name = customer.customer_name
		if source.referral_sales_partner:
			target.sales_partner=source.referral_sales_partner
			target.commission_rate=frappe.get_value('Sales Partner', source.referral_sales_partner, 'commission_rate')
		target.ignore_pricing_rule = 1
		target.flags.ignore_permissions = ignore_permissions
		target.run_method("set_missing_values")
		target.run_method("calculate_taxes_and_totals")

	def update_item(obj, target, source_parent):
		target.stock_qty = flt(obj.qty) * flt(obj.conversion_factor)

		if obj.against_blanket_order:
			target.against_blanket_order = obj.against_blanket_order
			target.blanket_order = obj.blanket_order
			target.blanket_order_rate = obj.blanket_order_rate

	doclist = get_mapped_doc("Quotation", source_name, {
			"Quotation": {
				"doctype": "Sales Order",
				"field_map": {
					"ref_letter": "ref_letter",
					"po_site_details":"po_site_details",
					'project':'project'
				},
				"validation": {
					"docstatus": ["=", 1]
				}
			},
			"Quotation Item": {
				"doctype": "Sales Order Item",
				"field_map": {
					"parent": "prevdoc_docname"
				},
				"postprocess": update_item
			},
			"Sales Taxes and Charges": {
				"doctype": "Sales Taxes and Charges",
				"add_if_empty": True
			},
			"Sales Team": {
				"doctype": "Sales Team",
				"add_if_empty": True
			},
			"Payment Schedule": {
				"doctype": "Payment Schedule",
				"add_if_empty": True
			}
		}, target_doc, set_missing_values, ignore_permissions=ignore_permissions)

	# postprocess: fetch shipping address, set missing values

	return doclist

def _make_customer(source_name, ignore_permissions=False):
	quotation = frappe.db.get_value("Quotation",
		source_name, ["order_type", "party_name", "customer_name"], as_dict=1)

	if quotation and quotation.get('party_name'):
		if not frappe.db.exists("Customer", quotation.get("party_name")):
			lead_name = quotation.get("party_name")
			customer_name = frappe.db.get_value("Customer", {"lead_name": lead_name},
				["name", "customer_name"], as_dict=True)
			if not customer_name:
				from erpnext.crm.doctype.lead.lead import _make_customer
				customer_doclist = _make_customer(lead_name, ignore_permissions=ignore_permissions)
				customer = frappe.get_doc(customer_doclist)
				customer.flags.ignore_permissions = ignore_permissions
				if quotation.get("party_name") == "Shopping Cart":
					customer.customer_group = frappe.db.get_value("E Commerce Settings", None,
						"default_customer_group")

				try:
					customer.insert()
					return customer
				except frappe.NameError:
					if frappe.defaults.get_global_default('cust_master_name') == "Customer Name":
						customer.run_method("autoname")
						customer.name += "-" + lead_name
						customer.insert()
						return customer
					else:
						raise
				except frappe.MandatoryError as e:
					mandatory_fields = e.args[0].split(':')[1].split(',')
					mandatory_fields = [customer.meta.get_label(field.strip()) for field in mandatory_fields]

					frappe.local.message_log = []
					lead_link = frappe.utils.get_link_to_form("Lead", lead_name)
					message = _("Could not auto create Customer due to the following missing mandatory field(s):") + "<br>"
					message += "<br><ul><li>" + "</li><li>".join(mandatory_fields) + "</li></ul>"
					message += _("Please create Customer from Lead {0}.").format(lead_link)

					frappe.throw(message, title=_("Mandatory Missing"))
			else:
				return customer_name
		else:
			return frappe.get_doc("Customer", quotation.get("party_name"))



@frappe.whitelist()
def make_WOM(source_name, target_doc=None):	
	doclist = get_mapped_doc("Quotation", source_name, {
			"Quotation":{
				"doctype": "Work Order Master",
				"field_map": {
					"name":"quotation",
					"party_name": "customer_name",
					"ref_letter":"ref_letter",
					"po_site_details":"po_site_details",
					'contact_mobile':'mobile_no',
					'contact_email':'email_id',
					'name':'quotation_no',
					'project':'project',
					'taxes_and_charges':'taxes_and_charges'
					},
				},
				"Quotation Item": {
					"doctype": "Work Order Master Item",
					"field_map":  {
						"name": "quotation_item",
						"parent": "quotation",
						"item_code": "item_code",
						"item_name": "item_name",
						"item_group": "item_group",
						'rate':'rate',
						'qty':'sample_quantity',
						'sample_quantity':'qty'
					}
			    },
	}, target_doc)

	return doclist

def update_quotation_status(self,method=None):
	if self.sales_order:
		frappe.db.set_value("Quotation",self.name,'status','Ordered')