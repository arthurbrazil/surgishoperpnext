/**
 * SurgiShopERPNext - Custom Barcode Scanner Override
 * Overrides ERPNext's default barcode scanning with custom functionality
 */

console.log(
  `%c🏥 SurgiShopERPNext: Global JS file loaded.`,
  "color: #1E88E5; font-weight: bold;"
);

// Namespace for our custom code to avoid polluting the global scope
if (typeof window.surgishop === "undefined") {
  window.surgishop = {};
}

/**
 * Our custom scanner class.
 * All the logic for parsing and handling scans is contained here.
 */
surgishop.CustomBarcodeScanner = class CustomBarcodeScanner {
  constructor(opts) {
    console.log("🏥 SurgiShopERPNext: Custom BarcodeScanner created");
    this.frm = opts.frm;
    this.scan_field_name = opts.scan_field_name || "scan_barcode";
    this.scan_barcode_field = this.frm.fields_dict[this.scan_field_name];
    this.barcode_field = opts.barcode_field || "barcode";
    this.serial_no_field = opts.serial_no_field || "serial_no";
    this.batch_no_field = opts.batch_no_field || "batch_no";
    this.batch_expiry_date_field = opts.batch_expiry_date_field || "custom_expiration_date";
    this.uom_field = opts.uom_field || "uom";
    this.qty_field = opts.qty_field || "qty";
    this.warehouse_field = opts.warehouse_field || "warehouse";
    this.max_qty_field = opts.max_qty_field;
    this.dont_allow_new_row = opts.dont_allow_new_row;
    this.prompt_qty = opts.prompt_qty;
    this.items_table_name = opts.items_table_name || "items";
    
    // Enable sounds by default with Frappe built-in sounds
    // 'submit' sound for success (pleasant beep)
    // 'error' sound for failures (alert tone)
    this.success_sound = opts.play_success_sound !== undefined 
      ? opts.play_success_sound 
      : "submit";
    this.fail_sound = opts.play_fail_sound !== undefined 
      ? opts.play_fail_sound 
      : "error";
    
    this.scan_api =
      opts.scan_api ||
      "surgishoperpnext.surgishoperpnext.api.barcode.scan_barcode";
    this.gs1_parser_api =
      "surgishoperpnext.surgishoperpnext.api.gs1_parser.parse_gs1_and_get_batch";
    this.has_last_scanned_warehouse = frappe.meta.has_field(
      this.frm.doctype,
      "last_scanned_warehouse"
    );
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

  process_scan() {
    console.log(
      "🏥 SurgiShopERPNext: OVERRIDE SUCCESS! Custom process_scan method is running."
    );
    return new Promise((resolve, reject) => {
      try {
        const input = this.scan_barcode_field.value;
        this.scan_barcode_field.set_value("");
        if (!input) {
          // Resolve promise for empty input to avoid uncaught promise rejection
          return resolve();
        }

        console.log("🏥 SurgiShopERPNext: Processing barcode scan:", input);

        // Try to parse as GS1 first
        const gs1_data = this.parse_gs1_string(input);

        if (gs1_data) {
          console.log(
            "🏥 SurgiShopERPNext: Detected GS1 barcode. Parsed:",
            gs1_data
          );
          // Log and show scanned AIs
          console.log(
            `%c🏥 Scanned GS1 AIs: AI01 (GTIN)=${gs1_data.gtin}, AI17 (Expiry)=${gs1_data.expiry}, AI10 (Lot)=${gs1_data.lot}`,
            "color: #2196F3; font-weight: bold;"
          );
          this.show_alert(
            `Scanned GS1 AIs:\nGTIN: ${gs1_data.gtin}\nExpiry: ${gs1_data.expiry}\nLot: ${gs1_data.lot}`,
            "blue",
            5
          );
          this.gs1_api_call(gs1_data, (r) =>
            this.handle_api_response(r, resolve, reject)
          );
        } else {
          console.log(
            "🏥 SurgiShopERPNext: Not a GS1 barcode, using standard scan."
          );
          this.scan_api_call(input, (r) =>
            this.handle_api_response(r, resolve, reject)
          );
        }
      } catch (e) {
        console.error("🏥 SurgiShopERPNext: FATAL ERROR in process_scan:", e);
        reject(e);
      }
    });
  }

  handle_api_response(r, resolve, reject) {
    try {
      const data = r && r.message;
      if (!data || Object.keys(data).length === 0 || data.error) {
        const error_msg =
          data && data.error
            ? data.error
            : "Cannot find Item with this Barcode";
        console.warn(
          `%c🏥 Scan Error: ${error_msg}. Response details:`,
          "color: #FF5722;",
          r
        );
        this.show_alert(
          `Error: ${error_msg}. Check console for details.`,
          "red"
        );
        this.clean_up();
        this.play_fail_sound();
        reject(new Error(error_msg)); // Reject with meaningful error
        return;
      }

      console.log("🏥 SurgiShopERPNext: Barcode scan result:", data);

      // Handle warehouse-only responses
      if (data.warehouse && !data.item_code) {
        console.log("🏥 SurgiShopERPNext: Warehouse scanned:", data.warehouse);
        this.handle_warehouse_scan(data.warehouse);
        this.clean_up();
        this.play_success_sound();
        resolve(); // Resolve without adding items
        return;
      }

      // Handle item responses (with item_code)
      if (!data.item_code) {
        console.warn("🏥 SurgiShopERPNext: No item_code in response, treating as error");
        this.show_alert("No item found for this barcode", "red");
        this.clean_up();
        this.play_fail_sound();
        reject(new Error("No item found"));
        return;
      }

      this.update_table(data)
        .then((row) => {
          this.play_success_sound();
          resolve(row);
        })
        .catch((err) => {
          this.play_fail_sound();
          reject(err); // Propagate the error from update_table
        });
    } catch (e) {
      console.error(
        "🏥 SurgiShopERPNext: FATAL ERROR in handle_api_response:",
        e
      );
      reject(e);
    }
  }

  handle_warehouse_scan(warehouse_name) {
    console.log(`🏥 SurgiShopERPNext: Handling warehouse scan: ${warehouse_name}`);
    
    // Set the warehouse on the document if there's a set_warehouse field
    if (frappe.meta.has_field(this.frm.doctype, "set_warehouse")) {
      frappe.model.set_value(this.frm.doctype, this.frm.doc.name, "set_warehouse", warehouse_name);
      console.log(`🏥 SurgiShopERPNext: Set document warehouse to: ${warehouse_name}`);
    }
    
    // Store the last scanned warehouse if the field exists
    if (this.has_last_scanned_warehouse) {
      frappe.model.set_value(this.frm.doctype, this.frm.doc.name, "last_scanned_warehouse", warehouse_name);
      console.log(`🏥 SurgiShopERPNext: Stored last scanned warehouse: ${warehouse_name}`);
    }
    
    // Show confirmation message
    this.show_alert(`Warehouse set to: ${warehouse_name}`, "green", 3);
    
    // Refresh the form to update any warehouse-dependent fields
    this.frm.refresh_fields();
  }

  gs1_api_call(gs1_data, callback) {
    console.log("🏥 SurgiShopERPNext: Calling GS1 parser API:", gs1_data);
    frappe
      .call({
        method: this.gs1_parser_api,
        args: {
          gtin: gs1_data.gtin,
          lot: gs1_data.lot,
          expiry: gs1_data.expiry,
        },
      })
      .then((r) => {
        console.log("🏥 SurgiShopERPNext: GS1 API response:", r);
        // Standardize the response to match the old API's structure for `update_table`
        if (r && r.message && r.message.found_item) {
          r.message.item_code = r.message.found_item;
          r.message.batch_no = r.message.batch;
          r.message.batch_expiry_date = r.message.batch_expiry_date;
        }
        callback(r);
      })
      .catch((error) => {
        console.error("🏥 SurgiShopERPNext: GS1 API call failed:", error);
        callback({
          message: {
            error:
              "GS1 API call failed. Please check connection or server logs.",
          },
        });
      });
  }

  scan_api_call(input, callback) {
    console.log("🏥 SurgiShopERPNext: Calling custom barcode API:", input);

    frappe
      .call({
        method: this.scan_api,
        args: {
          search_value: input,
          ctx: {
            set_warehouse: this.frm.doc.set_warehouse,
            company: this.frm.doc.company,
          },
        },
      })
      .then((r) => {
        console.log("🏥 SurgiShopERPNext: API response:", r);
        callback(r);
      })
      .catch((error) => {
        console.error("🏥 SurgiShopERPNext: Standard API call failed:", error);
        callback({
          message: {
            error:
              "Barcode API call failed. Please check connection or server logs.",
          },
        });
      });
  }

  update_table(data) {
    return new Promise((resolve, reject) => {
      let cur_grid = this.frm.fields_dict[this.items_table_name].grid;
      frappe.flags.trigger_from_barcode_scanner = true;

      const {
        item_code,
        barcode,
        batch_no,
        batch_expiry_date,
        serial_no,
        uom,
        default_warehouse,
      } = data;
      let row = this.get_row_to_modify_on_scan(
        item_code,
        batch_no,
        uom,
        barcode,
        default_warehouse
      );
      const is_new_row = row && row.item_code ? false : true;
      
      // Log warehouse-specific behavior
      if (is_new_row && item_code) {
        const current_warehouse = this.frm.doc.last_scanned_warehouse || default_warehouse;
        console.log(`🏥 SurgiShopERPNext: Creating new row for item ${item_code} in warehouse ${current_warehouse}`);
      }

      if (!row) {
        if (this.dont_allow_new_row) {
          this.show_alert(
            `Maximum quantity scanned for item ${item_code}.`,
            "red"
          );
          this.clean_up();
          reject();
          return;
        }

        // Add new row if new item/batch is scanned
        row = frappe.model.add_child(
          this.frm.doc,
          cur_grid.doctype,
          this.items_table_name
        );
        this.frm.script_manager.trigger(
          `${this.items_table_name}_add`,
          row.doctype,
          row.name
        );
        this.frm.has_items = false;
      }

      if (this.is_duplicate_serial_no(row, serial_no)) {
        this.clean_up();
        reject();
        return;
      }

      frappe.run_serially([
        () => this.set_selector_trigger_flag(data),
        () =>
          this.set_item(row, item_code, barcode, batch_no, serial_no).then(
            (qty) => {
              this.show_scan_message(row.idx, !is_new_row, qty);
            }
          ),
        () => this.set_barcode_uom(row, uom),
        () => this.set_serial_no(row, serial_no),
        () => this.set_batch_no(row, batch_no),
        () => this.set_batch_expiry_date(row, batch_expiry_date),
        () => this.set_barcode(row, barcode),
        () => this.set_warehouse(row),
        () => this.clean_up(),
        () => this.revert_selector_flag(),
        () => resolve(row),
      ]);
    });
  }

  set_selector_trigger_flag(data) {
    const { batch_no, serial_no, has_batch_no, has_serial_no } = data;
    const require_selecting_batch = has_batch_no && !batch_no;
    const require_selecting_serial = has_serial_no && !serial_no;

    if (!(require_selecting_batch || require_selecting_serial)) {
      frappe.flags.hide_serial_batch_dialog = true;
    }
  }

  revert_selector_flag() {
    frappe.flags.hide_serial_batch_dialog = false;
    frappe.flags.trigger_from_barcode_scanner = false;
  }

  set_item(row, item_code, barcode, batch_no, serial_no) {
    return new Promise((resolve) => {
      const increment = async (value = 1) => {
        const item_data = {
          item_code: item_code,
          use_serial_batch_fields: 1.0,
        };
        frappe.flags.trigger_from_barcode_scanner = true;
        item_data[this.qty_field] =
          Number(row[this.qty_field] || 0) + Number(value);
        await frappe.model.set_value(row.doctype, row.name, item_data);
        return value;
      };

      if (this.prompt_qty) {
        frappe.prompt(
          `Please enter quantity for item ${item_code}`,
          ({ value }) => {
            increment(value).then((value) => resolve(value));
          }
        );
      } else if (this.frm.has_items) {
        this.prepare_item_for_scan(
          row,
          item_code,
          barcode,
          batch_no,
          serial_no
        );
      } else {
        increment().then((value) => resolve(value));
      }
    });
  }

  prepare_item_for_scan(row, item_code, barcode, batch_no, serial_no) {
    return new Promise((resolve) => {
      const increment = async (value = 1) => {
        const item_data = {
          item_code: item_code,
          use_serial_batch_fields: 1.0,
        };
        item_data[this.qty_field] =
          Number(row[this.qty_field] || 0) + Number(value);
        await frappe.model.set_value(row.doctype, row.name, item_data);
        return value;
      };

      increment().then((value) => resolve(value));
    });
  }

  async set_serial_no(row, serial_no) {
    if (serial_no && frappe.meta.has_field(row.doctype, this.serial_no_field)) {
      const existing_serial_nos = row[this.serial_no_field];
      let new_serial_nos = "";

      if (!!existing_serial_nos) {
        new_serial_nos = existing_serial_nos + "\n" + serial_no;
      } else {
        new_serial_nos = serial_no;
      }
      await frappe.model.set_value(
        row.doctype,
        row.name,
        this.serial_no_field,
        new_serial_nos
      );
    }
  }

  async set_barcode_uom(row, uom) {
    if (uom && frappe.meta.has_field(row.doctype, this.uom_field)) {
      await frappe.model.set_value(row.doctype, row.name, this.uom_field, uom);
    }
  }

  async set_batch_no(row, batch_no) {
    if (batch_no && frappe.meta.has_field(row.doctype, this.batch_no_field)) {
      await frappe.model.set_value(
        row.doctype,
        row.name,
        this.batch_no_field,
        batch_no
      );
    }
  }

  async set_batch_expiry_date(row, batch_expiry_date) {
    if (batch_expiry_date && frappe.meta.has_field(row.doctype, this.batch_expiry_date_field)) {
      console.log(`🏥 SurgiShopERPNext: Setting batch expiry date: ${batch_expiry_date}`);
      await frappe.model.set_value(
        row.doctype,
        row.name,
        this.batch_expiry_date_field,
        batch_expiry_date
      );
    }
  }

  async set_barcode(row, barcode) {
    if (barcode && frappe.meta.has_field(row.doctype, this.barcode_field)) {
      await frappe.model.set_value(
        row.doctype,
        row.name,
        this.barcode_field,
        barcode
      );
    }
  }

  async set_warehouse(row) {
    if (!this.has_last_scanned_warehouse) return;

    const last_scanned_warehouse = this.frm.doc.last_scanned_warehouse;
    if (!last_scanned_warehouse) return;

    const warehouse_field = this.get_warehouse_field();
    if (
      !warehouse_field ||
      !frappe.meta.has_field(row.doctype, warehouse_field)
    )
      return;

    await frappe.model.set_value(
      row.doctype,
      row.name,
      warehouse_field,
      last_scanned_warehouse
    );
  }

  get_warehouse_field() {
    if (typeof this.warehouse_field === "function") {
      return this.warehouse_field(this.frm.doc);
    }
    return this.warehouse_field;
  }

  show_scan_message(idx, is_existing_row = false, qty = 1) {
    if (is_existing_row) {
      this.show_alert(`Row #${idx}: Qty increased by ${qty}`, "green");
    } else {
      const current_warehouse = this.frm.doc.last_scanned_warehouse;
      const warehouse_msg = current_warehouse ? ` in ${current_warehouse}` : '';
      this.show_alert(`Row #${idx}: Item added${warehouse_msg}`, "green");
    }
  }

  is_duplicate_serial_no(row, serial_no) {
    if (
      row &&
      row[this.serial_no_field] &&
      row[this.serial_no_field].includes(serial_no)
    ) {
      this.show_alert(`Serial No ${serial_no} is already added`, "orange");
      return true;
    }
    return false;
  }

  get_row_to_modify_on_scan(
    item_code,
    batch_no,
    uom,
    barcode,
    default_warehouse
  ) {
    let cur_grid = this.frm.fields_dict[this.items_table_name].grid;

    let is_batch_no_scan =
      batch_no && frappe.meta.has_field(cur_grid.doctype, this.batch_no_field);
    let check_max_qty =
      this.max_qty_field &&
      frappe.meta.has_field(cur_grid.doctype, this.max_qty_field);

    const warehouse_field =
      this.has_last_scanned_warehouse && this.get_warehouse_field();
    const has_warehouse_field =
      warehouse_field &&
      frappe.meta.has_field(cur_grid.doctype, warehouse_field);
    const warehouse = has_warehouse_field
      ? this.frm.doc.last_scanned_warehouse || default_warehouse
      : null;

    const matching_row = (row) => {
      const item_match = row.item_code == item_code;
      const batch_match =
        !row[this.batch_no_field] || row[this.batch_no_field] == batch_no;
      const uom_match = !uom || row[this.uom_field] == uom;
      const qty_in_limit =
        flt(row[this.qty_field]) < flt(row[this.max_qty_field]);
      const item_scanned = row.has_item_scanned;

      // STRICT warehouse matching: Only match if warehouses are exactly the same
      // This ensures same item/batch in different warehouses create separate line items
      let warehouse_match = true;
      if (has_warehouse_field) {
        if (warehouse && row[warehouse_field]) {
          // Both have warehouses - must match exactly
          warehouse_match = row[warehouse_field] === warehouse;
        } else if (warehouse && !row[warehouse_field]) {
          // Current scan has warehouse, existing row doesn't - don't match
          warehouse_match = false;
        } else if (!warehouse && row[warehouse_field]) {
          // Current scan has no warehouse, existing row has one - don't match
          warehouse_match = false;
        }
        // If both have no warehouse, warehouse_match remains true
      }

      return (
        item_match &&
        uom_match &&
        warehouse_match &&
        !item_scanned &&
        (!is_batch_no_scan || batch_match) &&
        (!check_max_qty || qty_in_limit)
      );
    };

    const items_table = this.frm.doc[this.items_table_name] || [];
    return (
      items_table.find(matching_row) || items_table.find((d) => !d.item_code)
    );
  }

  play_success_sound() {
    if (this.success_sound) {
      console.log(`🔊 Playing success sound: ${this.success_sound}`);
      frappe.utils.play_sound(this.success_sound);
    }
  }

  play_fail_sound() {
    if (this.fail_sound) {
      console.log(`🔊 Playing error sound: ${this.fail_sound}`);
      frappe.utils.play_sound(this.fail_sound);
    }
  }

  clean_up() {
    this.scan_barcode_field.set_value("");
    refresh_field(this.items_table_name);
  }

  show_alert(msg, indicator, duration = 3) {
    frappe.show_alert(
      {
        message: msg,
        indicator: indicator,
      },
      duration
    );
  }
};

/**
 * This is the main override logic.
 * We wrap this in a router 'change' event to ensure the Frappe framework is fully
 * loaded and ready before we try to attach our form-specific hooks.
 */
// Main override logic using router.on('change')
frappe.router.on("change", () => {
  const doctypes_to_override = [
    "Stock Entry",
    "Purchase Order",
    "Purchase Receipt",
    "Purchase Invoice",
    "Sales Invoice",
    "Delivery Note",
    "Stock Reconciliation",
  ];

  if (
    frappe.get_route() &&
    frappe.get_route()[0] === "Form" &&
    doctypes_to_override.includes(frappe.get_route()[1])
  ) {
    const frm = cur_frm; // Use cur_frm for the current form
    if (frm && !frm.custom_scanner_attached) {
      frappe.ui.form.on(frappe.get_route()[1], {
        scan_barcode: function (frm) {
          console.log(
            `%c🏥 SurgiShopERPNext: Overriding scan_barcode field for ${frm.doctype}`,
            "color: #4CAF50; font-weight: bold;"
          );

          const opts = frm.events.get_barcode_scanner_options
            ? frm.events.get_barcode_scanner_options(frm)
            : {};
          opts.frm = frm;

          const scanner = new surgishop.CustomBarcodeScanner(opts);
          scanner.process_scan().catch((err) => {
            console.error("🏥 SurgiShopERPNext: Scan error:", err);
            frappe.show_alert({
              message: "Barcode scan failed. Please try again.",
              indicator: "red",
            });
          });
        },
      });
      frm.custom_scanner_attached = true;
    }
  }
});
