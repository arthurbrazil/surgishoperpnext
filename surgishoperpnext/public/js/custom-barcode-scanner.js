/**
 * SurgiShopERPNext - Custom Barcode Scanner Override
 * Overrides ERPNext's default barcode scanning with custom functionality
 */

console.log(`%c🏥 SurgiShopERPNext: Global JS file loaded.`, 'color: #1E88E5; font-weight: bold;');

// Namespace for our custom code to avoid polluting the global scope
if (typeof window.surgishop === 'undefined') {
	window.surgishop = {};
}
