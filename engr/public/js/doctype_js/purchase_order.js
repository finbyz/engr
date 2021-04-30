frappe.ui.form.on('Purchase Order Item', {
	last_5_transaction: function(frm, cdt, cdn){
		let d = locals[cdt][cdn];
		frappe.call({
			method: "engr.engineering.doc_events.purchase_order.get_last_5_transaction_details",
			args: {
				name:d.name,
				item_code: d.item_code,
				supplier: frm.doc.supplier
			},
			callback: function (r) {
				frappe.msgprint({
					message: r.message,
					title: "Item Code : " + d.item_code + " And Supplier : " + frm.doc.supplier,
					wide: true,
				});
			}
		})
	}
});