# SurgiShopERPNext - AI Assistant Instructions

## Project Overview

SurgiShopERPNext is a specialized Frappe/ERPNext app designed to allow expired products in transactions for research purposes. This app focuses on disabling batch expiry validation to enable processing of expired items in medical/surgical inventory management.

## Key Features

### 🔬 Research-Focused Design
- **Batch Expiry Override**: Completely disables batch expiry validation for ALL transactions
- **Expired Item Handling**: Allows processing of expired items for research purposes
- **Comprehensive Coverage**: Handles all major transaction types
- **Proper Restoration**: Restores original validation after processing

### 🏥 Medical Focus
- **Surgical Supply Management**: Specifically designed for medical/surgical inventory
- **Research Capabilities**: Batch expiry override for research purposes
- **Comprehensive Logging**: Detailed logging for debugging and monitoring

## Project Structure

```
surgishoperpnext/
├── hooks.py                          # Main Frappe app configuration
├── surgishoperpnext/
│   ├── overrides/
│   │   └── stock_controller.py       # Batch expiry override logic
│   └── patches/                      # Database migration patches
└── templates/
    └── pages/
```

## Supported Transactions

The batch expiry override functionality is applied to these doctypes:

- **Purchase Receipt** - Goods receipt processing
- **Purchase Invoice** - Purchase invoice processing
- **Stock Entry** - Material transfers and adjustments
- **Stock Reconciliation** - Stock reconciliation
- **Sales Invoice** - Sales invoice processing
- **Delivery Note** - Delivery note processing

## Batch Expiry Override

### Research-Focused Design
- **Complete Override**: Disables batch expiry validation for ALL transactions
- **Research Purpose**: Allows processing of expired items for research
- **Comprehensive Coverage**: Handles all major transaction types
- **Proper Restoration**: Restores original validation after processing

### How It Works

1. **Before Validation**: Disables batch expiry validation by monkey-patching `StockController.validate_serialized_batch`
2. **After Processing**: Restores original validation function
3. **On Cancel**: Restores original validation function

### Implementation Details

The override works by:
- Storing the original `validate_serialized_batch` method
- Replacing it with a no-op function during document processing
- Restoring the original method after processing is complete

## Configuration

### hooks.py Configuration
```python
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

## Development Guidelines

### Code Style
- **Python**: PEP 8 compliant
- **Error Handling**: Comprehensive try-catch blocks
- **Logging**: Detailed logging for debugging

### Performance Considerations
- **Efficient Override**: Minimal performance impact
- **Memory Management**: Proper cleanup and restoration
- **Error Handling**: Graceful error handling

### Security
- **Input Validation**: Proper validation of document types
- **Error Handling**: Graceful error handling
- **Data Integrity**: Maintains data integrity while allowing expired items

## Troubleshooting

### Common Issues

#### 1. Override Not Working
- **Check**: Console logs for override function calls
- **Verify**: Document events are properly configured in hooks.py
- **Debug**: Check frappe logs for error messages

#### 2. Validation Not Restored
- **Check**: After processing logs
- **Verify**: Original function is properly stored
- **Debug**: Check for exceptions in restore function

### Debug Commands
```python
# Check if override is active
import frappe
from erpnext.controllers.stock_controller import StockController
print(StockController.validate_serialized_batch)

# Check frappe logs
frappe.logger().info("Checking override status")
```

## Maintenance

### Regular Tasks
- **Version Updates**: Update version numbers in hooks.py
- **Testing**: Regular testing of batch expiry override functionality
- **Logging**: Monitor frappe logs for issues
- **Performance**: Monitor processing times

### Updates
- **Override Logic**: Test batch expiry override after changes
- **Document Events**: Verify document event hooks still work
- **Error Handling**: Test error scenarios

## Support

### Documentation
- **Code Comments**: Comprehensive inline documentation
- **Logging**: Detailed logging for debugging
- **API Documentation**: Well-documented override functions

### Debugging
- **Frappe Logs**: Check frappe logs for detailed information
- **Console Logs**: Monitor console for override status
- **Error Handling**: Test error scenarios

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

- **Current Version**: 0.1.0
- **Python Requirements**: >=3.10
- **Frappe Compatibility**: ~15.0.0
- **License**: MIT

## Contact

- **Developer**: SurgiShop
- **Email**: Arthur.Borges@SurgiShop.com
- **Repository**: GitHub - surgishoperpnext

---

**Note**: This app is specifically designed for research purposes to allow processing of expired items. The batch expiry override is intentional for research purposes and should be used responsibly.