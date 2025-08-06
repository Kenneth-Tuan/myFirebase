# 測試文件目錄

這個目錄包含所有測試相關的文件。

## 📁 文件結構

```
tests/
├── README.md                    # 測試目錄說明（本文件）
├── test-config.js               # 配置測試
├── test-local-server.js         # 本地測試服務器
├── test-token-system.js         # Token 系統測試
├── test-query-system.js         # 查詢系統測試
├── test-today-schedule.js       # 今日行程測試
├── test-local-query.js          # 本地查詢測試
├── test-interactive.js          # 互動式測試
├── test-modules.js              # 模組載入測試
└── test-query-logic.js          # 查詢邏輯測試
```

## 🧪 測試類型

### 1. 配置測試

- `test-config.js` - 檢查環境變數和配置是否正確

### 2. 本地開發測試

- `test-local-server.js` - 啟動本地測試服務器，模擬 Firebase Functions 環境

### 3. 功能測試

- `test-token-system.js` - 測試 Google OAuth Token 管理系統
- `test-query-system.js` - 測試日曆查詢系統
- `test-today-schedule.js` - 測試今日行程功能
- `test-local-query.js` - 測試本地查詢功能

### 4. 系統測試

- `test-modules.js` - 測試所有模組是否能正確載入
- `test-interactive.js` - 互動式測試工具
- `test-query-logic.js` - 測試查詢邏輯

## 🚀 使用方法

### 運行所有測試

```bash
# 從 functions 目錄運行
npm run config:check     # 檢查配置
npm run test:today       # 測試今日行程
npm run test:query       # 測試查詢系統
npm run test:local       # 測試本地查詢
npm run test:interactive # 互動式測試
npm run test:server      # 啟動本地測試服務器
```

### 直接運行測試文件

```bash
# 從 functions 目錄運行
node tests/test-config.js
node tests/test-token-system.js
node tests/test-local-server.js
```

## 📋 測試腳本說明

### test-config.js

檢查所有必要的環境變數和配置是否正確設置。

### test-local-server.js

啟動一個本地 Express 服務器，模擬 Firebase Functions 環境，方便本地測試。

### test-token-system.js

測試 Google OAuth Token 的獲取、刷新和管理功能。

### test-query-system.js

測試 Google Calendar 查詢功能，包括事件檢索和處理。

### test-today-schedule.js

測試今日行程功能，檢查是否能正確獲取今天的日曆事件。

### test-modules.js

測試所有模組是否能正確載入，包括服務、處理器和工具函數。

## 🔧 開發新測試

當你添加新功能時，建議創建對應的測試文件：

1. **功能測試** - 測試特定功能的邏輯
2. **整合測試** - 測試多個模組的協作
3. **端到端測試** - 測試完整的用戶流程

### 測試文件命名規範

- 使用 `test-` 前綴
- 使用 kebab-case 命名
- 描述測試的主要功能

### 測試文件結構

```javascript
/**
 * 測試描述
 * 說明這個測試文件的目的和範圍
 */

// 導入必要的模組
const TestModule = require("../src/modules/testModule");

// 測試函數
async function testFunction() {
  try {
    // 測試邏輯
    console.log("✅ 測試通過");
  } catch (error) {
    console.error("❌ 測試失敗:", error);
  }
}

// 運行測試
testFunction();
```

## 🚨 注意事項

1. **路徑引用** - 所有測試文件都使用相對路徑 `../src/` 來引用源碼
2. **環境變數** - 確保在運行測試前設置好必要的環境變數
3. **依賴安裝** - 確保所有測試依賴都已安裝
4. **錯誤處理** - 測試文件應該包含適當的錯誤處理

---

詳細的測試說明請參考各個測試文件的註釋。
