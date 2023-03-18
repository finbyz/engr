frappe.ui.form.on('Supplier', {

    refresh:function(frm){
        frm.add_custom_button(__('Payment Reconciliation'), function(){
            window.open(window.location.href.split('app')[0] + "app/payment-reconciliation/Payment Reconciliation" + "/?" + "party_type=" + "Supplier" + "&" + "party=" + frm.doc.name)

        }, __("Create"));
    },
    
});