import frappe

def create_payment_entry(self, pe):
	payment = frappe.new_doc("Payment Entry")
	payment.posting_date = pe.transaction_date
	payment.payment_type = "Receive" if pe.party_type == "Customer" else "Pay"
	payment.mode_of_payment = "Wire Transfer"
	payment.party_type = pe.party_type
	payment.party = pe.party
	payment.branch =pe.branch
	payment.paid_to = self.bank_account if pe.party_type == "Customer" else self.payable_account
	payment.paid_from = self.receivable_account if pe.party_type == "Customer" else self.bank_account
	payment.paid_amount = payment.received_amount = abs(pe.amount)
	payment.reference_no = pe.description
	payment.reference_date = pe.transaction_date
	payment.save()
	for inv_entry in self.payment_invoice_items:
		if (pe.description != inv_entry.payment_description or pe.transaction_date != inv_entry.transaction_date): continue
		if (pe.party != inv_entry.party): continue
		reference = payment.append("references", {})
		reference.reference_doctype = inv_entry.invoice_type
		reference.reference_name = inv_entry.invoice
		reference.allocated_amount = inv_entry.allocated_amount
		print ("Adding invoice {0} {1}".format(reference.reference_name, reference.allocated_amount))
	payment.setup_party_account_field()
	payment.set_missing_values()
	#payment.set_exchange_rate()
	#payment.set_amounts()
	#print("Created payment entry {0}".format(payment.as_dict()))
	payment.save()
	return payment