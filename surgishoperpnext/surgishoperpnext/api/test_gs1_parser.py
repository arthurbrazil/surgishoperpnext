# Copyright (c) 2024, SurgiShop and Contributors
# License: MIT. See license.txt

import frappe
import unittest
from surgishoperpnext.surgishoperpnext.api.gs1_parser import parse_gs1_and_get_batch


class TestGS1Parser(unittest.TestCase):
	"""Test cases for GS1 barcode parsing and batch creation"""

	@classmethod
	def setUpClass(cls):
		"""Set up test data"""
		# Create test item if it doesn't exist
		if not frappe.db.exists('Item', 'TEST-GS1-ITEM'):
			test_item = frappe.get_doc({
				'doctype': 'Item',
				'item_code': 'TEST-GS1-ITEM',
				'item_name': 'Test GS1 Item',
				'stock_uom': 'Nos',
				'is_stock_item': 1,
				'has_batch_no': 1,
				'create_new_batch': 1
			})
			test_item.insert(ignore_permissions=True)

		# Create test barcode (GTIN) if it doesn't exist
		if not frappe.db.exists('Item Barcode', {'barcode': '12345678901234'}):
			barcode = frappe.get_doc({
				'doctype': 'Item Barcode',
				'parent': 'TEST-GS1-ITEM',
				'parenttype': 'Item',
				'parentfield': 'barcodes',
				'barcode': '12345678901234',
				'uom': 'Nos'
			})
			barcode.insert(ignore_permissions=True)

		frappe.db.commit()

	def test_parse_gs1_valid(self):
		"""Test parsing valid GS1 barcode and creating batch"""
		gtin = '12345678901234'
		lot = 'LOT123'
		expiry = '250131'  # Jan 31, 2025
		
		result = parse_gs1_and_get_batch(gtin, expiry, lot)
		
		self.assertIsNotNone(frappe.response.get('message'))
		message = frappe.response['message']
		
		self.assertEqual(message.get('found_item'), 'TEST-GS1-ITEM')
		self.assertEqual(message.get('gtin'), gtin)
		self.assertEqual(message.get('lot'), lot)
		self.assertIsNotNone(message.get('batch'))

	def test_parse_gs1_missing_gtin(self):
		"""Test parsing with missing GTIN"""
		with self.assertRaises(frappe.ValidationError):
			parse_gs1_and_get_batch('', '250131', 'LOT123')

	def test_parse_gs1_missing_lot(self):
		"""Test parsing with missing lot number"""
		with self.assertRaises(frappe.ValidationError):
			parse_gs1_and_get_batch('12345678901234', '250131', '')

	def test_parse_gs1_invalid_gtin(self):
		"""Test parsing with invalid GTIN (not found)"""
		gtin = '99999999999999'
		lot = 'LOT999'
		expiry = '250131'
		
		parse_gs1_and_get_batch(gtin, expiry, lot)
		
		message = frappe.response.get('message')
		self.assertIsNotNone(message)
		self.assertIsNone(message.get('found_item'))
		self.assertIn('error', message)

	def test_parse_gs1_invalid_expiry_format(self):
		"""Test parsing with invalid expiry format (should create batch without expiry)"""
		gtin = '12345678901234'
		lot = 'LOT456'
		expiry = '99'  # Invalid format
		
		result = parse_gs1_and_get_batch(gtin, expiry, lot)
		
		message = frappe.response.get('message')
		self.assertIsNotNone(message)
		self.assertEqual(message.get('found_item'), 'TEST-GS1-ITEM')
		# Batch should be created even with invalid expiry

	def test_parse_gs1_existing_batch(self):
		"""Test parsing when batch already exists"""
		gtin = '12345678901234'
		lot = 'LOT_EXISTING'
		expiry = '250228'
		
		# First call - creates batch
		parse_gs1_and_get_batch(gtin, expiry, lot)
		first_message = frappe.response.get('message')
		first_batch = first_message.get('batch')
		
		# Second call - should find existing batch
		parse_gs1_and_get_batch(gtin, expiry, lot)
		second_message = frappe.response.get('message')
		second_batch = second_message.get('batch')
		
		self.assertEqual(first_batch, second_batch)

	def test_parse_gs1_whitespace_handling(self):
		"""Test that whitespace is properly stripped from inputs"""
		gtin = '  12345678901234  '
		lot = '  LOT789  '
		expiry = '  250131  '
		
		result = parse_gs1_and_get_batch(gtin, expiry, lot)
		
		message = frappe.response.get('message')
		self.assertEqual(message.get('found_item'), 'TEST-GS1-ITEM')

	@classmethod
	def tearDownClass(cls):
		"""Clean up test data"""
		# Clean up batches
		batches = frappe.get_all('Batch', filters={'item': 'TEST-GS1-ITEM'}, pluck='name')
		for batch in batches:
			frappe.delete_doc('Batch', batch, force=True)
		
		# Clean up barcodes
		if frappe.db.exists('Item Barcode', {'barcode': '12345678901234'}):
			frappe.db.delete('Item Barcode', {'barcode': '12345678901234'})
		
		# Clean up item
		if frappe.db.exists('Item', 'TEST-GS1-ITEM'):
			frappe.delete_doc('Item', 'TEST-GS1-ITEM', force=True)
		
		frappe.db.commit()


# Run tests
def run_tests():
	"""Helper function to run tests"""
	unittest.main()
