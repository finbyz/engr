frappe.ui.form.on('Payment Entry', {
	before_save:function(frm) {
        frm.trigger('posting_date');
        frm.trigger('source_exchange_rate');
     }});