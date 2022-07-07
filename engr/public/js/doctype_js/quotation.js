cur_frm.set_query('company_address_name', function(doc) {
    if(!doc.company) {
        frappe.throw(__('Please set Company'));
    }

    return {
        query: 'frappe.contacts.doctype.address.address.address_query',
        filters: {
            link_doctype: 'Company',
            link_name: doc.company
        }
    };
});
frappe.ui.form.on('Quotation', {
	company_address_name: function(frm){
        if(frm.doc.company_address_name) {
			frappe.call({
				method: "frappe.contacts.doctype.address.address.get_address_display",
				args: {"address_dict": frm.doc.company_address_name },
				callback: function(r) {
					if(r.message) {
						frm.set_value("company_address_display", r.message)
					}
				}
			})
		} else {
			frm.set_value("company_address_display", "");
		}
    },
    party_name: function(frm){
        if (frm.doc.company) {
            frappe.call({
                method: "erpnext.setup.doctype.company.company.get_default_company_address",
                args: {name:frm.doc.company, existing_address: frm.doc.company_address || ""},
                debounce: 2000,
                callback: function(r){
                    if (r.message){
                        frm.set_value("company_address_name",r.message)
                    }
                    else {
                        frm.set_value("company_address_name","")
                    }
                }
            })
        }
    },
	branch: function(frm){
		if(frm.doc.branch){
			frm.doc.items.forEach((d)=>{
				frappe.model.set_value(d.doctype , d.name , "branch" ,frm.doc.branch)
			})
		}
	},
	before_save: function (frm) {
		if(frm.doc.branch){
			frm.doc.items.forEach((d)=>{
				frappe.model.set_value(d.doctype , d.name , "branch" ,frm.doc.branch)
			})
		}
	}
})
frappe.ui.form.on('Quotation Item', {
	item_code: function(frm, cdt, cdn){
		let d = locals[cdt][cdn];
		if(d.item_code){
			frappe.call({
				method: "engr.engineering.doc_events.quotation.get_tech_specs",
				args: {
					item_code: d.item_code
				},
				callback: function (r) {
					frappe.model.set_value(cdt,cdn,"technical_specifications",r.message);
				}
			})
			frappe.model.get_value("Item", d.item_code, "item_type_details",(r)=>{
				if(r.item_type_details){
					frappe.model.set_value(cdt, cdn, "item_type_details",r.item_type_details)
				}
			})
		}		
	}
});