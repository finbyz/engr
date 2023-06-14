frappe.query_reports["Employee Analytics"] = {


	"filters": [
		{
			"fieldname":"company",
			"label": __("Company"),
			"fieldtype": "Link",
			"options": "Company",
			"default": frappe.defaults.get_user_default("Company"),
			"reqd": 1
		},
		{
			"fieldname":"parameter",
			"label": __("Parameter"),
			"fieldtype": "Select",
			"options": ["Branch","Grade","Department","Designation", "Employment Type"],
			"default": "Branch",
			"reqd": 1
		}
	]
};
