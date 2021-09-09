frappe.ui.form.on("Communication", {
    refresh: function(frm){
		if (frm.doc.reference_doctype !== "Issue") {
            frm.remove_custom_button("Issue", 'Create');
			frm.add_custom_button(__("Issue "), () => {
				frm.trigger('quick_entry');
			}, "Create");
		}
    },
    create_issue_from_communication: function(frm){
        // var doc = frappe.model.get_new_doc("Issue");
        // doc["subject"] = frm.doc.subject
        // doc["communication_medium"] = frm.doc.communication_medium
        // doc["raised_by"] = frm.doc.sender || ""
        // doc["raised_by_phone"] = frm.doc.phone_no || ""
        // //  frappe.ui.form.make_quick_entry("Issue",null,null,doc)
    },
	quick_entry: function(frm) {

		var dialog = new frappe.ui.Dialog({
			title: __("New Issue"),
			fields: [
				{fieldtype: "Data", fieldname: "subject", label: __("Subject"), default:frm.doc.subject,reqd: 1},
				{fieldtype: "Link", fieldname: "department", label: __("Department"), reqd: 1,
					options: "Department",
				},
				{fieldtype: "Link", fieldname: "user", label: __("User"), reqd: 0,
					options: "User",
				},
				{fieldtype: "Data", fieldname: "communication_medium", label: __("communication_medium"), reqd: 0,
					default: frm.doc.communication_medium,hidden:1},
				{fieldtype: "Data", fieldname: "raised_by", label: __("raised_by"), default: frm.doc.sender || "",hidden:1},
                {fieldtype: "Data", fieldname: "raised_by_phone", label: __("raised_by_phone"), default: frm.doc.phone_no || "",hidden:1},
                {fieldtype: "Data", fieldname: "communication", label: __("communication"), default: frm.doc.name,hidden:1},

			]
		});

		dialog.set_primary_action(__("Save"), function(frm) {
            var doc = frappe.model.get_new_doc("Issue")
			var values = dialog.get_values();

			doc["subject"] = values.subject;
			doc["department"] = values.department;
			doc["user"] = values.user;
            doc["communication_medium"] = values.communication_medium;
            doc["raised_by"] = values.raised_by;
            doc["raised_by_phone"] = values.raised_by_phone;
			// doc.save();
			frappe.call({
				method: "frappe.client.save",
				args: {
					doc: doc
				},
                callback: function(r){
                    cur_frm.set_value('reference_doctype', "Issue")
                    cur_frm.set_value('reference_name' ,r.message.name)
                    cur_frm.set_value('status' , "Linked")
                    cur_frm.save()
                    // cur_frm.reload_doc()
                }
            })
			dialog.hide();
		});

		dialog.show();
	},
})


