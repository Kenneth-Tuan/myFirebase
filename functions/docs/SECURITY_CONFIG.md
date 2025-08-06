# 安全配置重構總結

## 🚨 問題解決

### 原始問題

- OAuth2 憑證直接寫在程式碼中
- 敏感資訊可能被提交到 GitHub
- 缺乏環境變數的安全管理

### 解決方案

- ✅ 將 OAuth2 憑證分離為獨立環境變數
- ✅ 實現安全的憑證管理機制
- ✅ 提供向後相容性支援
- ✅ 增強配置驗證和錯誤處理

## 🔧 重構內容

### 1. 配置管理改進 (`src/config/index.js`)

**新增功能：**

- 分離的 OAuth2 環境變數支援
- 智能憑證獲取機制
- 增強的配置驗證
- 詳細的環境檢查功能

**環境變數：**

```bash
# 推薦方式（分離變數）
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=your_redirect_uri

# 備用方式（完整 JSON）
GOOGLE_CALENDAR_CREDENTIALS={"client_id":"...","client_secret":"...","redirect_uris":["..."]}
```

### 2. TokenService 安全化 (`src/services/tokenService.js`)

**改進：**

- 使用安全的憑證獲取方式
- 移除硬編碼的憑證資訊
- 增強的錯誤處理和日誌記錄
- 支援多種憑證來源

### 3. 安全檔案管理

**新增檔案：**

- `.gitignore` - 完整的敏感檔案忽略規則
- `ENV_EXAMPLE.md` - 環境變數配置指南
- `test-config.js` - 配置檢查工具
- `SECURITY_CONFIG.md` - 本文件

## 🛡️ 安全改進

### 1. 憑證管理

- **分離存儲**：Client ID、Client Secret、Redirect URI 分別存儲
- **環境變數**：使用 Firebase Functions 環境變數
- **本地開發**：支援 `.env` 檔案（已加入 .gitignore）

### 2. 配置驗證

- **啟動時驗證**：應用程式啟動時檢查所有必需配置
- **詳細錯誤訊息**：提供清晰的配置問題說明
- **配置檢查工具**：`npm run config:check` 命令

### 3. 錯誤處理

- **優雅降級**：支援多種憑證配置方式
- **詳細日誌**：記錄憑證來源和配置狀態
- **安全錯誤訊息**：避免洩露敏感資訊

## 📋 使用指南

### 1. 設置環境變數

**Firebase Functions：**

```bash
firebase functions:config:set google.client_id="your_client_id"
firebase functions:config:set google.client_secret="your_client_secret"
firebase functions:config:set google.redirect_uri="your_redirect_uri"
```

**本地開發：**

```bash
# 創建 .env 檔案
LINE_CHANNEL_ACCESS_TOKEN=your_line_token
LINE_CHANNEL_SECRET=your_line_secret
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=your_redirect_uri
```

### 2. 驗證配置

```bash
# 檢查配置狀態
npm run config:check

# 部署前驗證
npm run config:validate
```

### 3. 部署

```bash
# 部署到 Firebase
npm run deploy
```

## 🔍 配置檢查

運行 `npm run config:check` 會顯示：

```
🔍 開始檢查配置...

📋 環境變數狀態:

📱 LINE Bot 配置:
  Channel Secret: ✅ 已設置 12345678...
  Channel Access Token: ✅ 已設置 87654321...

📅 Google Calendar 配置:
  API Key: ❌ 未設置
  Client ID: ✅ 已設置 12345678...
  Client Secret: ✅ 已設置 87654321...
  Redirect URI: ✅ 已設置 https://your-domain.com/auth/callback
  Legacy Credentials: ❌ 未設置
  Token: ❌ 未設置

🔐 配置驗證:
  配置驗證結果: ✅ 通過

🔑 OAuth2 憑證測試:
✅ OAuth2 憑證獲取成功
  Client ID: 12345678...
  Redirect URI: https://your-domain.com/auth/callback
  憑證來源: 環境變數

✅ 所有必需的配置都已正確設置！
```

## ⚠️ 重要注意事項

1. **永遠不要提交敏感檔案到 Git**
2. **定期輪換憑證和 token**
3. **使用最小權限原則**
4. **監控 API 使用量**
5. **定期檢查配置狀態**

## 🔄 遷移指南

### 從舊版本遷移

1. **備份現有配置**
2. **設置新的環境變數**
3. **運行配置檢查**
4. **測試功能正常**
5. **移除舊的硬編碼憑證**

### 向後相容性

- 仍支援 `GOOGLE_CALENDAR_CREDENTIALS` 環境變數
- 自動檢測並使用最佳可用的憑證來源
- 平滑遷移，無需立即修改現有配置

## 📞 支援

如果遇到配置問題：

1. 運行 `npm run config:check` 檢查狀態
2. 查看 Firebase Functions 日誌
3. 確認環境變數設置正確
4. 檢查 Google Cloud Console 配置

---

**最後更新：** 2024 年 12 月
**版本：** 2.0.0
**安全等級：** 🔒 高
