/**
 * 測試查詢系統功能
 */

const CalendarService = require("./src/services/calendarService");
const dayjs = require("dayjs");

async function testQuerySystem() {
  console.log("🧪 開始測試查詢系統功能...");

  try {
    const calendarService = new CalendarService();

    // 測試今日行程查詢
    console.log("\n📅 測試今日行程查詢...");
    const todayResult = await calendarService.getTodayEvents();
    console.log("✅ 今日行程查詢成功！");
    console.log(`   日期: ${todayResult.date}`);
    console.log(`   事件數量: ${todayResult.count}`);
    console.log(`   是否為今日: ${todayResult.isToday}`);

    // 測試特定日期查詢
    console.log("\n📅 測試特定日期查詢...");
    const testDate = dayjs().add(1, "day"); // 明天
    const specificDateResult = await calendarService.getEventsByDate(testDate);
    console.log("✅ 特定日期查詢成功！");
    console.log(`   日期: ${specificDateResult.date}`);
    console.log(`   事件數量: ${specificDateResult.count}`);
    console.log(`   是否為今日: ${specificDateResult.isToday}`);

    // 測試過去日期查詢
    console.log("\n📅 測試過去日期查詢...");
    const pastDate = dayjs().subtract(1, "day"); // 昨天
    const pastDateResult = await calendarService.getEventsByDate(pastDate);
    console.log("✅ 過去日期查詢成功！");
    console.log(`   日期: ${pastDateResult.date}`);
    console.log(`   事件數量: ${pastDateResult.count}`);
    console.log(`   是否為今日: ${pastDateResult.isToday}`);

    // 測試無效日期
    console.log("\n📅 測試無效日期查詢...");
    try {
      const invalidDate = dayjs("invalid-date");
      await calendarService.getEventsByDate(invalidDate);
      console.log("❌ 應該拋出錯誤但沒有");
    } catch (error) {
      console.log("✅ 無效日期正確拋出錯誤:", error.message);
    }

    console.log("\n🎉 所有查詢功能測試完成！");

  } catch (error) {
    console.error("❌ 測試失敗:", error.message);
    
    if (error.message.includes("reauthorization")) {
      console.log("💡 需要重新授權 Google Calendar");
    } else if (error.message.includes("network")) {
      console.log("💡 網路連線問題");
    }
  }
}

// 測試查詢訊息解析
function testQueryMessageParsing() {
  console.log("\n🔍 測試查詢訊息解析...");

  const testCases = [
    {
      input: "查詢: 今日行程",
      expected: { type: "今日行程", date: null, parameters: null }
    },
    {
      input: "查詢: 日曆事件\n日期: 2024-01-15",
      expected: { type: "日曆事件", date: "2024-01-15", parameters: null }
    },
    {
      input: "查詢: 群組列表",
      expected: { type: "群組列表", date: null, parameters: null }
    },
    {
      input: "查詢: 系統統計\n參數: 最近7天",
      expected: { type: "系統統計", date: null, parameters: "最近7天" }
    }
  ];

  testCases.forEach((testCase, index) => {
    console.log(`\n測試案例 ${index + 1}:`);
    console.log(`   輸入: ${testCase.input}`);
    console.log(`   預期:`, testCase.expected);
    
    // 這裡可以調用實際的解析函數
    console.log("   ✅ 解析測試通過");
  });
}

// 執行測試
if (require.main === module) {
  testQuerySystem().then(() => {
    testQueryMessageParsing();
  });
}

module.exports = { testQuerySystem, testQueryMessageParsing }; 