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
 */
const CALENDAR_CONFIG = {
  apiKey: process.env.CALENDAR_API_KEY,
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
  if (!CALENDAR_CONFIG.apiKey && !CALENDAR_CONFIG.credentials) {
    errors.push(
      "Either CALENDAR_API_KEY or GOOGLE_CALENDAR_CREDENTIALS is required"
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

module.exports = {
  LINE_CONFIG,
  CALENDAR_CONFIG,
  FIREBASE_CONFIG,
  validateConfig,
  getEnvironmentCheck,
};
