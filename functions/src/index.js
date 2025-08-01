/**
 * Firebase Functions 主入口文件
 * LINE Bot Webhook 和 Google Calendar 整合服務
 *
 * 模組化架構：
 * - config/: 配置管理
 * - services/: 業務邏輯服務
 * - handlers/: 請求處理器
 * - utils/: 工具函數
 */

const { onRequest } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");

// 初始化 Firebase Admin
initializeApp();

// 導入處理器
const LineWebhookHandler = require("./handlers/lineWebhookHandler");
const BroadcastHandler = require("./handlers/broadcastHandler");
const StatusHandler = require("./handlers/statusHandler");

// 導入工具
const { errorHandler, safeWebhookResponse } = require("./utils/errorHandler");

// 創建處理器實例（延遲初始化以避免環境變數問題）
let lineWebhookHandler, broadcastHandler, statusHandler;

function initializeHandlers() {
  if (!lineWebhookHandler) {
    lineWebhookHandler = new LineWebhookHandler();
  }
  if (!broadcastHandler) {
    broadcastHandler = new BroadcastHandler();
  }
  if (!statusHandler) {
    statusHandler = new StatusHandler();
  }
}

/**
 * LINE Webhook 函數
 * 處理 LINE Bot 的 webhook 事件
 */
exports.lineWebhook = onRequest(
  {
    region: "asia-east1",
    cors: true,
    maxInstances: 10,
  },
  async (req, res) => {
    try {
      initializeHandlers();
      await lineWebhookHandler.handleRequest(req, res);
    } catch (error) {
      // 對於 webhook，使用安全錯誤回應
      safeWebhookResponse(error, res);
    }
  }
);

/**
 * 廣播函數
 * 向所有 LINE 群組發送廣播訊息
 */
exports.broadcast = onRequest(
  {
    region: "asia-east1",
    cors: true,
    maxInstances: 5,
  },
  async (req, res) => {
    try {
      initializeHandlers();
      await broadcastHandler.handleRequest(req, res);
    } catch (error) {
      errorHandler(error, req, res);
    }
  }
);

/**
 * 狀態檢查函數
 * 提供系統狀態和健康檢查
 */
exports.status = onRequest(
  {
    region: "asia-east1",
    cors: true,
    maxInstances: 3,
  },
  async (req, res) => {
    try {
      initializeHandlers();
      await statusHandler.handleRequest(req, res);
    } catch (error) {
      errorHandler(error, req, res);
    }
  }
);

/**
 * 健康檢查函數
 * 專門用於健康檢查端點
 */
exports.health = onRequest(
  {
    region: "asia-east1",
    cors: true,
    maxInstances: 3,
  },
  async (req, res) => {
    try {
      initializeHandlers();
      await statusHandler.handleHealthRequest(req, res);
    } catch (error) {
      errorHandler(error, req, res);
    }
  }
);

/**
 * 詳細統計函數
 * 提供詳細的系統統計資訊
 */
exports.stats = onRequest(
  {
    region: "asia-east1",
    cors: true,
    maxInstances: 3,
  },
  async (req, res) => {
    try {
      initializeHandlers();
      await statusHandler.handleDetailedStatsRequest(req, res);
    } catch (error) {
      errorHandler(error, req, res);
    }
  }
);

// 導出處理器類別供測試使用
module.exports = {
  LineWebhookHandler,
  BroadcastHandler,
  StatusHandler,
};
