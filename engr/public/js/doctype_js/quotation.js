frappe.ui.form.on('Quotation', {
    refresh: function(frm) {
        frm.add_custom_button(__('Work Order Master'), function(){
        frappe.model.open_mapped_doc({
            method: 'engr.engineering.doc_events.quotation.make_WOM',
            frm: frm,
        });
        }, __("Create"));
    }
});
