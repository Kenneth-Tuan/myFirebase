# 訊息模板系統使用指南

## 概述

訊息模板系統是一個可配置的模板管理工具，允許用戶通過 LINE 訊息快速查看和使用各種功能的模板格式。

## 基本使用

### 1. 查看所有模板

在 LINE 中發送以下訊息：

```
訊息模板
```

系統會回覆所有可用的模板列表，包括：

- 📅 日曆事件模板
- 📢 廣播訊息模板
- 🔔 通知功能模板
- 🔍 查詢功能模板
- 📊 統計功能模板
- ⚙️ 設定功能模板

### 2. 查看特定模板

輸入以下格式查看特定模板的詳細資訊：

```
模板: 日曆
模板: 廣播
模板: 通知
```

### 3. 查看使用統計

```
模板統計
```

## 模板詳情

### 📅 日曆事件模板

**用途：** 創建 Google Calendar 事件

**觸發格式：**

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

**範例：**

```
類型: 事件
標題: 週會
開始: 2024-01-15T14:00:00
結束: 2024-01-15T15:00:00
說明: 每週例行會議
```

### 📢 廣播訊息模板

**用途：** 發送廣播訊息到指定群組

**觸發格式：**

```
廣播: 訊息內容
群組: 群組ID1,群組ID2（可選，不填則廣播到所有群組）
類型: text（可選，預設為text）
延遲: 秒數（可選，延遲發送）
```

**範例：**

```
廣播: 大家好！這是一則廣播訊息。
類型: text
```

### 🔔 通知功能模板

**用途：** 發送系統通知

**觸發格式：**

```
通知: 通知內容
類型: info|warning|error|success
群組: 群組ID（可選）
用戶: 用戶ID（可選）
優先級: high|normal|low（可選）
```

**範例：**

```
通知: 系統維護通知
類型: info
```

### 🔍 查詢功能模板

**用途：** 查詢系統資訊

**觸發格式：**

```
查詢: 查詢類型
參數: 查詢參數（可選）
日期: 日期範圍（可選）
```

**範例：**

```
查詢: 群組列表
```

### 📊 統計功能模板

**用途：** 查詢統計資訊

**觸發格式：**

```
統計: 統計類型
時間: 時間範圍（可選）
群組: 群組ID（可選）
格式: json|csv|text（可選）
```

**範例：**

```
統計: 訊息數量
時間: 2024-01-01,2024-01-31
```

### ⚙️ 設定功能模板

**用途：** 修改系統設定

**觸發格式：**

```
設定: 設定項目
值: 設定值
```

**範例：**

```
設定: 語言
值: zh-TW
```

## 開發者指南

### 添加新模板

使用 `TemplateManager` 類來動態添加新模板：

```javascript
const TemplateManager = require("./config/templateManager");

const manager = new TemplateManager();

// 添加新模板
const newTemplate = {
  title: "🎯 新功能模板",
  description: "新功能的描述",
  template: `新功能: 參數
選項: 選項值`,
  examples: [
    {
      title: "基本使用",
      content: `新功能: 測試
選項: 預設值`,
    },
  ],
};

manager.addTemplate("newFeature", newTemplate, "新功能分類");
```

### 模板配置結構

每個模板包含以下欄位：

```javascript
{
  title: "模板標題",           // 必填
  description: "模板描述",     // 必填
  template: "模板格式",        // 必填
  examples: [                 // 可選
    {
      title: "範例標題",
      content: "範例內容"
    }
  ]
}
```

### 模板管理 API

```javascript
// 獲取模板列表
const list = manager.getTemplateList();

// 獲取特定模板
const detail = manager.getTemplateDetail("calendar");

// 搜尋模板
const results = manager.searchTemplates("會議");

// 更新模板
manager.updateTemplate("calendar", {
  description: "更新的描述",
});

// 移除模板
manager.removeTemplate("oldTemplate");

// 獲取分類
const categories = manager.getCategories();
```

## 配置檔案

模板配置位於 `src/config/templates.js`，包含：

- `trigger`: 觸發關鍵字
- `templates`: 模板定義
- `order`: 顯示順序
- `categories`: 分類定義

## 擴展功能

### 1. 自定義觸發關鍵字

修改 `templates.js` 中的 `trigger` 欄位：

```javascript
const MESSAGE_TEMPLATES = {
  trigger: "模板", // 改為其他關鍵字
  // ...
};
```

### 2. 添加新分類

在 `categories` 中添加新分類：

```javascript
categories: {
  calendar: "日曆功能",
  broadcast: "廣播功能",
  newCategory: "新功能分類",  // 添加新分類
}
```

### 3. 自定義回應格式

修改 `generateTemplateResponse()` 函數來自定義回應格式。

## 最佳實踐

1. **模板命名：** 使用有意義的鍵值，如 `calendar`、`broadcast`
2. **描述清晰：** 提供簡潔明瞭的模板描述
3. **範例豐富：** 提供多個實用的範例
4. **格式一致：** 保持模板格式的一致性
5. **分類合理：** 將相關功能歸類到同一分類

## 故障排除

### 常見問題

1. **模板不顯示**

   - 檢查觸發關鍵字是否正確
   - 確認模板配置格式正確

2. **回應格式錯誤**

   - 檢查 `generateTemplateResponse()` 函數
   - 確認模板欄位完整

3. **新增模板失敗**
   - 檢查模板格式驗證
   - 確認必填欄位完整

### 日誌檢查

查看 Firebase Functions 日誌來診斷問題：

```bash
firebase functions:log --only lineWebhook
```

## 更新記錄

- **v1.0.0**: 初始版本，支援基本模板功能
- **v1.1.0**: 添加模板管理工具
- **v1.2.0**: 支援動態模板添加和移除
- **v1.3.0**: 添加搜尋和分類功能
