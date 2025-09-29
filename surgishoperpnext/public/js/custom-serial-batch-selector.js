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
	try {
		if (typeof GS1Parser === 'undefined') {
			console.error('🏥 GS1 library not loaded in selector');
			return null;
		}
		const parsed = GS1Parser.parse(gs1_string);
		if (!parsed || !parsed.elements) return null;

		let gtin = '';
		let lot = '';
		let expiry = '';

		parsed.elements.forEach(el => {
			if (el.ai === '01') gtin = el.value;
			else if (el.ai === '10') lot = el.value;
			else if (el.ai === '17') expiry = el.value;
		});

		if (!gtin || !lot) return null;

		return { gtin, lot, expiry };
	} catch (e) {
		console.error('🏥 GS1 parsing error in selector:', e);
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
