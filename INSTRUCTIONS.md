# SurgiShopERPNext - AI Assistant Instructions

## Project Overview

SurgiShopERPNext is a specialized Frappe/ERPNext app designed for surgical supply management with advanced GS1 barcode scanning capabilities. This app focuses on medical/surgical inventory management with research-friendly features for handling expired items.

## Key Features

### 🏥 Medical Focus
- **Surgical Supply Management**: Specifically designed for medical/surgical inventory
- **GS1 Barcode Processing**: Advanced barcode scanning for medical supplies
- **Research Capabilities**: Batch expiry override for research purposes
- **GTIN-01 Support**: Full support for Global Trade Item Number standards

### 🔍 Barcode Scanning
- **GS1 Standard Compliance**: Supports GTIN-01, Batch/Lot, Production Date, Expiry Date, Serial Number
- **Conditional Loading**: Only loads on specific doctypes for performance
- **Fallback Mechanisms**: Multiple layers of fallback for reliability
- **Browser Compatibility**: No Node.js dependencies

### 🔬 Research Features
- **Batch Expiry Override**: Completely disables batch expiry validation for research
- **Expired Item Handling**: Allows processing of expired items for research purposes
- **Comprehensive Logging**: Detailed logging for debugging and monitoring

## Project Structure

```
surgishoperpnext/
├── hooks.py                          # Main Frappe app configuration
├── surgishoperpnext/
│   ├── api/
│   │   └── barcode.py                # GS1 barcode API endpoints
│   ├── overrides/
│   │   └── stock_controller.py       # Batch expiry override logic
│   ├── page/
│   │   └── gs1_barcode_test/         # Test page for barcode functionality
│   └── patches/                      # Database migration patches
├── public/js/                        # JavaScript files
│   ├── bark.js                       # GS1 barcode parser
│   ├── gs1-barcode-scanner.js        # Main scanner class
│   ├── barcode-override.js           # API interception and form integration
│   ├── surgishoperpnext-v2.js        # Status logging
│   └── surgishoperpnext-init.js      # Conditional initialization
└── templates/
    └── pages/
        └── gs1-barcode-test.html      # Test page template
```

## Supported Doctypes

The barcode scanning functionality is **conditionally loaded** only for these doctypes:

- **Stock Entry** - Material transfers and adjustments
- **Purchase Order** - Purchase order management
- **Purchase Receipt** - Goods receipt processing
- **Purchase Invoice** - Purchase invoice processing
- **Sales Invoice** - Sales invoice processing
- **Delivery Note** - Delivery note processing
- **Stock Reconciliation** - Stock reconciliation

## JavaScript Architecture

### Conditional Loading System
- **Performance Optimized**: Scripts only load on relevant doctypes
- **Centralized Control**: All loading logic in `surgishoperpnext-init.js`
- **Smart Detection**: Automatically detects current doctype from multiple sources

### Core Components

#### 1. `bark.js`
- **GS1 Parser**: Browser-compatible GS1 barcode parser
- **Application Identifiers**: Supports GTIN-01, Batch/Lot, Production Date, etc.
- **No Dependencies**: Pure JavaScript implementation

#### 2. `gs1-barcode-scanner.js`
- **Main Scanner Class**: `SurgiShopGS1BarcodeScanner`
- **Form Integration**: Automatically adds items to ERPNext forms
- **Multi-Doctype Support**: Handles all supported transaction types

#### 3. `barcode-override.js`
- **API Interception**: Overrides ERPNext's default barcode scanning
- **Fallback Handling**: Multiple fallback mechanisms
- **Batch Dialog Integration**: Automatic batch selector triggering

#### 4. `surgishoperpnext-init.js`
- **Conditional Initialization**: Only initializes when in supported doctypes
- **Smart Detection**: Multiple methods to detect current doctype
- **Centralized Control**: Single point for all loading logic

## API Endpoints

### `get_item_by_gtin(gtin)`
- **Purpose**: Look up item by GTIN-01 barcode
- **Input**: 14-digit GTIN-01
- **Output**: Item details including code, name, UOM, rate, etc.
- **Fallback**: Searches by item code if barcode lookup fails

### `scan_barcode_fallback(search_value, ctx)`
- **Purpose**: Fallback barcode scanning using ERPNext's original method
- **Usage**: Called when GS1 scanner doesn't find a match
- **Integration**: Seamlessly integrates with existing ERPNext functionality

### `validate_gtin_format(gtin)`
- **Purpose**: Validate GTIN-01 format
- **Input**: GTIN string
- **Output**: Boolean validation result

### `debug_barcode_scan(barcode, context)`
- **Purpose**: Debug function for barcode scanning
- **Usage**: Testing and troubleshooting
- **Output**: Detailed scan results and error information

## Batch Expiry Override

### Research-Focused Design
- **Complete Override**: Disables batch expiry validation for ALL transactions
- **Research Purpose**: Allows processing of expired items for research
- **Comprehensive Coverage**: Handles all major transaction types
- **Proper Restoration**: Restores original validation after processing

### Supported Transactions
- Purchase Receipt
- Purchase Invoice
- Stock Entry
- Stock Reconciliation
- Sales Invoice
- Delivery Note

## Configuration

### hooks.py Configuration
```python
# Doctype-specific JavaScript loading
doctype_js = {
    "Stock Entry": "/assets/surgishoperpnext/js/...",
    "Purchase Order": "/assets/surgishoperpnext/js/...",
    # ... other doctypes
}

# Document event hooks for batch expiry override
doc_events = {
    "Purchase Receipt": {
        "before_validate": "surgishoperpnext.surgishoperpnext.overrides.stock_controller.disable_batch_expiry_validation",
        "after_insert": "surgishoperpnext.surgishoperpnext.overrides.stock_controller.restore_batch_expiry_validation",
        "on_cancel": "surgishoperpnext.surgishoperpnext.overrides.stock_controller.restore_batch_expiry_validation"
    },
    # ... other doctypes
}
```

## Testing

### Test Page
- **URL**: `/gs1-barcode-test`
- **Features**: Interactive barcode testing interface
- **Debug Tools**: Comprehensive debugging and status checking
- **Sample Data**: Pre-configured test barcodes

### Console Testing
```javascript
// Available test functions
runGS1ScannerTests()                    // Run all tests
testGTIN('01234567890123')              // Test specific GTIN
testBarcodeScanInForm('01234567890123') // Test barcode scan in form
testInERPNextForm('01234567890123')     // Test in current ERPNext form
navigateToERPNextForm('Stock Entry')    // Navigate to Stock Entry form
```

## Development Guidelines

### Code Style
- **JavaScript**: ES6+ with jQuery integration
- **Python**: PEP 8 compliant
- **Error Handling**: Comprehensive try-catch blocks
- **Logging**: Detailed console logging for debugging

### Performance Considerations
- **Conditional Loading**: Scripts only load when needed
- **Efficient Parsing**: Optimized GS1 barcode parsing
- **Memory Management**: Proper cleanup and restoration
- **Fallback Mechanisms**: Multiple layers of fallback

### Security
- **Input Validation**: GTIN format validation
- **Error Handling**: Graceful error handling
- **API Security**: Whitelisted methods only
- **Data Sanitization**: Clean input processing

## Troubleshooting

### Common Issues

#### 1. Scanner Not Initializing
- **Check**: Console for doctype detection messages
- **Verify**: Current doctype is in supported list
- **Debug**: Use test page to check scanner status

#### 2. Barcode Not Working
- **Check**: GTIN format (14 digits)
- **Verify**: Item exists in system with correct barcode
- **Debug**: Use debug functions to trace the issue

#### 3. Batch Dialog Not Triggering
- **Check**: Item has batch tracking enabled
- **Verify**: GS1 barcode contains batch information
- **Debug**: Check stored GS1 data in console

### Debug Commands
```javascript
// Check scanner status
window.surgiShopGS1Scanner.debugMode = true

// Check stored GS1 data
console.log(window.surgiShopGS1Data)

// Test barcode parsing
window.surgiShopGS1Scanner.parseGS1Barcode('01234567890123')
```

## Maintenance

### Regular Tasks
- **Version Updates**: Update version numbers in hooks.py
- **Testing**: Regular testing of barcode functionality
- **Logging**: Monitor console logs for issues
- **Performance**: Monitor loading times and memory usage

### Updates
- **JavaScript**: Update version numbers in hooks.py
- **API**: Test API endpoints after changes
- **Forms**: Verify form integration still works
- **Batch Override**: Test batch expiry override functionality

## Support

### Documentation
- **Code Comments**: Comprehensive inline documentation
- **Console Logging**: Detailed logging for debugging
- **Test Page**: Interactive testing interface
- **API Documentation**: Well-documented API endpoints

### Debugging
- **Console Logs**: Check browser console for detailed logs
- **Test Page**: Use `/gs1-barcode-test` for interactive testing
- **API Testing**: Use debug functions for API testing
- **Form Integration**: Test in actual ERPNext forms

## Version Management

### Automatic Version Bumping
- **AI Assistant Responsibility**: The AI assistant will automatically increment the version number (x.y.n) where n is the patch version before every git push
- **Version Format**: Semantic versioning (x.y.z) where:
  - x = Major version (breaking changes)
  - y = Minor version (new features)
  - z = Patch version (bug fixes)
- **Files Updated**: 
  - `surgishoperpnext/__init__.py` - Main version
  - `surgishoperpnext/hooks.py` - JavaScript version numbers
  - `INSTRUCTIONS.md` - Documentation version

### Manual Version Bumping
If manual version bumping is needed:
1. Edit `surgishoperpnext/__init__.py` and update `__version__`
2. Update version numbers in `surgishoperpnext/hooks.py` (v=1.0.x)
3. Update version in `INSTRUCTIONS.md`
4. Commit and push changes

## Version Information

- **Current Version**: 0.0.3
- **Python Requirements**: >=3.10
- **Frappe Compatibility**: ~15.0.0
- **License**: MIT

## Contact

- **Developer**: SurgiShop
- **Email**: Arthur.Borges@SurgiShop.com
- **Repository**: GitHub - surgishoperpnext

---

**Note**: This app is specifically designed for surgical supply management with research capabilities. The batch expiry override is intentional for research purposes and should be used responsibly.
