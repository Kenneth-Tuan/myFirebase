/**
 * 應用程式配置管理
 * 集中管理所有環境變數和配置設定
 * 遵循 Google OAuth 2.0 Web Server 流程標準
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
 * 遵循 Google OAuth 2.0 Web Server 流程標準
 */
const CALENDAR_CONFIG = {
  apiKey: process.env.CALENDAR_API_KEY,
  // OAuth2 憑證 - 分離為獨立環境變數
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirectUri: process.env.GOOGLE_REDIRECT_URI,
  // 支援多個 redirect URIs (用於不同環境)
  redirectUris: process.env.GOOGLE_REDIRECT_URIS 
    ? process.env.GOOGLE_REDIRECT_URIS.split(",").map((uri) => uri.trim())
    : [],
};

/**
 * Firebase 配置
 */
const FIREBASE_CONFIG = {
  region: "asia-east1",
  cors: true,
};

/**
 * OAuth 2.0 配置
 * 遵循 Google OAuth 2.0 Web Server 流程標準
 */
const OAUTH_CONFIG = {
  // 授權端點
  authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
  // Token 交換端點
  tokenEndpoint: "https://oauth2.googleapis.com/token",
  // 預設 scope
  defaultScopes: [
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/calendar.events",
    "https://www.googleapis.com/auth/calendar.readonly",
  ],
  // 授權碼有效期 (10 分鐘)
  authorizationCodeExpiry: 10 * 60 * 1000,
  // Access token 預設有效期 (1 小時)
  accessTokenExpiry: 60 * 60 * 1000,
  // Refresh token 有效期 (無限期，除非被撤銷)
  refreshTokenExpiry: null,
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
        "1. GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI (recommended for OAuth 2.0)\n" +
        "2. GOOGLE_CALENDAR_CREDENTIALS (legacy)\n" +
        "3. CALENDAR_API_KEY (for API key only)"
    );
  }

  // 驗證 OAuth 2.0 配置
  if (hasOAuth2Credentials) {
    if (!isValidRedirectUri(CALENDAR_CONFIG.redirectUri)) {
      errors.push(
        "Invalid redirect URI. Must be HTTPS (except localhost) and registered in Google Cloud Console"
      );
    }
  }

  if (errors.length > 0) {
    logger.error("Configuration validation failed:", errors);
    return false;
  }

  logger.info("✅ Configuration validation passed");
  return true;
}

/**
 * 驗證 redirect URI 是否符合 Google OAuth 2.0 要求
 * 遵循 Google OAuth 2.0 OOB Migration 標準
 */
function isValidRedirectUri(redirectUri) {
  if (!redirectUri) {
    return false;
  }

  try {
    const url = new URL(redirectUri);
    
    // 檢查協議
    if (url.protocol !== "https:" && url.hostname !== "localhost") {
      return false;
    }
    
    // 檢查是否為 IP 地址 (不允許，除了 localhost)
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (ipRegex.test(url.hostname) && url.hostname !== "localhost") {
      return false;
    }
    
    // 檢查端口 (localhost 可以使用非標準端口)
    if (url.hostname !== "localhost" && url.port && url.port !== "443") {
      return false;
    }
    
    return true;
  } catch (error) {
    logger.error("Invalid redirect URI format:", error);
    return false;
  }
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
        isValid: CALENDAR_CONFIG.redirectUri ? isValidRedirectUri(CALENDAR_CONFIG.redirectUri) : false,
      },
      redirectUris: {
        count: CALENDAR_CONFIG.redirectUris.length,
        uris: CALENDAR_CONFIG.redirectUris,
        allValid: CALENDAR_CONFIG.redirectUris.every(uri => isValidRedirectUri(uri)),
      },
    },
    oauth: {
      flow: "web_server",
      authorizationEndpoint: OAUTH_CONFIG.authorizationEndpoint,
      tokenEndpoint: OAUTH_CONFIG.tokenEndpoint,
      defaultScopes: OAUTH_CONFIG.defaultScopes,
      authorizationCodeExpiry: OAUTH_CONFIG.authorizationCodeExpiry,
      accessTokenExpiry: OAUTH_CONFIG.accessTokenExpiry,
    },
  };
}

/**
 * 獲取 OAuth2 憑證配置
 * 優先使用分離的環境變數，備用完整的憑證 JSON
 * 遵循 Google OAuth 2.0 Web Server 流程標準
 */
function getOAuth2Credentials() {
  // 優先使用分離的環境變數
  if (
    CALENDAR_CONFIG.clientId &&
    CALENDAR_CONFIG.clientSecret &&
    CALENDAR_CONFIG.redirectUri
  ) {
    // 驗證 redirect URI
    if (!isValidRedirectUri(CALENDAR_CONFIG.redirectUri)) {
      throw new Error(`Invalid redirect URI: ${CALENDAR_CONFIG.redirectUri}. Must be HTTPS (except localhost) and registered in Google Cloud Console`);
    }

    const credentials = {
      client_id: CALENDAR_CONFIG.clientId,
      client_secret: CALENDAR_CONFIG.clientSecret,
      redirect_uris: [CALENDAR_CONFIG.redirectUri],
    };

    // 如果有額外的 redirect URIs，也加入
    if (CALENDAR_CONFIG.redirectUris.length > 0) {
      const validUris = CALENDAR_CONFIG.redirectUris.filter(uri => isValidRedirectUri(uri));
      if (validUris.length > 0) {
        credentials.redirect_uris.push(...validUris);
      }
    }

    logger.info("✅ OAuth2 憑證配置成功", {
      clientId: credentials.client_id.substring(0, 8) + "...",
      redirectUris: credentials.redirect_uris,
    });

    return credentials;
  }

  throw new Error("No valid OAuth2 credentials found. Please set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI");
}

/**
 * 獲取 OAuth 2.0 配置
 */
function getOAuthConfig() {
  return OAUTH_CONFIG;
}

/**
 * 驗證 OAuth 2.0 配置
 */
function validateOAuthConfig() {
  const errors = [];

  // 檢查必要的 OAuth 配置
  if (!OAUTH_CONFIG.authorizationEndpoint) {
    errors.push("OAuth authorization endpoint is missing");
  }

  if (!OAUTH_CONFIG.tokenEndpoint) {
    errors.push("OAuth token endpoint is missing");
  }

  if (!OAUTH_CONFIG.defaultScopes || OAUTH_CONFIG.defaultScopes.length === 0) {
    errors.push("OAuth default scopes are missing");
  }

  // 檢查 redirect URI 配置
  try {
    const credentials = getOAuth2Credentials();
    if (!credentials.redirect_uris || credentials.redirect_uris.length === 0) {
      errors.push("No valid redirect URIs configured");
    }
  } catch (error) {
    errors.push(`OAuth credentials validation failed: ${error.message}`);
  }

  if (errors.length > 0) {
    logger.error("OAuth configuration validation failed:", errors);
    return false;
  }

  logger.info("✅ OAuth configuration validation passed");
  return true;
}

module.exports = {
  LINE_CONFIG,
  CALENDAR_CONFIG,
  FIREBASE_CONFIG,
  OAUTH_CONFIG,
  validateConfig,
  validateOAuthConfig,
  getEnvironmentCheck,
  getOAuth2Credentials,
  getOAuthConfig,
  isValidRedirectUri,
};
