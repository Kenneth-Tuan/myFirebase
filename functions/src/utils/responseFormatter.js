/**
 * 回應格式化工具
 * 統一 API 回應格式
 */

/**
 * 成功回應格式化
 */
function successResponse(data, message = "Success", statusCode = 200) {
  return {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
    statusCode,
  };
}

/**
 * 錯誤回應格式化
 */
function errorResponse(message, statusCode = 500, details = null) {
  return {
    success: false,
    message,
    details,
    timestamp: new Date().toISOString(),
    statusCode,
  };
}

/**
 * 分頁回應格式化
 */
function paginatedResponse(data, page, limit, total, message = "Success") {
  return {
    success: true,
    message,
    data,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * 列表回應格式化
 */
function listResponse(items, total, message = "Success") {
  return {
    success: true,
    message,
    data: {
      items,
      total,
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * 統計回應格式化
 */
function statsResponse(stats, message = "Statistics retrieved successfully") {
  return {
    success: true,
    message,
    data: {
      statistics: stats,
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * 狀態回應格式化
 */
function statusResponse(status, message, details = {}) {
  return {
    success: true,
    message,
    data: {
      status,
      ...details,
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Webhook 回應格式化
 */
function webhookResponse(
  message = "Webhook processed successfully",
  details = {}
) {
  return {
    success: true,
    message,
    data: {
      processed: true,
      ...details,
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * 廣播回應格式化
 */
function broadcastResponse(results, summary) {
  return {
    success: true,
    message: "Broadcast completed",
    data: {
      results,
      summary,
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * 健康檢查回應格式化
 */
function healthResponse(checks, status = "healthy") {
  return {
    success: status === "healthy",
    message:
      status === "healthy"
        ? "All systems operational"
        : "Some systems are unhealthy",
    data: {
      status,
      checks,
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * 配置檢查回應格式化
 */
function configResponse(config, status) {
  return {
    success: status === "configured",
    message:
      status === "configured"
        ? "Configuration is valid"
        : "Configuration is incomplete",
    data: {
      status,
      config,
    },
    timestamp: new Date().toISOString(),
  };
}

module.exports = {
  successResponse,
  errorResponse,
  paginatedResponse,
  listResponse,
  statsResponse,
  statusResponse,
  webhookResponse,
  broadcastResponse,
  healthResponse,
  configResponse,
};
