/**
 * LINE Bot 服務
 * 處理所有 LINE Bot 相關的操作
 */

const { Client, middleware } = require("@line/bot-sdk");
const { logger } = require("firebase-functions");
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
          logger.error("LINE signature validation failed:", error);
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
    try {
      await this.client.replyMessage(replyToken, message);
      logger.info("✅ LINE message replied successfully");
    } catch (error) {
      logger.error("❌ Failed to reply LINE message:", error);
      throw error;
    }
  }

  /**
   * 推送訊息到群組
   */
  async pushMessage(groupId, message) {
    try {
      await this.client.pushMessage(groupId, message);
      logger.info(`✅ Message pushed to group ${groupId} successfully`);
    } catch (error) {
      logger.error(`❌ Failed to push message to group ${groupId}:`, error);
      throw error;
    }
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
          logger.error(`Broadcast to group ${group.groupId} failed:`, error);
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
    try {
      if (event.type === "join" && event.source.type === "group") {
        const groupId = event.source.groupId;
        logger.info(`Group joined: ${groupId}`);

        // 發送歡迎訊息
        await this.replyMessage(event.replyToken, {
          type: "text",
          text: "👋 歡迎加入！我是您的 LINE Bot 助手。",
        });

        return { groupId, action: "welcome_sent" };
      }
      return null;
    } catch (error) {
      logger.error("Handle group join failed:", error);
      throw error;
    }
  }

  /**
   * 處理文字訊息
   */
  async handleTextMessage(event) {
    try {
      const text = event.message.text;
      logger.info(`Received text message: ${text}`);

      // 這裡可以添加更多的文字訊息處理邏輯
      // 例如：命令處理、關鍵字回應等

      return { text, processed: true };
    } catch (error) {
      logger.error("Handle text message failed:", error);
      throw error;
    }
  }

  /**
   * 處理一般訊息事件
   */
  async handleMessageEvent(event) {
    try {
      switch (event.message.type) {
        case "text":
          return await this.handleTextMessage(event);
        case "image":
          logger.info("Received image message");
          return { type: "image", processed: true };
        case "video":
          logger.info("Received video message");
          return { type: "video", processed: true };
        case "audio":
          logger.info("Received audio message");
          return { type: "audio", processed: true };
        case "file":
          logger.info("Received file message");
          return { type: "file", processed: true };
        default:
          logger.info(`Received unknown message type: ${event.message.type}`);
          return { type: "unknown", processed: false };
      }
    } catch (error) {
      logger.error("Handle message event failed:", error);
      throw error;
    }
  }

  /**
   * 處理所有 LINE 事件
   */
  async handleEvent(event) {
    try {
      logger.info(`Processing event type: ${event.type}`);

      switch (event.type) {
        case "message":
          return await this.handleMessageEvent(event);
        case "join":
          return await this.handleGroupJoin(event);
        case "leave":
          logger.info("Bot left group");
          return { type: "leave", processed: true };
        case "follow":
          logger.info("User followed bot");
          return { type: "follow", processed: true };
        case "unfollow":
          logger.info("User unfollowed bot");
          return { type: "unfollow", processed: true };
        default:
          logger.info(`Unhandled event type: ${event.type}`);
          return { type: event.type, processed: false };
      }
    } catch (error) {
      logger.error("Handle event failed:", error);
      throw error;
    }
  }
}

module.exports = LineService;
