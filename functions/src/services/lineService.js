/**
 * LINE Bot 服務
 * 處理所有 LINE Bot 相關的操作
 */

const { Client, middleware } = require("@line/bot-sdk");
const { LINE_CONFIG } = require("../config");

/**
 * LINE Bot 服務類
 */
class LineService {
  constructor() {
    this.client = new Client(LINE_CONFIG);
    this.middleware = middleware(LINE_CONFIG);
  }

  /**
   * 驗證 LINE webhook 簽名
   */
  validateSignature(req, res, next) {
    return new Promise((resolve, reject) => {
      this.middleware(req, res, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * 回覆訊息
   */
  async replyMessage(replyToken, message) {
    await this.client.replyMessage(replyToken, message);
  }

  /**
   * 推送訊息到群組
   */
  async pushMessage(groupId, message) {
    await this.client.pushMessage(groupId, message);
  }

  /**
   * 廣播訊息到多個群組
   */
  async broadcastToGroups(groups, message) {
    const results = await Promise.all(
      groups.map(async (group) => {
        try {
          await this.pushMessage(group.groupId, message);
          return { groupId: group.groupId, status: "success" };
        } catch (error) {
          return {
            groupId: group.groupId,
            status: "error",
            error: error.message,
          };
        }
      })
    );

    return results;
  }

  /**
   * 處理群組加入事件
   */
  async handleGroupJoin(event) {
    if (event.type === "join" && event.source.type === "group") {
      const groupId = event.source.groupId;

      // 發送歡迎訊息
      await this.replyMessage(event.replyToken, {
        type: "text",
        text: "👋 歡迎加入！我是您的 LINE Bot 助手。",
      });

      return { groupId, action: "welcome_sent" };
    }
    return null;
  }

  /**
   * 處理文字訊息
   */
  async handleTextMessage(event) {
    const text = event.message.text;

    // 這裡可以添加更多的文字訊息處理邏輯
    // 例如：命令處理、關鍵字回應等

    return { text, processed: true };
  }

  /**
   * 處理一般訊息事件
   */
  async handleMessageEvent(event) {
    switch (event.message.type) {
    case "text":
      return await this.handleTextMessage(event);
    case "image":
      return { type: "image", processed: true };
    case "video":
      return { type: "video", processed: true };
    case "audio":
      return { type: "audio", processed: true };
    case "file":
      return { type: "file", processed: true };
    default:
      return { type: "unknown", processed: false };
    }
  }

  /**
   * 處理所有 LINE 事件
   */
  async handleEvent(event) {
    switch (event.type) {
    case "message":
      return await this.handleMessageEvent(event);
    case "join":
      return await this.handleGroupJoin(event);
    case "leave":
      return { type: "leave", processed: true };
    case "follow":
      return { type: "follow", processed: true };
    case "unfollow":
      return { type: "unfollow", processed: true };
    default:
      return { type: event.type, processed: false };
    }
  }
}

module.exports = LineService;
