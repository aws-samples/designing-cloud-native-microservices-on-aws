/**
 * API integration layer for EventStorming Coffeeshop microservices.
 *
 * Depends on:
 *   - config.js    → API_CONFIG
 *   - fallback-data.js → FALLBACK_MENU, FALLBACK_INVENTORY
 *
 * Load order in HTML:
 *   <script src="js/config.js"></script>
 *   <script src="js/fallback-data.js"></script>
 *   <script src="js/api.js"></script>
 */

/**
 * Generic fetch wrapper with timeout and console logging.
 *
 * @param {string} url - Request URL
 * @param {RequestInit} [options={}] - Fetch options
 * @returns {Promise<Response>} The fetch Response object
 * @throws {Error} On timeout ('Request timed out') or network error
 */
async function apiFetch(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), API_CONFIG.timeout);
  const method = (options.method || 'GET').toUpperCase();

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    console.log(`[API] ${method} ${url} → ${response.status}`);
    return response;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log(`[API] ${method} ${url} → TIMEOUT`);
      throw new Error('Request timed out');
    }
    console.log(`[API] ${method} ${url} → ERROR`);
    throw new Error(error.message);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Create a new order via the Orders Service.
 *
 * @param {object} orderData - Order payload
 * @returns {Promise<object>} Parsed JSON response
 * @throws {Error} On any failure with a user-friendly message
 */
async function createOrder(orderData) {
  const url = API_CONFIG.orders.baseUrl + API_CONFIG.orders.endpoints.create;
  const response = await apiFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderData),
  });

  if (!response.ok) {
    throw new Error('Order creation failed, please try again later');
  }

  return response.json();
}

/**
 * Fetch the coffee menu from the Coffee Service.
 * Falls back to FALLBACK_MENU on any failure.
 *
 * @returns {Promise<CoffeeMenuItem[]>} Menu items array
 */
async function fetchCoffeeMenu() {
  try {
    const url = API_CONFIG.coffee.baseUrl + API_CONFIG.coffee.endpoints.list;
    const response = await apiFetch(url);

    if (!response.ok) {
      throw new Error(response.statusText);
    }

    return await response.json();
  } catch {
    console.log('[API] Coffee Service unavailable, using fallback data');
    return FALLBACK_MENU;
  }
}

/**
 * Fetch inventory levels from the Inventory Service.
 * Falls back to FALLBACK_INVENTORY on any failure.
 *
 * @returns {Promise<InventoryItem[]>} Inventory items array
 */
async function fetchInventory() {
  try {
    const url = API_CONFIG.inventory.baseUrl + API_CONFIG.inventory.endpoints.list;
    const response = await apiFetch(url);

    if (!response.ok) {
      throw new Error(response.statusText);
    }

    return await response.json();
  } catch {
    console.log('[API] Inventory Service unavailable, using fallback data');
    return FALLBACK_INVENTORY;
  }
}
