frappe.listview_settings['Proforma Invoice'] = {
	add_fields: [],
	get_indicator: function(doc) {
		var status_color = {
            "Draft":"red",
			"Unpaid": "orange",
			"Paid": "green",
			"Half Paid": "orange",
            "Submitted":"blue"
		};
		return [__(doc.status), status_color[doc.status], "status,=,"+doc.status];
	},
};