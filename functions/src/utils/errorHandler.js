/**
 * 錯誤處理工具
 * 統一處理應用程式中的錯誤
 */

const { logger } = require("firebase-functions");

/**
 * 自定義錯誤類別
 */
class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.name = this.constructor.name;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 驗證錯誤
 */
class ValidationError extends AppError {
  constructor(message = "Validation failed") {
    super(message, 400, true);
  }
}

/**
 * 認證錯誤
 */
class AuthenticationError extends AppError {
  constructor(message = "Authentication failed") {
    super(message, 401, true);
  }
}

/**
 * 授權錯誤
 */
class AuthorizationError extends AppError {
  constructor(message = "Authorization failed") {
    super(message, 403, true);
  }
}

/**
 * 資源不存在錯誤
 */
class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(message, 404, true);
  }
}

/**
 * 衝突錯誤
 */
class ConflictError extends AppError {
  constructor(message = "Resource conflict") {
    super(message, 409, true);
  }
}

/**
 * 外部服務錯誤
 */
class ExternalServiceError extends AppError {
  constructor(message = "External service error", service = "unknown") {
    super(message, 502, true);
    this.service = service;
  }
}

/**
 * 錯誤處理中間件
 */
function errorHandler(error, req, res, next) {
  // 記錄錯誤
  logError(error, req);

  // 如果是自定義錯誤，使用其狀態碼
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      error: {
        type: error.name,
        message: error.message,
        statusCode: error.statusCode,
        timestamp: new Date().toISOString(),
        ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
      },
    });
  }

  // 處理 LINE Bot SDK 錯誤
  if (error.name === "SignatureValidationFailed") {
    return res.status(401).json({
      error: {
        type: "SignatureValidationFailed",
        message: "LINE signature validation failed",
        statusCode: 401,
        timestamp: new Date().toISOString(),
      },
    });
  }

  // 處理 Google API 錯誤
  if (error.code && error.code >= 400 && error.code < 500) {
    return res.status(error.code).json({
      error: {
        type: "GoogleAPIError",
        message: error.message || "Google API error",
        statusCode: error.code,
        timestamp: new Date().toISOString(),
      },
    });
  }

  // 處理 Firestore 錯誤
  if (error.code && error.code === "permission-denied") {
    return res.status(403).json({
      error: {
        type: "FirestorePermissionError",
        message: "Database permission denied",
        statusCode: 403,
        timestamp: new Date().toISOString(),
      },
    });
  }

  // 預設錯誤處理
  const statusCode = error.statusCode || 500;
  const message = error.message || "Internal server error";

  res.status(statusCode).json({
    error: {
      type: "InternalServerError",
      message,
      statusCode,
      timestamp: new Date().toISOString(),
      ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
    },
  });
}

/**
 * 記錄錯誤
 */
function logError(error, req) {
  const errorInfo = {
    name: error.name,
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    request: {
      method: req.method,
      url: req.url,
      headers: req.headers,
      body: req.body,
    },
  };

  if (error instanceof AppError && error.isOperational) {
    logger.warn("Operational error:", errorInfo);
  } else {
    logger.error("System error:", errorInfo);
  }
}

/**
 * 非同步錯誤包裝器
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * 安全錯誤回應（用於 webhook）
 * 確保即使有錯誤也返回 200 狀態碼
 */
function safeWebhookResponse(error, res) {
  logError(error, { method: "WEBHOOK", url: "/webhook" });

  // 對於 webhook，總是返回 200 以避免平台重試
  res.status(200).json({
    error: {
      type: error.name || "WebhookError",
      message: error.message || "Webhook processing error",
      timestamp: new Date().toISOString(),
    },
    note: "Returning 200 to prevent webhook platform from marking endpoint as invalid",
  });
}

/**
 * 驗證必要參數
 */
function validateRequiredParams(params, requiredFields) {
  const missing = [];

  for (const field of requiredFields) {
    if (
      !params[field] ||
      (typeof params[field] === "string" && params[field].trim() === "")
    ) {
      missing.push(field);
    }
  }

  if (missing.length > 0) {
    throw new ValidationError(`Missing required fields: ${missing.join(", ")}`);
  }
}

/**
 * 驗證環境變數
 */
function validateEnvironment(requiredVars) {
  const missing = [];

  for (const envVar of requiredVars) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }

  if (missing.length > 0) {
    throw new AppError(
      `Missing environment variables: ${missing.join(", ")}`,
      500
    );
  }
}

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  ExternalServiceError,
  errorHandler,
  logError,
  asyncHandler,
  safeWebhookResponse,
  validateRequiredParams,
  validateEnvironment,
};
