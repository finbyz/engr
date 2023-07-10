frappe.ui.form.on("Proforma Invoice",{
    onload: function(frm){
        frm.ignore_doctypes_on_cancel_all = ['Sales Invoice'];
    
    }
})