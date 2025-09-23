# SurgiShopERPNext Auto Batch Dialog Feature

## Overview

The SurgiShopERPNext app now automatically triggers the "Add Batch No" dialog when scanning GS1 barcodes that contain batch information. This streamlines the workflow by eliminating the need for manual batch selection.

## How It Works

### 1. **Automatic Detection**
- When a GS1 barcode is scanned, the system checks if it contains batch information (AI 10)
- If the scanned item requires batch tracking (`has_batch_no = true`), the batch dialog automatically opens

### 2. **Supported Doctypes**
The auto batch dialog works on these ERPNext forms:
- **Purchase Receipt** - Receiving goods with batch tracking
- **Purchase Invoice** - Billing with batch information
- **Stock Entry** - Material transfers with batches
- **Sales Invoice** - Selling batched items
- **Delivery Note** - Shipping with batch tracking

### 3. **GS1 Barcode Processing**
When scanning a GS1 barcode like: `010123456789012310ABC12317250101`

**Parsed Data:**
- **GTIN-01**: `01234567890123` (item identification)
- **Lot Number**: `ABC123` (batch information)
- **Expiry Date**: `250101` (January 1, 2025)

**Result:**
- Item is found by GTIN-01
- Batch dialog opens automatically
- System searches for existing batch with lot `ABC123`
- If not found, offers to create new batch `ITEM-001-ABC123`

## Features

### **Smart Batch Management**
- **Existing Batch**: Pre-selects matching batch if found
- **New Batch Creation**: Automatically creates batch with GS1 data
- **Expiry Date**: Sets batch expiry from GS1 expiry date
- **Batch ID Format**: Uses `{item_code}-{lot_number}` format

### **User Experience**
- **One-Click Scanning**: Scan barcode → batch dialog opens
- **Pre-filled Data**: Batch information already populated
- **Confirmation**: User can modify or confirm batch selection
- **Fallback**: Works with non-GS1 barcodes (no auto-dialog)

## Technical Implementation

### **Trigger Points**
1. **frappe.call Override**: Intercepts `erpnext.stock.utils.scan_barcode`
2. **BarcodeScanner Class Override**: Handles class-based barcode scanning
3. **GS1 Parser Integration**: Uses bark.js for GS1 barcode parsing

### **Batch Dialog Integration**
- Uses ERPNext's native `SerialNoBatchSelector` class
- Pre-populates batch field with matching lot numbers
- Creates batches automatically with GS1 data
- Handles expiry date conversion (YYMMDD → YYYY-MM-DD)

## Usage Examples

### **Example 1: Purchase Receipt**
1. Open Purchase Receipt form
2. Scan GS1 barcode: `010123456789012310LOT45617241231`
3. Batch dialog opens automatically
4. System finds/creates batch `ITEM-001-LOT456`
5. User confirms batch selection
6. Item added to receipt with correct batch

### **Example 2: Sales Invoice**
1. Open Sales Invoice form
2. Scan same GS1 barcode
3. Batch dialog opens with existing batch
4. User selects batch for sale
5. Item added with batch tracking

## Configuration

### **Required Settings**
- Item must have `has_batch_no = true`
- GS1 barcode must contain AI 10 (lot number)
- User must have permission to create batches

### **Optional Settings**
- Batch ID format can be customized
- Expiry date handling can be modified
- Dialog timing can be adjusted

## Error Handling

### **Common Scenarios**
- **No Batch Info**: Dialog doesn't open (normal behavior)
- **Item Not Found**: Falls back to standard barcode scanning
- **Permission Denied**: Shows error message
- **Invalid GS1**: Uses fallback scanning method

### **Logging**
All batch dialog activities are logged to the browser console:
```
🏥 SurgiShopERPNext: Checking if batch dialog should be triggered...
🏥 SurgiShopERPNext: GS1 barcode contains batch info: ABC123
🏥 SurgiShopERPNext: Triggering batch dialog for Purchase Receipt
🏥 SurgiShopERPNext: Batch created: BATCH-001
```

## Benefits

1. **Faster Workflow**: Eliminates manual batch selection steps
2. **Reduced Errors**: Automatic batch creation with correct data
3. **GS1 Compliance**: Full support for GS1 barcode standards
4. **User Friendly**: Seamless integration with ERPNext interface
5. **Flexible**: Works with existing and new batches

## Troubleshooting

### **Dialog Not Opening**
- Check if item has `has_batch_no = true`
- Verify GS1 barcode contains AI 10 (lot number)
- Check browser console for error messages

### **Batch Not Found**
- Ensure batch exists in the system
- Check batch ID format matches expected pattern
- Verify user has batch creation permissions

### **Expiry Date Issues**
- Ensure GS1 expiry is in YYMMDD format
- Check date conversion logic
- Verify batch expiry date field permissions
