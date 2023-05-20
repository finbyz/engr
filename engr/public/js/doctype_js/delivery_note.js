frappe.ui.form.on('Delivery Note', {
	refresh:function(frm) {
		// cur_frm.fields_dict.set_target_warehouse.get_query = function(doc) {
		// 	return {
		// 		filters: {
		// 			"company":['in',doc.customer],
		// 			"is_group": 0
		// 		}
		// 	}
		// };
		// cur_frm.fields_dict.target_warehouse.get_query = function(doc) {
		// 	return {
		// 		filters: {
		// 			"company":['in',doc.customer],
		// 			"is_group": 0
		// 		}
		// 	}
		// };
	},
    billing_address: function(frm) {
    if(frm.doc.shipping_address_name) {
        frappe.call({
            method: "frappe.contacts.doctype.address.address.get_address_display",
			
            args: {"address_dict": frm.doc.shipping_address_name},
            callback: function(r) {
                if(r.message) {
                    me.frm.set_value("shipping_address", r.message)
                }
            }
        })
		} else {
			this.frm.set_value("shipping_address", "");
		}
	},
});
frappe.ui.form.on('Delivery Note Item', {
	batch_no:function(frm,cdt,cdn){
        let d = locals[cdt][cdn];
        frappe.model.get_value('Batch' , d.batch , 'lot_no' , (r) =>{
            frappe.model.set_value(cdt,cdn , 'lot_no' , r.lot_no)
        })
    }
})