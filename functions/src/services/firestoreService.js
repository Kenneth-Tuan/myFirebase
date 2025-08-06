/**
 * Firestore 服務
 * 處理所有 Firestore 資料庫相關的操作
 */

const { getFirestore } = require("firebase-admin/firestore");

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

    return groupData;
  }

  /**
   * 更新群組活動時間
   */
  async updateGroupActivity(groupId) {
    await this.db.collection("line_groups").doc(groupId).update({
      lastActivity: new Date(),
    });
  }

  /**
   * 獲取所有群組
   */
  async getAllGroups() {
    const snapshot = await this.db.collection("line_groups").get();
    const groups = [];

    snapshot.forEach((doc) => {
      groups.push({ id: doc.id, ...doc.data() });
    });

    return groups;
  }

  /**
   * 獲取群組統計資訊
   */
  async getGroupStats() {
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
      const lastActivity = data.lastActivity.toDate();
      if (lastActivity && new Date() - lastActivity < 7 * 24 * 60 * 60 * 1000) {
        stats.activeGroups++;
      }
    });

    return stats;
  }

  /**
   * 保存日曆事件記錄
   */
  async saveCalendarEvent(eventId, eventData, source = "line_webhook") {
    const eventRecord = {
      eventId,
      summary: eventData.summary,
      htmlLink: eventData.htmlLink,
      createdFrom: source,
      createdAt: new Date(),
      eventData: eventData,
    };

    await this.db.collection("calendar_events").doc(eventId).set(eventRecord);

    return eventRecord;
  }

  /**
   * 獲取日曆事件統計
   */
  async getCalendarEventStats() {
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

      if (data.createdAt.toDate() > oneWeekAgo) {
        stats.recentEvents++;
      }
    });

    return stats;
  }

  /**
   * 記錄 webhook 事件
   */
  async logWebhookEvent(eventType, eventData, status = "success") {
    const logEntry = {
      eventType,
      eventData,
      status,
      timestamp: new Date(),
      processed: true,
    };

    await this.db.collection("webhook_logs").add(logEntry);
  }

  /**
   * 獲取系統統計資訊
   */
  async getSystemStats() {
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
  }

  /**
   * 清理舊的日誌記錄
   */
  async cleanupOldLogs(daysToKeep = 30) {
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
    }

    return { deletedCount };
  }
}

module.exports = FirestoreService;
