// Copyright (c) 2021, Finbyz Tech. Pvt. Ltd. and contributors
// For license information, please see license.txt
{% include 'engr/public/js/sales_common.js' %}

frappe.ui.form.on('Proforma Invoice', {
	onload: function(frm) {
		if (!frm.doc.transaction_date && frm.doc.docstatus ==0){
			frm.set_value('transaction_date', frappe.datetime.get_today())
		}
		if(frm.doc.company && frm.doc.docstatus==0){
			if (!frm.doc.bank_account){
				frappe.db.get_value("Bank Account",{"company":frm.doc.company,"is_company_account":1,"is_default":1},"name", function(r){
					frm.set_value("bank_account",r.name);
				})
			}
        }
	},
	refresh: function(frm){
		if(frm.doc.status != "Paid" && frm.doc.docstatus==1) {
			frm.add_custom_button(__('Payment'), () => frm.trigger('create_payment_entry'), __('Create'));
		}
		if(flt(frm.doc.per_billed, 6) < 100 && frm.doc.docstatus==1) {
			frm.add_custom_button(__('Sales Invoice'), () => frm.trigger('make_sales_invoice'), __('Create'));
		}
		frm.trigger('show_open_close_buttons');
	},
	show_open_close_buttons: function(frm){
		if (frm.doc.docstatus == 1){
			if (frm.doc.status == "Closed"){
				frm.add_custom_button(__('Open'), () => 
					// frm.doc.status = "Submitted",
					// frm.set_value("status", "Closed"),
					frm.call({
						method:"set_status",
						doc: frm.doc,
						args:{
							'status':"Submitted"
						},
						callback: function(r) {
							frm.reload_doc();
						}
				}), __('Set Status'));
			}
			else{
				frm.add_custom_button(__('Close'), () => 
				// frm.doc.status = "Closed",
					// frm.set_value("status", "Closed"),
					frm.call({
						method:"set_status",
						doc: frm.doc,
						args:{
							'status':"Closed"
						},
						callback: function(r) {
							frm.reload_doc();
						}
				}), __('Set Status'));
			}
		}
	},
	tc_name: function(frm){
		if(frm.doc.tc_name) {
			return frappe.call({
				method: 'erpnext.setup.doctype.terms_and_conditions.terms_and_conditions.get_terms_and_conditions',
				args: {
					template_name: frm.doc.tc_name,
					doc: frm.doc
				},
				callback: function(r) {
					frm.set_value("terms", r.message);
				}
			});
		}
	},
	company: function(frm){
		if(frm.doc.company){
			if (!frm.doc.bank_account){
				frappe.db.get_value("Bank Account",{"company":frm.doc.company,"is_company_account":1,"is_default":1},"name", function(r){
					frm.set_value("bank_account",r.name);
				})
			}
        }
	},

	payment_percentage: function(frm){
		if (frm.doc.payment_percentage){
			frm.set_value('payment_due_amount',flt(frm.doc.rounded_total) * flt(frm.doc.payment_percentage) / 100)
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
	create_payment_entry: function(frm){
		return frappe.call({
			method: "engr.engineering.doc_events.payment_entry.create_payment_entry",
			args: {
				"dt": "Sales Order",
				"dn": frm.doc.items[0].sales_order,
				"ref_dt":frm.doc.doctype,
				"ref_dn":frm.doc.name
			},
			callback: function(r) {
				var doclist = frappe.model.sync(r.message);
				frappe.set_route("Form", doclist[0].doctype, doclist[0].name);
			}
		});
	},
	make_sales_invoice: function(frm) {
		frappe.model.open_mapped_doc({
			method: "engr.engineering.doc_events.sales_invoice.make_sales_invoice",
			frm: frm
		})
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
