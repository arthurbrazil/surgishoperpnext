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
    # If no page is provided, try to get the default workspace
    if page is None:
        try:
            # Try to get the first available workspace
            workspaces = frappe.get_all("Workspace", fields=["name"], limit=1)
            if workspaces:
                page = json.dumps({"name": workspaces[0].name})
            else:
                # Fallback to a generic workspace name
                page = json.dumps({"name": "Home"})
        except Exception:
            # Ultimate fallback
            page = json.dumps({"name": "Home"})
    
    # Import the original function and call it
    from frappe.desk.desktop import get_desktop_page as original_get_desktop_page
    return original_get_desktop_page(page, **kwargs)
