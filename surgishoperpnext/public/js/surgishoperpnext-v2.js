// Simple approach without frappe.ready dependency
$(document).ready(function() {
  console.log("SurgiShopERPNext: Document ready, initializing...");
  
  // Initialize immediately and set up monitoring
  initializeSurgiShopIndicator();
});

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

  // Create the indicator element
  const indicator = $(`
		<div class="surgishop-indicator" style="
			position: fixed;
			top: 20px;
			right: 20px;
			background: linear-gradient(135deg, #10b981, #059669);
			color: white;
			padding: 12px 20px;
			border-radius: 25px;
			font-size: 13px;
			font-weight: 600;
			box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
			z-index: 1000;
			cursor: pointer;
			transition: all 0.3s ease;
			display: flex;
			align-items: center;
			gap: 8px;
			opacity: 0;
			transform: translateY(-10px);
		">
			<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M9 12l2 2 4-4"/>
				<circle cx="12" cy="12" r="9"/>
			</svg>
			<span>SurgiShop Override Active</span>
		</div>
	`);

  // Add to page
  $("body").append(indicator);
  console.log("SurgiShopERPNext: Indicator added to page successfully");

  // Animate in
  setTimeout(() => {
    indicator.css({
      opacity: "1",
      transform: "translateY(0)",
    });
  }, 100);

  // Add hover effects
  indicator.hover(
    function () {
      $(this).css({
        transform: "translateY(-2px)",
        boxShadow: "0 6px 20px rgba(16, 185, 129, 0.4)",
      });
    },
    function () {
      $(this).css({
        transform: "translateY(0)",
        boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
      });
    }
  );

  // Add click handler to show info
  indicator.click(function () {
    console.log("SurgiShopERPNext: Indicator clicked, showing info");
    
    // Try frappe msgprint if available, otherwise use alert
    if (typeof frappe !== 'undefined' && frappe.msgprint) {
      try {
        frappe.msgprint({
          title: "SurgiShopERPNext Status",
          message: `
            <div style="text-align: center; padding: 20px;">
              <div style="font-size: 48px; color: #10b981; margin-bottom: 16px;">✓</div>
              <h3 style="color: #1f2937; margin-bottom: 12px;">Stock Override Active</h3>
              <p style="color: #6b7280; margin-bottom: 20px;">
                The SurgiShopERPNext app is successfully running and overriding 
                stock validation to allow expired products in inbound transactions.
              </p>
              <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; text-align: left;">
                <strong style="color: #1f2937;">Protected Transactions:</strong><br>
                <span style="color: #059669;">✓ Purchase Receipt</span><br>
                <span style="color: #059669;">✓ Purchase Invoice</span><br>
                <span style="color: #059669;">✓ Stock Entry (Material Receipt)</span><br>
                <span style="color: #059669;">✓ Stock Reconciliation</span><br>
                <span style="color: #059669;">✓ Sales Returns</span>
              </div>
            </div>
          `,
        });
      } catch (e) {
        console.log("SurgiShopERPNext: Frappe msgprint failed, using alert");
        alert("✓ SurgiShopERPNext Override Active\n\nStock validation override is working for inbound transactions:\n• Purchase Receipt\n• Purchase Invoice\n• Stock Entry (Material Receipt)\n• Stock Reconciliation\n• Sales Returns");
      }
    } else {
      alert("✓ SurgiShopERPNext Override Active\n\nStock validation override is working for inbound transactions:\n• Purchase Receipt\n• Purchase Invoice\n• Stock Entry (Material Receipt)\n• Stock Reconciliation\n• Sales Returns");
    }
  });

  // Auto-hide after 5 seconds, then show periodically
  setTimeout(() => {
    indicator.css({
      opacity: "0.7",
      transform: "scale(0.9)",
    });
  }, 5000);

  // Pulse effect every 30 seconds to remind user
  setInterval(() => {
    if (indicator.length && indicator.is(":visible")) {
      indicator
        .animate(
          {
            opacity: 1,
            transform: "scale(1)",
          },
          300
        )
        .animate(
          {
            opacity: 0.7,
            transform: "scale(0.9)",
          },
          300
        );
    }
  }, 30000);
}

// Also add a console log for developers
console.log(
  "%c🏥 SurgiShopERPNext Override Active",
  "color: #10b981; font-weight: bold; font-size: 14px;"
);
console.log("Stock validation override is active for inbound transactions.");
