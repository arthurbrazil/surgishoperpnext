# Copyright (c) 2024, SurgiShop and Contributors
# License: MIT. See license.txt

import frappe
import re
from datetime import datetime

@frappe.whitelist()
def parse_gs1_and_get_batch(gtin, expiry, lot):
	"""
	API endpoint to find an item by GTIN, and then find or create a batch for it
	using the lot and expiry date.
	"""
	if not gtin or not lot:
		frappe.throw(_("GTIN and Lot Number are required."))

	# 1) Lookup the Item via "Item Barcode"
	item_code = frappe.db.get_value("Item Barcode", {"barcode": gtin}, "parent")

	if not item_code:
		frappe.response["message"] = {
			"found_item": None,
			"error": "No item found for the given GTIN.",
			"gtin": gtin
		}
		return

	# 2) Form the batch_id as itemcode-lot to avoid conflicts
	batch_id = f"{item_code}-{lot}"

	# 3) Check if the batch already exists by "batch_id"
	batch_name = frappe.db.exists("Batch", {"batch_id": batch_id})
	batch_doc = None

	if not batch_name:
		# Create new batch
		new_batch = frappe.get_doc({
			"doctype": "Batch",
			"item": item_code,
			"batch_id": batch_id
		})

		# If we have an expiry in YYMMDD format, set new_batch.expiry_date
		if len(expiry) == 6:
			try:
				# Attempt to parse YYMMDD format
				expiry_date_obj = datetime.strptime(expiry, '%y%m%d')
				new_batch.expiry_date = expiry_date_obj.strftime('%Y-%m-%d')
			except ValueError:
				frappe.log_error(f"Could not parse expiry date: {expiry}", "GS1 Parser Error")
				# Decide if you want to fail here or proceed without expiry
				# For now, we'll proceed without it.

		new_batch.insert(ignore_permissions=True) # Usually called from barcode scanner, so ignore perms
		batch_doc = new_batch
	else:
		batch_doc = frappe.get_doc("Batch", batch_name)

	# 5) Return found_item, final batch name, and batch_expiry_date
	frappe.response["message"] = {
		"found_item": item_code,
		"batch": batch_doc.name,
		"gtin": gtin,
		"expiry": expiry,
		"lot": lot,
		"batch_expiry_date": batch_doc.expiry_date if batch_doc.expiry_date else None
	}
