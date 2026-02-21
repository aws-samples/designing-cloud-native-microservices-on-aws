/**
 * Architecture Diagram Component
 * Interactive DDD bounded context diagram showing event flows
 * between Orders, Coffee, and Inventory contexts.
 *
 * Design system: glass-card backgrounds, JetBrains Mono headings,
 * green-500/blue-400/amber-400 BC borders, slate-400 arrows.
 */

/**
 * Initialize the architecture diagram.
 * Clears the placeholder in #architecture-diagram and builds
 * an interactive HTML-based DDD architecture diagram.
 */
function initArchitecture() {
  var container = document.getElementById('architecture-diagram');
  if (!container) return;

  var boundedContexts = [
    {
      id: 'bc-orders',
      name: 'Orders',
      borderColor: 'border-green-500/50',
      hoverBorder: 'border-green-500',
      glowColor: '0 0 20px rgba(34,197,94,0.3)',
      aggregate: 'Order',
      events: ['OrderCreated', 'OrderStatusChanged'],
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-green-500 shrink-0" aria-hidden="true"><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><path d="M12 11h4"></path><path d="M12 16h4"></path><path d="M8 11h.01"></path><path d="M8 16h.01"></path></svg>'
    },
    {
      id: 'bc-coffee',
      name: 'Coffee',
      borderColor: 'border-blue-400/50',
      hoverBorder: 'border-blue-400',
      glowColor: '0 0 20px rgba(96,165,250,0.3)',
      aggregate: 'Coffee',
      events: ['CoffeeStatus'],
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-blue-400 shrink-0" aria-hidden="true"><path d="M17 8h1a4 4 0 1 1 0 8h-1"></path><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"></path><line x1="6" y1="2" x2="6" y2="4"></line><line x1="10" y1="2" x2="10" y2="4"></line><line x1="14" y1="2" x2="14" y2="4"></line></svg>'
    },
    {
      id: 'bc-inventory',
      name: 'Inventory',
      borderColor: 'border-amber-400/50',
      hoverBorder: 'border-amber-400',
      glowColor: '0 0 20px rgba(251,191,36,0.3)',
      aggregate: 'Inventory',
      events: ['StockChanged'],
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-amber-400 shrink-0" aria-hidden="true"><path d="M16.5 9.4 7.55 4.24"></path><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.29 7 12 12 20.71 7"></polyline><line x1="12" y1="22" x2="12" y2="12"></line></svg>'
    }
  ];

  var eventFlows = [
    { label: 'OrderCreated', sublabel: 'triggers coffee making' },
    { label: 'CoffeeStatus', sublabel: 'consumes inventory' },
    { label: 'StockChanged', sublabel: 'affects availability' }
  ];

  // Right arrow SVG for desktop (horizontal)
  var rightArrowSvg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" ' +
    'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" ' +
    'stroke-linejoin="round" class="text-slate-400 shrink-0" aria-hidden="true">' +
    '<path d="M5 12h14"></path>' +
    '<path d="m12 5 7 7-7 7"></path>' +
    '</svg>';

  // Down arrow SVG for mobile (vertical)
  var downArrowSvg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" ' +
    'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" ' +
    'stroke-linejoin="round" class="text-slate-400 shrink-0" aria-hidden="true">' +
    '<path d="M12 5v14"></path>' +
    '<path d="m19 12-7 7-7-7"></path>' +
    '</svg>';

  // Build the diagram HTML
  var html = '';

  // Main layout: flex-col on mobile, flex-row on desktop
  html += '<div class="flex flex-col md:flex-row items-center md:items-stretch gap-4 md:gap-0 w-full">';

  for (var i = 0; i < boundedContexts.length; i++) {
    var bc = boundedContexts[i];

    // BC box
    html += buildBCBox(bc);

    // Arrow between boxes (not after the last one)
    if (i < boundedContexts.length - 1) {
      var flow = eventFlows[i];
      html += buildArrowConnector(flow, rightArrowSvg, downArrowSvg);
    }
  }

  html += '</div>';

  // Return flow arrow (Inventory → Orders) shown below the main row
  html += buildReturnFlow(eventFlows[2], rightArrowSvg, downArrowSvg);

  // Clear placeholder and inject
  container.innerHTML = html;
  container.classList.remove('flex', 'items-center', 'justify-center');

  // Bind hover interactions
  bindBCHoverEffects(boundedContexts);
}

/**
 * Build HTML for a single Bounded Context box.
 * @param {Object} bc - Bounded context config object
 * @returns {string} HTML string
 */
function buildBCBox(bc) {
  var eventsHtml = '';
  for (var j = 0; j < bc.events.length; j++) {
    eventsHtml +=
      '<span class="inline-block px-2 py-0.5 rounded text-xs bg-[#0F172A]/60 text-slate-300 ' +
      "font-['JetBrains_Mono']\">" +
      bc.events[j] +
      '</span>';
  }

  return (
    '<div id="' + bc.id + '" class="flex-1 min-w-0 glass-card p-4 border ' + bc.borderColor +
    ' cursor-pointer transition-all duration-200" role="group" aria-label="' + bc.name + ' Bounded Context">' +
      '<div class="flex items-center gap-2 mb-3">' +
        bc.icon +
        '<h4 class="font-[\'JetBrains_Mono\'] font-bold text-base text-[#F8FAFC]">' + bc.name + '</h4>' +
      '</div>' +
      '<div class="mb-3">' +
        '<span class="text-xs text-slate-400 uppercase tracking-wider">Aggregate Root</span>' +
        '<p class="font-[\'JetBrains_Mono\'] text-sm text-green-500 mt-0.5">' + bc.aggregate + '</p>' +
      '</div>' +
      '<div>' +
        '<span class="text-xs text-slate-400 uppercase tracking-wider block mb-1">Domain Events</span>' +
        '<div class="flex flex-wrap gap-1">' +
          eventsHtml +
        '</div>' +
      '</div>' +
    '</div>'
  );
}

/**
 * Build HTML for an arrow connector between two BC boxes.
 * Shows right arrow on desktop, down arrow on mobile.
 * @param {Object} flow - Event flow config { label, sublabel }
 * @param {string} rightArrowSvg - SVG string for horizontal arrow
 * @param {string} downArrowSvg - SVG string for vertical arrow
 * @returns {string} HTML string
 */
function buildArrowConnector(flow, rightArrowSvg, downArrowSvg) {
  return (
    '<div class="flex flex-col items-center justify-center px-2 py-2 md:py-0 shrink-0">' +
      '<div class="hidden md:flex flex-col items-center gap-1">' +
        rightArrowSvg +
        '<span class="text-[10px] text-slate-400 font-[\'JetBrains_Mono\'] whitespace-nowrap">' + flow.label + '</span>' +
      '</div>' +
      '<div class="flex md:hidden flex-col items-center gap-1">' +
        downArrowSvg +
        '<span class="text-[10px] text-slate-400 font-[\'JetBrains_Mono\'] whitespace-nowrap">' + flow.label + '</span>' +
      '</div>' +
    '</div>'
  );
}

/**
 * Build HTML for the return flow indicator (Inventory → Orders).
 * Shown as a curved path below the main diagram row.
 * @param {Object} flow - Event flow config { label, sublabel }
 * @returns {string} HTML string
 */
function buildReturnFlow() {
  // Return flow: Inventory → Orders (wraps around below)
  var returnArrowLeft =
    '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" ' +
    'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" ' +
    'stroke-linejoin="round" class="text-slate-400 shrink-0" aria-hidden="true">' +
    '<path d="M19 12H5"></path>' +
    '<path d="m12 19-7-7 7-7"></path>' +
    '</svg>';

  // Up arrow for mobile return flow
  var upArrowSvg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" ' +
    'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" ' +
    'stroke-linejoin="round" class="text-slate-400 shrink-0" aria-hidden="true">' +
    '<path d="M12 19V5"></path>' +
    '<path d="m5 12 7-7 7 7"></path>' +
    '</svg>';

  return (
    '<div class="mt-4 flex justify-center">' +
      '<div class="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0F172A]/40 border border-white/5">' +
        '<span class="text-xs text-slate-400 font-[\'JetBrains_Mono\']">Inventory</span>' +
        '<span class="hidden md:inline">' + returnArrowLeft + '</span>' +
        '<span class="inline md:hidden">' + upArrowSvg + '</span>' +
        '<span class="text-[10px] text-amber-400/80 font-[\'JetBrains_Mono\']">StockChanged</span>' +
        '<span class="hidden md:inline">' + returnArrowLeft + '</span>' +
        '<span class="inline md:hidden">' + upArrowSvg + '</span>' +
        '<span class="text-xs text-slate-400 font-[\'JetBrains_Mono\']">Orders</span>' +
      '</div>' +
    '</div>'
  );
}

/**
 * Bind hover effects to each BC box.
 * On hover: increase border opacity and add a subtle glow via box-shadow.
 * @param {Array} boundedContexts - Array of BC config objects
 */
function bindBCHoverEffects(boundedContexts) {
  for (var i = 0; i < boundedContexts.length; i++) {
    (function(bc) {
      var el = document.getElementById(bc.id);
      if (!el) return;

      el.addEventListener('mouseenter', function() {
        el.classList.remove(bc.borderColor);
        el.classList.add(bc.hoverBorder);
        el.style.boxShadow = bc.glowColor;
      });

      el.addEventListener('mouseleave', function() {
        el.classList.remove(bc.hoverBorder);
        el.classList.add(bc.borderColor);
        el.style.boxShadow = '';
      });

      // Keyboard focus support
      el.addEventListener('focusin', function() {
        el.classList.remove(bc.borderColor);
        el.classList.add(bc.hoverBorder);
        el.style.boxShadow = bc.glowColor;
      });

      el.addEventListener('focusout', function() {
        el.classList.remove(bc.hoverBorder);
        el.classList.add(bc.borderColor);
        el.style.boxShadow = '';
      });
    })(boundedContexts[i]);
  }
}
