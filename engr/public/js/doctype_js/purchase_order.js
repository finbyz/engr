frappe.ui.form.on('Purchase Order', {
	// refresh:function(frm) {
	// 	cur_frm.fields_dict.set_supplier_warehouse.get_query = function(doc) {
	// 		return {
	// 			filters: {
	// 				"company":['in',doc.supplier],
	// 				"is_group": 0
	// 			}
	// 		}
	// 	};
	// },
	billing_address: function(frm) {
    if(frm.doc.billing_address) {
        frappe.call({
            method: "frappe.contacts.doctype.address.address.get_address_display",
			
            args: {"address_dict": frm.doc.billing_address },
            callback: function(r) {
                if(r.message) {
                    me.frm.set_value("billing_address_display", r.message)
                }
            }
        })
		} else {
			this.frm.set_value("billing_address_display", "");
		}
	},
});
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
	},
	item_code : function(frm,cdt,cdn) {
	    get_conversion_factor(frm,cdt,cdn)
    },
    uom : function(frm,cdt,cdn) {
        get_conversion_factor(frm,cdt,cdn)
    },   
    stock_qty : function(frm,cdt,cdn){
        let d = locals[cdt][cdn];
        // frappe.model.set_value(cdt,cdn,"qty", Math.round(d.stock_qty * d.reverse_conversion_factor))
		frappe.model.set_value(cdt,cdn,"reverse_conversion_factor", (d.qty / d.stock_qty))
		frappe.model.set_value(cdt,cdn,"conversion_factor", (d.qty / d.stock_qty))
    },
    reverse_conversion_factor : function(frm,cdt,cdn){
        let d = locals[cdt][cdn];
        frappe.model.set_value(cdt,cdn,"conversion_factor", (1 / d.reverse_conversion_factor))
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
function get_conversion_factor(frm,cdt,cdn){
    let d = locals[cdt][cdn];
    setTimeout(()=>{
        if(d.item_code && d.uom){
            frappe.call({
                method: "engr.api.get_conversion_factor",
                args: { item_code: d.item_code, uom: d.uom },
                callback: (r) => {
                    frappe.model.set_value(cdt,cdn,"conversion_factor", r.message.conversion_factor)
                    frappe.model.set_value(cdt,cdn,"reverse_conversion_factor", r.message.reverse_conversion_factor)
                }
            })
        }
	}, 400);
}