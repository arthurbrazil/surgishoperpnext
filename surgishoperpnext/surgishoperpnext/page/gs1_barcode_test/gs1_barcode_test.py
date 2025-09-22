# Copyright (c) 2024, SurgiShop and Contributors
# License: MIT. See license.txt

import frappe
from frappe import _

def get_context(context):
    context.title = _("GS1 Barcode Test")
    context.breadcrumbs = [
        {"label": _("Home"), "route": "/"},
        {"label": _("GS1 Barcode Test"), "route": "/gs1-barcode-test"}
    ]
    
    # Add any additional context data here
    context.app_name = "surgishoperpnext"
    context.version = "0.0.1"
    
    return context

