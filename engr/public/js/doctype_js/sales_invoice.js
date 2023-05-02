cur_frm.fields_dict.set_target_warehouse.get_query = function (doc) {
	return {
		filters: {
			"company": doc.customer,
            "is_group":0,
		}
	}
};
cur_frm.fields_dict.project.get_query = function (doc) {
	return {
		filters: {
			"customer":doc.customer
		}
	}
};
frappe.ui.form.on('Sales Invoice', {
	refresh:function(frm){
	    frm.ignore_doctypes_on_cancel_all = ["Delivery Note"]
	},
	onload: function(frm) {
        frm.ignore_doctypes_on_cancel_all = ["Delivery Note","Work Order Master"]
		if(frm.doc.company && frm.doc.docstatus == 0){
            if (!frm.doc.bank_account){
                frappe.db.get_value("Bank Account",{"company":frm.doc.company,"is_company_account":1,"is_default":1},"name", function(r){
                    frm.set_value("bank_account",r.name);
                })
            }
        }
       
        frm.set_query('project', function(doc) {
            return {
                filters: {
                    "customer":doc.customer
                }
            };
        });
        frm.set_query("work_order_master_ref", function(doc) {
            return {
                "filters": {
                    "branch": doc.branch
                    
                }
            };
        });    
        
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
        frm.doc.items.forEach(d=>{
            d.qty = (frm.doc.percentage/100) * (d.qty);
            // console.log(d.so_quantity)
        })
        cur_frm.refresh_field("items")
        
	},
    
})
frappe.ui.form.on("Sales Invoice Item", {
    item_code:function(frm,cdt,cdn){
        let d  = locals[cdt][cdn]
        frappe.model.get_value("Item",d.item_code,"stock_uom"),(r)=>{
            d.uom = r.stock_uom
        }
        
    },
    qty:function(frm,cdt,cdn){
        let d  = locals[cdt][cdn]
        if (d.uom == 'Percent'){
            let amount = (d.qty*d.rate)/100

            frappe.model.set_value(cdt,cdn,'amount',amount)
            
        }
        cur_frm.refresh_field("items")
    }
});