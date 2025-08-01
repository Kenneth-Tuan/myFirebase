/**
 * Firestore 服務
 * 處理所有 Firestore 資料庫相關的操作
 */

const { getFirestore } = require("firebase-admin/firestore");
const { logger } = require("firebase-functions");

/**
 * Firestore 服務類
 */
class FirestoreService {
  constructor() {
    this.db = getFirestore();
  }

  /**
   * 記錄群組加入
   */
  async recordGroupJoin(event) {
    try {
      const groupData = {
        groupId: event.source.groupId,
        groupName: event.source.groupName || "Unknown",
        joinedAt: new Date(),
        lastActivity: new Date(),
        memberCount: event.source.memberCount || 0,
        type: event.source.type,
      };

      await this.db
        .collection("line_groups")
        .doc(event.source.groupId)
        .set(groupData, { merge: true });

      logger.info(`✅ 群組記錄已保存: ${event.source.groupId}`);
      return groupData;
    } catch (error) {
      logger.error("❌ 記錄群組失敗:", error);
      throw error;
    }
  }

  /**
   * 更新群組活動時間
   */
  async updateGroupActivity(groupId) {
    try {
      await this.db.collection("line_groups").doc(groupId).update({
        lastActivity: new Date(),
      });

      logger.info(`✅ 群組活動時間已更新: ${groupId}`);
    } catch (error) {
      logger.error("❌ 更新群組活動時間失敗:", error);
      throw error;
    }
  }

  /**
   * 獲取所有群組
   */
  async getAllGroups() {
    try {
      const snapshot = await this.db.collection("line_groups").get();
      const groups = [];

      snapshot.forEach((doc) => {
        groups.push({ id: doc.id, ...doc.data() });
      });

      logger.info(`✅ 獲取到 ${groups.length} 個群組`);
      return groups;
    } catch (error) {
      logger.error("❌ 獲取群組列表失敗:", error);
      throw error;
    }
  }

  /**
   * 獲取群組統計資訊
   */
  async getGroupStats() {
    try {
      const snapshot = await this.db.collection("line_groups").get();
      const stats = {
        totalGroups: snapshot.size,
        activeGroups: 0,
        totalMembers: 0,
      };

      snapshot.forEach((doc) => {
        const data = doc.data();
        stats.totalMembers += data.memberCount || 0;

        // 檢查是否為活躍群組（7天內有活動）
        const lastActivity = data.lastActivity?.toDate();
        if (
          lastActivity &&
          new Date() - lastActivity < 7 * 24 * 60 * 60 * 1000
        ) {
          stats.activeGroups++;
        }
      });

      return stats;
    } catch (error) {
      logger.error("❌ 獲取群組統計失敗:", error);
      throw error;
    }
  }

  /**
   * 保存日曆事件記錄
   */
  async saveCalendarEvent(eventId, eventData, source = "line_webhook") {
    try {
      const eventRecord = {
        eventId,
        summary: eventData.summary,
        htmlLink: eventData.htmlLink,
        createdFrom: source,
        createdAt: new Date(),
        eventData: eventData,
      };

      await this.db.collection("calendar_events").doc(eventId).set(eventRecord);

      logger.info(`✅ 日曆事件記錄已保存: ${eventId}`);
      return eventRecord;
    } catch (error) {
      logger.error("❌ 保存日曆事件記錄失敗:", error);
      throw error;
    }
  }

  /**
   * 獲取日曆事件統計
   */
  async getCalendarEventStats() {
    try {
      const snapshot = await this.db.collection("calendar_events").get();
      const stats = {
        totalEvents: snapshot.size,
        eventsBySource: {},
        recentEvents: 0,
      };

      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      snapshot.forEach((doc) => {
        const data = doc.data();
        const source = data.createdFrom || "unknown";

        stats.eventsBySource[source] = (stats.eventsBySource[source] || 0) + 1;

        if (data.createdAt?.toDate() > oneWeekAgo) {
          stats.recentEvents++;
        }
      });

      return stats;
    } catch (error) {
      logger.error("❌ 獲取日曆事件統計失敗:", error);
      throw error;
    }
  }

  /**
   * 記錄 webhook 事件
   */
  async logWebhookEvent(eventType, eventData, status = "success") {
    try {
      const logEntry = {
        eventType,
        eventData,
        status,
        timestamp: new Date(),
        processed: true,
      };

      await this.db.collection("webhook_logs").add(logEntry);
      logger.info(`✅ Webhook 事件已記錄: ${eventType}`);
    } catch (error) {
      logger.error("❌ 記錄 webhook 事件失敗:", error);
      // 不拋出錯誤，避免影響主要功能
    }
  }

  /**
   * 獲取系統統計資訊
   */
  async getSystemStats() {
    try {
      const [groupStats, eventStats] = await Promise.all([
        this.getGroupStats(),
        this.getCalendarEventStats(),
      ]);

      return {
        timestamp: new Date().toISOString(),
        groups: groupStats,
        calendarEvents: eventStats,
        system: {
          status: "running",
          version: "1.0.0",
        },
      };
    } catch (error) {
      logger.error("❌ 獲取系統統計失敗:", error);
      throw error;
    }
  }

  /**
   * 清理舊的日誌記錄
   */
  async cleanupOldLogs(daysToKeep = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const snapshot = await this.db
        .collection("webhook_logs")
        .where("timestamp", "<", cutoffDate)
        .get();

      const batch = this.db.batch();
      let deletedCount = 0;

      snapshot.forEach((doc) => {
        batch.delete(doc.ref);
        deletedCount++;
      });

      if (deletedCount > 0) {
        await batch.commit();
        logger.info(`✅ 已清理 ${deletedCount} 條舊日誌記錄`);
      }

      return { deletedCount };
    } catch (error) {
      logger.error("❌ 清理舊日誌失敗:", error);
      throw error;
    }
  }
}

module.exports = FirestoreService;
