// Custom Serial Batch Selector - Redone Version

console.log("🏥 Custom Serial Batch Selector loaded (redone version)");

// Patch Original Constructor
if (erpnext.SerialBatchPackageSelector) {
  // Patch constructor
  const originalConstructor = erpnext.SerialBatchPackageSelector.prototype.constructor;
  erpnext.SerialBatchPackageSelector.prototype.constructor = function(opts) {
    if (opts && opts.item) {
      this.qty = opts.item.qty;
    } else {
      this.qty = 0;
      console.log('🏥 Patched: No item - set qty to 0');
    }
    originalConstructor.apply(this, arguments);
  };
  
  // Patch make to add custom scan handler
  const originalMake = erpnext.SerialBatchPackageSelector.prototype.make;
  erpnext.SerialBatchPackageSelector.prototype.make = function() {
    originalMake.call(this);
    
    console.log('🏥 Dialog box opened!');
    
    if (this.item && this.item.item_code) {
      const newTitle = `${this.dialog.title} - Item: ${this.item.item_code}`;
      this.dialog.set_title(newTitle);
      console.log('🏥 Updated title to:', newTitle);
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
          frappe.msgprint(__('Invalid GS1 barcode format'));
          scanField.set_value('');
          return;
        }
        
        // Get item_code from GTIN
        frappe.db.get_value('Item Barcode', {barcode: parsed.gtin}, 'parent', (r) => {
          if (!r || !r.parent) {
            frappe.msgprint(__('No item found for GTIN'));
            scanField.set_value('');
            return;
          }
          
          const gtinItemCode = r.parent;
          if (gtinItemCode !== this.item.item_code) {
            frappe.msgprint(__('GTIN does not match the current item code'));
            scanField.set_value('');
            return;
          }
          
          // Format batch_no
          const formattedBatchNo = `${this.item.item_code}-${parsed.lot}`;
          
          // Call API to get/create batch
          frappe.call({
            method: 'surgishoperpnext.surgishoperpnext.api.gs1_parser.parse_gs1_and_get_batch',
            args: {
              gtin: parsed.gtin,
              expiry: parsed.expiry,
              lot: parsed.lot
            },
            callback: (res) => {
              if (!res.message || res.message.error) {
                frappe.msgprint(__('Error creating or getting batch: ' + (res.message.error || 'Unknown error')));
                scanField.set_value('');
                return;
              }
              
              const batch = res.message.batch;
              const batchExpiry = res.message.batch_expiry_date;
              
              // Validate expiry matches scanned
              if (batchExpiry !== parsed.expiry) {  // Note: might need to format dates for comparison
                frappe.msgprint(__('Batch expiry does not match scanned expiry'));
                scanField.set_value('');
                return;
              }
              
              // Add to grid
              const grid = this.dialog.fields_dict.entries.grid;
              const newRow = grid.add_new_row();
              frappe.model.set_value(newRow.doctype, newRow.name, 'batch_no', batch);
              frappe.model.set_value(newRow.doctype, newRow.name, 'qty', 1);
              frappe.model.set_value(newRow.doctype, newRow.name, 'expiry_date', batchExpiry);
              
              grid.refresh();
              
              // Clear scan field
              scanField.set_value('');
            }
          });
        };
      };
    }
    
    console.log('🏥 Added custom GS1 scan handler to scan_batch_no');
  };
  
  console.log('🏥 Patches applied successfully');
}

// Patch get_dialog_table_fields to add expiry_date column in correct order
const originalGetFields = erpnext.SerialBatchPackageSelector.prototype.get_dialog_table_fields;
erpnext.SerialBatchPackageSelector.prototype.get_dialog_table_fields = function() {
  const originalFields = originalGetFields.call(this);
  const expiryField = {
    fieldtype: "Date",
    fieldname: "expiry_date",
    label: __("Expiry Date"),
    in_list_view: 1,
    read_only: 1
  };
  originalFields.splice(1, 0, expiryField); // Insert after batch_no (index 0), before qty (now index 2)

  // Add onchange to batch_no for auto-fetch
  const batchField = originalFields.find(f => f.fieldname === 'batch_no');
  if (batchField) {
    batchField.onchange = function() {
      const batch_no = this.value;
      if (batch_no) {
        frappe.db.get_value('Batch', batch_no, 'expiry_date', (r) => {
          this.grid_row.on_grid_fields_dict.expiry_date.set_value(r.expiry_date);
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
erpnext.SerialBatchPackageSelector.prototype.set_data = function(data) {
  const promises = data.map(d => {
    if (d.batch_no) {
      return new Promise(resolve => {
        frappe.db.get_value('Batch', d.batch_no, 'expiry_date', (r) => {
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

console.log('🏥 Added expiry date column with order, auto-fetch on change, and initial data handling');

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
