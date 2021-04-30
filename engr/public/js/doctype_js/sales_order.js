frappe.ui.form.on('Sales Order', {
    refresh: function(frm) {
            frm.add_custom_button(__('Proforma Invoice'),function() {frm.trigger('create_proforma_invoice')}, __('Create'));
	},
    create_proforma_invoice: function(frm){
        frappe.model.open_mapped_doc({
            method: "engr.engineering.doctype.proforma_invoice.proforma_invoice.create_proforma_invoice",
            frm: frm
        })
    }
})
frappe.ui.form.on('Sales Order Item', {
	last_5_transaction: function(frm, cdt, cdn){
		let d = locals[cdt][cdn];
		frappe.call({
			method: "engr.engineering.doc_events.sales_order.get_last_5_transaction_details",
			args: {
				name:d.name,
				item_code: d.item_code,
				customer: frm.doc.customer
			},
			callback: function (r) {
				frappe.msgprint({
					message: r.message,
					title: "Item Code : " + d.item_code + " And Customer : " + frm.doc.customer,
					wide: true,
				});
			}
		})
	}
});
frappe.ui.keys.on('ctrl+i', function(e) {
	const current_doc = $('.data-row.editable-row').parent().attr("data-name");
	const d = locals["Sales Order Item"][current_doc];
	frappe.call({
		method: "engr.engineering.doc_events.sales_order.get_last_5_transaction_details",
		args: {
			url:window.location.href.split("#")[0] + "#Form/Sales Order" + "/",
			name:d.name,
			item_code: d.item_code,
			customer: cur_frm.doc.customer
		},
		callback: function (r) {
			frappe.msgprint({
				message: r.message,
				title: "Item Code : " + d.item_code + " And Customer : " + cur_frm.doc.customer,
				wide: true,
			});
		}
	})
});
