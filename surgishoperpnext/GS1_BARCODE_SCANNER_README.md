# SurgiShopERPNext GS1 Barcode Scanner

## Overview

The SurgiShopERPNext GS1 Barcode Scanner is a custom implementation that overrides the default barcode scanning functionality in ERPNext for all doctypes except the Serial/Batch Selector Dialog. It implements GS1 barcode parsing using the bark.js library to extract GTIN-01 codes and automatically add matching items to transaction forms.

## Features

- **GS1 Barcode Parsing**: Uses bark.js library to parse GS1 barcodes and extract GTIN-01 codes
- **Universal Override**: Works on all ERPNext doctypes except Serial/Batch Selector Dialog
- **Automatic Item Lookup**: Finds items by GTIN-01 barcode and adds them to forms
- **Comprehensive Debugging**: Extensive console logging for troubleshooting
- **Fallback Support**: Falls back to original ERPNext barcode scanning if GS1 parsing fails
- **Mobile Compatible**: Works with mobile devices and camera-based scanning

## Installation

1. The GS1 barcode scanner is automatically included when you install the SurgiShopERPNext app
2. The scanner initializes automatically when the page loads
3. No additional configuration is required

## How It Works

### 1. Barcode Scanning Process

```javascript
// When a barcode is scanned:
1. Check if we're in an excluded dialog (Serial/Batch Selector)
2. If excluded, use original ERPNext barcode scanning
3. If not excluded, process with GS1 scanner:
   - Parse barcode using bark.js
   - Extract GTIN-01 (Application Identifier 01)
   - Look up item by GTIN-01
   - Add item to current form
```

### 2. GS1 Barcode Structure

GS1 barcodes contain Application Identifiers (AIs):
- **01**: GTIN-01 (Global Trade Item Number)
- **10**: Batch/Lot Number
- **11**: Production Date
- **17**: Expiration Date
- **21**: Serial Number

The scanner specifically looks for AI "01" (GTIN-01) to identify items.

### 3. Item Lookup Process

```python
# Backend API: get_item_by_gtin(gtin)
1. Clean and validate GTIN-01 format (14 digits)
2. Search Item Barcode child table for matching barcode
3. If found, return item details
4. Fallback: search by item_code if GTIN matches
5. Return item information or None
```

## Supported Doctypes

The GS1 barcode scanner works on all ERPNext doctypes including:

- **Stock Entry**
- **Purchase Receipt**
- **Purchase Invoice**
- **Sales Invoice**
- **Delivery Note**
- **Stock Reconciliation**
- **Material Request**
- **Work Order**
- And any other doctype with an 'items' child table

### Excluded Doctypes

The following dialogs are excluded and will use the original ERPNext barcode scanning:

- **Serial No and Batch Selector Dialog**
- **Batch Selector Dialog**
- **Serial No Selector Dialog**

## Testing

### Test Page

Access the test page at: `/gs1-barcode-test`

The test page provides:
- Manual barcode input testing
- Sample GTIN-01 codes for testing
- Debug information display
- Scanner status monitoring

### Sample Test Data

Create test items with these GTIN-01 barcodes:
- `01234567890123`
- `09876543210987`
- `01111111111111`

### Debug Mode

Enable debug mode to see detailed console logging:

```javascript
// In browser console:
window.surgiShopGS1Scanner.debugMode = true;
```

## Configuration

### Debug Settings

```javascript
// Enable/disable debug logging
window.surgiShopGS1Scanner.debugMode = true; // or false

// Check scanner status
window.surgiShopGS1Scanner.showScannerStatus();
```

### Excluded Dialogs

To modify excluded dialogs, edit the `excludedDialogs` array in `gs1-barcode-scanner.js`:

```javascript
this.excludedDialogs = [
    'Serial No and Batch Selector',
    'Batch Selector',
    'Serial No Selector',
    'Your Custom Dialog'  // Add custom dialogs here
];
```

## API Methods

### Frontend Methods

```javascript
// Process a barcode manually
window.surgiShopGS1Scanner.processGS1Barcode({ barcode: '01234567890123' });

// Check if scanner is ready
window.surgiShopGS1Scanner.barkLoaded; // true/false

// Enable debug mode
window.surgiShopGS1Scanner.debugMode = true;
```

### Backend API Methods

```python
# Get item by GTIN-01
frappe.call('surgishoperpnext.surgishoperpnext.api.barcode.get_item_by_gtin', {
    'gtin': '01234567890123'
})

# Validate GTIN format
frappe.call('surgishoperpnext.surgishoperpnext.api.barcode.validate_gtin_format', {
    'gtin': '01234567890123'
})

# Debug barcode scan
frappe.call('surgishoperpnext.surgishoperpnext.api.barcode.debug_barcode_scan', {
    'barcode': '01234567890123',
    'context': 'test'
})
```

## Troubleshooting

### Common Issues

1. **Scanner not initializing**
   - Check browser console for errors
   - Ensure bark.js is loading properly
   - Verify the script is included in hooks.py

2. **Barcode not recognized**
   - Check if barcode contains valid GTIN-01 (AI 01)
   - Verify item exists with matching barcode
   - Check debug logs for parsing errors

3. **Item not found**
   - Ensure item has barcode in Item Barcode child table
   - Check GTIN-01 format (14 digits)
   - Verify item is not disabled

4. **Dialog not excluded**
   - Check dialog title matches excluded dialogs list
   - Add custom dialog to excludedDialogs array

### Debug Information

Enable debug mode and check console for:
- Barcode parsing results
- GTIN-01 extraction
- Item lookup results
- Form integration status
- Error messages

### Console Commands

```javascript
// Check scanner status
console.log(window.surgiShopGS1Scanner);

// Test barcode parsing
window.surgiShopGS1Scanner.parseGS1Barcode('01234567890123');

// Check excluded dialog status
window.surgiShopGS1Scanner.isExcludedDialog();

// Enable debug mode
window.surgiShopGS1Scanner.debugMode = true;
```

## File Structure

```
surgishoperpnext/
├── public/js/
│   └── gs1-barcode-scanner.js          # Main scanner implementation
├── surgishoperpnext/api/
│   └── barcode.py                      # Backend API methods
├── templates/pages/
│   └── gs1-barcode-test.html           # Test page
└── hooks.py                            # App configuration
```

## Dependencies

- **bark.js**: GS1 barcode parsing library (loaded from CDN)
- **jQuery**: For DOM manipulation
- **Frappe Framework**: For ERPNext integration

## Browser Compatibility

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+
- Mobile browsers with camera support

## License

MIT License - See LICENSE file for details.

## Support

For issues and questions:
- Check the debug console for error messages
- Use the test page to verify functionality
- Review the troubleshooting section
- Contact SurgiShop support if needed

