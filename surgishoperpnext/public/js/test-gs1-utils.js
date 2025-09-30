/**
 * SurgiShopERPNext - GS1 Parser Unit Tests
 * Test cases for the GS1Parser utility class
 * 
 * To run these tests in the browser console:
 * > surgishop.runGS1Tests()
 */

if (typeof window.surgishop === 'undefined') {
	window.surgishop = {}
}

surgishop.GS1Tests = {
	runAll: function () {
		console.log('%c🧪 Running GS1Parser Tests...', 'color: #FF9800; font-weight: bold;')

		let passed = 0
		let failed = 0

		const tests = [
			this.testValidGS1Parse,
			this.testValidGS1ParseAlphanumericLot,
			this.testInvalidGS1TooShort,
			this.testInvalidGS1MissingAI01,
			this.testInvalidGS1MissingAI17,
			this.testInvalidGS1MissingAI10,
			this.testIsGS1Valid,
			this.testIsGS1Invalid,
			this.testFormatGS1,
			this.testParseWithVariableLotLength,
			this.testStringifyGS1
		]

		tests.forEach((test) => {
			try {
				test.call(this)
				passed++
				console.log(`%c✓ ${test.name} PASSED`, 'color: #4CAF50;')
			} catch (e) {
				failed++
				console.error(`%c✗ ${test.name} FAILED`, 'color: #F44336;')
				console.error(e)
			}
		})

		console.log(
			`%c🧪 Test Results: ${passed} passed, ${failed} failed`,
			`color: ${failed === 0 ? '#4CAF50' : '#F44336'}; font-weight: bold;`
		)

		return { passed, failed }
	},

	// Helper assertion functions
	assertEqual: function (actual, expected, message) {
		if (actual !== expected) {
			throw new Error(
				`${message || 'Assertion failed'}: expected ${expected}, got ${actual}`
			)
		}
	},

	assertNotNull: function (value, message) {
		if (value === null || value === undefined) {
			throw new Error(`${message || 'Assertion failed'}: value is null or undefined`)
		}
	},

	assertNull: function (value, message) {
		if (value !== null) {
			throw new Error(`${message || 'Assertion failed'}: expected null, got ${value}`)
		}
	},

	assertTrue: function (value, message) {
		if (!value) {
			throw new Error(`${message || 'Assertion failed'}: expected true, got ${value}`)
		}
	},

	assertFalse: function (value, message) {
		if (value) {
			throw new Error(`${message || 'Assertion failed'}: expected false, got ${value}`)
		}
	},

	// Test cases
	testValidGS1Parse: function () {
		const input = '01123456789012341725013110LOT123'
		const result = surgishop.GS1Parser.parse(input)

		this.assertNotNull(result, 'Result should not be null')
		this.assertEqual(result.gtin, '12345678901234', 'GTIN should match')
		this.assertEqual(result.expiry, '250131', 'Expiry should match')
		this.assertEqual(result.lot, 'LOT123', 'Lot should match')
	},

	testValidGS1ParseAlphanumericLot: function () {
		// Real-world test case with alphanumeric lot number
		const input = '012070503100301617251220103IAIDP06'
		const result = surgishop.GS1Parser.parse(input)

		this.assertNotNull(result, 'Result should not be null')
		this.assertEqual(result.gtin, '20705031003016', 'GTIN should match')
		this.assertEqual(result.expiry, '251220', 'Expiry should match (Dec 20, 2025)')
		this.assertEqual(result.lot, '3IAIDP06', 'Alphanumeric lot should match')
	},

	testInvalidGS1TooShort: function () {
		const input = '01123456789'
		const result = surgishop.GS1Parser.parse(input)

		this.assertNull(result, 'Result should be null for too short input')
	},

	testInvalidGS1MissingAI01: function () {
		const input = '99123456789012341725013110LOT123'
		const result = surgishop.GS1Parser.parse(input)

		this.assertNull(result, 'Result should be null when AI01 is missing')
	},

	testInvalidGS1MissingAI17: function () {
		const input = '01123456789012349925013110LOT123'
		const result = surgishop.GS1Parser.parse(input)

		this.assertNull(result, 'Result should be null when AI17 is missing')
	},

	testInvalidGS1MissingAI10: function () {
		const input = '01123456789012341725013199LOT123'
		const result = surgishop.GS1Parser.parse(input)

		this.assertNull(result, 'Result should be null when AI10 is missing')
	},

	testIsGS1Valid: function () {
		const input = '01123456789012341725013110LOT123'
		const result = surgishop.GS1Parser.isGS1(input)

		this.assertTrue(result, 'Should identify valid GS1 barcode')
	},

	testIsGS1Invalid: function () {
		const input = 'INVALID'
		const result = surgishop.GS1Parser.isGS1(input)

		this.assertFalse(result, 'Should identify invalid GS1 barcode')
	},

	testFormatGS1: function () {
		const parsed = {
			gtin: '12345678901234',
			expiry: '250131',
			lot: 'LOT123'
		}
		const formatted = surgishop.GS1Parser.format(parsed)
		const expected = '(01)12345678901234(17)250131(10)LOT123'

		this.assertEqual(formatted, expected, 'Formatted string should match expected')
	},

	testParseWithVariableLotLength: function () {
		// Test with short lot
		const input1 = '01123456789012341725013110A'
		const result1 = surgishop.GS1Parser.parse(input1)
		this.assertEqual(result1.lot, 'A', 'Should handle single character lot')

		// Test with long lot
		const input2 = '01123456789012341725013110VERYLONGLOTNUM12345'
		const result2 = surgishop.GS1Parser.parse(input2)
		this.assertEqual(
			result2.lot,
			'VERYLONGLOTNUM12345',
			'Should handle long lot numbers'
		)
	},

	testStringifyGS1: function () {
		const parsed = {
			gtin: '12345678901234',
			expiry: '250131',
			lot: '3IAIDP06'
		}
		const raw = surgishop.GS1Parser.stringify(parsed)
		const expected = '01123456789012341725013110103IAIDP06'

		this.assertEqual(
			raw,
			expected,
			'Stringify should reconstruct raw GS1 string'
		)
	}
}

// Export test runner to global scope
window.surgishop.runGS1Tests = function () {
	return surgishop.GS1Tests.runAll()
}

console.log(
	'%c🧪 GS1 Tests loaded. Run surgishop.runGS1Tests() to execute.',
	'color: #FF9800; font-weight: bold;'
)
