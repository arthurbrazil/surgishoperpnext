# Copyright (c) 2024, SurgiShop and Contributors
# License: MIT. See license.txt

import frappe
import unittest
from surgishoperpnext.surgishoperpnext.api.barcode import (
	scan_barcode,
	get_item_by_barcode,
	validate_barcode
)


class TestBarcodeAPI(unittest.TestCase):
	"""Test cases for the custom barcode scanning API"""

	@classmethod
	def setUpClass(cls):
		"""Set up test data"""
		# Create test item if it doesn't exist
		if not frappe.db.exists('Item', 'TEST-BARCODE-ITEM'):
			test_item = frappe.get_doc({
				'doctype': 'Item',
				'item_code': 'TEST-BARCODE-ITEM',
				'item_name': 'Test Barcode Item',
				'stock_uom': 'Nos',
				'is_stock_item': 1,
				'has_batch_no': 1,
				'create_new_batch': 1
			})
			test_item.insert(ignore_permissions=True)

		# Create test barcode if it doesn't exist
		if not frappe.db.exists('Item Barcode', {'barcode': 'TEST-BARCODE-123'}):
			barcode = frappe.get_doc({
				'doctype': 'Item Barcode',
				'parent': 'TEST-BARCODE-ITEM',
				'parenttype': 'Item',
				'parentfield': 'barcodes',
				'barcode': 'TEST-BARCODE-123',
				'uom': 'Nos'
			})
			barcode.insert(ignore_permissions=True)

		frappe.db.commit()

	def test_scan_barcode_valid(self):
		"""Test scanning a valid barcode"""
		result = scan_barcode('TEST-BARCODE-123')
		
		self.assertIsNotNone(result)
		self.assertEqual(result.get('item_code'), 'TEST-BARCODE-ITEM')
		self.assertEqual(result.get('barcode'), 'TEST-BARCODE-123')

	def test_scan_barcode_invalid(self):
		"""Test scanning an invalid barcode"""
		result = scan_barcode('INVALID-BARCODE-XYZ')
		
		self.assertIsInstance(result, dict)
		self.assertEqual(len(result), 0)

	def test_get_item_by_barcode(self):
		"""Test get_item_by_barcode function"""
		result = get_item_by_barcode('TEST-BARCODE-123')
		
		self.assertIsNotNone(result)
		self.assertEqual(result.get('item_code'), 'TEST-BARCODE-ITEM')

	def test_validate_barcode_valid(self):
		"""Test validating a valid barcode"""
		result = validate_barcode('TEST-BARCODE-123')
		
		self.assertTrue(result)

	def test_validate_barcode_invalid(self):
		"""Test validating an invalid barcode"""
		result = validate_barcode('NONEXISTENT-BARCODE')
		
		self.assertFalse(result)

	def test_validate_barcode_empty(self):
		"""Test validating an empty barcode"""
		result = validate_barcode('')
		
		self.assertFalse(result)

	def test_scan_barcode_with_context(self):
		"""Test scanning with context parameters"""
		ctx = {
			'company': 'Test Company',
			'set_warehouse': 'Stores - TC'
		}
		
		result = scan_barcode('TEST-BARCODE-123', ctx)
		
		self.assertIsNotNone(result)
		self.assertEqual(result.get('item_code'), 'TEST-BARCODE-ITEM')

	@classmethod
	def tearDownClass(cls):
		"""Clean up test data"""
		# Clean up in reverse order to avoid foreign key issues
		if frappe.db.exists('Item Barcode', {'barcode': 'TEST-BARCODE-123'}):
			frappe.db.delete('Item Barcode', {'barcode': 'TEST-BARCODE-123'})
		
		if frappe.db.exists('Item', 'TEST-BARCODE-ITEM'):
			frappe.delete_doc('Item', 'TEST-BARCODE-ITEM', force=True)
		
		frappe.db.commit()


# Run tests
def run_tests():
	"""Helper function to run tests"""
	unittest.main()
