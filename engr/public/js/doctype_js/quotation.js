frappe.ui.form.on('Quotation', {
    refresh: function(frm) {
        
        frm.add_custom_button(__('Work Order Master'), function(){
        frappe.model.open_mapped_doc({
            method: 'engr.engineering.doc_events.quotation.make_WOM',
            frm: frm,
        });
        }, __("Create"));
        
    },
});
cur_frm.fields_dict.project.get_query = function(doc) {
	return {
		filters: {
			"customer": doc.customer,
           

		}
	}
};
frappe.ui.form.on("Quotation Item", {
    item_code:function(frm,cdt,cdn){
        let d  = locals[cdt][cdn]
        frappe.model.get_value("Item",d.item_code,"stock_uom"),(r)=>{
            d.uom = r.stock_uom
        }
        
    } 
});
cur_frm.fields_dict.sales_order.get_query = function(doc) {
	return {
		filters: {
			"customer": doc.party_name,
            "docstatus":1
		}
	}
};