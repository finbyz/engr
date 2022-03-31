
def update_proforma_outstanding_amount():
	# Update Wrong Outstanding Amount in Proforma Invoice
	from engr.engineering.doctype.proforma_invoice.proforma_invoice import set_status
	from engr.engineering.doc_events.sales_order import update_proforma_details,change_sales_order_status
	from frappe.utils import cint, flt
	update_modified= False

	data = frappe.db.get_all("Payment Entry Reference",{"proforma_invoice": ("is","set"),"docstatus":1}, ["proforma_invoice","allocated_amount"])

	pe_pi_amount = {}
	for pi in data:
		if pi.proforma_invoice not in pe_pi_amount:
			pe_pi_amount[pi.proforma_invoice] = pi.allocated_amount
		else:
			pe_pi_amount[pi.proforma_invoice] += pi.allocated_amount

	pi_details = frappe.db.get_all("Proforma Invoice",{"docstatus":1},["name", "advance_paid"])

	exp_entries = []

	for pi in pi_details:
		amt = pe_pi_amount.get(pi.name)
		if amt and amt != pi.advance_paid:
			exp_entries.append(pi.name)

	for pi in exp_entries:
		doc = frappe.get_doc("Proforma Invoice", pi)
		advance_paid_amounts = frappe.db.get_all("Payment Entry Reference",{"proforma_invoice":doc.name,"docstatus":1}, pluck="allocated_amount")
		advance_paid = sum([frappe.utils.flt(x) for x in advance_paid_amounts])
		doc.db_set("advance_paid", flt(advance_paid), update_modified= update_modified)
		if flt(doc.advance_paid) == flt(doc.payment_due_amount) or (flt(doc.advance_paid) > flt(doc.payment_due_amount) and doc.allow_over_billing_payment):
			doc.db_set('status','Paid', update_modified= update_modified)
		elif flt(doc.advance_paid) > 0:
			doc.db_set('status','Partially Paid', update_modified= update_modified)
		else:
			doc.db_set('status','Unpaid', update_modified= update_modified)
		if doc.status not in ["Unpaid", "Partially Paid"]:
			change_sales_order_status(frappe.get_doc("Sales Order",doc.items[0].sales_order), update_modified= update_modified)

def set_proforma_ref_in_payment():
	# Set Proforma Ref in Payment Entry ref table where si items[0] contains proforma ref
	dt = frappe.db.get_all("Payment Entry Reference",{"docstatus":1, "reference_doctype":"Sales Invoice", "proforma_invoice":("is","not set")}, ["name","reference_name"])
	exp_entries = []
	for row in dt:
		exists = frappe.db.sql(f"select proforma_invoice from `tabSales Invoice Item` where parent = '{row.reference_name}' and proforma_invoice is not null and idx =1 ")
		# exists = frappe.db.get_value("Sales Invoice Item",{"parent":row, "docstatus":1, "proforma_invoice":("is","set"), "idx":1}, "name")
		if exists:
			exists = exists[0][0]
			exp_entries.append(frappe._dict({"si":row.reference_name, "per_ref":row.name, "proforma_invoice":exists}))

	from engr.engineering.doctype.proforma_invoice.proforma_invoice import set_status
	from engr.engineering.doc_events.sales_order import update_proforma_details,change_sales_order_status

	from frappe.utils import cint, flt
	update_modified= False
	for row in exp_entries:
		per_ref_doc = frappe.get_doc("Payment Entry Reference", row.per_ref)
		si_proforma_invoice = frappe.db.get_value("Sales Invoice Item",{"parent":per_ref_doc.reference_name, "idx":1, "docstatus":1},"proforma_invoice")
		if si_proforma_invoice and frappe.db.exists("Proforma Invoice",si_proforma_invoice) and cint(frappe.db.get_value("Proforma Invoice",si_proforma_invoice,"docstatus")) == 1:
			if per_ref_doc.proforma_invoice != si_proforma_invoice:
				print(row.si)
				per_ref_doc.db_set("proforma_invoice", si_proforma_invoice, update_modified=update_modified)
				doc = frappe.get_doc("Proforma Invoice",per_ref_doc.proforma_invoice)
				
				doc.db_set("advance_paid",doc.advance_paid + per_ref_doc.allocated_amount, update_modified=False)
				if flt(doc.advance_paid) == flt(doc.payment_due_amount) or (flt(doc.advance_paid) > flt(doc.payment_due_amount) and doc.allow_over_billing_payment):
					doc.db_set('status','Paid', update_modified= update_modified)
				elif flt(doc.advance_paid) > 0:
					doc.db_set('status','Partially Paid', update_modified= update_modified)
				else:
					doc.db_set('status','Unpaid', update_modified= update_modified)
				if doc.status not in ["Unpaid", "Partially Paid"]:
					change_sales_order_status(frappe.get_doc("Sales Order",doc.items[0].sales_order), update_modified= update_modified)
