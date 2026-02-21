/**
 * Menu Component
 * Loads coffee menu data from the API (with fallback) and renders
 * interactive glass-card menu items with expand/collapse details.
 *
 * Depends on:
 *   - api.js         → fetchCoffeeMenu()
 *   - utils/dom.js   → showSkeleton(), hideSkeleton(), showError(), hideError()
 *   - fallback-data.js → FALLBACK_MENU (used internally by fetchCoffeeMenu)
 *
 * Design system: glass-card, bg-[#0F172A], text-[#F8FAFC],
 * accent green-500, JetBrains Mono headings, IBM Plex Sans body.
 */

/**
 * Load menu data from the Coffee Service and render cards.
 * Shows skeleton while loading, error state with retry on failure.
 */
async function loadMenuData() {
  var skeletonId = 'menu-skeleton';
  var containerId = 'menu-container';

  showSkeleton(skeletonId);
  hideError(containerId);

  var container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = '';
  }

  try {
    var items = await fetchCoffeeMenu();
    hideSkeleton(skeletonId);
    renderMenuCards(items);
  } catch (error) {
    hideSkeleton(skeletonId);
    showError(containerId, error.message || '無法載入菜單，請稍後再試', loadMenuData);
  }
}

/**
 * Render menu cards into #menu-container.
 * @param {CoffeeMenuItem[]} items - Array of menu item objects
 */
function renderMenuCards(items) {
  var container = document.getElementById('menu-container');
  if (!container) return;

  // Hide the skeleton wrapper entirely so it doesn't take up grid space
  var skeleton = document.getElementById('menu-skeleton');
  if (skeleton) {
    skeleton.style.display = 'none';
  }

  container.innerHTML = '';

  if (!items || items.length === 0) {
    container.innerHTML =
      '<p class="col-span-full text-center text-slate-400 text-sm py-12">目前沒有可用的菜單項目</p>';
    return;
  }

  for (var i = 0; i < items.length; i++) {
    var card = createMenuCard(items[i]);
    container.appendChild(card);
  }
}

/**
 * Create a single menu card element for a CoffeeMenuItem.
 * @param {CoffeeMenuItem} item - Menu item data
 * @returns {HTMLElement} The card element
 */
function createMenuCard(item) {
  var card = document.createElement('article');
  card.className =
    'glass-card overflow-hidden cursor-pointer transition-all duration-200 ' +
    'hover:border-green-500/50 focus-within:ring-2 focus-within:ring-green-500 ' +
    'focus-within:ring-offset-2 focus-within:ring-offset-[#0F172A]';
  card.setAttribute('data-menu-id', item.id);
  card.setAttribute('tabindex', '0');
  card.setAttribute('role', 'button');
  card.setAttribute('aria-expanded', 'false');
  card.setAttribute('aria-label', item.name + ' — 點擊展開詳細資訊');

  // Build card inner HTML
  var sizesHtml = buildSizesHtml(item.sizes);
  var recipePreviewHtml = buildRecipePreviewHtml(item.recipe);
  var detailHtml = buildDetailHtml(item.recipe, item.customizations);

  card.innerHTML =
    // Product image
    '<div class="relative h-48 overflow-hidden bg-[#334155]">' +
      '<img src="' + escapeAttr(item.image) + '" ' +
        'alt="' + escapeAttr(item.name) + ' coffee" ' +
        'class="w-full h-full object-cover transition-all duration-300" ' +
        'loading="lazy" ' +
        'onerror="this.style.display=\'none\'">' +
      '<div class="absolute inset-0 bg-gradient-to-t from-[#0F172A]/60 to-transparent"></div>' +
    '</div>' +

    // Card body
    '<div class="p-4">' +
      // Name
      '<h3 class="font-[\'JetBrains_Mono\'] font-semibold text-lg text-[#F8FAFC] mb-3">' +
        escapeHtml(item.name) +
      '</h3>' +

      // Sizes
      '<div class="mb-3">' + sizesHtml + '</div>' +

      // Recipe preview (collapsed view)
      '<div class="flex items-center gap-2 text-slate-300 text-xs">' +
        recipePreviewHtml +
      '</div>' +

      // Expand indicator
      '<div class="flex items-center justify-center mt-3 text-slate-400 transition-all duration-200">' +
        '<span class="text-xs mr-1">詳細資訊</span>' +
        menuChevronDownSvg() +
      '</div>' +

      // Expandable detail section
      '<div class="menu-card-detail overflow-hidden transition-all duration-200" ' +
        'style="max-height:0;opacity:0;">' +
        '<div class="pt-4 mt-4 border-t border-white/10">' +
          detailHtml +
        '</div>' +
      '</div>' +
    '</div>';

  // Click handler
  card.addEventListener('click', function () {
    toggleCardDetail(card);
  });

  // Keyboard handler (Enter/Space)
  card.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleCardDetail(card);
    }
  });

  return card;
}

/**
 * Build HTML for size options display.
 * @param {Array} sizes - Array of {size, ml, price}
 * @returns {string} HTML string
 */
function buildSizesHtml(sizes) {
  if (!sizes || sizes.length === 0) return '';

  var html = '<div class="flex flex-wrap gap-2">';
  for (var i = 0; i < sizes.length; i++) {
    var s = sizes[i];
    html +=
      '<span class="inline-flex items-center gap-1 px-2 py-1 rounded-md ' +
        'bg-[#1E293B] text-xs text-slate-300 border border-white/10">' +
        escapeHtml(s.size) +
        ' <span class="text-slate-400">' + s.ml + 'ml</span>' +
        ' <span class="text-green-500 font-semibold">$' + s.price + '</span>' +
      '</span>';
  }
  html += '</div>';
  return html;
}

/**
 * Build a short recipe preview line for the collapsed card view.
 * @param {object} recipe - {espressoShots, milkMl, waterMl, foam?}
 * @returns {string} HTML string
 */
function buildRecipePreviewHtml(recipe) {
  if (!recipe) return '';

  var parts = [];

  // Coffee bean icon + espresso shots
  parts.push(
    menuCoffeeSvg() +
    '<span>' + recipe.espressoShots + ' shot' + (recipe.espressoShots > 1 ? 's' : '') + '</span>'
  );

  if (recipe.milkMl > 0) {
    parts.push(
      '<span class="text-slate-500">|</span>' +
      menuDropletSvg() +
      '<span>牛奶 ' + recipe.milkMl + 'ml</span>'
    );
  }

  if (recipe.waterMl > 0) {
    parts.push(
      '<span class="text-slate-500">|</span>' +
      menuGlassSvg() +
      '<span>水 ' + recipe.waterMl + 'ml</span>'
    );
  }

  return parts.join(' ');
}

/**
 * Build the expanded detail section HTML (recipe + customizations).
 * @param {object} recipe - {espressoShots, milkMl, waterMl, foam?}
 * @param {Array} customizations - Array of customization option objects
 * @returns {string} HTML string
 */
function buildDetailHtml(recipe, customizations) {
  var html = '';

  // Recipe details
  html += '<h4 class="font-[\'JetBrains_Mono\'] text-sm font-semibold text-[#F8FAFC] mb-3 flex items-center gap-2">' +
    menuBeakerSvg() + '配方詳情</h4>';

  html += '<dl class="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mb-4">';

  html += buildDetailRow('Espresso', recipe.espressoShots + ' shot' + (recipe.espressoShots > 1 ? 's' : ''));

  if (recipe.milkMl > 0) {
    html += buildDetailRow('牛奶', recipe.milkMl + ' ml');
  }

  if (recipe.waterMl > 0) {
    html += buildDetailRow('水', recipe.waterMl + ' ml');
  }

  if (recipe.foam) {
    html += buildDetailRow('奶泡', escapeHtml(recipe.foam));
  }

  html += '</dl>';

  // Customizations
  if (customizations && customizations.length > 0) {
    html += '<h4 class="font-[\'JetBrains_Mono\'] text-sm font-semibold text-[#F8FAFC] mb-3 flex items-center gap-2">' +
      menuSettingsSvg() + '客製化選項</h4>';

    html += '<ul class="space-y-2">';
    for (var i = 0; i < customizations.length; i++) {
      var c = customizations[i];
      html += '<li class="text-sm">';
      html += '<span class="text-slate-300 font-medium">' + escapeHtml(c.label) + '</span>';
      html += '<div class="flex flex-wrap gap-1 mt-1">';
      for (var j = 0; j < c.choices.length; j++) {
        var choice = c.choices[j];
        var priceTag = choice.priceAdjust > 0
          ? ' <span class="text-green-500">+$' + choice.priceAdjust + '</span>'
          : '';
        html +=
          '<span class="inline-block px-2 py-0.5 rounded text-xs ' +
            'bg-[#1E293B] text-slate-300 border border-white/10">' +
            escapeHtml(choice.label) + priceTag +
          '</span>';
      }
      html += '</div>';
      html += '</li>';
    }
    html += '</ul>';
  }

  return html;
}

/**
 * Build a single detail row (dt/dd pair).
 * @param {string} label
 * @param {string} value
 * @returns {string} HTML string
 */
function buildDetailRow(label, value) {
  return '<dt class="text-slate-400">' + escapeHtml(label) + '</dt>' +
    '<dd class="text-slate-300 font-[\'JetBrains_Mono\']">' + value + '</dd>';
}

/**
 * Toggle expanded/collapsed state of a menu card.
 * @param {HTMLElement} cardElement - The card article element
 */
function toggleCardDetail(cardElement) {
  var detail = cardElement.querySelector('.menu-card-detail');
  if (!detail) return;

  var isExpanded = cardElement.getAttribute('aria-expanded') === 'true';

  if (isExpanded) {
    // Collapse
    detail.style.maxHeight = '0';
    detail.style.opacity = '0';
    cardElement.setAttribute('aria-expanded', 'false');

    // Rotate chevron back
    var chevron = cardElement.querySelector('.menu-chevron');
    if (chevron) {
      chevron.style.transform = 'rotate(0deg)';
    }
  } else {
    // Expand — measure content height then animate
    detail.style.maxHeight = detail.scrollHeight + 'px';
    detail.style.opacity = '1';
    cardElement.setAttribute('aria-expanded', 'true');

    // Rotate chevron
    var chevron = cardElement.querySelector('.menu-chevron');
    if (chevron) {
      chevron.style.transform = 'rotate(180deg)';
    }
  }
}

/* -----------------------------------------------------------------------
   Lucide SVG Icon Helpers
   All icons use a consistent 16×16 size with currentColor stroke.
   ----------------------------------------------------------------------- */

/** Chevron-down icon (used for expand indicator) */
function menuChevronDownSvg() {
  return '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" ' +
    'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" ' +
    'stroke-linejoin="round" class="menu-chevron shrink-0 transition-transform duration-200" ' +
    'aria-hidden="true">' +
    '<path d="m6 9 6 6 6-6"></path>' +
    '</svg>';
}

/** Coffee/bean icon (used for espresso shots) */
function menuCoffeeSvg() {
  return '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" ' +
    'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" ' +
    'stroke-linejoin="round" class="shrink-0 text-green-500" aria-hidden="true">' +
    '<path d="M17 8h1a4 4 0 1 1 0 8h-1"></path>' +
    '<path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"></path>' +
    '</svg>';
}

/** Droplet icon (used for milk) */
function menuDropletSvg() {
  return '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" ' +
    'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" ' +
    'stroke-linejoin="round" class="shrink-0 text-slate-400" aria-hidden="true">' +
    '<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"></path>' +
    '</svg>';
}

/** Glass/water icon (used for water) */
function menuGlassSvg() {
  return '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" ' +
    'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" ' +
    'stroke-linejoin="round" class="shrink-0 text-slate-400" aria-hidden="true">' +
    '<path d="M15.2 22H8.8a2 2 0 0 1-2-1.79L5 3h14l-1.81 17.21A2 2 0 0 1 15.2 22Z"></path>' +
    '<path d="M6 12a5 5 0 0 1 6 0 5 5 0 0 0 6 0"></path>' +
    '</svg>';
}

/** Beaker/flask icon (used for recipe details heading) */
function menuBeakerSvg() {
  return '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" ' +
    'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" ' +
    'stroke-linejoin="round" class="shrink-0 text-green-500" aria-hidden="true">' +
    '<path d="M4.5 3h15"></path>' +
    '<path d="M6 3v16a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V3"></path>' +
    '<path d="M6 14h12"></path>' +
    '</svg>';
}

/** Settings/sliders icon (used for customizations heading) */
function menuSettingsSvg() {
  return '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" ' +
    'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" ' +
    'stroke-linejoin="round" class="shrink-0 text-green-500" aria-hidden="true">' +
    '<line x1="4" x2="4" y1="21" y2="14"></line>' +
    '<line x1="4" x2="4" y1="10" y2="3"></line>' +
    '<line x1="12" x2="12" y1="21" y2="12"></line>' +
    '<line x1="12" x2="12" y1="8" y2="3"></line>' +
    '<line x1="20" x2="20" y1="21" y2="16"></line>' +
    '<line x1="20" x2="20" y1="12" y2="3"></line>' +
    '<line x1="2" x2="6" y1="14" y2="14"></line>' +
    '<line x1="10" x2="14" y1="8" y2="8"></line>' +
    '<line x1="18" x2="22" y1="16" y2="16"></line>' +
    '</svg>';
}

/* -----------------------------------------------------------------------
   String Escape Helpers
   ----------------------------------------------------------------------- */

/**
 * Escape HTML special characters to prevent XSS.
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Escape a string for use in an HTML attribute value.
 * @param {string} str
 * @returns {string}
 */
function escapeAttr(str) {
  return escapeHtml(str);
}
