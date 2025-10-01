# Copyright (c) 2024, SurgiShop and Contributors
# License: MIT. See license.txt

import frappe
from frappe import _
import re
from datetime import datetime

@frappe.whitelist()
def parse_gs1_and_get_batch(gtin, expiry, lot):
	"""
	API endpoint to find an item by GTIN, and then find or create a batch for it
	using the lot and expiry date.
	
	Args:
		gtin (str): The GTIN (Global Trade Item Number) from the barcode
		expiry (str): The expiry date in YYMMDD format
		lot (str): The lot/batch number
	
	Returns:
		dict: Contains found_item, batch, gtin, expiry, lot, batch_expiry_date
		      or error information if the operation fails
	"""
	try:
		# Validate required parameters
		if not gtin or not lot:
			frappe.throw(_("GTIN and Lot Number are required."))
		
		# Sanitize inputs
		gtin = str(gtin).strip()
		lot = str(lot).strip()
		expiry = str(expiry).strip() if expiry else ""
		
		frappe.logger().info(f"🏥 SurgiShopERPNext: Processing GS1 - GTIN: {gtin}, Lot: {lot}, Expiry: {expiry}")

		# 1) Lookup the Item via "Item Barcode"
		item_code = frappe.db.get_value("Item Barcode", {"barcode": gtin}, "parent")

		if not item_code:
			error_msg = f"No item found for GTIN: {gtin}"
			frappe.logger().warning(f"🏥 SurgiShopERPNext: {error_msg}")
			frappe.response["message"] = {
				"found_item": None,
				"error": error_msg,
				"gtin": gtin
			}
			return

		# Verify item exists and is active
		item_info = frappe.get_cached_value("Item", item_code, ["disabled", "has_batch_no"], as_dict=True)
		
		if not item_info:
			error_msg = f"Item {item_code} not found in system"
			frappe.logger().error(f"🏥 SurgiShopERPNext: {error_msg}")
			frappe.throw(_(error_msg))
		
		if item_info.get("disabled"):
			frappe.logger().warning(f"🏥 SurgiShopERPNext: Item {item_code} is disabled")
			frappe.throw(_("Item {0} is disabled").format(item_code))
		
		if not item_info.get("has_batch_no"):
			frappe.logger().warning(f"🏥 SurgiShopERPNext: Item {item_code} does not use batches")
			frappe.throw(_("Item {0} does not use batch numbers").format(item_code))

		# 2) Form the batch_id as itemcode-lot to avoid conflicts
		batch_id = f"{item_code}-{lot}"
		frappe.logger().info(f"🏥 SurgiShopERPNext: Looking for batch_id: {batch_id}")

		# 3) Check if the batch already exists by "batch_id"
		batch_name = frappe.db.exists("Batch", {"batch_id": batch_id})
		batch_doc = None

		if not batch_name:
			frappe.logger().info(f"🏥 SurgiShopERPNext: Creating new batch: {batch_id}")
			
			# Create new batch
			new_batch = frappe.get_doc({
				"doctype": "Batch",
				"item": item_code,
				"batch_id": batch_id
			})

			# Parse and set expiry date if provided
			if expiry and len(expiry) == 6:
				try:
					# Attempt to parse YYMMDD format
					expiry_date_obj = datetime.strptime(expiry, '%y%m%d')
					new_batch.expiry_date = expiry_date_obj.strftime('%Y-%m-%d')
					frappe.logger().info(f"🏥 SurgiShopERPNext: Parsed expiry date: {new_batch.expiry_date}")
				except ValueError as ve:
					# Log warning but continue without expiry date (for research purposes)
					frappe.logger().warning(f"🏥 SurgiShopERPNext: Could not parse expiry date '{expiry}': {str(ve)}")
					frappe.log_error(
						title="GS1 Expiry Date Parse Error",
						message=f"Could not parse expiry date: {expiry}\nError: {str(ve)}\nBatch will be created without expiry date."
					)
			elif expiry:
				frappe.logger().warning(f"🏥 SurgiShopERPNext: Invalid expiry format (expected 6 digits): {expiry}")

			# Insert batch with permission bypass (research purposes - documented in security audit)
			new_batch.insert(ignore_permissions=True)
			batch_doc = new_batch
			frappe.logger().info(f"🏥 SurgiShopERPNext: Successfully created batch: {batch_doc.name}")
		else:
			# Batch already exists, retrieve it
			batch_doc = frappe.get_doc("Batch", batch_name)
			frappe.logger().info(f"🏥 SurgiShopERPNext: Found existing batch: {batch_doc.name}")
			
			# Check if we need to update the expiry date
			# Only update if the batch doesn't have an expiry date and we have one from the scan
			if not batch_doc.expiry_date and expiry and len(expiry) == 6:
				try:
					# Parse the new expiry date from GS1 scan
					expiry_date_obj = datetime.strptime(expiry, '%y%m%d')
					new_expiry_date = expiry_date_obj.strftime('%Y-%m-%d')
					
					# Update the batch with the new expiry date
					batch_doc.expiry_date = new_expiry_date
					batch_doc.save(ignore_permissions=True)
					frappe.logger().info(f"🏥 SurgiShopERPNext: Updated existing batch {batch_doc.name} with expiry date: {new_expiry_date}")
				except ValueError as ve:
					frappe.logger().warning(f"🏥 SurgiShopERPNext: Could not parse expiry date '{expiry}' for existing batch: {str(ve)}")
			elif batch_doc.expiry_date and expiry:
				frappe.logger().info(f"🏥 SurgiShopERPNext: Batch {batch_doc.name} already has expiry date: {batch_doc.expiry_date}")

		# 4) Return found_item, final batch name, and batch_expiry_date
		result = {
			"found_item": item_code,
			"batch": batch_doc.name,
			"gtin": gtin,
			"expiry": expiry,
			"lot": lot,
			"batch_expiry_date": batch_doc.expiry_date if batch_doc.expiry_date else None
		}
		
		frappe.logger().info(f"🏥 SurgiShopERPNext: GS1 parsing successful: {result}")
		frappe.response["message"] = result
		
	except frappe.ValidationError as ve:
		# Re-raise validation errors to show to user
		frappe.logger().error(f"🏥 SurgiShopERPNext: Validation error in GS1 parser: {str(ve)}")
		raise
	except Exception as e:
		# Log unexpected errors with full traceback
		error_msg = f"Unexpected error processing GS1 barcode: {str(e)}"
		frappe.logger().error(f"🏥 SurgiShopERPNext: {error_msg}")
		frappe.log_error(title="GS1 Parser Unexpected Error", message=frappe.get_traceback())
		frappe.response["message"] = {
			"found_item": None,
			"error": error_msg,
			"gtin": gtin
		}
		# Don't throw here - return error in response instead
