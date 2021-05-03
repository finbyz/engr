
from __future__ import unicode_literals
from frappe import _

def get_data():
	return {
		'fieldname': 'proforma_invoice',
		'internal_links': {
			'Sales Order': ['items', 'sales_order']
		},
		'transactions': [
			{
				'label':_('References'),
				'items':['Sales Order','Sales Invoice','Delivery Note']
			},
			{
				'label': _('Payment'),
				'items': ['Payment Entry']
			},
		]
	}