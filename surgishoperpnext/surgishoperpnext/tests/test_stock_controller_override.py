# Copyright (c) 2024, SurgiShop and Contributors
# License: MIT. See license.txt

import unittest
import frappe
from frappe.tests.utils import FrappeTestCase
from surgishoperpnext.overrides.stock_controller import StockController


class TestStockControllerOverride(FrappeTestCase):
	"""
	Test cases for the custom StockController override that allows expired products for inbound transactions.
	"""

	def setUp(self):
		"""Set up test data"""
		self.stock_controller = StockController()

	def test_is_inbound_transaction_purchase_receipt(self):
		"""Test that Purchase Receipt is identified as inbound transaction"""
		self.stock_controller.doctype = "Purchase Receipt"
		item_row = frappe._dict({"qty": 10})
		
		result = self.stock_controller._is_inbound_transaction(item_row)
		self.assertTrue(result, "Purchase Receipt should be identified as inbound transaction")

	def test_is_inbound_transaction_purchase_invoice(self):
		"""Test that Purchase Invoice is identified as inbound transaction"""
		self.stock_controller.doctype = "Purchase Invoice"
		item_row = frappe._dict({"qty": 10})
		
		result = self.stock_controller._is_inbound_transaction(item_row)
		self.assertTrue(result, "Purchase Invoice should be identified as inbound transaction")

	def test_is_inbound_transaction_stock_entry_material_receipt(self):
		"""Test that Stock Entry with Material Receipt purpose is identified as inbound"""
		self.stock_controller.doctype = "Stock Entry"
		self.stock_controller.purpose = "Material Receipt"
		item_row = frappe._dict({"qty": 10})
		
		result = self.stock_controller._is_inbound_transaction(item_row)
		self.assertTrue(result, "Stock Entry with Material Receipt should be inbound")

	def test_is_inbound_transaction_stock_entry_material_transfer_inbound(self):
		"""Test that Stock Entry with Material Transfer to warehouse only is inbound"""
		self.stock_controller.doctype = "Stock Entry"
		self.stock_controller.purpose = "Material Transfer"
		item_row = frappe._dict({"t_warehouse": "Test Warehouse", "s_warehouse": None})
		
		result = self.stock_controller._is_inbound_transaction(item_row)
		self.assertTrue(result, "Stock Entry with only target warehouse should be inbound")

	def test_is_inbound_transaction_stock_reconciliation_positive_qty(self):
		"""Test that Stock Reconciliation with positive qty is inbound"""
		self.stock_controller.doctype = "Stock Reconciliation"
		item_row = frappe._dict({"qty": 10})
		
		result = self.stock_controller._is_inbound_transaction(item_row)
		self.assertTrue(result, "Stock Reconciliation with positive qty should be inbound")

	def test_is_inbound_transaction_sales_return(self):
		"""Test that Sales Invoice return is inbound"""
		self.stock_controller.doctype = "Sales Invoice"
		self.stock_controller.is_return = True
		item_row = frappe._dict({"qty": 10})
		
		result = self.stock_controller._is_inbound_transaction(item_row)
		self.assertTrue(result, "Sales Invoice return should be inbound")

	def test_is_outbound_transaction_purchase_return(self):
		"""Test that Purchase Invoice return is outbound"""
		self.stock_controller.doctype = "Purchase Invoice"
		self.stock_controller.is_return = True
		item_row = frappe._dict({"qty": 10})
		
		result = self.stock_controller._is_inbound_transaction(item_row)
		self.assertFalse(result, "Purchase Invoice return should be outbound")

	def test_is_outbound_transaction_stock_entry_material_issue(self):
		"""Test that Stock Entry with Material Issue is outbound"""
		self.stock_controller.doctype = "Stock Entry"
		self.stock_controller.purpose = "Material Issue"
		item_row = frappe._dict({"qty": 10})
		
		result = self.stock_controller._is_inbound_transaction(item_row)
		self.assertFalse(result, "Stock Entry with Material Issue should be outbound")

	def test_is_outbound_transaction_stock_entry_material_transfer_outbound(self):
		"""Test that Stock Entry with both source and target warehouse is outbound"""
		self.stock_controller.doctype = "Stock Entry"
		self.stock_controller.purpose = "Material Transfer"
		item_row = frappe._dict({"t_warehouse": "Target Warehouse", "s_warehouse": "Source Warehouse"})
		
		result = self.stock_controller._is_inbound_transaction(item_row)
		self.assertFalse(result, "Stock Entry with both warehouses should be outbound")