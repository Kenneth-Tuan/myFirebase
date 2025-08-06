# 本地測試指南

## 概述

本指南將幫助您在本地測試新實現的查詢功能，無需部署到 Firebase 即可驗證功能是否正常運作。

## 前置需求

### 1. 環境配置
確保您已經設置了必要的環境變數：

```bash
# 檢查配置
npm run config:check
```

### 2. Google Calendar 授權
確保您已經完成了 Google Calendar 的授權流程：

```bash
# 檢查 token 狀態
npm run test:today
```

## 測試方法

### 1. 自動化測試

#### 基本功能測試
```bash
# 測試今日行程查詢功能
npm run test:today

# 測試查詢系統功能
npm run test:query

# 測試本地查詢處理
npm run test:local
```

#### 測試內容
- ✅ 今日行程查詢
- ✅ 特定日期查詢
- ✅ 過去日期查詢
- ✅ 無效日期處理
- ✅ 查詢格式解析
- ✅ 錯誤處理

### 2. 互動式測試

#### 啟動互動式測試
```bash
npm run test:interactive
```

#### 可用的查詢格式
```
# 今日行程查詢
查詢: 今日行程

# 特定日期查詢
查詢: 日曆事件
日期: 2024-01-15

# 群組列表查詢
查詢: 群組列表

# 系統統計查詢
查詢: 系統統計
```

#### 特殊命令
- `help` - 顯示幫助信息
- `clear` - 清空螢幕
- `exit` - 退出測試

### 3. 手動測試

#### 測試特定查詢
```bash
# 直接測試特定查詢
node -e "
const { MockQueryHandler } = require('./test-local-query');
const handler = new MockQueryHandler();
const event = {
  type: 'message',
  message: { type: 'text', text: '查詢: 今日行程' },
  replyToken: 'test-token',
  source: { userId: 'test-user', type: 'user' }
};
handler.handleQueryMessage(event);
"
```

## 測試案例

### 1. 正常查詢測試

#### 今日行程查詢
```
輸入: 查詢: 今日行程
預期: 顯示今日的所有行程
```

#### 特定日期查詢
```
輸入: 查詢: 日曆事件
     日期: 2024-01-15
預期: 顯示指定日期的所有行程
```

#### 無日期查詢（預設今日）
```
輸入: 查詢: 日曆事件
預期: 顯示今日的所有行程
```

### 2. 錯誤處理測試

#### 格式錯誤
```
輸入: 錯誤格式
預期: 顯示格式錯誤提示
```

#### 不支援的查詢類型
```
輸入: 查詢: 不存在的類型
預期: 顯示不支援的查詢類型錯誤
```

#### 日期格式錯誤
```
輸入: 查詢: 日曆事件
     日期: 2024/01/15
預期: 顯示日期格式錯誤提示
```

### 3. 邊界情況測試

#### 空查詢
```
輸入: (空字串)
預期: 提示輸入有效查詢內容
```

#### 無行程日期
```
輸入: 查詢: 日曆事件
     日期: 2024-12-25
預期: 顯示該日期沒有行程的訊息
```

## 預期輸出格式

### 成功查詢回應
```
📅 2024年01月15日 的行程

共找到 3 個行程：

1. 團隊會議
   ⏰ 09:00 - 10:00
   📍 會議室A
   📝 討論本週工作進度...

2. 客戶拜訪
   ⏰ 14:00 - 15:30
   📍 台北市信義區

💡 點擊以下連結查看完整日曆：
https://calendar.google.com
```

### 無行程回應
```
📅 2024年01月15日 的行程

🎉 今天沒有安排任何行程，可以好好休息！
```

### 錯誤回應
```
❌ 查詢格式錯誤，請使用正確的格式：
查詢: 查詢類型
日期: 日期（可選）
```

## 故障排除

### 常見問題

#### 1. 配置錯誤
**問題：** 顯示配置錯誤
**解決：**
```bash
# 檢查配置
npm run config:check

# 設置環境變數
export GOOGLE_CLIENT_ID="your-client-id"
export GOOGLE_CLIENT_SECRET="your-client-secret"
export GOOGLE_REDIRECT_URI="your-redirect-uri"
```

#### 2. 授權錯誤
**問題：** 顯示需要重新授權
**解決：**
```bash
# 重新進行授權流程
# 訪問授權 URL 並完成授權
```

#### 3. 網路錯誤
**問題：** 顯示網路連線問題
**解決：**
- 檢查網路連線
- 確認防火牆設定
- 檢查代理設定

#### 4. 日期格式錯誤
**問題：** 日期查詢失敗
**解決：**
- 使用正確的日期格式：YYYY-MM-DD
- 例如：2024-01-15

### 調試技巧

#### 1. 啟用詳細日誌
```bash
# 設置環境變數啟用詳細日誌
export DEBUG=*

# 運行測試
npm run test:local
```

#### 2. 檢查 API 回應
```bash
# 測試 Calendar API 連接
node -e "
const CalendarService = require('./src/services/calendarService');
const service = new CalendarService();
service.checkStatus().then(console.log);
"
```

#### 3. 驗證 Token 狀態
```bash
# 檢查 token 是否有效
node -e "
const TokenService = require('./src/services/tokenService');
const service = new TokenService();
service.checkTokenStatus().then(console.log);
"
```

## 測試檢查清單

### 功能測試
- [ ] 今日行程查詢正常
- [ ] 特定日期查詢正常
- [ ] 無日期查詢預設為今日
- [ ] 錯誤格式處理正確
- [ ] 不支援類型處理正確
- [ ] 日期格式驗證正確

### 回應格式測試
- [ ] 有行程時格式正確
- [ ] 無行程時格式正確
- [ ] 錯誤訊息格式正確
- [ ] 表情符號顯示正確

### 錯誤處理測試
- [ ] 配置錯誤處理
- [ ] 授權錯誤處理
- [ ] 網路錯誤處理
- [ ] 日期格式錯誤處理

## 下一步

完成本地測試後，您可以：

1. **部署到 Firebase**
   ```bash
   npm run deploy
   ```

2. **在 LINE 中測試**
   - 發送 `查詢: 今日行程`
   - 發送 `查詢: 日曆事件\n日期: 2024-01-15`

3. **監控日誌**
   ```bash
   firebase functions:log --only lineWebhook
   ```

## 總結

本地測試讓您可以在部署前驗證功能是否正常運作，節省時間並提高開發效率。使用互動式測試可以模擬真實的用戶使用場景，確保功能符合預期。 