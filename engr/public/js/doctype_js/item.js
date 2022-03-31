frappe.ui.form.on('UOM Conversion Detail', {
	reverse_conversion_factor: function(frm,cdt,cdn) {
	    let d = locals[cdt][cdn];
	    if (d.reverse_conversion_factor){
	        frappe.model.set_value(cdt,cdn,"conversion_factor", (1/d.reverse_conversion_factor))
	    }
	}
})