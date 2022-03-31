import frappe

def before_validate(self, method):
    set_conversion_fact(self)

def set_conversion_fact(self):
	for row in self.items:
		if row.qty and row.stock_qty:
			frappe.db.set_value("Purchases Receipt Item", row.name, "conversion_factor", (row.stock_qty / row.qty))