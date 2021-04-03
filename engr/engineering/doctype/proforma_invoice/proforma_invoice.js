// Copyright (c) 2021, Finbyz Tech. Pvt. Ltd. and contributors
// For license information, please see license.txt
{% include 'engr/public/js/sales_common.js' %}

frappe.ui.form.on('Proforma Invoice', {
	payment_percentage: function(frm){
		if (frm.doc.payment_percentage){
			frm.set_value('payment_due_amount',flt(frm.doc.grand_total) * frm.doc.payment_percentage / 100)
			frm.doc.items.forEach(function(row){
				frappe.model.set_value(row.doctype,row.name,'payment_amount',flt(row.net_amount) * frm.doc.payment_percentage / 100)
			})
		}
	},
	validate: function(frm){
		frm.trigger('payment_percentage')
		frm.doc.items.forEach(function (d){
			d.warehouse = ""
		})
	},
	setup: function(frm) {
		frm.add_fetch('customer', 'tax_id', 'tax_id');

		// formatter for material request item
		frm.set_indicator_formatter('item_code',
			function(doc) { return (doc.stock_qty<=doc.delivered_qty) ? "green" : "orange" })

		frm.set_query('company_address', function(doc) {
			if(!doc.company) {
				frappe.throw(__('Please set Company'));
			}

			return {
				query: 'frappe.contacts.doctype.address.address.address_query',
				filters: {
					link_doctype: 'Company',
					link_name: doc.company
				}
			};
		})
	},
	onload: function(frm) {
		if (!frm.doc.transaction_date){
			frm.set_value('transaction_date', frappe.datetime.get_today())
		}
	},
});

erpnext.selling.SalesOrderController = erpnext.selling.SellingController.extend({
	onload: function(doc, dt, dn) {
		this._super();
	},

	refresh: function(doc, dt, dn) {
		var me = this;
		this._super();
		let allow_delivery = false;
	},

});
$.extend(cur_frm.cscript, new erpnext.selling.SalesOrderController({frm: cur_frm}));
