/**
 * SurgiShopERPNext - Conditional Initialization
 * Only loads barcode scanning functionality when in supported doctypes
 */

console.log("🏥 SurgiShopERPNext: Conditional initialization script loaded");

// Supported doctypes for barcode scanning
const SUPPORTED_DOCTYPES = [
    'Stock Entry', 'Purchase Order', 'Purchase Receipt', 
    'Purchase Invoice', 'Sales Invoice', 'Delivery Note', 
    'Stock Reconciliation'
];

/**
 * Get current doctype from various sources
 */
function getCurrentDoctype() {
    let currentDoctype = null;
    
    // Try to get doctype from current form
    if (frappe.get_cur_frm && frappe.get_cur_frm()) {
        currentDoctype = frappe.get_cur_frm().doctype;
        console.log("🏥 SurgiShopERPNext: Doctype from current form:", currentDoctype);
        return currentDoctype;
    }
    
    // Try to get doctype from URL
    if (frappe.get_route) {
        const route = frappe.get_route();
        if (route && route[0] === 'Form' && route[1]) {
            currentDoctype = route[1];
            console.log("🏥 SurgiShopERPNext: Doctype from URL route:", currentDoctype);
            return currentDoctype;
        }
    }
    
    // Try to get doctype from page title
    const pageTitle = document.title;
    for (const doctype of SUPPORTED_DOCTYPES) {
        if (pageTitle.includes(doctype)) {
            currentDoctype = doctype;
            console.log("🏥 SurgiShopERPNext: Doctype from page title:", currentDoctype);
            return currentDoctype;
        }
    }
    
    console.log("🏥 SurgiShopERPNext: No doctype detected");
    return null;
}

/**
 * Check if current doctype is supported
 */
function isSupportedDoctype() {
    const currentDoctype = getCurrentDoctype();
    const isSupported = currentDoctype && SUPPORTED_DOCTYPES.includes(currentDoctype);
    
    console.log("🏥 SurgiShopERPNext: Current doctype:", currentDoctype);
    console.log("🏥 SurgiShopERPNext: Is supported:", isSupported);
    console.log("🏥 SurgiShopERPNext: Supported doctypes:", SUPPORTED_DOCTYPES);
    
    return isSupported;
}

/**
 * Initialize SurgiShopERPNext functionality
 */
function initializeSurgiShopERPNext() {
    console.log("🏥 SurgiShopERPNext: Initializing SurgiShopERPNext functionality...");
    
    if (!isSupportedDoctype()) {
        console.log("🏥 SurgiShopERPNext: Not in a supported doctype, skipping initialization");
        return;
    }
    
    console.log("🏥 SurgiShopERPNext: Supported doctype detected, initializing all components...");
    
    // Initialize batch expiry override status
    console.log(
        "%c🏥 SurgiShopERPNext Batch Expiry Override Active",
        "color: #10b981; font-weight: bold; font-size: 14px;"
    );
    console.log("Batch expiry validation completely disabled for ALL transactions (research purposes).");
    
    // Initialize GS1 Barcode Scanner
    if (typeof SurgiShopGS1BarcodeScanner !== 'undefined') {
        console.log("🏥 SurgiShopERPNext: Initializing GS1 Barcode Scanner...");
        window.surgiShopGS1Scanner = new SurgiShopGS1BarcodeScanner();
    } else {
        console.log("🏥 SurgiShopERPNext: GS1 Barcode Scanner class not available yet");
    }
    
    // Initialize barcode override
    setTimeout(function() {
        if (typeof setupBarcodeOverride === 'function') {
            console.log("🏥 SurgiShopERPNext: Setting up barcode override...");
            setupBarcodeOverride();
        } else {
            console.log("🏥 SurgiShopERPNext: Barcode override function not available yet");
        }
    }, 1000);
}

// Initialize when document is ready
$(document).ready(function() {
    console.log("🏥 SurgiShopERPNext: Document ready, checking for initialization...");
    
    // Wait a bit for all scripts to load
    setTimeout(function() {
        initializeSurgiShopERPNext();
    }, 500);
});

// Also initialize when frappe is ready (backup)
if (typeof frappe !== 'undefined' && frappe.ready) {
    frappe.ready(function() {
        console.log("🏥 SurgiShopERPNext: Frappe ready, ensuring initialization...");
        setTimeout(function() {
            initializeSurgiShopERPNext();
        }, 1000);
    });
}

console.log("🏥 SurgiShopERPNext: Conditional initialization script ready");
