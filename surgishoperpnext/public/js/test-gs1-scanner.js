/**
 * SurgiShopERPNext GS1 Barcode Scanner Test Script
 * Run this in the browser console on beta.surgi.shop
 */

console.log("🏥 SurgiShopERPNext: GS1 Barcode Scanner Test Script");
console.log("Domain: beta.surgi.shop");
console.log("ERPNext Home: https://beta.surgi.shop/app/home");
console.log("Test Page: https://beta.surgi.shop/gs1-barcode-test");

// Test function to run all GS1 scanner tests
function runGS1ScannerTests() {
    console.log("🏥 Starting GS1 Scanner Tests...");
    
    // Test 1: Check if scanner is initialized
    console.log("Test 1: Scanner Initialization");
    if (window.surgiShopGS1Scanner) {
        console.log("✅ GS1 Scanner is initialized");
        console.log("Scanner object:", window.surgiShopGS1Scanner);
    } else {
        console.log("❌ GS1 Scanner not initialized");
        return;
    }
    
    // Test 2: Check bark.js loading
    console.log("Test 2: Bark.js Library");
    if (window.surgiShopGS1Scanner.barkLoaded) {
        console.log("✅ Bark.js library loaded");
    } else {
        console.log("❌ Bark.js library not loaded");
    }
    
    // Test 3: Test GTIN parsing
    console.log("Test 3: GTIN Parsing");
    const testGTIN = "01234567890123";
    try {
        const parsed = window.surgiShopGS1Scanner.parseGS1Barcode(testGTIN);
        console.log("✅ GTIN parsing successful:", parsed);
    } catch (error) {
        console.log("❌ GTIN parsing failed:", error);
    }
    
    // Test 4: Test item lookup
    console.log("Test 4: Item Lookup");
    frappe.call({
        method: 'surgishoperpnext.surgishoperpnext.api.barcode.get_item_by_gtin',
        args: { gtin: testGTIN },
        callback: function(response) {
            if (response.message) {
                console.log("✅ Item lookup successful:", response.message);
            } else {
                console.log("❌ No item found for GTIN:", testGTIN);
            }
        },
        error: function(error) {
            console.log("❌ Item lookup failed:", error);
        }
    });
    
    // Test 5: Test debug mode
    console.log("Test 5: Debug Mode");
    window.surgiShopGS1Scanner.debugMode = true;
    console.log("✅ Debug mode enabled");
    
    // Test 6: Test scanner status
    console.log("Test 6: Scanner Status");
    const status = {
        initialized: !!window.surgiShopGS1Scanner,
        barkLoaded: window.surgiShopGS1Scanner.barkLoaded,
        debugMode: window.surgiShopGS1Scanner.debugMode,
        excludedDialogs: window.surgiShopGS1Scanner.excludedDialogs
    };
    console.log("✅ Scanner status:", status);
    
    console.log("🏥 GS1 Scanner Tests Complete!");
}

// Test function for specific GTIN
function testGTIN(gtin) {
    console.log(`🏥 Testing GTIN: ${gtin}`);
    
    // Parse GTIN
    const parsed = window.surgiShopGS1Scanner.parseGS1Barcode(gtin);
    console.log("Parsed result:", parsed);
    
    // Lookup item
    frappe.call({
        method: 'surgishoperpnext.surgishoperpnext.api.barcode.get_item_by_gtin',
        args: { gtin: gtin },
        callback: function(response) {
            console.log("Item lookup result:", response.message);
        }
    });
}

// Test function for barcode scanning in forms
function testBarcodeScanInForm(gtin) {
    console.log(`🏥 Testing barcode scan in form: ${gtin}`);
    
    // Simulate barcode scan
    window.surgiShopGS1Scanner.processGS1Barcode({ barcode: gtin });
}

// Test function for ERPNext forms
function testInERPNextForm(gtin) {
    console.log(`🏥 Testing in ERPNext form: ${gtin}`);
    
    // Check if we're in an ERPNext form
    if (frappe.get_cur_frm()) {
        console.log("✅ In ERPNext form:", frappe.get_cur_frm().doctype);
        window.surgiShopGS1Scanner.processGS1Barcode({ barcode: gtin });
    } else {
        console.log("❌ Not in an ERPNext form. Please open a form first (Stock Entry, Purchase Receipt, etc.)");
    }
}

// Test function to navigate to ERPNext forms
function navigateToERPNextForm(doctype) {
    console.log(`🏥 Navigating to ${doctype} form`);
    frappe.set_route("Form", doctype, "new");
}

// Quick test commands
console.log("🏥 Available test commands:");
console.log("runGS1ScannerTests() - Run all tests");
console.log("testGTIN('01234567890123') - Test specific GTIN");
console.log("testBarcodeScanInForm('01234567890123') - Test barcode scan in form");
console.log("testInERPNextForm('01234567890123') - Test in current ERPNext form");
console.log("navigateToERPNextForm('Stock Entry') - Navigate to Stock Entry form");
console.log("window.surgiShopGS1Scanner.debugMode = true - Enable debug mode");

// Auto-run tests if scanner is ready
if (window.surgiShopGS1Scanner) {
    console.log("🏥 Scanner ready, running tests...");
    runGS1ScannerTests();
} else {
    console.log("🏥 Scanner not ready, waiting...");
    // Wait for scanner to be ready
    const checkScanner = setInterval(() => {
        if (window.surgiShopGS1Scanner) {
            clearInterval(checkScanner);
            console.log("🏥 Scanner ready, running tests...");
            runGS1ScannerTests();
        }
    }, 1000);
}
