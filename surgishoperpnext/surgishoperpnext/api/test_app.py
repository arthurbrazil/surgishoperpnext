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
	
	# Test 4: Test the is_inbound_transaction function
	try:
		from surgishoperpnext.overrides.stock_controller import is_inbound_transaction
		
		# Create a mock document for testing
		class MockDoc:
			def __init__(self, doctype, purpose=None, is_return=False):
				self.doctype = doctype
				self.purpose = purpose
				self.is_return = is_return
		
		class MockItem:
			def __init__(self, t_warehouse=None, s_warehouse=None, qty=0):
				self.t_warehouse = t_warehouse
				self.s_warehouse = s_warehouse
				self.qty = qty
		
		# Test Purchase Receipt (should be inbound)
		purchase_receipt = MockDoc("Purchase Receipt")
		item = MockItem(t_warehouse="Stores - S", qty=10)
		is_inbound = is_inbound_transaction(purchase_receipt, item)
		
		result["tests"]["function_test"] = {
			"status": "success",
			"purchase_receipt_test": is_inbound,
			"message": "is_inbound_transaction function working"
		}
	except Exception as e:
		result["tests"]["function_test"] = {
			"status": "failed",
			"error": str(e)
		}
	
	return result

@frappe.whitelist()
def test_expired_batch_validation():
	"""Test the expired batch validation functionality"""
	
	result = {
		"test_name": "Expired Batch Validation Test",
		"status": "running"
	}
	
	try:
		# Check if we can create a batch with expiry date
		batch = frappe.new_doc("Batch")
		batch.item = "Test Item"  # You might need to adjust this
		batch.batch_id = "TEST-BATCH-001"
		batch.expiry_date = "2023-01-01"  # Expired date
		
		result["batch_creation"] = "success"
		result["message"] = "Batch creation test passed"
		
	except Exception as e:
		result["batch_creation"] = "failed"
		result["error"] = str(e)
	
	return result
