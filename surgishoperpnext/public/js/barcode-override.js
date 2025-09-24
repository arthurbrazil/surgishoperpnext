/**
 * SurgiShopERPNext Barcode Scanner Override
 * Automatically overrides ERPNext's barcode scanning to use GS1 barcode processing
 */

console.log("🏥 SurgiShopERPNext: Loading Barcode Override...");

// Note: Initialization is now handled by surgishoperpnext-init.js
// This file only defines the setupBarcodeOverride function and related utilities

// Immediate override to prevent ERPNext's barcode scanner from loading
(function() {
    'use strict';
    
    console.log("🏥 SurgiShopERPNext: Setting up immediate barcode override...");
    
    // Override the barcode scanning at the earliest possible moment
    if (typeof frappe !== 'undefined') {
        // Override frappe.call immediately
        if (!window.originalFrappeCall) {
            window.originalFrappeCall = frappe.call;
        }
        
        frappe.call = function(options) {
            // Check if this is a barcode scan API call
            if (options.method === 'erpnext.stock.utils.scan_barcode') {
                console.log("🏥 SurgiShopERPNext: IMMEDIATE INTERCEPT - barcode scan API call:", options.args.search_value);
                
                const searchValue = options.args.search_value;
                
                // Process with our GS1 scanner first
                if (window.surgiShopGS1Scanner && searchValue) {
                    const gtin = window.surgiShopGS1Scanner.parseGS1Barcode(searchValue);
                    if (gtin) {
                        console.log("🏥 SurgiShopERPNext: IMMEDIATE INTERCEPT - GS1 barcode detected, GTIN:", gtin);
                        
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
                                        item_name: response.message.item_name,
                                        barcode: response.message.barcode,
                                        uom: response.message.uom,
                                        stock_uom: response.message.stock_uom,
                                        rate: response.message.rate,
                                        is_stock_item: response.message.is_stock_item,
                                        has_serial_no: response.message.has_serial_no,
                                        has_batch_no: response.message.has_batch_no,
                                        default_warehouse: response.message.default_warehouse || null,
                                        has_variants: response.message.has_variants || false,
                                        variant_of: response.message.variant_of || null
                                    }
                                };
                                console.log("🏥 SurgiShopERPNext: IMMEDIATE INTERCEPT - Transformed response:", transformedResponse);
                                return transformedResponse;
                            } else {
                                // No item found, try fallback
                                console.log("🏥 SurgiShopERPNext: IMMEDIATE INTERCEPT - No item found, trying fallback...");
                                return window.originalFrappeCall.call(this, {
                                    method: 'surgishoperpnext.surgishoperpnext.api.barcode.scan_barcode_fallback',
                                    args: {
                                        search_value: searchValue,
                                        ctx: options.args.ctx
                                    }
                                });
                            }
                        }).catch(error => {
                            console.error("🏥 SurgiShopERPNext: IMMEDIATE INTERCEPT - Error in custom API call:", error);
                            // Fall back to original API
                            return window.originalFrappeCall.call(this, options);
                        });
                    }
                }
            }
            
            // For non-barcode calls or when GS1 parsing fails, use original
            return window.originalFrappeCall.call(this, options);
        };
        
        console.log("🏥 SurgiShopERPNext: Immediate frappe.call override installed");
    }
    
    // Also override ERPNext's barcode scanner at the earliest possible moment
    if (typeof erpnext !== 'undefined' && erpnext.utils) {
        console.log("🏥 SurgiShopERPNext: Overriding ERPNext BarcodeScanner immediately...");
        
        // Store original BarcodeScanner if it exists
        if (erpnext.utils.BarcodeScanner && !window.originalBarcodeScanner) {
            window.originalBarcodeScanner = erpnext.utils.BarcodeScanner;
        }
        
        // Override the BarcodeScanner class immediately
        if (erpnext.utils.BarcodeScanner) {
            erpnext.utils.BarcodeScanner = class extends (window.originalBarcodeScanner || Object) {
                constructor(opts) {
                    if (window.originalBarcodeScanner) {
                        super(opts);
                    }
                    console.log("🏥 SurgiShopERPNext: IMMEDIATE BarcodeScanner override for", opts?.frm?.doctype || 'unknown');
                }
                
                scan_api_call(input, callback) {
                    console.log("🏥 SurgiShopERPNext: IMMEDIATE BarcodeScanner scan_api_call:", input);
                    
                    // Check if it's a GS1 barcode
                    if (window.surgiShopGS1Scanner) {
                        const gtin = window.surgiShopGS1Scanner.parseGS1Barcode(input);
                        if (gtin) {
                            console.log("🏥 SurgiShopERPNext: IMMEDIATE BarcodeScanner - GS1 barcode detected, GTIN:", gtin);
                            
                            // Use our custom API
                            frappe.call({
                                method: 'surgishoperpnext.surgishoperpnext.api.barcode.get_item_by_gtin',
                                args: { gtin: gtin }
                            }).then(response => {
                                if (response.message) {
                                    // Transform to ERPNext format
                                    const transformedData = {
                                        item_code: response.message.item_code,
                                        item_name: response.message.item_name,
                                        barcode: response.message.barcode,
                                        uom: response.message.uom,
                                        stock_uom: response.message.stock_uom,
                                        rate: response.message.rate,
                                        is_stock_item: response.message.is_stock_item,
                                        has_serial_no: response.message.has_serial_no,
                                        has_batch_no: response.message.has_batch_no,
                                        default_warehouse: response.message.default_warehouse || null,
                                        has_variants: response.message.has_variants || false,
                                        variant_of: response.message.variant_of || null
                                    };
                                    console.log("🏥 SurgiShopERPNext: IMMEDIATE BarcodeScanner transformed data:", transformedData);
                                    callback({ message: transformedData });
                                } else {
                                    // Fall back to original API
                                    if (window.originalBarcodeScanner) {
                                        super.scan_api_call(input, callback);
                                    } else {
                                        callback({ message: null });
                                    }
                                }
                            }).catch(error => {
                                console.error("🏥 SurgiShopERPNext: IMMEDIATE BarcodeScanner error:", error);
                                // Fall back to original API
                                if (window.originalBarcodeScanner) {
                                    super.scan_api_call(input, callback);
                                } else {
                                    callback({ message: null });
                                }
                            });
                            return;
                        }
                    }
                    
                    // For non-GS1 barcodes, use original
                    if (window.originalBarcodeScanner) {
                        super.scan_api_call(input, callback);
                    } else {
                        callback({ message: null });
                    }
                }
            };
            
            console.log("🏥 SurgiShopERPNext: IMMEDIATE BarcodeScanner override installed");
        }
    }
})();

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
                                    item_name: response.message.item_name,
                                    barcode: response.message.barcode,
                                    uom: response.message.uom,
                                    stock_uom: response.message.stock_uom,
                                    rate: response.message.rate,
                                    is_stock_item: response.message.is_stock_item,
                                    has_serial_no: response.message.has_serial_no,
                                    has_batch_no: response.message.has_batch_no,
                                    default_warehouse: response.message.default_warehouse || null,
                                    has_variants: response.message.has_variants || false,
                                    variant_of: response.message.variant_of || null
                                }
                            };
                            console.log("🏥 SurgiShopERPNext: Transformed response:", transformedResponse);
                            
                            // Store GS1 data for later batch dialog trigger
                            if (window.surgiShopGS1Scanner) {
                                const parsedData = window.surgiShopGS1Scanner.parseGS1Barcode(searchValue);
                                if (parsedData && parsedData.lot && response.message.has_batch_no) {
                                    // Store the data to trigger batch dialog after item is added
                                    window.surgiShopGS1Data = {
                                        barcode: searchValue,
                                        itemData: response.message,
                                        gs1Data: parsedData,
                                        timestamp: Date.now()
                                    };
                                    console.log("🏥 SurgiShopERPNext: Stored GS1 data for batch dialog:", window.surgiShopGS1Data);
                                }
                            }
                            
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
                    }).catch(error => {
                        console.error("🏥 SurgiShopERPNext: Error in custom API call:", error);
                        // Fall back to original API
                        return window.originalFrappeCall.call(this, options);
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
    
    // Set up form monitoring for batch dialog trigger
    setupFormMonitoring();
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
                                item_name: response.message.item_name,
                                barcode: response.message.barcode,
                                uom: response.message.uom,
                                stock_uom: response.message.stock_uom,
                                rate: response.message.rate,
                                is_stock_item: response.message.is_stock_item,
                                has_serial_no: response.message.has_serial_no,
                                has_batch_no: response.message.has_batch_no,
                                default_warehouse: response.message.default_warehouse || null,
                                has_variants: response.message.has_variants || false,
                                variant_of: response.message.variant_of || null
                            };
                            console.log("🏥 SurgiShopERPNext: BarcodeScanner transformed data:", transformedData);
                            
                            // Store GS1 data for later batch dialog trigger
                            if (window.surgiShopGS1Scanner) {
                                const parsedData = window.surgiShopGS1Scanner.parseGS1Barcode(input);
                                if (parsedData && parsedData.lot && response.message.has_batch_no) {
                                    // Store the data to trigger batch dialog after item is added
                                    window.surgiShopGS1Data = {
                                        barcode: input,
                                        itemData: response.message,
                                        gs1Data: parsedData,
                                        timestamp: Date.now()
                                    };
                                    console.log("🏥 SurgiShopERPNext: Stored GS1 data for batch dialog:", window.surgiShopGS1Data);
                                }
                            }
                            
                            callback({ message: transformedData });
                        } else {
                            // Fall back to original API
                            super.scan_api_call(input, callback);
                        }
                    }).catch(error => {
                        console.error("🏥 SurgiShopERPNext: Error in BarcodeScanner custom API call:", error);
                        // Fall back to original API
                        super.scan_api_call(input, callback);
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
    console.log("🏥 SurgiShopERPNext: Barcode value:", barcodeValue);
    console.log("🏥 SurgiShopERPNext: Item data:", itemData);
    
    // Check if we have a current form
    if (!frappe.cur_frm) {
        console.log("🏥 SurgiShopERPNext: No current form, skipping batch dialog");
        return;
    }
    
    const frm = frappe.cur_frm;
    console.log("🏥 SurgiShopERPNext: Current form doctype:", frm.doctype);
    
    // Check if item requires batch tracking
    if (!itemData.has_batch_no) {
        console.log("🏥 SurgiShopERPNext: Item doesn't require batch tracking, skipping dialog");
        return;
    }
    
    // Parse GS1 barcode to extract batch information
    if (window.surgiShopGS1Scanner) {
        const parsedData = window.surgiShopGS1Scanner.parseGS1Barcode(barcodeValue);
        console.log("🏥 SurgiShopERPNext: Parsed GS1 data:", parsedData);
        
        if (parsedData && parsedData.lot) {
            console.log("🏥 SurgiShopERPNext: GS1 barcode contains batch info:", parsedData.lot);
            
            // Check if we're in a form that supports batch selection
            if (frm.doctype && ['Purchase Receipt', 'Purchase Invoice', 'Stock Entry', 'Sales Invoice', 'Delivery Note'].includes(frm.doctype)) {
                console.log("🏥 SurgiShopERPNext: Triggering batch dialog for", frm.doctype);
                
                // Wait a bit more to ensure the item row is fully added
                setTimeout(() => {
                    showBatchSelector(frm, itemData.item_code, parsedData);
                }, 1000);
            }
        } else {
            console.log("🏥 SurgiShopERPNext: No batch info found in GS1 barcode");
        }
    } else {
        console.log("🏥 SurgiShopERPNext: GS1 Scanner not available");
    }
}

/**
 * Show batch selector dialog with pre-filled batch information
 */
function showBatchSelector(frm, itemCode, gs1Data) {
    console.log("🏥 SurgiShopERPNext: Showing batch selector for item:", itemCode);
    console.log("🏥 SurgiShopERPNext: GS1 data:", gs1Data);
    
    // Check if we have a valid form and item
    if (!frm || !itemCode) {
        console.error("🏥 SurgiShopERPNext: Invalid form or item code");
        return;
    }
    
    // Load the batch selector utility
    frappe.require('assets/erpnext/js/utils/serial_no_batch_selector.js', function() {
        console.log("🏥 SurgiShopERPNext: SerialNoBatchSelector loaded");
        
        if (typeof erpnext.SerialNoBatchSelector !== 'undefined') {
            try {
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
                
                console.log("🏥 SurgiShopERPNext: Batch selector created successfully");
                
                // If we have batch info from GS1, pre-populate the batch field
                if (gs1Data && gs1Data.lot) {
                    console.log("🏥 SurgiShopERPNext: Pre-populating batch field with lot:", gs1Data.lot);
                    
                    setTimeout(() => {
                        try {
                            // Try to find the batch in the dialog
                            if (batchSelector.dialog && batchSelector.dialog.fields_dict && batchSelector.dialog.fields_dict.batch_no) {
                                const batchField = batchSelector.dialog.fields_dict.batch_no;
                                
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
                            } else {
                                console.log("🏥 SurgiShopERPNext: Batch field not found in dialog");
                            }
                        } catch (error) {
                            console.error("🏥 SurgiShopERPNext: Error pre-populating batch field:", error);
                        }
                    }, 1000);
                }
            } catch (error) {
                console.error("🏥 SurgiShopERPNext: Error creating batch selector:", error);
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

/**
 * Set up form monitoring to trigger batch dialog after item is added
 */
function setupFormMonitoring() {
    console.log("🏥 SurgiShopERPNext: Setting up form monitoring...");
    
    // Monitor for form changes
    $(document).on('form_loaded', function() {
        console.log("🏥 SurgiShopERPNext: Form loaded, setting up batch dialog monitoring");
        
        // Check if we have stored GS1 data
        if (window.surgiShopGS1Data) {
            const data = window.surgiShopGS1Data;
            const now = Date.now();
            
            // Only process if data is recent (within last 10 seconds)
            if (now - data.timestamp < 10000) {
                console.log("🏥 SurgiShopERPNext: Found recent GS1 data, checking for batch dialog trigger");
                
                // Wait a bit for the form to be fully ready
                setTimeout(() => {
                    triggerBatchDialogFromStoredData(data);
                }, 2000);
            } else {
                console.log("🏥 SurgiShopERPNext: GS1 data is too old, clearing");
                delete window.surgiShopGS1Data;
            }
        }
    });
    
    // Also monitor for item table changes
    $(document).on('items_added', function() {
        console.log("🏥 SurgiShopERPNext: Items added event detected");
        
        if (window.surgiShopGS1Data) {
            const data = window.surgiShopGS1Data;
            const now = Date.now();
            
            if (now - data.timestamp < 10000) {
                console.log("🏥 SurgiShopERPNext: Triggering batch dialog after items added");
                setTimeout(() => {
                    triggerBatchDialogFromStoredData(data);
                }, 1000);
            }
        }
    });
    
    // Monitor for form refresh events (when items are added)
    $(document).on('form_refresh', function() {
        console.log("🏥 SurgiShopERPNext: Form refresh detected");
        
        if (window.surgiShopGS1Data) {
            const data = window.surgiShopGS1Data;
            const now = Date.now();
            
            if (now - data.timestamp < 10000) {
                console.log("🏥 SurgiShopERPNext: Triggering batch dialog after form refresh");
                setTimeout(() => {
                    triggerBatchDialogFromStoredData(data);
                }, 1500);
            }
        }
    });
    
    // Also set up a periodic check as a fallback
    setInterval(() => {
        if (window.surgiShopGS1Data) {
            const data = window.surgiShopGS1Data;
            const now = Date.now();
            
            // If data is recent and we have a form, try to trigger
            if (now - data.timestamp < 5000 && frappe.cur_frm) {
                console.log("🏥 SurgiShopERPNext: Periodic check - triggering batch dialog");
                triggerBatchDialogFromStoredData(data);
            } else if (now - data.timestamp > 10000) {
                // Clear old data
                delete window.surgiShopGS1Data;
            }
        }
    }, 2000);
}

/**
 * Trigger batch dialog from stored GS1 data
 */
function triggerBatchDialogFromStoredData(data) {
    console.log("🏥 SurgiShopERPNext: Triggering batch dialog from stored data:", data);
    
    // Check if we have a current form
    if (!frappe.cur_frm) {
        console.log("🏥 SurgiShopERPNext: No current form, retrying in 1 second");
        setTimeout(() => {
            triggerBatchDialogFromStoredData(data);
        }, 1000);
        return;
    }
    
    const frm = frappe.cur_frm;
    console.log("🏥 SurgiShopERPNext: Current form doctype:", frm.doctype);
    
    // Check if we're in a supported form
    if (!frm.doctype || !['Purchase Receipt', 'Purchase Invoice', 'Stock Entry', 'Sales Invoice', 'Delivery Note'].includes(frm.doctype)) {
        console.log("🏥 SurgiShopERPNext: Form not supported for batch dialog");
        return;
    }
    
    // Check if item requires batch tracking
    if (!data.itemData.has_batch_no) {
        console.log("🏥 SurgiShopERPNext: Item doesn't require batch tracking");
        return;
    }
    
    // Check if we have batch info
    if (!data.gs1Data || !data.gs1Data.lot) {
        console.log("🏥 SurgiShopERPNext: No batch info in GS1 data");
        return;
    }
    
    console.log("🏥 SurgiShopERPNext: All checks passed, showing batch selector");
    showBatchSelector(frm, data.itemData.item_code, data.gs1Data);
    
    // Clear the stored data
    delete window.surgiShopGS1Data;
}

console.log("🏥 SurgiShopERPNext: Barcode Override script loaded");
