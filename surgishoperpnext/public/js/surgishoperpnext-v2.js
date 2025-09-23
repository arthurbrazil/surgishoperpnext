// Simple approach without frappe.ready dependency
$(document).ready(function() {
  console.log("SurgiShopERPNext: Document ready, initializing...");
  
  // Fix get_desktop_page error first
  fixGetDesktopPageError();
  
  // Initialize immediately and set up monitoring
  initializeSurgiShopIndicator();
});

function fixGetDesktopPageError() {
  console.log("SurgiShopERPNext: Applying get_desktop_page error fix...");
  
  // Override frappe.call to fix get_desktop_page error
  if (typeof frappe !== 'undefined' && frappe.call) {
    const originalFrappeCall = frappe.call;
    
    frappe.call = function(options) {
      // Fix for get_desktop_page missing page argument
      if (options.method === 'frappe.desk.desktop.get_desktop_page') {
        if (!options.args || !options.args.page) {
          options.args = options.args || {};
          options.args.page = 'workspace';
          console.log("SurgiShopERPNext: Fixed get_desktop_page call by adding default page='workspace'");
        }
      }
      
      return originalFrappeCall.call(this, options);
    };
    
    console.log("SurgiShopERPNext: get_desktop_page error fix applied");
  }
}

function initializeSurgiShopIndicator() {
  console.log("SurgiShopERPNext: Starting initialization");
  
  // Add indicator with multiple timing strategies
  setTimeout(function() {
    console.log("SurgiShopERPNext: First attempt (500ms)");
    add_surgishop_indicator();
  }, 500);
  
  setTimeout(function() {
    console.log("SurgiShopERPNext: Second attempt (1500ms)");
    add_surgishop_indicator();
  }, 1500);
  
  setTimeout(function() {
    console.log("SurgiShopERPNext: Third attempt (3000ms)");
    add_surgishop_indicator();
  }, 3000);
  
  // Set up event listeners for navigation if available
  if (typeof $ !== 'undefined') {
    // Listen for hash changes (common in SPAs)
    $(window).on('hashchange', function() {
      console.log("SurgiShopERPNext: Hash changed to", window.location.hash);
      setTimeout(add_surgishop_indicator, 500);
    });
    
    // Listen for any navigation events
    $(document).on('click', 'a', function() {
      setTimeout(function() {
        console.log("SurgiShopERPNext: Navigation detected, adding indicator");
        add_surgishop_indicator();
      }, 1000);
    });
  }
  
  // Try to hook into frappe events if available (without using frappe.ready)
  if (typeof frappe !== 'undefined') {
    console.log("SurgiShopERPNext: Frappe detected, setting up event hooks");
    
    // Try to listen for route changes if router exists
    var checkForRouter = function() {
      if (frappe.router && frappe.router.on) {
        console.log("SurgiShopERPNext: Router found, hooking into route changes");
        frappe.router.on('change', function() {
          console.log("SurgiShopERPNext: Route changed via frappe router");
          setTimeout(add_surgishop_indicator, 500);
        });
      } else {
        setTimeout(checkForRouter, 500);
      }
    };
    checkForRouter();
  }
}

function add_surgishop_indicator() {
  console.log("SurgiShopERPNext: Attempting to add indicator");
  
  // Remove existing indicator if present
  $(".surgishop-indicator").remove();
  
  // Check if we're in the right context
  if (!$ || !jQuery) {
    console.log("SurgiShopERPNext: jQuery not available");
    return;
  }

  // Create corner sash style indicator
  var indicatorHtml = '<div class="surgishop-indicator" style="' +
    'position: fixed;' +
    'bottom: 0;' +
    'right: 0;' +
    'width: 0;' +
    'height: 0;' +
    'border-style: solid;' +
    'border-width: 0 0 60px 60px;' +
    'border-color: transparent transparent #6b7280 transparent;' +
    'z-index: 1000;' +
    'cursor: pointer;' +
    'transition: all 0.3s ease;' +
    'opacity: 0;' +
    '">' +
    '</div>' +
    '<div class="surgishop-sash-text" style="' +
    'position: fixed;' +
    'bottom: 8px;' +
    'right: 8px;' +
    'color: white;' +
    'font-size: 9px;' +
    'font-weight: 600;' +
    'text-transform: uppercase;' +
    'letter-spacing: 0.5px;' +
    'transform: rotate(-45deg);' +
    'transform-origin: center;' +
    'z-index: 1001;' +
    'cursor: pointer;' +
    'user-select: none;' +
    'pointer-events: none;' +
    'opacity: 0;' +
    '">SS</div>';
  
  var indicator = $(indicatorHtml);

  // Add CSS for sash hover effects
  if (!$('#surgishop-sash-styles').length) {
    var sashStyle = '<style id="surgishop-sash-styles">' +
      '.surgishop-indicator:hover {' +
      'border-color: transparent transparent #4b5563 transparent !important;' +
      '}' +
      '.surgishop-sash-hover {' +
      'border-color: transparent transparent #4b5563 transparent;' +
      '}' +
      '</style>';
    $('head').append(sashStyle);
  }

  // Add to page
  $("body").append(indicator);
  console.log("SurgiShopERPNext: Indicator added to page successfully");

  // Animate in
  setTimeout(() => {
    $(".surgishop-indicator").css("opacity", "0.7");
    $(".surgishop-sash-text").css("opacity", "0.9");
  }, 100);

  // Add hover effects for sash
  $(".surgishop-indicator, .surgishop-sash-text").hover(
    function () {
      $(".surgishop-indicator").addClass("surgishop-sash-hover");
      $(".surgishop-sash-text").css("opacity", "1");
    },
    function () {
      $(".surgishop-indicator").removeClass("surgishop-sash-hover");
      $(".surgishop-sash-text").css("opacity", "0.9");
    }
  );

  // Add click handler to show info - works for both sash elements
  $(".surgishop-indicator, .surgishop-sash-text").click(function () {
    console.log("SurgiShopERPNext: Indicator clicked, showing info");
    
    // Try frappe msgprint if available, otherwise use alert
    if (typeof frappe !== 'undefined' && frappe.msgprint) {
      try {
        var messageHtml = '<div style="text-align: center; padding: 20px;">' +
          '<div style="font-size: 48px; color: #10b981; margin-bottom: 16px;">✓</div>' +
          '<h3 style="color: #1f2937; margin-bottom: 12px;">Batch Expiry Override Active</h3>' +
          '<p style="color: #6b7280; margin-bottom: 20px;">' +
          'The SurgiShopERPNext app is successfully running and completely disabling ' +
          'batch expiry validation for ALL transactions (research purposes).' +
          '</p>' +
          '<div style="background: #f3f4f6; padding: 16px; border-radius: 8px; text-align: left;">' +
          '<strong style="color: #1f2937;">Override Applied To:</strong><br>' +
          '<span style="color: #059669;">✓ Purchase Receipt (Inbound)</span><br>' +
          '<span style="color: #059669;">✓ Purchase Invoice (Inbound)</span><br>' +
          '<span style="color: #059669;">✓ Stock Entry (All Types)</span><br>' +
          '<span style="color: #059669;">✓ Stock Reconciliation</span><br>' +
          '<span style="color: #059669;">✓ Sales Invoice (Outbound)</span><br>' +
          '<span style="color: #059669;">✓ Delivery Note (Outbound)</span>' +
          '</div>' +
          '<div style="background: #fef3c7; padding: 12px; border-radius: 8px; margin-top: 12px; text-align: left;">' +
          '<strong style="color: #92400e;">⚠️ Research Use Only</strong><br>' +
          '<span style="color: #92400e; font-size: 12px;">Expired products enabled for research purposes.</span>' +
          '</div>' +
          '</div>';
        
        frappe.msgprint({
          title: "SurgiShopERPNext Status",
          message: messageHtml,
        });
      } catch (e) {
        console.log("SurgiShopERPNext: Frappe msgprint failed, using alert");
        alert("✓ SurgiShopERPNext Batch Expiry Override Active\n\nBatch expiry validation disabled for ALL transactions (research purposes):\n• Purchase Receipt (Inbound)\n• Purchase Invoice (Inbound)\n• Stock Entry (All Types)\n• Stock Reconciliation\n• Sales Invoice (Outbound)\n• Delivery Note (Outbound)\n\n⚠️ Research Use Only - Expired products enabled");
      }
    } else {
      alert("✓ SurgiShopERPNext Batch Expiry Override Active\n\nBatch expiry validation disabled for ALL transactions (research purposes):\n• Purchase Receipt (Inbound)\n• Purchase Invoice (Inbound)\n• Stock Entry (All Types)\n• Stock Reconciliation\n• Sales Invoice (Outbound)\n• Delivery Note (Outbound)\n\n⚠️ Research Use Only - Expired products enabled");
    }
  });

  // Auto-fade after 10 seconds to be more discreet
  setTimeout(() => {
    $(".surgishop-indicator").css("opacity", "0.4");
    $(".surgishop-sash-text").css("opacity", "0.6");
  }, 10000);

  // Very subtle pulse every 60 seconds
  setInterval(() => {
    if ($(".surgishop-indicator").length && $(".surgishop-indicator").is(":visible")) {
      $(".surgishop-indicator")
        .animate({ opacity: 0.7 }, 500)
        .animate({ opacity: 0.4 }, 500);
      $(".surgishop-sash-text")
        .animate({ opacity: 0.9 }, 500)
        .animate({ opacity: 0.6 }, 500);
    }
  }, 60000);
}

// Also add a console log for developers
console.log(
  "%c🏥 SurgiShopERPNext Batch Expiry Override Active",
  "color: #10b981; font-weight: bold; font-size: 14px;"
);
console.log("Batch expiry validation completely disabled for ALL transactions (research purposes).");
