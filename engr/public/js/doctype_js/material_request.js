frappe.ui.form.on('Material Request Item', {
	item_code : function(frm,cdt,cdn) {
	    get_conversion_factor(frm,cdt,cdn)
    },
    uom : function(frm,cdt,cdn) {
        get_conversion_factor(frm,cdt,cdn)
    },   
    stock_qty : function(frm,cdt,cdn){
        let d = locals[cdt][cdn];
        // frappe.model.set_value(cdt,cdn,"qty", (d.stock_qty * d.reverse_conversion_factor))
        frappe.model.set_value(cdt,cdn,"reverse_conversion_factor", (d.qty / d.stock_qty))
		frappe.model.set_value(cdt,cdn,"conversion_factor", (d.qty / d.stock_qty))
    },
    reverse_conversion_factor : function(frm,cdt,cdn){
        let d = locals[cdt][cdn];
        frappe.model.set_value(cdt,cdn,"conversion_factor", (1 / d.reverse_conversion_factor))
    }
})
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