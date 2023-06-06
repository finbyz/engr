# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from engr import api
from . import __version__ as app_version


app_name = "engr"
app_title = "Engineering"
app_publisher = "Finbyz Tech. Pvt. Ltd."
app_description = "Engineering"
app_icon = "octicon octicon-file-directory"
app_color = "grey"
app_email = "info@finbyz.com"
app_license = "MIT"

# Includes in <head>
# ------------------

# include js, css files in header of desk.html
# app_include_css = "/assets/engr/css/engr.css"
# app_include_js = "/assets/engr/js/engr.js"

from engr.engineering.doc_events.work_order import get_status, update_work_order_qty, update_transaferred_qty_for_required_items, update_consumed_qty_for_required_items
from erpnext.manufacturing.doctype.work_order.work_order import WorkOrder

# WorkOrder.get_status = get_status
WorkOrder.update_work_order_qty = update_work_order_qty
WorkOrder.update_transaferred_qty_for_required_items = update_transaferred_qty_for_required_items
WorkOrder.update_consumed_qty_for_required_items = update_consumed_qty_for_required_items

# overide reason bcz raw material changes on change event of fg_completed_qty
from erpnext.stock.doctype.stock_entry.stock_entry import StockEntry
from engr.engineering.doc_events.work_order import get_items
StockEntry.get_items = get_items
from engr.engineering.doc_events.work_order import create_job_card
from erpnext.manufacturing.doctype.work_order import work_order
work_order.create_job_card = create_job_card

app_include_js = [
	"/assets/js/engineering.min.js" 
]

override_doctype_class = {
	'Sales Invoice': 'engr.engineering.doc_events.SalesInvoiceclass.SalesInvoice'
}
doctype_list_js = {
	"Sales Order" : "public/js/doctype_js/sales_order_list.js",
	"Production Plan":"public/js/doctype_js/production plan.js",
	
}

doctype_js = {
	"Sales Order": "public/js/doctype_js/sales_order.js",
	"Purchase Order": "public/js/doctype_js/purchase_order.js",
	"Purchase Receipt": "public/js/doctype_js/purchase_receipt.js",
	"Purchase Invoice": "public/js/doctype_js/purchase_invoice.js",
	"Delivery Note": "public/js/doctype_js/delivery_note.js",
	"Customer":"public/js/doctype_js/customer.js",
	"Sales Invoice":"public/js/doctype_js/sales_invoice.js",
	"Communication":"public/js/doctype_js/communication.js",
	"Quotation":"public/js/doctype_js/quotation.js",
	"Item":"public/js/doctype_js/item.js",
	"Material Request":"public/js/doctype_js/material_request.js",
	"Request for Quotation":"public/js/doctype_js/request_for_quotation.js",
	"Supplier Quotation":"public/js/doctype_js/supplier_quotation.js",
	"Work Order":"public/js/doctype_js/work_order.js",
	"Stock Entry":"public/js/doctype_js/stock_entry.js",
	
}
	
override_doctype_dashboards = {
	"Sales Order": "engr.engineering.dashboard.sales_order.get_data",
}

doc_events = {
	"Customer":{
		"validate":"engr.engineering.doc_events.customer.validate_customer_potential"
	},
	"Item":{
		"validate": "engr.engineering.doc_events.item.validate",
		"on_update": "engr.engineering.doc_events.item.on_update",
	},
	"Payment Entry":{
		"validate":"engr.engineering.doc_events.payment_entry.validate",
		"on_submit":"engr.engineering.doc_events.payment_entry.on_submit",
		"on_cancel":"engr.engineering.doc_events.payment_entry.on_cancel"
	},
	"Sales Invoice":{
		"validate":"engr.engineering.doc_events.sales_invoice.validate",
		"on_submit":"engr.engineering.doc_events.sales_invoice.on_submit",
		"on_cancel":"engr.engineering.doc_events.sales_invoice.on_cancel",
		"on_trash":"engr.engineering.doc_events.sales_invoice.on_trash",
	},
	"Purchase Order":{
		"validate":"engr.engineering.doc_events.purchase_order.validate",
		"before_validate":"engr.engineering.doc_events.purchase_order.before_validate",
		"on_update_after_submit":"engr.engineering.doc_events.purchase_order.update_reqd_date",
		"on_submit":"engr.engineering.doc_events.purchase_order.on_submit",
		"on_cancel":"engr.engineering.doc_events.purchase_order.on_cancel",
		"on_trash":"engr.engineering.doc_events.purchase_order.on_trash",
		"on_update":"engr.engineering.doc_events.purchase_order.pending_qty",


	},
	"Purchase Receipt":{
		"before_validate":"engr.engineering.doc_events.purchase_receipt.before_validate",
		"on_submit":'engr.engineering.doc_events.purchase_receipt.on_submit'
	},
	"Purchase Invoice":{
		"before_validate":"engr.engineering.doc_events.purchase_invoice.before_validate"
	},
	"Sales Order":{
		"validate":"engr.engineering.doc_events.sales_order.validate",
		"on_update":"engr.engineering.doc_events.sales_order.pending_qty",
		"on_update_after_submit":"engr.engineering.doc_events.sales_order.pending_qty"
	},
	"Delivery Note":{
		"validate":"engr.engineering.doc_events.delivery_note.validate",
		"on_submit":"engr.engineering.doc_events.delivery_note.on_submit",
		"on_cancel":"engr.engineering.doc_events.delivery_note.on_cancel",
		"on_trash":"engr.engineering.doc_events.delivery_note.on_trash",
	},
	"Salary Slip":{
		"validate":"engr.engineering.doc_events.salary_slip.validate"
	},
	"Quotation":{
		"on_submit":"engr.engineering.doc_events.quotation.on_submit"
	},
	"Stock Entry":{
		"before_submit":"engr.engineering.doc_events.stock_entry.validate_work_order_items"
	},
	"Job Card":{
		"before_submit":"engr.engineering.doc_events.job_card.before_submit"
	},
	"Material Request":{
		"before_validate":"engr.engineering.doc_events.material_request.before_validate"
		
	},
	'Proforma Invoice':{
		'on_cancel':'engr.engineering.doc_events.proforma_invoice.check_nextdoc_docstatus'
	},
	'Stock Entry':{
		'on_submit':'engr.engineering.doc_events.stock_entry.validate_stock_entry'
	}
}
# include js, css files in header of web template
# web_include_css = "/assets/engr/css/engr.css"
# web_include_js = "/assets/engr/js/engr.js"

# include js in page
# page_js = {"page" : "public/js/file.js"}

# include js in doctype views
# doctype_js = {"doctype" : "public/js/doctype.js"}
# doctype_list_js = {"doctype" : "public/js/doctype_list.js"}
# doctype_tree_js = {"doctype" : "public/js/doctype_tree.js"}
# doctype_calendar_js = {"doctype" : "public/js/doctype_calendar.js"}

# Home Pages
# ----------

# application home page (will override Website Settings)
# home_page = "login"

# website user home page (by Role)
# role_home_page = {
#	"Role": "home_page"
# }

# Website user home page (by function)
# get_website_user_home_page = "engr.utils.get_home_page"

# Generators
# ----------

# automatically create page for each record of this doctype
# website_generators = ["Web Page"]

# Installation
# ------------

# before_install = "engr.install.before_install"
# after_install = "engr.install.after_install"

# Desk Notifications
# ------------------
# See frappe.core.notifications.get_notification_config

# notification_config = "engr.notifications.get_notification_config"

# Permissions
# -----------
# Permissions evaluated in scripted ways

# permission_query_conditions = {
# 	"Event": "frappe.desk.doctype.event.event.get_permission_query_conditions",
# }
#
# has_permission = {
# 	"Event": "frappe.desk.doctype.event.event.has_permission",
# }

# Document Events
# ---------------
# Hook on document methods and events

# doc_events = {
# 	"*": {
# 		"on_update": "method",
# 		"on_cancel": "method",
# 		"on_trash": "method"
#	}
# }

# Scheduled Tasks
# ---------------

# scheduler_events = {
# 	"cron":{
# 		"0 5 * * SUN": [
# 			"engr.api.sales_invoice_payment_remainder",
# 		],
# 	}
# }
# scheduler_events = {
# 	"all": [
# 		"engr.tasks.all"
# 	],
# 	"daily": [
# 		"engr.tasks.daily"
# 	],
# 	"hourly": [
# 		"engr.tasks.hourly"
# 	],
# 	"weekly": [
# 		"engr.tasks.weekly"
# 	]
# 	"monthly": [
# 		"engr.tasks.monthly"
# 	]
# }

# Testing
# -------

# before_tests = "engr.install.before_tests"

# Overriding Methods
# ------------------------------
#
# override_whitelisted_methods = {
# 	"frappe.desk.doctype.event.event.get_events": "engr.event.get_events"
# }
#
# each overriding function accepts a `data` argument;
# generated from the base implementation of the doctype dashboard,
# along with any modifications made in other Frappe apps
# override_doctype_dashboards = {
# 	"Task": "engr.task.get_dashboard_data"
# }

# Sales Partner target report changes for all fetch all item groups instead of one item group
from erpnext.selling.report.sales_partner_target_variance_based_on_item_group import item_group_wise_sales_target_variance
from engr.engineering.report.item_group_wise_sales_target_variance import get_data_column
item_group_wise_sales_target_variance.get_data_column = get_data_column

from erpnext.manufacturing.doctype.production_plan import production_plan
from engr.api import get_sales_orders
production_plan.get_sales_orders=get_sales_orders

# Override for chart
from erpnext.selling.report.sales_person_target_variance_based_on_item_group import sales_person_target_variance_based_on_item_group
from engr.engineering.report.sales_person_target_variance_based_on_item_group import execute
sales_person_target_variance_based_on_item_group.execute = execute

from erpnext.stock.doctype.material_request import material_request
from engr.engineering.doc_events.material_request import get_default_supplier_query, make_purchase_order
material_request.get_default_supplier_query = get_default_supplier_query
material_request.make_purchase_order = make_purchase_order

#over ride report --
from finbyzerp.finbyzerp.report.activity_analysis import activity_analysis
from engr.engineering.report.activity_analysis import execute
activity_analysis.execute = execute

from erpnext.manufacturing.doctype.production_plan.production_plan import ProductionPlan
from engr.engineering.doc_events.production_plan import make_work_order
ProductionPlan.make_work_order = make_work_order

# from erpnext.manufacturing.doctype.production_plan.production_plan import ProductionPlan
# from engr.engineering.doc_events.production_plan import make_work_order_for_subassembly_items
# ProductionPlan.make_work_order_for_subassembly_items = make_work_order_for_subassembly_items



from erpnext.manufacturing.doctype.production_plan.production_plan import ProductionPlan
from engr.engineering.doc_events.production_plan import make_material_request
ProductionPlan.make_material_request = make_material_request


from erpnext.stock.report.stock_ledger import stock_ledger 
from engr.engineering.report.stock_ledger import execute as stock_ledger_execute
stock_ledger.execute = stock_ledger_execute