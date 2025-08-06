/**
 * OAuth2 授權處理器
 * 遵循 Google OAuth 2.0 Web Server 流程標準
 * 處理 Google Calendar API 的授權流程
 */

const { onRequest } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");
const TokenService = require("../services/tokenService");
const {
  formatErrorResponse,
  logError,
  wrapServiceCall,
} = require("../utils/errorHandler");

/**
 * 步驟 1: 生成授權 URL 並重定向用戶到 Google
 * 遵循 Google OAuth 2.0 Web Server 流程
 */
exports.generateAuthUrl = onRequest(
  {
    region: "asia-east1",
    cors: true,
  },
  async (req, res) => {
    try {
      const tokenService = new TokenService();

      // 生成隨機 state 參數防止 CSRF 攻擊
      const state = tokenService.generateState();

      // 生成授權 URL
      const authUrl = await wrapServiceCall(
        () => tokenService.generateAuthUrl(state),
        "token_service",
        "generateAuthUrl",
        { state }
      );

      const response = {
        success: true,
        authUrl: authUrl,
        state: state, // 返回 state 參數供客戶端驗證
        message: "請訪問此 URL 進行 OAuth 2.0 授權",
        oauthFlow: "web_server",
        instructions: [
          "1. 點擊上面的 authUrl 連結重定向到 Google",
          "2. 登入您的 Google 帳戶",
          "3. 同意應用程式權限",
          "4. Google 會重定向回您的應用程式",
          "5. 使用返回的授權碼調用 /oauth/callback 端點",
        ],
        securityNotes: [
          "使用 state 參數防止 CSRF 攻擊",
          "授權碼只能使用一次",
          "授權碼有效期為 10 分鐘",
        ],
      };

      res.status(200).json(response);
    } catch (error) {
      const errorResponse = formatErrorResponse(error);
      logError(error, {
        handler: "generateAuthUrl",
        requestMethod: req.method,
        requestUrl: req.url,
      });

      res.status(500).json({
        ...errorResponse,
        oauthFlow: "web_server",
      });
    }
  }
);

/**
 * 步驟 2: 處理 OAuth2 回調並交換授權碼獲取 token
 * 遵循 Google OAuth 2.0 Web Server 流程
 */
exports.handleOAuthCallback = onRequest(
  {
    region: "asia-east1",
    cors: true,
  },
  async (req, res) => {
    try {
      const { code, state, error } = req.query;

      // 檢查是否有 OAuth 錯誤
      if (error) {
        logger.error("❌ OAuth 授權被拒絕:", error);
        return res.status(400).json({
          success: false,
          error: "OAuth authorization was denied",
          errorType: error,
          oauthFlow: "web_server",
        });
      }

      // 驗證授權碼
      if (!code) {
        return res.status(400).json({
          success: false,
          error: "Authorization code is required",
          oauthFlow: "web_server",
        });
      }

      // 使用 TokenService 處理授權碼
      const tokenService = new TokenService();
      const result = await wrapServiceCall(
        () => tokenService.handleAuthorizationCode(code, state),
        "token_service",
        "handleAuthorizationCode",
        { code: !!code, state: !!state }
      );

      const response = {
        success: true,
        message: "✅ OAuth 2.0 授權成功！Token 已保存",
        oauthFlow: "web_server",
        tokenInfo: result.tokenInfo,
        nextSteps: result.nextSteps,
        securityInfo: {
          authorizationCodeUsed: true,
          tokensSecurelyStored: true,
          refreshTokenAvailable: result.tokenInfo.hasRefreshToken,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      const errorResponse = formatErrorResponse(error);
      logError(error, {
        handler: "handleOAuthCallback",
        requestMethod: req.method,
        requestUrl: req.url,
        hasCode: !!req.query.code,
        hasState: !!req.query.state,
      });

      res.status(500).json({
        ...errorResponse,
        oauthFlow: "web_server",
      });
    }
  }
);

/**
 * 檢查授權狀態
 */
exports.checkAuthStatus = onRequest(
  {
    region: "asia-east1",
    cors: true,
  },
  async (req, res) => {
    try {
      const tokenService = new TokenService();
      const [status, needsReauth] = await Promise.all([
        wrapServiceCall(
          () => tokenService.checkTokenStatus(),
          "token_service",
          "checkTokenStatus"
        ),
        wrapServiceCall(
          () => tokenService.needsReauthorization(),
          "token_service",
          "needsReauthorization"
        ),
      ]);

      const response = {
        success: true,
        oauthFlow: "web_server",
        status: status,
        needsReauthorization: needsReauth,
        recommendations: [],
      };

      // 根據狀態提供建議
      if (needsReauth) {
        response.recommendations.push("需要重新授權，請使用 /oauth/auth 端點");
      } else if (status.status === "valid") {
        response.recommendations.push("Token 有效，可以正常使用");
      } else if (status.status === "expired") {
        response.recommendations.push("Token 已過期，系統會自動嘗試刷新");
      } else if (status.status === "not_found") {
        response.recommendations.push(
          "未找到 token，請進行初始 OAuth 2.0 授權"
        );
      }

      res.status(200).json(response);
    } catch (error) {
      logger.error("❌ 檢查授權狀態失敗:", error);
      res.status(500).json({
        success: false,
        error: error.message,
        oauthFlow: "web_server",
      });
    }
  }
);

/**
 * 強制重新授權
 */
exports.forceReauthorization = onRequest(
  {
    region: "asia-east1",
    cors: true,
  },
  async (req, res) => {
    try {
      const tokenService = new TokenService();

      // 清理現有的 token
      await tokenService.clearExpiredTokens();

      // 生成新的授權 URL
      const authUrl = tokenService.generateAuthUrl();

      const response = {
        success: true,
        message: "✅ 已清理舊 token，請重新授權",
        oauthFlow: "web_server",
        authUrl: authUrl,
        steps: [
          "1. 舊 token 已清理",
          "2. 請訪問上面的 authUrl 進行重新授權",
          "3. 完成授權後使用 /oauth/callback 端點",
        ],
        securityNotes: [
          "舊 token 已安全清理",
          "新授權將使用 OAuth 2.0 Web Server 流程",
          "授權碼只能使用一次",
        ],
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error("❌ 強制重新授權失敗:", error);
      res.status(500).json({
        success: false,
        error: error.message,
        oauthFlow: "web_server",
      });
    }
  }
);

/**
 * Token 健康檢查端點
 */
exports.tokenHealthCheck = onRequest(
  {
    region: "asia-east1",
    cors: true,
  },
  async (req, res) => {
    try {
      const tokenService = new TokenService();

      // 執行 Token 健康檢查
      const healthReport = await tokenService.performTokenHealthCheck();

      const response = {
        success: true,
        oauthFlow: "web_server",
        healthCheck: healthReport,
        timestamp: new Date(),
        recommendations: healthReport.recommendations,
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error("❌ Token 健康檢查失敗:", error);
      res.status(500).json({
        success: false,
        error: error.message,
        oauthFlow: "web_server",
      });
    }
  }
);

/**
 * OAuth 錯誤診斷端點
 */
exports.diagnoseOAuthError = onRequest(
  {
    region: "asia-east1",
    cors: true,
  },
  async (req, res) => {
    try {
      const tokenService = new TokenService();
      const { error } = req.body;

      if (!error) {
        return res.status(400).json({
          success: false,
          error: "Error object is required in request body",
          oauthFlow: "web_server",
        });
      }

      // 分類 OAuth 錯誤
      const errorAnalysis = tokenService.categorizeOAuthError(error);

      const response = {
        success: true,
        oauthFlow: "web_server",
        errorAnalysis: errorAnalysis,
        recommendations: getErrorRecommendations(errorAnalysis),
        timestamp: new Date(),
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error("❌ OAuth 錯誤診斷失敗:", error);
      res.status(500).json({
        success: false,
        error: error.message,
        oauthFlow: "web_server",
      });
    }
  }
);

/**
 * 根據錯誤分析生成建議
 */
function getErrorRecommendations(errorAnalysis) {
  const recommendations = [];

  switch (errorAnalysis.type) {
  case "invalid_grant":
    recommendations.push("Refresh token 已過期或被撤銷");
    recommendations.push("需要重新授權，請使用 /oauth/auth 端點");
    recommendations.push("或使用 /oauth/force-reauth 強制重新授權");
    break;

  case "invalid_client":
    recommendations.push("OAuth2 客戶端憑證無效");
    recommendations.push("請檢查 client_id 和 client_secret 配置");
    recommendations.push("確認 Google Cloud Console 中的憑證設置");
    break;

  case "invalid_request":
    recommendations.push("請求格式無效");
    recommendations.push("請檢查 OAuth2 配置和請求參數");
    break;

  case "insufficient_scope":
    recommendations.push("Token 缺少必要的權限範圍");
    recommendations.push("需要重新授權以獲取完整權限");
    recommendations.push("請使用 /oauth/auth 端點重新授權");
    break;

  case "access_denied":
    recommendations.push("用戶拒絕了授權請求");
    recommendations.push("需要用戶重新授權");
    recommendations.push("請使用 /oauth/auth 端點重新授權");
    break;

  default:
    recommendations.push("未知的 OAuth 錯誤");
    recommendations.push("請檢查錯誤詳情並聯繫支持");
    break;
  }

  return recommendations;
}

/**
 * OAuth 流程信息端點
 * 提供 OAuth 2.0 Web Server 流程的詳細信息
 */
exports.getOAuthFlowInfo = onRequest(
  {
    region: "asia-east1",
    cors: true,
  },
  async (req, res) => {
    try {
      const response = {
        success: true,
        oauthFlow: "web_server",
        flowDescription: "Google OAuth 2.0 Web Server Application Flow",
        steps: [
          {
            step: 1,
            name: "Authorization Request",
            description: "應用程式將用戶重定向到 Google 授權伺服器",
            endpoint: "/oauth/auth",
            method: "GET",
            parameters: [
              "client_id",
              "redirect_uri",
              "scope",
              "state",
              "response_type=code",
            ],
          },
          {
            step: 2,
            name: "User Authorization",
            description: "用戶在 Google 登入並授權應用程式",
            location: "Google OAuth Server",
            security: ["HTTPS required", "State parameter prevents CSRF"],
          },
          {
            step: 3,
            name: "Authorization Code Response",
            description: "Google 重定向用戶回應用程式，帶有授權碼",
            parameters: ["code", "state"],
            security: [
              "Authorization code expires in 10 minutes",
              "Code can only be used once",
            ],
          },
          {
            step: 4,
            name: "Token Exchange",
            description: "應用程式使用授權碼交換 access token 和 refresh token",
            endpoint: "/oauth/callback",
            method: "POST",
            security: ["HTTPS required", "Client secret must be kept secure"],
          },
          {
            step: 5,
            name: "Token Usage",
            description: "應用程式使用 access token 訪問 Google APIs",
            security: [
              "Access tokens expire",
              "Use refresh tokens to get new access tokens",
            ],
          },
        ],
        securityFeatures: [
          "State parameter prevents CSRF attacks",
          "Authorization codes are single-use",
          "Access tokens have limited lifetime",
          "Refresh tokens for long-term access",
          "HTTPS required for all communications",
        ],
        scopes: [
          "https://www.googleapis.com/auth/calendar",
          "https://www.googleapis.com/auth/calendar.events",
          "https://www.googleapis.com/auth/calendar.readonly",
        ],
        redirectUriRequirements: [
          "Must be HTTPS (except for localhost)",
          "Must be registered in Google Cloud Console",
          "Cannot use IP addresses (except localhost)",
          "Must match exactly what's configured",
        ],
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error("❌ 獲取 OAuth 流程信息失敗:", error);
      res.status(500).json({
        success: false,
        error: error.message,
        oauthFlow: "web_server",
      });
    }
  }
);
