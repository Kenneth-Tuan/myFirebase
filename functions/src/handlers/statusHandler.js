/**
 * 狀態處理器
 * 處理系統狀態檢查功能
 */

const { logger } = require("firebase-functions");
const FirestoreService = require("../services/firestoreService");
const CalendarService = require("../services/calendarService");
const { validateConfig, getEnvironmentCheck } = require("../config");

/**
 * 狀態處理器類
 */
class StatusHandler {
  constructor() {
    this.firestoreService = new FirestoreService();
    this.calendarService = new CalendarService();
  }

  /**
   * 處理狀態檢查請求
   */
  async handleStatusRequest(req, res) {
    try {
      // 獲取基本系統資訊
      const systemStats = await this.firestoreService.getSystemStats();

      // 檢查 Google Calendar 服務狀態
      const calendarStatus = await this.calendarService.checkStatus();

      // 獲取環境配置檢查
      const envCheck = getEnvironmentCheck();

      const status = {
        timestamp: new Date().toISOString(),
        status: "running",
        message: "LINE Bot Firebase Functions is running",
        version: "1.0.0",
        features: {
          lineWebhook: !!(
            envCheck.line.channelSecret.exists &&
            envCheck.line.channelAccessToken.exists
          ),
          googleCalendar: !!(
            envCheck.calendar.apiKey.exists ||
            envCheck.calendar.credentials.exists
          ),
          firestore: true,
        },
        services: {
          line: {
            status:
              envCheck.line.channelSecret.exists &&
              envCheck.line.channelAccessToken.exists
                ? "configured"
                : "not_configured",
            config: envCheck.line,
          },
          calendar: {
            status: calendarStatus.status,
            message: calendarStatus.message,
            config: envCheck.calendar,
          },
          firestore: {
            status: "connected",
            message: "Firestore database is accessible",
          },
        },
        statistics: systemStats,
        endpoints: {
          webhook: "/lineWebhook",
          broadcast: "/broadcast",
          status: "/status",
          health: "/health",
        },
        deployment: {
          platform: "Firebase Functions",
          region: "asia-east1",
          environment: process.env.NODE_ENV || "production",
        },
      };

      res.status(200).json(status);
    } catch (error) {
      logger.error("Status check error:", error);
      res.status(500).json({
        error: "Internal server error",
        message: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * 處理健康檢查請求
   */
  async handleHealthRequest(req, res) {
    try {
      const healthChecks = {
        timestamp: new Date().toISOString(),
        status: "healthy",
        checks: {},
      };

      // 檢查配置
      try {
        const configValid = validateConfig();
        healthChecks.checks.configuration = {
          status: configValid ? "healthy" : "unhealthy",
          message: configValid
            ? "All required configurations are present"
            : "Missing required configurations",
        };
      } catch (error) {
        healthChecks.checks.configuration = {
          status: "unhealthy",
          message: error.message,
        };
      }

      // 檢查 Firestore 連接
      try {
        await this.firestoreService.getSystemStats();
        healthChecks.checks.firestore = {
          status: "healthy",
          message: "Firestore connection is working",
        };
      } catch (error) {
        healthChecks.checks.firestore = {
          status: "unhealthy",
          message: error.message,
        };
      }

      // 檢查 Google Calendar 服務
      try {
        const calendarStatus = await this.calendarService.checkStatus();
        healthChecks.checks.calendar = {
          status:
            calendarStatus.status === "connected" ? "healthy" : "unhealthy",
          message: calendarStatus.message,
        };
      } catch (error) {
        healthChecks.checks.calendar = {
          status: "unhealthy",
          message: error.message,
        };
      }

      // 檢查是否有任何不健康的服務
      const unhealthyChecks = Object.values(healthChecks.checks).filter(
        (check) => check.status === "unhealthy"
      );

      if (unhealthyChecks.length > 0) {
        healthChecks.status = "unhealthy";
      }

      const statusCode = healthChecks.status === "healthy" ? 200 : 503;
      res.status(statusCode).json(healthChecks);
    } catch (error) {
      logger.error("Health check error:", error);
      res.status(503).json({
        timestamp: new Date().toISOString(),
        status: "unhealthy",
        error: "Health check failed",
        message: error.message,
      });
    }
  }

  /**
   * 處理詳細統計請求
   */
  async handleDetailedStatsRequest(req, res) {
    try {
      const detailedStats = {
        timestamp: new Date().toISOString(),
        system: await this.firestoreService.getSystemStats(),
        groups: await this.getDetailedGroupStats(),
        calendar: await this.getDetailedCalendarStats(),
        webhooks: await this.getWebhookStats(),
      };

      res.status(200).json(detailedStats);
    } catch (error) {
      logger.error("Detailed stats error:", error);
      res.status(500).json({
        error: "Internal server error",
        message: error.message,
      });
    }
  }

  /**
   * 獲取詳細群組統計
   */
  async getDetailedGroupStats() {
    try {
      const groups = await this.firestoreService.getAllGroups();

      const stats = {
        totalGroups: groups.length,
        groupTypes: {},
        activityLevels: {
          active: 0, // 7天內有活動
          inactive: 0, // 7-30天有活動
          dormant: 0, // 30天以上無活動
        },
        memberDistribution: {
          small: 0, // 1-10人
          medium: 0, // 11-50人
          large: 0, // 51-100人
          huge: 0, // 100人以上
        },
      };

      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      groups.forEach((group) => {
        // 統計群組類型
        const type = group.type || "unknown";
        stats.groupTypes[type] = (stats.groupTypes[type] || 0) + 1;

        // 統計活動等級
        const lastActivity = group.lastActivity?.toDate();
        if (lastActivity) {
          if (lastActivity > oneWeekAgo) {
            stats.activityLevels.active++;
          } else if (lastActivity > oneMonthAgo) {
            stats.activityLevels.inactive++;
          } else {
            stats.activityLevels.dormant++;
          }
        }

        // 統計成員數量分布
        const memberCount = group.memberCount || 0;
        if (memberCount <= 10) {
          stats.memberDistribution.small++;
        } else if (memberCount <= 50) {
          stats.memberDistribution.medium++;
        } else if (memberCount <= 100) {
          stats.memberDistribution.large++;
        } else {
          stats.memberDistribution.huge++;
        }
      });

      return stats;
    } catch (error) {
      logger.error("Get detailed group stats failed:", error);
      throw error;
    }
  }

  /**
   * 獲取詳細日曆統計
   */
  async getDetailedCalendarStats() {
    try {
      const eventStats = await this.firestoreService.getCalendarEventStats();

      // 獲取最近的日曆事件
      const recentEvents = await this.calendarService.getEvents("primary", {
        timeMin: new Date().toISOString(),
        maxResults: 10,
      });

      return {
        ...eventStats,
        upcomingEvents: recentEvents.length,
        nextEvent: recentEvents[0] || null,
      };
    } catch (error) {
      logger.error("Get detailed calendar stats failed:", error);
      throw error;
    }
  }

  /**
   * 獲取 Webhook 統計
   */
  async getWebhookStats() {
    try {
      // 這裡可以添加 webhook 相關的統計邏輯
      // 例如：處理成功率、平均響應時間等
      return {
        totalWebhooks: 0,
        successRate: "100%",
        averageResponseTime: "0ms",
      };
    } catch (error) {
      logger.error("Get webhook stats failed:", error);
      throw error;
    }
  }

  /**
   * 主處理函數
   */
  async handleRequest(req, res) {
    // 設置 CORS headers
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");

    // 處理 OPTIONS 請求
    if (req.method === "OPTIONS") {
      res.status(200).end();
      return;
    }

    // 只處理 GET 請求
    if (req.method !== "GET") {
      res.status(405).json({
        error: "Method not allowed",
        method: req.method,
        allowed: "GET",
      });
      return;
    }

    // 根據路徑處理不同的請求
    const path = req.path;

    if (path.includes("/health")) {
      await this.handleHealthRequest(req, res);
    } else if (path.includes("/stats")) {
      await this.handleDetailedStatsRequest(req, res);
    } else {
      await this.handleStatusRequest(req, res);
    }
  }
}

module.exports = StatusHandler;
