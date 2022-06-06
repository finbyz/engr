cur_frm.fields_dict.parent_work_order.get_query = function(doc) {
	return {
		filters: {
            "status":['not in',["Stopped", "Cancelled", "Completed", "Closed"]]
        }
	}
};


//frappe.require("/assets/chemical/js/override_make_se.js");

erpnext.work_order.make_se = function(frm, purpose) {
	if(!frm.doc.skip_transfer){
		var max = (purpose === "Manufacture") ?
			flt(frm.doc.material_transferred_for_manufacturing) - flt(frm.doc.produced_qty) :
			flt(frm.doc.qty) - flt(frm.doc.material_transferred_for_manufacturing);
	} else {
		var max = flt(frm.doc.qty) - flt(frm.doc.produced_qty);
	}

	max = flt(max, precision("qty"));
	frappe.prompt({fieldtype:"Float", label: __("Qty for {0}", [purpose]), fieldname:"qty",
		description: __("Max: {0}", [max]), 'default': max },
		function(data) {
			frappe.call({
				method:"engr.engineering.doc_events.work_order.make_stock_entry",
				args: {
					"work_order_id": frm.doc.name,
					"purpose": purpose,
					"qty": data.qty
				},
				callback: function(r) {
					var doclist = frappe.model.sync(r.message);
					frappe.set_route("Form", doclist[0].doctype, doclist[0].name);
				}
			});
		}, __("Select Quantity"), __("Make"));
}


if(this.frm.doc.skip_transfer && !this.frm.doc.__islocal){
	this.frm.dashboard.add_transactions({
		'label': '',
		'items': ['Material Transfer Instruction']
	});
}
frappe.ui.form.on("Work Order", {
	onload: function(frm){
		frm.set_query("bom_no", function (doc) { 
                return {
                    filters: {
                        "item": doc.production_item,
                        'is_active': 1,
                        'docstatus': 1,
                        "company": doc.company
                    }
                }
        })
		if (frm.doc.__islocal){
			// if (frm.doc.bom_no)
			// {
			// 	frappe.db.get_value("BOM", frm.doc.bom_no, ["based_on", "batch_yield","is_multiple_item"], function (r) {
			// 		if (r) {
			// 			frm.set_value("based_on", r.based_on);
			// 			frm.set_value("batch_yield", r.batch_yield);
			// 			frm.set_value("is_multiple_item",r.is_multiple_item);
			// 		}
			// 	})
			// }
		}
		frm.trigger('set_source_warehouse')
	},
	refresh: function(frm){
		$(".form-inner-toolbar").find("button[data-label=Finish]").css({"float":"right"})
		if(frm.doc.status != 'Completed' && !frm.doc.skip_transfer && frm.doc.docstatus == 1){
			var transfer_btn = frm.add_custom_button(__('Transfer Material'), function() {
				erpnext.work_order.make_se(frm, 'Material Transfer for Manufacture');
			});
			transfer_btn.addClass('btn-primary');
		}
		$("button[data-label='Start']").css({ 'display': 'none' })

		if(frm.doc.skip_transfer && frm.doc.docstatus == 1 && frm.doc.status == "Not Started"){
			if (flt(frm.doc.material_transferred_for_instruction) < flt(frm.doc.qty)) {
				frm.has_start_btn = true;
				var start_btn = frm.add_custom_button(__('Start'), function() {
					frm.events.make_transfer(frm);
				});
				start_btn.addClass('btn-primary');
				frm.remove_custom_button('Finish');
				frm.remove_custom_button('Make Timesheet');
			}
		}

		if(frm.doc.status == "Closed" || frm.doc.status == "Completed"){
			frm.remove_custom_button('Finish');
		}

		if (frm.doc.based_on && frm.doc.based_on != "") {
			cur_frm.set_df_property('based_on_qty', 'label', "Required "+ cstr(frm.doc.based_on) + " Qty");
		}
		if(frm.doc.status == "In Process" && frm.doc.produced_qty < frm.doc.qty){

			frm.add_custom_button(__('Complete'), function() {
				frm.set_value("status","Completed")
	
			}, __("Status"));
		}
		frm.trigger('set_source_warehouse')
	},
	set_source_warehouse: function(frm){
		if (frm.doc.company){
			if (frappe.meta.get_docfield(frm.doc.doctype, "source_warehouse")){
				if (!frm.doc.source_warehouse){
					// frappe.db.get_value("Company",frm.doc.company,'default_raw_material_warehouse', function(r){
					// 	if (r.default_raw_material_warehouse){
					// 		frm.set_value('source_warehouse', r.default_raw_material_warehouse);
					// 	}
					// })
				}
			}
		}
	},
	qty: function(frm){
		frm.trigger('source_warehouse')
	},
	source_warehouse: function(frm){
		if (frappe.meta.get_docfield(frm.doc.doctype, "source_warehouse")){
			if (frm.doc.source_warehouse)
				{
					if(frm.doc.required_items){
						frm.doc.required_items.forEach(function (d){
							frappe.model.set_value(d.doctype,d.name,'source_warehouse',frm.doc.source_warehouse)
						});
					}
				}
		}
	},
	production_item: function(frm){
		//frm.trigger("add_finish_item");
	},
	before_save: function (frm) {
		if (frm.doc.volume) {
			cost = flt(frm.doc.volume * frm.doc.volume_rate);
			frm.set_value('volume_cost', cost);
		}
		// frm.trigger("add_finish_item")
	},
	bom_no: function (frm) {
		// frm.refresh_field("finish_item");
		// frappe.run_serially([
		// 	() => frappe.db.get_value("BOM", frm.doc.bom_no, ["based_on", "batch_yield","is_multiple_item"], function (r) {
		// 		if (r) {
		// 			frm.set_value("based_on", r.based_on);
		// 			frm.set_value("batch_yield", r.batch_yield);
		// 			frm.set_value("is_multiple_item",r.is_multiple_item);
		// 		}
		// 	}),
			//() => frm.trigger("add_finish_item"),
		// ]);
	},
	// add_finish_item: function(frm){
	// 	console.log(frm.doc.finish_item)
	// if (!frm.doc.finish_item || frm.doc.finish_item==undefined || frm.doc.finish_item.length==0)
	// {
	// 	console.log('called')
	// 	if(frm.doc.bom_no){
	// 		if(frm.doc.is_multiple_item){
	// 			frappe.model.with_doc("BOM", frm.doc.bom_no, function(){
	// 				let tabletransfer = frappe.get_doc("BOM", frm.doc.bom_no)
	// 				$.each(tabletransfer.multiple_finish_item, function(index, row){
	// 					let d = cur_frm.add_child("finish_item");
	// 					d.item_code = row.item_code;
	// 					d.bom_cost_ratio = row.cost_ratio;
	// 					d.bom_qty_ratio = row.qty_ratio;
	// 					d.bom_qty = cur_frm.doc.qty * d.bom_qty_ratio / 100 ;
	// 					d.bom_yield = row.batch_yield
	// 					frm.refresh_field("finish_item");
	// 				});
	// 			});
	// 		}
	// 		else{
	// 			frappe.model.with_doc("BOM", frm.doc.bom_no, function(){
	// 			let tabletransfer = frappe.get_doc("BOM", frm.doc.bom_no)
	// 			let d = cur_frm.add_child("finish_item");
	// 			d.item_code = tabletransfer.item
	// 			d.bom_cost_ratio = 100
	// 			d.bom_qty_ratio = 100
	// 			d.bom_qty = frm.doc.qty
	// 			d.bom_yield = tabletransfer.batch_yield
	// 			frm.refresh_field("finish_item");
	// 		});
	// 		}
	// 	}
	// }
	// },
	// based_on: function (frm) {
	// 	if (frm.doc.based_on) {
	// 		cur_frm.set_df_property('based_on_qty', 'label',"Required " +cstr(frm.doc.based_on) + " Qty");
	// 	}
	// },
	// based_on_qty: function (frm) {
	// 	if (!frm.doc.based_on) {
	// 		frappe.db.get_value("BOM", frm.doc.bom_no, "based_on", function (r) {
	// 			if (r) {
	// 				frm.set_value("based_on", r.based_on)
	// 			}
	// 		});
	// 	} else {
	// 		let qty = flt(frm.doc.batch_yield * frm.doc.based_on_qty);
	// 		frm.set_value('qty', flt(qty, precision("qty")));
	// 	}
	// },
	volume_rate: function (frm) {
		cost = flt(frm.doc.volume * frm.doc.volume_rate);
		frm.set_value('volume_cost', cost);
	},
	volume: function (frm) {
		cost = flt(frm.doc.volume * frm.doc.volume_rate);
		frm.set_value('volume_cost', cost);
	},

	make_transfer: function(frm){
		var max_qty = flt(frm.doc.qty) - flt(frm.doc.material_transferred_for_instruction);

		max_qty = flt(max_qty, precision("qty"));
		frappe.throw("make_material_transfer")
		// frappe.call({
		// 	method:"chemical.chemical.doctype.material_transfer_instruction.material_transfer_instruction.make_material_transfer",
		// 	args: {
		// 		"work_order_id": frm.doc.name,
		// 		"qty": max_qty
		// 	},
		// 	callback: function(r) {
		// 		var doclist = frappe.model.sync(r.message);
		// 		frappe.set_route("Form", doclist[0].doctype, doclist[0].name);
		// 	}
		// });
	},

	show_progress: function(frm) {
		var bars = [];
		var message = '';
		var added_min = false;

		// produced qty
		var title = __('{0} items produced', [frm.doc.produced_qty]);
		bars.push({
			'title': title,
			'width': (frm.doc.produced_qty / frm.doc.qty * 100) + '%',
			'progress_class': 'progress-bar-success'
		});
		if (bars[0].width == '0%') {
			bars[0].width = '0.5%';
			added_min = 0.5;
		}
		message = title;
		// pending qty
		if(!frm.doc.skip_transfer){
			var pending_complete = frm.doc.material_transferred_for_manufacturing - frm.doc.produced_qty;
			if(pending_complete) {
				var title = __('{0} items in progress', [pending_complete]);
				var width = ((pending_complete / frm.doc.qty * 100) - added_min);
				bars.push({
					'title': title,
					'width': (width > 100 ? "99.5" : width)  + '%',
					'progress_class': 'progress-bar-warning'
				})
				message = message + '. ' + title;
			}
		}

		else if(frm.doc.skip_transfer && frm.doc.material_transferred_for_instruction){
			var pending_complete = frm.doc.material_transferred_for_instruction - frm.doc.produced_qty;
			if(pending_complete) {
				var title = __('{0} items in progress', [pending_complete]);
				var width = ((pending_complete / frm.doc.qty * 100) - added_min);
				bars.push({
					'title': title,
					'width': (width > 100 ? "99.5" : width)  + '%',
					'progress_class': 'progress-bar-warning'
				})
				message = message + '. ' + title;
			}
		}

		let bar = cur_frm.dashboard.progress_area.find('div')[0];
		bar.hidden = true;

		let p = cur_frm.dashboard.progress_area.find('p')[0];
		p.hidden = true;

		frm.dashboard.add_progress(__('Status'), bars, message);
	},

});

// erpnext.work_order.set_custom_buttons = function(frm) {
//     var doc = frm.doc;
//     if (doc.docstatus === 1) {
//         if (doc.status != 'Stopped' && doc.status != 'Completed') {
//             frm.add_custom_button(__('Stop'), function() {
//                 erpnext.work_order.stop_work_order(frm, "Stopped");
//             }, __("Status"));
//         } else if (doc.status == 'Stopped') {
//             frm.add_custom_button(__('Re-open'), function() {
//                 erpnext.work_order.stop_work_order(frm, "Resumed");
//             }, __("Status"));
//         }

//         const show_start_btn = (frm.doc.skip_transfer
//             || frm.doc.transfer_material_against == 'Job Card') ? 0 : 1;

//         if (show_start_btn){
//             if ((flt(doc.material_transferred_for_manufacturing) < flt(doc.qty))
//                 && frm.doc.status != 'Stopped') {
//                 frm.has_start_btn = true;
//                 var start_btn = frm.add_custom_button(__('Start'), function() {
//                     erpnext.work_order.make_se(frm, 'Material Transfer for Manufacture');
//                 });
//                 start_btn.addClass('btn-primary');
//             }
//         }

//         if(!frm.doc.skip_transfer){
//             // If "Material Consumption is check in Manufacturing Settings, allow Material Consumption
//             if ((flt(doc.produced_qty) < flt(doc.material_transferred_for_manufacturing))
//             && frm.doc.status != 'Stopped') {
//                 frm.has_finish_btn = true;

//                 if (frm.doc.__onload && frm.doc.__onload.material_consumption == 1) {
//                     // Only show "Material Consumption" when required_qty > consumed_qty
//                     var counter = 0;
//                     var tbl = frm.doc.required_items || [];
//                     var tbl_lenght = tbl.length;
//                     for (var i = 0, len = tbl_lenght; i < len; i++) {
//                         if (flt(frm.doc.required_items[i].required_qty) > flt(frm.doc.required_items[i].consumed_qty)) {
//                             counter += 1;
//                         }
//                     }
//                     if (counter > 0) {
//                         var consumption_btn = frm.add_custom_button(__('Material Consumption'), function() {
//                             const backflush_raw_materials_based_on = frm.doc.__onload.backflush_raw_materials_based_on;
//                             erpnext.work_order.make_consumption_se(frm, backflush_raw_materials_based_on);
//                         });
//                         consumption_btn.addClass('btn-primary');
//                     }
//                 }

//                 var finish_btn = frm.add_custom_button(__('Finish'), function() {
//                     console.log('finish called')
//                     let purpose = "Manufacture";
//                     if(!frm.doc.skip_transfer){
//                         var max = (purpose === "Manufacture") ?
//                             flt(frm.doc.material_transferred_for_manufacturing) - flt(frm.doc.produced_qty) :
//                             flt(frm.doc.qty) - flt(frm.doc.material_transferred_for_manufacturing);
//                     } else {
//                         var max = flt(frm.doc.qty) - flt(frm.doc.produced_qty);
//                     }

//                     max = flt(max, precision("qty"));
//                     frappe.prompt({fieldtype:"Float", label: __("Qty for {0}", [purpose]), fieldname:"qty",
//                         description: __("Max: {0}", [max]), 'default': max }, function(data)
//                     {
//                         if(data.qty > max) {
//                             frappe.msgprint(__("Quantity must not be more than {0}", [max]));
//                             return;
//                         }
//                         frappe.call({
//                             method:"chemical.api.make_stock_entry",
//                             args: {
//                                 "work_order_id": frm.doc.name,
//                                 "purpose": purpose,
//                                 "qty": data.qty
//                             },
//                             callback: function(r) {
//                                 var doclist = frappe.model.sync(r.message);
//                                 frappe.set_route("Form", doclist[0].doctype, doclist[0].name);
//                             }
//                         });
//                     }, __("Select Quantity"), __("Make"));
//                 });

//                 if(doc.material_transferred_for_manufacturing>=doc.qty) {
//                     // all materials transferred for manufacturing, make this primary
//                     finish_btn.addClass('btn-primary');
//                 }
//             }
//         } else {
//             if ((flt(doc.produced_qty) < flt(doc.qty)) && frm.doc.status != 'Stopped') {
//                 var finish_btn = frm.add_custom_button(__('Finish'), function() {
//                     erpnext.work_order.make_se(frm, 'Manufacture');
//                 });
//                 finish_btn.addClass('btn-primary');
//             }
//         }
//     }
// }