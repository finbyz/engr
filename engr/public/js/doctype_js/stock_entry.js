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
            frappe.call({
                method: "frappe.contacts.doctype.address.address.get_address_display",
                args: {"address_dict": frm.doc.supplier_address_name },
                callback: function(r) {
                    if(r.message) {
                        frm.set_value("party_address", r.message)
                    }
                }
            })
        } else {
            frm.set_value("party_address", "");
        }
    },
    customer_address_name: function(frm) {
        if(frm.doc.customer_address_name) {
            frappe.call({
                method: "frappe.contacts.doctype.address.address.get_address_display",
                args: {"address_dict": frm.doc.customer_address_name },
                callback: function(r) {
                    if(r.message) {
                        frm.set_value("party_address", r.message)
                    }
                }
            })
        } else {
            frm.set_value("party_address", "");
        }
    },
});