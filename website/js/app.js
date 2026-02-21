/**
 * App Entry Point
 * Initializes all components for the EventStorming Coffeeshop showcase website.
 *
 * Depends on (loaded via script tags before this file):
 *   - config.js
 *   - utils/dom.js
 *   - api.js
 *   - fallback-data.js
 *   - components/navigation.js  → initNavigation()
 *   - components/hero.js        → initHero()
 *   - components/architecture.js → initArchitecture()
 *   - components/order-form.js  → initOrderForm()
 *   - components/menu.js        → loadMenuData()
 *   - components/inventory.js   → loadInventoryData()
 */

/** Global application state */
var state = {
  order: { tableNo: '', productId: '', size: '', customizations: {}, total: 0 },
  menu: [],
  inventory: [],
  loading: { menu: false, inventory: false, order: false },
  errors: { menu: null, inventory: null, order: null }
};

/**
 * Merge data into a top-level section of the global state.
 * @param {string} section - Key in the state object (e.g. 'order', 'menu', 'loading')
 * @param {object|Array} data - Data to merge. Objects are shallow-merged; primitives/arrays replace.
 */
function updateState(section, data) {
  if (!(section in state)) return;

  if (
    data !== null &&
    typeof data === 'object' &&
    !Array.isArray(data) &&
    typeof state[section] === 'object' &&
    !Array.isArray(state[section])
  ) {
    Object.assign(state[section], data);
  } else {
    state[section] = data;
  }
}

/**
 * Bootstrap all components once the DOM is ready.
 */
document.addEventListener('DOMContentLoaded', function () {
  console.log('[App] EventStorming Coffeeshop initialized');

  // Synchronous components — order matters
  initNavigation();

  if (typeof initHero === 'function') {
    initHero();
  }

  if (typeof initArchitecture === 'function') {
    initArchitecture();
  }

  initOrderForm();

  // Async data loaders — independent, so failures are isolated
  loadMenuDataSafe();
  loadInventoryDataSafe();
});

/**
 * Load menu data with error isolation.
 */
async function loadMenuDataSafe() {
  try {
    updateState('loading', { menu: true });
    updateState('errors', { menu: null });
    await loadMenuData();
  } catch (err) {
    console.error('[App] Failed to load menu:', err);
    updateState('errors', { menu: err.message || 'Menu load failed' });
  } finally {
    updateState('loading', { menu: false });
  }
}

/**
 * Load inventory data with error isolation.
 */
async function loadInventoryDataSafe() {
  try {
    updateState('loading', { inventory: true });
    updateState('errors', { inventory: null });
    await loadInventoryData();
  } catch (err) {
    console.error('[App] Failed to load inventory:', err);
    updateState('errors', { inventory: err.message || 'Inventory load failed' });
  } finally {
    updateState('loading', { inventory: false });
  }
}
