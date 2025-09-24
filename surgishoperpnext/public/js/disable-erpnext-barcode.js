/**
 * SurgiShopERPNext - ERPNext Barcode Scanner Disabler
 * Completely disables ERPNext's barcode scanner to prevent conflicts
 */

console.log("🏥 SurgiShopERPNext: Loading ERPNext Barcode Scanner Disabler...");

// Immediately disable ERPNext's barcode scanner - ULTRA AGGRESSIVE
(function() {
    'use strict';
    
    console.log("🏥 SurgiShopERPNext: ULTRA AGGRESSIVE DISABLING of ERPNext barcode scanner...");
    
    // Note: Removed XMLHttpRequest and fetch overrides as they can break page loading
    // Focus on targeted barcode scanner overrides instead
    
    // Override the barcode scanner before it can be loaded
    if (typeof window !== 'undefined') {
        // Create a dummy BarcodeScanner that does nothing
        const DummyBarcodeScanner = class {
            constructor(opts) {
                console.log("🏥 SurgiShopERPNext: DUMMY BarcodeScanner created - ERPNext barcode scanning COMPLETELY DISABLED");
                this.frm = opts?.frm;
            }
            
            scan_api_call(input, callback) {
                console.log("🏥 SurgiShopERPNext: DUMMY BarcodeScanner scan_api_call - ERPNext barcode scanning COMPLETELY DISABLED");
                // Do nothing - just call callback with null to prevent errors
                if (callback) {
                    setTimeout(() => {
                        callback({ message: null });
                    }, 0);
                }
            }
        };
        
        // Override erpnext.utils.BarcodeScanner
        if (typeof window.erpnext === 'undefined') {
            window.erpnext = {};
        }
        if (typeof window.erpnext.utils === 'undefined') {
            window.erpnext.utils = {};
        }
        
        window.erpnext.utils.BarcodeScanner = DummyBarcodeScanner;
        console.log("🏥 SurgiShopERPNext: ERPNext BarcodeScanner COMPLETELY DISABLED");
        
        // Also override any barcode scanning methods
        if (typeof frappe !== 'undefined' && frappe.ui) {
            // Override frappe.ui.scan_barcode
            frappe.ui.scan_barcode = function(barcode) {
                console.log("🏥 SurgiShopERPNext: frappe.ui.scan_barcode DISABLED");
                // Do nothing
            };
            
            // Override form barcode scanning
            if (frappe.ui.form) {
                frappe.ui.form.scan_barcode = function(barcode) {
                    console.log("🏥 SurgiShopERPNext: frappe.ui.form.scan_barcode DISABLED");
                    // Do nothing
                };
            }
        }
        
        // Override any barcode scanning events
        $(document).off('barcode_scan').on('barcode_scan', function(e, barcode) {
            console.log("🏥 SurgiShopERPNext: barcode_scan event DISABLED");
            e.preventDefault();
            e.stopPropagation();
            return false;
        });
        
        // Override barcode input events
        $(document).off('keypress', '.barcode-scan').on('keypress', '.barcode-scan', function(e) {
            if (e.which === 13) { // Enter key
                console.log("🏥 SurgiShopERPNext: barcode input DISABLED");
                e.preventDefault();
                e.stopPropagation();
                return false;
            }
        });
        
        console.log("🏥 SurgiShopERPNext: All ERPNext barcode scanning methods DISABLED");
    }
    
    // Note: Removed jQuery AJAX override as it can interfere with normal page functionality
    // Focus on targeted barcode scanner overrides instead
    
    // Override any barcode scanning at the global level
    if (typeof window !== 'undefined') {
        // Override any global barcode scanning functions
        window.scan_barcode = function(barcode) {
            console.log("🏥 SurgiShopERPNext: Global scan_barcode DISABLED");
            return null;
        };
        
        // Override any barcode scanning events
        if (typeof document !== 'undefined') {
            document.addEventListener('barcode_scan', function(e) {
                console.log("🏥 SurgiShopERPNext: barcode_scan event DISABLED");
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                return false;
            }, true);
            
            document.addEventListener('keypress', function(e) {
                if (e.target && e.target.classList && e.target.classList.contains('barcode-scan') && e.which === 13) {
                    console.log("🏥 SurgiShopERPNext: barcode input keypress DISABLED");
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                    return false;
                }
            }, true);
        }
    }
})();

console.log("🏥 SurgiShopERPNext: ERPNext Barcode Scanner Disabler loaded");
