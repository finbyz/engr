import frappe

def validate(self, method):
    update_customer(self)
    validate_mr_date(self)

def update_customer(self):
    for row in self.items:
        if row.get('sales_order'):
            self.customer = frappe.db.get_value("Sales Order", row.get('sales_order'), "customer")

def validate_mr_date(self):
    self.mr_date = self.transaction_date