/**
 * 廣播處理器
 * 處理群組廣播功能
 */

const { logger } = require("firebase-functions");
const LineService = require("../services/lineService");
const FirestoreService = require("../services/firestoreService");

/**
 * 廣播處理器類
 */
class BroadcastHandler {
  constructor() {
    this.lineService = new LineService();
    this.firestoreService = new FirestoreService();
  }

  /**
   * 處理廣播請求
   */
  async handleBroadcastRequest(req, res) {
    try {
      const { message, groupIds, messageType = "text" } = req.body;

      if (!message) {
        res.status(400).json({
          error: "Message is required",
          example: {
            message: "Hello, this is a broadcast message",
            groupIds: ["optional", "specific", "group", "ids"],
            messageType: "text", // or "image", "video", etc.
          },
        });
        return;
      }

      // 從 Firestore 獲取群組列表
      const groups = await this.firestoreService.getAllGroups();

      if (groups.length === 0) {
        res.status(404).json({
          error: "No groups found",
          note: "Bot needs to be added to LINE groups first",
        });
        return;
      }

      // 如果指定了特定群組，則只廣播到這些群組
      let targetGroups = groups;
      if (groupIds && Array.isArray(groupIds) && groupIds.length > 0) {
        targetGroups = groups.filter(
          (group) =>
            groupIds.includes(group.groupId) || groupIds.includes(group.id)
        );

        if (targetGroups.length === 0) {
          res.status(404).json({
            error: "No matching groups found",
            requestedGroups: groupIds,
            availableGroups: groups.map((g) => g.groupId),
          });
          return;
        }
      }

      // 構建訊息物件
      const messageObject = this.buildMessageObject(message, messageType);

      // 發送廣播消息
      const results = await this.lineService.broadcastToGroups(
        targetGroups,
        messageObject
      );

      // 統計結果
      const successCount = results.filter((r) => r.status === "success").length;
      const errorCount = results.filter((r) => r.status === "error").length;

      const response = {
        message: "Broadcast completed",
        summary: {
          totalGroups: targetGroups.length,
          successCount,
          errorCount,
          successRate: `${((successCount / targetGroups.length) * 100).toFixed(
            1
          )}%`,
        },
        results,
        timestamp: new Date().toISOString(),
      };

      // 記錄廣播活動
      await this.firestoreService.logWebhookEvent("broadcast", {
        message,
        targetGroups: targetGroups.length,
        results: response.summary,
      });

      logger.info(
        `Broadcast completed: ${successCount}/${targetGroups.length} successful`
      );

      res.status(200).json(response);
    } catch (error) {
      logger.error("Broadcast error:", error);
      res.status(500).json({
        error: "Internal server error",
        message: error.message,
      });
    }
  }

  /**
   * 構建訊息物件
   */
  buildMessageObject(message, messageType) {
    switch (messageType) {
    case "text":
      return {
        type: "text",
        text: message,
      };
    case "image":
      return {
        type: "image",
        originalContentUrl: message,
        previewImageUrl: message,
      };
    case "video":
      return {
        type: "video",
        originalContentUrl: message,
        previewImageUrl: message,
      };
    case "audio":
      return {
        type: "audio",
        originalContentUrl: message,
        duration: 60000, // 預設 60 秒
      };
    case "location":
      // 假設 message 是 JSON 格式的位置資訊
      try {
        const locationData = JSON.parse(message);
        return {
          type: "location",
          title: locationData.title || "Location",
          address: locationData.address || "",
          latitude: locationData.latitude,
          longitude: locationData.longitude,
        };
      } catch (error) {
        logger.error("Invalid location data format:", error);
        throw new Error("Invalid location data format");
      }
    case "sticker":
      // 假設 message 是 JSON 格式的貼圖資訊
      try {
        const stickerData = JSON.parse(message);
        return {
          type: "sticker",
          packageId: stickerData.packageId,
          stickerId: stickerData.stickerId,
        };
      } catch (error) {
        logger.error("Invalid sticker data format:", error);
        throw new Error("Invalid sticker data format");
      }
    default:
      return {
        type: "text",
        text: message,
      };
    }
  }

  /**
   * 處理廣播請求（主函數）
   */
  async handleRequest(req, res) {
    // 設置 CORS headers
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");

    // 處理 OPTIONS 請求
    if (req.method === "OPTIONS") {
      res.status(200).end();
      return;
    }

    // 只處理 POST 請求
    if (req.method !== "POST") {
      res.status(405).json({
        error: "Method not allowed",
        method: req.method,
        allowed: "POST",
        note: "Use POST method to send broadcast messages",
      });
      return;
    }

    // 處理廣播請求
    await this.handleBroadcastRequest(req, res);
  }
}

module.exports = BroadcastHandler;
