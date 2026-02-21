# Coffeeshop Business Requirements

## Inside the Coffee Shop

1. Customers walk into the shop, can see the menu on the wall and find a seat first
2. The waiter takes coffee orders at the table and marks the table number
3. The shop has a total of 5 tables, accommodating up to 10 customers
4. Tables are numbered from 1 to 5
5. After ordering, the customer pays; currently only cash payment is supported
6. Customers wait at their seats for the barista to prepare and serve the coffee
7. When a customer orders coffee in-store, the coffee temperature should be maintained at 70 degrees when served to the table for comfortable drinking. For takeout orders, the temperature should be raised to 90 degrees during packaging. The optimal brewing temperature is approximately 88-98 degrees
8. The shop primarily offers Single Espresso, Caffe Americano, Caffe Latte, and Cappuccino
9. Each drink comes in Short (8 oz/240ml), Tall (12 oz/360ml), Grande (16 oz/480ml), and Venti (20 oz/600ml) sizes. Espresso is the exception, offering only Single (1 oz/30ml) and Double (2 oz/60ml)
10. Espresso prices by size: Single $60; Double $80
11. Caffe Americano prices by size: Short $80; Tall $100; Grande $120; Venti $140. Each size upgrade costs an additional $20
12. Caffe Latte prices by size: Short $100; Tall $120; Grande $140; Venti $160. Each size upgrade costs an additional $20
13. Cappuccino prices by size: Short $100; Tall $120; Grande $140; Venti $160. Each size upgrade costs an additional $20
14. After the customer places an order, the counter receives the order, completes order confirmation and payment, then submits the order to the barista for preparation
15. The barista retrieves the required ingredients from the inventory warehouse based on the order contents

## Raw Material Procurement

1. When purchasing milk, options include Low-fat Milk or Soy Milk
2. Current warehouse capacity: 20 bottles of 2L soy milk, 50 bottles of 2L milk, 100 bags of 1kg Sumatra coffee beans, and 200 packs of filters (100 sheets per pack)
3. When any raw material inventory falls below 30%, the barista and counter staff must be notified for restocking via SMS or email. The counter staff is responsible for purchasing
4. Purchased raw materials are inspected by the barista for item condition and quantity before being stocked
5. A visual dashboard is desired to show material usage status, monthly bestsellers, and weekly bestsellers
6. Each restocking replenishes the material to 100% and must be delivered within 3 days

## Customization Experience Requirements

1. For Latte, customers can choose no foam, regular foam, or extra foam
2. For Cappuccino, customers can choose Dry (less milk) or Wet (more milk) [ref](https://stories.starbucks.com/stories/2016/wet-vs-dry-cappuccino/)
3. Customers can add Whipped Cream to Cappuccino for an additional $20
4. When ordering Latte or Cappuccino, customers can substitute soy milk for regular milk

## Coffee Preparation

1. All freshly brewed coffee uses Italian-style preparation; each espresso portion is called a Shot
2. Each espresso shot uses 20g of coffee beans to extract 30ml of coffee
3. A standard Dry Cappuccino has a steamed milk to foam ratio of 1:2
4. A standard Wet Cappuccino has a steamed milk to foam ratio of 2:1
5. The longer you steam milk with the steam wand, the more foam you get [ref](https://www.youtube.com/watch?v=Q45zCLnLyuE)
6. Detailed items and preparation methods:

| Item/Size                  | Volume | Price | Preparation                                               |
| -------------------------- | ------ | ----- | --------------------------------------------------------- |
| Espresso / Single          | 30ml   | 60    | 1 shot (30ml)                                             |
| Espresso / Double          | 60ml   | 80    | 2 shot (60ml)                                             |
| Caffe Americano / Short    | 240ml  | 80    | 1 shot (30ml) + 210ml water                               |
| Caffe Americano / Tall     | 360ml  | 100   | 1 shot (30ml) + 330ml water                               |
| Caffe Americano / Grande   | 480ml  | 120   | 2 shot (60ml) + 420ml water                               |
| Caffe Americano / Venti    | 600ml  | 140   | 2 shot (60ml) + 540ml water                               |
| Caffe Latte / Short        | 240ml  | 100   | 1 shot (30ml) + 210ml milk (with a little foam about 2ml) |
| Caffe Latte / Tall         | 360ml  | 120   | 1 shot (30ml) + 330ml milk (with a little foam about 2ml) |
| Caffe Latte / Grande       | 480ml  | 140   | 2 shot (60ml) + 420ml milk (with a little foam about 3ml) |
| Caffe Latte / Venti        | 600ml  | 160   | 2 shot (60ml) + 540ml milk (with a little foam about 4ml) |
| Dry Cappuccino / Short     | 240ml  | 100   | 1 shot (30ml) + 70ml milk + 140ml foam                    |
| Dry Cappuccino / Tall      | 360ml  | 120   | 1 shot (30ml) + 110ml milk + 220ml foam                   |
| Dry Cappuccino / Grande    | 480ml  | 140   | 2 shot (60ml) + 140ml milk + 280ml foam                   |
| Dry Cappuccino / Venti     | 600ml  | 160   | 2 shot (60ml) + 180ml milk + 360ml foam                   |
| Wet Cappuccino / Short     | 240ml  | 100   | 1 shot (30ml) + 140ml milk + 70ml foam                    |
| Wet Cappuccino / Tall      | 360ml  | 120   | 1 shot (30ml) + 220ml milk + 110ml foam                   |
| Wet Cappuccino / Grande    | 480ml  | 140   | 2 shot (60ml) + 280ml milk + 140ml foam                   |
| Wet Cappuccino / Venti     | 600ml  | 160   | 2 shot (60ml) + 360ml milk + 180ml foam                   |
| Cappuccino / whipped cream | 20 ml  | +20   |                                                           |

---

## References

- [Espresso Drink Recipes](https://espressocoffeeguide.com/all-about-espresso/espresso-drink-recipes/)
- [Cappuccino Wet vs Dry. What's the difference?](https://stories.starbucks.com/stories/2016/wet-vs-dry-cappuccino/)
- [How to Froth and Steam Milk for Latte Art, Cappuccino and More](https://www.youtube.com/watch?v=0vD--H7poxU)
- [Starbucks Menu](https://www.starbucks.com.tw/products/drinks/view.jspx?cat=beverages)
- [Starbucks Drink Guide: Terms](https://delishably.com/dining-out/Starbucks-Drink-Guide-Terms)
