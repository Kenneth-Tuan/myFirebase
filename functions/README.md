# Firebase Functions - LINE Bot Webhook

這是一個模組化的 Firebase Functions 專案，整合了 LINE Bot Webhook 和 Google Calendar 功能。

## 📁 專案結構

```
functions/
├── README.md                    # 主要說明文件（本文件）
├── package.json                 # 依賴配置
├── src/                         # 源碼目錄
│   ├── config/                  # 配置管理
│   ├── services/                # 業務邏輯服務
│   ├── handlers/                # 請求處理器
│   ├── utils/                   # 工具函數
│   └── index.js                 # 主入口文件
├── docs/                        # 詳細文檔
│   ├── LOCAL_DEVELOPMENT_GUIDE.md
│   ├── TOKEN_MANAGEMENT_GUIDE.md
│   ├── DEPLOYMENT_GUIDE.md
│   └── ...
└── tests/                       # 測試文件
    ├── test-config.js
    ├── test-local-server.js
    └── ...
```

## 🚀 快速開始

### 安裝依賴

```bash
npm install
```

### 本地開發

```bash
# 啟動本地測試服務器（推薦，不需要 Java）
npm run test:server

# 或啟動 Firebase 模擬器
npm run dev:no-java
```

### 測試

```bash
# 測試配置
npm run config:check

# 測試今日行程
npm run test:today

# 測試查詢系統
npm run test:query
```

## 📚 詳細文檔

所有詳細文檔都在 `docs/` 目錄下：

- **[本地開發指南](./docs/LOCAL_DEVELOPMENT_GUIDE.md)** - 完整的本地開發和測試方法
- **[Token 管理指南](./docs/TOKEN_MANAGEMENT_GUIDE.md)** - OAuth Token 管理詳細說明
- **[部署指南](./docs/DEPLOYMENT_GUIDE.md)** - 部署流程和注意事項
- **[錯誤處理指南](./docs/ERROR_HANDLING_REFACTOR_SUMMARY.md)** - 錯誤處理機制說明

## 🧪 測試文件

所有測試文件都在 `tests/` 目錄下：

- `test-config.js` - 配置測試
- `test-local-server.js` - 本地測試服務器
- `test-token-system.js` - Token 系統測試
- `test-query-system.js` - 查詢系統測試

## 🔧 開發腳本

```bash
# 開發相關
npm run dev              # 啟動完整模擬器
npm run dev:functions    # 只啟動 Functions 模擬器
npm run dev:no-java      # 啟動 Functions 模擬器（不需要 Java）
npm run test:server      # 啟動本地測試服務器

# 測試相關
npm run config:check     # 檢查配置
npm run test:today       # 測試今日行程
npm run test:query       # 測試查詢系統
npm run test:local       # 測試本地查詢
npm run test:interactive # 互動式測試

# 部署相關
npm run deploy           # 部署到 Firebase
npm run logs             # 查看日誌
```

## 🚨 常見問題

如果遇到 Java 相關錯誤，請參考 [本地開發指南](./docs/LOCAL_DEVELOPMENT_GUIDE.md) 中的解決方案。

---

詳細使用說明請參考 `docs/` 目錄下的相關文檔。
