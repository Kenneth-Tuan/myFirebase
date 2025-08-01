# Google OAuth Token 管理指南

## 概述

本指南說明如何使用新的 Google OAuth Token 管理系統，該系統將 token 存儲在 Firestore 中，並提供自動刷新和手動管理功能。

## 系統架構

### Firestore 結構

```
users/
  └── kenneth-project-a8d49/
      ├── access_token: "ya29.a0AS3H6Nx1lpWsc-..."
      ├── refresh_token: "1//04wg3HCFlormxCgYIARAAGAQSNWF-..."
      ├── expiry_date: Timestamp
      └── updated_at: Timestamp
```

### 核心組件

1. **TokenService** (`src/services/tokenService.js`) - 核心 token 管理邏輯
2. **TokenHandler** (`src/handlers/tokenHandler.js`) - API 端點處理
3. **CalendarService** (`src/services/calendarService.js`) - 更新後的日曆服務

## API 端點

### 1. 檢查 Token 狀態

```http
GET /tokenStatus
```

**回應範例：**

```json
{
  "success": true,
  "message": "Token status retrieved successfully",
  "data": {
    "status": "valid",
    "message": "Token is valid",
    "hasRefreshToken": true,
    "expiryDate": "2025-08-01T00:00:00.000Z"
  }
}
```

### 2. 手動更新 Token

```http
POST /updateTokens
Content-Type: application/json

{
  "access_token": "ya29.a0AS3H6Nx1lpWsc-...",
  "refresh_token": "1//04wg3HCFlormxCgYIARAAGAQSNWF-...",
  "expiry_date": "2025-08-01T00:00:00.000Z"
}
```

### 3. 手動刷新 Token

```http
POST /refreshTokens
```

### 4. 獲取 Token 詳細資訊

```http
GET /tokenInfo
```

### 5. 測試 Token 有效性

```http
GET /testToken
```

### 6. 清理 Token 資訊

```http
POST /cleanupTokens
```

## 使用流程

### 初始設置

1. **準備 Google OAuth 憑證**

   - 確保 `GOOGLE_CALENDAR_CREDENTIALS` 環境變數已設置
   - 憑證應包含 `client_id`、`client_secret` 和 `redirect_uris`

2. **手動設置初始 Token**
   ```bash
   curl -X POST https://your-function-url/updateTokens \
     -H "Content-Type: application/json" \
     -d '{
       "access_token": "your_access_token",
       "refresh_token": "your_refresh_token",
       "expiry_date": "2025-08-01T00:00:00.000Z"
     }'
   ```

### 日常使用

系統會自動處理以下情況：

1. **Token 有效** - 直接使用現有 token
2. **Token 即將過期** - 自動刷新（提前 5 分鐘）
3. **Token 已過期** - 使用 refresh token 自動刷新
4. **Refresh Token 失效** - 拋出錯誤，需要重新授權

### 監控和維護

1. **定期檢查 Token 狀態**

   ```bash
   curl https://your-function-url/tokenStatus
   ```

2. **測試 Token 有效性**

   ```bash
   curl https://your-function-url/testToken
   ```

3. **手動刷新（如果需要）**
   ```bash
   curl -X POST https://your-function-url/refreshTokens
   ```

## 錯誤處理

### 常見錯誤情況

1. **Token 不存在**

   ```json
   {
     "success": false,
     "message": "No tokens found. Please re-authorize.",
     "statusCode": 404
   }
   ```

2. **Token 刷新失敗**

   ```json
   {
     "success": false,
     "message": "Token refresh failed. Please re-authorize.",
     "statusCode": 401
   }
   ```

3. **認證錯誤**
   ```json
   {
     "success": false,
     "message": "Authentication failed",
     "statusCode": 403
   }
   ```

### 錯誤恢復步驟

1. **檢查 Firestore 中的 token**

   - 確認 `users/kenneth-project-a8d49` 文檔存在
   - 檢查 token 欄位是否完整

2. **重新授權流程**

   - 使用 Google OAuth 重新獲取 token
   - 調用 `/updateTokens` 端點更新 token

3. **驗證修復**
   - 調用 `/testToken` 確認 token 有效
   - 測試日曆功能是否正常

## 開發和測試

### 本地開發

1. **安裝依賴**

   ```bash
   cd functions
   npm install
   ```

2. **設置環境變數**

   ```bash
   export GOOGLE_CALENDAR_CREDENTIALS='{"client_id":"...","client_secret":"...","redirect_uris":["..."]}'
   ```

3. **啟動本地服務器**
   ```bash
   npm run serve
   ```

### 測試端點

1. **檢查狀態**

   ```bash
   curl http://localhost:5001/your-project/asia-east1/tokenStatus
   ```

2. **測試 token 有效性**
   ```bash
   curl http://localhost:5001/your-project/asia-east1/testToken
   ```

## 部署

### 部署到 Firebase

1. **安裝依賴**

   ```bash
   cd functions
   npm install
   ```

2. **部署函數**

   ```bash
   npm run deploy
   ```

3. **驗證部署**
   ```bash
   curl https://your-function-url/tokenStatus
   ```

### 環境變數設置

確保以下環境變數已設置：

- `GOOGLE_CALENDAR_CREDENTIALS` - Google OAuth 憑證
- `CALENDAR_API_KEY` - Google Calendar API Key（備用）

## 安全注意事項

1. **Token 存儲**

   - Token 存儲在 Firestore 中，確保適當的安全規則
   - 定期輪換 refresh token

2. **API 端點安全**

   - 考慮添加身份驗證機制
   - 限制 API 調用頻率

3. **日誌記錄**
   - 避免在日誌中記錄敏感 token 資訊
   - 使用適當的日誌級別

## 故障排除

### 常見問題

1. **Token 刷新失敗**

   - 檢查 refresh token 是否有效
   - 確認 Google OAuth 憑證正確
   - 檢查網路連接

2. **Firestore 連接問題**

   - 確認 Firebase 項目配置正確
   - 檢查 Firestore 規則

3. **環境變數問題**
   - 確認所有必要的環境變數已設置
   - 檢查環境變數格式是否正確

### 調試技巧

1. **啟用詳細日誌**

   ```bash
   firebase functions:log --only tokenStatus
   ```

2. **檢查 Firestore 數據**

   - 在 Firebase Console 中查看 `users` 集合
   - 確認 token 數據格式正確

3. **測試各個組件**
   - 單獨測試 TokenService
   - 測試 CalendarService 的初始化

## 更新日誌

- **v1.0.0** - 初始版本，支持基本的 token 管理
- **v1.1.0** - 添加自動刷新和錯誤處理
- **v1.2.0** - 添加 API 端點和監控功能
