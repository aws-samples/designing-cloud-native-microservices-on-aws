# Implementation Plan: EventStorming Coffeeshop Showcase Website

## Overview

Build the showcase website incrementally based on the design document's file structure and component decomposition. Start from the foundation (config files, utility functions, API layer), progressively implement each UI component, then integrate and verify. Tech stack: HTML + Tailwind CSS CDN + Vanilla JS, testing with Vitest + fast-check.

## Tasks

- [x] 1. Set up project foundation and configuration files
  - [x] 1.1 Create `website/js/config.js` defining API base URLs for three microservices (Orders: 8081, Coffee: 8082, Inventory: 8083) with 10-second timeout
    - Export `API_CONFIG` object containing `orders`, `coffee`, `inventory` service `baseUrl` and `endpoints`
    - _Requirement: 7.1_
  - [x] 1.2 Create `website/js/fallback-data.js` defining fallback static data
    - Include `FALLBACK_MENU` (4 coffee items with sizes, recipes, customization options) and `FALLBACK_INVENTORY` (4 raw materials with current quantity and max capacity)
    - Data structure must fully match the design document's data model definitions
    - _Requirement: 5.7, 6.6_
  - [x] 1.3 Create `website/js/utils/dom.js` implementing DOM utility functions
    - Implement `showSkeleton(containerId)`, `hideSkeleton(containerId)`, `showError(containerId, message, retryFn)`, `hideError(containerId)`
    - Skeleton loading uses Tailwind's `animate-pulse` effect
    - Error messages include retry button with `cursor-pointer` style
    - _Requirement: 7.2, 7.4_
  - [x] 1.4 Create `website/js/api.js` implementing API integration layer
    - Implement `apiFetch(url, options)` with AbortController 10-second timeout, console logging (URL, method, status code)
    - Implement `createOrder(orderData)`, `fetchCoffeeMenu()`, `fetchInventory()` API functions
    - GET requests automatically use fallback data on failure, POST requests throw errors on failure
    - _Requirement: 4.8, 5.5, 6.4, 7.3, 7.5_

- [x] 2. Build main page HTML structure and styles
  - [x] 2.1 Create `website/css/custom.css` defining CSS variables and custom styles
    - Define design system color variables (main background #0F172A, green CTA #22C55E, etc.)
    - Define glassmorphism card styles (`backdrop-filter: blur`, semi-transparent background)
    - Define `prefers-reduced-motion` media query to disable animations
    - Load JetBrains Mono (headings) and IBM Plex Sans (body) Google Fonts
    - _Requirement: 1.2, 1.3, 2.4, 8.5_
  - [x] 2.2 Create `website/index.html` using semantic HTML to build complete page structure
    - Use `<header>`, `<nav>`, `<main>`, `<section>`, `<footer>` semantic tags
    - Include Tailwind CSS CDN, custom.css, all JS modules
    - Each section uses `max-w-7xl` container, main background color `#0F172A`
    - Contains 7 sections: Navigation, Hero, Architecture, Order Form, Menu, Inventory, Footer
    - All `<img>` tags include non-empty `alt` attributes
    - All form `<input>`/`<select>` elements have associated `<label>` (for/id pairing)
    - All clickable elements have `cursor-pointer` and `transition duration-200` classes
    - Responsive layout: 375px single column, 768px two columns, 1024px three columns, 1440px max-w-7xl centered
    - Main content areas include `pt` padding to avoid being obscured by fixed Navigation_Bar
    - Only use Lucide Icons inline SVG as icons, no emoji
    - _Requirement: 1.1, 1.2, 1.4, 1.5, 1.6, 1.7, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 5.1, 6.1, 8.1, 8.2, 8.3, 8.4, 8.6, 8.7_

- [x] 3. Implement navigation bar and Hero section components
  - [x] 3.1 Create `website/js/components/navigation.js` implementing navigation bar interactions
    - Implement `initNavigation()`: bind anchor link smooth scrolling
    - Implement `updateActiveSection()`: highlight current section's nav item on scroll
    - Implement `toggleMobileMenu()`: mobile hamburger menu toggle
    - Navigation bar fixed at top, containing "EventStorming Coffeeshop" name and 5 anchors (Home, Architecture, Order, Menu, Inventory)
    - _Requirement: 1.1, 1.6_
  - [x] 3.2 Create `website/js/components/hero.js` implementing Hero section
    - Title "EventStorming Coffeeshop" with font size >= 32px
    - Subtitle describing the cloud-native microservices showcase for DDD and Event Storming workshops
    - Green CTA button (#22C55E) linking to order section
    - 3 glassmorphism-style Bounded Context summary cards (Orders, Coffee, Inventory), each with core responsibility descriptions
    - _Requirement: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 4. Checkpoint - Foundation verification
  - Confirm all foundation files are created, page loads correctly and displays navigation bar and Hero section. Ensure all tests pass; ask user if issues arise.

- [x] 5. Implement architecture diagram and order form components
  - [x] 5.1 Create `website/js/components/architecture.js` implementing DDD architecture diagram interactions
    - Visually present Orders, Coffee, Inventory three Bounded Contexts and their interactions
    - Each BC labels its core aggregate root (Order, Coffee, Inventory) and main domain events (OrderCreated, OrderStatusChanged, CoffeeStatus)
    - Use design system colors to distinguish different BC blocks
    - Highlight BC block with color change on hover
    - Provide detailed description cards below for each BC with API endpoint information
    - _Requirement: 3.1, 3.2, 3.3, 3.4, 3.5_
  - [x] 5.2 Create `website/js/components/order-form.js` implementing order form logic
    - Implement `initOrderForm()`: initialize form event bindings
    - Implement `updateSizeOptions(productId)`: Espresso shows Single($60)/Double($80), others show Short/Tall/Grande/Venti
    - Implement `updateCustomizations(productId)`: Latte shows foam and soy milk options, Cappuccino shows dry/wet foam, whipped cream(+$20), soy milk options
    - Implement `calculateTotal()`: base price + customization price adjustments
    - Implement `submitOrder()`: POST to Orders Service `/order`, show order number on success, show error message on failure
    - Table number selection from 1-5
    - _Requirement: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 4.10_
  - [ ]* 5.3 Write order form property tests `website/tests/property/order-calc.property.js`
    - **Property 3: Non-Espresso items display four standard sizes**
    - **Validates: Requirement 4.4**
  - [ ]* 5.4 Write order form property tests `website/tests/property/order-calc.property.js`
    - **Property 4: Order total calculation is correct**
    - **Validates: Requirement 4.7**
  - [ ]* 5.5 Write order form property tests `website/tests/property/order-calc.property.js`
    - **Property 5: Order submission request format is correct**
    - **Validates: Requirement 4.8**

- [x] 6. Implement menu and inventory components
  - [x] 6.1 Create `website/js/components/menu.js` implementing menu cards
    - Implement `loadMenuData()`: GET from Coffee Service `/coffee`, use fallback on failure
    - Implement `renderMenuCards(items)`: render 4 coffee Menu_Cards showing name, size volumes(ml) and prices, recipe info
    - Implement `toggleCardDetail(cardElement)`: click to expand/collapse full recipe details and customization options
    - Show Loading_Skeleton during loading
    - _Requirement: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_
  - [x] 6.2 Create `website/js/components/inventory.js` implementing inventory dashboard
    - Implement `loadInventoryData()`: GET from Inventory Service `/inventory`, use fallback on failure
    - Implement `renderInventoryDashboard(items)`: render 4 raw material inventory cards showing name, current quantity, max capacity
    - Implement `updateStockIndicator(element, percentage)`: progress bar width = `(current/max)*100%`, use warning color (red/orange) below 30%
    - Show Loading_Skeleton during loading
    - _Requirement: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_
  - [ ]* 6.3 Write menu property tests `website/tests/property/menu-render.property.js`
    - **Property 7: Menu cards display complete information**
    - **Validates: Requirement 5.2, 5.3**
  - [ ]* 6.4 Write menu property tests `website/tests/property/menu-render.property.js`
    - **Property 8: Menu card expand/collapse toggle**
    - **Validates: Requirement 5.4**
  - [ ]* 6.5 Write inventory property tests `website/tests/property/inventory.property.js`
    - **Property 10: Inventory dashboard displays complete info with correct percentages**
    - **Validates: Requirement 6.2, 6.7**
  - [ ]* 6.6 Write inventory property tests `website/tests/property/inventory.property.js`
    - **Property 11: Low stock warning color**
    - **Validates: Requirement 6.3**

- [x] 7. Checkpoint - Component functionality verification
  - Confirm all components render and interact correctly (architecture diagram hover, order form selection and calculation, menu expand/collapse, inventory progress bars). Ensure all tests pass; ask user if issues arise.

- [ ] 8. Implement API integration layer tests and error handling verification
  - [ ]* 8.1 Write API layer property tests `website/tests/property/api-layer.property.js`
    - **Property 6: API errors display error message and retry button**
    - **Validates: Requirement 4.10, 7.4**
  - [ ]* 8.2 Write API layer property tests `website/tests/property/api-layer.property.js`
    - **Property 9: API failure uses fallback data**
    - **Validates: Requirement 5.7, 6.6**
  - [ ]* 8.3 Write API layer property tests `website/tests/property/api-layer.property.js`
    - **Property 12: API request timeout handling**
    - **Validates: Requirement 7.3**
  - [ ]* 8.4 Write API layer property tests `website/tests/property/api-layer.property.js`
    - **Property 13: API loading state indicator**
    - **Validates: Requirement 7.2**
  - [ ]* 8.5 Write API layer property tests `website/tests/property/api-layer.property.js`
    - **Property 14: API request logging**
    - **Validates: Requirement 7.5**

- [x] 9. Integration and main program initialization
  - [x] 9.1 Create `website/js/app.js` implementing main program entry point
    - Define global `state` object (order, menu, inventory, loading, errors)
    - Implement `updateState(section, data)` state update function
    - Initialize all components in `DOMContentLoaded` event: `initNavigation()`, `initOrderForm()`, `loadMenuData()`, `loadInventoryData()`
    - Wire up component event handling and state synchronization
    - _Requirement: 1.1, 4.1, 5.5, 6.4_
  - [x] 9.2 Integrate all JS modules into `index.html`
    - Confirm script loading order: config -> fallback-data -> dom -> api -> components -> app
    - Confirm all components initialize correctly and are interactive
    - Verify API connectivity (use live data on success, fall back to static data on failure)
    - _Requirement: 7.1, 7.2_

- [ ] 10. Accessibility and UI quality property tests
  - [ ]* 10.1 Write accessibility property tests `website/tests/property/a11y.property.js`
    - **Property 1: Clickable elements have interactive feedback**
    - **Validates: Requirement 1.4**
  - [ ]* 10.2 Write accessibility property tests `website/tests/property/a11y.property.js`
    - **Property 2: All sections use consistent max-width container**
    - **Validates: Requirement 1.7**
  - [ ]* 10.3 Write accessibility property tests `website/tests/property/a11y.property.js`
    - **Property 15: All images have alt text**
    - **Validates: Requirement 8.2**
  - [ ]* 10.4 Write accessibility property tests `website/tests/property/a11y.property.js`
    - **Property 16: All form inputs have associated labels**
    - **Validates: Requirement 8.3**
  - [ ]* 10.5 Write accessibility property tests `website/tests/property/a11y.property.js`
    - **Property 17: No emoji used as icons**
    - **Validates: Requirement 8.7**

- [x] 11. Final checkpoint - Comprehensive verification
  - Ensure all tests pass, all components work correctly, API integration and fallback mechanisms execute properly. Ask user if issues arise.

## Notes

- Tasks marked with `*` are optional and can be skipped to accelerate MVP development
- Each task is annotated with corresponding requirement numbers for traceability
- Checkpoints ensure incremental verification to catch issues early
- Property tests verify general correctness properties (Property 1-17), unit tests verify specific examples and edge cases
- Refer to the design system `.kiro/design-system/eventstorming-coffeeshop/MASTER.md` for visual specifications during implementation
- UI implementation can use the custom sub agent `coffeeshop-ui-builder` (defined in `.kiro/agents/coffeeshop-ui-builder.md`)
