// Custom Serial Batch Selector - Redone Version

console.log('🏥 Custom Serial Batch Selector loaded (redone version)');

if (typeof erpnext !== 'undefined' && erpnext.SerialBatchPackageSelector) {
  console.log('🏥 Extending ERPNext SerialBatchPackageSelector...');
  
  class CustomSerialBatchPackageSelector extends erpnext.SerialBatchPackageSelector {
    constructor(opts) {
      super(opts);
      console.log('🏥 Custom constructor initialized with opts:', opts || 'undefined');
    }
    
    make() {
      super.make();
      console.log('🏥 Dialog box opened!');
      
      // Modify title safely
      if (this.dialog && opts && opts.item && opts.item.item_code) {
        const newTitle = `${this.dialog.title} - Item: ${opts.item.item_code}`;
        this.dialog.set_title(newTitle);
        console.log('🏥 Updated dialog title to:', newTitle);
      } else {
        console.log('🏥 No item context available - using default title');
      }
    }
  }
  
  // Replace the original class with our extended version
  erpnext.SerialBatchPackageSelector = CustomSerialBatchPackageSelector;
  console.log('🏥 Extension applied successfully');
} else {
  console.error('🏥 ERPNext SerialBatchPackageSelector not found - ensure script loads after ERPNext assets');
}
