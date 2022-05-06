// Copyright (c) 2022, Finbyz Tech. Pvt. Ltd. and contributors
// For license information, please see license.txt

frappe.ui.form.on('Work Order Master', {
    // job_id:function(frm){
    //     frm.set_value("name_of_report" , frm.doc.job_id);
    // },
    // onload: function(frm){
    
    // }
    customer_address: function(frm){
        if (frm.doc.customer_address) {
            return frappe.call({
                method: "frappe.contacts.doctype.address.address.get_address_display",
                args: {
                    "address_dict": frm.doc.customer_address
                },
                callback: function (r) {
                    console.log(r)
                    if (r.message){
                        frm.set_value("address", r.message);
                    }
                }
            });
        }
    }

    
    
});
cur_frm.fields_dict.customer_address.get_query = function(doc) {
	return {
		filters: {
			"address_title": doc.customer_name
		}
	}
}

