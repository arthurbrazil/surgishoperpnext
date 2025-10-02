// surgishoperpnext/public/js/custom-serial-batch-selector.js
// Custom Serial Batch Selector with GS1 Scanning Support

console.log(
  `%c🏥 SurgiShopERPNext: Custom Serial Batch Selector loaded!`,
  "color: #1E88E5; font-weight: bold;"
);

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

// Simplify to primary class override with timing safety
function apply_custom_selector_override() {
  if (typeof erpnext !== 'undefined' && erpnext.SerialBatchPackageSelector) {
    console.log('🏥 Custom override applied successfully');
    
    // Full class extension
    const OriginalSerialBatchPackageSelector = erpnext.SerialBatchPackageSelector;
    
    erpnext.SerialBatchPackageSelector = class extends OriginalSerialBatchPackageSelector {
      constructor(opts) {
        console.log('🏥 Custom constructor called! Opts:', opts);
        super(opts);
        
        // Set custom title
        if (this.dialog && opts.item && opts.item.item_code) {
          const title = opts.item.item_name 
            ? `Add Batch Nos - Item: ${opts.item.item_code} (${opts.item.item_name})`
            : `Add Batch Nos - Item: ${opts.item.item_code}`;
          this.dialog.set_title(title);
          console.log('🏥 Set custom title:', title);
        }
      }
    };
    
    // Fallback: Patch prototype if needed
    erpnext.SerialBatchPackageSelector.prototype.customLog = function() {
      console.log('🏥 Prototype patched!');
    };
    
    // Stop the interval
    clearInterval(overrideInterval);
    console.log('🏥 Interval cleared - no more repeats');
  } else {
    console.log('🏥 Waiting for ERPNext to load...');
  }
}

// Apply immediately and on interval (up to 10 seconds max)
apply_custom_selector_override();
const overrideInterval = setInterval(apply_custom_selector_override, 500);
setTimeout(() => clearInterval(overrideInterval), 10000); // Safety stop after 10s

// Global button override setup
function setup_global_button_overrides() {
  // Use a more specific selector and higher priority
  $(document).off('click.surgishop_serial_batch').on('click.surgishop_serial_batch', 'button, .btn, [role="button"], .grid-row button', function(e) {
    const $btn = $(this);
    const btnText = $btn.text().trim();
    const fieldname = $btn.attr('data-fieldname');
    const title = $btn.attr('title') || '';
    const onclick = $btn.attr('onclick') || '';
    
    console.log(`🏥 SurgiShopERPNext: Button clicked - Text: "${btnText}", Field: "${fieldname}", Title: "${title}"`);
    
    // Check if this is a serial/batch button by text content
    const isSerialBatchButton = btnText.includes('Add Serial') || 
                               btnText.includes('Add Batch') ||
                               btnText.includes('Serial / Batch') ||
                               btnText.includes('Batch No') ||
                               btnText.includes('Serial No') ||
                               btnText.includes('Serial') ||
                               btnText.includes('Batch') ||
                               (fieldname && (fieldname.includes('serial') || fieldname.includes('batch'))) ||
                               title.includes('Serial') || 
                               title.includes('Batch') ||
                               onclick.includes('serial') ||
                               onclick.includes('batch');
    
    if (isSerialBatchButton) {
      console.log(`🏥 SurgiShopERPNext: Detected serial/batch button click: "${btnText}"`);
      
      // Find the parent row
      const $row = $btn.closest('[data-doctype]');
      if ($row.length) {
        const row_doctype = $row.attr('data-doctype');
        const row_name = $row.attr('data-name');
        
        console.log(`🏥 SurgiShopERPNext: Found row - Doctype: ${row_doctype}, Name: ${row_name}`);
        
        if (row_name) {
          const row = locals[row_doctype][row_name];
          if (row && (row.has_serial_no || row.has_batch_no)) {
            console.log(`🏥 SurgiShopERPNext: Button click override - Item: ${row.item_code}`);
            e.preventDefault();
            e.stopPropagation();
            
            // Get the current form
            const frm = cur_frm;
            const current_route = frappe.get_route();
            const doctype = current_route ? current_route[1] : 'Unknown';
            
            new surgishop.CustomSerialBatchPackageSelector({
              frm: frm,
              item: row,
              doctype: doctype,
              cdt: row_doctype,
              cdn: row_name
            });
            return false;
          } else {
            console.log(`🏥 SurgiShopERPNext: Row found but no serial/batch fields - has_serial_no: ${row.has_serial_no}, has_batch_no: ${row.has_batch_no}`);
          }
        }
      } else {
        console.log(`🏥 SurgiShopERPNext: No parent row found for button`);
      }
    }
  });
}

// Function to override the actual button click handlers
function override_serial_batch_buttons(frm, doctype) {
  // This function is now handled by the global setup
  console.log(`🏥 SurgiShopERPNext: override_serial_batch_buttons called for ${doctype}`);
}
