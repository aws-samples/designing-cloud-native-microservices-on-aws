/**
 * Static fallback data for when backend APIs are unavailable.
 *
 * Used by api.js as a graceful degradation strategy — GET requests
 * that fail automatically fall back to these constants so the UI
 * can still render meaningful content while offline.
 *
 * Data structures match the design document's CoffeeMenuItem and
 * InventoryItem typedefs exactly.
 */

/**
 * @type {CoffeeMenuItem[]}
 */
const FALLBACK_MENU = Object.freeze([
  Object.freeze({
    id: 'espresso',
    name: 'Espresso',
    image: 'assets/images/espresso.jpg',
    sizes: Object.freeze([
      Object.freeze({ size: 'Single', ml: 30, price: 60 }),
      Object.freeze({ size: 'Double', ml: 60, price: 80 }),
    ]),
    recipe: Object.freeze({ espressoShots: 1, milkMl: 0, waterMl: 0 }),
    customizations: Object.freeze([]),
  }),
  Object.freeze({
    id: 'americano',
    name: 'Caffe Americano',
    image: 'assets/images/americano.jpg',
    sizes: Object.freeze([
      Object.freeze({ size: 'Short', ml: 240, price: 80 }),
      Object.freeze({ size: 'Tall', ml: 360, price: 100 }),
      Object.freeze({ size: 'Grande', ml: 480, price: 120 }),
      Object.freeze({ size: 'Venti', ml: 600, price: 140 }),
    ]),
    recipe: Object.freeze({ espressoShots: 2, milkMl: 0, waterMl: 200 }),
    customizations: Object.freeze([]),
  }),
  Object.freeze({
    id: 'latte',
    name: 'Caffe Latte',
    image: 'assets/images/latte.jpg',
    sizes: Object.freeze([
      Object.freeze({ size: 'Short', ml: 240, price: 100 }),
      Object.freeze({ size: 'Tall', ml: 360, price: 120 }),
      Object.freeze({ size: 'Grande', ml: 480, price: 140 }),
      Object.freeze({ size: 'Venti', ml: 600, price: 160 }),
    ]),
    recipe: Object.freeze({ espressoShots: 2, milkMl: 180, waterMl: 0, foam: '一般奶泡' }),
    customizations: Object.freeze([
      Object.freeze({
        id: 'foam',
        label: '奶泡選項',
        type: 'select',
        choices: Object.freeze([
          Object.freeze({ value: 'none', label: '無奶泡', priceAdjust: 0 }),
          Object.freeze({ value: 'normal', label: '一般奶泡', priceAdjust: 0 }),
          Object.freeze({ value: 'extra', label: '多奶泡', priceAdjust: 0 }),
        ]),
      }),
      Object.freeze({
        id: 'soy',
        label: '豆漿替代',
        type: 'toggle',
        choices: Object.freeze([
          Object.freeze({ value: false, label: '鮮奶', priceAdjust: 0 }),
          Object.freeze({ value: true, label: '豆漿替代', priceAdjust: 0 }),
        ]),
      }),
    ]),
  }),
  Object.freeze({
    id: 'cappuccino',
    name: 'Cappuccino',
    image: 'assets/images/cappuccino.jpg',
    sizes: Object.freeze([
      Object.freeze({ size: 'Short', ml: 240, price: 100 }),
      Object.freeze({ size: 'Tall', ml: 360, price: 120 }),
      Object.freeze({ size: 'Grande', ml: 480, price: 140 }),
      Object.freeze({ size: 'Venti', ml: 600, price: 160 }),
    ]),
    recipe: Object.freeze({ espressoShots: 2, milkMl: 120, waterMl: 0, foam: '厚奶泡' }),
    customizations: Object.freeze([
      Object.freeze({
        id: 'foamType',
        label: '奶泡類型',
        type: 'select',
        choices: Object.freeze([
          Object.freeze({ value: 'dry', label: '乾式奶泡（Dry）', priceAdjust: 0 }),
          Object.freeze({ value: 'wet', label: '濕式奶泡（Wet）', priceAdjust: 0 }),
        ]),
      }),
      Object.freeze({
        id: 'whippedCream',
        label: '鮮奶油加購',
        type: 'toggle',
        choices: Object.freeze([
          Object.freeze({ value: false, label: '不加', priceAdjust: 0 }),
          Object.freeze({ value: true, label: '加鮮奶油', priceAdjust: 20 }),
        ]),
      }),
      Object.freeze({
        id: 'soy',
        label: '豆漿替代',
        type: 'toggle',
        choices: Object.freeze([
          Object.freeze({ value: false, label: '鮮奶', priceAdjust: 0 }),
          Object.freeze({ value: true, label: '豆漿替代', priceAdjust: 0 }),
        ]),
      }),
    ]),
  }),
]);

/**
 * @type {InventoryItem[]}
 */
const FALLBACK_INVENTORY = Object.freeze([
  Object.freeze({ id: 'soymilk', name: '豆漿', unit: '瓶', current: 20, max: 50, image: 'assets/images/milk.jpg' }),
  Object.freeze({ id: 'milk', name: '鮮奶', unit: '瓶', current: 50, max: 100, image: 'assets/images/milk.jpg' }),
  Object.freeze({ id: 'beans', name: '咖啡豆', unit: '袋', current: 100, max: 200, image: 'assets/images/coffee-beans.jpg' }),
  Object.freeze({ id: 'filter', name: '濾紙', unit: '包', current: 200, max: 500 }),
]);