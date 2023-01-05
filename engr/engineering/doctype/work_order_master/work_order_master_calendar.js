frappe.views.calendar["Work Order Master"] = {
	field_map: {
		"start": "expected_date",
		"end": "expected_date",
		"id": "parent",
		"title": "job_id",
		"status": "workflow_state",
		"color": "color",
		"eventColor": "color"
	},
	get_events_method: "engr.engineering.doctype.work_order_master.work_order_master.get_events",
	get_css_class: function(data) {
		if(data.workflow_state =="Draft") {
			return "primary";
		} else if(data.workflow_state=="Approve by Accountant") {
			return "success";
		} else if(data.workflow_state=="Continue For Testing") {
			return "Info";
		} else if(data.workflow_state=="Test in Progress" && data.report_delivered) {
			return "Info";
		} else if(data.workflow_state=="Test in Progress" && data.report_delivered==0) {
			return "success";
		} else if(data.workflow_state=="Test Report Preparation") {
			return "Info";
		} else if(data.workflow_state=="Final Report Prepared") {
			return "warning";
		} else if(data.workflow_state=="Final Report Prepared") {
			return "warning";
		} else if(data.workflow_state=="Report Sent") {
			return "success";
		} else if(data.workflow_state=="Cancelled") {
			return "danger";
		}
	}
};
