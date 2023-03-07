import frappe
from frappe import _
from frappe.utils import flt, nowdate
from frappe import _, scrub
from erpnext.accounts.doctype.accounting_dimension.accounting_dimension import get_accounting_dimensions
from erpnext.accounts.doctype.opening_invoice_creation_tool.opening_invoice_creation_tool import OpeningInvoiceCreationTool

class CustomOpeningInvoiceCreationTool(OpeningInvoiceCreationTool):
    @frappe.whitelist()
    def make_invoices(self):
        names = []
        mandatory_error_msg = _("Row {0}: {1} is required to create the Opening {2} Invoices")
        if not self.company:
            frappe.throw(_("Please select the Company"))

        for row in self.invoices:
            if not row.qty:
                row.qty = 1.0

            # always mandatory fields for the invoices
            if not row.temporary_opening_account:
                row.temporary_opening_account = get_temporary_opening_account(self.company)
            row.party_type = "Customer" if self.invoice_type == "Sales" else "Supplier"

            # Allow to create invoice even if no party present in customer or supplier.
            if not frappe.db.exists(row.party_type, row.party):
                if self.create_missing_party:
                    self.add_party(row.party_type, row.party)
                else:
                    frappe.throw(_("{0} {1} does not exist.").format(frappe.bold(row.party_type), frappe.bold(row.party)))

            if not row.item_name:
                row.item_name = _("Opening Invoice Item")
            if not row.posting_date:
                row.posting_date = nowdate()
            if not row.due_date:
                row.due_date = nowdate()

            for d in ("Party", "Outstanding Amount", "Temporary Opening Account"):
                if not row.get(scrub(d)):
                    frappe.throw(mandatory_error_msg.format(row.idx, _(d), self.invoice_type))

            args = self.get_invoice_dict(row=row)
            if not args:
                continue

            #finbyz
            accounting_dimension = get_accounting_dimensions()
            dimension_dict = frappe._dict()
            for dimension in accounting_dimension:
                dimension_dict[row.idx] = [dimension, row.get(dimension) or self.get(dimension)]

            try:
                dimension_name = dimension_dict.get(row.idx)[0]
                dimension_value = dimension_dict.get(row.idx)[1]
                
            except:
                dimension_name = None
                dimension_value = None
            #finbyz
            if row.outstanding_amount < 0:
                doc = frappe.new_doc("Journal Entry")
                doc.voucher_type = "Credit Note" if self.invoice_type == 'Sales' else "Debit Note"
                doc.posting_date = row.posting_date
                doc.company = self.company
                doc.is_opening = 'Yes'
                if row.exchange_rate:
                    doc.multi_currency = 1
                if self.invoice_type == 'Sales':
                    doc.append('accounts', {
                        'account': row.account or frappe.get_value("Company", doc.company, 'default_receivable_account'),
                        'party_type': 'Customer',
                        'party': row.party,
                        'debit_in_account_currency': 0,
                        'credit_in_account_currency': abs(row.outstanding_amount),
                        'is_advance': 'Yes',
                        "cost_center":row.cost_center,
                        "exchange_rate":row.exchange_rate or 1,
                        dimension_name: dimension_value#finbyz
                    })

                    doc.append('accounts', {
                        'account': row.temporary_opening_account,
                        'party_type': None,
                        'party': None,
                        'debit_in_account_currency': abs(row.outstanding_amount) * (row.exchange_rate or 1),
                        'credit_in_account_currency': 0,
                        "cost_center":row.cost_center,
                        dimension_name: dimension_value#finbyz
                    })
                
                elif self.invoice_type == 'Purchase':
                    doc.append('accounts', {
                        'account': row.account or frappe.get_value("Company", doc.company, 'default_payable_account'),
                        'party_type': 'Supplier',
                        'party': row.party,
                        'debit_in_account_currency': abs(row.outstanding_amount),
                        'credit_in_account_currency': 0,
                        'is_advance': 'Yes',
                        "cost_center":row.cost_center,
                        "exchange_rate":row.exchange_rate or 1,
                        dimension_name: dimension_value#finbyz
                    })

                    doc.append('accounts', {
                        'account': row.temporary_opening_account,
                        'party_type': None,
                        'party': None,
                        'debit_in_account_currency': 0,
                        'credit_in_account_currency': abs(row.outstanding_amount) * (row.exchange_rate or 1),
                        "cost_center":row.cost_center,
                        dimension_name: dimension_value#finbyz
                    })

                doc.save()
                doc.submit()
                names.append(doc.name)
            elif row.outstanding_amount > 0:
                if dimension_name and dimension_value:#finbyz
                    args[dimension_name] = dimension_value#finbyz
                doc = frappe.get_doc(args).insert(set_name=args.get('invoice_number',None))
                doc.submit()
                names.append(doc.name)

            if len(self.invoices) > 5:
                frappe.publish_realtime(
                    "progress", dict(
                        progress=[row.idx, len(self.invoices)],
                        title=_('Creating {0}').format(doc.doctype)
                    ),
                    user=frappe.session.user
                )

        return names

    @frappe.whitelist()
    def get_invoice_dict(self, row=None):
        def get_item_dict():
            default_uom = frappe.db.get_single_value("Stock Settings", "stock_uom") or _("Nos")
            cost_center = row.get('cost_center') or frappe.get_cached_value('Company',
                self.company,  "cost_center")

            if not cost_center:
                frappe.throw(
                    _("Please set the Default Cost Center in {0} company.").format(frappe.bold(self.company))
                )
            income_expense_account_field = ("income_account" if row.party_type == "Customer" else "expense_account")
            row.outstanding_amount = flt(row.outstanding_amount)
            row.qty = flt(row.qty)
            rate = flt(row.outstanding_amount) / flt(row.qty)

            item_dict = frappe._dict({
                "uom": default_uom,
                "rate": rate or 0.0,
                "qty": row.qty,
                "price":rate or 0.0,
                "quantity":row.qty,
                "conversion_factor": 1.0,
                "item_name": row.item_name or "Opening Invoice Item",
                "description": row.item_name or "Opening Invoice Item",
                income_expense_account_field: row.temporary_opening_account,
                "cost_center": cost_center
            })
            for dimension in get_accounting_dimensions():
                item_dict.update({dimension: row.get(dimension)})

            return item_dict

        if not row:
            return None

        party_type = "Customer"
        income_expense_account_field = "income_account"
        account_field = "debit_to"
        if self.invoice_type == "Purchase":
            party_type = "Supplier"
            income_expense_account_field = "expense_account"
            account_field = "credit_to"

        item = get_item_dict()

        args = frappe._dict({
            "items": [item],
            "is_opening": "Yes",
            "set_posting_time": 1,
            "company": self.company,
            "cost_center": self.cost_center,
            "due_date": row.due_date,
            "posting_date": row.posting_date,
            frappe.scrub(party_type): row.party,
            "is_pos": 0,
            "doctype": "Sales Invoice" if self.invoice_type == "Sales" else "Purchase Invoice",
            "update_stock": 0,
            "invoice_number": row.invoice_number,
            "disable_rounded_total": 1,
            "currency": row.currency or frappe.get_cached_value('Company',  self.company,  "default_currency"),
            "conversion_rate": row.exchange_rate,
            account_field: row.account
        })


        accounting_dimension = get_accounting_dimensions()#finbyz

        for dimension in accounting_dimension:#finbyz
            args.update({
                dimension: item.get(dimension) or self.get(dimension)
        })#finbyz
        if self.invoice_type == "Sales":
            args["is_pos"] = 0
        # 	args['invoice_no'] = row.invoice_no
        # else:
        # 	args['bill_no'] = row.invoice_no

        return args