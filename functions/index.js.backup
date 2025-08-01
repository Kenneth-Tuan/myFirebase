// Firebase Functions for LINE Bot Webhook and Google Calendar Integration
const { logger } = require("firebase-functions");
const { onRequest } = require("firebase-functions/v2/https");

// LINE Bot SDK
const { Client, middleware } = require("@line/bot-sdk");

// Google APIs
const { google } = require("googleapis");

// Firebase Admin SDK
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

// 初始化 Firebase Admin
initializeApp();

// LINE Bot 配置
const LINE_CONFIG = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

// LINE Client 將在需要時動態創建

// Google Calendar 配置
const CALENDAR_API_KEY = process.env.CALENDAR_API_KEY;
const CALENDAR_CREDENTIALS = process.env.GOOGLE_CALENDAR_CREDENTIALS;
const CALENDAR_TOKEN = process.env.GOOGLE_CALENDAR_TOKEN;

// 設定 Google Calendar 認證
let calendarAuth;

if (CALENDAR_CREDENTIALS && CALENDAR_TOKEN) {
  try {
    const credentials = JSON.parse(CALENDAR_CREDENTIALS);
    const token = JSON.parse(CALENDAR_TOKEN);

    calendarAuth = new google.auth.OAuth2(
      credentials.client_id,
      credentials.client_secret,
      credentials.redirect_uris[0]
    );

    calendarAuth.setCredentials(token);
    logger.info("✅ Google Calendar OAuth2 認證已設定");
  } catch (error) {
    logger.error("❌ Google Calendar 認證設定失敗:", error);
    calendarAuth = CALENDAR_API_KEY; // 回退到 API Key
  }
} else {
  logger.info("⚠️ 未找到 OAuth2 憑證，使用 API Key 認證");
  calendarAuth = CALENDAR_API_KEY; // 使用 API Key
}

const calendarClient = google.calendar({
  version: "v3",
  auth: calendarAuth,
});

// 1. LINE Webhook 處理函數
exports.lineWebhook = onRequest(
  {
    region: "asia-east1",
    cors: true,
  },
  async (req, res) => {
    // 設置 CORS headers
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type, X-Line-Signature");

    // 處理 OPTIONS 請求
    if (req.method === "OPTIONS") {
      res.status(200).end();
      return;
    }

    // 處理 GET 請求 - 顯示 webhook 信息
    if (req.method === "GET") {
      const envCheck = {
        channelSecret: {
          exists: !!process.env.LINE_CHANNEL_SECRET,
          length: process.env.LINE_CHANNEL_SECRET
            ? process.env.LINE_CHANNEL_SECRET.length
            : 0,
          preview: process.env.LINE_CHANNEL_SECRET
            ? `${process.env.LINE_CHANNEL_SECRET.substring(0, 8)}...`
            : "Not set",
        },
        channelAccessToken: {
          exists: !!process.env.LINE_CHANNEL_ACCESS_TOKEN,
          length: process.env.LINE_CHANNEL_ACCESS_TOKEN
            ? process.env.LINE_CHANNEL_ACCESS_TOKEN.length
            : 0,
          preview: process.env.LINE_CHANNEL_ACCESS_TOKEN
            ? `${process.env.LINE_CHANNEL_ACCESS_TOKEN.substring(0, 8)}...`
            : "Not set",
        },
      };

      const info = {
        timestamp: new Date().toISOString(),
        deployment: {
          platform: "Firebase Functions",
          region: "asia-east1",
          url: "https://asia-east1-kenneth-project-a8d49.cloudfunctions.net/lineWebhook",
        },
        line: {
          configured: !!(
            process.env.LINE_CHANNEL_SECRET &&
            process.env.LINE_CHANNEL_ACCESS_TOKEN
          ),
          config: envCheck,
        },
        webhook: {
          url: "https://asia-east1-kenneth-project-a8d49.cloudfunctions.net/lineWebhook",
          method: "POST",
          note: "LINE webhook verification uses POST method, not GET",
        },
        status:
          process.env.LINE_CHANNEL_SECRET &&
          process.env.LINE_CHANNEL_ACCESS_TOKEN
            ? "✅ Ready for LINE webhook"
            : "❌ Missing LINE configuration",
      };
      res.status(200).json(info);
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

    // 檢查環境變數
    if (
      !process.env.LINE_CHANNEL_SECRET ||
      !process.env.LINE_CHANNEL_ACCESS_TOKEN
    ) {
      logger.error("❌ LINE 環境變數未設定");
      res.status(500).json({
        error: "LINE configuration missing",
        details: {
          channelSecret: !!process.env.LINE_CHANNEL_SECRET,
          channelAccessToken: !!process.env.LINE_CHANNEL_ACCESS_TOKEN,
        },
      });
      return;
    }

    try {
      // 使用 LINE middleware 驗證
      const lineMiddleware = middleware(LINE_CONFIG);

      lineMiddleware(req, res, async () => {
        try {
          const events = req.body.events || [];

          // 重要：如果沒有事件，這可能是 LINE 的驗證請求
          // 必須返回 200 狀態碼
          if (events.length === 0) {
            logger.info("收到 webhook 驗證請求 - 沒有事件，返回 200");
            return res.status(200).end();
          }

          logger.info(`處理 ${events.length} 個 LINE 事件`);

          // 處理每個事件
          await Promise.all(
            events.map(async (event) => {
              // 處理日曆事件訊息
              await handleCalendarEventMessage(event);

              if (event.type === "message" && event.source.type === "group") {
                const groupId = event.source.groupId;
                logger.info(`收到群組消息，群組ID: ${groupId}`);

                // 記錄群組到 Firestore
                await recordGroupJoin(event);

                // 發送確認訊息
                try {
                  const lineClient = new Client(LINE_CONFIG);
                  await lineClient.replyMessage(event.replyToken, {
                    type: "text",
                    text: `✅ 收到訊息，群組已記錄`,
                  });
                } catch (error) {
                  logger.error("回覆訊息失敗:", error);
                }
              }
            })
          );

          // 確保返回 200 狀態碼
          res.status(200).end();
        } catch (error) {
          logger.error("Webhook 處理錯誤:", error);
          // 即使有錯誤，也要返回 200 以避免 LINE 平台重試
          res.status(200).end();
        }
      });
    } catch (error) {
      logger.error("Webhook middleware 錯誤:", error);
      // 重要：即使驗證失敗，也要返回 200 狀態碼
      res.status(200).json({
        error: error.message,
        type: error.name,
        timestamp: new Date().toISOString(),
        note: "Returning 200 to prevent LINE platform from marking webhook as invalid",
      });
    }
  }
);

// 2. 群組廣播函數
exports.broadcast = onRequest(
  {
    region: "asia-east1",
    cors: true,
  },
  async (req, res) => {
    try {
      const { message } = req.body;

      if (!message) {
        res.status(400).json({ error: "Message is required" });
        return;
      }

      // 從 Firestore 獲取群組列表
      const db = getFirestore();
      const groupsSnapshot = await db.collection("line_groups").get();

      const groups = [];
      groupsSnapshot.forEach((doc) => {
        groups.push({ id: doc.id, ...doc.data() });
      });

      if (groups.length === 0) {
        res.status(404).json({ error: "No groups found" });
        return;
      }

      // 發送廣播消息
      const lineClient = new Client(LINE_CONFIG);
      const results = await Promise.all(
        groups.map(async (group) => {
          try {
            await lineClient.pushMessage(group.groupId, {
              type: "text",
              text: message,
            });
            return { groupId: group.groupId, status: "success" };
          } catch (error) {
            logger.error(`發送到群組 ${group.groupId} 失敗:`, error);
            return {
              groupId: group.groupId,
              status: "error",
              error: error.message,
            };
          }
        })
      );

      res.status(200).json({
        message: "Broadcast completed",
        results,
        totalGroups: groups.length,
      });
    } catch (error) {
      logger.error("廣播錯誤:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// 3. 狀態檢查函數
exports.status = onRequest(
  {
    region: "asia-east1",
    cors: true,
  },
  async (req, res) => {
    try {
      const db = getFirestore();

      // 獲取群組數量
      const groupsSnapshot = await db.collection("line_groups").get();
      const groupCount = groupsSnapshot.size;

      // 獲取日曆事件數量
      const eventsSnapshot = await db.collection("calendar_events").get();
      const eventCount = eventsSnapshot.size;

      const status = {
        timestamp: new Date().toISOString(),
        status: "running",
        message: "LINE Bot Firebase Functions is running",
        features: {
          lineWebhook: !!(
            process.env.LINE_CHANNEL_SECRET &&
            process.env.LINE_CHANNEL_ACCESS_TOKEN
          ),
          googleCalendar: !!(CALENDAR_CREDENTIALS || CALENDAR_API_KEY),
        },
        statistics: {
          groups: groupCount,
          events: eventCount,
        },
        endpoints: {
          webhook: "/lineWebhook",
          broadcast: "/broadcast",
          status: "/status",
        },
      };

      res.status(200).json(status);
    } catch (error) {
      logger.error("狀態檢查錯誤:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// 輔助函數
async function recordGroupJoin(event) {
  try {
    const db = getFirestore();
    await db
      .collection("line_groups")
      .doc(event.source.groupId)
      .set({
        groupId: event.source.groupId,
        groupName: event.source.groupName || "Unknown",
        joinedAt: new Date(),
        lastActivity: new Date(),
      });

    logger.info(`記錄群組加入: ${event.source.groupId}`);
  } catch (error) {
    logger.error("記錄群組失敗:", error);
  }
}

/**
 * 解析日曆事件文字
 */
function parseCalendarEventFromText(text) {
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
function convertRecurrenceRule(repeatRule) {
  if (!repeatRule) return null;
  return repeatRule.trim().toUpperCase();
}

/**
 * 創建 Google Calendar 事件
 */
async function createGoogleCalendarEvent(eventData) {
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
      const recurrenceRule = convertRecurrenceRule(eventData["重複"]);
      if (recurrenceRule) {
        event.recurrence = [`RRULE:${recurrenceRule}`];
      }
    }

    logger.info("準備創建的事件物件:", JSON.stringify(event, null, 2));

    // 調用 Google Calendar API 創建事件
    const response = await calendarClient.events.insert({
      calendarId: "primary", // 使用主要日曆
      resource: event,
      sendUpdates: "none", // 不發送通知郵件
    });

    logger.info("✅ Google Calendar 事件創建成功:", response.data.id);

    // 保存到 Firestore
    const db = getFirestore();
    await db.collection("calendar_events").doc(response.data.id).set({
      eventId: response.data.id,
      summary: response.data.summary,
      htmlLink: response.data.htmlLink,
      createdFrom: "line_webhook",
      createdAt: new Date(),
      eventData: eventData,
    });

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
 * 處理 LINE 訊息中的日曆事件
 */
async function handleCalendarEventMessage(event) {
  try {
    if (event.type !== "message" || event.message.type !== "text") {
      return;
    }

    const text = event.message.text;
    logger.info("收到 LINE 訊息:", text);

    // 解析日曆事件資訊
    const eventData = parseCalendarEventFromText(text);
    if (!eventData) {
      logger.info("不是日曆事件訊息或格式不正確");
      return;
    }

    logger.info("解析到的事件資料:", eventData);

    // 創建 Google Calendar 事件
    const result = await createGoogleCalendarEvent(eventData);

    logger.info("日曆事件創建完成:", result);

    // 回覆確認訊息
    try {
      const lineClient = new Client(LINE_CONFIG);
      await lineClient.replyMessage(event.replyToken, {
        type: "text",
        text: `✅ 日曆事件已創建成功！\n標題: ${result.summary}\n連結: ${result.htmlLink}`,
      });
    } catch (error) {
      logger.error("回覆日曆事件確認訊息失敗:", error);
    }
  } catch (error) {
    logger.error("處理日曆事件訊息時發生錯誤:", error);

    // 回覆錯誤訊息
    try {
      const lineClient = new Client(LINE_CONFIG);
      await lineClient.replyMessage(event.replyToken, {
        type: "text",
        text: "❌ 創建日曆事件時發生錯誤，請檢查格式是否正確",
      });
    } catch (replyError) {
      logger.error("回覆錯誤訊息失敗:", replyError);
    }
  }
}
