frappe.listview_settings['Proforma Invoice'] = {
	add_fields: [],
	get_indicator: function(doc) {
		var status_color = {
            "Draft":"red",
			"Unpaid": "orange",
			"Paid": "green",
			"Partially Paid": "orange",
            "Submitted":"blue",
			"Cancelled":"red",
			"Closed":"green"
		};
		return [__(doc.status), status_color[doc.status], "status,=,"+doc.status];
	},
};