frappe.ui.form.on('Additional Salary',{
    present_days_at_site: function(frm){
		
		if (frm.doc.present_days_at_site){
			frappe.db.get_value("Employee",frm.doc.employee,"site_allowances",function(r){
				let amount = (r.site_allowances * frm.doc.present_days_at_site)
				frm.set_value("amount", amount);
			})
           
            
			
		}
	},

});

