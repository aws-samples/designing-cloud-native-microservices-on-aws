/**
 * Interactive Order Form Component
 * Handles product selection, size options, customizations, price calculation,
 * and order submission for the EventStorming Coffeeshop.
 *
 * Depends on:
 *   - fallback-data.js → FALLBACK_MENU
 *   - api.js           → createOrder()
 *
 * Exposes global functions:
 *   initOrderForm, updateSizeOptions, updateCustomizations,
 *   calculateTotal, submitOrder, showOrderResult
 */

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

/**
 * Shared CSS class strings for dynamically-created form controls.
 * Matches the design system: bg-[#1E293B], white/20 border, green-500 focus ring.
 */
var ORDER_INPUT_CLASSES =
  'w-full bg-[#1E293B] border border-white/20 rounded-lg p-3 text-white ' +
  'cursor-pointer transition-all duration-200 ' +
  'focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-[#0F172A] focus:border-green-500';

/**
 * Look up a product in FALLBACK_MENU by its id.
 * @param {string} productId
 * @returns {CoffeeMenuItem|undefined}
 */
function findProduct(productId) {
  for (var i = 0; i < FALLBACK_MENU.length; i++) {
    if (FALLBACK_MENU[i].id === productId) return FALLBACK_MENU[i];
  }
  return undefined;
}

/**
 * Return the currently selected product id from the #product select.
 * @returns {string}
 */
function getSelectedProductId() {
  var el = document.getElementById('product');
  return el ? el.value : '';
}

/* ------------------------------------------------------------------ */
/*  1. initOrderForm                                                  */
/* ------------------------------------------------------------------ */

/**
 * Initialise the order form by wiring up event listeners and
 * populating default values for size, customizations, and total.
 */
function initOrderForm() {
  var productSelect = document.getElementById('product');
  var sizeSelect = document.getElementById('size');
  var form = document.getElementById('order-form');

  if (!productSelect || !sizeSelect || !form) return;

  // Product change → refresh sizes + customizations
  productSelect.addEventListener('change', function () {
    var id = productSelect.value;
    updateSizeOptions(id);
    updateCustomizations(id);
  });

  // Size change → recalculate total
  sizeSelect.addEventListener('change', function () {
    calculateTotal();
  });

  // Form submit
  form.addEventListener('submit', function (e) {
    submitOrder(e);
  });

  // Populate defaults for the initially-selected product
  var initialId = productSelect.value;
  updateSizeOptions(initialId);
  updateCustomizations(initialId);
}

/* ------------------------------------------------------------------ */
/*  2. updateSizeOptions                                              */
/* ------------------------------------------------------------------ */

/**
 * Rebuild the #size <select> options based on the given product.
 * Espresso gets Single / Double; everything else gets Short–Venti.
 * @param {string} productId
 */
function updateSizeOptions(productId) {
  var sizeSelect = document.getElementById('size');
  if (!sizeSelect) return;

  var product = findProduct(productId);
  if (!product) return;

  // Clear existing options
  sizeSelect.innerHTML = '';

  // Add options from the product's sizes array
  for (var i = 0; i < product.sizes.length; i++) {
    var s = product.sizes[i];
    var opt = document.createElement('option');
    opt.value = s.size;
    opt.textContent = s.size + ' - $' + s.price;
    sizeSelect.appendChild(opt);
  }

  calculateTotal();
}

/* ------------------------------------------------------------------ */
/*  3. updateCustomizations                                           */
/* ------------------------------------------------------------------ */

/**
 * Rebuild the #customizations container with controls matching
 * the selected product's customization definitions.
 * @param {string} productId
 */
function updateCustomizations(productId) {
  var container = document.getElementById('customizations');
  if (!container) return;

  container.innerHTML = '';

  var product = findProduct(productId);
  if (!product || !product.customizations || product.customizations.length === 0) {
    calculateTotal();
    return;
  }

  for (var i = 0; i < product.customizations.length; i++) {
    var cust = product.customizations[i];
    var wrapper = document.createElement('div');

    var label = document.createElement('label');
    label.setAttribute('for', 'cust-' + cust.id);
    label.className = 'block text-sm font-medium text-slate-300 mb-2';
    label.textContent = cust.label;
    wrapper.appendChild(label);

    if (cust.type === 'select') {
      var select = document.createElement('select');
      select.id = 'cust-' + cust.id;
      select.name = cust.id;
      select.className = ORDER_INPUT_CLASSES;
      select.setAttribute('data-customization', cust.id);

      for (var j = 0; j < cust.choices.length; j++) {
        var c = cust.choices[j];
        var opt = document.createElement('option');
        opt.value = c.value;
        opt.textContent = c.label + (c.priceAdjust ? ' (+$' + c.priceAdjust + ')' : '');
        opt.setAttribute('data-price', c.priceAdjust);
        select.appendChild(opt);
      }

      select.addEventListener('change', function () {
        calculateTotal();
      });
      wrapper.appendChild(select);

    } else if (cust.type === 'toggle') {
      // Checkbox toggle
      var checkWrap = document.createElement('div');
      checkWrap.className = 'flex items-center gap-3';

      var checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = 'cust-' + cust.id;
      checkbox.name = cust.id;
      checkbox.className =
        'w-5 h-5 rounded bg-[#1E293B] border border-white/20 text-green-500 ' +
        'cursor-pointer transition-all duration-200 ' +
        'focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-[#0F172A]';
      checkbox.setAttribute('data-customization', cust.id);

      // Store the price adjustment for the "true" choice
      var trueChoice = null;
      for (var k = 0; k < cust.choices.length; k++) {
        if (cust.choices[k].value === true) {
          trueChoice = cust.choices[k];
          break;
        }
      }
      checkbox.setAttribute('data-price', trueChoice ? trueChoice.priceAdjust : 0);

      // Descriptive label text next to checkbox
      var toggleLabel = document.createElement('span');
      toggleLabel.className = 'text-sm text-slate-300';
      toggleLabel.textContent = trueChoice
        ? trueChoice.label + (trueChoice.priceAdjust ? ' (+$' + trueChoice.priceAdjust + ')' : '')
        : cust.label;

      checkbox.addEventListener('change', function () {
        calculateTotal();
      });

      checkWrap.appendChild(checkbox);
      checkWrap.appendChild(toggleLabel);
      wrapper.appendChild(checkWrap);
    }

    container.appendChild(wrapper);
  }

  calculateTotal();
}

/* ------------------------------------------------------------------ */
/*  4. calculateTotal                                                 */
/* ------------------------------------------------------------------ */

/**
 * Calculate the order total from the selected size price plus any
 * customization price adjustments. Displays the result in #order-total.
 * @returns {number} The computed total in NT$
 */
function calculateTotal() {
  var totalEl = document.getElementById('order-total');
  var productId = getSelectedProductId();
  var product = findProduct(productId);
  if (!product || !totalEl) return 0;

  // Base price from selected size
  var sizeSelect = document.getElementById('size');
  var selectedSize = sizeSelect ? sizeSelect.value : '';
  var basePrice = 0;

  for (var i = 0; i < product.sizes.length; i++) {
    if (product.sizes[i].size === selectedSize) {
      basePrice = product.sizes[i].price;
      break;
    }
  }

  // Add customization adjustments
  var adjustments = 0;
  var custInputs = document.querySelectorAll('[data-customization]');

  for (var j = 0; j < custInputs.length; j++) {
    var input = custInputs[j];

    if (input.type === 'checkbox') {
      // Toggle: add price only when checked
      if (input.checked) {
        adjustments += parseInt(input.getAttribute('data-price') || '0', 10);
      }
    } else if (input.tagName === 'SELECT') {
      // Select: read price from the selected option's data attribute
      var selectedOpt = input.options[input.selectedIndex];
      if (selectedOpt) {
        adjustments += parseInt(selectedOpt.getAttribute('data-price') || '0', 10);
      }
    }
  }

  var total = basePrice + adjustments;
  totalEl.textContent = 'NT$ ' + total;
  return total;
}

/* ------------------------------------------------------------------ */
/*  5. submitOrder                                                    */
/* ------------------------------------------------------------------ */

/**
 * Handle form submission: gather values, call createOrder(), and
 * display the result.
 * @param {Event} e - The submit event
 */
async function submitOrder(e) {
  if (e) e.preventDefault();

  var form = document.getElementById('order-form');
  var submitBtn = form ? form.querySelector('button[type="submit"]') : null;
  if (!form || !submitBtn) return;

  // Gather form values
  var tableNo = document.getElementById('table-no').value;
  var productId = document.getElementById('product').value;
  var sizeSelect = document.getElementById('size');
  var selectedSize = sizeSelect ? sizeSelect.value : '';

  // Resolve price from FALLBACK_MENU
  var product = findProduct(productId);
  var price = 0;
  if (product) {
    for (var i = 0; i < product.sizes.length; i++) {
      if (product.sizes[i].size === selectedSize) {
        price = product.sizes[i].price;
        break;
      }
    }
  }

  // Include customization adjustments in the price
  price = calculateTotal();

  // Build request body
  var orderData = {
    tableNo: parseInt(tableNo, 10),
    items: [
      {
        productId: productId,
        size: selectedSize,
        qty: 1,
        price: price,
      },
    ],
  };

  // Loading state
  var originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = '送出中...';
  submitBtn.classList.add('opacity-60');

  try {
    var result = await createOrder(orderData);
    showOrderResult(result, true);
  } catch (err) {
    showOrderResult({ message: err.message || '訂單建立失敗，請稍後再試' }, false);
  } finally {
    // Restore button
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
    submitBtn.classList.remove('opacity-60');
  }
}

/* ------------------------------------------------------------------ */
/*  6. showOrderResult                                                */
/* ------------------------------------------------------------------ */

/**
 * Render a success or failure card inside #order-result.
 * @param {object} result  - Response object (success: has id; failure: has message)
 * @param {boolean} isSuccess
 */
function showOrderResult(result, isSuccess) {
  var container = document.getElementById('order-result');
  if (!container) return;

  container.innerHTML = '';

  var card = document.createElement('div');
  card.setAttribute('role', 'alert');
  card.className =
    'glass-card p-6 flex flex-col items-center gap-4 text-center ' +
    'motion-safe:animate-[fadeIn_300ms_ease-out]';

  if (isSuccess) {
    card.classList.add('border-green-500');

    // Lucide check-circle SVG
    card.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" ' +
      'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" ' +
      'stroke-linejoin="round" class="text-green-500 shrink-0" aria-hidden="true">' +
      '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>' +
      '<polyline points="22 4 12 14.01 9 11.01"></polyline>' +
      '</svg>' +
      '<div>' +
      '<p class="text-lg font-semibold text-green-500 font-[\'JetBrains_Mono\'] mb-1">訂單建立成功</p>' +
      '<p class="text-sm text-slate-300">訂單編號：' +
      '<span class="font-[\'JetBrains_Mono\'] text-[#F8FAFC]">' + (result.id || result.orderId || 'N/A') + '</span>' +
      '</p>' +
      '</div>';
  } else {
    card.classList.add('border-red-500');

    // Lucide alert-circle SVG
    card.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" ' +
      'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" ' +
      'stroke-linejoin="round" class="text-red-400 shrink-0" aria-hidden="true">' +
      '<circle cx="12" cy="12" r="10"></circle>' +
      '<line x1="12" y1="8" x2="12" y2="12"></line>' +
      '<line x1="12" y1="16" x2="12.01" y2="16"></line>' +
      '</svg>' +
      '<div>' +
      '<p class="text-lg font-semibold text-red-400 font-[\'JetBrains_Mono\'] mb-1">訂單建立失敗</p>' +
      '<p class="text-sm text-slate-300 mb-3">' + (result.message || '發生未知錯誤') + '</p>' +
      '</div>' +
      '<button type="button" onclick="submitOrder()" ' +
      'class="px-5 py-2 rounded-lg bg-green-500 text-white text-sm font-semibold ' +
      'cursor-pointer transition-all duration-200 hover:opacity-90 ' +
      'focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-[#0F172A]">' +
      '重新送出' +
      '</button>';
  }

  container.appendChild(card);
}
