// Custom Serial Batch Selector - Redone Version

console.log("🏥 Custom Serial Batch Selector loaded (redone version)");

// Patch Original Constructor
if (erpnext.SerialBatchPackageSelector) {
  // Patch constructor
  const originalConstructor =
    erpnext.SerialBatchPackageSelector.prototype.constructor;
  erpnext.SerialBatchPackageSelector.prototype.constructor = function (opts) {
    if (opts && opts.item) {
      this.qty = opts.item.qty;
    } else {
      this.qty = 0;
      console.log("🏥 Patched: No item - set qty to 0");
    }
    originalConstructor.apply(this, arguments);
  };

  // Patch make to add custom scan handler
  const originalMake = erpnext.SerialBatchPackageSelector.prototype.make;
  erpnext.SerialBatchPackageSelector.prototype.make = function () {
    originalMake.call(this);

    console.log("🏥 Dialog box opened!");

    if (this.item && this.item.item_code) {
      const newTitle = `${this.dialog.title} - Item: ${this.item.item_code}`;
      this.dialog.set_title(newTitle);
      console.log("🏥 Updated title to:", newTitle);
    }

    // Add custom onchange to scan_batch_no
    const scanField = this.dialog.fields_dict.scan_batch_no;
    if (scanField) {
      scanField.df.onchange = () => {
        const scannedValue = scanField.get_value();
        if (!scannedValue) return;

        // Parse GS1
        const parsed = window.surgishop.GS1Parser.parse(scannedValue);
        if (!parsed || !parsed.gtin || !parsed.lot || !parsed.expiry) {
          frappe.msgprint(__("Invalid GS1 barcode format"));
          scanField.set_value("");
          return;
        }

        // Get item_code from GTIN
        frappe.db
          .get_doc("Item", this.item.item_code)
          .then((doc) => {
            const hasGtin =
              doc.barcodes &&
              doc.barcodes.some((b) => b.barcode === parsed.gtin);
            if (!hasGtin) {
              frappe.msgprint(
                __(
                  "GTIN " +
                    parsed.gtin +
                    " does not match the barcodes for item: " +
                    this.item.item_code
                )
              );
              scanField.set_value("");
              frappe.ui.play_sound("error"); // Play error sound
              return;
            }

            // Proceed with batch creation...
            // Format batch_no
            const formattedBatchNo = `${this.item.item_code}-${parsed.lot}`;

            // Call API
            frappe.call({
              method:
                "surgishoperpnext.surgishoperpnext.api.gs1_parser.parse_gs1_and_get_batch",
              args: {
                gtin: parsed.gtin,
                expiry: parsed.expiry,
                lot: parsed.lot,
                item_code: this.item.item_code,
              },
              callback: (res) => {
                if (!res.message || res.message.error) {
                  frappe.msgprint(
                    __(
                      "Error creating or getting batch: " +
                        (res.message.error || "Unknown error")
                    )
                  );
                  scanField.set_value("");
                  frappe.ui.play_sound("error"); // Play error sound
                  return;
                }

                const batch = res.message.batch;
                const batchExpiry = res.message.batch_expiry_date;

                // Format scanned expiry to 'YYYY-MM-DD'
                const scannedExpiry =
                  "20" +
                  parsed.expiry.slice(0, 2) +
                  "-" +
                  parsed.expiry.slice(2, 4) +
                  "-" +
                  parsed.expiry.slice(4, 6);

                // Validate expiry matches scanned
                if (batchExpiry !== scannedExpiry) {
                  frappe.msgprint(
                    __("Batch expiry does not match scanned expiry")
                  );
                  scanField.set_value("");
                  return;
                }

                // Add to grid
                const grid = this.dialog.fields_dict.entries.grid;
                const newRowIdx = grid.add_new_row(); // Note: add_new_row() returns the index, not the row object
                if (!newRowIdx) {
                  console.error("🏥 Failed to add new row to grid");
                  frappe.msgprint(__("Error adding new batch row"));
                  frappe.ui.play_sound("error");
                  scanField.set_value("");
                  return;
                }

                // Get the actual new row object from grid data
                const newRow = grid.grid_rows[newRowIdx - 1].doc; // Indices are 1-based, so subtract 1

                frappe.run_serially([
                  () =>
                    frappe.model.set_value(
                      newRow.doctype,
                      newRow.name,
                      "batch_no",
                      batch
                    ),
                  () => {
                    // Trigger onchange for batch_no to fetch expiry
                    const batchField =
                      newRow.__onchange && newRow.__onchange.batch_no;
                    if (batchField) batchField();
                    console.log(
                      "🏥 Triggered batch_no onchange for expiry fetch"
                    );
                  },
                  () =>
                    frappe.model.set_value(
                      newRow.doctype,
                      newRow.name,
                      "qty",
                      1
                    ),
                  () => {
                    grid.refresh();
                    console.log(
                      "🏥 Successfully added and set link for batch row:",
                      batch
                    );
                    scanField.set_value("");
                    frappe.ui.play_sound("submit"); // Play success sound
                  },
                ]);
              },
            });
          })
          .catch((err) => {
            frappe.msgprint(__("Error fetching item details: " + err.message));
            scanField.set_value("");
            frappe.ui.play_sound("error");
          });
      };
    }

    console.log("🏥 Added custom GS1 scan handler to scan_batch_no");
  };

  console.log("🏥 Patches applied successfully");
}

// Patch get_dialog_table_fields to add expiry_date column in correct order
const originalGetFields =
  erpnext.SerialBatchPackageSelector.prototype.get_dialog_table_fields;
erpnext.SerialBatchPackageSelector.prototype.get_dialog_table_fields =
  function () {
    const originalFields = originalGetFields.call(this);
    const expiryField = {
      fieldtype: "Date",
      fieldname: "expiry_date",
      label: __("Expiry Date"),
      in_list_view: 1,
      read_only: 1,
    };
    originalFields.splice(1, 0, expiryField); // Insert after batch_no (index 0), before qty (now index 2)

    // Add onchange to batch_no for auto-fetch
    const batchField = originalFields.find((f) => f.fieldname === "batch_no");
    if (batchField) {
      batchField.onchange = function () {
        const batch_no = this.value;
        if (batch_no) {
          frappe.db.get_value("Batch", batch_no, "expiry_date", (r) => {
            this.grid_row.on_grid_fields_dict.expiry_date.set_value(
              r.expiry_date
            );
          });
        } else {
          this.grid_row.on_grid_fields_dict.expiry_date.set_value(null);
        }
      };
    }

    return originalFields;
  };

// Patch set_data to fetch expiry dates for initial data
const originalSetData = erpnext.SerialBatchPackageSelector.prototype.set_data;
erpnext.SerialBatchPackageSelector.prototype.set_data = function (data) {
  const promises = data.map((d) => {
    if (d.batch_no) {
      return new Promise((resolve) => {
        frappe.db.get_value("Batch", d.batch_no, "expiry_date", (r) => {
          d.expiry_date = r.expiry_date;
          resolve();
        });
      });
    }
    return Promise.resolve();
  });

  Promise.all(promises).then(() => {
    originalSetData.call(this, data);
  });
};

console.log(
  "🏥 Added expiry date column with order, auto-fetch on change, and initial data handling"
);

console.log("🏥 Proxy wrapper applied - error-proof!");

// Safe DOM Modification for Dialog Title

console.log("🏥 Safe Dialog Modifier Loaded");

// Global storage for item code from clicked row
let currentItemCode = "";

// Detect button clicks and store item code
$(document).on(
  "click",
  '[data-label="Add Serial / Batch No"], .btn[data-fieldname*="serial_and_batch_bundle"]',
  function (e) {
    const $btn = $(this);
    const $row = $btn.closest(".grid-row");
    if ($row.length) {
      currentItemCode =
        $row
          .find('[data-fieldname="item_code"] .grid-static-col')
          .text()
          .trim() || "";
      console.log("🏥 Button clicked - Stored item code:", currentItemCode);
    }
  }
);

// Observe for dialog opening and modify title
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      if (node.nodeType === 1 && node.classList.contains("modal-dialog")) {
        const titleElem = node.querySelector(".modal-title");
        if (
          titleElem &&
          titleElem.textContent.includes("Add Batch Nos") &&
          currentItemCode
        ) {
          titleElem.textContent += ` - Item: ${currentItemCode}`;
          console.log(
            "🏥 Dialog opened and title updated to:",
            titleElem.textContent
          );
          currentItemCode = ""; // Reset
        }
      }
    });
  });
});
observer.observe(document.body, { childList: true, subtree: true });

console.log("🏥 Observer setup complete - waiting for dialog");
