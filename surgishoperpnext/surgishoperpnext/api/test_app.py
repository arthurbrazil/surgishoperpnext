# Copyright (c) 2024, SurgiShop and Contributors
# License: MIT. See license.txt

import frappe
from frappe import _

@frappe.whitelist()
def test_app_status():
	"""API endpoint to test if the app is working correctly"""
	
	result = {
		"app_name": "surgishoperpnext",
		"status": "installed",
		"tests": {}
	}
	
	# Test 1: Check if app is installed
	try:
		app_info = frappe.get_app("surgishoperpnext")
		result["tests"]["app_installation"] = {
			"status": "success",
			"version": app_info.version,
			"app_title": app_info.app_title
		}
	except Exception as e:
		result["tests"]["app_installation"] = {
			"status": "failed",
			"error": str(e)
		}
	
	# Test 2: Check if override module can be imported
	try:
		from surgishoperpnext.overrides.stock_controller import is_inbound_transaction, validate_serialized_batch_with_expired_override
		result["tests"]["override_import"] = {
			"status": "success",
			"functions_available": ["is_inbound_transaction", "validate_serialized_batch_with_expired_override"]
		}
	except ImportError as e:
		result["tests"]["override_import"] = {
			"status": "failed",
			"error": str(e)
		}
	
	# Test 3: Check if hooks are registered
	try:
		from frappe import get_hooks
		doc_events = get_hooks("doc_events")
		if "surgishoperpnext" in str(doc_events):
			result["tests"]["hooks_registration"] = {
				"status": "success",
				"message": "Doc events hooks found"
			}
		else:
			result["tests"]["hooks_registration"] = {
				"status": "warning",
				"message": "Doc events hooks not found in current context"
			}
	except Exception as e:
		result["tests"]["hooks_registration"] = {
			"status": "failed",
			"error": str(e)
		}
	
	return result
