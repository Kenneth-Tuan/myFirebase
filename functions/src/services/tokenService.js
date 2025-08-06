/**
 * Google OAuth Token 管理服務
 * 遵循 Google OAuth 2.0 Web Server 流程標準
 * 處理 Google Calendar API 的 token 存儲、讀取、刷新和自動重新授權
 */

const { getFirestore } = require("firebase-admin/firestore");
const { OAuth2Client } = require("google-auth-library");
const { logger } = require("firebase-functions");
const { getOAuth2Credentials } = require("../config");

/**
 * Token 管理服務類
 * 遵循 Google OAuth 2.0 Web Server 應用程式標準
 */
class TokenService {
  constructor() {
    this.db = getFirestore();
    this.userId = "kenneth-project-a8d49"; // 從 .firebaserc 獲取
    this.credentials = getOAuth2Credentials();
    
    // 初始化 OAuth2Client，使用正確的 redirect URI
    this.oAuth2Client = new OAuth2Client(
      this.credentials.client_id,
      this.credentials.client_secret,
      this.credentials.redirect_uris[0]
    );
    
    logger.info("✅ TokenService 初始化成功，使用 OAuth 2.0 Web Server 流程");
  }

  /**
   * 生成授權 URL (步驟 1: 重定向用戶到 Google)
   * 遵循 Google OAuth 2.0 Web Server 流程
   */
  generateAuthUrl(state = null) {
    const scopes = [
      "https://www.googleapis.com/auth/calendar",
      "https://www.googleapis.com/auth/calendar.events",
      "https://www.googleapis.com/auth/calendar.readonly",
    ];

    const authUrl = this.oAuth2Client.generateAuthUrl({
      access_type: "offline", // 獲取 refresh token
      scope: scopes,
      prompt: "consent", // 強制顯示同意畫面
      include_granted_scopes: true,
      state: state || this.generateState(), // 防止 CSRF 攻擊
      response_type: "code", // 授權碼流程
    });

    logger.info("✅ 生成授權 URL 成功", { scopes, state });
    return authUrl;
  }

  /**
   * 生成隨機 state 參數防止 CSRF 攻擊
   */
  generateState() {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  /**
   * 處理授權碼回調 (步驟 2: 交換授權碼獲取 token)
   * 遵循 Google OAuth 2.0 Web Server 流程
   */
  async handleAuthorizationCode(code, state = null) {
    try {
      logger.info("🔄 開始處理授權碼交換...");

      // 驗證授權碼
      if (!code) {
        throw new Error("Authorization code is required");
      }

      console.log("🔍 授權碼:", code);

      // 使用授權碼交換 token
      const { tokens } = await this.oAuth2Client.getToken(code);

      console.log("🔍 交換後的 token:", tokens);

      // 驗證返回的 token
      if (!tokens.access_token) {
        throw new Error("Failed to obtain access token from Google");
      }

      if (!tokens.refresh_token) {
        logger.warn("⚠️ 未收到 refresh token，這可能導致後續無法自動刷新");
      }

      // 設置 OAuth2Client 憑證
      this.oAuth2Client.setCredentials(tokens);

      // 保存 token 到 Firestore
      await this.saveTokensToFirestore(tokens);

      // 記錄成功事件
      await this.logOAuthEvent("authorization_success", {
        hasRefreshToken: !!tokens.refresh_token,
        expiresIn: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      });

      logger.info("✅ 授權碼處理成功，token 已保存");

      return {
        success: true,
        message: "OAuth 2.0 授權成功！Token 已保存",
        tokenInfo: {
          hasAccessToken: !!tokens.access_token,
          hasRefreshToken: !!tokens.refresh_token,
          expiryDate: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
          scopes: tokens.scope,
        },
        nextSteps: [
          "Token 已自動保存到 Firestore",
          "您可以開始使用 Google Calendar API",
          "系統會自動處理 token 刷新",
        ],
      };
    } catch (error) {
      logger.error("❌ 處理授權碼失敗:", error);
      
      // 記錄失敗事件
      await this.logOAuthEvent("authorization_failed", {
        error: error.message,
        code: code ? "provided" : "missing",
      });

      throw new Error(`OAuth 2.0 授權失敗: ${error.message}`);
    }
  }

  /**
   * 從 Firestore 讀取 token
   */
  async getTokensFromFirestore() {
    try {
      const userDoc = await this.db.collection("users").doc(this.userId).get();

      if (!userDoc.exists) {
        logger.warn("⚠️ 用戶文檔不存在:", this.userId);
        return null;
      }

      const data = userDoc.data();
      const tokens = {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expiry_date: data.expiry_date ? data.expiry_date.toDate() : null,
        scope: data.scope,
      };

      logger.info("✅ 從 Firestore 讀取 token 成功");
      return tokens;
    } catch (error) {
      logger.error("❌ 從 Firestore 讀取 token 失敗:", error);
      throw error;
    }
  }

  /**
   * 保存 token 到 Firestore
   * 遵循安全最佳實踐
   */
  async saveTokensToFirestore(tokens) {
    try {
      const tokenData = {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expiry_date: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        scope: tokens.scope,
        updated_at: new Date(),
        token_status: "active",
      };

      await this.db
        .collection("users")
        .doc(this.userId)
        .set(tokenData, { merge: true });
      
      logger.info("✅ Token 已安全保存到 Firestore");
    } catch (error) {
      logger.error("❌ 保存 token 到 Firestore 失敗:", error);
      throw error;
    }
  }

  /**
   * 檢查 token 是否過期
   */
  isTokenExpired(tokens) {
    if (!tokens || !tokens.expiry_date) {
      return true;
    }

    const now = new Date();
    const expiryDate = new Date(tokens.expiry_date);
    
    // 提前 5 分鐘認為過期，確保有足夠時間刷新
    const bufferTime = 5 * 60 * 1000; // 5 分鐘
    return now.getTime() >= (expiryDate.getTime() - bufferTime);
  }

  /**
   * 刷新 Access Token (步驟 3: 使用 refresh token 獲取新的 access token)
   * 遵循 Google OAuth 2.0 標準
   */
  async refreshAccessToken(refreshToken) {
    if (!refreshToken) {
      throw new Error("Refresh token is required for token refresh");
    }
  
    try {
      logger.info("🔄 開始刷新 access token...");

      // 設置 refresh token
      this.oAuth2Client.setCredentials({
        refresh_token: refreshToken,
      });
  
      // 獲取新的 access token
      const { token } = await this.oAuth2Client.getAccessToken();
      const credentials = this.oAuth2Client.credentials;

      // 驗證返回的憑證
      if (!credentials.access_token) {
        throw new Error("Failed to obtain new access token from Google");
      }
  
      logger.info("✅ Access token 刷新成功");

      // 記錄刷新事件
      await this.logOAuthEvent("token_refresh_success", {
        newExpiryDate: credentials.expiry_date ? new Date(credentials.expiry_date) : null,
      });

      return {
        access_token: credentials.access_token,
        refresh_token: credentials.refresh_token || refreshToken, // 保持原有 refresh token
        expiry_date: credentials.expiry_date,
        scope: credentials.scope,
      };
    } catch (error) {
      logger.error("❌ Access token 刷新失敗:", error);
      
      // 處理特定的 OAuth 錯誤
      if (error.response && error.response.data) {
        const { error: errorType, error_description } = error.response.data;
        
        // 記錄錯誤事件
        await this.logOAuthEvent("token_refresh_failed", {
          errorType,
          errorDescription: error_description,
        });

        switch (errorType) {
        case "invalid_grant":
          logger.error("🔄 Refresh token 已過期或被撤銷");
          await this.clearExpiredTokens();
          throw new Error("Refresh token expired or revoked. Re-authorization required.");
            
        case "invalid_client":
          throw new Error("Invalid OAuth2 client credentials. Please check your configuration.");
            
        case "invalid_request":
          throw new Error("Invalid request format. Please check your OAuth2 configuration.");
            
        default:
          throw new Error(`Token refresh failed: ${error_description || errorType}`);
        }
      }
      
      throw error;
    }
  }

  /**
   * 獲取有效的 token (自動處理刷新)
   * 遵循 Google OAuth 2.0 最佳實踐
   */
  async getValidTokens() {
    try {
      // 步驟 1: 從 Firestore 讀取 token
      let tokens = await this.getTokensFromFirestore();

      if (!tokens || !tokens.refresh_token) {
        logger.warn("⚠️ 未找到 token 或 refresh_token");
        throw new Error("No valid tokens found. Please complete OAuth 2.0 authorization first.");
      }

      // 步驟 2: 檢查是否過期
      if (this.isTokenExpired(tokens)) {
        logger.info("🔄 Token 已過期，正在刷新...");

        try {
          // 嘗試刷新 token
          const newTokens = await this.refreshAccessToken(tokens.refresh_token);

          // 保存新的 token 到 Firestore
          await this.saveTokensToFirestore(newTokens);

          tokens = newTokens;
          logger.info("✅ Token 刷新並保存成功");
        } catch (refreshError) {
          logger.error("❌ Token 刷新失敗:", refreshError);
          
          if (refreshError.message.includes("expired or revoked")) {
            // 清理過期的 token
            await this.clearExpiredTokens();
            throw new Error("Refresh token expired or revoked. Please re-authorize the application.");
          }
          
          throw new Error(`Token refresh failed: ${refreshError.message}`);
        }
      } else {
        logger.info("✅ Token 仍然有效");
      }

      return tokens;
    } catch (error) {
      logger.error("❌ 獲取有效 token 失敗:", error);
      throw error;
    }
  }

  /**
   * 設置 OAuth2 客戶端憑證
   */
  async setOAuth2Credentials() {
    try {
      const tokens = await this.getValidTokens();

      this.oAuth2Client.setCredentials({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expiry_date: tokens.expiry_date,
        scope: tokens.scope,
      });

      logger.info("✅ OAuth2 客戶端憑證設置成功");
      return this.oAuth2Client;
    } catch (error) {
      logger.error("❌ 設置 OAuth2 客戶端憑證失敗:", error);
      throw error;
    }
  }

  /**
   * 檢查 token 狀態
   */
  async checkTokenStatus() {
    try {
      const tokens = await this.getTokensFromFirestore();

      if (!tokens) {
        return {
          status: "not_found",
          message: "No tokens found. Please complete OAuth 2.0 authorization.",
          requiresAction: "authorization",
        };
      }

      const isExpired = this.isTokenExpired(tokens);

      return {
        status: isExpired ? "expired" : "valid",
        message: isExpired ? "Token is expired" : "Token is valid",
        hasRefreshToken: !!tokens.refresh_token,
        expiryDate: tokens.expiry_date,
        scopes: tokens.scope,
        requiresAction: isExpired ? "refresh" : "none",
      };
    } catch (error) {
      logger.error("❌ 檢查 token 狀態失敗:", error);
      return {
        status: "error",
        message: error.message,
        requiresAction: "investigation",
      };
    }
  }

  /**
   * 檢查是否需要重新授權
   */
  async needsReauthorization() {
    try {
      const tokens = await this.getTokensFromFirestore();
      
      if (!tokens || !tokens.refresh_token) {
        return true;
      }

      // 檢查 token 狀態
      const status = await this.checkTokenStatus();
      return status.status === "expired" || status.status === "not_found";
    } catch (error) {
      logger.error("❌ 檢查重新授權狀態失敗:", error);
      return true; // 如果有錯誤，假設需要重新授權
    }
  }

  /**
   * 清理過期的 token
   */
  async clearExpiredTokens() {
    try {
      await this.db
        .collection("users")
        .doc(this.userId)
        .update({
          access_token: null,
          refresh_token: null,
          expiry_date: null,
          scope: null,
          token_status: "expired",
          updated_at: new Date(),
        });
      
      logger.info("✅ 過期 token 已清理");
    } catch (error) {
      logger.error("❌ 清理過期 token 失敗:", error);
      // 不拋出錯誤，因為這不是關鍵操作
    }
  }

  /**
   * 記錄 OAuth 事件
   */
  async logOAuthEvent(eventType, details = {}) {
    try {
      await this.db.collection("oauth_events").add({
        userId: this.userId,
        eventType: eventType,
        details: details,
        timestamp: new Date(),
        userAgent: "Firebase Functions",
      });

      logger.info("✅ OAuth 事件已記錄", { eventType, details });
    } catch (error) {
      logger.error("❌ 記錄 OAuth 事件失敗:", error);
      // 不拋出錯誤，因為這不是關鍵操作
    }
  }

  /**
   * 清理舊的 OAuth 事件記錄
   */
  async cleanupOldOAuthEvents() {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const snapshot = await this.db
        .collection("oauth_events")
        .where("timestamp", "<", thirtyDaysAgo)
        .get();

      const batch = this.db.batch();
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      logger.info(`✅ 已清理 ${snapshot.size} 個舊的 OAuth 事件記錄`);
    } catch (error) {
      logger.error("❌ 清理舊 OAuth 事件失敗:", error);
      // 不拋出錯誤，因為這不是關鍵操作
    }
  }

  /**
   * 處理重新授權流程
   */
  async handleReauthorization() {
    try {
      logger.info("🔄 開始處理重新授權流程...");

      // 清理過期的 token
      await this.clearExpiredTokens();

      // 生成授權 URL
      const authUrl = this.generateAuthUrl();

      // 記錄重新授權事件
      await this.logOAuthEvent("reauthorization_required", { authUrl });

      return {
        success: true,
        action: "reauthorization_required",
        authUrl: authUrl,
        message: "需要重新授權，請訪問授權 URL",
        instructions: [
          "1. 訪問上面的 authUrl 進行授權",
          "2. 完成授權後使用 /oauth/callback 端點",
          "3. 系統會自動保存新的 token",
        ],
        oauthFlow: "web_server", // 標明使用的是 Web Server 流程
      };
    } catch (error) {
      logger.error("❌ 處理重新授權失敗:", error);
      throw error;
    }
  }

  /**
   * 強制重新授權
   */
  async forceReauthorization() {
    try {
      logger.info("🔄 開始強制重新授權...");

      // 清理現有的 token
      await this.clearExpiredTokens();
      
      // 生成新的授權 URL
      const authUrl = this.generateAuthUrl();

      // 記錄強制重新授權事件
      await this.logOAuthEvent("force_reauthorization", { authUrl });

      return {
        success: true,
        message: "✅ 已清理舊 token，請重新授權",
        authUrl: authUrl,
        steps: [
          "1. 舊 token 已清理",
          "2. 請訪問上面的 authUrl 進行重新授權",
          "3. 完成授權後使用 /oauth/callback 端點",
        ],
        oauthFlow: "web_server",
      };
    } catch (error) {
      logger.error("❌ 強制重新授權失敗:", error);
      throw error;
    }
  }

  /**
   * Token 健康檢查
   */
  async performTokenHealthCheck() {
    try {
      logger.info("🏥 開始 Token 健康檢查...");
      
      const tokens = await this.getTokensFromFirestore();
      const healthReport = {
        timestamp: new Date(),
        hasTokens: !!tokens,
        hasRefreshToken: !!(tokens && tokens.refresh_token),
        isExpired: false,
        daysUntilExpiry: null,
        scopes: tokens.scope,
        recommendations: []
      };

      if (!tokens) {
        healthReport.recommendations.push("未找到 token，需要初始 OAuth 2.0 授權");
        return healthReport;
      }

      if (!tokens.refresh_token) {
        healthReport.recommendations.push("缺少 refresh token，需要重新授權");
        return healthReport;
      }

      if (this.isTokenExpired(tokens)) {
        healthReport.isExpired = true;
        healthReport.recommendations.push("Token 已過期，需要刷新或重新授權");
      } else {
        // 計算距離過期的天數
        const now = new Date();
        const expiryDate = new Date(tokens.expiry_date);
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        healthReport.daysUntilExpiry = daysUntilExpiry;
        
        if (daysUntilExpiry <= 1) {
          healthReport.recommendations.push("Token 即將過期（1天內），建議提前刷新");
        } else if (daysUntilExpiry <= 7) {
          healthReport.recommendations.push("Token 將在7天內過期，建議監控");
        } else {
          healthReport.recommendations.push("Token 狀態良好");
        }
      }

      // 記錄健康檢查結果
      await this.logOAuthEvent("health_check", healthReport);
      
      logger.info("✅ Token 健康檢查完成", healthReport);
      return healthReport;
    } catch (error) {
      logger.error("❌ Token 健康檢查失敗:", error);
      throw error;
    }
  }

  /**
   * 分類 OAuth 錯誤
   */
  categorizeOAuthError(error) {
    if (!error.response || !error.response.data) {
      return { 
        type: "unknown", 
        severity: "high", 
        requiresReauth: false,
        description: "Unknown OAuth error"
      };
    }

    const { error: errorType, error_description } = error.response.data;
    
    switch (errorType) {
    case "invalid_grant":
      return {
        type: "invalid_grant",
        severity: "critical",
        requiresReauth: true,
        description: "Refresh token expired or revoked",
        action: "immediate_reauthorization"
      };
        
    case "invalid_client":
      return {
        type: "invalid_client",
        severity: "critical",
        requiresReauth: false,
        description: "OAuth2 client credentials are invalid",
        action: "check_configuration"
      };
        
    case "invalid_request":
      return {
        type: "invalid_request",
        severity: "medium",
        requiresReauth: false,
        description: "Request format is invalid",
        action: "check_request_format"
      };
        
    case "insufficient_scope":
      return {
        type: "insufficient_scope",
        severity: "high",
        requiresReauth: true,
        description: "Token lacks required scopes",
        action: "reauthorization_with_scopes"
      };
        
    case "access_denied":
      return {
        type: "access_denied",
        severity: "high",
        requiresReauth: true,
        description: "Access was denied by user",
        action: "user_reauthorization"
      };
        
    default:
      return {
        type: "unknown",
        severity: "medium",
        requiresReauth: false,
        description: error_description || "Unknown OAuth error",
        action: "investigate"
      };
    }
  }
}

module.exports = TokenService;
