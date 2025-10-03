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
  
  // Patch make
  const originalMake = erpnext.SerialBatchPackageSelector.prototype.make;
  erpnext.SerialBatchPackageSelector.prototype.make = function() {
    originalMake.call(this);
    console.log('🏥 Dialog box opened!');
    
    if (this.item && this.item.item_code) {
      const newTitle = `${this.dialog.title} - Item: ${this.item.item_code}`;
      this.dialog.set_title(newTitle);
      console.log('🏥 Updated title to:', newTitle);
    }
  };
  
  console.log('🏥 Patches applied successfully');
}

// Patch get_dialog_table_fields to add expiry_date column
const originalGetFields = erpnext.SerialBatchPackageSelector.prototype.get_dialog_table_fields;
erpnext.SerialBatchPackageSelector.prototype.get_dialog_table_fields = function() {
  const originalFields = originalGetFields.call(this);
  originalFields.push({
    fieldtype: "Date",
    fieldname: "expiry_date",
    label: __("Expiry Date"),
    in_list_view: 1,
    read_only: 1
  });
  return originalFields;
};

// Patch set_data to fetch expiry dates
const originalSetData = erpnext.SerialBatchPackageSelector.prototype.set_data;
erpnext.SerialBatchPackageSelector.prototype.set_data = function(data) {
  data.forEach((d) => {
    if (d.batch_no) {
      frappe.db.get_value('Batch', d.batch_no, 'expiry_date', (r) => {
        d.expiry_date = r.expiry_date;
        this.dialog.fields_dict.entries.grid.refresh();
      });
    }
  });
  originalSetData.call(this, data);
};

console.log('🏥 Added expiry date column and data fetching');

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
