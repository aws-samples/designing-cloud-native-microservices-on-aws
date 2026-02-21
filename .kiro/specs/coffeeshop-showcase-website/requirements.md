# Requirements Document

## Introduction

This project aims to build a showcase website to present the functionality and architecture of the EventStorming Coffeeshop DDD microservices project. The website integrates with actual Java Spring Boot backend microservices covering three Bounded Contexts (Orders, Coffee, Inventory), allowing users to experience the complete coffee shop business flow through an interactive interface while learning DDD and Event Storming design concepts.

The tech stack is HTML + Tailwind CSS, following the defined design system (dark theme, JetBrains Mono + IBM Plex Sans fonts, Vibrant & Block-based style).

## Glossary

- **Showcase_Website**: A showcase frontend application for presenting the EventStorming Coffeeshop project features
- **Orders_Service**: Order microservice responsible for order creation, status tracking, and table management via backend API (endpoint: `/order`)
- **Coffee_Service**: Coffee microservice responsible for coffee preparation, recipes, and menu items via backend API (endpoint: `/coffee`)
- **Inventory_Service**: Inventory microservice responsible for raw material inventory management and restocking via backend API (endpoint: `/inventory`)
- **Bounded_Context**: A bounded context in DDD that defines the boundary of a specific domain model
- **Design_System**: Design system defined in `.kiro/design-system/eventstorming-coffeeshop/MASTER.md`
- **Navigation_Bar**: Fixed navigation component at the top of the website
- **Hero_Section**: Main visual section on the homepage with project title and core description
- **Architecture_Diagram**: Visual representation of the relationships between three Bounded Contexts
- **Order_Form**: Order form for users to select coffee items, sizes, customizations, and submit orders
- **Menu_Card**: Menu card displaying a single coffee item's name, size options, and prices
- **Inventory_Dashboard**: Inventory dashboard showing real-time stock status of each raw material
- **Stock_Indicator**: Visual indicator showing the stock percentage of a single raw material
- **Loading_Skeleton**: Placeholder component displayed during data loading
- **Error_Message**: User-friendly message displayed when API calls fail
- **Coffeeshop_UI_Builder**: Dedicated custom sub agent responsible for implementing UI pages and components according to the design system

## Requirements

### Requirement 1: Website Navigation and Overall Layout

**User Story:** As a visitor, I want the website to have a clear navigation structure so I can quickly find each feature showcase section.

#### Acceptance Criteria

1. THE Showcase_Website SHALL display a fixed Navigation_Bar at the top of the page containing the project name "EventStorming Coffeeshop" and anchor links to each section (Home, Architecture, Order, Menu, Inventory)
2. THE Showcase_Website SHALL use the Design_System defined dark background color (#0F172A) as the main page background
3. THE Showcase_Website SHALL use JetBrains Mono as the heading font and IBM Plex Sans as the body font
4. THE Showcase_Website SHALL provide cursor-pointer and 150-300ms transition animations on all clickable elements
5. THE Showcase_Website SHALL render responsive layouts correctly at 375px, 768px, 1024px, and 1440px breakpoints
6. THE Showcase_Website SHALL ensure main content areas are not obscured by the fixed Navigation_Bar
7. THE Showcase_Website SHALL use a consistent max-width container (max-w-7xl) to wrap all section content

### Requirement 2: Homepage Hero Section and Project Introduction

**User Story:** As a visitor, I want the homepage to clearly convey that this is a DDD microservices tutorial project so I can understand the project's purpose and value.

#### Acceptance Criteria

1. THE Hero_Section SHALL display the project title "EventStorming Coffeeshop" with a font size of 32px or larger
2. THE Hero_Section SHALL display a subtitle explaining this is a cloud-native microservices showcase for DDD and Event Storming workshops
3. THE Hero_Section SHALL include a primary CTA button using the Design_System defined green (#22C55E), directing users to the order showcase section
4. THE Hero_Section SHALL use glassmorphism-style card components to present summary information for three Bounded_Contexts (Orders, Coffee, Inventory)
5. THE Hero_Section SHALL display the core responsibilities description for each Bounded_Context summary card

### Requirement 3: DDD Architecture Showcase Section

**User Story:** As a learner, I want to see the project's DDD architecture diagram so I can understand the relationships and responsibility divisions between Bounded Contexts.

#### Acceptance Criteria

1. THE Architecture_Diagram SHALL visually present three Bounded_Contexts (Orders, Coffee, Inventory) and their interactions
2. THE Architecture_Diagram SHALL label each Bounded_Context with its core aggregate root (Order, Coffee, Inventory) and main domain events (OrderCreated, OrderStatusChanged, CoffeeStatus)
3. THE Architecture_Diagram SHALL use Design_System defined colors to distinguish different Bounded_Context blocks
4. THE Showcase_Website SHALL provide detailed description cards below the architecture diagram for each Bounded_Context, including API endpoint information
5. WHEN a user hovers over a Bounded_Context block, THE Architecture_Diagram SHALL highlight that block with a color change

### Requirement 4: Interactive Order Showcase

**User Story:** As a visitor, I want to experience the coffee shop ordering process through an interactive form so I can understand how the Orders Bounded Context actually works.

#### Acceptance Criteria

1. THE Order_Form SHALL provide table number selection with a range of 1 to 5
2. THE Order_Form SHALL display four coffee items for selection: Espresso, Caffe Americano, Caffe Latte, Cappuccino
3. WHEN the user selects Espresso, THE Order_Form SHALL only display Single ($60) and Double ($80) size options
4. WHEN the user selects Caffe Americano, Caffe Latte, or Cappuccino, THE Order_Form SHALL display Short, Tall, Grande, and Venti size options with corresponding prices
5. WHEN the user selects Caffe Latte, THE Order_Form SHALL display foam customization options (no foam, regular foam, extra foam) and soy milk substitute option
6. WHEN the user selects Cappuccino, THE Order_Form SHALL display Dry and Wet foam options, whipped cream add-on (+$20), and soy milk substitute option
7. THE Order_Form SHALL calculate and display the order total in real-time
8. WHEN the user submits an order, THE Showcase_Website SHALL send the order data via POST request to the Orders_Service `/order` endpoint
9. WHEN Orders_Service returns HTTP 201 status code, THE Showcase_Website SHALL display an order creation success confirmation message with the order number
10. IF Orders_Service returns an error response, THEN THE Showcase_Website SHALL display a user-friendly Error_Message explaining the reason for order creation failure

### Requirement 5: Coffee Menu Showcase

**User Story:** As a visitor, I want to browse the complete coffee menu so I can understand the items and recipe information managed by the Coffee Bounded Context.

#### Acceptance Criteria

1. THE Showcase_Website SHALL display all coffee items (Espresso, Caffe Americano, Caffe Latte, Cappuccino) in Menu_Card format
2. THE Menu_Card SHALL display the coffee item name, volume (ml) and price for each size
3. THE Menu_Card SHALL display recipe information for each coffee, including espresso shot count, milk volume, and water volume
4. WHEN the user clicks a Menu_Card, THE Showcase_Website SHALL expand to show the item's complete recipe details and customization options
5. THE Showcase_Website SHALL retrieve coffee item data via GET request from the Coffee_Service `/coffee` endpoint
6. WHILE coffee item data is loading, THE Showcase_Website SHALL display Loading_Skeleton placeholder components
7. IF Coffee_Service is unreachable, THEN THE Showcase_Website SHALL display default static menu data as a fallback

### Requirement 6: Inventory Status Dashboard

**User Story:** As a visitor, I want to view the coffee shop's real-time inventory status so I can understand the inventory management mechanism of the Inventory Bounded Context.

#### Acceptance Criteria

1. THE Inventory_Dashboard SHALL display stock status for four raw materials: Soy Milk (20 bottles), Milk (50 bottles), Coffee Beans (100 bags), Filter Paper (200 packs)
2. THE Stock_Indicator SHALL visually represent each raw material's stock percentage using a progress bar
3. WHEN a raw material's stock falls below 30%, THE Stock_Indicator SHALL change the progress bar color to a warning color (red or orange)
4. THE Showcase_Website SHALL retrieve inventory data via GET request from the Inventory_Service `/inventory` endpoint
5. WHILE inventory data is loading, THE Showcase_Website SHALL display Loading_Skeleton placeholder components
6. IF Inventory_Service is unreachable, THEN THE Showcase_Website SHALL display default static inventory data as a fallback
7. THE Inventory_Dashboard SHALL display each raw material's maximum capacity and current quantity

### Requirement 7: API Connection Configuration and Error Handling

**User Story:** As a developer, I want the website to flexibly configure backend API connection addresses so I can deploy and test in different environments.

#### Acceptance Criteria

1. THE Showcase_Website SHALL support configuring API base URLs for three microservices (Orders_Service, Coffee_Service, Inventory_Service) via a JavaScript configuration file
2. WHILE any API request is in progress, THE Showcase_Website SHALL display a loading state indicator in the corresponding UI section
3. IF any API request times out beyond 10 seconds, THEN THE Showcase_Website SHALL abort the request and display a timeout Error_Message
4. IF any API request fails, THEN THE Showcase_Website SHALL display a retry button in the corresponding section for the user to manually resend the request
5. THE Showcase_Website SHALL log summary information of all API requests and responses in the browser developer tools console for debugging

### Requirement 8: Accessibility and Performance

**User Story:** As a visitor, I want the website to have good accessibility support and loading performance so all users can browse the website smoothly.

#### Acceptance Criteria

1. THE Showcase_Website SHALL ensure all text and background color contrast ratios meet 4.5:1 or above
2. THE Showcase_Website SHALL provide alt text for all images
3. THE Showcase_Website SHALL provide associated label tags for all form input elements
4. THE Showcase_Website SHALL provide visible keyboard focus states
5. THE Showcase_Website SHALL respect the user's prefers-reduced-motion preference in animation effects
6. THE Showcase_Website SHALL use semantic HTML tags (header, main, nav, section, article, footer) to structure the page
7. THE Showcase_Website SHALL only use SVG icons (Lucide or Heroicons); emoji usage as interface icons is prohibited
