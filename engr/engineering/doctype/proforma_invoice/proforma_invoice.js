// Copyright (c) 2021, Finbyz Tech. Pvt. Ltd. and contributors
// For license information, please see license.txt
frappe.ui.form.on('Proforma Invoice', {
	calculate_item_values: function(frm) {	
		$.each(frm.doc["items"] || [], function(i, item) {
			frappe.model.round_floats_in(item);
			frappe.model.set_value(item.doctype,item.name,'net_rate',item.rate)
	
			if ((!item.qty) && frm.doc.is_return) {
				frappe.model.set_value(item.doctype,item.name,'amount',flt(item.rate * -1, precision("amount", item)))
				
			} else {
				frappe.model.set_value(item.doctype,item.name,'amount',flt(item.rate * item.qty, precision("amount", item)))
				
			}
			frappe.model.set_value(item.doctype,item.name,'net_amount',item.amount)

			item.item_tax_amount = 0.0;
			frappe.model.set_value(item.doctype,item.name,'total_weight',flt(item.weight_per_unit * item.stock_qty))
			

			frappe.model.set_value(item.doctype,item.name,'base_price_list_rate',flt(item.price_list_rate * frm.doc.conversion_rate))	
			frappe.model.set_value(item.doctype,item.name,'base_rate',flt(item.rate * frm.doc.conversion_rate))
			frappe.model.set_value(item.doctype,item.name,'base_amount',flt(item.amount * frm.doc.conversion_rate))	
			frappe.model.set_value(item.doctype,item.name,'base_net_amount',flt(item.net_amount * frm.doc.conversion_rate))
			
			
			//set_in_company_currency(item, ["price_list_rate", "rate", "amount", "net_rate", "net_amount"]);
		});
	},
	
	payment_percentage: function(frm){
		frm.set_value('payment_due_amount',flt(frm.doc.grand_total) * frm.doc.payment_percentage / 100)
		frm.doc.items.forEach(function(row){
			frappe.model.set_value(row.doctype,row.name,'payment_amount',flt(row.net_amount) * frm.doc.payment_percentage / 100)
		})
	},
	calculate_net_total: function(frm) {
		let total_qty = 0.0;
		let total = 0.0;
		let base_total = 0.0;
		let net_total = 0.0;
		let base_net_total = 0.0;

		$.each(frm.doc["items"] || [], function(i, item) {
			total += item.amount;
			total_qty += item.qty;
			base_total += item.base_amount;
			net_total += item.net_amount;
			base_net_total += item.base_net_amount;
		});
		frm.set_value('total',total)
		frm.set_value('total_qty',total_qty)
		frm.set_value('base_total',base_total)
		frm.set_value('net_total',total)
		frm.set_value('base_net_total',base_net_total)

		frappe.model.round_floats_in(frm.doc, ["total", "base_total", "net_total", "base_net_total"]);
	},
	_calculate_taxes_and_totals: function(frm) {
		frm.trigger('validate_conversion_rate');
		frm.trigger('initialize_taxes');
		frm.trigger('calculate_net_total');
		frm.trigger('calculate_taxes');
		frm.trigger('manipulate_grand_total_for_inclusive_tax');
		frm.trigger('calculate_totals');
		frm.trigger('_cleanup');
	},
	validate_conversion_rate: function(frm) {
		frm.doc.conversion_rate = flt(frm.doc.conversion_rate, (cur_frm) ? precision("conversion_rate") : 9);
		var conversion_rate_label = frappe.meta.get_label(frm.doc.doctype, "conversion_rate",
			frm.doc.name);
		var company_currency = erpnext.get_currency(frm.doc.company);

		if(!frm.doc.conversion_rate) {
			if(frm.doc.currency == company_currency) {
				frm.set_value("conversion_rate", 1);
			} else {
				const err_message = __('{0} is mandatory. Maybe Currency Exchange record is not created for {1} to {2}', [
					conversion_rate_label,
					frm.doc.currency,
					company_currency
				]);
				frappe.throw(err_message);
			}
		}
	},
	initialize_taxes: function(frm) {
		var discount_amount_applied = false;
		$.each(frm.doc["taxes"] || [], function(i, tax) {
			tax.item_wise_tax_detail = {};
			var tax_fields = ["total", "tax_amount_after_discount_amount",
				"tax_amount_for_current_item", "grand_total_for_current_item",
				"tax_fraction_for_current_item", "grand_total_fraction_for_current_item"];

			if (cstr(tax.charge_type) != "Actual" &&
				!(discount_amount_applied && frm.doc.apply_discount_on=="Grand Total")) {
				tax_fields.push("tax_amount");
			}

			$.each(tax_fields, function(i, fieldname) { tax[fieldname] = 0.0; });

			if (!discount_amount_applied && cur_frm) {
				cur_frm.cscript.validate_taxes_and_charges(tax.doctype, tax.name);
				validate_inclusive_tax(tax);
			}
			frappe.model.round_floats_in(tax);
		});
	},
	calculate_taxes: function(frm) {
		var discount_amount_applied = false;
		frm.doc.rounding_adjustment = 0;
		var actual_tax_dict = {};

		// maintain actual tax rate based on idx
		$.each(frm.doc["taxes"] || [], function(i, tax) {
			if (tax.charge_type == "Actual") {
				actual_tax_dict[tax.idx] = flt(tax.tax_amount, precision("tax_amount", tax));
			}
		});

		$.each(frm.doc["items"] || [], function(n, item) {

			var item_tax_map = item.item_tax_rate ? JSON.parse(item.item_tax_rate) : {};
			$.each(frm.doc["taxes"] || [], function(i, tax) {
				// tax_amount represents the amount of tax for the current step
				var current_tax_amount = get_current_tax_amount(frm,item, tax, item_tax_map);

				// Adjust divisional loss to the last item
				if (tax.charge_type == "Actual") {
					actual_tax_dict[tax.idx] -= current_tax_amount;
					if (n == frm.doc["items"].length - 1) {
						current_tax_amount += actual_tax_dict[tax.idx];
					}
				}

				// accumulate tax amount into tax.tax_amount
				if (tax.charge_type != "Actual" &&
					!(discount_amount_applied && frm.doc.apply_discount_on=="Grand Total")) {
					tax.tax_amount += current_tax_amount;
				}

				// store tax_amount for current item as it will be used for
				// charge type = 'On Previous Row Amount'
				tax.tax_amount_for_current_item = current_tax_amount;

				// tax amount after discount amount
				tax.tax_amount_after_discount_amount += current_tax_amount;

				// for buying
				if(tax.category) {
					// if just for valuation, do not add the tax amount in total
					// hence, setting it as 0 for further steps
					current_tax_amount = (tax.category == "Valuation") ? 0.0 : current_tax_amount;

					current_tax_amount *= (tax.add_deduct_tax == "Deduct") ? -1.0 : 1.0;
				}

				// note: grand_total_for_current_item contains the contribution of
				// item's amount, previously applied tax and the current tax on that item
				if(i==0) {
					tax.grand_total_for_current_item = flt(item.net_amount + current_tax_amount);
				} else {
					tax.grand_total_for_current_item =
						flt(frm.doc["taxes"][i-1].grand_total_for_current_item + current_tax_amount);
				}

				// set precision in the last item iteration
				if (n == frm.doc["items"].length - 1) {
					round_off_totals(tax);

					// in tax.total, accumulate grand total for each item
					set_cumulative_total(frm,i, tax);

					set_in_company_currency(frm,tax,
						["total", "tax_amount", "tax_amount_after_discount_amount"]);
					// adjust Discount Amount loss in last tax iteration
					if ((i == frm.doc["taxes"].length - 1) 
						&& frm.doc.apply_discount_on == "Grand Total" && frm.doc.discount_amount) {
						frm.doc.rounding_adjustment = flt(frm.doc.grand_total -
							flt(frm.doc.discount_amount) - tax.total, precision("rounding_adjustment"));
						
					}
				}
			});
			cur_frm.refresh_field('taxes');
		});
	},
	manipulate_grand_total_for_inclusive_tax: function(frm) {
		
		// if fully inclusive taxes and diff
		if (frm.doc["taxes"] && frm.doc["taxes"].length) {
			var any_inclusive_tax = false;
			$.each(frm.doc.taxes || [], function(i, d) {
				if(cint(d.included_in_print_rate)) any_inclusive_tax = true;
			});
			if (any_inclusive_tax) {
				var last_tax = frm.doc["taxes"].slice(-1)[0];
				var non_inclusive_tax_amount = frappe.utils.sum($.map(frm.doc.taxes || [],
					function(d) {
						if(!d.included_in_print_rate) {
							return flt(d.tax_amount_after_discount_amount);
						}
					}
				));
				var diff = frm.doc.total + non_inclusive_tax_amount
					- flt(last_tax.total, precision("grand_total"));

				if(discount_amount_applied && frm.doc.discount_amount) {
					diff -= flt(frm.doc.discount_amount);
				}

				diff = flt(diff, precision("rounding_adjustment"));

				if ( diff && Math.abs(diff) <= (5.0 / Math.pow(10, precision("tax_amount", last_tax))) ) {
					frm.doc.rounding_adjustment = diff;
				}
			}
		}
	},

	calculate_totals: function(frm) {
		// Changing sequence can cause rounding_adjustmentng issue and on-screen discrepency
		var me = this;
		var tax_count = frm.doc["taxes"] ? frm.doc["taxes"].length : 0;
		frm.doc.grand_total = flt(tax_count
			? frm.doc["taxes"][tax_count - 1].total + flt(frm.doc.rounding_adjustment)
			: frm.doc.net_total);

		if(in_list(["Quotation", "Sales Order", "Proforma Invoice","Delivery Note", "Sales Invoice"], frm.doc.doctype)) {
			frm.doc.base_grand_total = (frm.doc.total_taxes_and_charges) ?
				flt(frm.doc.grand_total * frm.doc.conversion_rate) : frm.doc.base_net_total;
		} else {
			// other charges added/deducted
			frm.doc.taxes_and_charges_added = frm.doc.taxes_and_charges_deducted = 0.0;
			if(tax_count) {
				$.each(frm.doc["taxes"] || [], function(i, tax) {
					if (in_list(["Valuation and Total", "Total"], tax.category)) {
						if(tax.add_deduct_tax == "Add") {
							frm.doc.taxes_and_charges_added += flt(tax.tax_amount_after_discount_amount);
						} else {
							frm.doc.taxes_and_charges_deducted += flt(tax.tax_amount_after_discount_amount);
						}
					}
				});

				frappe.model.round_floats_in(frm.doc,
					["taxes_and_charges_added", "taxes_and_charges_deducted"]);
			}

			frm.doc.base_grand_total = flt((frm.doc.taxes_and_charges_added || frm.doc.taxes_and_charges_deducted) ?
				flt(frm.doc.grand_total * frm.doc.conversion_rate) : frm.doc.base_net_total);

			set_in_company_currency(frm.doc,
				["taxes_and_charges_added", "taxes_and_charges_deducted"]);
		}

		frm.doc.total_taxes_and_charges = flt(frm.doc.grand_total - frm.doc.net_total
			- flt(frm.doc.rounding_adjustment), precision("total_taxes_and_charges"));

		//set_in_company_currency(frm,frm.doc, ["total_taxes_and_charges", "rounding_adjustment"]);
		frm.doc.base_total_taxes_and_charges = flt(flt(frm.doc.total_taxes_and_charges) * frm.doc.conversion_rate, precision("base_total_taxes_and_charges", frm.doc))
		frm.doc.base_rounding_adjustment = flt(flt(frm.doc.rounding_adjustment) * frm.doc.conversion_rate, precision("base_rounding_adjustment", frm.doc))
		// Round grand total as per precision
		frappe.model.round_floats_in(frm.doc, ["grand_total", "base_grand_total"]);

		// rounded totals
		frm.trigger('set_rounded_total');
		cur_frm.refresh_fields()
	},
	set_rounded_total: function(frm) {
		var disable_rounded_total = 0;
		if(frappe.meta.get_docfield(frm.doc.doctype, "disable_rounded_total", frm.doc.name)) {
			disable_rounded_total = frm.doc.disable_rounded_total;
		} else if (frappe.sys_defaults.disable_rounded_total) {
			disable_rounded_total = frappe.sys_defaults.disable_rounded_total;
		}

		if (cint(disable_rounded_total)) {
			frm.doc.rounded_total = 0;
			frm.doc.base_rounded_total = 0;
			return;
		}

		if(frappe.meta.get_docfield(frm.doc.doctype, "rounded_total", frm.doc.name)) {
			frm.doc.rounded_total = round_based_on_smallest_currency_fraction(frm.doc.grand_total,
				frm.doc.currency, precision("rounded_total"));
			frm.doc.rounding_adjustment += flt(frm.doc.rounded_total - frm.doc.grand_total,
				precision("rounding_adjustment"));

			//set_in_company_currency(frm,frm.doc, ["rounding_adjustment", "rounded_total"]);
			frm.doc.base_rounding_adjustment = flt(flt(frm.doc.rounding_adjustment) * frm.doc.conversion_rate, precision("base_rounding_adjustment", frm.doc))
			frm.doc.base_rounded_total = flt(flt(frm.doc.rounded_total) * frm.doc.conversion_rate, precision("base_rounded_total", frm.doc))
		
			
		}
		
		cur_frm.refresh_fields()
	},
	_cleanup: function(frm) {
		frm.doc.base_in_words = frm.doc.in_words = "";

		if(frm.doc["items"] && frm.doc["items"].length) {
			if(!frappe.meta.get_docfield(frm.doc["items"][0].doctype, "item_tax_amount", frm.doctype)) {
				$.each(frm.doc["items"] || [], function(i, item) {
					delete item["item_tax_amount"];
				});
			}
		}

		if(frm.doc["taxes"] && frm.doc["taxes"].length) {
			var temporary_fields = ["tax_amount_for_current_item", "grand_total_for_current_item",
				"tax_fraction_for_current_item", "grand_total_fraction_for_current_item"];

			if(!frappe.meta.get_docfield(frm.doc["taxes"][0].doctype, "tax_amount_after_discount_amount", frm.doctype)) {
				temporary_fields.push("tax_amount_after_discount_amount");
			}

			$.each(frm.doc["taxes"] || [], function(i, tax) {
				$.each(temporary_fields, function(i, fieldname) {
					delete tax[fieldname];
				});

				tax.item_wise_tax_detail = JSON.stringify(tax.item_wise_tax_detail);
			});
		}
	},
	
})
frappe.ui.form.on('Proforma Invoice Item', {

	qty: function(frm) {		
		frm.events.calculate_item_values(frm);
		frm.events._calculate_taxes_and_totals(frm);
	},
	rate: function(frm) {
		frm.events.calculate_item_values(frm);
		frm.events.calculate_net_total(frm);
	},	
});

function get_current_tax_amount(frm,item, tax, item_tax_map) {
	var tax_rate = _get_tax_rate(tax, item_tax_map);
	var current_tax_amount = 0.0;

	// To set row_id by default as previous row.
	if(["On Previous Row Amount", "On Previous Row Total"].includes(tax.charge_type)) {
		if (tax.idx === 1) {
			frappe.throw(
				__("Cannot select charge type as 'On Previous Row Amount' or 'On Previous Row Total' for first row"));
		}
		if (!tax.row_id) {
			tax.row_id = tax.idx - 1;
		}
	}
	if(tax.charge_type == "Actual") {
		// distribute the tax amount proportionally to each item row
		var actual = flt(tax.tax_amount, precision("tax_amount", tax));
		current_tax_amount = frm.doc.net_total ?
			((item.net_amount / frm.doc.net_total) * actual) : 0.0;

	} else if(tax.charge_type == "On Net Total") {
		current_tax_amount = (tax_rate / 100.0) * item.net_amount;
	} else if(tax.charge_type == "On Previous Row Amount") {
		current_tax_amount = (tax_rate / 100.0) *
			frm.doc["taxes"][cint(tax.row_id) - 1].tax_amount_for_current_item;

	} else if(tax.charge_type == "On Previous Row Total") {
		current_tax_amount = (tax_rate / 100.0) *
			frm.doc["taxes"][cint(tax.row_id) - 1].grand_total_for_current_item;
	} else if (tax.charge_type == "On Item Quantity") {
		current_tax_amount = tax_rate * item.qty;
	}
	set_item_wise_tax(frm,item, tax, tax_rate, current_tax_amount);

	return current_tax_amount;
}
function _get_tax_rate(tax, item_tax_map) {
	return (Object.keys(item_tax_map).indexOf(tax.account_head) != -1) ?
		flt(item_tax_map[tax.account_head], precision("rate", tax)) : tax.rate;
}
function set_item_wise_tax(frm,item, tax, tax_rate, current_tax_amount) {
	// store tax breakup for each item
	let tax_detail = tax.item_wise_tax_detail;
	let key = item.item_code || item.item_name;

	let item_wise_tax_amount = current_tax_amount * frm.doc.conversion_rate;
	if (tax_detail && tax_detail[key])
		item_wise_tax_amount += tax_detail[key][1];

	tax_detail[key] = [tax_rate, flt(item_wise_tax_amount, precision("base_tax_amount", tax))];
}
function round_off_totals(tax) {
	tax.tax_amount = flt(tax.tax_amount, precision("tax_amount", tax));
	tax.tax_amount_after_discount_amount = flt(tax.tax_amount_after_discount_amount, precision("tax_amount", tax));
}
function set_cumulative_total(frm,row_idx, tax) {
	var tax_amount = tax.tax_amount_after_discount_amount;
	if (tax.category == 'Valuation') {
		tax_amount = 0;
	}

	if (tax.add_deduct_tax == "Deduct") { tax_amount = -1*tax_amount; }

	if(row_idx==0) {
		tax.total = flt(frm.doc.net_total + tax_amount, precision("total", tax));
	} else {
		tax.total = flt(frm.doc["taxes"][row_idx-1].total + tax_amount, precision("total", tax));
	}
}
function set_in_company_currency(frm,doc, fields) {
	$.each(fields, function(i, f) {
		frappe.model.set_value(f.doctype,f.name,doc["base_"+f],flt(flt(doc[f], precision(f, doc)) * frm.doc.conversion_rate, precision("base_" + f, doc)))
		//doc["base_"+f] = flt(flt(doc[f], precision(f, doc)) * frm.doc.conversion_rate, precision("base_" + f, doc));
	});
}
cur_frm.cscript.validate_taxes_and_charges = function(cdt, cdn) {
	var d = locals[cdt][cdn];
	var msg = "";

	if(d.account_head && !d.description) {
		// set description from account head
		d.description = d.account_head.split(' - ').slice(0, -1).join(' - ');
	}

	if(!d.charge_type && (d.row_id || d.rate || d.tax_amount)) {
		msg = __("Please select Charge Type first");
		d.row_id = "";
		d.rate = d.tax_amount = 0.0;
	} else if((d.charge_type == 'Actual' || d.charge_type == 'On Net Total') && d.row_id) {
		msg = __("Can refer row only if the charge type is 'On Previous Row Amount' or 'Previous Row Total'");
		d.row_id = "";
	} else if((d.charge_type == 'On Previous Row Amount' || d.charge_type == 'On Previous Row Total') && d.row_id) {
		if (d.idx == 1) {
			msg = __("Cannot select charge type as 'On Previous Row Amount' or 'On Previous Row Total' for first row");
			d.charge_type = '';
		} else if (!d.row_id) {
			msg = __("Please specify a valid Row ID for row {0} in table {1}", [d.idx, __(d.doctype)]);
			d.row_id = "";
		} else if(d.row_id && d.row_id >= d.idx) {
			msg = __("Cannot refer row number greater than or equal to current row number for this Charge type");
			d.row_id = "";
		}
	}
	if(msg) {
		frappe.validated = false;
		refresh_field("taxes");
		frappe.throw(msg);
	}

}
function validate_inclusive_tax (tax) {
	var me = this;
	var actual_type_error = function() {
		var msg = __("Actual type tax cannot be included in Item rate in row {0}", [tax.idx])
		frappe.throw(msg);
	};

	var on_previous_row_error = function(row_range) {
		var msg = __("For row {0} in {1}. To include {2} in Item rate, rows {3} must also be included",
			[tax.idx, __(tax.doctype), tax.charge_type, row_range])
		frappe.throw(msg);
	};

	if(cint(tax.included_in_print_rate)) {
		if(tax.charge_type == "Actual") {
			// inclusive tax cannot be of type Actual
			actual_type_error();
		} else if(tax.charge_type == "On Previous Row Amount" &&
			!cint(frm.doc["taxes"][tax.row_id - 1].included_in_print_rate)
		) {
			// referred row should also be an inclusive tax
			on_previous_row_error(tax.row_id);
		} else if(tax.charge_type == "On Previous Row Total") {
			var taxes_not_included = $.map(frm.doc["taxes"].slice(0, tax.row_id),
				function(t) { return cint(t.included_in_print_rate) ? null : t; });
			if(taxes_not_included.length > 0) {
				// all rows above this tax should be inclusive
				on_previous_row_error(tax.row_id == 1 ? "1" : "1 - " + tax.row_id);
			}
		} else if(tax.category == "Valuation") {
			frappe.throw(__("Valuation type charges can not marked as Inclusive"));
		}
	}
}
