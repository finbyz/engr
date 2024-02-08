import frappe
from frappe import _
from hrms.payroll.doctype.payroll_entry.payroll_entry import PayrollEntry
import erpnext
from erpnext.accounts.doctype.accounting_dimension.accounting_dimension import (
	get_accounting_dimensions
)

class CustomPayrollEntry(PayrollEntry):
	def make_accrual_jv_entry(self):
		self.check_permission("write")
		process_payroll_accounting_entry_based_on_employee = frappe.db.get_single_value(
			"Payroll Settings", "process_payroll_accounting_entry_based_on_employee"
		)
		self.employee_based_payroll_payable_entries = {}
		self._advance_deduction_entries = []

		earnings = (
			self.get_salary_component_total(
				component_type="earnings",
				process_payroll_accounting_entry_based_on_employee=process_payroll_accounting_entry_based_on_employee,
			)
			or {}
		)

		deductions = (
			self.get_salary_component_total(
				component_type="deductions",
				process_payroll_accounting_entry_based_on_employee=process_payroll_accounting_entry_based_on_employee,
			)
			or {}
		)

		payroll_payable_account = self.payroll_payable_account
		jv_name = ""
		precision = frappe.get_precision("Journal Entry Account", "debit_in_account_currency")

		if earnings or deductions:
			journal_entry = frappe.new_doc("Journal Entry")
			journal_entry.voucher_type = "Journal Entry"
			journal_entry.user_remark = _("Accrual Journal Entry for salaries from {0} to {1}").format(
				self.start_date, self.end_date
			)
			journal_entry.company = self.company
			journal_entry.posting_date = self.posting_date
			journal_entry.branch = self.branch
			accounting_dimensions = get_accounting_dimensions() or []

			accounts = []
			currencies = []
			payable_amount = 0
			multi_currency = 0
			company_currency = erpnext.get_company_currency(self.company)

			# Earnings
			for acc_cc, amount in earnings.items():
				payable_amount = self.get_accounting_entries_and_payable_amount(
					acc_cc[0],
					acc_cc[1] or self.cost_center,
					amount,
					currencies,
					company_currency,
					payable_amount,
					accounting_dimensions,
					precision,
					entry_type="debit",
					accounts=accounts,
				)

			# Deductions
			for acc_cc, amount in deductions.items():
				payable_amount = self.get_accounting_entries_and_payable_amount(
					acc_cc[0],
					acc_cc[1] or self.cost_center,
					amount,
					currencies,
					company_currency,
					payable_amount,
					accounting_dimensions,
					precision,
					entry_type="credit",
					accounts=accounts,
				)

			payable_amount = self.set_accounting_entries_for_advance_deductions(
				accounts,
				currencies,
				company_currency,
				accounting_dimensions,
				precision,
				payable_amount,
			)

			# Payable amount
			if process_payroll_accounting_entry_based_on_employee:
				"""
				employee_based_payroll_payable_entries = {
				        'HR-EMP-00004': {
				                        'earnings': 83332.0,
				                        'deductions': 2000.0
				                },
				        'HR-EMP-00005': {
				                'earnings': 50000.0,
				                'deductions': 2000.0
				        }
				}
				"""
				for employee, employee_details in self.employee_based_payroll_payable_entries.items():
					payable_amount = employee_details.get("earnings") - (employee_details.get("deductions") or 0)

					payable_amount = self.get_accounting_entries_and_payable_amount(
						payroll_payable_account,
						self.cost_center,
						payable_amount,
						currencies,
						company_currency,
						0,
						accounting_dimensions,
						precision,
						entry_type="payable",
						party=employee,
						accounts=accounts,
					)

			else:
				payable_amount = self.get_accounting_entries_and_payable_amount(
					payroll_payable_account,
					self.cost_center,
					payable_amount,
					currencies,
					company_currency,
					0,
					accounting_dimensions,
					precision,
					entry_type="payable",
					accounts=accounts,
				)

			journal_entry.set("accounts", accounts)
			if len(currencies) > 1:
				multi_currency = 1
			journal_entry.multi_currency = multi_currency
			journal_entry.title = payroll_payable_account
			journal_entry.save()

			try:
				journal_entry.submit()
				jv_name = journal_entry.name
				self.update_salary_slip_status(jv_name=jv_name)
			except Exception as e:
				if type(e) in (str, list, tuple):
					frappe.msgprint(e)
				raise

		return jv_name