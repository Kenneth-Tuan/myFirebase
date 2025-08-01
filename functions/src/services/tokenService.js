/**
 * Google OAuth Token 管理服務
 * 處理 Google Calendar API 的 token 存儲、讀取和刷新
 */

const { getFirestore } = require("firebase-admin/firestore");
const { OAuth2Client } = require("google-auth-library");
const { logger } = require("firebase-functions");
const { getOAuth2Credentials } = require("../config");

/**
 * Token 管理服務類
 */
class TokenService {
  constructor() {
    this.db = getFirestore();
    this.userId = "kenneth-project-a8d49"; // 從 .firebaserc 獲取
    this.oAuth2Client = null;
    this.initializeOAuth2Client();
  }

  /**
   * 初始化 OAuth2 客戶端
   * 使用安全的環境變數配置方式
   */
  initializeOAuth2Client() {
    try {
      const credentials = getOAuth2Credentials();

      this.oAuth2Client = new OAuth2Client(
        credentials.client_id,
        credentials.client_secret,
        credentials.redirect_uris[0]
      );

      logger.info("✅ OAuth2 客戶端初始化成功");
      logger.info(
        `📋 使用憑證來源: ${credentials.client_id ? "環境變數" : "JSON 憑證"}`
      );
    } catch (error) {
      logger.error("❌ OAuth2 客戶端初始化失敗:", error);
      throw new Error(`OAuth2 client initialization failed: ${error.message}`);
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
   */
  async saveTokensToFirestore(tokens) {
    try {
      const tokenData = {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expiry_date: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        updated_at: new Date(),
      };

      await this.db
        .collection("users")
        .doc(this.userId)
        .set(tokenData, { merge: true });
      logger.info("✅ Token 已保存到 Firestore");
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

    // 提前 5 分鐘刷新，避免邊緣情況
    const bufferTime = 5 * 60 * 1000; // 5 分鐘
    return now.getTime() + bufferTime >= expiryDate.getTime();
  }

  /**
   * 刷新 access token
   */
  async refreshAccessToken(refreshToken) {
    try {
      this.oAuth2Client.setCredentials({
        refresh_token: refreshToken,
      });

      const { token } = await this.oAuth2Client.getAccessToken();
      const credentials = this.oAuth2Client.credentials;

      logger.info("✅ Access token 刷新成功");
      return {
        access_token: credentials.access_token,
        refresh_token: credentials.refresh_token,
        expiry_date: credentials.expiry_date,
      };
    } catch (error) {
      logger.error("❌ Access token 刷新失敗:", error);
      throw error;
    }
  }

  /**
   * 獲取有效的 token（自動處理刷新）
   */
  async getValidTokens() {
    try {
      // 步驟 1: 從 Firestore 讀取 token
      let tokens = await this.getTokensFromFirestore();

      if (!tokens || !tokens.refresh_token) {
        throw new Error("No tokens found. Please re-authorize.");
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
          throw new Error("Token refresh failed. Please re-authorize.");
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
          message: "No tokens found in Firestore",
        };
      }

      const isExpired = this.isTokenExpired(tokens);

      return {
        status: isExpired ? "expired" : "valid",
        message: isExpired ? "Token is expired" : "Token is valid",
        hasRefreshToken: !!tokens.refresh_token,
        expiryDate: tokens.expiry_date,
      };
    } catch (error) {
      logger.error("❌ 檢查 token 狀態失敗:", error);
      return {
        status: "error",
        message: error.message,
      };
    }
  }

  /**
   * 手動更新 token（用於初始設置或重新授權）
   */
  async updateTokens(accessToken, refreshToken, expiryDate) {
    try {
      const tokens = {
        access_token: accessToken,
        refresh_token: refreshToken,
        expiry_date: expiryDate ? new Date(expiryDate) : null,
      };

      await this.saveTokensToFirestore(tokens);
      logger.info("✅ Token 手動更新成功");

      return tokens;
    } catch (error) {
      logger.error("❌ 手動更新 token 失敗:", error);
      throw error;
    }
  }
}

module.exports = TokenService;
