
import frappe, json, re
from frappe import _, bold
from frappe.utils import cstr, cint, flt, getdate, format_date
from erpnext.regional.india.e_invoice.utils import (GSPConnector,raise_document_name_too_long_error,read_json,
            validate_mandatory_fields,get_doc_details,get_return_doc_reference,
	        get_eway_bill_details,validate_totals,show_link_to_error_log,santize_einvoice_fields,safe_json_load,get_payment_details,
	        validate_eligibility,update_item_taxes,get_party_details,update_other_charges,
	        get_overseas_address_details, validate_address_fields, sanitize_for_json, log_error)
from erpnext.regional.india.utils import get_gst_accounts,get_place_of_supply

def get_item_list(invoice):
	item_list = []

	for d in invoice.items:
		einvoice_item_schema = read_json('einv_item_template')
		item = frappe._dict({})
		item.update(d.as_dict())

		item.sr_no = d.idx
		item.description = json.dumps(d.item_name)[1:-1]

		# Finbyz changes Start: Wherever Quantity is calculating based on concentration with qty 
		try:
			item.qty = abs(item.quantity)
		except:
			item.qty = abs(item.qty)
		# Finbyz Changes End
		
		if invoice.apply_discount_on == 'Net Total' and invoice.discount_amount:
			item.discount_amount = abs(item.base_amount - item.base_net_amount)
		else:
			item.discount_amount = 0

		item.unit_rate = abs((abs(item.taxable_value) - item.discount_amount)/ item.qty)
		item.gross_amount = abs(item.taxable_value) + item.discount_amount
		item.taxable_value = abs(item.taxable_value)

		item.batch_expiry_date = frappe.db.get_value('Batch', d.batch_no, 'expiry_date') if d.batch_no else None
		item.batch_expiry_date = format_date(item.batch_expiry_date, 'dd/mm/yyyy') if item.batch_expiry_date else None
		#finbyz Changes
		if item.batch_no:
			item.batch_no = item.batch_no[:20]
		if frappe.db.get_value('Item', d.item_code, 'is_stock_item') or frappe.db.get_value('Item', d.item_code, 'is_not_service_item'):
			item.is_service_item = 'N'  
		else:
			item.is_service_item = 'Y'
		#finbyz changes end
		
		item.serial_no = ""

		item = update_item_taxes(invoice, item)
		
		item.total_value = abs(
			item.taxable_value + item.igst_amount + item.sgst_amount +
			item.cgst_amount + item.cess_amount + item.cess_nadv_amount + item.other_charges
		)
		einv_item = einvoice_item_schema.format(item=item)
		item_list.append(einv_item)

	return ', '.join(item_list)
