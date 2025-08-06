/**
 * 配置檢查測試腳本
 * 用於驗證環境變數和 OAuth2 憑證配置是否正確
 */

const {
  validateConfig,
  getEnvironmentCheck,
  getOAuth2Credentials,
} = require("../src/config");

console.log("🔍 開始檢查配置...\n");

try {
  // 檢查環境變數狀態
  console.log("📋 環境變數狀態:");
  const envCheck = getEnvironmentCheck();

  // LINE 配置檢查
  console.log("\n📱 LINE Bot 配置:");
  console.log(
    `  Channel Secret: ${
      envCheck.line.channelSecret.exists ? "✅ 已設置" : "❌ 未設置"
    } ${envCheck.line.channelSecret.preview}`
  );
  console.log(
    `  Channel Access Token: ${
      envCheck.line.channelAccessToken.exists ? "✅ 已設置" : "❌ 未設置"
    } ${envCheck.line.channelAccessToken.preview}`
  );

  // Google Calendar 配置檢查
  console.log("\n📅 Google Calendar 配置:");
  console.log(
    `  API Key: ${envCheck.calendar.apiKey.exists ? "✅ 已設置" : "❌ 未設置"}`
  );
  console.log(
    `  Client ID: ${
      envCheck.calendar.clientId.exists ? "✅ 已設置" : "❌ 未設置"
    } ${envCheck.calendar.clientId.preview}`
  );
  console.log(
    `  Client Secret: ${
      envCheck.calendar.clientSecret.exists ? "✅ 已設置" : "❌ 未設置"
    } ${envCheck.calendar.clientSecret.preview}`
  );
  console.log(
    `  Redirect URI: ${
      envCheck.calendar.redirectUri.exists ? "✅ 已設置" : "❌ 未設置"
    } ${envCheck.calendar.redirectUri.value}`
  );
  console.log(
    `  Legacy Credentials: ${
      envCheck.calendar.credentials.exists ? "✅ 已設置" : "❌ 未設置"
    }`
  );
  console.log(
    `  Token: ${envCheck.calendar.token.exists ? "✅ 已設置" : "❌ 未設置"}`
  );

  // 驗證配置
  console.log("\n🔐 配置驗證:");
  const isValid = validateConfig();
  console.log(`  配置驗證結果: ${isValid ? "✅ 通過" : "❌ 失敗"}`);

  if (isValid) {
    // 測試 OAuth2 憑證獲取
    console.log("\n🔑 OAuth2 憑證測試:");
    try {
      const credentials = getOAuth2Credentials();
      console.log("✅ OAuth2 憑證獲取成功");
      console.log(`  Client ID: ${credentials.client_id.substring(0, 8)}...`);
      console.log(`  Redirect URI: ${credentials.redirect_uris[0]}`);
      console.log(
        `  憑證來源: ${credentials.client_id ? "環境變數" : "JSON 憑證"}`
      );
    } catch (error) {
      console.log(`❌ OAuth2 憑證獲取失敗: ${error.message}`);
    }
  }

  console.log("\n📝 配置建議:");

  // 提供配置建議
  if (
    !envCheck.line.channelSecret.exists ||
    !envCheck.line.channelAccessToken.exists
  ) {
    console.log("⚠️  請設置 LINE Bot 配置:");
    console.log("   LINE_CHANNEL_SECRET");
    console.log("   LINE_CHANNEL_ACCESS_TOKEN");
  }

  if (
    !envCheck.calendar.clientId.exists ||
    !envCheck.calendar.clientSecret.exists
  ) {
    console.log("⚠️  請設置 Google OAuth2 配置（推薦方式）:");
    console.log("   GOOGLE_CLIENT_ID");
    console.log("   GOOGLE_CLIENT_SECRET");
    console.log("   GOOGLE_REDIRECT_URI");
  }

  if (
    !envCheck.calendar.credentials.exists &&
    !envCheck.calendar.clientId.exists
  ) {
    console.log("⚠️  或者設置完整的 Google 憑證 JSON:");
    console.log("   GOOGLE_CALENDAR_CREDENTIALS");
  }

  if (isValid) {
    console.log("✅ 所有必需的配置都已正確設置！");
  } else {
    console.log("❌ 請檢查並修復上述配置問題");
  }
} catch (error) {
  console.error("❌ 配置檢查過程中發生錯誤:", error.message);
  process.exit(1);
}

console.log("\n🎉 配置檢查完成！");
