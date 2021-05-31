// Copyright (c) 2016, Finbyz Tech. Pvt. Ltd. and contributors
// For license information, please see license.txt
/* eslint-disable */

frappe.query_reports["Target VS Potential"] = {
	"filters": [
		{
		"fieldname":"customer",
            "label": __("Customer"),
            "fieldtype": "Link",
            "options": "Customer",
            "default": frappe.defaults.get_user_default("customer")
		},
		{
			"fieldname":"item_group",
				"label": __("Item Group"),
				"fieldtype": "Link",
				"options": "Item Group",
				"default": frappe.defaults.get_user_default("customer")
		},
	],
	// "formatter":function (row, cell, value, columnDef, dataContext, default_formatter) {
    //     value = default_formatter(row, cell, value, columnDef, dataContext);
    //    if (columnDef.id != "Customer" && columnDef.id != "Payment Date" && dataContext["Rental Payment"] < 100) {
    //         value = "<span style='color:red!important;font-weight:bold'>" + value + "</span>";
    //    }
    //    if (columnDef.id != "Customer" && columnDef.id != "Payment Date" && dataContext["Rental Payment"] > 100) {
    //         value = "<span style='color:green!important;font-weight:bold'>" + value + "</span>";
    //    }
    //    return value;
    // }

};
