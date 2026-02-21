# 需求文件

## 簡介

本專案旨在建立一個展示型網站，用於呈現 EventStorming Coffeeshop DDD 微服務專案的功能與架構。網站將串接實際的 Java Spring Boot 後端微服務系統，涵蓋三個 Bounded Contexts（Orders、Coffee、Inventory），讓使用者能透過互動式介面體驗完整的咖啡店業務流程，同時學習 DDD 與 Event Storming 的設計概念。

技術棧為 HTML + Tailwind CSS，並遵循已定義的設計系統（深色主題、JetBrains Mono + IBM Plex Sans 字型、Vibrant & Block-based 風格）。

## 詞彙表

- **Showcase_Website**：展示型網站，用於呈現 EventStorming Coffeeshop 專案功能的前端應用程式
- **Orders_Service**：訂單微服務，負責訂單建立、狀態追蹤與桌號管理的後端 API（端點：`/order`）
- **Coffee_Service**：咖啡微服務，負責咖啡製作、食譜與菜單項目的後端 API（端點：`/coffee`）
- **Inventory_Service**：庫存微服務，負責原物料庫存管理與補貨的後端 API（端點：`/inventory`）
- **Bounded_Context**：DDD 中的限界上下文，定義特定領域模型的邊界
- **Design_System**：設計系統，定義於 `.kiro/design-system/eventstorming-coffeeshop/MASTER.md` 的視覺規範
- **Navigation_Bar**：導覽列，網站頂部的固定導航元件
- **Hero_Section**：首頁主視覺區塊，包含專案標題與核心說明
- **Architecture_Diagram**：架構圖，以視覺化方式呈現三個 Bounded Contexts 之間的關係
- **Order_Form**：點餐表單，供使用者選擇咖啡品項、杯型、客製化選項並提交訂單
- **Menu_Card**：菜單卡片，展示單一咖啡品項的名稱、杯型選項與價格
- **Inventory_Dashboard**：庫存儀表板，顯示各原物料的即時庫存狀態
- **Stock_Indicator**：庫存指示器，以視覺化方式呈現單一原物料的庫存百分比
- **Loading_Skeleton**：載入骨架，資料載入期間顯示的佔位元件
- **Error_Message**：錯誤訊息，API 呼叫失敗時顯示的使用者友善提示
- **Coffeeshop_UI_Builder**：專用的 custom sub agent，負責依據設計系統實作 UI 頁面與元件

## 需求

### 需求 1：網站導覽與整體佈局

**使用者故事：** 身為一位訪客，我希望網站有清晰的導覽結構，以便我能快速找到各個功能展示區塊。

#### 驗收條件

1. THE Showcase_Website SHALL 在頁面頂部顯示固定的 Navigation_Bar，包含專案名稱「EventStorming Coffeeshop」與各區塊的錨點連結（首頁、架構、點餐、菜單、庫存）
2. THE Showcase_Website SHALL 使用 Design_System 定義的深色背景色（#0F172A）作為頁面主背景
3. THE Showcase_Website SHALL 使用 JetBrains Mono 字型作為標題字型，IBM Plex Sans 作為內文字型
4. THE Showcase_Website SHALL 在所有可點擊元素上提供 cursor-pointer 與 150 至 300 毫秒的過渡動畫
5. THE Showcase_Website SHALL 在 375px、768px、1024px、1440px 四個斷點下正確呈現響應式佈局
6. THE Showcase_Website SHALL 確保主要內容區域不被固定的 Navigation_Bar 遮擋
7. THE Showcase_Website SHALL 使用一致的最大寬度容器（max-w-7xl）包裹所有區塊內容

### 需求 2：首頁 Hero 區塊與專案介紹

**使用者故事：** 身為一位訪客，我希望首頁能清楚傳達這是一個 DDD 微服務教學專案，以便我了解專案的目的與價值。

#### 驗收條件

1. THE Hero_Section SHALL 顯示專案標題「EventStorming Coffeeshop」，字體大小為 32px 以上
2. THE Hero_Section SHALL 顯示專案副標題，說明此為 DDD 與 Event Storming 工作坊的雲端原生微服務展示專案
3. THE Hero_Section SHALL 包含一個主要行動按鈕（CTA），使用 Design_System 定義的綠色（#22C55E），引導使用者前往點餐展示區塊
4. THE Hero_Section SHALL 使用 glassmorphism 風格的卡片元件呈現三個 Bounded_Context 的摘要資訊（Orders、Coffee、Inventory）
5. THE Hero_Section SHALL 在各 Bounded_Context 摘要卡片中顯示該上下文的核心職責描述

### 需求 3：DDD 架構展示區塊

**使用者故事：** 身為一位學習者，我希望能看到專案的 DDD 架構圖，以便我理解各 Bounded Context 之間的關係與職責劃分。

#### 驗收條件

1. THE Architecture_Diagram SHALL 以視覺化方式呈現三個 Bounded_Context（Orders、Coffee、Inventory）及其之間的互動關係
2. THE Architecture_Diagram SHALL 為每個 Bounded_Context 標示其核心聚合根（Order、Coffee、Inventory）與主要領域事件（OrderCreated、OrderStatusChanged、CoffeeStatus）
3. THE Architecture_Diagram SHALL 使用 Design_System 定義的色彩區分不同的 Bounded_Context 區塊
4. THE Showcase_Website SHALL 在架構圖下方提供各 Bounded_Context 的詳細說明卡片，包含該上下文的 API 端點資訊
5. WHEN 使用者將滑鼠懸停於某個 Bounded_Context 區塊上時，THE Architecture_Diagram SHALL 以色彩變化高亮顯示該區塊

### 需求 4：互動式點餐展示

**使用者故事：** 身為一位訪客，我希望能透過互動式表單體驗咖啡店的點餐流程，以便我了解 Orders Bounded Context 的實際運作方式。

#### 驗收條件

1. THE Order_Form SHALL 提供桌號選擇功能，可選範圍為 1 至 5 號桌
2. THE Order_Form SHALL 顯示四種咖啡品項供選擇：Espresso、Caffe Americano、Caffe Latte、Cappuccino
3. WHEN 使用者選擇 Espresso 時，THE Order_Form SHALL 僅顯示 Single（$60）與 Double（$80）兩種杯型選項
4. WHEN 使用者選擇 Caffe Americano、Caffe Latte 或 Cappuccino 時，THE Order_Form SHALL 顯示 Short、Tall、Grande、Venti 四種杯型選項及對應價格
5. WHEN 使用者選擇 Caffe Latte 時，THE Order_Form SHALL 顯示奶泡客製化選項（無奶泡、一般奶泡、多奶泡）與豆漿替代選項
6. WHEN 使用者選擇 Cappuccino 時，THE Order_Form SHALL 顯示乾式奶泡（Dry）與濕式奶泡（Wet）選項、鮮奶油加購選項（+$20）與豆漿替代選項
7. THE Order_Form SHALL 即時計算並顯示訂單總金額
8. WHEN 使用者提交訂單時，THE Showcase_Website SHALL 透過 POST 請求將訂單資料發送至 Orders_Service 的 `/order` 端點
9. WHEN Orders_Service 回傳 HTTP 201 狀態碼時，THE Showcase_Website SHALL 顯示訂單建立成功的確認訊息與訂單編號
10. IF Orders_Service 回傳錯誤回應，THEN THE Showcase_Website SHALL 顯示使用者友善的 Error_Message，說明訂單建立失敗的原因

### 需求 5：咖啡菜單展示

**使用者故事：** 身為一位訪客，我希望能瀏覽完整的咖啡菜單，以便我了解 Coffee Bounded Context 管理的品項與食譜資訊。

#### 驗收條件

1. THE Showcase_Website SHALL 以 Menu_Card 格式展示所有咖啡品項（Espresso、Caffe Americano、Caffe Latte、Cappuccino）
2. THE Menu_Card SHALL 顯示咖啡品項名稱、各杯型的容量（ml）與價格
3. THE Menu_Card SHALL 顯示每種咖啡的製作食譜資訊，包含 espresso shot 數量、牛奶用量與水量
4. WHEN 使用者點擊某個 Menu_Card 時，THE Showcase_Website SHALL 展開顯示該品項的完整食譜細節與客製化選項
5. THE Showcase_Website SHALL 透過 GET 請求從 Coffee_Service 的 `/coffee` 端點取得咖啡品項資料
6. WHILE 咖啡品項資料載入中，THE Showcase_Website SHALL 顯示 Loading_Skeleton 佔位元件
7. IF Coffee_Service 無法連線，THEN THE Showcase_Website SHALL 顯示預設的靜態菜單資料作為降級方案

### 需求 6：庫存狀態儀表板

**使用者故事：** 身為一位訪客，我希望能查看咖啡店的即時庫存狀態，以便我了解 Inventory Bounded Context 的庫存管理機制。

#### 驗收條件

1. THE Inventory_Dashboard SHALL 顯示四種原物料的庫存狀態：豆漿（20 瓶）、鮮奶（50 瓶）、咖啡豆（100 袋）、濾紙（200 包）
2. THE Stock_Indicator SHALL 以進度條（progress bar）視覺化呈現每種原物料的庫存百分比
3. WHEN 某原物料庫存低於 30% 時，THE Stock_Indicator SHALL 將該原物料的進度條顏色變更為警告色（紅色或橘色）
4. THE Showcase_Website SHALL 透過 GET 請求從 Inventory_Service 的 `/inventory` 端點取得庫存資料
5. WHILE 庫存資料載入中，THE Showcase_Website SHALL 顯示 Loading_Skeleton 佔位元件
6. IF Inventory_Service 無法連線，THEN THE Showcase_Website SHALL 顯示預設的靜態庫存資料作為降級方案
7. THE Inventory_Dashboard SHALL 顯示每種原物料的最大容量與目前數量

### 需求 7：API 連線設定與錯誤處理

**使用者故事：** 身為一位開發者，我希望網站能靈活設定後端 API 的連線位址，以便我在不同環境中部署與測試。

#### 驗收條件

1. THE Showcase_Website SHALL 支援透過 JavaScript 設定檔配置三個微服務的 API 基礎位址（Orders_Service、Coffee_Service、Inventory_Service）
2. WHILE 任何 API 請求進行中，THE Showcase_Website SHALL 在對應的 UI 區塊顯示載入狀態指示
3. IF 任何 API 請求逾時超過 10 秒，THEN THE Showcase_Website SHALL 中止該請求並顯示逾時 Error_Message
4. IF 任何 API 請求失敗，THEN THE Showcase_Website SHALL 在對應區塊顯示重試按鈕，供使用者手動重新發送請求
5. THE Showcase_Website SHALL 在瀏覽器開發者工具的 console 中記錄所有 API 請求與回應的摘要資訊，用於除錯

### 需求 8：無障礙與效能

**使用者故事：** 身為一位訪客，我希望網站具備良好的無障礙支援與載入效能，以便所有使用者都能順暢地瀏覽網站。

#### 驗收條件

1. THE Showcase_Website SHALL 確保所有文字與背景的色彩對比度達到 4.5:1 以上
2. THE Showcase_Website SHALL 為所有圖片提供替代文字（alt text）
3. THE Showcase_Website SHALL 為所有表單輸入元素提供關聯的 label 標籤
4. THE Showcase_Website SHALL 提供可見的鍵盤焦點狀態（focus state）
5. THE Showcase_Website SHALL 在動畫效果中尊重使用者的 prefers-reduced-motion 偏好設定
6. THE Showcase_Website SHALL 使用語意化 HTML 標籤（header、main、nav、section、article、footer）建構頁面結構
7. THE Showcase_Website SHALL 僅使用 SVG 圖示（Lucide 或 Heroicons），禁止使用 emoji 作為介面圖示
