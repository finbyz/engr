cur_frm.fields_dict.set_target_warehouse.get_query = function (doc) {
	return {
		filters: {
			"company": doc.customer,
            "is_group":0,
		}
	}
};
frappe.ui.form.on('Sales Invoice', {
	refresh:function(frm){
	    frm.ignore_doctypes_on_cancel_all = ["Delivery Note"]
	},
	onload: function(frm) {
        frm.ignore_doctypes_on_cancel_all = ["Delivery Note","Work Order Master"]
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
    percentage:function(frm){
        if (frm.doc.percentage > 0 && frm.doc.percentage < 1){
            frm.doc.items.forEach(d=>{
                d.qty = frm.doc.percentage * d.so_quantity;
            })
            cur_frm.refresh_field("items")
        }
        else{
            frappe.throw("Enter Percentage Between 0 to 1")
        }
	},
    
})
frappe.ui.form.on("Sales Invoice Item", {
    item_code:function(frm,cdt,cdn){
        let d  = locals[cdt][cdn]
        frappe.model.get_value("Item",d.item_code,"stock_uom"),(r)=>{
            d.uom = r.stock_uom
        }
        
    } 
});