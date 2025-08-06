# 錯誤處理重構總結

## 重構目標

將專案中 `@services/` 路徑下所有檔案中的 try-catch 裏的 logger，統一傳遞到外層 `@handlers/` 來處理，實現更好的錯誤處理架構。

## 重構內容

### 1. 創建統一錯誤處理工具 (`utils/errorHandler.js`)

#### 核心功能

- **ServiceError 類別**: 自定義錯誤類別，包含服務名稱、操作名稱、原始錯誤等資訊
- **錯誤分類**: 將錯誤分為認證、授權、驗證、網路、資料庫、外部 API、配置、未知等類型
- **錯誤嚴重程度**: 分為低、中、高、嚴重四個等級
- **錯誤分析**: 自動分析錯誤類型和嚴重程度
- **統一日誌記錄**: 根據錯誤嚴重程度選擇適當的日誌級別
- **錯誤回應格式化**: 統一的錯誤回應格式
- **服務調用包裝器**: `wrapServiceCall` 函數用於包裝服務調用

#### 主要函數

```javascript
// 包裝服務調用
wrapServiceCall(serviceCall, service, operation, context);

// 處理服務層錯誤
handleServiceError(error, service, operation, context);

// 格式化錯誤回應
formatErrorResponse(error, includeDetails);

// 記錄錯誤
logError(error, context);

// 獲取錯誤建議
getErrorRecommendations(error);
```

### 2. 重構 Services 層

#### 移除的內容

- 所有 `try-catch` 區塊
- 所有 `logger` 調用
- 錯誤處理邏輯

#### 重構的檔案

- `calendarService.js`: 移除 15+ 個 try-catch 區塊
- `firestoreService.js`: 移除 8+ 個 try-catch 區塊
- `lineService.js`: 移除 6+ 個 try-catch 區塊
- `templateService.js`: 移除 7+ 個 try-catch 區塊
- `tokenService.js`: 移除 12+ 個 try-catch 區塊

#### 重構前後對比

```javascript
// 重構前
async createEvent(eventData) {
  try {
    logger.info("開始創建 Google Calendar 事件:", eventData);
    // ... 業務邏輯
    logger.info("✅ Google Calendar 事件創建成功:", response.data.id);
    return result;
  } catch (error) {
    logger.error("❌ 創建 Google Calendar 事件失敗:", error);
    throw error;
  }
}

// 重構後
async createEvent(eventData) {
  // ... 業務邏輯
  return result;
}
```

### 3. 更新 Handlers 層

#### 新增錯誤處理工具導入

```javascript
const {
  handleServiceError,
  formatErrorResponse,
  logError,
  getErrorRecommendations,
  wrapServiceCall,
} = require("../utils/errorHandler");
```

#### 使用 wrapServiceCall 包裝服務調用

```javascript
// 重構前
async handleLineEvent(event) {
  try {
    // ... 業務邏輯
    return result;
  } catch (error) {
    logger.error("Handle LINE event failed:", error);
    throw error;
  }
}

// 重構後
async handleLineEvent(event) {
  return await wrapServiceCall(
    async () => {
      // ... 業務邏輯
      return result;
    },
    "line_webhook",
    "handleLineEvent",
    { eventType: event.type, sourceType: event.source && event.source.type }
  );
}
```

#### 統一的錯誤回應格式

```javascript
// 重構前
res.status(500).json({
  success: false,
  error: error.message,
  oauthFlow: "web_server",
});

// 重構後
const errorResponse = formatErrorResponse(error);
logError(error, {
  handler: "handleOAuthCallback",
  requestMethod: req.method,
  requestUrl: req.url,
});

res.status(500).json({
  ...errorResponse,
  oauthFlow: "web_server",
});
```

## 重構優勢

### 1. 架構清晰

- **職責分離**: Services 層專注業務邏輯，Handlers 層負責錯誤處理
- **統一管理**: 所有錯誤處理邏輯集中在 `errorHandler.js`
- **可維護性**: 錯誤處理邏輯集中，易於維護和更新

### 2. 錯誤處理增強

- **錯誤分類**: 自動識別錯誤類型和嚴重程度
- **詳細日誌**: 包含服務名稱、操作名稱、上下文資訊
- **錯誤建議**: 根據錯誤類型提供解決建議
- **統一格式**: 標準化的錯誤回應格式

### 3. 開發體驗改善

- **減少重複代碼**: 移除大量重複的 try-catch 區塊
- **簡化服務層**: Services 層代碼更簡潔，專注業務邏輯
- **易於調試**: 統一的錯誤格式和詳細的上下文資訊

### 4. 運維優勢

- **監控友好**: 結構化的錯誤日誌便於監控和分析
- **故障排查**: 詳細的錯誤資訊和建議有助於快速定位問題
- **性能優化**: 統一的錯誤處理減少重複代碼，提升性能

## 使用方式

### 1. 在 Handlers 中使用

```javascript
// 導入錯誤處理工具
const { wrapServiceCall, formatErrorResponse, logError } = require("../utils/errorHandler");

// 包裝服務調用
const result = await wrapServiceCall(
  async () => {
    return await someService.someOperation();
  },
  "service_name",
  "operation_name",
  { context: "additional_info" }
);

// 處理錯誤
} catch (error) {
  const errorResponse = formatErrorResponse(error);
  logError(error, { handler: "handler_name" });
  res.status(500).json(errorResponse);
}
```

### 2. 錯誤回應格式

```javascript
{
  "success": false,
  "error": {
    "message": "錯誤訊息",
    "type": "authentication",
    "severity": "high",
    "service": "calendar_service",
    "operation": "createEvent",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

## 注意事項

1. **向後兼容**: 重構保持 API 介面不變，確保向後兼容
2. **錯誤傳遞**: Services 層的錯誤會自動傳遞到 Handlers 層處理
3. **日誌級別**: 根據錯誤嚴重程度自動選擇適當的日誌級別
4. **上下文資訊**: 保留詳細的錯誤上下文資訊便於調試

## 後續改進

1. **錯誤監控**: 可以基於統一的錯誤格式建立錯誤監控系統
2. **自動重試**: 可以為特定類型的錯誤實現自動重試機制
3. **錯誤統計**: 可以統計和分析不同類型的錯誤發生頻率
4. **告警機制**: 可以為嚴重錯誤設置自動告警機制
