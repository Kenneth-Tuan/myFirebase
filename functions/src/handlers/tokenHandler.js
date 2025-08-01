/**
 * Token 管理 Handler
 * 處理 Google OAuth token 相關的 API 端點
 */

const { logger } = require("firebase-functions");
const TokenService = require("../services/tokenService");
const {
  formatSuccessResponse,
  formatErrorResponse,
} = require("../utils/responseFormatter");

/**
 * Token 管理 Handler 類
 */
class TokenHandler {
  constructor() {
    this.tokenService = new TokenService();
  }

  /**
   * 檢查 token 狀態
   */
  async checkTokenStatus(req, res) {
    try {
      logger.info("🔍 檢查 token 狀態");

      const tokenStatus = await this.tokenService.checkTokenStatus();

      logger.info("✅ Token 狀態檢查完成:", tokenStatus);

      return formatSuccessResponse(res, {
        message: "Token status retrieved successfully",
        data: tokenStatus,
      });
    } catch (error) {
      logger.error("❌ 檢查 token 狀態失敗:", error);
      return formatErrorResponse(res, "Failed to check token status", error);
    }
  }

  /**
   * 手動更新 token
   */
  async updateTokens(req, res) {
    try {
      const { access_token, refresh_token, expiry_date } = req.body;

      logger.info("🔄 手動更新 token");

      // 驗證必要參數
      if (!access_token || !refresh_token) {
        return formatErrorResponse(
          res,
          "Missing required parameters: access_token and refresh_token",
          null,
          400
        );
      }

      const tokens = await this.tokenService.updateTokens(
        access_token,
        refresh_token,
        expiry_date
      );

      logger.info("✅ Token 手動更新成功");

      return formatSuccessResponse(res, {
        message: "Tokens updated successfully",
        data: {
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expiry_date: tokens.expiry_date,
          updated_at: tokens.updated_at,
        },
      });
    } catch (error) {
      logger.error("❌ 手動更新 token 失敗:", error);
      return formatErrorResponse(res, "Failed to update tokens", error);
    }
  }

  /**
   * 刷新 token
   */
  async refreshTokens(req, res) {
    try {
      logger.info("🔄 手動刷新 token");

      // 獲取當前 token
      const currentTokens = await this.tokenService.getTokensFromFirestore();

      if (!currentTokens || !currentTokens.refresh_token) {
        return formatErrorResponse(res, "No refresh token found", null, 404);
      }

      // 嘗試刷新
      const newTokens = await this.tokenService.refreshAccessToken(
        currentTokens.refresh_token
      );

      // 保存新的 token
      await this.tokenService.saveTokensToFirestore(newTokens);

      logger.info("✅ Token 手動刷新成功");

      return formatSuccessResponse(res, {
        message: "Tokens refreshed successfully",
        data: {
          access_token: newTokens.access_token,
          refresh_token: newTokens.refresh_token,
          expiry_date: newTokens.expiry_date,
        },
      });
    } catch (error) {
      logger.error("❌ 手動刷新 token 失敗:", error);
      return formatErrorResponse(res, "Failed to refresh tokens", error);
    }
  }

  /**
   * 獲取 token 詳細資訊
   */
  async getTokenInfo(req, res) {
    try {
      logger.info("📋 獲取 token 詳細資訊");

      const tokens = await this.tokenService.getTokensFromFirestore();

      if (!tokens) {
        return formatErrorResponse(res, "No tokens found", null, 404);
      }

      const tokenStatus = await this.tokenService.checkTokenStatus();

      const tokenInfo = {
        hasAccessToken: !!tokens.access_token,
        hasRefreshToken: !!tokens.refresh_token,
        expiryDate: tokens.expiry_date,
        isExpired: tokenStatus.status === "expired",
        status: tokenStatus.status,
        message: tokenStatus.message,
      };

      logger.info("✅ Token 詳細資訊獲取成功");

      return formatSuccessResponse(res, {
        message: "Token information retrieved successfully",
        data: tokenInfo,
      });
    } catch (error) {
      logger.error("❌ 獲取 token 詳細資訊失敗:", error);
      return formatErrorResponse(res, "Failed to get token information", error);
    }
  }

  /**
   * 測試 token 有效性
   */
  async testTokenValidity(req, res) {
    try {
      logger.info("🧪 測試 token 有效性");

      // 嘗試獲取有效 token
      const tokens = await this.tokenService.getValidTokens();

      if (!tokens) {
        return formatErrorResponse(res, "No valid tokens found", null, 404);
      }

      logger.info("✅ Token 有效性測試成功");

      return formatSuccessResponse(res, {
        message: "Token is valid and ready to use",
        data: {
          hasValidToken: true,
          expiryDate: tokens.expiry_date,
          willExpireIn: tokens.expiry_date
            ? Math.floor(
                (new Date(tokens.expiry_date) - new Date()) / 1000 / 60
              )
            : null, // 分鐘
        },
      });
    } catch (error) {
      logger.error("❌ Token 有效性測試失敗:", error);
      return formatErrorResponse(res, "Token validation failed", error);
    }
  }

  /**
   * 清理過期的 token 資訊
   */
  async cleanupTokens(req, res) {
    try {
      logger.info("🧹 清理 token 資訊");

      const tokenStatus = await this.tokenService.checkTokenStatus();

      if (tokenStatus.status === "expired") {
        // 如果 token 已過期且無法刷新，可以清理
        // 這裡可以實現清理邏輯，例如刪除文檔或標記為無效
        logger.info("Token 已過期，建議重新授權");
      }

      return formatSuccessResponse(res, {
        message: "Token cleanup completed",
        data: {
          status: tokenStatus.status,
          message: tokenStatus.message,
        },
      });
    } catch (error) {
      logger.error("❌ 清理 token 資訊失敗:", error);
      return formatErrorResponse(res, "Failed to cleanup tokens", error);
    }
  }
}

module.exports = TokenHandler;
