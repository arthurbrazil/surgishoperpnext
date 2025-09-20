# Copyright (c) 2024, SurgiShop and Contributors
# License: MIT. See license.txt

import frappe
from frappe import _
from frappe.utils import getdate, get_link_to_form, flt
from erpnext.controllers.stock_controller import BatchExpiredError


def is_inbound_transaction(doc, item_row):
	"""
	Determine if this is an inbound transaction based on the document type and item details.
	Returns True for transactions that bring stock into the system.
	"""
	# Purchase transactions are generally inbound
	if doc.doctype in ["Purchase Receipt", "Purchase Invoice"]:
		return True
	
	# Stock Entry with Material Receipt purpose
	if doc.doctype == "Stock Entry" and doc.purpose == "Material Receipt":
		return True
	
	# Stock Entry with Material Transfer - check if it's moving TO a warehouse
	if doc.doctype == "Stock Entry" and doc.purpose == "Material Transfer":
		# If there's a target warehouse and no source warehouse, it's inbound
		if item_row.get("t_warehouse") and not item_row.get("s_warehouse"):
			return True
	
	# Stock Reconciliation - generally inbound when increasing stock
	if doc.doctype == "Stock Reconciliation" and flt(item_row.get("qty", 0)) > 0:
		return True
	
	# Sales returns are inbound
	if doc.doctype in ["Sales Invoice", "Delivery Note"] and doc.get("is_return"):
		return True
	
	# Purchase returns are outbound (not inbound)
	if doc.doctype in ["Purchase Invoice", "Purchase Receipt"] and doc.get("is_return"):
		return False
	
	# Default to False for other cases
	return False


def validate_serialized_batch_with_expired_override(doc, method):
	"""
	Override the validate_serialized_batch method to allow expired products for inbound transactions.
	This is called via doc_events hook for better update-proofing.
	"""
	from erpnext.stock.doctype.serial_no.serial_no import get_serial_nos

	is_material_issue = False
	if doc.doctype == "Stock Entry" and doc.purpose in ["Material Issue", "Material Transfer"]:
		is_material_issue = True

	for d in doc.get("items"):
		if hasattr(d, "serial_no") and hasattr(d, "batch_no") and d.serial_no and d.batch_no:
			serial_nos = frappe.get_all(
				"Serial No",
				fields=["batch_no", "name", "warehouse"],
				filters={"name": ("in", get_serial_nos(d.serial_no))},
			)

			for row in serial_nos:
				if row.warehouse and row.batch_no != d.batch_no:
					frappe.throw(
						_("Row #{0}: Serial No {1} does not belong to Batch {2}").format(
							d.idx, row.name, d.batch_no
						)
					)

		# Skip batch expiry validation for material issues
		if is_material_issue:
			continue

		# Skip batch expiry validation for inbound transactions
		# This allows expired products to be received into the system
		if is_inbound_transaction(doc, d):
			continue

		# Keep the original batch expiry validation for outbound transactions
		if (
			flt(d.qty) > 0.0 
			and d.get("batch_no") 
			and doc.get("posting_date") 
			and doc.docstatus < 2
		):
			expiry_date = frappe.get_cached_value("Batch", d.get("batch_no"), "expiry_date")

			if expiry_date and getdate(expiry_date) < getdate(doc.posting_date):
				frappe.throw(
					_("Row #{0}: The batch {1} has already expired.").format(
						d.idx, get_link_to_form("Batch", d.get("batch_no"))
					),
					BatchExpiredError,
				)