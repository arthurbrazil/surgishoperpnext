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
                            
                            // Check if we have batch information and trigger batch dialog
                            setTimeout(() => {
                                triggerBatchDialogIfNeeded(searchValue, response.message);
                            }, 100);
                            
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
                            
                            // Check if we have batch information and trigger batch dialog
                            setTimeout(() => {
                                triggerBatchDialogIfNeeded(input, response.message);
                            }, 100);
                            
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

/**
 * Trigger batch dialog if GS1 barcode contains batch information
 */
function triggerBatchDialogIfNeeded(barcodeValue, itemData) {
    console.log("🏥 SurgiShopERPNext: Checking if batch dialog should be triggered...");
    
    // Check if we have a current form
    if (!frappe.cur_frm) {
        console.log("🏥 SurgiShopERPNext: No current form, skipping batch dialog");
        return;
    }
    
    const frm = frappe.cur_frm;
    
    // Check if item requires batch tracking
    if (!itemData.has_batch_no) {
        console.log("🏥 SurgiShopERPNext: Item doesn't require batch tracking, skipping dialog");
        return;
    }
    
    // Parse GS1 barcode to extract batch information
    if (window.surgiShopGS1Scanner) {
        const parsedData = window.surgiShopGS1Scanner.parseGS1Barcode(barcodeValue);
        if (parsedData && parsedData.lot) {
            console.log("🏥 SurgiShopERPNext: GS1 barcode contains batch info:", parsedData.lot);
            
            // Check if we're in a form that supports batch selection
            if (frm.doctype && ['Purchase Receipt', 'Purchase Invoice', 'Stock Entry', 'Sales Invoice', 'Delivery Note'].includes(frm.doctype)) {
                console.log("🏥 SurgiShopERPNext: Triggering batch dialog for", frm.doctype);
                showBatchSelector(frm, itemData.item_code, parsedData);
            }
        }
    }
}

/**
 * Show batch selector dialog with pre-filled batch information
 */
function showBatchSelector(frm, itemCode, gs1Data) {
    console.log("🏥 SurgiShopERPNext: Showing batch selector for item:", itemCode);
    
    // Load the batch selector utility
    frappe.require('assets/erpnext/js/utils/serial_no_batch_selector.js', function() {
        if (typeof erpnext.SerialNoBatchSelector !== 'undefined') {
            const batchSelector = new erpnext.SerialNoBatchSelector({
                frm: frm,
                item: itemCode,
                callback: function(selectedData) {
                    console.log("🏥 SurgiShopERPNext: Batch selected:", selectedData);
                    
                    // If we have GS1 batch data, try to create or find the batch
                    if (gs1Data && gs1Data.lot) {
                        handleGS1BatchData(frm, itemCode, gs1Data, selectedData);
                    }
                }
            });
            
            // If we have batch info from GS1, pre-populate the batch field
            if (gs1Data && gs1Data.lot) {
                setTimeout(() => {
                    // Try to find the batch in the dialog
                    const batchField = batchSelector.dialog.fields_dict.batch_no;
                    if (batchField) {
                        // Search for existing batch with the lot number
                        frappe.call({
                            method: 'frappe.client.get_list',
                            args: {
                                doctype: 'Batch',
                                filters: {
                                    item: itemCode,
                                    batch_id: ['like', `%${gs1Data.lot}%`]
                                },
                                fields: ['name', 'batch_id'],
                                limit: 10
                            },
                            callback: function(response) {
                                if (response.message && response.message.length > 0) {
                                    console.log("🏥 SurgiShopERPNext: Found existing batches:", response.message);
                                    // Pre-select the first matching batch
                                    batchField.set_value(response.message[0].name);
                                } else {
                                    console.log("🏥 SurgiShopERPNext: No existing batch found for lot:", gs1Data.lot);
                                }
                            }
                        });
                    }
                }, 500);
            }
        } else {
            console.error("🏥 SurgiShopERPNext: SerialNoBatchSelector not available");
        }
    });
}

/**
 * Handle GS1 batch data - create batch if needed
 */
function handleGS1BatchData(frm, itemCode, gs1Data, selectedData) {
    console.log("🏥 SurgiShopERPNext: Handling GS1 batch data:", gs1Data);
    
    // Create batch with GS1 data if it doesn't exist
    if (gs1Data.lot) {
        const batchId = `${itemCode}-${gs1Data.lot}`;
        
        frappe.call({
            method: 'frappe.client.get_value',
            args: {
                doctype: 'Batch',
                filters: { batch_id: batchId },
                fieldname: 'name'
            },
            callback: function(response) {
                if (!response.message) {
                    // Batch doesn't exist, create it
                    console.log("🏥 SurgiShopERPNext: Creating new batch:", batchId);
                    
                    const batchDoc = {
                        doctype: 'Batch',
                        item: itemCode,
                        batch_id: batchId
                    };
                    
                    // Add expiry date if available
                    if (gs1Data.expiry && gs1Data.expiry.length === 6) {
                        const year = '20' + gs1Data.expiry.substring(0, 2);
                        const month = gs1Data.expiry.substring(2, 4);
                        const day = gs1Data.expiry.substring(4, 6);
                        batchDoc.expiry_date = `${year}-${month}-${day}`;
                    }
                    
                    frappe.call({
                        method: 'frappe.client.insert',
                        args: { doc: batchDoc },
                        callback: function(insertResponse) {
                            if (insertResponse.message) {
                                console.log("🏥 SurgiShopERPNext: Batch created:", insertResponse.message.name);
                                // Update the selected data with the new batch
                                selectedData.batch_no = insertResponse.message.name;
                            }
                        }
                    });
                } else {
                    console.log("🏥 SurgiShopERPNext: Batch already exists:", response.message.name);
                }
            }
        });
    }
}

console.log("🏥 SurgiShopERPNext: Barcode Override script loaded");
