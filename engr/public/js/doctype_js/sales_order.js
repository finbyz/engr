frappe.ui.form.on('Sales Order', {
    refresh: function(frm) {
            frm.add_custom_button(__('Create Proforma Invoice'),function() {frm.trigger('create_proforma_invoice')}, __('Create'));
	},
    create_proforma_invoice: function(frm){
        frappe.model.open_mapped_doc({
            method: "engr.engineering.doctype.proforma_invoice.proforma_invoice.create_proforma_invoice",
            frm: frm
        })
    }
})