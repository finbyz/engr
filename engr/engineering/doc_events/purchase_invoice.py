import frappe

def before_validate(self, method):
    set_stock_qty(self)

def set_stock_qty(self):
	for row in self.items:
		if row.qty and row.stock_qty:
			frappe.db.set_value("Purchases Invoice Item", row.name, "stock_qty", round(row.stock_qty / row.qty, 0))