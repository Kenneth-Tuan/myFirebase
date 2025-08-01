/**
 * Google Calendar 服務
 * 處理所有 Google Calendar 相關的操作
 */

const { google } = require("googleapis");
const { logger } = require("firebase-functions");
const { CALENDAR_CONFIG } = require("../config");
const TokenService = require("./tokenService");

/**
 * Google Calendar 服務類
 */
class CalendarService {
  constructor() {
    this.tokenService = new TokenService();
    this.calendarClient = null;
    this.isInitialized = false;
  }

  /**
   * 初始化 Calendar 服務
   */
  async initialize() {
    try {
      if (this.isInitialized) {
        return this.calendarClient;
      }

      // 使用 TokenService 獲取有效的 OAuth2 客戶端
      const oAuth2Client = await this.tokenService.setOAuth2Credentials();

      this.calendarClient = google.calendar({
        version: "v3",
        auth: oAuth2Client,
      });

      this.isInitialized = true;
      logger.info("✅ Google Calendar 服務初始化成功");
      return this.calendarClient;
    } catch (error) {
      logger.error("❌ Google Calendar 服務初始化失敗:", error);

      // 如果 OAuth 失敗，回退到 API Key 認證
      if (CALENDAR_CONFIG.apiKey) {
        logger.info("🔄 回退到 API Key 認證");
        this.calendarClient = google.calendar({
          version: "v3",
          auth: CALENDAR_CONFIG.apiKey,
        });
        this.isInitialized = true;
        return this.calendarClient;
      }

      throw error;
    }
  }

  /**
   * 確保服務已初始化
   */
  async ensureInitialized() {
    if (!this.isInitialized) {
      await this.initialize();
    }
    return this.calendarClient;
  }

  /**
   * 解析日曆事件文字
   */
  parseCalendarEventFromText(text) {
    try {
      // 檢查是否為事件類型
      if (!text.includes("類型: 事件")) {
        return null;
      }

      const lines = text.split("\n");
      const eventData = {};

      for (const line of lines) {
        const [key, value] = line.split(": ").map((s) => s.trim());
        if (key && value) {
          eventData[key] = value;
        }
      }

      // 驗證必要欄位
      if (!eventData["標題"] || !eventData["開始"] || !eventData["結束"]) {
        logger.info("缺少必要欄位，無法創建事件");
        return null;
      }

      return eventData;
    } catch (error) {
      logger.error("解析日曆事件文字時發生錯誤:", error);
      return null;
    }
  }

  /**
   * 轉換重複規則格式
   */
  convertRecurrenceRule(repeatRule) {
    if (!repeatRule) return null;
    return repeatRule.trim().toUpperCase();
  }

  /**
   * 創建 Google Calendar 事件
   */
  async createEvent(eventData) {
    try {
      logger.info("開始創建 Google Calendar 事件:", eventData);

      // 確保服務已初始化
      await this.ensureInitialized();

      // 解析日期時間
      const startDateTime = new Date(eventData["開始"]);
      const endDateTime = new Date(eventData["結束"]);

      if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
        throw new Error("無效的日期時間格式");
      }

      // 構建事件物件
      const event = {
        summary: eventData["標題"],
        description: eventData["說明"] || "",
        location: eventData["地點"] || "",
        start: {
          dateTime: startDateTime.toISOString(),
          timeZone: "Asia/Taipei",
        },
        end: {
          dateTime: endDateTime.toISOString(),
          timeZone: "Asia/Taipei",
        },
      };

      // 處理參加者
      if (eventData["參加者"]) {
        const attendees = eventData["參加者"]
          .split(",")
          .map((email) => email.trim())
          .filter((email) => email.includes("@"));

        if (attendees.length > 0) {
          event.attendees = attendees.map((email) => ({ email }));
        }
      }

      // 處理提醒
      if (eventData["提醒"]) {
        const reminderMinutes = parseInt(eventData["提醒"]);
        if (!isNaN(reminderMinutes)) {
          event.reminders = {
            useDefault: false,
            overrides: [
              {
                method: "email",
                minutes: reminderMinutes,
              },
              {
                method: "popup",
                minutes: reminderMinutes,
              },
            ],
          };
        }
      }

      // 處理重複規則
      if (eventData["重複"]) {
        const recurrenceRule = this.convertRecurrenceRule(eventData["重複"]);
        if (recurrenceRule) {
          event.recurrence = [`RRULE:${recurrenceRule}`];
        }
      }

      logger.info("準備創建的事件物件:", JSON.stringify(event, null, 2));

      // 調用 Google Calendar API 創建事件
      const response = await this.calendarClient.events.insert({
        calendarId: "primary", // 使用主要日曆
        resource: event,
        sendUpdates: "none", // 不發送通知郵件
      });

      logger.info("✅ Google Calendar 事件創建成功:", response.data.id);

      return {
        success: true,
        eventId: response.data.id,
        htmlLink: response.data.htmlLink,
        summary: response.data.summary,
      };
    } catch (error) {
      logger.error("❌ 創建 Google Calendar 事件失敗:", error);

      // 如果是認證錯誤，嘗試重新初始化
      if (error.code === 401 || error.code === 403) {
        logger.info("🔄 檢測到認證錯誤，嘗試重新初始化...");
        this.isInitialized = false;
        try {
          await this.initialize();
          // 重新嘗試創建事件
          return await this.createEvent(eventData);
        } catch (retryError) {
          logger.error("❌ 重新初始化後仍然失敗:", retryError);
          throw retryError;
        }
      }

      throw error;
    }
  }

  /**
   * 獲取日曆事件列表
   */
  async getEvents(calendarId = "primary", options = {}) {
    try {
      await this.ensureInitialized();

      const {
        timeMin = new Date().toISOString(),
        timeMax,
        maxResults = 10,
        singleEvents = true,
        orderBy = "startTime",
      } = options;

      const response = await this.calendarClient.events.list({
        calendarId,
        timeMin,
        timeMax,
        maxResults,
        singleEvents,
        orderBy,
      });

      return response.data.items || [];
    } catch (error) {
      logger.error("獲取日曆事件失敗:", error);
      throw error;
    }
  }

  /**
   * 更新日曆事件
   */
  async updateEvent(eventId, updates, calendarId = "primary") {
    try {
      await this.ensureInitialized();

      const response = await this.calendarClient.events.update({
        calendarId,
        eventId,
        resource: updates,
      });

      logger.info("✅ Google Calendar 事件更新成功:", eventId);
      return response.data;
    } catch (error) {
      logger.error("❌ 更新 Google Calendar 事件失敗:", error);
      throw error;
    }
  }

  /**
   * 刪除日曆事件
   */
  async deleteEvent(eventId, calendarId = "primary") {
    try {
      await this.ensureInitialized();

      await this.calendarClient.events.delete({
        calendarId,
        eventId,
      });

      logger.info("✅ Google Calendar 事件刪除成功:", eventId);
      return { success: true };
    } catch (error) {
      logger.error("❌ 刪除 Google Calendar 事件失敗:", error);
      throw error;
    }
  }

  /**
   * 檢查日曆服務狀態
   */
  async checkStatus() {
    try {
      await this.ensureInitialized();

      // 檢查 token 狀態
      const tokenStatus = await this.tokenService.checkTokenStatus();

      // 測試 API 連接
      await this.calendarClient.calendarList.list({ maxResults: 1 });

      return {
        status: "connected",
        message: "Calendar service is working",
        tokenStatus: tokenStatus,
      };
    } catch (error) {
      logger.error("Calendar service status check failed:", error);
      return {
        status: "error",
        message: error.message,
        tokenStatus: await this.tokenService.checkTokenStatus(),
      };
    }
  }

  /**
   * 獲取 token 狀態
   */
  async getTokenStatus() {
    return await this.tokenService.checkTokenStatus();
  }

  /**
   * 手動更新 token
   */
  async updateTokens(accessToken, refreshToken, expiryDate) {
    return await this.tokenService.updateTokens(
      accessToken,
      refreshToken,
      expiryDate
    );
  }
}

module.exports = CalendarService;
