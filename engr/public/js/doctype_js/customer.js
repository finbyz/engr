frappe.ui.form.on('Customer', {
    get_item_groups: function(frm) {
        
            frappe.call({
                method: "engr.engineering.doc_events.customer.get_item_group_list",
                args:{},
                callback: function(r){
                    if(r.message){
                        r.message.forEach(function(e){
                            var row = frm.add_child('customer_potential');
                            row.item_group=e.name;
                        })
                        frm.refresh_field("customer_potential");
                    }

                }
            })
	},

})