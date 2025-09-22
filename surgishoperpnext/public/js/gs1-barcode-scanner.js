/**
 * SurgiShopERPNext GS1 Barcode Scanner
 * Overrides default barcode scanning for all doctypes except Serial/Batch Selector Dialog
 * Implements GS1 barcode parsing using bark.js
 */

console.log("🏥 SurgiShopERPNext: Loading GS1 Barcode Scanner...");

// GS1 Barcode Scanner Class
class SurgiShopGS1BarcodeScanner {
    constructor() {
        this.barkLoaded = false;
        this.debugMode = true;
        this.excludedDialogs = [
            'Serial No and Batch Selector',
            'Batch Selector',
            'Serial No Selector'
        ];
        this.init();
    }

    init() {
        console.log("🏥 SurgiShopERPNext: Initializing GS1 Barcode Scanner...");
        this.checkBarkJS();
        this.setupGlobalBarcodeOverride();
        this.setupEventListeners();
    }

    checkBarkJS() {
        console.log("🏥 SurgiShopERPNext: Checking for bark.js library...");
        console.log("🏥 SurgiShopERPNext: typeof bark =", typeof bark);
        console.log("🏥 SurgiShopERPNext: window.bark =", window.bark);
        
        // Check if bark.js is already loaded (from hooks.py)
        if (typeof bark !== 'undefined') {
            this.barkLoaded = true;
            console.log("🏥 SurgiShopERPNext: bark.js already loaded from hooks.py");
            this.debugLog("Bark.js library already available");
        } else {
            console.log("🏥 SurgiShopERPNext: bark.js not found, waiting for it to load...");
            this.debugLog("Waiting for bark.js to load from hooks.py");
            
            // Wait for bark.js to load
            let attempts = 0;
            const checkBark = setInterval(() => {
                attempts++;
                console.log(`🏥 SurgiShopERPNext: Checking for bark.js (attempt ${attempts})`);
                
                if (typeof bark !== 'undefined') {
                    clearInterval(checkBark);
                    this.barkLoaded = true;
                    console.log("🏥 SurgiShopERPNext: bark.js loaded successfully");
                    this.debugLog("Bark.js library loaded and ready");
                } else if (attempts >= 50) { // 5 seconds at 100ms intervals
                    clearInterval(checkBark);
                    console.error("🏥 SurgiShopERPNext: bark.js failed to load within timeout");
                    this.debugLog("ERROR: bark.js failed to load within timeout");
                }
            }, 100);
        }
    }

    setupGlobalBarcodeOverride() {
        console.log("🏥 SurgiShopERPNext: Setting up global barcode override...");
        
        // Override frappe's default barcode scanning
        if (typeof frappe !== 'undefined' && frappe.ui) {
            this.originalScanBarcode = frappe.ui.scan_barcode;
            frappe.ui.scan_barcode = this.handleBarcodeScan.bind(this);
            console.log("🏥 SurgiShopERPNext: Global barcode override installed");
        }
    }

    setupEventListeners() {
        console.log("🏥 SurgiShopERPNext: Setting up event listeners...");
        
        // Listen for barcode input events
        $(document).on('keypress', '.barcode-scan', (e) => {
            if (e.which === 13) { // Enter key
                const barcode = $(e.target).val();
                this.debugLog(`Barcode input detected: ${barcode}`);
                this.processBarcode(barcode, e.target);
            }
        });

        // Listen for barcode scan events
        $(document).on('barcode_scan', (e, barcode) => {
            this.debugLog(`Barcode scan event detected: ${barcode}`);
            this.processBarcode(barcode, e.target);
        });
    }

    handleBarcodeScan(options) {
        console.log("🏥 SurgiShopERPNext: handleBarcodeScan called", options);
        
        // Check if we're in an excluded dialog
        if (this.isExcludedDialog()) {
            console.log("🏥 SurgiShopERPNext: In excluded dialog, using original scan function");
            this.debugLog("Serial/Batch Selector Dialog detected - using original barcode scan");
            return this.originalScanBarcode(options);
        }

        // Use our custom GS1 barcode processing
        this.debugLog("Using custom GS1 barcode processing");
        this.processGS1Barcode(options);
    }

    isExcludedDialog() {
        const currentDialog = $('.modal-title').text() || '';
        const isExcluded = this.excludedDialogs.some(dialog => 
            currentDialog.includes(dialog)
        );
        
        this.debugLog(`Current dialog: "${currentDialog}", Excluded: ${isExcluded}`);
        return isExcluded;
    }

    processGS1Barcode(options) {
        console.log("🏥 SurgiShopERPNext: Processing GS1 barcode", options);
        
        if (!this.barkLoaded) {
            console.warn("🏥 SurgiShopERPNext: bark.js not loaded yet, falling back to original");
            this.debugLog("WARNING: bark.js not loaded, using fallback");
            return this.originalScanBarcode(options);
        }

        const barcode = options.barcode || options.value || '';
        this.debugLog(`Processing GS1 barcode: ${barcode}`);
        
        try {
            const gtin01 = this.parseGS1Barcode(barcode);
            this.debugLog(`Extracted GTIN-01: ${gtin01}`);
            
            if (gtin01) {
                this.lookupItemByGTIN(gtin01, options);
            } else {
                this.debugLog("No GTIN-01 found, falling back to original scan");
                this.originalScanBarcode(options);
            }
        } catch (error) {
            console.error("🏥 SurgiShopERPNext: GS1 parsing error", error);
            this.debugLog(`ERROR in GS1 parsing: ${error.message}`);
            this.originalScanBarcode(options);
        }
    }

    parseGS1Barcode(barcode) {
        console.log("🏥 SurgiShopERPNext: Parsing GS1 barcode", barcode);
        
        try {
            // Use bark.js to parse GS1 barcode
            const parsed = bark.parse(barcode);
            this.debugLog(`Bark.js parsed result:`, parsed);
            
            // Look for GTIN-01 (01) in the parsed data
            if (parsed && parsed.data) {
                for (const item of parsed.data) {
                    if (item.ai === '01') { // GTIN-01 Application Identifier
                        this.debugLog(`Found GTIN-01: ${item.value}`);
                        return item.value;
                    }
                }
            }
            
            // Fallback: try to extract GTIN-01 manually if bark.js doesn't find it
            const gtin01Match = barcode.match(/^01(\d{14})/);
            if (gtin01Match) {
                this.debugLog(`Manual GTIN-01 extraction: ${gtin01Match[1]}`);
                return gtin01Match[1];
            }
            
            this.debugLog("No GTIN-01 found in barcode");
            return null;
        } catch (error) {
            console.error("🏥 SurgiShopERPNext: Error parsing GS1 barcode", error);
            this.debugLog(`ERROR parsing GS1: ${error.message}`);
            return null;
        }
    }

    lookupItemByGTIN(gtin01, options) {
        console.log("🏥 SurgiShopERPNext: Looking up item by GTIN-01", gtin01);
        this.debugLog(`Looking up item for GTIN-01: ${gtin01}`);
        
        frappe.call({
            method: 'surgishoperpnext.surgishoperpnext.api.barcode.get_item_by_gtin',
            args: {
                gtin: gtin01
            },
            callback: (response) => {
                this.debugLog(`API response:`, response);
                
                if (response.message) {
                    this.debugLog(`Item found: ${response.message.item_code}`);
                    this.addItemToForm(response.message, options);
                } else {
                    this.debugLog("No item found for GTIN-01, falling back to original scan");
                    this.originalScanBarcode(options);
                }
            },
            error: (error) => {
                console.error("🏥 SurgiShopERPNext: Error looking up item", error);
                this.debugLog(`ERROR in item lookup: ${error.message}`);
                this.originalScanBarcode(options);
            }
        });
    }

    addItemToForm(itemData, options) {
        console.log("🏥 SurgiShopERPNext: Adding item to form", itemData);
        this.debugLog(`Adding item to form:`, itemData);
        
        try {
            // Get current form
            const currentForm = frappe.get_cur_frm();
            if (!currentForm) {
                this.debugLog("No current form found");
                return;
            }

            this.debugLog(`Current form doctype: ${currentForm.doctype}`);
            
            // Add item to the form based on doctype
            if (currentForm.doctype === 'Stock Entry') {
                this.addItemToStockEntry(itemData, currentForm);
            } else if (currentForm.doctype === 'Purchase Receipt') {
                this.addItemToPurchaseReceipt(itemData, currentForm);
            } else if (currentForm.doctype === 'Sales Invoice') {
                this.addItemToSalesInvoice(itemData, currentForm);
            } else if (currentForm.doctype === 'Delivery Note') {
                this.addItemToDeliveryNote(itemData, currentForm);
            } else {
                this.debugLog(`Unsupported doctype: ${currentForm.doctype}, using generic method`);
                this.addItemGeneric(itemData, currentForm);
            }
            
            this.debugLog("Item added successfully to form");
        } catch (error) {
            console.error("🏥 SurgiShopERPNext: Error adding item to form", error);
            this.debugLog(`ERROR adding item to form: ${error.message}`);
        }
    }

    addItemToStockEntry(itemData, form) {
        this.debugLog("Adding item to Stock Entry");
        
        const newRow = form.add_child('items');
        newRow.item_code = itemData.item_code;
        newRow.item_name = itemData.item_name;
        newRow.uom = itemData.uom || 'Nos';
        newRow.qty = 1;
        newRow.rate = itemData.rate || 0;
        newRow.amount = newRow.qty * newRow.rate;
        
        form.refresh_field('items');
        this.debugLog("Stock Entry item added");
    }

    addItemToPurchaseReceipt(itemData, form) {
        this.debugLog("Adding item to Purchase Receipt");
        
        const newRow = form.add_child('items');
        newRow.item_code = itemData.item_code;
        newRow.item_name = itemData.item_name;
        newRow.uom = itemData.uom || 'Nos';
        newRow.qty = 1;
        newRow.rate = itemData.rate || 0;
        newRow.amount = newRow.qty * newRow.rate;
        
        form.refresh_field('items');
        this.debugLog("Purchase Receipt item added");
    }

    addItemToSalesInvoice(itemData, form) {
        this.debugLog("Adding item to Sales Invoice");
        
        const newRow = form.add_child('items');
        newRow.item_code = itemData.item_code;
        newRow.item_name = itemData.item_name;
        newRow.uom = itemData.uom || 'Nos';
        newRow.qty = 1;
        newRow.rate = itemData.rate || 0;
        newRow.amount = newRow.qty * newRow.rate;
        
        form.refresh_field('items');
        this.debugLog("Sales Invoice item added");
    }

    addItemToDeliveryNote(itemData, form) {
        this.debugLog("Adding item to Delivery Note");
        
        const newRow = form.add_child('items');
        newRow.item_code = itemData.item_code;
        newRow.item_name = itemData.item_name;
        newRow.uom = itemData.uom || 'Nos';
        newRow.qty = 1;
        newRow.rate = itemData.rate || 0;
        newRow.amount = newRow.qty * newRow.rate;
        
        form.refresh_field('items');
        this.debugLog("Delivery Note item added");
    }

    addItemGeneric(itemData, form) {
        this.debugLog("Adding item using generic method");
        
        // Try to find an 'items' child table
        const itemsField = form.fields_dict.items;
        if (itemsField) {
            const newRow = form.add_child('items');
            newRow.item_code = itemData.item_code;
            newRow.item_name = itemData.item_name;
            newRow.uom = itemData.uom || 'Nos';
            newRow.qty = 1;
            newRow.rate = itemData.rate || 0;
            
            if (newRow.amount !== undefined) {
                newRow.amount = newRow.qty * newRow.rate;
            }
            
            form.refresh_field('items');
            this.debugLog("Generic item added");
        } else {
            this.debugLog("No 'items' field found in form");
        }
    }

    processBarcode(barcode, inputElement) {
        console.log("🏥 SurgiShopERPNext: Processing barcode from input", barcode);
        this.debugLog(`Processing barcode from input: ${barcode}`);
        
        // Clear the input
        $(inputElement).val('');
        
        // Process the barcode
        this.processGS1Barcode({ barcode: barcode });
    }

    debugLog(message, data = null) {
        if (this.debugMode) {
            const timestamp = new Date().toISOString();
            console.log(`🏥 SurgiShopERPNext [${timestamp}]: ${message}`, data || '');
        }
    }
}

// Initialize the scanner when document is ready
$(document).ready(function() {
    console.log("🏥 SurgiShopERPNext: Document ready, initializing GS1 Barcode Scanner...");
    window.surgiShopGS1Scanner = new SurgiShopGS1BarcodeScanner();
});

// Note: Scanner is already initialized via document.ready above
// No need for frappe.ready since the scanner works independently

console.log("🏥 SurgiShopERPNext: GS1 Barcode Scanner script loaded");

