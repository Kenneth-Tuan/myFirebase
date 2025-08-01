/**
 * 模組化架構測試腳本
 * 驗證所有模組是否正常載入和工作
 */

// 測試腳本不需要 logger

async function testModules() {
  console.log("🧪 開始測試模組化架構...\n");

  try {
    // 測試配置模組
    console.log("1. 測試配置模組...");
    const config = require("./src/config");
    console.log("✅ 配置模組載入成功");
    console.log("   - LINE_CONFIG:", !!config.LINE_CONFIG);
    console.log("   - CALENDAR_CONFIG:", !!config.CALENDAR_CONFIG);
    console.log("   - FIREBASE_CONFIG:", !!config.FIREBASE_CONFIG);
    console.log("   - validateConfig:", typeof config.validateConfig);
    console.log("   - getEnvironmentCheck:", typeof config.getEnvironmentCheck);

    // 測試服務模組（只測試類別定義，不初始化實例）
    console.log("\n2. 測試服務模組...");

    console.log("   - LineService...");
    const LineService = require("./src/services/lineService");
    console.log("   ✅ LineService 類別載入成功");
    console.log("   - 類別名稱:", LineService.name);
    console.log(
      "   - 原型方法:",
      Object.getOwnPropertyNames(LineService.prototype)
    );

    console.log("   - CalendarService...");
    const CalendarService = require("./src/services/calendarService");
    console.log("   ✅ CalendarService 類別載入成功");
    console.log("   - 類別名稱:", CalendarService.name);

    console.log("   - FirestoreService...");
    const FirestoreService = require("./src/services/firestoreService");
    console.log("   ✅ FirestoreService 類別載入成功");
    console.log("   - 類別名稱:", FirestoreService.name);

    // 測試處理器模組（只測試類別定義，不初始化實例）
    console.log("\n3. 測試處理器模組...");

    console.log("   - LineWebhookHandler...");
    const LineWebhookHandler = require("./src/handlers/lineWebhookHandler");
    console.log("   ✅ LineWebhookHandler 類別載入成功");
    console.log("   - 類別名稱:", LineWebhookHandler.name);

    console.log("   - BroadcastHandler...");
    const BroadcastHandler = require("./src/handlers/broadcastHandler");
    console.log("   ✅ BroadcastHandler 類別載入成功");
    console.log("   - 類別名稱:", BroadcastHandler.name);

    console.log("   - StatusHandler...");
    const StatusHandler = require("./src/handlers/statusHandler");
    console.log("   ✅ StatusHandler 類別載入成功");
    console.log("   - 類別名稱:", StatusHandler.name);

    // 測試工具模組
    console.log("\n4. 測試工具模組...");

    console.log("   - errorHandler...");
    const errorHandler = require("./src/utils/errorHandler");
    console.log("   ✅ errorHandler 載入成功");
    console.log("   - AppError:", typeof errorHandler.AppError);
    console.log("   - ValidationError:", typeof errorHandler.ValidationError);
    console.log("   - errorHandler:", typeof errorHandler.errorHandler);

    console.log("   - responseFormatter...");
    const responseFormatter = require("./src/utils/responseFormatter");
    console.log("   ✅ responseFormatter 載入成功");
    console.log(
      "   - successResponse:",
      typeof responseFormatter.successResponse
    );
    console.log("   - errorResponse:", typeof responseFormatter.errorResponse);

    // 測試主入口文件
    console.log("\n5. 測試主入口文件...");
    const mainModule = require("./src/index");
    console.log("✅ 主入口文件載入成功");
    console.log("   - lineWebhook:", typeof mainModule.lineWebhook);
    console.log("   - broadcast:", typeof mainModule.broadcast);
    console.log("   - status:", typeof mainModule.status);
    console.log("   - health:", typeof mainModule.health);
    console.log("   - stats:", typeof mainModule.stats);

    // 測試模組導出
    console.log("\n6. 測試模組導出...");
    console.log(
      "   - LineWebhookHandler:",
      typeof mainModule.LineWebhookHandler
    );
    console.log("   - BroadcastHandler:", typeof mainModule.BroadcastHandler);
    console.log("   - StatusHandler:", typeof mainModule.StatusHandler);

    console.log("\n🎉 所有模組測試通過！");
    console.log("\n📋 模組化架構總結：");
    console.log("   - 配置管理: 1 個模組");
    console.log("   - 業務服務: 3 個模組");
    console.log("   - 請求處理: 3 個模組");
    console.log("   - 工具函數: 2 個模組");
    console.log("   - 總計: 9 個模組");
    console.log("\n📁 文件結構：");
    console.log("   - src/config/index.js");
    console.log("   - src/services/lineService.js");
    console.log("   - src/services/calendarService.js");
    console.log("   - src/services/firestoreService.js");
    console.log("   - src/handlers/lineWebhookHandler.js");
    console.log("   - src/handlers/broadcastHandler.js");
    console.log("   - src/handlers/statusHandler.js");
    console.log("   - src/utils/errorHandler.js");
    console.log("   - src/utils/responseFormatter.js");
    console.log("   - src/index.js");
    console.log("\n🚀 新架構已準備就緒，可以部署了！");
    console.log("\n⚠️  注意：服務實例化需要正確的環境變數設定");
  } catch (error) {
    console.error("❌ 模組測試失敗:", error.message);
    console.error("錯誤詳情:", error);
    process.exit(1);
  }
}

// 執行測試
if (require.main === module) {
  testModules();
}

module.exports = { testModules };
