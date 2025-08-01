/**
 * 訊息模板配置
 * 管理各種功能的訊息模板，方便配置和擴展
 */

/**
 * 模板配置結構
 */
const MESSAGE_TEMPLATES = {
  // 觸發關鍵字
  trigger: "訊息模板",

  // 模板內容
  templates: {
    // 日曆事件模板
    calendar: {
      title: "📅 日曆事件模板",
      description: "在 LINE 中發送以下格式的訊息來創建 Google Calendar 事件：",
      template: `類型: 事件
標題: 會議標題
開始: 2024-01-15T10:00:00
結束: 2024-01-15T11:00:00
說明: 會議說明（可選）
地點: 會議地點（可選）
參加者: email1@example.com,email2@example.com（可選）
提醒: 15（分鐘，可選）
重複: FREQ=WEEKLY;BYDAY=MO（可選）`,
      examples: [
        {
          title: "基本會議",
          content: `類型: 事件
標題: 週會
開始: 2024-01-15T14:00:00
結束: 2024-01-15T15:00:00
說明: 每週例行會議`,
        },
        {
          title: "帶提醒的會議",
          content: `類型: 事件
標題: 客戶會議
開始: 2024-01-16T09:00:00
結束: 2024-01-16T10:00:00
地點: 會議室A
參加者: client@example.com
提醒: 30`,
        },
        {
          title: "重複事件",
          content: `類型: 事件
標題: 每日站會
開始: 2024-01-15T09:00:00
結束: 2024-01-15T09:15:00
重複: FREQ=DAILY`,
        },
      ],
    },

    // 廣播訊息模板
    broadcast: {
      title: "📢 廣播訊息模板",
      description: "使用以下格式發送廣播訊息到指定群組：",
      template: `廣播: 訊息內容
群組: 群組ID1,群組ID2（可選，不填則廣播到所有群組）
類型: text（可選，預設為text）
延遲: 秒數（可選，延遲發送）`,
      examples: [
        {
          title: "文字廣播",
          content: `廣播: 大家好！這是一則廣播訊息。
類型: text`,
        },
        {
          title: "指定群組廣播",
          content: `廣播: 重要通知
群組: C1234567890abcdef,C0987654321fedcba
類型: text`,
        },
        {
          title: "延遲廣播",
          content: `廣播: 會議提醒
群組: C1234567890abcdef
延遲: 300`,
        },
      ],
    },

    // 查詢功能模板
    query: {
      title: "🔍 查詢功能模板",
      description: "使用以下關鍵字查詢系統資訊：",
      template: `查詢: 查詢類型
參數: 查詢參數（可選）`,
      examples: [
        {
          title: "查詢群組",
          content: `查詢: 群組列表`,
        },
        {
          title: "查詢統計",
          content: `查詢: 系統統計`,
        },
        {
          title: "查詢日曆事件",
          content: `查詢: 日曆事件
參數: 2024-01-15`,
        },
      ],
    },

    // 查詢功能模板
    query: {
      title: "🔍 查詢功能模板",
      description: "使用以下關鍵字查詢系統資訊：",
      template: `查詢: 查詢類型
參數: 查詢參數（可選）
日期: 日期範圍（可選）`,
      examples: [
        {
          title: "查詢群組",
          content: `查詢: 群組列表`,
        },
        {
          title: "查詢統計",
          content: `查詢: 系統統計`,
        },
        {
          title: "查詢日曆事件",
          content: `查詢: 日曆事件
日期: 2024-01-15`,
        },
      ],
    },

    // 設定功能模板
    settings: {
      title: "⚙️ 設定功能模板",
      description: "使用以下格式修改設定：",
      template: `設定: 設定項目
值: 設定值`,
      examples: [
        {
          title: "設定語言",
          content: `設定: 語言
值: zh-TW`,
        },
        {
          title: "設定時區",
          content: `設定: 時區
值: Asia/Taipei`,
        },
      ],
    },

    // 通知功能模板
    notification: {
      title: "🔔 通知功能模板",
      description: "使用以下格式發送通知：",
      template: `通知: 通知內容
類型: info|warning|error|success
群組: 群組ID（可選）
用戶: 用戶ID（可選）
優先級: high|normal|low（可選）`,
      examples: [
        {
          title: "一般通知",
          content: `通知: 系統維護通知
類型: info`,
        },
        {
          title: "警告通知",
          content: `通知: 系統異常警告
類型: warning
優先級: high`,
        },
        {
          title: "指定群組通知",
          content: `通知: 會議提醒
類型: info
群組: C1234567890abcdef`,
        },
      ],
    },

    // 統計功能模板
    statistics: {
      title: "📊 統計功能模板",
      description: "使用以下格式查詢統計資訊：",
      template: `統計: 統計類型
時間: 時間範圍（可選）
群組: 群組ID（可選）
格式: json|csv|text（可選）`,
      examples: [
        {
          title: "訊息統計",
          content: `統計: 訊息數量
時間: 2024-01-01,2024-01-31`,
        },
        {
          title: "群組活動統計",
          content: `統計: 群組活動
群組: C1234567890abcdef
格式: json`,
        },
        {
          title: "用戶統計",
          content: `統計: 用戶活躍度
時間: 最近7天`,
        },
      ],
    },
  },

  // 模板順序（顯示順序）
  order: [
    "calendar",
    "broadcast",
    "notification",
    "query",
    "statistics",
    "settings",
  ],

  // 模板分類
  categories: {
    calendar: "日曆功能",
    broadcast: "廣播功能",
    notification: "通知功能",
    query: "查詢功能",
    statistics: "統計功能",
    settings: "設定功能",
  },
};

/**
 * 獲取所有模板
 */
function getAllTemplates() {
  return MESSAGE_TEMPLATES;
}

/**
 * 獲取特定模板
 */
function getTemplate(templateKey) {
  return MESSAGE_TEMPLATES.templates[templateKey];
}

/**
 * 檢查是否為模板觸發訊息
 */
function isTemplateTrigger(message) {
  return message.trim() === MESSAGE_TEMPLATES.trigger;
}

/**
 * 生成模板回覆訊息
 */
function generateTemplateResponse() {
  const templates = MESSAGE_TEMPLATES.templates;
  const order = MESSAGE_TEMPLATES.order;

  let response = "📋 可用的訊息模板：\n\n";
  response += "💡 輸入「訊息模板」查看所有模板\n";
  response += "💡 輸入「模板: 模板名稱」查看特定模板\n\n";

  order.forEach((templateKey, index) => {
    const template = templates[templateKey];
    const category = MESSAGE_TEMPLATES.categories[templateKey];

    response += `${index + 1}. ${template.title}\n`;
    response += `   📂 分類: ${category}\n`;
    response += `   📝 ${template.description}\n\n`;

    if (template.examples && template.examples.length > 0) {
      response += `   💡 快速範例：\n`;
      template.examples.forEach((example, exampleIndex) => {
        response += `   ${exampleIndex + 1}. ${example.title}\n`;
      });
      response += "\n";
    }

    response += "─".repeat(40) + "\n\n";
  });

  response += "🔧 使用說明：\n";
  response += "• 複製模板格式並填入實際內容\n";
  response += "• 日期時間格式：YYYY-MM-DDTHH:mm:ss\n";
  response += "• 時區預設為 Asia/Taipei\n";
  response += "• 輸入「模板: 日曆」查看詳細日曆模板\n";
  response += "• 輸入「模板統計」查看使用統計\n";
  response += "• 更多功能持續開發中...\n\n";
  response += "📞 需要幫助？請聯繫管理員";

  return response;
}

/**
 * 添加新模板
 */
function addTemplate(key, template) {
  MESSAGE_TEMPLATES.templates[key] = template;
  if (!MESSAGE_TEMPLATES.order.includes(key)) {
    MESSAGE_TEMPLATES.order.push(key);
  }
}

/**
 * 移除模板
 */
function removeTemplate(key) {
  delete MESSAGE_TEMPLATES.templates[key];
  MESSAGE_TEMPLATES.order = MESSAGE_TEMPLATES.order.filter((k) => k !== key);
}

/**
 * 更新模板順序
 */
function updateTemplateOrder(newOrder) {
  MESSAGE_TEMPLATES.order = newOrder;
}

/**
 * 獲取模板統計
 */
function getTemplateStats() {
  const templates = MESSAGE_TEMPLATES.templates;
  const categories = MESSAGE_TEMPLATES.categories;

  const stats = {
    totalTemplates: Object.keys(templates).length,
    totalCategories: Object.keys(categories).length,
    templatesByCategory: {},
    examplesCount: 0,
  };

  Object.keys(templates).forEach((key) => {
    const category = categories[key] || "未分類";
    stats.templatesByCategory[category] =
      (stats.templatesByCategory[category] || 0) + 1;

    if (templates[key].examples) {
      stats.examplesCount += templates[key].examples.length;
    }
  });

  return stats;
}

module.exports = {
  MESSAGE_TEMPLATES,
  getAllTemplates,
  getTemplate,
  isTemplateTrigger,
  generateTemplateResponse,
  addTemplate,
  removeTemplate,
  updateTemplateOrder,
  getTemplateStats,
};
