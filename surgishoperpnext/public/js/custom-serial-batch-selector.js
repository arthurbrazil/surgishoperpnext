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
  }

  // Override to add scan field
  prepare_dialog() {
    super.prepare_dialog();

    // Add scan field to dialog
    this.dialog.fields_dict.scan_gs1 = new frappe.ui.Field({
      label: __("Scan GS1 Barcode"),
      fieldname: "scan_gs1",
      fieldtype: "Data",
      options: "",
      change: () => this.process_gs1_scan(),
    });

    // Insert scan field at the top
    this.dialog.fields.splice(0, 0, this.dialog.fields_dict.scan_gs1.df);
    this.dialog.refresh_fields();
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

  // Reuse GS1 parser from custom-barcode-scanner.js
  parse_gs1_string(gs1_string) {
    if (!gs1_string.match(/^\d+$/) || gs1_string.length < 16 + 8 + 2) {
      console.log("🏥 Not a valid numeric GS1 string or too short in selector");
      return null;
    }

    let pos = 0;

    // AI 01: GTIN (14 digits)
    if (gs1_string.substr(pos, 2) !== "01") return null;
    pos += 2;
    let gtin = gs1_string.substr(pos, 14);
    pos += 14;

    // AI 17: Expiry (6 digits YYMMDD)
    if (gs1_string.substr(pos, 2) !== "17") return null;
    pos += 2;
    let expiry = gs1_string.substr(pos, 6);
    pos += 6;

    // AI 10: Lot (variable, rest of string)
    if (gs1_string.substr(pos, 2) !== "10") return null;
    pos += 2;
    let lot = gs1_string.substr(pos);

    if (!gtin || !lot) return null;

    console.log(
      `🏥 Manually parsed GS1 in selector: GTIN=${gtin}, Lot=${lot}, Expiry=${expiry}`
    );
    return { gtin, lot, expiry };
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
    }
    // Add more fields as needed (e.g., qty=1)
    frappe.model.set_value(row.doctype, row.name, "qty", 1);

    frappe.show_alert({
      message: __("Batch added from GS1 scan"),
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
