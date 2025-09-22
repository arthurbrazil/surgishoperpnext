/**
 * SurgiShopERPNext - Simplified GS1 Barcode Parser (bark.js compatible)
 * Focused on GTIN-01 (Application Identifier 01) extraction
 * Browser-compatible version without Node.js dependencies
 */

(function(global) {
    'use strict';

    // GS1 Application Identifiers for GTIN-01
    const APPLICATION_IDENTIFIERS = {
        '01': {
            title: 'GTIN-01',
            length: 14,
            parser: function(options) {
                const data = options.barcode || '';
                const gtin = data.slice(0, 14);
                return {
                    raw: gtin,
                    value: gtin,
                    type: 'GTIN-01'
                };
            }
        },
        '10': {
            title: 'Batch/Lot Number',
            length: 'variable',
            parser: function(options) {
                const data = options.barcode || '';
                let value = '';
                let i = 0;
                while (i < data.length && data[i] !== String.fromCharCode(29)) {
                    value += data[i];
                    i++;
                }
                return {
                    raw: value,
                    value: value,
                    type: 'Batch/Lot Number'
                };
            }
        },
        '11': {
            title: 'Production Date',
            length: 6,
            parser: function(options) {
                const data = options.barcode || '';
                const date = data.slice(0, 6);
                return {
                    raw: date,
                    value: date,
                    type: 'Production Date'
                };
            }
        },
        '17': {
            title: 'Expiration Date',
            length: 6,
            parser: function(options) {
                const data = options.barcode || '';
                const date = data.slice(0, 6);
                return {
                    raw: date,
                    value: date,
                    type: 'Expiration Date'
                };
            }
        },
        '21': {
            title: 'Serial Number',
            length: 'variable',
            parser: function(options) {
                const data = options.barcode || '';
                let value = '';
                let i = 0;
                while (i < data.length && data[i] !== String.fromCharCode(29)) {
                    value += data[i];
                    i++;
                }
                return {
                    raw: value,
                    value: value,
                    type: 'Serial Number'
                };
            }
        }
    };

    // Find symbology and extract data
    function findSymbology(barcode) {
        // For GS1 barcodes, we'll assume the data starts after any symbology prefix
        // Common GS1 symbologies: GS1-128, GS1 DataBar, etc.
        let remainingBarcode = barcode;
        let symbology = 'GS1';

        // Remove any symbology-specific prefixes if present
        if (barcode.startsWith('01')) {
            // Already starts with AI 01, no prefix to remove
            remainingBarcode = barcode;
        } else if (barcode.length > 14 && barcode.includes('01')) {
            // Find the position of AI 01
            const ai01Pos = barcode.indexOf('01');
            remainingBarcode = barcode.substring(ai01Pos);
        }

        return {
            symbology: symbology,
            remainingBarcode: remainingBarcode
        };
    }

    // Parse Application Identifier
    function parseAi(barcode) {
        // Look for 2-digit AI first
        const ai2 = barcode.substring(0, 2);
        if (APPLICATION_IDENTIFIERS[ai2]) {
            return {
                ai: ai2,
                title: APPLICATION_IDENTIFIERS[ai2].title,
                parser: APPLICATION_IDENTIFIERS[ai2].parser
            };
        }

        // Look for 3-digit AI
        const ai3 = barcode.substring(0, 3);
        if (APPLICATION_IDENTIFIERS[ai3]) {
            return {
                ai: ai3,
                title: APPLICATION_IDENTIFIERS[ai3].title,
                parser: APPLICATION_IDENTIFIERS[ai3].parser
            };
        }

        // Look for 4-digit AI
        const ai4 = barcode.substring(0, 4);
        if (APPLICATION_IDENTIFIERS[ai4]) {
            return {
                ai: ai4,
                title: APPLICATION_IDENTIFIERS[ai4].title,
                parser: APPLICATION_IDENTIFIERS[ai4].parser
            };
        }

        // Default fallback
        return {
            ai: '00',
            title: 'Unknown',
            parser: function(options) {
                const data = options.barcode || '';
                return {
                    raw: data,
                    value: data,
                    type: 'Unknown'
                };
            }
        };
    }

    // Main GS1 Parser
    function gs1Parser(options) {
        const { barcode: originalBarcode, fnc = String.fromCharCode(29) } = options;
        
        const { symbology, remainingBarcode: barcode } = findSymbology(originalBarcode);
        const elements = [];
        
        let currPos = 0;
        while (currPos < barcode.length) {
            const { ai, title, parser } = parseAi(barcode.slice(currPos));
            currPos += ai.length;
            
            const element = parser({ barcode: barcode.slice(currPos), fnc });
            currPos += element.raw.length;
            
            const currentElement = {
                ai,
                title,
                ...element
            };
            elements.push(currentElement);
        }
        
        return {
            symbology,
            elements,
            originalBarcode,
            data: elements // For compatibility with original bark.js
        };
    }

    // Main bark function
    function bark(barcode, settings = {}) {
        const defaults = {
            assumeGtin: false,
            fnc: String.fromCharCode(29)
        };
        const options = { ...defaults, ...settings };
        
        let input = barcode;
        
        // Auto-detect GTIN if assumeGtin is true
        if (options.assumeGtin) {
            const digitsOnly = /^\d+$/.test(input);
            if (digitsOnly) {
                if (input.length >= 11 && input.length <= 14) {
                    input = `01${input.padStart(14, '0')}`;
                }
            }
        }
        
        return gs1Parser({ barcode: input, fnc: options.fnc });
    }

    // Export for different environments
    if (typeof module !== 'undefined' && module.exports) {
        // Node.js
        module.exports = bark;
    } else if (typeof define === 'function' && define.amd) {
        // AMD
        define(function() {
            return bark;
        });
    } else {
        // Browser global
        global.bark = bark;
    }

})(typeof window !== 'undefined' ? window : this);
