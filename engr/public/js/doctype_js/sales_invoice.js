frappe.ui.form.on('Sales Invoice', {
	refresh:function(frm){
	    frm.ignore_doctypes_on_cancel_all = ["Delivery Note"]
	},
	onload: function(frm) {
        frm.ignore_doctypes_on_cancel_all = ["Delivery Note"]
		if(frm.doc.company){
            if (!frm.doc.bank_account){
                frappe.db.get_value("Bank Account",{"company":frm.doc.company,"is_company_account":1,"is_default":1},"name", function(r){
                    frm.set_value("bank_account",r.name);
                })
            }
        }
	},
    company: function(frm) {
		if(frm.doc.company){
            if (!frm.doc.bank_account){
                frappe.db.get_value("Bank Account",{"company":frm.doc.company,"is_company_account":1,"is_default":1},"name", function(r){
                    frm.set_value("bank_account",r.name);
                })
            }
        }
	},
})
// cur_frm.fields_dict.set_target_warehouse.get_query = function (doc) {
// 	return {
// 		filters: {
// 			"company": doc.customer,
//             "is_group":0,
// 		}
// 	}
// };