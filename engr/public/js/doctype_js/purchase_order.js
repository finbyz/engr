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
frappe.ui.keys.on('ctrl+i', function(e) {
	const current_doc = $('.data-row.editable-row').parent().attr("data-name");
	const d = locals["Purchase Order Item"][current_doc];
	frappe.call({
		method: "engr.engineering.doc_events.purchase_order.get_last_5_transaction_details",
		args: {
			url:window.location.href.split("#")[0] + "#Form/Purchase Order" + "/",
			name:d.name,
			item_code: d.item_code,
			supplier: cur_frm.doc.supplier
		},
		callback: function (r) {
			frappe.msgprint({
				message: r.message,
				title: "Item Code : " + d.item_code + " And Supplier : " + cur_frm.doc.supplier,
				wide: true,
			});
		}
	})
});