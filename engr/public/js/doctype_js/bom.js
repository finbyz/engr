frappe.ui.form.on("BOM", {
    after_save: function(frm){
        frm.trigger('update_cost')
    },
    update_grand_total_cost: function (frm) {
        frappe.call({
            method: "engr.api.update_grand_total",
            
            args: {
                docname: frm.doc.name,
            },
            callback: function (r) {
                frm.reload_doc();
            }
        });
    },
    update_cost: function(frm) {
        return frappe.call({
            doc: frm.doc,
            method: "update_cost",
            args: {
                update_parent: true,
                from_child_bom:false,
                save: true
            },
            callback: function(r) {
                frm.reload_doc();
                frm.events.update_grand_total_cost(frm)		
            }
        });
    },
});