from __future__ import unicode_literals

from frappe import _


def get_data(data):
	return {
		'heatmap': True,
		'heatmap_message': _('This is based on transactions against this Customer. See timeline below for details'),
		'fieldname': 'customer',
		'non_standard_fieldnames': {
			'Payment Entry': 'party',
			'Quotation': 'party_name',
			'Opportunity': 'party_name'
		},
		'dynamic_links': {
			'party_name': ['Customer', 'quotation_to']
		},
		'transactions': [
			{
				'label': _('Pre Sales'),
				'items': ['Opportunity', 'Quotation']
			},
			{
				'label': _('Orders'),
				'items': ['Sales Order', 'Delivery Note', 'Sales Invoice','Proforma Invoice']
			},
			{
				'label': _('Payments'),
				'items': ['Payment Entry']
			},
			{
				'label': _('Support'),
				'items': ['Issue', 'Maintenance Visit', 'Installation Note', 'Warranty Claim']
			},
			{
				'label': _('Projects'),
				'items': ['Project']
			},
			{
				'label': _('Pricing'),
				'items': ['Pricing Rule']
			},
			{
				'label': _('Meeting'),
				'items': ['Meeting Schedule','Meeting']
			},
		]
	}