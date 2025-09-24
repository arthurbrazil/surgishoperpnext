# Copyright (c) 2024, SurgiShop and Contributors
# License: MIT. See license.txt

import frappe
from frappe import _
from frappe.utils import flt, get_link_to_form

@frappe.whitelist()
def get_item_by_gtin(gtin):
    """
    Look up item by GTIN-01 barcode
    """
    frappe.logger().info(f"SurgiShopERPNext: Looking up item by GTIN-01: {gtin}")
    
    if not gtin:
        frappe.throw("GTIN-01 is required")
    
    # Clean the GTIN (remove any non-numeric characters)
    clean_gtin = ''.join(filter(str.isdigit, str(gtin)))
    
    if len(clean_gtin) != 14:
        frappe.throw(f"Invalid GTIN-01 format. Expected 14 digits, got {len(clean_gtin)}")
    
    frappe.logger().info(f"SurgiShopERPNext: Cleaned GTIN-01: {clean_gtin}")
    
    # Search for item by barcode in Item Barcode child table
    item_barcode = frappe.get_value("Item Barcode", 
        {"barcode": clean_gtin}, 
        ["parent", "uom"], as_dict=True)
    
    if item_barcode:
        frappe.logger().info(f"SurgiShopERPNext: Found item by barcode: {item_barcode.parent}")
        
        # Get item details
        item = frappe.get_doc("Item", item_barcode.parent)
        
        if item.disabled:
            frappe.throw(f"Item {item.name} is disabled")
        
        # Get valuation rate
        valuation_rate = frappe.get_value("Item", item.name, "valuation_rate") or 0
        
        return {
            "item_code": item.name,
            "item_name": item.item_name,
            "uom": item_barcode.uom or item.stock_uom,
            "barcode": clean_gtin,
            "rate": flt(valuation_rate),
            "stock_uom": item.stock_uom,
            "is_stock_item": item.is_stock_item,
            "has_serial_no": item.has_serial_no,
            "has_batch_no": item.has_batch_no,
            "default_warehouse": None,  # Add default_warehouse for compatibility
            "has_variants": False,  # Add has_variants for compatibility
            "variant_of": None  # Add variant_of for compatibility
        }
    
    # Fallback: search by item code if GTIN matches item code
    item = frappe.get_value("Item", 
        {"name": clean_gtin}, 
        ["name", "item_name", "stock_uom", "valuation_rate", "disabled", 
         "is_stock_item", "has_serial_no", "has_batch_no"], as_dict=True)
    
    if item:
        if item.disabled:
            frappe.throw(f"Item {item.name} is disabled")
        
        frappe.logger().info(f"SurgiShopERPNext: Found item by item code: {item.name}")
        
        return {
            "item_code": item.name,
            "item_name": item.item_name,
            "uom": item.stock_uom,
            "barcode": clean_gtin,
            "rate": flt(item.valuation_rate),
            "stock_uom": item.stock_uom,
            "is_stock_item": item.is_stock_item,
            "has_serial_no": item.has_serial_no,
            "has_batch_no": item.has_batch_no,
            "default_warehouse": None,  # Add default_warehouse for compatibility
            "has_variants": False,  # Add has_variants for compatibility
            "variant_of": None  # Add variant_of for compatibility
        }
    
    # No item found
    frappe.logger().info(f"SurgiShopERPNext: No item found for GTIN-01: {clean_gtin}")
    return None

@frappe.whitelist()
def scan_barcode_fallback(search_value, ctx=None):
    """
    Fallback barcode scanning method that integrates with ERPNext's scan_barcode API
    This method is called when our GS1 scanner doesn't find a match
    """
    frappe.logger().info(f"SurgiShopERPNext: Fallback barcode scan for: {search_value}")
    
    # Call the original ERPNext scan_barcode method
    from erpnext.stock.utils import scan_barcode as original_scan_barcode
    
    try:
        result = original_scan_barcode(search_value, ctx or {})
        frappe.logger().info(f"SurgiShopERPNext: Fallback scan result: {result}")
        return result
    except Exception as e:
        frappe.logger().error(f"SurgiShopERPNext: Fallback scan error: {str(e)}")
        return {}

@frappe.whitelist()
def validate_gtin_format(gtin):
    """
    Validate GTIN-01 format
    """
    if not gtin:
        return False
    
    # Clean the GTIN
    clean_gtin = ''.join(filter(str.isdigit, str(gtin)))
    
    # Check length
    if len(clean_gtin) != 14:
        return False
    
    # Check if it's a valid GTIN-14
    return True

@frappe.whitelist()
def get_gtin_info(gtin):
    """
    Get detailed information about a GTIN-01
    """
    if not validate_gtin_format(gtin):
        frappe.throw("Invalid GTIN-01 format")
    
    clean_gtin = ''.join(filter(str.isdigit, str(gtin)))
    
    # Parse GTIN-14 structure
    gtin_info = {
        "gtin": clean_gtin,
        "company_prefix": clean_gtin[:7],  # First 7 digits
        "item_reference": clean_gtin[7:13],  # Next 6 digits
        "check_digit": clean_gtin[13],  # Last digit
        "length": len(clean_gtin)
    }
    
    return gtin_info

@frappe.whitelist()
def debug_barcode_scan(barcode, context=""):
    """
    Debug function for barcode scanning
    """
    frappe.logger().info(f"SurgiShopERPNext DEBUG: Barcode scan - {barcode} in context: {context}")
    
    # Try to parse as GS1
    try:
        gtin = get_item_by_gtin(barcode)
        if gtin:
            return {
                "success": True,
                "type": "GS1",
                "gtin": gtin,
                "message": f"Item found: {gtin['item_code']}"
            }
        else:
            return {
                "success": False,
                "type": "GS1",
                "message": "No item found for GTIN-01"
            }
    except Exception as e:
        return {
            "success": False,
            "type": "GS1",
            "error": str(e),
            "message": f"Error processing GS1 barcode: {str(e)}"
        }

