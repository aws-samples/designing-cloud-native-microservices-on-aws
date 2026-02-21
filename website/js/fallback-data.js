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
    recipe: Object.freeze({ espressoShots: 2, milkMl: 180, waterMl: 0, foam: 'Regular Foam' }),
    customizations: Object.freeze([
      Object.freeze({
        id: 'foam',
        label: 'Foam Options',
        type: 'select',
        choices: Object.freeze([
          Object.freeze({ value: 'none', label: 'No Foam', priceAdjust: 0 }),
          Object.freeze({ value: 'normal', label: 'Regular Foam', priceAdjust: 0 }),
          Object.freeze({ value: 'extra', label: 'Extra Foam', priceAdjust: 0 }),
        ]),
      }),
      Object.freeze({
        id: 'soy',
        label: 'Soy Milk Substitute',
        type: 'toggle',
        choices: Object.freeze([
          Object.freeze({ value: false, label: 'Fresh Milk', priceAdjust: 0 }),
          Object.freeze({ value: true, label: 'Soy Milk Substitute', priceAdjust: 0 }),
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
    recipe: Object.freeze({ espressoShots: 2, milkMl: 120, waterMl: 0, foam: 'Thick Foam' }),
    customizations: Object.freeze([
      Object.freeze({
        id: 'foamType',
        label: 'Foam Type',
        type: 'select',
        choices: Object.freeze([
          Object.freeze({ value: 'dry', label: 'Dry Foam', priceAdjust: 0 }),
          Object.freeze({ value: 'wet', label: 'Wet Foam', priceAdjust: 0 }),
        ]),
      }),
      Object.freeze({
        id: 'whippedCream',
        label: 'Add Whipped Cream',
        type: 'toggle',
        choices: Object.freeze([
          Object.freeze({ value: false, label: 'None', priceAdjust: 0 }),
          Object.freeze({ value: true, label: 'Add Whipped Cream', priceAdjust: 20 }),
        ]),
      }),
      Object.freeze({
        id: 'soy',
        label: 'Soy Milk Substitute',
        type: 'toggle',
        choices: Object.freeze([
          Object.freeze({ value: false, label: 'Fresh Milk', priceAdjust: 0 }),
          Object.freeze({ value: true, label: 'Soy Milk Substitute', priceAdjust: 0 }),
        ]),
      }),
    ]),
  }),
]);

/**
 * @type {InventoryItem[]}
 */
const FALLBACK_INVENTORY = Object.freeze([
  Object.freeze({ id: 'soymilk', name: 'Soy Milk', unit: 'bottles', current: 20, max: 50, image: 'assets/images/milk.jpg' }),
  Object.freeze({ id: 'milk', name: 'Fresh Milk', unit: 'bottles', current: 50, max: 100, image: 'assets/images/milk.jpg' }),
  Object.freeze({ id: 'beans', name: 'Coffee Beans', unit: 'bags', current: 100, max: 200, image: 'assets/images/coffee-beans.jpg' }),
  Object.freeze({ id: 'filter', name: 'Filter Paper', unit: 'packs', current: 200, max: 500 }),
]);