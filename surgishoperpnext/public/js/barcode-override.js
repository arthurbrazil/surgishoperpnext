/**
 * SurgiShopERPNext Barcode Scanner Override
 * Automatically overrides ERPNext's barcode scanning to use GS1 barcode processing
 */

console.log("🏥 SurgiShopERPNext: Loading Barcode Override...");

// Wait for the page to be ready
$(document).ready(function() {
    console.log("🏥 SurgiShopERPNext: Document ready, setting up barcode override...");
    
    // Wait a bit for ERPNext to fully load
    setTimeout(function() {
        setupBarcodeOverride();
    }, 1000);
});

function setupBarcodeOverride() {
    console.log("🏥 SurgiShopERPNext: Setting up barcode override...");
    
    // Check if GS1 scanner is available
    if (!window.surgiShopGS1Scanner) {
        console.warn("🏥 SurgiShopERPNext: GS1 Scanner not available, retrying...");
        setTimeout(setupBarcodeOverride, 1000);
        return;
    }
    
    // Store the original frappe.call function
    if (!window.originalFrappeCall) {
        window.originalFrappeCall = frappe.call;
    }
    
    // Override frappe.call to intercept barcode scan API calls
    frappe.call = function(options) {
        // Check if this is a barcode scan API call
        if (options.method === 'erpnext.stock.utils.scan_barcode') {
            console.log("🏥 SurgiShopERPNext: Intercepting barcode scan API call:", options.args.search_value);
            
            const searchValue = options.args.search_value;
            
            // Process with our GS1 scanner first
            if (window.surgiShopGS1Scanner && searchValue) {
                const gtin = window.surgiShopGS1Scanner.parseGS1Barcode(searchValue);
                if (gtin) {
                    console.log("🏥 SurgiShopERPNext: GS1 barcode detected, GTIN:", gtin);
                    
                    // Call our custom API instead
                    const customOptions = {
                        ...options,
                        method: 'surgishoperpnext.surgishoperpnext.api.barcode.get_item_by_gtin',
                        args: { gtin: gtin }
                    };
                    
                    // Use original frappe.call for our custom API
                    return window.originalFrappeCall.call(this, customOptions).then(response => {
                        if (response.message) {
                            // Transform our response to ERPNext format
                            const transformedResponse = {
                                ...response,
                                message: {
                                    item_code: response.message.item_code,
                                    barcode: response.message.barcode,
                                    uom: response.message.uom,
                                    default_warehouse: response.message.default_warehouse || null
                                }
                            };
                            console.log("🏥 SurgiShopERPNext: Transformed response:", transformedResponse);
                            return transformedResponse;
                        } else {
                            // No item found, try fallback
                            console.log("🏥 SurgiShopERPNext: No item found, trying fallback...");
                            return window.originalFrappeCall.call(this, {
                                method: 'surgishoperpnext.surgishoperpnext.api.barcode.scan_barcode_fallback',
                                args: {
                                    search_value: searchValue,
                                    ctx: options.args.ctx
                                }
                            });
                        }
                    });
                }
            }
        }
        
        // For non-barcode calls or when GS1 parsing fails, use original
        return window.originalFrappeCall.call(this, options);
    };
    
    console.log("✅ SurgiShopERPNext: Barcode override setup complete");
    
    // Also override the BarcodeScanner class for additional coverage
    overrideBarcodeScannerClass();
}

function overrideBarcodeScannerClass() {
    console.log("🏥 SurgiShopERPNext: Setting up BarcodeScanner class override...");
    
    // Check if ERPNext BarcodeScanner exists
    if (typeof erpnext === 'undefined' || !erpnext.utils || !erpnext.utils.BarcodeScanner) {
        console.log("🏥 SurgiShopERPNext: ERPNext BarcodeScanner not available yet, retrying...");
        setTimeout(overrideBarcodeScannerClass, 1000);
        return;
    }
    
    // Store original BarcodeScanner
    if (!window.originalBarcodeScanner) {
        window.originalBarcodeScanner = erpnext.utils.BarcodeScanner;
    }
    
    // Override the BarcodeScanner class
    erpnext.utils.BarcodeScanner = class extends window.originalBarcodeScanner {
        constructor(opts) {
            super(opts);
            console.log("🏥 SurgiShopERPNext: Custom BarcodeScanner initialized for", this.frm.doctype);
        }
        
        scan_api_call(input, callback) {
            console.log("🏥 SurgiShopERPNext: Custom scan_api_call:", input);
            
            // Check if it's a GS1 barcode
            if (window.surgiShopGS1Scanner) {
                const gtin = window.surgiShopGS1Scanner.parseGS1Barcode(input);
                if (gtin) {
                    console.log("🏥 SurgiShopERPNext: GS1 barcode detected in BarcodeScanner, GTIN:", gtin);
                    
                    // Use our custom API
                    frappe.call({
                        method: 'surgishoperpnext.surgishoperpnext.api.barcode.get_item_by_gtin',
                        args: { gtin: gtin }
                    }).then(response => {
                        if (response.message) {
                            // Transform to ERPNext format
                            const transformedData = {
                                item_code: response.message.item_code,
                                barcode: response.message.barcode,
                                uom: response.message.uom,
                                default_warehouse: response.message.default_warehouse || null
                            };
                            console.log("🏥 SurgiShopERPNext: BarcodeScanner transformed data:", transformedData);
                            callback({ message: transformedData });
                        } else {
                            // Fall back to original API
                            super.scan_api_call(input, callback);
                        }
                    });
                    return;
                }
            }
            
            // For non-GS1 barcodes, use original
            super.scan_api_call(input, callback);
        }
    };
    
    console.log("✅ SurgiShopERPNext: BarcodeScanner class override complete");
}

// Also set up the override when frappe is ready (backup method)
if (typeof frappe !== 'undefined' && frappe.ready) {
    frappe.ready(function() {
        console.log("🏥 SurgiShopERPNext: Frappe ready, ensuring barcode override is active...");
        setTimeout(setupBarcodeOverride, 500);
    });
}

console.log("🏥 SurgiShopERPNext: Barcode Override script loaded");
