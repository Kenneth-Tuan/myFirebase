/**
 * LINE Webhook 處理器
 * 專門處理 LINE 相關的 webhook 事件
 */

const { logger } = require("firebase-functions");
const dayjs = require("dayjs");
const LineService = require("../services/lineService");
const CalendarService = require("../services/calendarService");
const FirestoreService = require("../services/firestoreService");
const TemplateService = require("../services/templateService");
const { validateConfig, getEnvironmentCheck } = require("../config");
const { wrapServiceCall } = require("../utils/errorHandler");

/**
 * LINE Webhook 處理器類
 */
class LineWebhookHandler {
  constructor() {
    this.lineService = new LineService();
    this.calendarService = new CalendarService();
    this.firestoreService = new FirestoreService();
    this.templateService = new TemplateService();
  }

  /**
   * 處理 GET 請求 - 顯示 webhook 信息
   */
  handleGetRequest(req, res) {
    const envCheck = getEnvironmentCheck();

    const info = {
      timestamp: new Date().toISOString(),
      deployment: {
        platform: "Firebase Functions",
        region: "asia-east1",
        url: "https://asia-east1-kenneth-project-a8d49.cloudfunctions.net/lineWebhook",
      },
      line: {
        configured: !!(
          envCheck.line.channelSecret.exists &&
          envCheck.line.channelAccessToken.exists
        ),
        config: envCheck.line,
      },
      calendar: {
        configured: !!(
          envCheck.calendar.apiKey.exists ||
          envCheck.calendar.credentials.exists
        ),
        config: envCheck.calendar,
      },
      webhook: {
        url: "https://asia-east1-kenneth-project-a8d49.cloudfunctions.net/lineWebhook",
        method: "POST",
        note: "LINE webhook verification uses POST method, not GET",
      },
      status: validateConfig()
        ? "✅ Ready for LINE webhook"
        : "❌ Missing configuration",
    };

    res.status(200).json(info);
  }

  /**
   * 處理 LINE 事件
   */
  async handleLineEvent(event) {
    return await wrapServiceCall(
      async () => {
        logger.info(`Processing LINE event: ${event.type}`);

        // 記錄事件到 Firestore
        await this.firestoreService.logWebhookEvent("line_event", event);

        // 處理群組相關事件
        if (event.source.type === "group") {
          await this.handleGroupEvent(event);
        }

        // 處理文字訊息
        if (event.type === "message" && event.message.type === "text") {
          await this.handleTextMessage(event);
        }

        // 使用 LINE 服務處理事件
        const result = await this.lineService.handleEvent(event);

        return result;
      },
      "line_webhook",
      "handleLineEvent",
      { eventType: event.type, sourceType: event.source && event.source.type }
    );
  }

  /**
   * 處理文字訊息
   */
  async handleTextMessage(event) {
    return await wrapServiceCall(
      async () => {
        const text = event.message.text;
        const userId = event.source.userId;
        logger.info("Processing text message:", text);

        // 首先處理模板相關訊息
        const templateResponse =
          await this.templateService.handleTemplateMessage(text, userId);
        if (templateResponse) {
          await this.lineService.replyMessage(event.replyToken, {
            type: "text",
            text: templateResponse.content,
          });
          return;
        }

        // 處理查詢功能
        if (text.startsWith("查詢:")) {
          await this.handleQueryMessage(event);
          return;
        }

        // 處理今日行程查詢（保持向後兼容）
        if (text === "今日行程") {
          await this.handleTodayScheduleQuery(event);
          return;
        }

        // 如果不是模板訊息，嘗試處理日曆事件
        await this.handleCalendarEventMessage(event);
      },
      "line_webhook",
      "handleTextMessage",
      {
        messageText: event.message.text,
        userId: event.source && event.source.userId,
      }
    );
  }

  /**
   * 處理群組事件
   */
  async handleGroupEvent(event) {
    return await wrapServiceCall(
      async () => {
        const groupId = event.source.groupId;
        logger.info(`Processing group event: ${groupId}`);

        // 記錄群組到 Firestore
        await this.firestoreService.recordGroupJoin(event);

        // 更新群組活動時間
        await this.firestoreService.updateGroupActivity(groupId);

        // 如果是群組訊息，發送確認
        if (event.type === "message") {
          await this.lineService.replyMessage(event.replyToken, {
            type: "text",
            text: `✅ 收到訊息，群組已記錄`,
          });
        }
      },
      "line_webhook",
      "handleGroupEvent",
      { groupId: event.source && event.source.groupId, eventType: event.type }
    );
  }

  /**
   * 處理查詢訊息
   */
  async handleQueryMessage(event) {
    return await wrapServiceCall(
      async () => {
        const text = event.message.text;
        logger.info("Processing query message:", text);

        // 解析查詢內容
        const queryData = this.parseQueryMessage(text);
        if (!queryData) {
          await this.lineService.replyMessage(event.replyToken, {
            type: "text",
            text: "❌ 查詢格式錯誤，請使用正確的格式：\n查詢: 查詢類型\n日期: 日期（可選）",
          });
          return;
        }

        logger.info("Parsed query data:", queryData);

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
      },
      "line_webhook",
      "handleQueryMessage",
      { messageText: event.message.text }
    );
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
      logger.error("Parse query message failed:", error);
      return null;
    }
  }

  /**
   * 處理日曆事件查詢
   */
  async handleCalendarEventsQuery(event, queryData) {
    try {
      logger.info("Processing calendar events query:", queryData);

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

      logger.info("Calendar events query processed successfully");
    } catch (error) {
      logger.error("Handle calendar events query failed:", error);

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
        logger.error("Failed to reply error message:", replyError);
      }
    }
  }

  /**
   * 處理群組列表查詢
   */
  async handleGroupListQuery(event) {
    try {
      // 這裡可以實作查詢群組列表的功能
      await this.lineService.replyMessage(event.replyToken, {
        type: "text",
        text: "📋 群組列表查詢功能正在開發中...",
      });
    } catch (error) {
      logger.error("Handle group list query failed:", error);
    }
  }

  /**
   * 處理系統統計查詢
   */
  async handleSystemStatsQuery(event) {
    try {
      // 這裡可以實作查詢系統統計的功能
      await this.lineService.replyMessage(event.replyToken, {
        type: "text",
        text: "📊 系統統計查詢功能正在開發中...",
      });
    } catch (error) {
      logger.error("Handle system stats query failed:", error);
    }
  }

  /**
   * 處理今日行程查詢
   */
  async handleTodayScheduleQuery(event) {
    try {
      logger.info("Processing today schedule query");

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

      logger.info("Today schedule query processed successfully");
    } catch (error) {
      logger.error("Handle today schedule query failed:", error);

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
        logger.error("Failed to reply error message:", replyError);
      }
    }
  }

  /**
   * 處理日曆事件訊息
   */
  async handleCalendarEventMessage(event) {
    try {
      const text = event.message.text;
      logger.info("Processing calendar event message:", text);

      // 解析日曆事件資訊
      const eventData = this.calendarService.parseCalendarEventFromText(text);
      if (!eventData) {
        logger.info("Not a calendar event message or invalid format");
        return;
      }

      logger.info("Parsed event data:", eventData);

      // 創建 Google Calendar 事件
      const result = await this.calendarService.createEvent(eventData);

      // 保存到 Firestore
      await this.firestoreService.saveCalendarEvent(
        result.eventId,
        result,
        "line_webhook"
      );

      logger.info("Calendar event created successfully:", result);

      // 回覆確認訊息
      await this.lineService.replyMessage(event.replyToken, {
        type: "text",
        text: `✅ 日曆事件已創建成功！\n標題: ${result.summary}\n連結: ${result.htmlLink}`,
      });
    } catch (error) {
      logger.error("Handle calendar event message failed:", error);

      // 回覆錯誤訊息
      try {
        await this.lineService.replyMessage(event.replyToken, {
          type: "text",
          text: "❌ 創建日曆事件時發生錯誤，請檢查格式是否正確",
        });
      } catch (replyError) {
        logger.error("Failed to reply error message:", replyError);
      }
    }
  }

  /**
   * 處理 webhook 請求
   */
  async handleWebhookRequest(req, res) {
    try {
      // 檢查環境變數
      if (!validateConfig()) {
        logger.error("❌ Configuration validation failed");
        res.status(500).json({
          error: "Configuration missing",
          details: getEnvironmentCheck(),
        });
        return;
      }

      // 驗證 LINE 簽名
      await this.lineService.validateSignature(req, res, () => {});

      const events = req.body.events || [];

      // 重要：如果沒有事件，這可能是 LINE 的驗證請求
      if (events.length === 0) {
        logger.info(
          "Received webhook verification request - no events, returning 200"
        );
        return res.status(200).end();
      }

      logger.info(`Processing ${events.length} LINE events`);

      // 處理每個事件
      await Promise.all(
        events.map(async (event) => {
          try {
            await this.handleLineEvent(event);
          } catch (error) {
            logger.error(`Failed to process event ${event.type}:`, error);
            // 繼續處理其他事件，不中斷整個流程
          }
        })
      );

      // 確保返回 200 狀態碼
      res.status(200).end();
    } catch (error) {
      logger.error("Webhook processing error:", error);

      // 即使有錯誤，也要返回 200 以避免 LINE 平台重試
      res.status(200).json({
        error: error.message,
        type: error.name,
        timestamp: new Date().toISOString(),
        note: "Returning 200 to prevent LINE platform from marking webhook as invalid",
      });
    }
  }

  /**
   * 主處理函數
   */
  async handleRequest(req, res) {
    // 設置 CORS headers
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type, X-Line-Signature");

    // 處理 OPTIONS 請求
    if (req.method === "OPTIONS") {
      res.status(200).end();
      return;
    }

    // 處理 GET 請求
    if (req.method === "GET") {
      this.handleGetRequest(req, res);
      return;
    }

    // 只處理 POST 請求
    if (req.method !== "POST") {
      res.status(405).json({
        error: "Method not allowed",
        method: req.method,
        allowed: "GET, POST",
      });
      return;
    }

    // 處理 webhook 請求
    await this.handleWebhookRequest(req, res);
  }
}

module.exports = LineWebhookHandler;
