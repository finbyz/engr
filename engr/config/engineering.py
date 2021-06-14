from __future__ import unicode_literals
from frappe import _
import frappe


def get_data():
	return [
		{
			"label": _("Email Inbox"),
			"items": [
				{
					"type": "doctype",
					"name": "Communication",
					"description": _("Open Email Inbox"),
					"onboard": 1
				},
			]
		},
		{
			"label": _("Custom Reports"),
			"items": [
				{
					"type": "report",
					"name": "Target VS Potential",
					"is_query_report": True,
				},
				{
					"type": "report",
					"name": "Target VS Achievement",
					"is_query_report": True,
				},
				{
					"type": "report",
					"name": "SO Delivery Status",
					"is_query_report": True,
				},
			]
		},
	]