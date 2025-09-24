/**
 * SurgiShopERPNext - ERPNext Barcode Scanner Disabler
 * Completely disables ERPNext's barcode scanner to prevent conflicts
 */

console.log("🏥 SurgiShopERPNext: Loading ERPNext Barcode Scanner Disabler...");

// Immediately disable ERPNext's barcode scanner - ULTRA AGGRESSIVE
(function() {
    'use strict';
    
    console.log("🏥 SurgiShopERPNext: ULTRA AGGRESSIVE DISABLING of ERPNext barcode scanner...");
    
    // Override XMLHttpRequest to intercept barcode API calls
    if (typeof XMLHttpRequest !== 'undefined') {
        const originalXHR = XMLHttpRequest;
        XMLHttpRequest = function() {
            const xhr = new originalXHR();
            const originalOpen = xhr.open;
            const originalSend = xhr.send;
            
            xhr.open = function(method, url, async, user, password) {
                // Check if this is a barcode scan API call
                if (url && url.includes('scan_barcode')) {
                    console.log("🏥 SurgiShopERPNext: INTERCEPTED barcode API call:", url);
                    // Override the response to return null
                    xhr.send = function(data) {
                        console.log("🏥 SurgiShopERPNext: BLOCKING barcode API call");
                        // Simulate a successful response with null data
                        setTimeout(() => {
                            Object.defineProperty(xhr, 'readyState', { value: 4, writable: false });
                            Object.defineProperty(xhr, 'status', { value: 200, writable: false });
                            Object.defineProperty(xhr, 'responseText', { value: '{"message": null}', writable: false });
                            if (xhr.onreadystatechange) {
                                xhr.onreadystatechange();
                            }
                        }, 0);
                    };
                } else {
                    originalSend.call(xhr, data);
                }
            };
            
            return xhr;
        };
        console.log("🏥 SurgiShopERPNext: XMLHttpRequest override installed");
    }
    
    // Override fetch API to intercept barcode API calls
    if (typeof fetch !== 'undefined') {
        const originalFetch = fetch;
        fetch = function(url, options) {
            if (url && url.includes('scan_barcode')) {
                console.log("🏥 SurgiShopERPNext: INTERCEPTED fetch barcode API call:", url);
                return Promise.resolve({
                    ok: true,
                    status: 200,
                    json: () => Promise.resolve({ message: null }),
                    text: () => Promise.resolve('{"message": null}')
                });
            }
            return originalFetch(url, options);
        };
        console.log("🏥 SurgiShopERPNext: fetch API override installed");
    }
    
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
    
    // Override jQuery AJAX to intercept barcode API calls
    if (typeof $ !== 'undefined' && $.ajax) {
        const originalAjax = $.ajax;
        $.ajax = function(options) {
            if (options && options.url && options.url.includes('scan_barcode')) {
                console.log("🏥 SurgiShopERPNext: INTERCEPTED jQuery AJAX barcode API call:", options.url);
                // Return a promise that resolves with null
                return Promise.resolve({
                    message: null,
                    status: 200
                });
            }
            return originalAjax(options);
        };
        console.log("🏥 SurgiShopERPNext: jQuery AJAX override installed");
    }
    
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
