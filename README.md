# LINE Bot Firebase Project

一個整合 LINE Bot Webhook 和 Google Calendar 功能的 Firebase 專案，提供智能的群組管理、日曆事件創建和 OAuth Token 管理系統。

## 🚀 專案概述

這個專案是一個模組化的 Firebase Functions 應用程式，主要功能包括：

- **LINE Bot Webhook 處理**：自動處理 LINE 群組和個人訊息
- **Google Calendar 整合**：從 LINE 訊息自動創建日曆事件
- **群組廣播系統**：向所有已記錄的 LINE 群組發送訊息
- **智能 Token 管理**：自動處理 Google OAuth Token 刷新和更新
- **系統監控**：提供健康檢查和詳細統計資訊

## 📁 專案結構

```
myFirebase/
├── README.md                    # 專案總覽（本文件）
├── firebase.json               # Firebase 配置
├── firestore.rules             # Firestore 安全規則
├── firestore.indexes.json      # Firestore 索引配置
└── functions/                  # Firebase Functions 源碼
    ├── README.md               # Functions 詳細文檔
    ├── package.json            # 依賴配置
    ├── src/                    # 源碼目錄
    │   ├── config/             # 配置管理
    │   ├── services/           # 業務邏輯服務
    │   ├── handlers/           # 請求處理器
    │   ├── utils/              # 工具函數
    │   └── index.js            # 主入口文件
    └── docs/                   # 詳細文檔
        ├── TOKEN_MANAGEMENT_GUIDE.md
        ├── DEPLOYMENT_GUIDE.md
        ├── LOCAL_TESTING_GUIDE.md
        └── ...
```

## 🛠️ 技術棧

- **Backend**: Firebase Functions (Node.js 22)
- **Database**: Firestore
- **Authentication**: Google OAuth 2.0
- **APIs**: LINE Bot API, Google Calendar API
- **Language**: JavaScript (ES6+)

## 📋 主要功能

### 1. LINE Bot Webhook

- 處理 LINE 群組和個人訊息
- 自動記錄群組資訊到 Firestore
- 支援日曆事件創建功能
- 完整的錯誤處理和日誌記錄

### 2. Google Calendar 整合

- 從 LINE 訊息自動創建日曆事件
- 支援事件重複、提醒、參加者等功能
- 智能 Token 管理系統
- 自動 Token 刷新機制

### 3. 群組廣播系統

- 向所有已記錄的 LINE 群組發送訊息
- 支援多種訊息類型（文字、圖片、影片等）
- 可選擇性廣播到特定群組
- 詳細的發送結果統計

### 4. 系統監控

- 健康檢查端點
- 詳細的系統統計資訊
- Token 狀態監控
- 配置狀態檢查

## 🚀 快速開始

### 前置需求

1. **Node.js 22+**
2. **Firebase CLI**
3. **LINE Bot 帳號**
4. **Google Cloud 專案**

### 安裝步驟

1. **克隆專案**

   ```bash
   git clone <repository-url>
   cd myFirebase
   ```

2. **安裝 Firebase CLI**

   ```bash
   npm install -g firebase-tools
   ```

3. **登入 Firebase**

   ```bash
   firebase login
   ```

4. **初始化專案**

   ```bash
   firebase use --add
   ```

5. **安裝依賴**
   ```bash
   cd functions
   npm install
   ```

### 環境配置

1. **複製環境變數範例**

   ```bash
   cp functions/ENV_EXAMPLE.md functions/.env
   ```

2. **設定必要環境變數**

   ```bash
   # LINE Bot 配置
   LINE_CHANNEL_SECRET=your_line_channel_secret
   LINE_CHANNEL_ACCESS_TOKEN=your_line_channel_access_token

   # Google OAuth 配置
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   GOOGLE_REDIRECT_URI=your_redirect_uri
   ```

3. **設定 Firebase 環境變數**
   ```bash
   firebase functions:config:set line.channel_secret="your_line_channel_secret"
   firebase functions:config:set line.channel_access_token="your_line_channel_access_token"
   firebase functions:config:set google.client_id="your_google_client_id"
   firebase functions:config:set google.client_secret="your_google_client_secret"
   firebase functions:config:set google.redirect_uri="your_redirect_uri"
   ```

### 本地開發

```bash
# 啟動本地模擬器
cd functions
npm run serve

# 測試配置
npm run config:check

# 測試 Token 系統
node test-token-system.js

# 測試查詢系統
node test-query-system.js
```

### 部署

```bash
# 部署 Functions
cd functions
npm run deploy

# 或從根目錄部署整個專案
firebase deploy
```

## 📚 API 端點

### LINE Webhook

```
POST /lineWebhook    # 處理 LINE 訊息
GET  /lineWebhook    # 配置檢查
```

### 廣播功能

```
POST /broadcast      # 發送廣播訊息
```

### 系統監控

```
GET  /status         # 基本狀態
GET  /health         # 健康檢查
GET  /stats          # 詳細統計
```

### Token 管理

```
GET  /tokenStatus    # 檢查 token 狀態
POST /updateTokens   # 手動更新 token
POST /refreshTokens  # 手動刷新 token
GET  /tokenInfo      # 獲取 token 詳細資訊
GET  /testToken      # 測試 token 有效性
```

## 📖 詳細文檔

- **[Functions 詳細文檔](./functions/README.md)** - 完整的 Functions 使用說明
- **[Token 管理指南](./functions/TOKEN_MANAGEMENT_GUIDE.md)** - OAuth Token 管理詳細說明
- **[部署指南](./functions/DEPLOYMENT_GUIDE.md)** - 部署流程和注意事項
- **[本地測試指南](./functions/LOCAL_TESTING_GUIDE.md)** - 本地開發和測試方法
- **[錯誤處理指南](./functions/ERROR_HANDLING_REFACTOR_SUMMARY.md)** - 錯誤處理機制說明

## 🔧 開發指南

### 添加新功能

1. **新增服務**：在 `functions/src/services/` 目錄下創建新的服務類
2. **新增處理器**：在 `functions/src/handlers/` 目錄下創建新的處理器類
3. **新增工具**：在 `functions/src/utils/` 目錄下添加通用工具函數
4. **註冊端點**：在 `functions/src/index.js` 中導出新的函數

### 代碼風格

- 使用 ESLint 進行代碼檢查
- 遵循 Google JavaScript 風格指南
- 使用 TypeScript 風格的 JSDoc 註釋
- 統一的錯誤處理和回應格式

### 測試

```bash
# 測試配置
npm run config:check

# 測試今日行程
npm run test:today

# 測試查詢系統
npm run test:query

# 測試本地查詢
npm run test:local

# 互動式測試
npm run test:interactive
```

## 🔒 安全配置

### Firestore 安全規則

專案包含預設的 Firestore 安全規則，位於 `firestore.rules`。請根據您的需求調整：

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 允許讀取和寫入所有文檔（僅用於開發）
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

### 環境變數安全

- 所有敏感資訊都通過環境變數管理
- 使用 Firebase Functions 配置存儲敏感資料
- 本地開發時使用 `.env` 文件（不要提交到版本控制）

## 📊 監控和日誌

- 所有操作都會記錄到 Firebase Functions 日誌
- 使用結構化日誌格式
- 支援錯誤追蹤和性能監控
- 提供詳細的統計資訊

## 🚨 注意事項

1. **Webhook 安全性**：確保 LINE webhook 端點的安全性
2. **環境變數**：正確設定所有必要的環境變數
3. **權限設定**：確保 Firestore 安全規則正確配置
4. **配額限制**：注意 Firebase Functions 和 LINE API 的使用限制
5. **Token 安全**：確保 Google OAuth 憑證的安全性，定期輪換 token

## 🤝 貢獻

歡迎提交 Issue 和 Pull Request 來改善這個專案。

### 貢獻指南

1. Fork 專案
2. 創建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 開啟 Pull Request

## 📄 授權

本專案採用 MIT 授權條款 - 詳見 [LICENSE](LICENSE) 文件

## 📞 支援

如果您遇到問題或有任何問題，請：

1. 查看 [Issues](../../issues) 頁面
2. 查看詳細文檔
3. 創建新的 Issue

---

**開發者**: Kenneth Project  
**版本**: 1.0.0  
**最後更新**: 2024 年 12 月
