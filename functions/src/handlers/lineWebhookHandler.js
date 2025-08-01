/**
 * LINE Webhook 處理器
 * 專門處理 LINE 相關的 webhook 事件
 */

const { logger } = require("firebase-functions");
const LineService = require("../services/lineService");
const CalendarService = require("../services/calendarService");
const FirestoreService = require("../services/firestoreService");
const TemplateService = require("../services/templateService");
const { validateConfig, getEnvironmentCheck } = require("../config");

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
    try {
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
    } catch (error) {
      logger.error("Handle LINE event failed:", error);
      throw error;
    }
  }

  /**
   * 處理文字訊息
   */
  async handleTextMessage(event) {
    try {
      const text = event.message.text;
      const userId = event.source.userId;
      logger.info("Processing text message:", text);

      // 首先處理模板相關訊息
      const templateResponse = await this.templateService.handleTemplateMessage(
        text,
        userId
      );
      if (templateResponse) {
        await this.lineService.replyMessage(event.replyToken, {
          type: "text",
          text: templateResponse.content,
        });
        return;
      }

      // 如果不是模板訊息，嘗試處理日曆事件
      await this.handleCalendarEventMessage(event);
    } catch (error) {
      logger.error("Handle text message failed:", error);

      // 回覆錯誤訊息
      try {
        await this.lineService.replyMessage(event.replyToken, {
          type: "text",
          text: "❌ 處理訊息時發生錯誤，請稍後再試",
        });
      } catch (replyError) {
        logger.error("Failed to reply error message:", replyError);
      }
    }
  }

  /**
   * 處理群組事件
   */
  async handleGroupEvent(event) {
    try {
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
    } catch (error) {
      logger.error("Handle group event failed:", error);
      throw error;
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
