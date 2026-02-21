/**
 * DOM Utility Functions
 * Provides skeleton loaders, error states, and cleanup helpers
 * for the EventStorming Coffeeshop showcase website.
 *
 * Design system: bg-[#0F172A] background, bg-[#334155] skeleton bars,
 * text-red-400 errors, bg-green-500 (#22C55E) CTA buttons,
 * font-family: IBM Plex Sans for body text.
 */

/**
 * Shows a skeleton loading placeholder inside the given container.
 * Creates 3 animated pulse bars styled with design system colors.
 * @param {string} containerId - The id of the container element.
 */
function showSkeleton(containerId) {
  var container = document.getElementById(containerId);
  if (!container) return;

  var skeleton = document.createElement('div');
  skeleton.setAttribute('data-skeleton', 'true');
  skeleton.setAttribute('role', 'status');
  skeleton.setAttribute('aria-label', 'Loading content');
  skeleton.className = 'flex flex-col gap-4 p-6 rounded-xl bg-[#0F172A]';

  var widths = ['w-full', 'w-3/4', 'w-1/2'];

  for (var i = 0; i < 3; i++) {
    var bar = document.createElement('div');
    bar.className =
      'h-4 rounded bg-[#334155] motion-safe:animate-pulse ' + widths[i];
    bar.setAttribute('aria-hidden', 'true');
    skeleton.appendChild(bar);
  }

  var srText = document.createElement('span');
  srText.className = 'sr-only';
  srText.textContent = 'Loading…';
  skeleton.appendChild(srText);

  container.appendChild(skeleton);
}

/**
 * Removes skeleton loading placeholders from the given container.
 * @param {string} containerId - The id of the container element.
 */
function hideSkeleton(containerId) {
  var container = document.getElementById(containerId);
  if (!container) return;

  var skeletons = container.querySelectorAll('[data-skeleton="true"]');
  for (var i = 0; i < skeletons.length; i++) {
    skeletons[i].remove();
  }
}


/**
 * Shows an error message with a retry button inside the given container.
 * Uses a Lucide-style alert-circle SVG icon.
 * @param {string} containerId - The id of the container element.
 * @param {string} message - The error message to display.
 * @param {Function} retryFn - Callback invoked when the retry button is clicked.
 */
function showError(containerId, message, retryFn) {
  var container = document.getElementById(containerId);
  if (!container) return;

  var wrapper = document.createElement('div');
  wrapper.setAttribute('data-error', 'true');
  wrapper.setAttribute('role', 'alert');
  wrapper.className =
    "flex flex-col items-center gap-4 p-6 rounded-xl bg-[#0F172A] font-['IBM_Plex_Sans']";

  // Lucide-style alert-circle SVG icon
  var iconSvg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" ' +
    'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" ' +
    'stroke-linejoin="round" class="text-red-400 shrink-0" aria-hidden="true">' +
    '<circle cx="12" cy="12" r="10"></circle>' +
    '<line x1="12" y1="8" x2="12" y2="12"></line>' +
    '<line x1="12" y1="16" x2="12.01" y2="16"></line>' +
    '</svg>';

  var iconContainer = document.createElement('div');
  iconContainer.innerHTML = iconSvg;

  var msgEl = document.createElement('p');
  msgEl.className = 'text-red-400 text-sm text-center';
  msgEl.textContent = message;

  wrapper.appendChild(iconContainer);
  wrapper.appendChild(msgEl);

  if (typeof retryFn === 'function') {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className =
      'px-5 py-2 rounded-lg bg-green-500 text-white text-sm font-semibold ' +
      'cursor-pointer transition-all duration-200 ' +
      'hover:opacity-90 ' +
      'focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-[#0F172A]';
    btn.textContent = 'Retry';
    btn.addEventListener('click', retryFn);
    wrapper.appendChild(btn);
  }

  container.appendChild(wrapper);
}

/**
 * Removes error messages from the given container.
 * @param {string} containerId - The id of the container element.
 */
function hideError(containerId) {
  var container = document.getElementById(containerId);
  if (!container) return;

  var errors = container.querySelectorAll('[data-error="true"]');
  for (var i = 0; i < errors.length; i++) {
    errors[i].remove();
  }
}