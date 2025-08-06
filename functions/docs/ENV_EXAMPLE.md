# 環境變數配置指南

## 安全配置 OAuth2 憑證

為了避免將敏感憑證資訊提交到版本控制系統，請使用以下方式配置環境變數：

### 1. 推薦方式：分離的環境變數

在 Firebase Functions 中設置以下環境變數：

```bash
# LINE Bot 配置
LINE_CHANNEL_ACCESS_TOKEN=your_line_channel_access_token_here
LINE_CHANNEL_SECRET=your_line_channel_secret_here

# Google Calendar OAuth2 配置（推薦）
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=https://your-domain.com/auth/callback
```

### 2. 備用方式：完整的憑證 JSON

如果無法使用分離的環境變數，可以使用完整的憑證 JSON：

```bash
GOOGLE_CALENDAR_CREDENTIALS={"client_id":"...","client_secret":"...","redirect_uris":["..."]}
```

### 3. 設置 Firebase Functions 環境變數

使用 Firebase CLI 設置環境變數：

```bash
# 設置單個環境變數
firebase functions:config:set google.client_id="your_client_id"
firebase functions:config:set google.client_secret="your_client_secret"
firebase functions:config:set google.redirect_uri="your_redirect_uri"

# 設置 LINE 配置
firebase functions:config:set line.channel_access_token="your_line_token"
firebase functions:config:set line.channel_secret="your_line_secret"
```

### 4. 本地開發環境

創建 `.env` 檔案（確保已加入 .gitignore）：

```bash
# .env 檔案內容
LINE_CHANNEL_ACCESS_TOKEN=your_line_channel_access_token_here
LINE_CHANNEL_SECRET=your_line_channel_secret_here
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=https://your-domain.com/auth/callback
```

## 安全注意事項

1. **永遠不要將 `.env` 檔案提交到 Git**
2. **使用 Firebase Functions 環境變數而不是硬編碼**
3. **定期輪換憑證和 token**
4. **使用最小權限原則配置 Google API 權限**
5. **監控 API 使用量和異常活動**

## 驗證配置

部署後，可以檢查配置是否正確：

```bash
# 檢查環境變數
firebase functions:config:get

# 在程式碼中使用配置檢查功能
# 會顯示哪些配置已設置，哪些缺失
```

## 故障排除

如果遇到憑證相關錯誤：

1. 確認所有必需的環境變數都已設置
2. 檢查 Google Cloud Console 中的 OAuth2 憑證是否正確
3. 確認 redirect URI 與 Google Cloud Console 中設置的一致
4. 檢查 Firebase Functions 日誌中的詳細錯誤訊息
