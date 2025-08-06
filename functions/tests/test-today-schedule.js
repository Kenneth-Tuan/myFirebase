/**
 * 測試今日行程查詢功能
 */

const CalendarService = require("../src/services/calendarService");

async function testTodaySchedule() {
  console.log("🧪 開始測試今日行程查詢功能...");

  try {
    const calendarService = new CalendarService();

    console.log("📅 查詢今日行程...");
    const result = await calendarService.getTodayEvents();

    console.log("✅ 查詢成功！");
    console.log("📊 結果摘要:");
    console.log(`   日期: ${result.date}`);
    console.log(`   事件數量: ${result.count}`);

    if (result.count > 0) {
      console.log("\n📋 今日行程:");
      result.events.forEach((event, index) => {
        console.log(`   ${index + 1}. ${event.summary}`);
        console.log(`      時間: ${event.time}`);
        if (event.location) {
          console.log(`      地點: ${event.location}`);
        }
        if (event.description) {
          console.log(
            `      描述: ${event.description.substring(0, 50)}${
              event.description.length > 50 ? "..." : ""
            }`
          );
        }
        console.log("");
      });
    } else {
      console.log("🎉 今天沒有安排任何行程");
    }
  } catch (error) {
    console.error("❌ 測試失敗:", error.message);

    if (error.message.includes("reauthorization")) {
      console.log("💡 需要重新授權 Google Calendar");
    } else if (error.message.includes("network")) {
      console.log("💡 網路連線問題");
    }
  }
}

// 執行測試
if (require.main === module) {
  testTodaySchedule();
}

module.exports = { testTodaySchedule };
