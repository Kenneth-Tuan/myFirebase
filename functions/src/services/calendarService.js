/**
 * Google Calendar 服務
 * 處理所有 Google Calendar 相關的操作
 */

const { google } = require("googleapis");
const { logger } = require("firebase-functions");
const { CALENDAR_CONFIG } = require("../config");

/**
 * Google Calendar 服務類
 */
class CalendarService {
  constructor() {
    this.calendarAuth = this.initializeAuth();
    this.calendarClient = google.calendar({
      version: "v3",
      auth: this.calendarAuth,
    });
  }

  /**
   * 初始化 Google Calendar 認證
   */
  initializeAuth() {
    if (CALENDAR_CONFIG.credentials && CALENDAR_CONFIG.token) {
      try {
        const credentials = JSON.parse(CALENDAR_CONFIG.credentials);
        const token = JSON.parse(CALENDAR_CONFIG.token);

        const auth = new google.auth.OAuth2(
          credentials.client_id,
          credentials.client_secret,
          credentials.redirect_uris[0]
        );

        auth.setCredentials(token);
        logger.info("✅ Google Calendar OAuth2 認證已設定");
        return auth;
      } catch (error) {
        logger.error("❌ Google Calendar 認證設定失敗:", error);
        logger.info("回退到 API Key 認證");
        return CALENDAR_CONFIG.apiKey;
      }
    } else {
      logger.info("⚠️ 未找到 OAuth2 憑證，使用 API Key 認證");
      return CALENDAR_CONFIG.apiKey;
    }
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
      throw error;
    }
  }

  /**
   * 獲取日曆事件列表
   */
  async getEvents(calendarId = "primary", options = {}) {
    try {
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
      await this.calendarClient.calendarList.list({ maxResults: 1 });
      return { status: "connected", message: "Calendar service is working" };
    } catch (error) {
      logger.error("Calendar service status check failed:", error);
      return { status: "error", message: error.message };
    }
  }
}

module.exports = CalendarService;
