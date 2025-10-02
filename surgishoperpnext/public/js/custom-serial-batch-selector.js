// Custom Serial Batch Selector - Redone Version

console.log('🏥 Custom Serial Batch Selector loaded (redone version)');

if (typeof erpnext !== 'undefined' && erpnext.SerialBatchPackageSelector) {
  console.log('🏥 Extending ERPNext SerialBatchPackageSelector...');
  
  class CustomSerialBatchPackageSelector extends erpnext.SerialBatchPackageSelector {
    constructor(opts) {
      super(opts);
      console.log('🏥 Custom constructor initialized with opts:', opts);
    }
    
    make() {
      super.make();
      console.log('🏥 Dialog box opened!'); // Console message on open
      
      // Modify title with item code
      if (this.item && this.item.item_code) {
        const newTitle = `${this.dialog.title} - Item: ${this.item.item_code}`;
        this.dialog.set_title(newTitle);
        console.log('🏥 Updated dialog title to:', newTitle);
      }
    }
  }
  
  // Replace the original class with our extended version
  erpnext.SerialBatchPackageSelector = CustomSerialBatchPackageSelector;
  console.log('🏥 Extension applied successfully');
} else {
  console.error('🏥 ERPNext SerialBatchPackageSelector not found - ensure script loads after ERPNext assets');
}
