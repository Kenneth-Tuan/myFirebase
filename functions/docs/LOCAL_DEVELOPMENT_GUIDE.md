# 🚀 本地開發指南

本指南將教你如何像開發前端一樣在本地測試你的 Firebase Functions。

## 📋 快速開始

### 1. 啟動本地開發環境

```bash
# 進入 functions 目錄
cd functions

# 啟動所有模擬器（推薦）
npm run dev

# 或只啟動 Functions 模擬器
npm run dev:functions

# 或只啟動 Firestore 模擬器
npm run dev:firestore
```

### 2. 訪問本地服務

啟動後，你可以訪問以下服務：

- **Firebase Emulator UI**: http://localhost:4000
- **Functions 端點**: http://localhost:5001/your-project-id/asia-east1/functionName
- **Firestore 模擬器**: http://localhost:8080

## 🔧 本地開發配置

### 環境變數設置

創建 `.env.local` 文件（不會提交到版本控制）：

```bash
# 複製環境變數範例
cp docs/ENV_EXAMPLE.md .env.local
```

編輯 `.env.local` 文件：

```bash
# LINE Bot 配置
LINE_CHANNEL_SECRET=your_line_channel_secret
LINE_CHANNEL_ACCESS_TOKEN=your_line_channel_access_token

# Google OAuth 配置
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:5001/your-project-id/asia-east1/oauthCallback

# 本地開發配置
NODE_ENV=development
EMULATOR_HOST=localhost
EMULATOR_PORT=8080
```

### 本地測試配置

創建 `test-local-config.js` 文件：

```javascript
// test-local-config.js
const { initializeApp } = require("firebase-admin/app");
const {
  getFirestore,
  connectFirestoreEmulator,
} = require("firebase-admin/firestore");

// 初始化 Firebase Admin（本地模式）
const app = initializeApp();

// 連接到本地 Firestore 模擬器
const db = getFirestore(app);
connectFirestoreEmulator(db, "localhost", 8080);

module.exports = { app, db };
```

## 🧪 測試你的函數

### 1. 使用 cURL 測試

```bash
# 測試狀態端點
curl http://localhost:5001/your-project-id/asia-east1/status

# 測試健康檢查
curl http://localhost:5001/your-project-id/asia-east1/health

# 測試 Token 狀態
curl http://localhost:5001/your-project-id/asia-east1/tokenStatus

# 測試廣播功能
curl -X POST http://localhost:5001/your-project-id/asia-east1/broadcast \
  -H "Content-Type: application/json" \
  -d '{
    "message": "測試廣播訊息",
    "messageType": "text"
  }'
```

### 2. 使用 Postman 測試

1. 打開 Postman
2. 創建新的請求
3. 設置 URL: `http://localhost:5001/your-project-id/asia-east1/functionName`
4. 選擇適當的 HTTP 方法
5. 添加必要的 headers 和 body
6. 發送請求

### 3. 使用瀏覽器測試

對於 GET 請求，可以直接在瀏覽器中訪問：

```
http://localhost:5001/your-project-id/asia-east1/status
http://localhost:5001/your-project-id/asia-east1/health
http://localhost:5001/your-project-id/asia-east1/tokenStatus
```

## 🔄 熱重載開發

### 自動重載配置

Firebase 模擬器支援熱重載，當你修改代碼時會自動重啟函數：

```bash
# 啟動開發模式（自動重載）
npm run dev
```

### 監控日誌

在終端中你可以看到實時日誌：

```bash
# 查看 Functions 日誌
firebase functions:log

# 查看本地模擬器日誌
firebase emulators:start --only functions --debug
```

## 🗄️ 本地資料庫操作

### 使用 Firebase Emulator UI

1. 訪問 http://localhost:4000
2. 點擊 "Firestore" 標籤
3. 查看和編輯本地資料庫

### 使用 Firebase CLI

```bash
# 查看本地 Firestore 數據
firebase firestore:get --project demo-project

# 導入測試數據
firebase firestore:import --project demo-project ./test-data

# 導出本地數據
firebase firestore:export --project demo-project ./backup-data
```

## 🧪 單元測試

### 運行現有測試

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

### 創建新的測試

創建 `test-my-function.js`：

```javascript
const { initializeApp } = require("firebase-admin/app");
const {
  getFirestore,
  connectFirestoreEmulator,
} = require("firebase-admin/firestore");

// 初始化測試環境
const app = initializeApp();
const db = getFirestore(app);
connectFirestoreEmulator(db, "localhost", 8080);

// 測試你的函數
async function testMyFunction() {
  try {
    // 模擬請求
    const mockReq = {
      method: "GET",
      headers: {},
      body: {},
      query: {},
    };

    const mockRes = {
      status: (code) => ({
        json: (data) => {
          console.log("Response:", { status: code, data });
        },
      }),
    };

    // 導入並測試你的函數
    const { status } = require("../src/index.js");
    await status(mockReq, mockRes);
  } catch (error) {
    console.error("Test failed:", error);
  }
}

testMyFunction();
```

## 🔍 調試技巧

### 1. 使用 console.log

```javascript
exports.myFunction = onRequest(async (req, res) => {
  console.log("Request received:", req.method, req.url);
  console.log("Request body:", req.body);
  console.log("Request headers:", req.headers);

  // 你的函數邏輯
  res.json({ message: "Success" });
});
```

### 2. 使用 Firebase Emulator UI 調試

1. 訪問 http://localhost:4000
2. 點擊 "Functions" 標籤
3. 查看函數執行日誌
4. 檢查請求/回應

### 3. 使用 VS Code 調試

創建 `.vscode/launch.json`：

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Firebase Functions",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/functions/src/index.js",
      "env": {
        "NODE_ENV": "development",
        "FIRESTORE_EMULATOR_HOST": "localhost:8080"
      },
      "args": ["--inspect"]
    }
  ]
}
```

## 🚨 常見問題

### 1. Java 相關錯誤

如果你遇到 `Could not spawn 'java -version'` 錯誤，這表示缺少 Java 運行環境。

#### 解決方案 A：安裝 Java（推薦）

```bash
# 下載並安裝 Java 11+ 從 https://adoptium.net/
# 然後重新啟動終端並運行
npm run dev
```

#### 解決方案 B：只啟動 Functions 模擬器（不需要 Java）

```bash
# 只啟動 Functions 模擬器，不需要 Java
npm run dev:no-java
```

#### 解決方案 C：使用本地測試服務器（最簡單）

```bash
# 啟動本地測試服務器
npm run test:server

# 然後在瀏覽器訪問
# http://localhost:3000/status
# http://localhost:3000/health
# http://localhost:3000/tokenStatus
```

### 2. 端口被佔用

```bash
# 檢查端口使用情況
netstat -ano | findstr :5001
netstat -ano | findstr :8080
netstat -ano | findstr :4000

# 殺死佔用端口的進程
taskkill /PID <process_id> /F
```

### 2. 環境變數不生效

確保在 `functions/src/config/index.js` 中正確加載本地環境變數：

```javascript
require("dotenv").config({ path: ".env.local" });
```

### 3. Firestore 連接失敗

確保 Firestore 模擬器正在運行：

```bash
# 檢查模擬器狀態
firebase emulators:start --only firestore
```

## 📚 進階技巧

### 1. 模擬外部 API

創建 `mocks/external-apis.js`：

```javascript
// 模擬 LINE Bot API
const mockLineAPI = {
  reply: jest.fn().mockResolvedValue({}),
  push: jest.fn().mockResolvedValue({}),
  getProfile: jest.fn().mockResolvedValue({
    userId: "test-user",
    displayName: "Test User",
  }),
};

// 模擬 Google Calendar API
const mockCalendarAPI = {
  events: {
    insert: jest.fn().mockResolvedValue({
      data: { id: "test-event-id" },
    }),
  },
};

module.exports = { mockLineAPI, mockCalendarAPI };
```

### 2. 性能測試

創建 `test-performance.js`：

```javascript
const axios = require("axios");

async function performanceTest() {
  const startTime = Date.now();
  const requests = [];

  // 發送 100 個並發請求
  for (let i = 0; i < 100; i++) {
    requests.push(
      axios.get("http://localhost:5001/your-project-id/asia-east1/status")
    );
  }

  const responses = await Promise.all(requests);
  const endTime = Date.now();

  console.log(`處理 100 個請求耗時: ${endTime - startTime}ms`);
  console.log(`平均響應時間: ${(endTime - startTime) / 100}ms`);
}

performanceTest();
```

## 🎯 最佳實踐

1. **始終在本地測試**：部署前先在本地測試所有功能
2. **使用版本控制**：將測試數據和配置加入版本控制
3. **模擬真實環境**：盡可能模擬生產環境的條件
4. **記錄測試結果**：記錄測試結果和發現的問題
5. **定期清理**：定期清理本地測試數據

---

現在你可以像開發前端一樣愉快地開發和測試你的 Firebase Functions 了！🎉
