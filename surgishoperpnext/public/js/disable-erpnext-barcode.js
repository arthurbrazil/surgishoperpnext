/**
 * SurgiShopERPNext - ERPNext Barcode Scanner Disabler
 * Completely disables ERPNext's barcode scanner to prevent conflicts
 */

console.log("🏥 SurgiShopERPNext: Loading ERPNext Barcode Scanner Disabler...");

// Immediately disable ERPNext's barcode scanner - NUCLEAR APPROACH
(function() {
    'use strict';
    
    console.log("🏥 SurgiShopERPNext: NUCLEAR DISABLING of ERPNext barcode scanner...");
    
    // Override the barcode scanner at the earliest possible moment
    if (typeof window !== 'undefined') {
        // Create a dummy BarcodeScanner that completely disables functionality
        const NuclearBarcodeScanner = class {
            constructor(opts) {
                console.log("🏥 SurgiShopERPNext: NUCLEAR BarcodeScanner created - ERPNext barcode scanning NUCLEAR DISABLED");
                this.frm = opts?.frm;
            }
            
            scan_api_call(input, callback) {
                console.log("🏥 SurgiShopERPNext: NUCLEAR BarcodeScanner scan_api_call - ERPNext barcode scanning NUCLEAR DISABLED");
                // Do nothing - just call callback with null to prevent errors
                if (callback) {
                    setTimeout(() => {
                        callback({ message: null });
                    }, 0);
                }
            }
        };
        
        // Override erpnext.utils.BarcodeScanner immediately
        window.erpnext = window.erpnext || {};
        window.erpnext.utils = window.erpnext.utils || {};
        window.erpnext.utils.BarcodeScanner = NuclearBarcodeScanner;
        
        // Also override any existing BarcodeScanner
        if (window.erpnext && window.erpnext.utils && window.erpnext.utils.BarcodeScanner) {
            window.erpnext.utils.BarcodeScanner = NuclearBarcodeScanner;
        }
        
        console.log("🏥 SurgiShopERPNext: NUCLEAR BarcodeScanner installed");
    }
    
    // Override barcode scanning at the DOM level
    if (typeof document !== 'undefined') {
        // Override any barcode input events
        document.addEventListener('keypress', function(e) {
            if (e.target && e.target.classList && e.target.classList.contains('barcode-scan') && e.which === 13) {
                console.log("🏥 SurgiShopERPNext: NUCLEAR barcode input keypress DISABLED");
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                return false;
            }
        }, true);
        
        // Override any barcode scanning events
        document.addEventListener('barcode_scan', function(e) {
            console.log("🏥 SurgiShopERPNext: NUCLEAR barcode_scan event DISABLED");
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            return false;
        }, true);
        
        console.log("🏥 SurgiShopERPNext: NUCLEAR DOM event overrides installed");
    }
    
    // Override barcode scanning at the jQuery level
    if (typeof $ !== 'undefined') {
        // Override any barcode scanning events
        $(document).off('barcode_scan').on('barcode_scan', function(e, barcode) {
            console.log("🏥 SurgiShopERPNext: NUCLEAR jQuery barcode_scan event DISABLED");
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            return false;
        });
        
        // Override barcode input events
        $(document).off('keypress', '.barcode-scan').on('keypress', '.barcode-scan', function(e) {
            if (e.which === 13) { // Enter key
                console.log("🏥 SurgiShopERPNext: NUCLEAR jQuery barcode input DISABLED");
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                return false;
            }
        });
        
        console.log("🏥 SurgiShopERPNext: NUCLEAR jQuery event overrides installed");
    }
    
    // Override barcode scanning at the form level
    if (typeof frappe !== 'undefined' && frappe.ui && frappe.ui.form) {
        // Override Form.prototype.scan_barcode
        if (frappe.ui.form.Form && frappe.ui.form.Form.prototype) {
            frappe.ui.form.Form.prototype.scan_barcode = function(barcode) {
                console.log("🏥 SurgiShopERPNext: NUCLEAR Form.prototype.scan_barcode DISABLED");
                // Do nothing - completely disable form barcode scanning
                return Promise.resolve(null);
            };
            console.log("🏥 SurgiShopERPNext: NUCLEAR Form.prototype.scan_barcode DISABLED");
        }
        
        // Override any barcode scanning in forms
        if (frappe.ui.form.Form && frappe.ui.form.Form.prototype) {
            const originalRefresh = frappe.ui.form.Form.prototype.refresh;
            frappe.ui.form.Form.prototype.refresh = function() {
                // Call original refresh first
                if (originalRefresh) {
                    originalRefresh.call(this);
                }
                
                // Then disable any barcode scanning
                if (this.scan_barcode) {
                    this.scan_barcode = function(barcode) {
                        console.log("🏥 SurgiShopERPNext: NUCLEAR Form scan_barcode DISABLED");
                        return Promise.resolve(null);
                    };
                }
            };
            console.log("🏥 SurgiShopERPNext: NUCLEAR Form refresh override installed");
        }
        
        // Override frappe.ui.scan_barcode
        frappe.ui.scan_barcode = function(barcode) {
            console.log("🏥 SurgiShopERPNext: NUCLEAR frappe.ui.scan_barcode DISABLED");
            // Do nothing
        };
        
        // Override form barcode scanning
        if (frappe.ui.form) {
            frappe.ui.form.scan_barcode = function(barcode) {
                console.log("🏥 SurgiShopERPNext: NUCLEAR frappe.ui.form.scan_barcode DISABLED");
                // Do nothing
            };
        }
        
        console.log("🏥 SurgiShopERPNext: NUCLEAR frappe barcode scanning DISABLED");
    }
    
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
    
    // Override frappe.call to intercept barcode API calls
    if (typeof frappe !== 'undefined' && frappe.call) {
        const originalFrappeCall = frappe.call;
        frappe.call = function(options) {
            // Check if this is a barcode scan API call
            if (options && options.method && options.method.includes('scan_barcode')) {
                console.log("🏥 SurgiShopERPNext: INTERCEPTED frappe.call barcode API:", options.method);
                // Return a promise that resolves with null to prevent errors
                return Promise.resolve({ message: null });
            }
            // For non-barcode calls, use original frappe.call
            return originalFrappeCall.call(this, options);
        };
        console.log("🏥 SurgiShopERPNext: frappe.call override installed");
    }
    
    // Override form barcode scanning methods more aggressively
    if (typeof frappe !== 'undefined' && frappe.ui && frappe.ui.form) {
        // Override Form.prototype.scan_barcode
        if (frappe.ui.form.Form && frappe.ui.form.Form.prototype) {
            frappe.ui.form.Form.prototype.scan_barcode = function(barcode) {
                console.log("🏥 SurgiShopERPNext: Form.prototype.scan_barcode DISABLED");
                // Do nothing - completely disable form barcode scanning
                return Promise.resolve(null);
            };
            console.log("🏥 SurgiShopERPNext: Form.prototype.scan_barcode DISABLED");
        }
        
        // Override any barcode scanning in forms
        if (frappe.ui.form.Form && frappe.ui.form.Form.prototype) {
            const originalRefresh = frappe.ui.form.Form.prototype.refresh;
            frappe.ui.form.Form.prototype.refresh = function() {
                // Call original refresh first
                if (originalRefresh) {
                    originalRefresh.call(this);
                }
                
                // Then disable any barcode scanning
                if (this.scan_barcode) {
                    this.scan_barcode = function(barcode) {
                        console.log("🏥 SurgiShopERPNext: Form scan_barcode DISABLED");
                        return Promise.resolve(null);
                    };
                }
            };
            console.log("🏥 SurgiShopERPNext: Form refresh override installed");
        }
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
