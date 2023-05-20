frappe.ui.form.on('Purchase Receipt Item', {
    batch_no:function(frm,cdt,cdn){
        let d = locals[cdt][cdn];
        frappe.model.get_value('Batch' , d.batch , 'lot_no' , (r) =>{
            frappe.model.set_value(cdt,cdn , 'lot_no' , r.lot_no)
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
        // frappe.model.set_value(cdt,cdn,"qty", (d.stock_qty * d.reverse_conversion_factor))
        frappe.model.set_value(cdt,cdn,"reverse_conversion_factor", (d.qty / d.stock_qty))
		frappe.model.set_value(cdt,cdn,"conversion_factor", (d.qty / d.stock_qty))
    },
    reverse_conversion_factor : function(frm,cdt,cdn){
        let d = locals[cdt][cdn];
        frappe.model.set_value(cdt,cdn,"conversion_factor", (1 / d.reverse_conversion_factor))
    },
    accepted_nos:function(frm,cdt,cdn){
        let d = locals[cdt][cdn];
        frappe.model.set_value(cdt,cdn,"qty", (d.accepted_nos*d.reverse_conversion_factor))
    },
    rejected_nos:function(frm,cdt,cdn){
        let d = locals[cdt][cdn];
        frappe.model.set_value(cdt,cdn,"rejected_qty", (d.rejected_nos*d.reverse_conversion_factor))
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