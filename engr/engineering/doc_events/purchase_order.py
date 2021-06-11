from __future__ import unicode_literals

import frappe
from frappe import _
from frappe.utils import get_url_to_form

def validate(self,method):
	update_reqd_date(self)

def update_reqd_date(self,method=None):
	mr_list = [item.material_request for item in self.items]
	so_list = [item.sales_order for item in self.items]

	for mr in mr_list:
		if self.schedule_date != frappe.db.get_value("Material Request",mr,"schedule_date"):
			frappe.db.set_value("Material Request",mr,"schedule_date",self.schedule_date)


	for so in so_list:
		if self.schedule_date != frappe.db.get_value("Sales Order",so,"delivery_date"):
			frappe.db.set_value("Sales Order",so,"delivery_date",self.schedule_date)

@frappe.whitelist()
def get_last_5_transaction_details(name, item_code, supplier):
	data = frappe.db.sql("""
		SELECT poi.qty, poi.rate, po.transaction_date, po.company,po.name 
		FROM `tabPurchase Order Item` as poi JOIN `tabPurchase Order` as po on poi.parent=po.name 
		WHERE poi.name != '{}' and po.supplier = '{}' and poi.item_code = '{}' and po.docstatus = 1
		ORDER By po.transaction_date DESC LIMIT 5	
	""".format(name, supplier, item_code), as_dict = 1)

	table = """<table class="table table-bordered" style="margin: 0; font-size:80%;">
		<thead>
			<tr>
				<th>Purchase Order</th>
				<th>Company</th>
				<th>Date</th>
				<th>Qty</th>
				<th>Rate</th>

			<tr>
		</thead>
	<tbody>"""
	for i in data:
		table += f"""
			<tr>
				<td>{"<a href='{0}' target='_blank'>{1}</a>".format(get_url_to_form("Purchase Order",i.name),i.name)}</td>
				<td>{i.company}</td>
				<td>{frappe.format(i.transaction_date, {'fieldtype': 'Date'})}</td>
				<td>{i.qty}</td>
				<td>{i.rate}</td>
			</tr>
		"""
	
	table += """
	</tbody></table>
	"""
	return table