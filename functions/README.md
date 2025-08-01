# LINE Bot Firebase Functions

這是一個模組化的 Firebase Functions 專案，整合了 LINE Bot Webhook 和 Google Calendar 功能。

## 🏗️ 專案架構

```
src/
├── config/           # 配置管理
│   └── index.js     # 環境變數和配置設定
├── services/         # 業務邏輯服務
│   ├── lineService.js      # LINE Bot 服務
│   ├── calendarService.js  # Google Calendar 服務
│   └── firestoreService.js # Firestore 資料庫服務
├── handlers/         # 請求處理器
│   ├── lineWebhookHandler.js # LINE Webhook 處理
│   ├── broadcastHandler.js   # 廣播功能處理
│   └── statusHandler.js      # 狀態檢查處理
├── utils/            # 工具函數
│   ├── errorHandler.js      # 錯誤處理
│   └── responseFormatter.js # 回應格式化
└── index.js          # 主入口文件
```

## 🚀 功能特色

### 1. LINE Bot Webhook

- 處理 LINE 群組和個人訊息
- 自動記錄群組資訊到 Firestore
- 支援日曆事件創建功能
- 完整的錯誤處理和日誌記錄

### 2. 群組廣播

- 向所有已記錄的 LINE 群組發送訊息
- 支援多種訊息類型（文字、圖片、影片等）
- 可選擇性廣播到特定群組
- 詳細的發送結果統計

### 3. 系統監控

- 健康檢查端點
- 詳細的系統統計資訊
- 群組和日曆事件統計
- 配置狀態檢查

### 4. Google Calendar 整合

- 從 LINE 訊息自動創建日曆事件
- 支援事件重複、提醒、參加者等功能
- 完整的日曆事件管理

## 📋 API 端點

### LINE Webhook

```
POST /lineWebhook
GET  /lineWebhook  # 配置檢查
```

### 廣播功能

```
POST /broadcast
Content-Type: application/json

{
  "message": "廣播訊息內容",
  "groupIds": ["可選的特定群組ID"],
  "messageType": "text" // text, image, video, audio, location, sticker
}
```

### 狀態檢查

```
GET /status      # 基本狀態
GET /health      # 健康檢查
GET /stats       # 詳細統計
```

## 🔧 環境變數

### 必要變數

```bash
LINE_CHANNEL_SECRET=your_line_channel_secret
LINE_CHANNEL_ACCESS_TOKEN=your_line_channel_access_token
```

### Google Calendar 變數（選擇其一）

```bash
# 方式 1: API Key
CALENDAR_API_KEY=your_google_calendar_api_key

# 方式 2: OAuth2 憑證
GOOGLE_CALENDAR_CREDENTIALS={"client_id":"...","client_secret":"...","redirect_uris":["..."]}
GOOGLE_CALENDAR_TOKEN={"access_token":"...","refresh_token":"..."}
```

## 📝 日曆事件格式

在 LINE 中發送以下格式的訊息來創建日曆事件：

```
類型: 事件
標題: 會議標題
開始: 2024-01-15T10:00:00
結束: 2024-01-15T11:00:00
說明: 會議說明（可選）
地點: 會議地點（可選）
參加者: email1@example.com,email2@example.com（可選）
提醒: 15（分鐘，可選）
重複: FREQ=WEEKLY;BYDAY=MO（可選）
```

## 🛠️ 開發指南

### 本地開發

```bash
# 安裝依賴
npm install

# 本地測試
npm run serve

# 部署
npm run deploy
```

### 添加新功能

1. **新增服務**：在 `services/` 目錄下創建新的服務類
2. **新增處理器**：在 `handlers/` 目錄下創建新的處理器類
3. **新增工具**：在 `utils/` 目錄下添加通用工具函數
4. **註冊端點**：在 `src/index.js` 中導出新的函數

### 錯誤處理

使用統一的錯誤處理機制：

```javascript
const { ValidationError, AppError } = require("./utils/errorHandler");

// 拋出自定義錯誤
throw new ValidationError("Invalid input");
throw new AppError("Custom error message", 400);
```

### 回應格式化

使用統一的回應格式：

```javascript
const { successResponse, errorResponse } = require("./utils/responseFormatter");

// 成功回應
res.json(successResponse(data, "Operation successful"));

// 錯誤回應
res.status(400).json(errorResponse("Invalid input", 400));
```

## 📊 資料庫結構

### Firestore 集合

#### line_groups

```javascript
{
  groupId: "群組ID",
  groupName: "群組名稱",
  joinedAt: "加入時間",
  lastActivity: "最後活動時間",
  memberCount: "成員數量",
  type: "群組類型"
}
```

#### calendar_events

```javascript
{
  eventId: "日曆事件ID",
  summary: "事件標題",
  htmlLink: "事件連結",
  createdFrom: "創建來源",
  createdAt: "創建時間",
  eventData: "原始事件資料"
}
```

#### webhook_logs

```javascript
{
  eventType: "事件類型",
  eventData: "事件資料",
  status: "處理狀態",
  timestamp: "時間戳",
  processed: "是否已處理"
}
```

## 🔍 監控和日誌

- 所有操作都會記錄到 Firebase Functions 日誌
- 使用結構化日誌格式
- 支援錯誤追蹤和性能監控
- 提供詳細的統計資訊

## 🚨 注意事項

1. **Webhook 安全性**：確保 LINE webhook 端點的安全性
2. **環境變數**：正確設定所有必要的環境變數
3. **權限設定**：確保 Firestore 安全規則正確配置
4. **配額限制**：注意 Firebase Functions 和 LINE API 的使用限制

## 📈 未來擴展

- [ ] 支援更多訊息類型
- [ ] 添加用戶管理功能
- [ ] 實現更複雜的日曆事件處理
- [ ] 添加通知和提醒功能
- [ ] 支援多語言
- [ ] 添加管理後台

## 🤝 貢獻

歡迎提交 Issue 和 Pull Request 來改善這個專案。

## 📄 授權

MIT License
