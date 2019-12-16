# Coffeeshop Business Requirements

## Inside the Coffeeshop

1. When a customer walks into the store, the customer can see the menu on the wall and take a seat first.
2. The waiter will go to the seat to help the guest order coffee and mark the **table number** for ordering.
3. There are **5 tables** in the coffee shop with a seating capacity of **10 people**.
4. The tables are numbered from 1 to 5.
5. After ordering, the customer will **pay for the transaction, cash only**.
6. The customer waits for the barista to prepare coffee and meals in the seat.
7. For orders dining in, the coffee should be served at **70 degree** for the convenience of drinking. As for take-away orders, the serving temperatue of the coffee needs to be raised to **90 degrees**. Regarding the brewing temperature, the best temperature is around 88°C ~ 98°C.
8. The main prodcuts of the store are **Espresso, Caffe Americano, Caffe Latte, Cappuccino**.
9. We offer 4 options for cup size: Short (short/8 oz/240ml), Tall (Tall/12 oz/360ml), Grande (Grande/16 oz/480ml), Venti (Venti/20 oz/600ml) (except for Espresso, there are only 2 options, which are single and double).
10. The price for all kinds of sizes of Espresso are $60 for Single, $80 for Double. 20 dollars increased for every upgrade.
11. The price for all kinds of sizes of **Caffe Americano are $80 for Short, $100 for Tall, $120 for Grande, $140 for Venti**. 20 dollars increased for every upgrade.
12. The price for all kinds of sizes of **Caffe Latte are $100 for Short, $120 for Tall, $140 for Grande, $160 for Venti**. 20 dollars increased for every upgrade.
13. The price for all kinds of sizes of **Cappuccino are $100 for Short, $120 for Tall, $140 for Grande, $160 for Venti**. 20 dollars increased for every upgrade.
14. After receiving the order from the customer, the counter will **confirm the order and process the payment**, and summit it to the barista to make coffee.
15. The barista prepares the ingredients the order needed from the warehouse based on the content of the order.

## Inventory Management

1. Two kinds of milk are required: low-fat milk or soy milk. (_also for customization?_)
2. The current configuration of the inventory warehouse can store 20 bottles of 2L bottles of soy milk and 50 bottles of 2L bottles of milk at one time, and 100 bags of Sumatra coffee beans packed in 1kg, 200 bags of filter paper (100 sheets in one pack)
3. Whenever any stock of a material is less then 30 percent, the barista should be notified to request the counter for replenishment via texting or email. Then the counter person should be responsible for the purchase. (_be notified by who?_)
4. The raw materials purchased are returned to the warehouse after the barista confirms the status and quantity of the items.
5. Wish: a visualization page to present the current status of raw materials, monthly sales charts, and weekly sales chart
6. The raw material is replenished to 100% for each replenishment and needs to be completed within 3 days.

## Customization

1. For Caffe Latte, the customer can have the drink with no foam, with foam, or with more foam.
2. For Cappuccino, the customer can choose which type of foaming he/she desires for drinks, like dry foam (less milk) or wet foam(more milk). [ref](https://stories.starbucks.com/stories/2016/wet-vs-dry-cappuccino/)
3. Also, the customer can pay additional \$20 to have **whipped cream** on his/her Cappuccino.
4. The customer can replace milk with soy milk for his/her Caffe Latte or Cappuccino.

## Making Coffee

1. We brew coffee in the way of making Espresso coffee. The size unit for every Espresso is a shot.
2. A cup of Espresso shot consumes 20g of coffee beans (1 shot) and produces 30ml espresso.
3. A standard dry Cappuccino needs 1:2 milk:foam ratio.
4. A standard wet Cappuccino needs 2:1 milk:foam ratio.
5. The more time you steam the milk with the steam wand, the more foam you can get. [ref](https://www.youtube.com/watch?v=Q45zCLnLyuE)
6. Here are all the items and their recipe:

| Item / size                | size  | price | recipe                                                    |
| -------------------------- | ----- | ----- | --------------------------------------------------------- |
| Espresso / Single          | 30ml  | 60    | 1 shot (30ml)                                             |
| Espresso / Double          | 60ml  | 80    | 2 shot (60ml)                                             |
| Caffe Americano / Short    | 240ml | 80    | 1 shot (30ml) + 210ml water                               |
| Caffe Americano / Tall     | 360ml | 100   | 1 shot (30ml) + 330ml water                               |
| Caffe Americano / Granti   | 480ml | 120   | 2 shot (60ml) + 420ml water                               |
| Caffe Americano / Vanti    | 600ml | 140   | 2 shot (60ml) + 540ml water                               |
| Caffe Latte / Short        | 240ml | 100   | 1 shot (30ml) + 210ml milk (with a little foam about 2ml) |
| Caffe Latte / Tall         | 360ml | 120   | 1 shot (30ml) + 330ml milk (with a little foam about 2ml) |
| Caffe Latte / Granti       | 480ml | 140   | 2 shot (60ml) + 420ml milk (with a little foam about 3ml) |
| Caffe Latte / Vanti        | 600ml | 160   | 2 shot (60ml) + 540ml milk (with a little foam about 4ml) |
| Dry Cappuccino / Short     | 240ml | 100   | 1 shot (30ml) + 70ml milk + 140ml foam                    |
| Dry Cappuccino / Tall      | 360ml | 120   | 1 shot (30ml) + 110ml milk + 220ml foam                   |
| Dry Cappuccino / Granti    | 480ml | 140   | 2 shot (60ml) + 140ml milk + 280ml foam                   |
| Dry Cappuccino / Vanti     | 600ml | 160   | 2 shot (60ml) + 180ml milk + 360ml foam                   |
| Wet Cappuccino / Short     | 240ml | 100   | 1 shot (30ml) + 140ml milk + 70ml foam                    |
| Wet Cappuccino / Tall      | 360ml | 120   | 1 shot (30ml) + 220ml milk + 110ml foam                   |
| Wet Cappuccino / Granti    | 480ml | 140   | 2 shot (60ml) + 280ml milk + 140ml foam                   |
| Wet Cappuccino / Vanti     | 600ml | 160   | 2 shot (60ml) + 360ml milk + 180ml foam                   |
| Cappuccino / whipped cream | 20 ml | +20   |                                                           |

---

## References

- [Espresso Drink Recipes](https://espressocoffeeguide.com/all-about-espresso/espresso-drink-recipes/)
- [Cappuccino Wet vs Dry. What’s the difference?](https://stories.starbucks.com/stories/2016/wet-vs-dry-cappuccino/)
- [How to Froth and Steam Milk for Latte Art, Cappuccino and More](https://www.youtube.com/watch?v=0vD--H7poxU)
- [Starbucks Menu](https://www.starbucks.com.tw/products/drinks/view.jspx?cat=beverages)
- [Starbucks Drink Guide: Terms](https://delishably.com/dining-out/Starbucks-Drink-Guide-Terms)

