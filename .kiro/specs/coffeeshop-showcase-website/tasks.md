# 實作計畫：EventStorming Coffeeshop 展示網站

## 概述

依據設計文件的檔案結構與元件分解，以漸進式方式建構展示網站。從基礎架構（設定檔、工具函式、API 層）開始，逐步實作各 UI 元件，最後整合串接並驗證。技術棧為 HTML + Tailwind CSS CDN + Vanilla JS，測試使用 Vitest + fast-check。

## 任務

- [x] 1. 建立專案基礎架構與設定檔
  - [x] 1.1 建立 `website/js/config.js`，定義三個微服務的 API 基礎位址（Orders: 8081、Coffee: 8082、Inventory: 8083）與 10 秒逾時設定
    - 匯出 `API_CONFIG` 物件，包含 `orders`、`coffee`、`inventory` 三個服務的 `baseUrl` 與 `endpoints`
    - _需求：7.1_
  - [x] 1.2 建立 `website/js/fallback-data.js`，定義降級靜態資料
    - 包含 `FALLBACK_MENU`（4 種咖啡品項含杯型、食譜、客製化選項）與 `FALLBACK_INVENTORY`（4 種原物料含目前數量與最大容量）
    - 資料結構須完全符合設計文件的資料模型定義
    - _需求：5.7, 6.6_
  - [x] 1.3 建立 `website/js/utils/dom.js`，實作 DOM 工具函式
    - 實作 `showSkeleton(containerId)`、`hideSkeleton(containerId)`、`showError(containerId, message, retryFn)`、`hideError(containerId)`
    - 骨架載入使用 Tailwind 的 `animate-pulse` 效果
    - 錯誤訊息包含重試按鈕，按鈕具備 `cursor-pointer` 樣式
    - _需求：7.2, 7.4_
  - [x] 1.4 建立 `website/js/api.js`，實作 API 整合層
    - 實作 `apiFetch(url, options)` 含 AbortController 10 秒逾時、console 日誌記錄（URL、方法、狀態碼）
    - 實作 `createOrder(orderData)`、`fetchCoffeeMenu()`、`fetchInventory()` 三個 API 函式
    - GET 請求失敗時自動使用 fallback 資料，POST 請求失敗時拋出錯誤
    - _需求：4.8, 5.5, 6.4, 7.3, 7.5_

- [x] 2. 建立主頁面 HTML 結構與樣式
  - [x] 2.1 建立 `website/css/custom.css`，定義 CSS 變數與自訂樣式
    - 定義設計系統色彩變數（主背景 #0F172A、綠色 CTA #22C55E 等）
    - 定義 glassmorphism 卡片樣式（`backdrop-filter: blur`、半透明背景）
    - 定義 `prefers-reduced-motion` 媒體查詢，停用動畫效果
    - 載入 JetBrains Mono（標題）與 IBM Plex Sans（內文）Google Fonts
    - _需求：1.2, 1.3, 2.4, 8.5_
  - [x] 2.2 建立 `website/index.html`，使用語意化 HTML 建構完整頁面結構
    - 使用 `<header>`、`<nav>`、`<main>`、`<section>`、`<footer>` 語意化標籤
    - 引入 Tailwind CSS CDN、custom.css、所有 JS 模組
    - 每個 section 使用 `max-w-7xl` 容器，主背景色 `#0F172A`
    - 包含 7 個區塊：Navigation、Hero、Architecture、Order Form、Menu、Inventory、Footer
    - 所有 `<img>` 標籤包含非空 `alt` 屬性
    - 所有表單 `<input>`/`<select>` 具備關聯的 `<label>`（for/id 配對）
    - 所有可點擊元素具備 `cursor-pointer` 與 `transition duration-200` class
    - 響應式佈局：375px 單欄、768px 雙欄、1024px 三欄、1440px max-w-7xl 置中
    - 主要內容區域加入 `pt` padding 避免被固定 Navigation_Bar 遮擋
    - 僅使用 Lucide Icons inline SVG 作為圖示，禁止 emoji
    - _需求：1.1, 1.2, 1.4, 1.5, 1.6, 1.7, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 5.1, 6.1, 8.1, 8.2, 8.3, 8.4, 8.6, 8.7_

- [x] 3. 實作導覽列與 Hero 區塊元件
  - [x] 3.1 建立 `website/js/components/navigation.js`，實作導覽列互動
    - 實作 `initNavigation()`：綁定錨點連結平滑滾動
    - 實作 `updateActiveSection()`：滾動時高亮當前區塊對應的導覽項目
    - 實作 `toggleMobileMenu()`：手機版漢堡選單開關
    - 導覽列固定於頂部，包含「EventStorming Coffeeshop」名稱與 5 個錨點（首頁、架構、點餐、菜單、庫存）
    - _需求：1.1, 1.6_
  - [x] 3.2 建立 `website/js/components/hero.js`，實作 Hero 區塊
    - 標題「EventStorming Coffeeshop」字體 ≥ 32px
    - 副標題說明 DDD 與 Event Storming 工作坊的雲端原生微服務展示
    - 綠色 CTA 按鈕（#22C55E）連結至點餐區塊
    - 3 張 glassmorphism 風格的 Bounded Context 摘要卡片（Orders、Coffee、Inventory），各含核心職責描述
    - _需求：2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 4. 檢查點 - 基礎架構驗證
  - 確認所有基礎檔案已建立，頁面可正常載入並顯示導覽列與 Hero 區塊。確保所有測試通過，如有問題請詢問使用者。

- [x] 5. 實作架構圖與點餐表單元件
  - [x] 5.1 建立 `website/js/components/architecture.js`，實作 DDD 架構圖互動
    - 視覺化呈現 Orders、Coffee、Inventory 三個 Bounded Context 及互動關係
    - 每個 BC 標示核心聚合根（Order、Coffee、Inventory）與主要領域事件（OrderCreated、OrderStatusChanged、CoffeeStatus）
    - 使用設計系統色彩區分不同 BC 區塊
    - hover 時以色彩變化高亮該 BC 區塊
    - 下方提供各 BC 的詳細說明卡片，含 API 端點資訊
    - _需求：3.1, 3.2, 3.3, 3.4, 3.5_
  - [x] 5.2 建立 `website/js/components/order-form.js`，實作點餐表單邏輯
    - 實作 `initOrderForm()`：初始化表單事件綁定
    - 實作 `updateSizeOptions(productId)`：Espresso 顯示 Single($60)/Double($80)，其餘顯示 Short/Tall/Grande/Venti
    - 實作 `updateCustomizations(productId)`：Latte 顯示奶泡與豆漿選項，Cappuccino 顯示乾/濕奶泡、鮮奶油(+$20)、豆漿選項
    - 實作 `calculateTotal()`：基礎價格 + 客製化價格調整
    - 實作 `submitOrder()`：POST 至 Orders Service `/order`，成功顯示訂單編號，失敗顯示錯誤訊息
    - 桌號選擇 1-5 號桌
    - _需求：4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 4.10_
  - [ ]* 5.3 撰寫點餐表單屬性測試 `website/tests/property/order-calc.property.js`
    - **Property 3：非 Espresso 品項顯示四種標準杯型**
    - **驗證：需求 4.4**
  - [ ]* 5.4 撰寫點餐表單屬性測試 `website/tests/property/order-calc.property.js`
    - **Property 4：訂單總金額計算正確**
    - **驗證：需求 4.7**
  - [ ]* 5.5 撰寫點餐表單屬性測試 `website/tests/property/order-calc.property.js`
    - **Property 5：訂單提交請求格式正確**
    - **驗證：需求 4.8**

- [x] 6. 實作菜單與庫存元件
  - [x] 6.1 建立 `website/js/components/menu.js`，實作菜單卡片
    - 實作 `loadMenuData()`：從 Coffee Service GET `/coffee` 取得資料，失敗時使用 fallback
    - 實作 `renderMenuCards(items)`：渲染 4 種咖啡的 Menu_Card，顯示名稱、各杯型容量(ml)與價格、食譜資訊
    - 實作 `toggleCardDetail(cardElement)`：點擊展開/收合完整食譜細節與客製化選項
    - 載入中顯示 Loading_Skeleton
    - _需求：5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_
  - [x] 6.2 建立 `website/js/components/inventory.js`，實作庫存儀表板
    - 實作 `loadInventoryData()`：從 Inventory Service GET `/inventory` 取得資料，失敗時使用 fallback
    - 實作 `renderInventoryDashboard(items)`：渲染 4 種原物料的庫存卡片，顯示名稱、目前數量、最大容量
    - 實作 `updateStockIndicator(element, percentage)`：進度條寬度 = `(current/max)*100%`，低於 30% 使用警告色（紅/橘）
    - 載入中顯示 Loading_Skeleton
    - _需求：6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_
  - [ ]* 6.3 撰寫菜單屬性測試 `website/tests/property/menu-render.property.js`
    - **Property 7：菜單卡片顯示完整資訊**
    - **驗證：需求 5.2, 5.3**
  - [ ]* 6.4 撰寫菜單屬性測試 `website/tests/property/menu-render.property.js`
    - **Property 8：菜單卡片展開/收合切換**
    - **驗證：需求 5.4**
  - [ ]* 6.5 撰寫庫存屬性測試 `website/tests/property/inventory.property.js`
    - **Property 10：庫存儀表板顯示完整資訊與正確百分比**
    - **驗證：需求 6.2, 6.7**
  - [ ]* 6.6 撰寫庫存屬性測試 `website/tests/property/inventory.property.js`
    - **Property 11：低庫存警告色**
    - **驗證：需求 6.3**

- [x] 7. 檢查點 - 元件功能驗證
  - 確認所有元件可正常渲染與互動（架構圖 hover、點餐表單選擇與計算、菜單展開收合、庫存進度條）。確保所有測試通過，如有問題請詢問使用者。

- [ ] 8. 實作 API 整合層測試與錯誤處理驗證
  - [ ]* 8.1 撰寫 API 層屬性測試 `website/tests/property/api-layer.property.js`
    - **Property 6：API 錯誤顯示錯誤訊息與重試按鈕**
    - **驗證：需求 4.10, 7.4**
  - [ ]* 8.2 撰寫 API 層屬性測試 `website/tests/property/api-layer.property.js`
    - **Property 9：API 失敗時使用降級資料**
    - **驗證：需求 5.7, 6.6**
  - [ ]* 8.3 撰寫 API 層屬性測試 `website/tests/property/api-layer.property.js`
    - **Property 12：API 請求逾時處理**
    - **驗證：需求 7.3**
  - [ ]* 8.4 撰寫 API 層屬性測試 `website/tests/property/api-layer.property.js`
    - **Property 13：API 載入狀態指示**
    - **驗證：需求 7.2**
  - [ ]* 8.5 撰寫 API 層屬性測試 `website/tests/property/api-layer.property.js`
    - **Property 14：API 請求日誌記錄**
    - **驗證：需求 7.5**

- [x] 9. 整合串接與主程式初始化
  - [x] 9.1 建立 `website/js/app.js`，實作主程式進入點
    - 定義全域 `state` 物件（order、menu、inventory、loading、errors）
    - 實作 `updateState(section, data)` 狀態更新函式
    - 在 `DOMContentLoaded` 事件中初始化所有元件：`initNavigation()`、`initOrderForm()`、`loadMenuData()`、`loadInventoryData()`
    - 串接各元件的事件處理與狀態同步
    - _需求：1.1, 4.1, 5.5, 6.4_
  - [x] 9.2 整合所有 JS 模組至 `index.html`
    - 確認 script 載入順序：config → fallback-data → dom → api → components → app
    - 確認所有元件正確初始化並可互動
    - 驗證 API 連線（成功時使用即時資料，失敗時降級至靜態資料）
    - _需求：7.1, 7.2_

- [ ] 10. 無障礙與 UI 品質屬性測試
  - [ ]* 10.1 撰寫無障礙屬性測試 `website/tests/property/a11y.property.js`
    - **Property 1：可點擊元素皆具備互動回饋**
    - **驗證：需求 1.4**
  - [ ]* 10.2 撰寫無障礙屬性測試 `website/tests/property/a11y.property.js`
    - **Property 2：所有區塊使用一致的最大寬度容器**
    - **驗證：需求 1.7**
  - [ ]* 10.3 撰寫無障礙屬性測試 `website/tests/property/a11y.property.js`
    - **Property 15：所有圖片具備替代文字**
    - **驗證：需求 8.2**
  - [ ]* 10.4 撰寫無障礙屬性測試 `website/tests/property/a11y.property.js`
    - **Property 16：所有表單輸入具備關聯 label**
    - **驗證：需求 8.3**
  - [ ]* 10.5 撰寫無障礙屬性測試 `website/tests/property/a11y.property.js`
    - **Property 17：禁止使用 emoji 作為圖示**
    - **驗證：需求 8.7**

- [x] 11. 最終檢查點 - 全面驗證
  - 確保所有測試通過、所有元件正常運作、API 串接與降級方案皆可正確執行。如有問題請詢問使用者。

## 備註

- 標記 `*` 的任務為選擇性任務，可跳過以加速 MVP 開發
- 每個任務皆標註對應的需求編號，確保可追溯性
- 檢查點確保漸進式驗證，及早發現問題
- 屬性測試驗證通用正確性屬性（Property 1-17），單元測試驗證具體範例與邊界案例
- 實作時請參考設計系統 `.kiro/design-system/eventstorming-coffeeshop/MASTER.md` 的視覺規範
- UI 實作可使用 custom sub agent `coffeeshop-ui-builder`（定義於 `.kiro/agents/coffeeshop-ui-builder.md`）
