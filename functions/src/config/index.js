/**
 * 應用程式配置管理
 * 集中管理所有環境變數和配置設定
 */

const { logger } = require("firebase-functions");

/**
 * LINE Bot 配置
 */
const LINE_CONFIG = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

/**
 * Google Calendar 配置
 * 使用分離的環境變數來避免憑證洩露
 */
const CALENDAR_CONFIG = {
  apiKey: process.env.CALENDAR_API_KEY,
  // OAuth2 憑證 - 分離為獨立環境變數
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirectUri: process.env.GOOGLE_REDIRECT_URI,
  // 備用方式：完整的憑證 JSON（不建議，但保留向後相容性）
  credentials: process.env.GOOGLE_CALENDAR_CREDENTIALS,
  token: process.env.GOOGLE_CALENDAR_TOKEN,
};

/**
 * Firebase 配置
 */
const FIREBASE_CONFIG = {
  region: "asia-east1",
  cors: true,
};

/**
 * 驗證配置是否完整
 */
function validateConfig() {
  const errors = [];

  // 驗證 LINE 配置
  if (!LINE_CONFIG.channelSecret) {
    errors.push("LINE_CHANNEL_SECRET is missing");
  }
  if (!LINE_CONFIG.channelAccessToken) {
    errors.push("LINE_CHANNEL_ACCESS_TOKEN is missing");
  }

  // 驗證 Google Calendar 配置
  const hasApiKey = !!CALENDAR_CONFIG.apiKey;
  const hasOAuth2Credentials = !!(
    CALENDAR_CONFIG.clientId &&
    CALENDAR_CONFIG.clientSecret &&
    CALENDAR_CONFIG.redirectUri
  );
  const hasLegacyCredentials = !!CALENDAR_CONFIG.credentials;

  if (!hasApiKey && !hasOAuth2Credentials && !hasLegacyCredentials) {
    errors.push(
      "Google Calendar credentials are missing. Please set either:\n" +
        "1. GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI (recommended)\n" +
        "2. GOOGLE_CALENDAR_CREDENTIALS (legacy)\n" +
        "3. CALENDAR_API_KEY (for API key only)"
    );
  }

  if (errors.length > 0) {
    logger.error("Configuration validation failed:", errors);
    return false;
  }

  logger.info("✅ Configuration validation passed");
  return true;
}

/**
 * 獲取環境檢查資訊
 */
function getEnvironmentCheck() {
  return {
    line: {
      channelSecret: {
        exists: !!LINE_CONFIG.channelSecret,
        length: LINE_CONFIG.channelSecret
          ? LINE_CONFIG.channelSecret.length
          : 0,
        preview: LINE_CONFIG.channelSecret
          ? `${LINE_CONFIG.channelSecret.substring(0, 8)}...`
          : "Not set",
      },
      channelAccessToken: {
        exists: !!LINE_CONFIG.channelAccessToken,
        length: LINE_CONFIG.channelAccessToken
          ? LINE_CONFIG.channelAccessToken.length
          : 0,
        preview: LINE_CONFIG.channelAccessToken
          ? `${LINE_CONFIG.channelAccessToken.substring(0, 8)}...`
          : "Not set",
      },
    },
    calendar: {
      apiKey: {
        exists: !!CALENDAR_CONFIG.apiKey,
        length: CALENDAR_CONFIG.apiKey ? CALENDAR_CONFIG.apiKey.length : 0,
      },
      // OAuth2 憑證檢查
      clientId: {
        exists: !!CALENDAR_CONFIG.clientId,
        length: CALENDAR_CONFIG.clientId ? CALENDAR_CONFIG.clientId.length : 0,
        preview: CALENDAR_CONFIG.clientId
          ? `${CALENDAR_CONFIG.clientId.substring(0, 8)}...`
          : "Not set",
      },
      clientSecret: {
        exists: !!CALENDAR_CONFIG.clientSecret,
        length: CALENDAR_CONFIG.clientSecret
          ? CALENDAR_CONFIG.clientSecret.length
          : 0,
        preview: CALENDAR_CONFIG.clientSecret
          ? `${CALENDAR_CONFIG.clientSecret.substring(0, 8)}...`
          : "Not set",
      },
      redirectUri: {
        exists: !!CALENDAR_CONFIG.redirectUri,
        value: CALENDAR_CONFIG.redirectUri || "Not set",
      },
      // 備用憑證檢查
      credentials: {
        exists: !!CALENDAR_CONFIG.credentials,
        length: CALENDAR_CONFIG.credentials
          ? CALENDAR_CONFIG.credentials.length
          : 0,
      },
      token: {
        exists: !!CALENDAR_CONFIG.token,
        length: CALENDAR_CONFIG.token ? CALENDAR_CONFIG.token.length : 0,
      },
    },
  };
}

/**
 * 獲取 OAuth2 憑證配置
 * 優先使用分離的環境變數，備用完整的憑證 JSON
 */
function getOAuth2Credentials() {
  // 優先使用分離的環境變數
  if (
    CALENDAR_CONFIG.clientId &&
    CALENDAR_CONFIG.clientSecret &&
    CALENDAR_CONFIG.redirectUri
  ) {
    return {
      client_id: CALENDAR_CONFIG.clientId,
      client_secret: CALENDAR_CONFIG.clientSecret,
      redirect_uris: [CALENDAR_CONFIG.redirectUri],
    };
  }

  // 備用：解析完整的憑證 JSON
  if (CALENDAR_CONFIG.credentials) {
    try {
      const credentials = JSON.parse(CALENDAR_CONFIG.credentials);
      return credentials;
    } catch (error) {
      logger.error("Failed to parse GOOGLE_CALENDAR_CREDENTIALS:", error);
      throw new Error("Invalid GOOGLE_CALENDAR_CREDENTIALS format");
    }
  }

  throw new Error("No OAuth2 credentials found");
}

module.exports = {
  LINE_CONFIG,
  CALENDAR_CONFIG,
  FIREBASE_CONFIG,
  validateConfig,
  getEnvironmentCheck,
  getOAuth2Credentials,
};
