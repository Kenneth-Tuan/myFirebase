/**
 * Token 管理系統測試腳本
 * 用於測試新的 Google OAuth token 管理功能
 */

const TokenService = require("../src/services/tokenService");
const CalendarService = require("../src/services/calendarService");

/**
 * 測試 Token 管理系統
 */
async function testTokenSystem() {
  console.log("🧪 開始測試 Token 管理系統...\n");

  try {
    // 初始化服務
    const tokenService = new TokenService();
    const calendarService = new CalendarService();

    console.log("1️⃣ 測試 Token 狀態檢查...");
    const tokenStatus = await tokenService.checkTokenStatus();
    console.log("Token 狀態:", tokenStatus);

    console.log("\n2️⃣ 測試獲取 Token 詳細資訊...");
    const tokens = await tokenService.getTokensFromFirestore();
    if (tokens) {
      console.log("✅ 找到 Token:");
      console.log("- Access Token:", tokens.access_token ? "存在" : "不存在");
      console.log("- Refresh Token:", tokens.refresh_token ? "存在" : "不存在");
      console.log("- 過期時間:", tokens.expiry_date);
    } else {
      console.log("❌ 未找到 Token");
    }

    console.log("\n3️⃣ 測試 Token 有效性檢查...");
    const isExpired = tokenService.isTokenExpired(tokens);
    console.log("Token 是否過期:", isExpired);

    console.log("\n4️⃣ 測試獲取有效 Token...");
    try {
      const validTokens = await tokenService.getValidTokens();
      console.log("✅ 獲取到有效 Token");
      console.log("- 過期時間:", validTokens.expiry_date);
    } catch (error) {
      console.log("❌ 獲取有效 Token 失敗:", error.message);
    }

    console.log("\n5️⃣ 測試 Calendar 服務初始化...");
    try {
      await calendarService.initialize();
      console.log("✅ Calendar 服務初始化成功");
    } catch (error) {
      console.log("❌ Calendar 服務初始化失敗:", error.message);
    }

    console.log("\n6️⃣ 測試 Calendar 服務狀態檢查...");
    try {
      const calendarStatus = await calendarService.checkStatus();
      console.log("Calendar 狀態:", calendarStatus);
    } catch (error) {
      console.log("❌ Calendar 狀態檢查失敗:", error.message);
    }

    console.log("\n✅ Token 管理系統測試完成！");
  } catch (error) {
    console.error("❌ 測試過程中發生錯誤:", error);
  }
}

/**
 * 測試 Token 更新功能
 */
async function testTokenUpdate() {
  console.log("\n🔄 測試 Token 更新功能...");

  try {
    const tokenService = new TokenService();

    // 模擬新的 token 數據
    const newTokens = {
      access_token: "test_access_token",
      refresh_token: "test_refresh_token",
      expiry_date: new Date(Date.now() + 3600000), // 1小時後過期
    };

    console.log("更新 Token...");
    await tokenService.updateTokens(
      newTokens.access_token,
      newTokens.refresh_token,
      newTokens.expiry_date
    );

    console.log("✅ Token 更新成功");

    // 驗證更新
    const updatedTokens = await tokenService.getTokensFromFirestore();
    console.log("更新後的 Token:", {
      hasAccessToken: !!updatedTokens.access_token,
      hasRefreshToken: !!updatedTokens.refresh_token,
      expiryDate: updatedTokens.expiry_date,
    });
  } catch (error) {
    console.error("❌ Token 更新測試失敗:", error);
  }
}

/**
 * 主測試函數
 */
async function runTests() {
  console.log("🚀 開始執行 Token 管理系統測試套件\n");

  await testTokenSystem();
  await testTokenUpdate();

  console.log("\n🎉 所有測試完成！");
}

// 如果直接運行此腳本
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  testTokenSystem,
  testTokenUpdate,
  runTests,
};
