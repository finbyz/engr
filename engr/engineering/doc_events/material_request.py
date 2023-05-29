import frappe

def validate(self, method):
    update_customer(self)

def update_customer(self):
    for row in self.items:
        if row.get('sales_order'):
            self.customer = frappe.db.get_value("Sales Order", row.get('sales_order'), "customer")