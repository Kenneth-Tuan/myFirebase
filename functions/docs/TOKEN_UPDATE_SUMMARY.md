# Google Calendar API Token 處理方式更新總結

## 📋 更新概述

本次更新將 Google Calendar API 的 token 處理方式從靜態環境變數改為動態 Firestore 存儲，實現了智能的 token 管理和自動刷新功能。

## 🎯 主要改進

### 1. 智能 Token 管理

- ✅ **自動刷新**：在 token 過期前 5 分鐘自動刷新
- ✅ **Firestore 存儲**：將 token 安全存儲在 `users/kenneth-project-a8d49` 文檔中
- ✅ **錯誤處理**：智能處理認證錯誤和重試機制
- ✅ **狀態監控**：實時監控 token 狀態和有效性

### 2. 新增核心組件

#### TokenService (`src/services/tokenService.js`)

- 核心 token 管理邏輯
- 自動刷新機制
- Firestore 讀寫操作
- 錯誤處理和重試

#### TokenHandler (`src/handlers/tokenHandler.js`)

- API 端點處理
- Token 狀態檢查
- 手動更新和刷新
- 詳細資訊獲取

#### 更新的 CalendarService (`src/services/calendarService.js`)

- 整合 TokenService
- 自動初始化
- 認證錯誤重試
- 回退到 API Key 認證

### 3. 新增 API 端點

| 端點             | 方法 | 功能                |
| ---------------- | ---- | ------------------- |
| `/tokenStatus`   | GET  | 檢查 token 狀態     |
| `/updateTokens`  | POST | 手動更新 token      |
| `/refreshTokens` | POST | 手動刷新 token      |
| `/tokenInfo`     | GET  | 獲取 token 詳細資訊 |
| `/testToken`     | GET  | 測試 token 有效性   |
| `/cleanupTokens` | POST | 清理過期 token      |

## 🔧 技術實現

### Firestore 數據結構

```javascript
users/
  └── kenneth-project-a8d49/
      ├── access_token: "ya29.a0AS3H6Nx1lpWsc-..."
      ├── refresh_token: "1//04wg3HCFlormxCgYIARAAGAQSNWF-..."
      ├── expiry_date: Timestamp
      └── updated_at: Timestamp
```

### 核心功能流程

1. **Token 讀取**：從 Firestore 讀取存儲的 token
2. **過期檢查**：檢查 token 是否即將過期（提前 5 分鐘）
3. **自動刷新**：如果過期，使用 refresh token 自動刷新
4. **存儲更新**：將新的 token 保存到 Firestore
5. **API 調用**：使用有效的 token 調用 Google Calendar API
6. **錯誤處理**：如果刷新失敗，拋出錯誤並要求重新授權

### 錯誤處理機制

- **Token 不存在**：拋出錯誤，要求重新授權
- **Token 過期**：自動嘗試刷新
- **刷新失敗**：拋出錯誤，要求重新授權
- **API 錯誤**：自動重新初始化並重試

## 📦 依賴更新

### 新增依賴

```json
{
  "google-auth-library": "^9.0.0"
}
```

### 更新的工具函數

- `responseFormatter.js`：添加 `formatSuccessResponse` 和 `formatErrorResponse`

## 🚀 部署和使用

### 部署步驟

1. 安裝新依賴：`npm install`
2. 部署函數：`npm run deploy`
3. 設置初始 token：使用 `/updateTokens` 端點

### 初始設置

```bash
curl -X POST https://your-function-url/updateTokens \
  -H "Content-Type: application/json" \
  -d '{
    "access_token": "your_access_token",
    "refresh_token": "your_refresh_token",
    "expiry_date": "2025-08-01T00:00:00.000Z"
  }'
```

### 監控和維護

```bash
# 檢查 token 狀態
curl https://your-function-url/tokenStatus

# 測試 token 有效性
curl https://your-function-url/testToken

# 手動刷新（如果需要）
curl -X POST https://your-function-url/refreshTokens
```

## 📊 測試和驗證

### 測試腳本

- `test-token-system.js`：完整的 token 管理系統測試

### 測試命令

```bash
node test-token-system.js
```

### 測試覆蓋範圍

- ✅ Token 狀態檢查
- ✅ Token 讀取和驗證
- ✅ 過期檢查邏輯
- ✅ Calendar 服務初始化
- ✅ 錯誤處理機制

## 🔒 安全考慮

### Token 安全

- Token 存儲在 Firestore 中，確保適當的安全規則
- 避免在日誌中記錄敏感 token 資訊
- 定期輪換 refresh token

### API 安全

- 考慮添加身份驗證機制
- 限制 API 調用頻率
- 使用適當的錯誤訊息

## 📈 性能優化

### 緩存機制

- Token 在服務實例中緩存
- 避免重複的 Firestore 讀取
- 智能的重新初始化機制

### 錯誤恢復

- 自動重試機制
- 回退到 API Key 認證
- 詳細的錯誤日誌

## 🎉 優勢總結

### 相比舊系統的改進

1. **自動化**：無需手動管理 token 刷新
2. **可靠性**：智能錯誤處理和重試機制
3. **可監控**：完整的狀態監控和 API 端點
4. **安全性**：安全的 token 存儲和管理
5. **可維護性**：模組化設計，易於維護和擴展

### 業務價值

- 減少手動干預
- 提高系統穩定性
- 改善用戶體驗
- 降低維護成本

## 📚 相關文檔

- [TOKEN_MANAGEMENT_GUIDE.md](./TOKEN_MANAGEMENT_GUIDE.md) - 詳細使用指南
- [README.md](./README.md) - 更新後的專案文檔
- [test-token-system.js](./test-token-system.js) - 測試腳本

## 🔄 後續計劃

- [ ] 多用戶 token 管理
- [ ] Token 自動輪換機制
- [ ] 更詳細的監控儀表板
- [ ] 自動化測試套件
- [ ] 性能優化

---

**更新完成時間**：2024 年 12 月
**版本**：v1.2.0
**狀態**：✅ 已完成並可部署
