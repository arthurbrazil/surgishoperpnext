// surgishoperpnext/public/js/custom-serial-batch-selector.js
// Custom Serial Batch Selector with GS1 Scanning Support

// Namespace
if (typeof window.surgishop === "undefined") {
  window.surgishop = {};
}

surgishop.CustomSerialBatchPackageSelector = class CustomSerialBatchPackageSelector extends (
  erpnext.SerialBatchPackageSelector
) {
  constructor(opts) {
    super(opts);
    this.gs1_parser_api =
      "surgishoperpnext.surgishoperpnext.api.gs1_parser.parse_gs1_and_get_batch";
    
    // Log item information for debugging
    if (this.item) {
      console.log(`🏥 SurgiShopERPNext: Serial/Batch Selector opened for item: ${this.item.item_code}`);
    }
  }

  // Override to add scan field and item number display
  prepare_dialog() {
    super.prepare_dialog();

    // Add item number display field at the very top
    const itemCode = this.item ? this.item.item_code : "Unknown Item";
    const itemName = this.item ? this.item.item_name : "";
    const displayValue = itemName ? `${itemCode} - ${itemName}` : itemCode;
    
    this.dialog.fields_dict.item_display = new frappe.ui.Field({
      label: __("Item"),
      fieldname: "item_display",
      fieldtype: "Data",
      options: "",
      read_only: 1,
      default: displayValue,
    });

    // Add scan field to dialog
    this.dialog.fields_dict.scan_gs1 = new frappe.ui.Field({
      label: __("Scan GS1 Barcode"),
      fieldname: "scan_gs1",
      fieldtype: "Data",
      options: "",
      change: () => this.process_gs1_scan(),
    });

    // Insert fields at the top (item display first, then scan field)
    this.dialog.fields.splice(0, 0, this.dialog.fields_dict.item_display.df);
    this.dialog.fields.splice(1, 0, this.dialog.fields_dict.scan_gs1.df);
    this.dialog.refresh_fields();
    
    // Update dialog title to include item code
    if (this.item && this.item.item_code) {
      const title = this.item.item_name 
        ? __("Add Serial / Batch No - {0} ({1})", [this.item.item_code, this.item.item_name])
        : __("Add Serial / Batch No - {0}", [this.item.item_code]);
      this.dialog.set_title(title);
    }
    
    this.dialog.fields_dict.scan_gs1.$input.focus();
  }

  // Custom method to process GS1 scan
  process_gs1_scan() {
    const input = this.dialog.get_value("scan_gs1");
    if (!input) return;

    console.log(
      "🏥 SurgiShopERPNext: Processing GS1 scan in bundle selector:",
      input
    );

    // Clear input
    this.dialog.set_value("scan_gs1", "");

    // Parse GS1 string (reuse logic from custom-barcode-scanner if available)
    const gs1_data = this.parse_gs1_string(input);
    if (!gs1_data) {
      frappe.msgprint(__("Invalid GS1 format. Please scan again."));
      return;
    }

    // Call GS1 API
    frappe.call({
      method: this.gs1_parser_api,
      args: {
        gtin: gs1_data.gtin,
        lot: gs1_data.lot,
        expiry: gs1_data.expiry,
      },
      callback: (r) => {
        if (r.message && r.message.batch) {
          // Add to bundle
          this.add_to_bundle(r.message);
        } else {
          frappe.msgprint(__("Failed to process GS1 scan."));
        }
      },
    });
  }

  /**
   * Parses a GS1 string using the shared GS1Parser utility.
   * @param {string} gs1_string The raw scanned string
   * @returns {object|null} Parsed data {gtin, lot, expiry} or null if not matching
   */
  parse_gs1_string(gs1_string) {
    // Use the shared GS1Parser utility
    if (window.surgishop && window.surgishop.GS1Parser) {
      return window.surgishop.GS1Parser.parse(gs1_string);
    } else {
      console.error('🏥 GS1Parser not loaded! Make sure gs1-utils.js is included.');
      return null;
    }
  }

  // Custom method to add parsed GS1 data to bundle
  add_to_bundle(data) {
    // Assuming bundle table has fields for batch_no, expiry_date, etc.
    const row = this.dialog.fields_dict.bundles.grid.add_new_row();
    frappe.model.set_value(row.doctype, row.name, "batch_no", data.batch);
    if (data.batch_expiry_date) {
      frappe.model.set_value(
        row.doctype,
        row.name,
        "expiry_date",
        data.batch_expiry_date
      );
      console.log(`🏥 SurgiShopERPNext: Added batch expiry date to bundle: ${data.batch_expiry_date}`);
    }
    // Add more fields as needed (e.g., qty=1)
    frappe.model.set_value(row.doctype, row.name, "qty", 1);

    const itemCode = this.item ? this.item.item_code : "Unknown Item";
    frappe.show_alert({
      message: __("Batch added from GS1 scan for Item: {0}", [itemCode]),
      indicator: "green",
    });
  }
};

// Override the default selector in relevant forms
frappe.ui.form.on("Stock Entry Detail", {
  // Example for Stock Entry items
  item_code: function (frm, cdt, cdn) {
    const row = locals[cdt][cdn];
    if (row.use_serial_batch_fields) {
      // Override the selector call
      frm._original_get_batch_qty = frm.get_batch_qty;
      frm.get_batch_qty = function () {
        // Use custom selector
        new surgishop.CustomSerialBatchPackageSelector({
          frm: frm,
          item: row,
          // other opts
        });
      };
    }
  },
});

// Add similar overrides for other doctypes like Purchase Receipt Item, etc.
