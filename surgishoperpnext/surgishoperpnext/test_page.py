# Copyright (c) 2024, SurgiShop and Contributors
# License: MIT. See license.txt

import frappe
from frappe import _

def get_context(context):
	"""Test page context to verify app installation"""
	context.title = "SurgiShopERPNext Test Page"
	context.app_installed = True
	context.app_name = "surgishoperpnext"
	context.app_version = frappe.get_attr("surgishoperpnext.__version__")
	
	# Test if our override module can be imported
	try:
		from surgishoperpnext.overrides.stock_controller import is_inbound_transaction
		context.override_import_success = True
		context.override_functions = ["is_inbound_transaction", "validate_serialized_batch_with_expired_override"]
	except ImportError as e:
		context.override_import_success = False
		context.import_error = str(e)
	
	# Test ERPNext integration
	try:
		context.erpnext_available = True
		context.stock_doctypes = frappe.get_all("DocType", 
			filters={"module": "Stock"}, 
			fields=["name"], 
			limit=5
		)
	except Exception as e:
		context.erpnext_available = False
		context.erpnext_error = str(e)
