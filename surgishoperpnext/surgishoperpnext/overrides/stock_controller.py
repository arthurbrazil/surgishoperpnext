# Copyright (c) 2024, SurgiShop and Contributors
# License: MIT. See license.txt

import frappe
from frappe import _
from frappe.utils import getdate, get_link_to_form
from erpnext.controllers.stock_controller import StockController as ERPNextStockController
from erpnext.controllers.stock_controller import BatchExpiredError


class StockController(ERPNextStockController):
	"""
	Override ERPNext StockController to allow expired products for inbound transactions.
	This removes the batch expiry validation for incoming stock movements.
	"""

	def validate_serialized_batch(self):
		"""
		Override the parent method to skip batch expiry validation for inbound transactions.
		This allows expired products to be received into the system.
		"""
		from erpnext.stock.doctype.serial_no.serial_no import get_serial_nos

		is_material_issue = False
		if self.doctype == "Stock Entry" and self.purpose in ["Material Issue", "Material Transfer"]:
			is_material_issue = True

		for d in self.get("items"):
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
			if self._is_inbound_transaction(d):
				continue

			# Keep the original batch expiry validation for outbound transactions
			if (
				flt(d.qty) > 0.0 
				and d.get("batch_no") 
				and self.get("posting_date") 
				and self.docstatus < 2
			):
				expiry_date = frappe.get_cached_value("Batch", d.get("batch_no"), "expiry_date")

				if expiry_date and getdate(expiry_date) < getdate(self.posting_date):
					frappe.throw(
						_("Row #{0}: The batch {1} has already expired.").format(
							d.idx, get_link_to_form("Batch", d.get("batch_no"))
						),
						BatchExpiredError,
					)

	def _is_inbound_transaction(self, item_row):
		"""
		Determine if this is an inbound transaction based on the document type and item details.
		Returns True for transactions that bring stock into the system.
		"""
		# Purchase transactions are generally inbound
		if self.doctype in ["Purchase Receipt", "Purchase Invoice"]:
			return True
		
		# Stock Entry with Material Receipt purpose
		if self.doctype == "Stock Entry" and self.purpose == "Material Receipt":
			return True
		
		# Stock Entry with Material Transfer - check if it's moving TO a warehouse
		if self.doctype == "Stock Entry" and self.purpose == "Material Transfer":
			# If there's a target warehouse and no source warehouse, it's inbound
			if item_row.get("t_warehouse") and not item_row.get("s_warehouse"):
				return True
		
		# Stock Reconciliation - generally inbound when increasing stock
		if self.doctype == "Stock Reconciliation" and flt(item_row.get("qty", 0)) > 0:
			return True
		
		# Sales returns are inbound
		if self.doctype in ["Sales Invoice", "Delivery Note"] and self.get("is_return"):
			return True
		
		# Purchase returns are outbound (not inbound)
		if self.doctype in ["Purchase Invoice", "Purchase Receipt"] and self.get("is_return"):
			return False
		
		# Default to False for other cases
		return False