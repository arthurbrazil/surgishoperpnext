// Custom Serial Batch Selector - Redone Version

console.log("🏥 Custom Serial Batch Selector loaded (redone version)");

// Wrapper to safely extend the selector
(function() {
  const OriginalSelector = erpnext.SerialBatchPackageSelector;
  
  erpnext.SerialBatchPackageSelector = function(opts) {
    console.log('🏥 Constructor called with opts:', opts || 'undefined');
    const instance = new OriginalSelector(opts);
    
    // Override make() for this instance
    const originalMake = instance.make;
    instance.make = function() {
      originalMake.call(this);
      console.log('🏥 Dialog box opened!');
      
      if (opts && opts.item && opts.item.item_code) {
        const newTitle = `${this.dialog.title} - Item: ${opts.item.item_code}`;
        this.dialog.set_title(newTitle);
        console.log('🏥 Updated title to:', newTitle);
      } else {
        console.log('🏥 No item - default title');
      }
    };
    
    return instance;
  };
  
  console.log('🏥 Safe wrapper applied');
})();

// Safe DOM Modification for Dialog Title

console.log('🏥 Safe Dialog Modifier Loaded');

// Global storage for item code from clicked row
let currentItemCode = '';

// Detect button clicks and store item code
$(document).on('click', '[data-label="Add Serial / Batch No"], .btn[data-fieldname*="serial_and_batch_bundle"]', function(e) {
  const $btn = $(this);
  const $row = $btn.closest('.grid-row');
  if ($row.length) {
    currentItemCode = $row.find('[data-fieldname="item_code"] .grid-static-col').text().trim() || '';
    console.log('🏥 Button clicked - Stored item code:', currentItemCode);
  }
});

// Observe for dialog opening and modify title
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      if (node.nodeType === 1 && node.classList.contains('modal-dialog')) {
        const titleElem = node.querySelector('.modal-title');
        if (titleElem && titleElem.textContent.includes('Add Batch Nos') && currentItemCode) {
          titleElem.textContent += ` - Item: ${currentItemCode}`;
          console.log('🏥 Dialog opened and title updated to:', titleElem.textContent);
          currentItemCode = ''; // Reset
        }
      }
    });
  });
});
observer.observe(document.body, { childList: true, subtree: true });

console.log('🏥 Observer setup complete - waiting for dialog');
