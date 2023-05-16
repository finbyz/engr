// Copyright (c) 2022, Finbyz Tech. Pvt. Ltd. and contributors
// For license information, please see license.txt

frappe.ui.form.on('Work Order Master', {
    refresh: function(frm) {
        // if(!frm.doc.__islocal) {
        //     frm.remove_custom_button('Sales Invoice', 'Create');
        //     frm.add_custom_button(__('Sales Invoice'), function(){
        //         frappe.model.open_mapped_doc({
        //             method: 'engr.engineering.doctype.work_order_master.work_order_master.make_sales_invoice',
        //             frm: frm,
        //         });
        //     }, __("Create"));
        // };
        // // if(frappe.perm.has_perm("Proforma Invoice", 0, "read"))  {
        //     if(!frm.doc.__islocal) {
        //         frm.remove_custom_button('Proforma Invoice', 'Create');
        //         frm.add_custom_button(__('Proforma Invoice'), function(){
        //             frappe.model.open_mapped_doc({
        //                 method: 'engr.engineering.doctype.work_order_master.work_order_master.make_proforma_invoice',
        //                 frm: frm,
        //             });
        //         }, __("Create"));
        //     };
        // if(frappe.perm.has_perm("Sales Order", 0, "read")) {
            if(!frm.doc.__islocal && !frm.doc.sales_order) {
                frm.remove_custom_button('Sales Order', 'Create');
                frm.add_custom_button(__('Sales Order'), function(){
                    frappe.model.open_mapped_doc({
                        method: 'engr.engineering.doctype.work_order_master.work_order_master.make_sales_order',
                        frm: frm,
                    });
                }, __("Create"));
        }
    },
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
           "link_doctype":"Customer",
           "link_name" : doc.customer_name
        }
    }
}

frappe.ui.form.on('Work Order Master Item', {
    item_code:function(frm,cdt,cdn){
        var item = locals[cdt][cdn];
		if(item.item_code) {
            frappe.model.get_value("Item", item.item_code, ["sample_details","remark_"],(r)=>{
                frappe.model.set_value(item.doctype, item.name, "test_method", r.remark_);
                frappe.model.set_value(item.doctype, item.name, "sample_provided",r.sample_details)
            })
		}
    }
});
cur_frm.fields_dict.project.get_query = function(doc) {
	return {
		filters: {
			"customer": doc.customer_name
		}
	}
};
