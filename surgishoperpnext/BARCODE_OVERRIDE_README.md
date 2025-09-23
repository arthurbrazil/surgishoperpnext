# SurgiShopERPNext Barcode Override

## Overview

The SurgiShopERPNext Barcode Override automatically intercepts ERPNext's barcode scanning functionality to process GS1 barcodes using the custom GS1 barcode scanner. This provides seamless integration between GS1 barcode scanning and ERPNext's existing barcode system.

## How It Works

### 1. Automatic Override
- The override is automatically applied when the SurgiShopERPNext app loads
- No manual configuration or console commands required
- Works across all ERPNext forms that support barcode scanning

### 2. GS1 Barcode Processing
- Intercepts all calls to `erpnext.stock.utils.scan_barcode`
- Parses GS1 barcodes to extract GTIN-01 codes
- Uses the custom `get_item_by_gtin` API to find items
- Transforms responses to match ERPNext's expected format

### 3. Fallback Support
- Falls back to ERPNext's original barcode scanning for non-GS1 barcodes
- Handles cases where GS1 parsing fails
- Maintains full compatibility with existing ERPNext functionality

## Files Modified

### JavaScript Files
- `barcode-override.js` - Main override implementation
- `hooks.py` - Updated to include the override script

### Python Files
- `api/barcode.py` - Added fallback method for non-GS1 barcodes

## Implementation Details

### Override Methods

1. **frappe.call Override**
   - Intercepts API calls to `erpnext.stock.utils.scan_barcode`
   - Processes GS1 barcodes through custom scanner
   - Falls back to original API for non-GS1 barcodes

2. **BarcodeScanner Class Override**
   - Extends ERPNext's BarcodeScanner class
   - Provides additional coverage for form-level barcode scanning
   - Maintains all original functionality

### GS1 Barcode Format

The override supports standard GS1 barcodes with the following structure:
- **01** - GTIN-01 (14 digits)
- **10** - Batch/Lot Number
- **17** - Expiration Date
- **21** - Serial Number

Example: `010123456789012310ABC12317250101`

### API Integration

- **Primary API**: `surgishoperpnext.surgishoperpnext.api.barcode.get_item_by_gtin`
- **Fallback API**: `surgishoperpnext.surgishoperpnext.api.barcode.scan_barcode_fallback`
- **Original API**: `erpnext.stock.utils.scan_barcode`

## Testing

### Test GS1 Barcodes
```
010123456789012310ABC12317250101
010123456789012310LOT45617241231
010123456789012310TEST12317250115
```

### Test Regular Barcodes
```
1234567890123
ITEM-001
```

## Troubleshooting

### Common Issues

1. **Override Not Working**
   - Check browser console for JavaScript errors
   - Verify all scripts are loading in correct order
   - Ensure GS1 scanner is initialized

2. **GS1 Barcodes Not Recognized**
   - Verify barcode format (must start with 01)
   - Check if item exists with matching GTIN-01
   - Review console logs for parsing errors

3. **Fallback Not Working**
   - Ensure ERPNext's original scan_barcode method is available
   - Check for API permission issues
   - Verify fallback method is properly registered

### Debug Information

Enable debug mode in the console:
```javascript
window.surgiShopGS1Scanner.debugMode = true;
```

Check override status:
```javascript
console.log("Override active:", frappe.call !== window.originalFrappeCall);
console.log("GS1 Scanner ready:", !!window.surgiShopGS1Scanner);
```

## Deployment

The override is automatically included when the SurgiShopERPNext app is installed. No additional configuration is required.

### Version Information
- **barcode-override.js**: v1.0.6
- **bark.js**: v1.0.5
- **gs1-barcode-scanner.js**: v1.0.5

## License

MIT License - See license.txt for details.
