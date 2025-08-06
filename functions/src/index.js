/**
 * Firebase Functions 主入口文件
 * LINE Bot Webhook 和 Google Calendar 整合服務
 * 遵循 Google OAuth 2.0 Web Server 流程標準
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
const StatusHandler = require("./handlers/statusHandler");
const TokenHandler = require("./handlers/tokenHandler");

// 導入 OAuth 處理器
const OAuthHandler = require("./handlers/oauthHandler");

// 導入工具
const { errorHandler, safeWebhookResponse } = require("./utils/errorHandler");

// 創建處理器實例（延遲初始化以避免環境變數問題）
let lineWebhookHandler, broadcastHandler, statusHandler, tokenHandler;

function initializeHandlers() {
  if (!lineWebhookHandler) {
    lineWebhookHandler = new LineWebhookHandler();
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

// ============================================================================
// OAuth 2.0 Web Server 流程端點
// 遵循 Google OAuth 2.0 官方標準
// ============================================================================

/**
 * 步驟 1: 生成授權 URL
 * 生成 Google OAuth2 授權 URL 並重定向用戶到 Google
 */
exports.oauthAuth = onRequest(
  {
    region: "asia-east1",
    cors: true,
    maxInstances: 3,
  },
  async (req, res) => {
    try {
      await OAuthHandler.generateAuthUrl(req, res);
    } catch (error) {
      errorHandler(error, req, res);
    }
  }
);

/**
 * 步驟 2: 處理授權回調
 * 處理 Google OAuth2 授權回調並交換授權碼獲取 token
 */
exports.oauthCallback = onRequest(
  {
    region: "asia-east1",
    cors: true,
    maxInstances: 3,
  },
  async (req, res) => {
    try {
      await OAuthHandler.handleOAuthCallback(req, res);
    } catch (error) {
      errorHandler(error, req, res);
    }
  }
);

/**
 * 檢查授權狀態
 * 檢查 OAuth2 授權狀態和 token 有效性
 */
exports.oauthStatus = onRequest(
  {
    region: "asia-east1",
    cors: true,
    maxInstances: 3,
  },
  async (req, res) => {
    try {
      await OAuthHandler.checkAuthStatus(req, res);
    } catch (error) {
      errorHandler(error, req, res);
    }
  }
);

/**
 * 強制重新授權
 * 強制清理舊 token 並重新授權
 */
exports.oauthForceReauth = onRequest(
  {
    region: "asia-east1",
    cors: true,
    maxInstances: 3,
  },
  async (req, res) => {
    try {
      await OAuthHandler.forceReauthorization(req, res);
    } catch (error) {
      errorHandler(error, req, res);
    }
  }
);

/**
 * Token 健康檢查
 * 執行詳細的 Token 健康檢查
 */
exports.oauthHealth = onRequest(
  {
    region: "asia-east1",
    cors: true,
    maxInstances: 3,
  },
  async (req, res) => {
    try {
      await OAuthHandler.tokenHealthCheck(req, res);
    } catch (error) {
      errorHandler(error, req, res);
    }
  }
);

/**
 * OAuth 錯誤診斷
 * 分類和診斷 OAuth 錯誤
 */
exports.oauthDiagnose = onRequest(
  {
    region: "asia-east1",
    cors: true,
    maxInstances: 3,
  },
  async (req, res) => {
    try {
      await OAuthHandler.diagnoseOAuthError(req, res);
    } catch (error) {
      errorHandler(error, req, res);
    }
  }
);

/**
 * OAuth 流程信息
 * 提供 OAuth 2.0 Web Server 流程的詳細信息
 */
exports.oauthFlowInfo = onRequest(
  {
    region: "asia-east1",
    cors: true,
    maxInstances: 3,
  },
  async (req, res) => {
    try {
      await OAuthHandler.getOAuthFlowInfo(req, res);
    } catch (error) {
      errorHandler(error, req, res);
    }
  }
);

// 導出處理器類別供測試使用
exports.LineWebhookHandler = LineWebhookHandler;
exports.StatusHandler = StatusHandler;
exports.TokenHandler = TokenHandler;
