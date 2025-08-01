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
const TokenHandler = require("./handlers/tokenHandler");

// 導入工具
const { errorHandler, safeWebhookResponse } = require("./utils/errorHandler");

// 創建處理器實例（延遲初始化以避免環境變數問題）
let lineWebhookHandler, broadcastHandler, statusHandler, tokenHandler;

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
  if (!tokenHandler) {
    tokenHandler = new TokenHandler();
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

/**
 * Token 狀態檢查函數
 * 檢查 Google OAuth token 的狀態
 */
exports.tokenStatus = onRequest(
  {
    region: "asia-east1",
    cors: true,
    maxInstances: 3,
  },
  async (req, res) => {
    try {
      initializeHandlers();
      await tokenHandler.checkTokenStatus(req, res);
    } catch (error) {
      errorHandler(error, req, res);
    }
  }
);

/**
 * Token 更新函數
 * 手動更新 Google OAuth token
 */
exports.updateTokens = onRequest(
  {
    region: "asia-east1",
    cors: true,
    maxInstances: 3,
  },
  async (req, res) => {
    try {
      initializeHandlers();
      await tokenHandler.updateTokens(req, res);
    } catch (error) {
      errorHandler(error, req, res);
    }
  }
);

/**
 * Token 刷新函數
 * 手動刷新 Google OAuth token
 */
exports.refreshTokens = onRequest(
  {
    region: "asia-east1",
    cors: true,
    maxInstances: 3,
  },
  async (req, res) => {
    try {
      initializeHandlers();
      await tokenHandler.refreshTokens(req, res);
    } catch (error) {
      errorHandler(error, req, res);
    }
  }
);

/**
 * Token 資訊函數
 * 獲取 token 詳細資訊
 */
exports.tokenInfo = onRequest(
  {
    region: "asia-east1",
    cors: true,
    maxInstances: 3,
  },
  async (req, res) => {
    try {
      initializeHandlers();
      await tokenHandler.getTokenInfo(req, res);
    } catch (error) {
      errorHandler(error, req, res);
    }
  }
);

/**
 * Token 有效性測試函數
 * 測試 token 是否有效
 */
exports.testToken = onRequest(
  {
    region: "asia-east1",
    cors: true,
    maxInstances: 3,
  },
  async (req, res) => {
    try {
      initializeHandlers();
      await tokenHandler.testTokenValidity(req, res);
    } catch (error) {
      errorHandler(error, req, res);
    }
  }
);

/**
 * Token 清理函數
 * 清理過期的 token 資訊
 */
exports.cleanupTokens = onRequest(
  {
    region: "asia-east1",
    cors: true,
    maxInstances: 3,
  },
  async (req, res) => {
    try {
      initializeHandlers();
      await tokenHandler.cleanupTokens(req, res);
    } catch (error) {
      errorHandler(error, req, res);
    }
  }
);

// 導出處理器類別供測試使用
exports.LineWebhookHandler = LineWebhookHandler;
exports.BroadcastHandler = BroadcastHandler;
exports.StatusHandler = StatusHandler;
exports.TokenHandler = TokenHandler;
