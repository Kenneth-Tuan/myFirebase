# 遷移指南：從舊架構到模組化架構

## 📋 變更概述

本次重構將原本單一的 `index.js` 文件拆分為模組化的架構，提高了代碼的可維護性和可擴展性。

## 🔄 主要變更

### 1. 文件結構重組

**舊結構：**

```
functions/
├── index.js          # 單一入口文件（548行）
├── package.json
└── ...
```

**新結構：**

```
functions/
├── src/
│   ├── config/
│   │   └── index.js          # 配置管理
│   ├── services/
│   │   ├── lineService.js    # LINE Bot 服務
│   │   ├── calendarService.js # Google Calendar 服務
│   │   └── firestoreService.js # Firestore 服務
│   ├── handlers/
│   │   ├── lineWebhookHandler.js # LINE Webhook 處理
│   │   ├── broadcastHandler.js   # 廣播功能處理
│   │   └── statusHandler.js      # 狀態檢查處理
│   ├── utils/
│   │   ├── errorHandler.js       # 錯誤處理
│   │   └── responseFormatter.js  # 回應格式化
│   └── index.js              # 主入口文件
├── index.js.backup           # 舊文件備份
├── package.json
└── ...
```

### 2. 功能模組化

| 舊功能          | 新模組                           | 說明              |
| --------------- | -------------------------------- | ----------------- |
| LINE 配置       | `config/index.js`                | 集中管理環境變數  |
| LINE Bot 操作   | `services/lineService.js`        | LINE API 相關操作 |
| Google Calendar | `services/calendarService.js`    | 日曆事件管理      |
| Firestore 操作  | `services/firestoreService.js`   | 資料庫操作        |
| Webhook 處理    | `handlers/lineWebhookHandler.js` | LINE 事件處理     |
| 廣播功能        | `handlers/broadcastHandler.js`   | 群組廣播          |
| 狀態檢查        | `handlers/statusHandler.js`      | 系統監控          |
| 錯誤處理        | `utils/errorHandler.js`          | 統一錯誤處理      |
| 回應格式化      | `utils/responseFormatter.js`     | 統一回應格式      |

### 3. 新增功能

- **健康檢查端點** (`/health`)
- **詳細統計端點** (`/stats`)
- **統一的錯誤處理機制**
- **結構化的日誌記錄**
- **更好的配置驗證**

## 🚀 部署步驟

### 1. 備份當前版本

```bash
# 舊文件已自動備份為 index.js.backup
cd functions
ls -la index.js.backup  # 確認備份存在
```

### 2. 更新 package.json

```json
{
  "main": "src/index.js" // 已更新
}
```

### 3. 部署新版本

```bash
npm run deploy
```

### 4. 驗證功能

```bash
# 檢查狀態
curl https://asia-east1-kenneth-project-a8d49.cloudfunctions.net/status

# 檢查健康狀態
curl https://asia-east1-kenneth-project-a8d49.cloudfunctions.net/health

# 檢查詳細統計
curl https://asia-east1-kenneth-project-a8d49.cloudfunctions.net/stats
```

## 🔧 環境變數

環境變數保持不變，但現在有更好的驗證機制：

```bash
# 必要變數
LINE_CHANNEL_SECRET=your_line_channel_secret
LINE_CHANNEL_ACCESS_TOKEN=your_line_channel_access_token

# Google Calendar（選擇其一）
CALENDAR_API_KEY=your_google_calendar_api_key
# 或
GOOGLE_CALENDAR_CREDENTIALS={"client_id":"...","client_secret":"...","redirect_uris":["..."]}
GOOGLE_CALENDAR_TOKEN={"access_token":"...","refresh_token":"..."}
```

## 📊 API 端點對比

| 功能         | 舊端點         | 新端點         | 變更        |
| ------------ | -------------- | -------------- | ----------- |
| LINE Webhook | `/lineWebhook` | `/lineWebhook` | ✅ 保持不變 |
| 群組廣播     | `/broadcast`   | `/broadcast`   | ✅ 保持不變 |
| 狀態檢查     | `/status`      | `/status`      | ✅ 保持不變 |
| 健康檢查     | ❌ 無          | `/health`      | 🆕 新增     |
| 詳細統計     | ❌ 無          | `/stats`       | 🆕 新增     |

## 🔍 測試檢查清單

### 基本功能測試

- [ ] LINE Webhook 正常接收訊息
- [ ] 群組廣播功能正常
- [ ] 日曆事件創建正常
- [ ] 狀態檢查端點正常

### 新增功能測試

- [ ] 健康檢查端點 (`/health`)
- [ ] 詳細統計端點 (`/stats`)
- [ ] 錯誤處理機制
- [ ] 日誌記錄

### 配置驗證

- [ ] 環境變數驗證
- [ ] LINE 配置檢查
- [ ] Google Calendar 配置檢查
- [ ] Firestore 連接檢查

## 🚨 回滾方案

如果新版本出現問題，可以快速回滾：

```bash
cd functions
mv index.js.backup index.js
npm run deploy
```

## 📈 性能改進

### 1. 代碼組織

- 單一職責原則：每個模組只負責特定功能
- 依賴注入：服務之間鬆耦合
- 可測試性：每個模組都可以獨立測試

### 2. 錯誤處理

- 統一的錯誤處理機制
- 更好的錯誤分類和日誌記錄
- Webhook 安全錯誤回應

### 3. 監控和維護

- 詳細的系統統計
- 健康檢查機制
- 結構化的日誌格式

## 🔮 未來擴展

新的模組化架構為未來功能擴展提供了良好的基礎：

### 容易添加的新功能

- 新的 webhook 處理器
- 新的服務模組
- 新的工具函數
- 新的 API 端點

### 建議的下一步

1. 添加單元測試
2. 實現更多 LINE 功能
3. 添加用戶管理
4. 實現更複雜的日曆功能
5. 添加管理後台

## 📞 支援

如果在遷移過程中遇到問題：

1. 檢查 Firebase Functions 日誌
2. 使用健康檢查端點診斷問題
3. 查看詳細統計資訊
4. 必要時使用回滾方案

## ✅ 遷移完成檢查

- [ ] 新架構部署成功
- [ ] 所有端點正常運作
- [ ] 功能測試通過
- [ ] 日誌記錄正常
- [ ] 性能表現良好
- [ ] 備份文件保留

---

**注意：** 舊的 `index.js.backup` 文件將保留 30 天，之後可以安全刪除。
