# Copyright (c) 2024, SurgiShop and Contributors
# License: MIT. See license.txt

import frappe
from frappe import _
from frappe.utils import flt, getdate


@frappe.whitelist()
def scan_barcode(search_value: str, ctx: dict | str | None = None) -> dict:
    """
    Custom barcode scanning function for SurgiShopERPNext.
    Overrides ERPNext's default barcode scanning with custom logic.
    """
    if ctx is None:
        ctx = frappe._dict()
    
    frappe.logger().info(f"🏥 SurgiShopERPNext: Custom barcode scan for: {search_value}")
    
    # Search barcode in Item Barcode table
    barcode_data = frappe.db.get_value(
        "Item Barcode",
        {"barcode": search_value},
        ["barcode", "parent as item_code", "uom"],
        as_dict=True,
    )
    if barcode_data:
        frappe.logger().info(f"🏥 SurgiShopERPNext: Found barcode in Item Barcode: {barcode_data}")
        return _get_item_details(barcode_data, ctx)
    
    # Search serial no
    serial_no_data = frappe.db.get_value(
        "Serial No",
        search_value,
        ["name as serial_no", "item_code", "batch_no"],
        as_dict=True,
    )
    if serial_no_data:
        frappe.logger().info(f"🏥 SurgiShopERPNext: Found serial no: {serial_no_data}")
        return _get_item_details(serial_no_data, ctx)
    
    # Search batch no - but skip if this looks like a GS1 barcode
    # GS1 barcodes start with AI 01 (GTIN) which is 14 digits after the "01" prefix
    # So valid GS1 barcodes should be at least 16 characters and start with "01"
    is_likely_gs1 = (
        len(search_value) >= 16 and 
        search_value.startswith("01") and 
        search_value[2:16].isdigit()  # Next 14 chars should be digits (GTIN)
    )
    
    if not is_likely_gs1:
        batch_no_data = frappe.db.get_value(
            "Batch",
            search_value,
            ["name as batch_no", "item as item_code"],
            as_dict=True,
        )
        if batch_no_data:
            if frappe.get_cached_value("Item", batch_no_data.item_code, "has_serial_no"):
                frappe.throw(
                    _(
                        "Batch No {0} is linked with Item {1} which has serial no. Please scan serial no instead."
                    ).format(search_value, batch_no_data.item_code)
                )
            
            frappe.logger().info(f"🏥 SurgiShopERPNext: Found batch no: {batch_no_data}")
            return _get_item_details(batch_no_data, ctx)
    else:
        frappe.logger().info(f"🏥 SurgiShopERPNext: Skipping batch search for likely GS1 barcode: {search_value}")
    
    # Search warehouse
    warehouse = frappe.get_cached_value("Warehouse", search_value, ("name", "disabled"), as_dict=True)
    if warehouse and not warehouse.disabled:
        warehouse_data = {"warehouse": warehouse.name}
        frappe.logger().info(f"🏥 SurgiShopERPNext: Found warehouse: {warehouse_data}")
        return warehouse_data
    
    # If no match found, return empty dict
    frappe.logger().info(f"🏥 SurgiShopERPNext: No match found for: {search_value}")
    return {}


def _get_item_details(scan_result: dict, ctx: dict) -> dict:
    """Get additional item details for the scan result."""
    item_code = scan_result.get("item_code")
    if not item_code:
        return scan_result
    
    # Get item details
    item_info = frappe.get_cached_value(
        "Item",
        item_code,
        ("has_batch_no", "has_serial_no", "item_name", "stock_uom", "is_stock_item"),
        as_dict=True,
    )
    
    if item_info:
        scan_result.update(item_info)
    
    # Get default warehouse if available
    if ctx and hasattr(ctx, 'get'):
        from erpnext.stock.get_item_details import get_item_warehouse_
        if warehouse := get_item_warehouse_(ctx, frappe._dict(name=item_code), overwrite_warehouse=True):
            scan_result["default_warehouse"] = warehouse
    
    # Get item rate if available
    try:
        from erpnext.stock.get_item_details import get_item_details
        item_details = get_item_details({
            "item_code": item_code,
            "company": ctx.get("company") if ctx else None,
            "warehouse": ctx.get("set_warehouse") if ctx else None,
        })
        
        if item_details:
            scan_result["rate"] = item_details.get("rate", 0)
            scan_result["stock_uom"] = item_details.get("stock_uom", item_info.get("stock_uom"))
    except Exception as e:
        frappe.logger().error(f"🏥 SurgiShopERPNext: Error getting item details: {str(e)}")
    
    frappe.logger().info(f"🏥 SurgiShopERPNext: Enhanced scan result: {scan_result}")
    return scan_result


@frappe.whitelist()
def get_item_by_barcode(barcode: str) -> dict:
    """
    Get item details by barcode.
    Simple API for barcode lookup.
    """
    result = scan_barcode(barcode)
    return result


@frappe.whitelist()
def validate_barcode(barcode: str) -> bool:
    """
    Validate if a barcode exists in the system.
    """
    if not barcode:
        return False
    
    # Check if barcode exists in any of the tables
    exists = (
        frappe.db.exists("Item Barcode", {"barcode": barcode}) or
        frappe.db.exists("Serial No", barcode) or
        frappe.db.exists("Batch", barcode) or
        frappe.db.exists("Warehouse", barcode)
    )
    
    return bool(exists)
