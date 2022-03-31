frappe.ui.form.on('Quotation Item', {
	item_code: function(frm, cdt, cdn){
		let d = locals[cdt][cdn];
		if(d.item_code){
			frappe.call({
				method: "engr.engineering.doc_events.quotation.get_tech_specs",
				args: {
					item_code: d.item_code
				},
				callback: function (r) {
					frappe.model.set_value(cdt,cdn,"technical_specifications",r.message);
				}
			})
			frappe.model.get_value("Item", d.item_code, "item_type_details",(r)=>{
				if(r.item_type_details){
					frappe.model.set_value(cdt, cdn, "item_type_details",r.item_type_details)
				}
			})
		}		
	}
});