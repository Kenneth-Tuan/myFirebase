/**
 * 查詢邏輯測試腳本
 * 只測試查詢解析和處理邏輯，不需要完整的環境配置
 */

// 模擬查詢處理器（只包含邏輯部分）
class QueryLogicTester {
  /**
   * 解析查詢訊息
   */
  parseQueryMessage(text) {
    try {
      const lines = text.split("\n");
      const queryData = {};

      for (const line of lines) {
        const [key, value] = line.split(":").map(s => s.trim());
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
   * 驗證日期格式
   */
  validateDate(dateString) {
    if (!dateString) return true; // 空日期是有效的（預設今日）
    
    // 簡單的日期格式驗證：YYYY-MM-DD
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateString)) {
      return false;
    }
    
    // 檢查日期是否有效
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  }

  /**
   * 格式化回應訊息（模擬）
   */
  formatResponse(queryData, mockEvents = []) {
    const date = queryData.date || "今日";
    const count = mockEvents.length;
    
    let responseText = `📅 ${date} 的行程\n\n`;

    if (count === 0) {
      responseText += "🎉 沒有安排任何行程，可以好好休息！";
    } else {
      responseText += `共找到 ${count} 個行程：\n\n`;

      mockEvents.forEach((event, index) => {
        responseText += `${index + 1}. ${event.summary}\n`;
        responseText += `   ⏰ ${event.time}\n`;
        
        if (event.location) {
          responseText += `   📍 ${event.location}\n`;
        }
        
        if (event.description) {
          const shortDescription = event.description.length > 50 
            ? event.description.substring(0, 50) + "..."
            : event.description;
          responseText += `   📝 ${shortDescription}\n`;
        }
        
        responseText += "\n";
      });

      responseText += "💡 點擊以下連結查看完整日曆：\n";
      responseText += "https://calendar.google.com";
    }

    return responseText;
  }

  /**
   * 處理查詢（邏輯測試）
   */
  processQuery(text) {
    console.log(`\n🔍 處理查詢: "${text}"`);
    
    // 解析查詢
    const queryData = this.parseQueryMessage(text);
    if (!queryData) {
      return {
        success: false,
        error: "查詢格式錯誤，請使用正確的格式：\n查詢: 查詢類型\n日期: 日期（可選）",
      };
    }

    console.log("📊 解析結果:", queryData);

    // 驗證日期格式
    if (!this.validateDate(queryData.date)) {
      return {
        success: false,
        error: "❌ 日期格式錯誤，請使用 YYYY-MM-DD 格式，例如：2024-01-15",
      };
    }

    // 根據查詢類型處理
    switch (queryData.type) {
      case "今日行程":
        return this.handleTodayScheduleQuery(queryData);
      case "日曆事件":
        return this.handleCalendarEventsQuery(queryData);
      case "群組列表":
        return this.handleGroupListQuery(queryData);
      case "系統統計":
        return this.handleSystemStatsQuery(queryData);
      default:
        return {
          success: false,
          error: `❌ 不支援的查詢類型：${queryData.type}\n\n支援的查詢類型：\n• 今日行程\n• 日曆事件\n• 群組列表\n• 系統統計`,
        };
    }
  }

  /**
   * 處理今日行程查詢
   */
  handleTodayScheduleQuery(queryData) {
    // 模擬今日行程數據
    const mockEvents = [
      {
        summary: "團隊會議",
        time: "09:00 - 10:00",
        location: "會議室A",
        description: "討論本週工作進度和下週計劃安排",
      },
      {
        summary: "客戶拜訪",
        time: "14:00 - 15:30",
        location: "台北市信義區",
        description: "拜訪重要客戶，討論合作細節",
      },
    ];

    return {
      success: true,
      response: this.formatResponse({ date: "今日" }, mockEvents),
    };
  }

  /**
   * 處理日曆事件查詢
   */
  handleCalendarEventsQuery(queryData) {
    const date = queryData.date || "今日";
    
    // 模擬特定日期的行程數據
    const mockEvents = queryData.date ? [
      {
        summary: "週會",
        time: "14:00 - 15:00",
        description: "每週例行會議",
      },
      {
        summary: "健身時間",
        time: "18:00 - 19:00",
        location: "健身房",
        description: "保持身體健康",
      },
    ] : [];

    return {
      success: true,
      response: this.formatResponse({ date }, mockEvents),
    };
  }

  /**
   * 處理群組列表查詢
   */
  handleGroupListQuery(queryData) {
    return {
      success: true,
      response: "📋 群組列表查詢功能正在開發中...",
    };
  }

  /**
   * 處理系統統計查詢
   */
  handleSystemStatsQuery(queryData) {
    return {
      success: true,
      response: "📊 系統統計查詢功能正在開發中...",
    };
  }
}

// 測試函數
function runLogicTests() {
  console.log("🧪 開始查詢邏輯測試...\n");

  const tester = new QueryLogicTester();

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
    {
      name: "無效日期",
      input: "查詢: 日曆事件\n日期: 2024-13-45",
    },
  ];

  let passedTests = 0;
  let totalTests = testCases.length;

  for (const testCase of testCases) {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`🧪 測試: ${testCase.name}`);
    console.log(`📝 輸入: ${testCase.input.replace(/\n/g, "\\n")}`);
    console.log(`${"=".repeat(60)}`);

    try {
      const result = tester.processQuery(testCase.input);
      
      if (result.success) {
        console.log("✅ 測試通過");
        console.log("📤 回應:");
        console.log("─".repeat(50));
        console.log(result.response);
        console.log("─".repeat(50));
        passedTests++;
      } else {
        console.log("❌ 測試失敗");
        console.log("📤 錯誤訊息:");
        console.log("─".repeat(50));
        console.log(result.error);
        console.log("─".repeat(50));
      }
    } catch (error) {
      console.log("❌ 測試異常:", error.message);
    }
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log(`🎉 測試完成！`);
  console.log(`📊 結果: ${passedTests}/${totalTests} 測試通過`);
  console.log(`${"=".repeat(60)}`);
}

// 執行測試
if (require.main === module) {
  runLogicTests();
}

module.exports = { QueryLogicTester, runLogicTests }; 