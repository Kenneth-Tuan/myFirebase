# 模板系統部署指南

## 概述

本指南說明如何部署和測試新實現的訊息模板系統。

## 部署步驟

### 1. 檢查檔案結構

確保以下檔案都已正確創建：

```
src/
├── config/
│   ├── templates.js          # 模板配置
│   └── templateManager.js    # 模板管理工具
├── services/
│   └── templateService.js    # 模板服務
└── handlers/
    └── lineWebhookHandler.js # 已更新的 webhook 處理器
```

### 2. 本地測試

在部署前，先執行本地測試：

```bash
cd functions
node test-template-system.js
```

確保所有測試都通過。

### 3. 部署到 Firebase

```bash
# 部署函數
firebase deploy --only functions:lineWebhook

# 或者部署所有函數
firebase deploy --only functions
```

### 4. 驗證部署

部署完成後，檢查函數狀態：

```bash
firebase functions:list
```

## 功能測試

### 1. 基本功能測試

在 LINE 中發送以下訊息來測試功能：

#### 查看所有模板

```
訊息模板
```

**預期回應：** 包含所有可用模板的列表

#### 查看特定模板

```
模板: 日曆
模板: 廣播
模板: 通知
```

**預期回應：** 特定模板的詳細資訊

#### 查看統計

```
模板統計
```

**預期回應：** 模板使用統計資訊

### 2. 日曆功能測試

發送日曆事件訊息：

```
類型: 事件
標題: 測試會議
開始: 2024-01-15T14:00:00
結束: 2024-01-15T15:00:00
說明: 這是一個測試會議
```

**預期回應：** 日曆事件創建成功的確認訊息

### 3. 錯誤處理測試

發送無效訊息：

```
無效輸入
```

**預期回應：** 系統應該正確處理並不會崩潰

## 監控和日誌

### 查看日誌

```bash
# 查看即時日誌
firebase functions:log --only lineWebhook --follow

# 查看最近的日誌
firebase functions:log --only lineWebhook
```

### 關鍵日誌訊息

- `Processing template request` - 模板請求處理
- `Processing specific template request` - 特定模板查詢
- `Template added successfully` - 模板添加成功
- `Template removed successfully` - 模板移除成功

## 配置管理

### 添加新模板

1. 編輯 `src/config/templates.js`
2. 在 `templates` 對象中添加新模板
3. 在 `order` 數組中添加模板鍵值
4. 在 `categories` 對象中添加分類

### 修改觸發關鍵字

編輯 `src/config/templates.js` 中的 `trigger` 欄位：

```javascript
const MESSAGE_TEMPLATES = {
  trigger: "新關鍵字", // 修改這裡
  // ...
};
```

### 動態管理模板

使用 `TemplateManager` 類來動態管理模板：

```javascript
const TemplateManager = require("./src/config/templateManager");
const manager = new TemplateManager();

// 添加模板
manager.addTemplate("newFeature", newTemplate, "新功能分類");

// 移除模板
manager.removeTemplate("oldTemplate");

// 更新模板
manager.updateTemplate("existingTemplate", updates);
```

## 故障排除

### 常見問題

1. **模板不顯示**

   - 檢查觸發關鍵字是否正確
   - 確認模板配置格式正確
   - 查看函數日誌

2. **回應格式錯誤**

   - 檢查 `generateTemplateResponse()` 函數
   - 確認模板欄位完整
   - 驗證 JSON 格式

3. **函數部署失敗**
   - 檢查語法錯誤：`node -c src/handlers/lineWebhookHandler.js`
   - 確認所有依賴都已安裝
   - 檢查 Firebase 配置

### 日誌分析

```bash
# 查看錯誤日誌
firebase functions:log --only lineWebhook | grep ERROR

# 查看特定時間的日誌
firebase functions:log --only lineWebhook --since 1h
```

## 性能優化

### 快取策略

模板系統使用記憶體快取來提高性能：

- 模板配置在啟動時載入
- 使用統計在記憶體中維護
- 定期清理過期的快取資料

### 監控指標

監控以下指標來確保系統性能：

- 模板請求響應時間
- 記憶體使用量
- 錯誤率
- 用戶活躍度

## 安全考慮

### 權限控制

- 模板管理功能需要適當的權限控制
- 敏感操作需要驗證用戶身份
- 記錄所有管理操作

### 輸入驗證

- 所有用戶輸入都經過驗證
- 防止 XSS 攻擊
- 限制訊息長度

## 更新和維護

### 版本控制

- 使用 Git 管理程式碼變更
- 為每個版本添加標籤
- 維護更新日誌

### 備份策略

- 定期備份模板配置
- 導出模板設定
- 保存用戶自定義設定

### 回滾計劃

如果新版本有問題，可以快速回滾：

```bash
# 回滾到上一個版本
firebase functions:rollback lineWebhook

# 或者重新部署舊版本
git checkout v1.0.0
firebase deploy --only functions:lineWebhook
```

## 聯繫支援

如果遇到問題，請：

1. 查看日誌檔案
2. 檢查配置設定
3. 執行測試腳本
4. 聯繫開發團隊

---

**最後更新：** 2024-01-15
**版本：** 1.0.0
