# Copyright (c) 2024, SurgiShop and Contributors
# License: MIT. See license.txt

import frappe

def execute():
    """Fix get_desktop_page function call issue for version mismatch"""
    
    # This fixes the get_desktop_page error caused by version mismatch
    # between Frappe v15.83.0 and ERPNext v15.80.0
    
    try:
        # Store original function
        original_get_desktop_page = frappe.desk.desktop.get_desktop_page
        
        def patched_get_desktop_page(page=None, **kwargs):
            # If no page is provided, default to 'workspace'
            if page is None:
                page = 'workspace'
            return original_get_desktop_page(page, **kwargs)
        
        # Apply the patch
        frappe.desk.desktop.get_desktop_page = patched_get_desktop_page
        
        frappe.logger().info("SurgiShopERPNext: Applied get_desktop_page fix for version mismatch")
        
    except Exception as e:
        frappe.logger().error(f"SurgiShopERPNext: Error applying get_desktop_page fix: {str(e)}")
