/**
 * Google Calendar 服務
 * 處理所有 Google Calendar 相關的操作
 */

const { google } = require("googleapis");
const TokenService = require("./tokenService");
const dayjs = require("dayjs");

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
    return this.calendarClient;
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
   * 增強的服務初始化（包含重試邏輯）
   */
  async initializeWithRetry(maxRetries = 3) {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const client = await this.initialize();
        return client;
      } catch (error) {
        lastError = error;

        // 如果是重新授權錯誤，直接拋出
        if (error.requiresReauthorization) {
          throw error;
        }

        if (attempt < maxRetries) {
          // 指數退避重試
          const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
          await new Promise((resolve) => setTimeout(resolve, delay));

          // 重置初始化狀態
          this.isInitialized = false;
        }
      }
    }

    // 所有重試都失敗
    throw new Error(
      `Calendar service initialization failed after ${maxRetries} attempts: ${lastError.message}`
    );
  }

  /**
   * 處理認證錯誤並嘗試恢復
   */
  async handleAuthError(error, operation) {
    // 檢查是否需要重新授權
    if (error.requiresReauthorization && error.reauthorizationInfo) {
      throw new Error(
        `Calendar ${operation} requires reauthorization. Please reauthorize first.`
      );
    }

    // 檢查是否為認證錯誤（401/403）
    if (error.code === 401 || error.code === 403) {
      this.isInitialized = false;

      try {
        await this.initializeWithRetry(2);
        return true; // 表示可以重試
      } catch (retryError) {
        throw new Error(
          `Calendar ${operation} failed after reinitialization: ${retryError.message}`
        );
      }
    }

    // 其他錯誤直接拋出
    throw error;
  }

  /**
   * 解析日曆事件文字
   */
  parseCalendarEventFromText(text) {
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
      return null;
    }

    return eventData;
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
    // 確保服務已初始化
    await this.ensureInitialized();

    // 解析日期時間
    const startDateTime = dayjs(eventData["開始"]);
    const endDateTime = dayjs(eventData["結束"]);

    if (!startDateTime.isValid() || !endDateTime.isValid()) {
      throw new Error("無效的日期時間格式");
    }

    // 構建事件物件
    const event = {
      summary: eventData["標題"],
      description: eventData["說明"] || "",
      location: eventData["地點"] || "",
      start: {
        dateTime: startDateTime.format("YYYY-MM-DDTHH:mm:ss"),
        timeZone: "Asia/Taipei",
      },
      end: {
        dateTime: endDateTime.format("YYYY-MM-DDTHH:mm:ss"),
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

    // 調用 Google Calendar API 創建事件
    const response = await this.calendarClient.events.insert({
      calendarId: "primary", // 使用主要日曆
      resource: event,
      sendUpdates: "none", // 不發送通知郵件
    });

    return {
      success: true,
      eventId: response.data.id,
      htmlLink: response.data.htmlLink,
      summary: response.data.summary,
    };
  }

  /**
   * 獲取日曆事件列表
   */
  async getEvents(calendarId = "primary", options = {}) {
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
  }

  /**
   * 更新日曆事件
   */
  async updateEvent(eventId, updates, calendarId = "primary") {
    await this.ensureInitialized();

    const response = await this.calendarClient.events.update({
      calendarId,
      eventId,
      resource: updates,
    });

    return response.data;
  }

  /**
   * 刪除日曆事件
   */
  async deleteEvent(eventId, calendarId = "primary") {
    await this.ensureInitialized();

    await this.calendarClient.events.delete({
      calendarId,
      eventId,
    });

    return { success: true };
  }

  /**
   * 檢查日曆服務狀態
   */
  async checkStatus() {
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

  /**
   * 獲取今日行程
   */
  async getTodayEvents() {
    return await this.getEventsByDate(dayjs());
  }

  /**
   * 根據日期獲取行程
   */
  async getEventsByDate(targetDate) {
    // 確保服務已初始化
    await this.ensureInitialized();

    // 獲取指定日期的開始和結束時間
    const startOfDay = targetDate.startOf("day");
    const endOfDay = targetDate.endOf("day");

    const timeMin = startOfDay.format("YYYY-MM-DDTHH:mm:ss");
    const timeMax = endOfDay.format("YYYY-MM-DDTHH:mm:ss");

    // 調用 Google Calendar API 獲取事件
    const response = await this.calendarClient.events.list({
      calendarId: "primary",
      timeMin: timeMin,
      timeMax: timeMax,
      singleEvents: true,
      orderBy: "startTime",
      maxResults: 50, // 增加結果數量以確保獲取所有事件
    });

    const events = response.data.items || [];

    // 格式化事件資訊
    const formattedEvents = events.map((event) => {
      const start = event.start.dateTime || event.start.date;
      const end = event.end.dateTime || event.end.date;

      // 格式化時間顯示
      let timeDisplay = "";
      if (event.start.dateTime) {
        // 有具體時間的事件
        const startTime = dayjs(start).format("HH:mm");
        const endTime = dayjs(end).format("HH:mm");
        timeDisplay = `${startTime} - ${endTime}`;
      } else {
        // 全天事件
        timeDisplay = "全天";
      }

      return {
        summary: event.summary || "無標題",
        time: timeDisplay,
        location: event.location || "",
        description: event.description || "",
        htmlLink: event.htmlLink,
        start: start,
        end: end,
        isAllDay: !event.start.dateTime,
      };
    });

    return {
      success: true,
      count: formattedEvents.length,
      events: formattedEvents,
      date: targetDate.format("YYYY年MM月DD日"),
      isToday: targetDate.isSame(dayjs(), "day"),
    };
  }
}

module.exports = CalendarService;
