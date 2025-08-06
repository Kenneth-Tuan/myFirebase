/**
 * 統一錯誤處理工具
 * 用於在 handlers 層處理來自 services 層的錯誤
 */

const { logger } = require("firebase-functions");

/**
 * 自定義錯誤類別
 */
class ServiceError extends Error {
  constructor(message, service, operation, originalError = null, context = {}) {
    super(message);
    this.name = "ServiceError";
    this.service = service;
    this.operation = operation;
    this.originalError = originalError;
    this.context = context;
    this.timestamp = new Date();
  }
}

/**
 * 錯誤分類
 */
const ErrorTypes = {
  AUTHENTICATION: "authentication",
  AUTHORIZATION: "authorization",
  VALIDATION: "validation",
  NETWORK: "network",
  DATABASE: "database",
  EXTERNAL_API: "external_api",
  CONFIGURATION: "configuration",
  UNKNOWN: "unknown",
};

/**
 * 錯誤嚴重程度
 */
const ErrorSeverity = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  CRITICAL: "critical",
};

/**
 * 分析錯誤類型
 */
function analyzeError(error) {
  if (error instanceof ServiceError) {
    return {
      type: error.type || ErrorTypes.UNKNOWN,
      severity: error.severity || ErrorSeverity.MEDIUM,
      service: error.service,
      operation: error.operation,
      context: error.context,
    };
  }

  // 分析原生錯誤
  const errorMessage = error.message.toLowerCase() || "";
  const errorCode = error.code || error.status || error.statusCode;

  // 認證相關錯誤
  if (
    errorMessage.includes("unauthorized") ||
    errorMessage.includes("authentication") ||
    errorCode === 401 ||
    errorMessage.includes("token") ||
    errorMessage.includes("oauth")
  ) {
    return {
      type: ErrorTypes.AUTHENTICATION,
      severity: ErrorSeverity.HIGH,
      service: "unknown",
      operation: "unknown",
    };
  }

  // 授權相關錯誤
  if (
    errorMessage.includes("forbidden") ||
    errorMessage.includes("permission") ||
    errorCode === 403
  ) {
    return {
      type: ErrorTypes.AUTHORIZATION,
      severity: ErrorSeverity.HIGH,
      service: "unknown",
      operation: "unknown",
    };
  }

  // 驗證相關錯誤
  if (
    errorMessage.includes("validation") ||
    errorMessage.includes("invalid") ||
    errorCode === 400
  ) {
    return {
      type: ErrorTypes.VALIDATION,
      severity: ErrorSeverity.MEDIUM,
      service: "unknown",
      operation: "unknown",
    };
  }

  // 網路相關錯誤
  if (
    errorMessage.includes("network") ||
    errorMessage.includes("timeout") ||
    errorMessage.includes("connection") ||
    errorCode === 500 ||
    errorCode === 502 ||
    errorCode === 503 ||
    errorCode === 504
  ) {
    return {
      type: ErrorTypes.NETWORK,
      severity: ErrorSeverity.MEDIUM,
      service: "unknown",
      operation: "unknown",
    };
  }

  // 資料庫相關錯誤
  if (
    errorMessage.includes("database") ||
    errorMessage.includes("firestore") ||
    errorMessage.includes("firebase")
  ) {
    return {
      type: ErrorTypes.DATABASE,
      severity: ErrorSeverity.HIGH,
      service: "unknown",
      operation: "unknown",
    };
  }

  // 外部 API 相關錯誤
  if (
    errorMessage.includes("api") ||
    errorMessage.includes("google") ||
    errorMessage.includes("line") ||
    errorMessage.includes("calendar")
  ) {
    return {
      type: ErrorTypes.EXTERNAL_API,
      severity: ErrorSeverity.MEDIUM,
      service: "unknown",
      operation: "unknown",
    };
  }

  // 配置相關錯誤
  if (
    errorMessage.includes("config") ||
    errorMessage.includes("environment") ||
    errorMessage.includes("missing")
  ) {
    return {
      type: ErrorTypes.CONFIGURATION,
      severity: ErrorSeverity.CRITICAL,
      service: "unknown",
      operation: "unknown",
    };
  }

  // 預設為未知錯誤
  return {
    type: ErrorTypes.UNKNOWN,
    severity: ErrorSeverity.MEDIUM,
    service: "unknown",
    operation: "unknown",
  };
}

/**
 * 記錄錯誤到日誌
 */
function logError(error, context = {}) {
  const analysis = analyzeError(error);

  const logData = {
    error: {
      message: error.message,
      name: error.name,
      stack: error.stack,
      ...analysis,
    },
    context: {
      ...context,
      timestamp: new Date().toISOString(),
    },
  };

  // 根據嚴重程度選擇日誌級別
  switch (analysis.severity) {
  case ErrorSeverity.CRITICAL:
    logger.error("🚨 CRITICAL ERROR:", logData);
    break;
  case ErrorSeverity.HIGH:
    logger.error("❌ HIGH SEVERITY ERROR:", logData);
    break;
  case ErrorSeverity.MEDIUM:
    logger.warn("⚠️ MEDIUM SEVERITY ERROR:", logData);
    break;
  case ErrorSeverity.LOW:
    logger.info("ℹ️ LOW SEVERITY ERROR:", logData);
    break;
  default:
    logger.error("❌ ERROR:", logData);
  }
}

/**
 * 格式化錯誤回應
 */
function formatErrorResponse(error, includeDetails = false) {
  const analysis = analyzeError(error);

  const response = {
    success: false,
    error: {
      message: error.message,
      type: analysis.type,
      severity: analysis.severity,
      service: analysis.service,
      operation: analysis.operation,
      timestamp: new Date().toISOString(),
    },
  };

  // 只在開發環境或明確要求時包含詳細資訊
  if (includeDetails) {
    response.error.details = {
      name: error.name,
      stack: error.stack,
      originalError: error.originalError
        ? {
          message: error.originalError.message,
          name: error.originalError.name,
        }
        : null,
    };
  }

  return response;
}

/**
 * 處理服務層錯誤
 */
function handleServiceError(error, service, operation, context = {}) {
  // 創建 ServiceError 實例
  const serviceError = new ServiceError(
    error.message,
    service,
    operation,
    error,
    context
  );

  // 分析錯誤
  const analysis = analyzeError(error);
  serviceError.type = analysis.type;
  serviceError.severity = analysis.severity;

  // 記錄錯誤
  logError(serviceError, context);

  return serviceError;
}

/**
 * 獲取錯誤建議
 */
function getErrorRecommendations(error) {
  const analysis = analyzeError(error);

  const recommendations = {
    [ErrorTypes.AUTHENTICATION]: [
      "檢查認證憑證是否正確",
      "確認 token 是否過期",
      "嘗試重新授權",
      "檢查 OAuth 配置",
    ],
    [ErrorTypes.AUTHORIZATION]: [
      "檢查用戶權限",
      "確認 API 權限設置",
      "驗證服務帳戶權限",
    ],
    [ErrorTypes.VALIDATION]: [
      "檢查輸入參數格式",
      "確認必要欄位是否提供",
      "驗證資料類型",
    ],
    [ErrorTypes.NETWORK]: [
      "檢查網路連接",
      "確認外部服務狀態",
      "稍後重試",
      "檢查防火牆設置",
    ],
    [ErrorTypes.DATABASE]: [
      "檢查資料庫連接",
      "確認 Firestore 規則",
      "驗證資料庫權限",
      "檢查資料庫狀態",
    ],
    [ErrorTypes.EXTERNAL_API]: [
      "檢查外部 API 狀態",
      "確認 API 金鑰是否有效",
      "檢查 API 配額",
      "稍後重試",
    ],
    [ErrorTypes.CONFIGURATION]: [
      "檢查環境變數設置",
      "確認配置文件",
      "驗證服務配置",
      "重新部署應用",
    ],
    [ErrorTypes.UNKNOWN]: [
      "檢查系統日誌",
      "聯繫技術支援",
      "稍後重試",
      "檢查系統狀態",
    ],
  };

  return recommendations[analysis.type] || recommendations[ErrorTypes.UNKNOWN];
}

/**
 * 包裝服務調用
 */
async function wrapServiceCall(serviceCall, service, operation, context = {}) {
  try {
    return await serviceCall();
  } catch (error) {
    throw handleServiceError(error, service, operation, context);
  }
}

module.exports = {
  ServiceError,
  ErrorTypes,
  ErrorSeverity,
  analyzeError,
  logError,
  formatErrorResponse,
  handleServiceError,
  getErrorRecommendations,
  wrapServiceCall,
};
