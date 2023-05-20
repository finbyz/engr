cur_frm.fields_dict.supplier_address_name.get_query = function(doc) {
	return {
		filters: {
			"link_doctype" :"Supplier",
            "link_name":doc.party
		}
	}
};
cur_frm.fields_dict.customer_address_name.get_query = function(doc) {
	return {
		filters: {
			"link_doctype" :"Customer",
            "link_name":doc.party
		}
	}
};
frappe.ui.form.on("Stock Entry", {
    supplier_address_name: function(frm) {
        if(frm.doc.supplier_address_name) {
            
        } else {
            frm.set_value("party_address", "");
        }
    },
    party_type: function(frm){
        frm.set_value('party','')
        frm.set_value('customer_address_name','')
        frm.set_value('supplier_address_name','')
        frm.set_value('party_address','')
    },
    party: function(frm){
        if(frm.doc.party_type && frm.doc.party){
            frappe.call({
                method:"erpnext.accounts.party.get_party_details",
                args:{
                    party: frm.doc.party,
                    party_type: frm.doc.party_type
                },
                callback: function(r){
                    if(r.message){
                        var adrr = frappe.scrub(frm.doc.party_type) + "_address"
                        if(frm.doc.party_type == "Supplier"){
                            frm.set_value("supplier_address_name", r.message[adrr])
                        }else{
                            frm.set_value("customer_address_name", r.message[adrr])
                        }
                        if(frm.doc.address != r.message[adrr]){
                            frappe.call({
                                method: "frappe.contacts.doctype.address.address.get_address_display",
                                args: {"address_dict": r.message[adrr] },
                                callback: function(res) {
                                    if(r.message) {
                                        frm.set_value("party_address", res.message)
                                    }
                                }
                            })
                        }
                    }
                }
            })
        }
    }
});
frappe.ui.form.on('Stock Entry Detail', {
    batch_no:function(frm,cdt,cdn){
        let d = locals[cdt][cdn];
        frappe.model.get_value('Batch' , d.batch , 'lot_no' , (r) =>{
            frappe.model.set_value(cdt,cdn , 'lot_no' , r.lot_no)
        })
    }
})