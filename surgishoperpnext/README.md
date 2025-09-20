# SurgiShopERPNext

Custom Frappe app for SurgiShop with ERPNext modifications.

## Features

### Stock Controller Override

This app overrides the default ERPNext StockController behavior to allow expired products to be received into the system for inbound transactions.

#### What it does:
- **Allows expired products** to be received through inbound transactions (Purchase Receipt, Purchase Invoice, Stock Entry with Material Receipt, etc.)
- **Maintains expiry validation** for outbound transactions to prevent selling expired products
- **Preserves all other stock validation** functionality

#### Supported Inbound Transactions:
- Purchase Receipt
- Purchase Invoice  
- Stock Entry (Material Receipt purpose)
- Stock Entry (Material Transfer with only target warehouse)
- Stock Reconciliation (positive quantities)
- Sales Returns (Sales Invoice/Delivery Note with is_return=True)

#### Outbound Transactions (expiry validation still enforced):
- Purchase Returns
- Stock Entry (Material Issue)
- Stock Entry (Material Transfer with both source and target warehouses)
- Sales Invoice (normal sales)
- Delivery Note (normal deliveries)

## Installation

1. Install the app in your Frappe/ERPNext instance:
   ```bash
   bench get-app surgishoperpnext
   bench install-app surgishoperpnext
   ```

2. The override will be automatically applied when the app is installed.

## Testing

Run the test suite to verify the implementation:

```bash
bench run-tests --app surgishoperpnext
```

## Technical Details

The override is implemented in `surgishoperpnext/overrides/stock_controller.py` and registered in `hooks.py` using the `doc_events` hook for better update-proofing.

The key function `is_inbound_transaction()` determines whether a transaction is bringing stock into the system, and if so, skips the batch expiry validation that would normally prevent receiving expired products.

This approach uses document event hooks instead of class inheritance, making it more resilient to ERPNext updates.

## License

MIT License