/**
 * SurgiShopERPNext - GS1 Barcode Parsing Utilities
 * Shared utilities for parsing GS1 barcodes across different modules
 */

console.log(
	'%c🏥 SurgiShopERPNext: GS1 Utils loaded.',
	'color: #1E88E5; font-weight: bold;'
)

// Namespace for GS1 utilities
if (typeof window.surgishop === 'undefined') {
	window.surgishop = {}
}

/**
 * GS1 Barcode Parser
 * Extracts GTIN, Lot, and Expiry from GS1 barcode strings
 */
surgishop.GS1Parser = class GS1Parser {
	// Constants for GS1 Application Identifiers
	static AI_GTIN = '01'
	static AI_EXPIRY = '17'
	static AI_LOT = '10'
	static GTIN_LENGTH = 14
	static EXPIRY_LENGTH = 6
	static MIN_GS1_LENGTH = 26 // AI01(2) + GTIN(14) + AI17(2) + Expiry(6) + AI10(2) + Lot(min 0)

	/**
	 * Parses a GS1 string to extract GTIN, Lot, and Expiry.
	 * Assumes format: 01{GTIN14}17{YYMMDD}10{LOT variable to end}
	 * @param {string} gs1_string The raw scanned string
	 * @returns {object|null} Parsed data {gtin, lot, expiry} or null if not matching
	 */
	static parse(gs1_string) {
		console.log(
			`🏥 GS1 Parse Start: Input="${gs1_string}", Length=${gs1_string.length}`
		)

		// Validate input
		if (!gs1_string || typeof gs1_string !== 'string') {
			console.log('🏥 GS1 Parse Failed: Invalid input (null or not a string)')
			return null
		}

		// Check if numeric and minimum length
		if (!gs1_string.match(/^\d+$/) || gs1_string.length < this.MIN_GS1_LENGTH) {
			console.log(
				`🏥 GS1 Parse Failed: Not a valid numeric string or too short (min ${this.MIN_GS1_LENGTH} chars)`
			)
			return null
		}

		let pos = 0

		// Parse AI 01: GTIN (14 digits)
		if (gs1_string.substr(pos, 2) !== this.AI_GTIN) {
			console.log(
				`🏥 GS1 Parse Failed: No AI01 at pos ${pos}, found "${gs1_string.substr(pos, 2)}"`
			)
			return null
		}
		pos += 2
		const gtin = gs1_string.substr(pos, this.GTIN_LENGTH)
		pos += this.GTIN_LENGTH

		// Parse AI 17: Expiry (6 digits YYMMDD)
		if (gs1_string.substr(pos, 2) !== this.AI_EXPIRY) {
			console.log(
				`🏥 GS1 Parse Failed: No AI17 at pos ${pos}, found "${gs1_string.substr(pos, 2)}"`
			)
			return null
		}
		pos += 2
		const expiry = gs1_string.substr(pos, this.EXPIRY_LENGTH)
		pos += this.EXPIRY_LENGTH

		// Parse AI 10: Lot (variable length, rest of string)
		if (gs1_string.substr(pos, 2) !== this.AI_LOT) {
			console.log(
				`🏥 GS1 Parse Failed: No AI10 at pos ${pos}, found "${gs1_string.substr(pos, 2)}"`
			)
			return null
		}
		pos += 2
		const lot = gs1_string.substr(pos)

		// Validate extracted values
		if (!gtin || !lot) {
			console.log('🏥 GS1 Parse Failed: Missing GTIN or lot after parsing')
			return null
		}

		console.log(
			`%c🏥 GS1 Parse Success: GTIN=${gtin}, Lot=${lot}, Expiry=${expiry}`,
			'color: #4CAF50; font-weight: bold;'
		)
		return { gtin, lot, expiry }
	}

	/**
	 * Validates if a string is likely a GS1 barcode
	 * @param {string} input The string to validate
	 * @returns {boolean} True if likely a GS1 barcode
	 */
	static isGS1(input) {
		if (!input || typeof input !== 'string') return false
		if (!input.match(/^\d+$/)) return false
		if (input.length < this.MIN_GS1_LENGTH) return false
		if (!input.startsWith(this.AI_GTIN)) return false
		return true
	}

	/**
	 * Formats a GS1 barcode for display (with parentheses around AIs)
	 * @param {object} parsed The parsed GS1 data {gtin, lot, expiry}
	 * @returns {string} Formatted string like (01)12345678901234(17)250101(10)LOT123
	 */
	static format(parsed) {
		if (!parsed || !parsed.gtin || !parsed.lot) return ''
		return `(${this.AI_GTIN})${parsed.gtin}(${this.AI_EXPIRY})${parsed.expiry || ''}(${this.AI_LOT})${parsed.lot}`
	}
}

// Export for use in other modules
window.surgishop.GS1Parser = surgishop.GS1Parser
