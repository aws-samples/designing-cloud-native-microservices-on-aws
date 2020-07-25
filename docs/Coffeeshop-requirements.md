# Coffeeshop 業務需求

## 咖啡店內

1. 客人走進店裡，可以看到牆上的 menu 並先找位置入座
2. 服務生會到座位上幫客人點咖啡，並標記桌號進行點餐
3. 店內總共有 5 張桌子，可容納 10 位客人
4. 桌子編號從 1 至 5
5. 點餐後，客人會付款進行交易，目前只先提供現金交易機制
6. 客人在座位上等待咖啡師調製咖啡與供餐
7. 當客人在店內點咖啡時，咖啡溫度在送到桌上時需要維持在 70 度，便於客戶飲用，若客戶是外帶則會需要再包裝時調高到 90 度，而整個最佳的咖啡炮製時的溫度大約是 88~98 度
8. 店內提供咖啡主要有單份濃縮咖啡 (Expresso)、美式 (Caffe Americano)、拿鐵 (Caffe Latte)、卡布奇諾 (Cappuccino)
9. 每一杯飲料區分 小杯( short/8 oz/240ml)、 中杯( Tall/12 oz/360ml ) 、大杯 (Grande/16 oz/480ml)、 特大杯 (Venti/20 oz/600ml) 。濃縮咖啡則是例外，僅提供單倍 (1 oz/30ml) 與雙倍 (2 oz/60ml)
10. 濃縮咖啡的價錢依照容量分別為單倍 60 元；雙倍 80 元
11. 美式咖啡的價錢依照容量分別為小杯 80 元；中杯 100 元；大杯 120 元；特大杯 140 元 。每次升級加收 20 元
12. 拿鐵咖啡的價錢依照容量分別為小杯 100 元；中杯 120 元；大杯 140 元；特大杯 160 元 。每次升級加收 20 元
13. 卡布奇諾的價錢依照容量分別為小杯 100 元；中杯 120 元；大杯 140 元；特大杯 160 元 。每次升級加收 20 元
14. 當客人點餐之後，櫃檯收到訂單，會去完成訂單確認與付款，並將訂單 提交給咖啡師進行製作
15. 咖啡師根據訂單內容，從原物料倉庫當中提取訂單所需要用上的原料進行調製

## 進貨原物料

1. 購買牛奶時會需要提供低脂牛奶 (Low-fat Milk)或者 豆奶(Soy Milk)
2. 庫存倉庫目前的配置，可以一次存放豆奶 2L 瓶裝的 20 瓶 , 以及 牛奶 2L 瓶裝的 50 瓶，還有蘇門答臘咖啡豆 1 公斤包裝的可一次收藏 100 包，濾紙 200 包(一包內含 100 張濾紙)
3. 當有任何一個原物料的庫存低於 30%，需要通知咖啡師與櫃檯進行補貨，可以通過簡訊、email，而真正去購買原料的是由櫃檯人員去負責
4. 買回來的原物料讓咖啡師確認品項狀態與數量後入庫
5. 希望未來可以有個可視覺化的呈現頁面去看到原料使用狀態、每月熱銷排行、每週熱銷排行
6. 每一次補貨都將該物料補到 100%，並且需要在 3 天內到貨完成

## 提供客製化體驗需求

1. 以拿鐵來說，客人可以選擇不要奶泡、正常奶泡、更多奶泡
2. 以卡布奇諾來說，可人可以選擇乾式 (Dry/牛奶少) 或是濕式 (Wet/牛奶多) [ref](https://stories.starbucks.com/stories/2016/wet-vs-dry-cappuccino/)
3. 同時，客人可以額外花 20 元在卡布奇諾上加上鮮奶油 (Whipped Cream)
4. 購買拿鐵或卡布奇諾時，客人可以選擇用豆奶 (soy milk) 代替牛奶

## 製作咖啡

1. 每一份現煮咖啡我們是義式咖啡的製作方式，每一份濃縮咖啡我們稱之為一個 Shot
2. 每一杯濃縮咖啡(shot)，都會耗用 20g 的咖啡豆萃取出 30ml 的咖啡液
3. 一份標準的乾式卡布奇諾的蒸牛奶 (steamed milk) 與奶泡 (foam) 比例為 1:2
4. 一份標準的濕式卡布奇諾的蒸牛奶 (steamed milk) 與奶泡 (foam) 比例為 2:1
5. 當你用蒸氣棒徵牛奶越久，你可以得到越多奶泡 [ref](https://www.youtube.com/watch?v=Q45zCLnLyuE)
6. 以下是詳細的品項以及作法:

| 品項/規格                  | 容量  | 價錢 | 作法                                                      |
| -------------------------- | ----- | ---- | --------------------------------------------------------- |
| Espresso / Single          | 30ml  | 60   | 1 shot (30ml)                                             |
| Espresso / Double          | 60ml  | 80   | 2 shot (60ml)                                             |
| Caffe Americano / Short    | 240ml | 80   | 1 shot (30ml) + 210ml water                               |
| Caffe Americano / Tall     | 360ml | 100  | 1 shot (30ml) + 330ml water                               |
| Caffe Americano / Granti   | 480ml | 120  | 2 shot (60ml) + 420ml water                               |
| Caffe Americano / Vanti    | 600ml | 140  | 2 shot (60ml) + 540ml water                               |
| Caffe Latte / Short        | 240ml | 100  | 1 shot (30ml) + 210ml milk (with a little foam about 2ml) |
| Caffe Latte / Tall         | 360ml | 120  | 1 shot (30ml) + 330ml milk (with a little foam about 2ml) |
| Caffe Latte / Granti       | 480ml | 140  | 2 shot (60ml) + 420ml milk (with a little foam about 3ml) |
| Caffe Latte / Vanti        | 600ml | 160  | 2 shot (60ml) + 540ml milk (with a little foam about 4ml) |
| Dry Cappuccino / Short     | 240ml | 100  | 1 shot (30ml) + 70ml milk + 140ml foam                    |
| Dry Cappuccino / Tall      | 360ml | 120  | 1 shot (30ml) + 110ml milk + 220ml foam                   |
| Dry Cappuccino / Granti    | 480ml | 140  | 2 shot (60ml) + 140ml milk + 280ml foam                   |
| Dry Cappuccino / Vanti     | 600ml | 160  | 2 shot (60ml) + 180ml milk + 360ml foam                   |
| Wet Cappuccino / Short     | 240ml | 100  | 1 shot (30ml) + 140ml milk + 70ml foam                    |
| Wet Cappuccino / Tall      | 360ml | 120  | 1 shot (30ml) + 220ml milk + 110ml foam                   |
| Wet Cappuccino / Granti    | 480ml | 140  | 2 shot (60ml) + 280ml milk + 140ml foam                   |
| Wet Cappuccino / Vanti     | 600ml | 160  | 2 shot (60ml) + 360ml milk + 180ml foam                   |
| Cappuccino / whipped cream | 20 ml | +20  |                                                           |

---

## References

- [Espresso Drink Recipes](https://espressocoffeeguide.com/all-about-espresso/espresso-drink-recipes/)
- [Cappuccino Wet vs Dry. What’s the difference?](https://stories.starbucks.com/stories/2016/wet-vs-dry-cappuccino/)
- [How to Froth and Steam Milk for Latte Art, Cappuccino and More](https://www.youtube.com/watch?v=0vD--H7poxU)
- [Starbucks Menu](https://www.starbucks.com.tw/products/drinks/view.jspx?cat=beverages)
- [Starbucks Drink Guide: Terms](https://delishably.com/dining-out/Starbucks-Drink-Guide-Terms)

