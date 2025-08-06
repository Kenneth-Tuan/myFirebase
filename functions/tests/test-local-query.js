/**
 * 本地查詢功能測試腳本
 * 模擬 LINE 查詢功能，無需部署即可測試
 */

const CalendarService = require("../src/services/calendarService");
const dayjs = require("dayjs");

// 模擬 LINE 事件對象
function createMockLineEvent(text) {
  return {
    type: "message",
    message: {
      type: "text",
      text: text,
    },
    replyToken: "mock-reply-token-" + Date.now(),
    source: {
      userId: "mock-user-id",
      type: "user",
    },
  };
}

// 模擬 LINE 服務的回覆功能
class MockLineService {
  async replyMessage(replyToken, message) {
    console.log(`\n📤 模擬 LINE 回覆 (Token: ${replyToken}):`);
    console.log("─".repeat(50));
    console.log(message.text);
    console.log("─".repeat(50));
  }
}

// 模擬查詢處理器
class MockQueryHandler {
  constructor() {
    this.calendarService = new CalendarService();
    this.lineService = new MockLineService();
  }

  /**
   * 解析查詢訊息
   */
  parseQueryMessage(text) {
    try {
      const lines = text.split("\n");
      const queryData = {};

      for (const line of lines) {
        const [key, value] = line.split(":").map((s) => s.trim());
        if (key && value) {
          queryData[key] = value;
        }
      }

      // 驗證必要欄位
      if (!queryData["查詢"]) {
        return null;
      }

      return {
        type: queryData["查詢"],
        date: queryData["日期"],
        parameters: queryData["參數"],
      };
    } catch (error) {
      console.error("Parse query message failed:", error);
      return null;
    }
  }

  /**
   * 處理查詢訊息
   */
  async handleQueryMessage(event) {
    try {
      const text = event.message.text;
      console.log(`\n🔍 處理查詢訊息: "${text}"`);

      // 解析查詢內容
      const queryData = this.parseQueryMessage(text);
      if (!queryData) {
        await this.lineService.replyMessage(event.replyToken, {
          type: "text",
          text: "❌ 查詢格式錯誤，請使用正確的格式：\n查詢: 查詢類型\n日期: 日期（可選）",
        });
        return;
      }

      console.log("📊 解析結果:", queryData);

      // 根據查詢類型處理
      switch (queryData.type) {
      case "今日行程":
        await this.handleTodayScheduleQuery(event);
        break;
      case "日曆事件":
        await this.handleCalendarEventsQuery(event, queryData);
        break;
      case "群組列表":
        await this.handleGroupListQuery(event);
        break;
      case "系統統計":
        await this.handleSystemStatsQuery(event);
        break;
      default:
        await this.lineService.replyMessage(event.replyToken, {
          type: "text",
          text: `❌ 不支援的查詢類型：${queryData.type}\n\n支援的查詢類型：\n• 今日行程\n• 日曆事件\n• 群組列表\n• 系統統計`,
        });
      }
    } catch (error) {
      console.error("Handle query message failed:", error);

      // 回覆錯誤訊息
      try {
        await this.lineService.replyMessage(event.replyToken, {
          type: "text",
          text: "❌ 處理查詢時發生錯誤，請稍後再試",
        });
      } catch (replyError) {
        console.error("Failed to reply error message:", replyError);
      }
    }
  }

  /**
   * 處理今日行程查詢
   */
  async handleTodayScheduleQuery(event) {
    try {
      console.log("📅 處理今日行程查詢...");

      // 查詢今日行程
      const result = await this.calendarService.getTodayEvents();

      if (!result.success) {
        throw new Error("查詢今日行程失敗");
      }

      // 格式化回應訊息
      let responseText = `📅 ${result.date} 的行程\n\n`;

      if (result.count === 0) {
        responseText += "🎉 今天沒有安排任何行程，可以好好休息！";
      } else {
        responseText += `共找到 ${result.count} 個行程：\n\n`;

        result.events.forEach((event, index) => {
          responseText += `${index + 1}. ${event.summary}\n`;
          responseText += `   ⏰ ${event.time}\n`;

          if (event.location) {
            responseText += `   📍 ${event.location}\n`;
          }

          if (event.description) {
            // 限制描述長度，避免訊息過長
            const shortDescription =
              event.description.length > 50
                ? event.description.substring(0, 50) + "..."
                : event.description;
            responseText += `   📝 ${shortDescription}\n`;
          }

          responseText += "\n";
        });

        responseText += "💡 點擊以下連結查看完整日曆：\n";
        responseText += "https://calendar.google.com";
      }

      // 回覆訊息
      await this.lineService.replyMessage(event.replyToken, {
        type: "text",
        text: responseText,
      });

      console.log("✅ 今日行程查詢處理完成");
    } catch (error) {
      console.error("Handle today schedule query failed:", error);

      // 回覆錯誤訊息
      try {
        let errorMessage = "❌ 查詢今日行程時發生錯誤";

        // 根據錯誤類型提供更具體的訊息
        if (error.message.includes("reauthorization")) {
          errorMessage = "❌ 需要重新授權 Google Calendar，請先進行授權";
        } else if (error.message.includes("network")) {
          errorMessage = "❌ 網路連線問題，請稍後再試";
        }

        await this.lineService.replyMessage(event.replyToken, {
          type: "text",
          text: errorMessage,
        });
      } catch (replyError) {
        console.error("Failed to reply error message:", replyError);
      }
    }
  }

  /**
   * 處理日曆事件查詢
   */
  async handleCalendarEventsQuery(event, queryData) {
    try {
      console.log("📅 處理日曆事件查詢:", queryData);

      let targetDate;

      if (queryData.date) {
        // 解析指定日期
        targetDate = dayjs(queryData.date);
        if (!targetDate.isValid()) {
          await this.lineService.replyMessage(event.replyToken, {
            type: "text",
            text: "❌ 日期格式錯誤，請使用 YYYY-MM-DD 格式，例如：2024-01-15",
          });
          return;
        }
      } else {
        // 沒有指定日期，使用今日
        targetDate = dayjs();
      }

      // 查詢指定日期的行程
      const result = await this.calendarService.getEventsByDate(targetDate);

      if (!result.success) {
        throw new Error("查詢日曆事件失敗");
      }

      // 格式化回應訊息
      let responseText = `📅 ${result.date} 的行程\n\n`;

      if (result.count === 0) {
        const dateText = result.isToday ? "今天" : "該日期";
        responseText += `🎉 ${dateText}沒有安排任何行程！`;
      } else {
        responseText += `共找到 ${result.count} 個行程：\n\n`;

        result.events.forEach((event, index) => {
          responseText += `${index + 1}. ${event.summary}\n`;
          responseText += `   ⏰ ${event.time}\n`;

          if (event.location) {
            responseText += `   📍 ${event.location}\n`;
          }

          if (event.description) {
            // 限制描述長度，避免訊息過長
            const shortDescription =
              event.description.length > 50
                ? event.description.substring(0, 50) + "..."
                : event.description;
            responseText += `   📝 ${shortDescription}\n`;
          }

          responseText += "\n";
        });

        responseText += "💡 點擊以下連結查看完整日曆：\n";
        responseText += "https://calendar.google.com";
      }

      // 回覆訊息
      await this.lineService.replyMessage(event.replyToken, {
        type: "text",
        text: responseText,
      });

      console.log("✅ 日曆事件查詢處理完成");
    } catch (error) {
      console.error("Handle calendar events query failed:", error);

      // 回覆錯誤訊息
      try {
        let errorMessage = "❌ 查詢日曆事件時發生錯誤";

        // 根據錯誤類型提供更具體的訊息
        if (error.message.includes("reauthorization")) {
          errorMessage = "❌ 需要重新授權 Google Calendar，請先進行授權";
        } else if (error.message.includes("network")) {
          errorMessage = "❌ 網路連線問題，請稍後再試";
        }

        await this.lineService.replyMessage(event.replyToken, {
          type: "text",
          text: errorMessage,
        });
      } catch (replyError) {
        console.error("Failed to reply error message:", replyError);
      }
    }
  }

  /**
   * 處理群組列表查詢
   */
  async handleGroupListQuery(event) {
    try {
      await this.lineService.replyMessage(event.replyToken, {
        type: "text",
        text: "📋 群組列表查詢功能正在開發中...",
      });
    } catch (error) {
      console.error("Handle group list query failed:", error);
    }
  }

  /**
   * 處理系統統計查詢
   */
  async handleSystemStatsQuery(event) {
    try {
      await this.lineService.replyMessage(event.replyToken, {
        type: "text",
        text: "📊 系統統計查詢功能正在開發中...",
      });
    } catch (error) {
      console.error("Handle system stats query failed:", error);
    }
  }
}

// 測試函數
async function runLocalTests() {
  console.log("🧪 開始本地查詢功能測試...\n");

  const handler = new MockQueryHandler();

  // 測試案例
  const testCases = [
    {
      name: "今日行程查詢",
      input: "查詢: 今日行程",
    },
    {
      name: "特定日期查詢",
      input: "查詢: 日曆事件\n日期: 2024-01-15",
    },
    {
      name: "無日期查詢（預設今日）",
      input: "查詢: 日曆事件",
    },
    {
      name: "群組列表查詢",
      input: "查詢: 群組列表",
    },
    {
      name: "系統統計查詢",
      input: "查詢: 系統統計",
    },
    {
      name: "錯誤格式測試",
      input: "錯誤格式",
    },
    {
      name: "不支援的查詢類型",
      input: "查詢: 不存在的類型",
    },
    {
      name: "日期格式錯誤",
      input: "查詢: 日曆事件\n日期: 2024/01/15",
    },
  ];

  for (const testCase of testCases) {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`🧪 測試: ${testCase.name}`);
    console.log(`📝 輸入: ${testCase.input.replace(/\n/g, "\\n")}`);
    console.log(`${"=".repeat(60)}`);

    const mockEvent = createMockLineEvent(testCase.input);
    await handler.handleQueryMessage(mockEvent);

    // 等待一下，讓輸出更清晰
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log("🎉 所有本地測試完成！");
  console.log(`${"=".repeat(60)}`);
}

// 執行測試
if (require.main === module) {
  runLocalTests().catch(console.error);
}

module.exports = { MockQueryHandler, runLocalTests };
