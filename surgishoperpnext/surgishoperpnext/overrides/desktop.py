# Copyright (c) 2024, SurgiShop and Contributors
# License: MIT. See license.txt

import frappe
from frappe import _
import json

@frappe.whitelist()
def get_desktop_page(page=None, **kwargs):
    """
    Override get_desktop_page to handle missing page argument
    This fixes the version mismatch between Frappe v15.83.0 and ERPNext v15.80.0
    """
    # If no page is provided, default to workspace JSON
    if page is None:
        page = json.dumps({"name": "Workspaces"})
    
    # Import the original function and call it
    from frappe.desk.desktop import get_desktop_page as original_get_desktop_page
    return original_get_desktop_page(page, **kwargs)
