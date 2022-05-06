frappe.ui.form.on('Customer', {
    refresh:function(frm){
        frm.add_custom_button(__('Task'), function(){
            frappe.model.open_mapped_doc({
                method: 'engr.engineering.doc_events.customer.create_task',
                frm: frm,
            });
        }, __("Create"));
    },
    refresh: function(frm) {
        frm.add_custom_button(__('Work Order Master'), function(frm){
          frappe.model.open_mapped_doc({
              method : "engr.engineering.doc_events.customer.make_WOM_from_customer",
              frm : cur_frm,
          })
      });
  
    },
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
frappe.ui.form.on('Customer', {
    
});
