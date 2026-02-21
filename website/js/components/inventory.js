/**
 * Inventory Dashboard Component
 * Loads inventory data from the API (with fallback) and renders
 * glass-card stock level cards with progress bars.
 *
 * Depends on:
 *   - api.js         → fetchInventory()
 *   - utils/dom.js   → showSkeleton(), hideSkeleton(), showError(), hideError()
 *   - fallback-data.js → FALLBACK_INVENTORY (used internally by fetchInventory)
 *
 * Design system: glass-card, bg-[#0F172A], text-[#F8FAFC],
 * accent green-500, warning red-500/amber-500,
 * JetBrains Mono headings, IBM Plex Sans body.
 */

/**
 * Load inventory data from the Inventory Service and render the dashboard.
 * Shows skeleton while loading, error state with retry on failure.
 */
async function loadInventoryData() {
  var skeletonId = 'inventory-skeleton';
  var containerId = 'inventory-container';

  showSkeleton(skeletonId);
  hideError(containerId);

  var container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = '';
  }

  try {
    var items = await fetchInventory();
    hideSkeleton(skeletonId);
    renderInventoryDashboard(items);
  } catch (error) {
    hideSkeleton(skeletonId);
    showError(containerId, error.message || 'Failed to load inventory, please try again later', loadInventoryData);
  }
}

/**
 * Render inventory cards into #inventory-container.
 * @param {InventoryItem[]} items - Array of inventory item objects
 */
function renderInventoryDashboard(items) {
  var container = document.getElementById('inventory-container');
  if (!container) return;

  // Hide the skeleton wrapper so it doesn't occupy grid space
  var skeleton = document.getElementById('inventory-skeleton');
  if (skeleton) {
    skeleton.style.display = 'none';
  }

  container.innerHTML = '';

  if (!items || items.length === 0) {
    container.innerHTML =
      '<p class="col-span-full text-center text-slate-400 text-sm py-12">No inventory data available</p>';
    return;
  }

  for (var i = 0; i < items.length; i++) {
    var card = createInventoryCard(items[i]);
    container.appendChild(card);
  }
}

/**
 * Create a single inventory card element.
 * @param {InventoryItem} item - {id, name, unit, current, max, image?}
 * @returns {HTMLElement} The card element
 */
function createInventoryCard(item) {
  var percentage = item.max > 0 ? Math.round((item.current / item.max) * 100) : 0;
  var isLow = percentage < 30;

  var card = document.createElement('article');
  card.className =
    'glass-card p-6 cursor-pointer transition-all duration-200 ' +
    'hover:border-green-500/50 focus-within:ring-2 focus-within:ring-green-500 ' +
    'focus-within:ring-offset-2 focus-within:ring-offset-[#0F172A]';
  card.setAttribute('data-inventory-id', item.id);
  card.setAttribute('tabindex', '0');
  card.setAttribute('aria-label', item.name + ' — ' + item.current + ' ' + item.unit + ' (of ' + item.max + ')');

  var html = '';

  // Header row: icon/thumbnail + name
  html += '<div class="flex items-center gap-3 mb-4">';

  if (item.image) {
    html +=
      '<div class="w-10 h-10 rounded-lg overflow-hidden bg-[#334155] shrink-0">' +
        '<img src="' + escapeAttr(item.image) + '" ' +
          'alt="' + escapeAttr(item.name) + '" ' +
          'class="w-full h-full object-cover" ' +
          'loading="lazy" ' +
          'onerror="this.parentElement.innerHTML=\'' + inventoryPackageSvgInline() + '\'">' +
      '</div>';
  } else {
    html +=
      '<div class="w-10 h-10 rounded-lg bg-[#1E293B] flex items-center justify-center shrink-0">' +
        inventoryPackageSvg() +
      '</div>';
  }

  html +=
    '<div class="min-w-0">' +
      '<h3 class="font-[\'JetBrains_Mono\'] font-semibold text-base text-[#F8FAFC] truncate">' +
        escapeHtml(item.name) +
      '</h3>' +
      '<span class="text-xs text-slate-400">Unit: ' + escapeHtml(item.unit) + '</span>' +
    '</div>';

  html += '</div>';

  // Quantity display
  html += '<div class="flex items-baseline justify-between mb-3">';
  html +=
    '<span class="font-[\'JetBrains_Mono\'] text-2xl font-bold ' +
      (isLow ? 'text-red-400' : 'text-green-500') + '">' +
      item.current +
    '</span>';
  html +=
    '<span class="text-sm text-slate-400">/ ' + item.max + ' ' + escapeHtml(item.unit) + '</span>';
  html += '</div>';

  // Progress bar
  var barColorClass = isLow ? 'bg-red-500' : 'bg-green-500';

  html += '<div class="mb-3">';
  html +=
    '<div class="w-full h-2 rounded-full bg-[#1E293B] overflow-hidden" ' +
      'role="progressbar" ' +
      'aria-valuenow="' + item.current + '" ' +
      'aria-valuemin="0" ' +
      'aria-valuemax="' + item.max + '" ' +
      'aria-label="' + escapeAttr(item.name) + ' stock level">' +
      '<div class="inventory-progress-bar h-full rounded-full transition-all duration-500 ease-out ' +
        barColorClass + '" ' +
        'style="width: 0%;" ' +
        'data-target-width="' + percentage + '">' +
      '</div>' +
    '</div>';
  html += '</div>';

  // Status badge
  html += '<div class="flex items-center justify-between">';
  html += '<span class="text-xs text-slate-400">' + percentage + '% stock</span>';

  if (isLow) {
    html +=
      '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full ' +
        'bg-red-500/10 text-red-400 text-xs font-medium">' +
        inventoryAlertSvg() +
        'Low Stock' +
      '</span>';
  } else {
    html +=
      '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full ' +
        'bg-green-500/10 text-green-500 text-xs font-medium">' +
        inventoryCheckSvg() +
        'In Stock' +
      '</span>';
  }

  html += '</div>';

  card.innerHTML = html;

  // Animate progress bar after render
  requestAnimationFrame(function () {
    var bar = card.querySelector('.inventory-progress-bar');
    if (bar) {
      var targetWidth = bar.getAttribute('data-target-width');
      requestAnimationFrame(function () {
        bar.style.width = targetWidth + '%';
      });
    }
  });

  return card;
}

/**
 * Update a stock indicator progress bar with color based on percentage.
 * @param {HTMLElement} element - The progress bar inner element
 * @param {number} percentage - Stock percentage (0–100)
 */
function updateStockIndicator(element, percentage) {
  if (!element) return;

  var clamped = Math.max(0, Math.min(100, percentage));

  // Remove existing color classes
  element.classList.remove('bg-green-500', 'bg-red-500', 'bg-amber-500');

  // Apply color based on threshold
  if (clamped < 30) {
    element.classList.add('bg-red-500');
  } else {
    element.classList.add('bg-green-500');
  }

  // Animate width
  element.style.width = clamped + '%';
}

/* -----------------------------------------------------------------------
   Lucide SVG Icon Helpers
   All icons use consistent sizing with currentColor stroke.
   ----------------------------------------------------------------------- */

/** Package icon (fallback when no image is available) */
function inventoryPackageSvg() {
  return '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" ' +
    'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" ' +
    'stroke-linejoin="round" class="text-green-500 shrink-0" aria-hidden="true">' +
    '<path d="M16.5 9.4 7.55 4.24"></path>' +
    '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>' +
    '<polyline points="3.29 7 12 12 20.71 7"></polyline>' +
    '<line x1="12" y1="22" x2="12" y2="12"></line>' +
    '</svg>';
}

/** Package icon as inline string (used in onerror fallback for images) */
function inventoryPackageSvgInline() {
  return '<svg xmlns=&quot;http://www.w3.org/2000/svg&quot; width=&quot;20&quot; height=&quot;20&quot; viewBox=&quot;0 0 24 24&quot; ' +
    'fill=&quot;none&quot; stroke=&quot;currentColor&quot; stroke-width=&quot;2&quot; stroke-linecap=&quot;round&quot; ' +
    'stroke-linejoin=&quot;round&quot; class=&quot;text-green-500 m-auto&quot; aria-hidden=&quot;true&quot;>' +
    '<path d=&quot;M16.5 9.4 7.55 4.24&quot;></path>' +
    '<path d=&quot;M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z&quot;></path>' +
    '<polyline points=&quot;3.29 7 12 12 20.71 7&quot;></polyline>' +
    '<line x1=&quot;12&quot; y1=&quot;22&quot; x2=&quot;12&quot; y2=&quot;12&quot;></line>' +
    '</svg>';
}

/** Alert-triangle icon (low stock warning badge) */
function inventoryAlertSvg() {
  return '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" ' +
    'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" ' +
    'stroke-linejoin="round" class="shrink-0" aria-hidden="true">' +
    '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>' +
    '<line x1="12" y1="9" x2="12" y2="13"></line>' +
    '<line x1="12" y1="17" x2="12.01" y2="17"></line>' +
    '</svg>';
}

/** Check-circle icon (sufficient stock badge) */
function inventoryCheckSvg() {
  return '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" ' +
    'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" ' +
    'stroke-linejoin="round" class="shrink-0" aria-hidden="true">' +
    '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>' +
    '<polyline points="22 4 12 14.01 9 11.01"></polyline>' +
    '</svg>';
}
