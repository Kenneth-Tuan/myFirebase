/**
 * 模板處理服務
 * 處理訊息模板相關的業務邏輯
 */

const {
  isTemplateTrigger,
  generateTemplateResponse,
  getTemplate,
  getAllTemplates,
  addTemplate,
  removeTemplate,
  getTemplateStats,
} = require("../config/templates");

/**
 * 模板處理服務類
 */
class TemplateService {
  constructor() {
    this.templateCache = new Map();
    this.usageStats = {
      totalRequests: 0,
      requestsByTemplate: {},
      lastRequestTime: null,
    };
  }

  /**
   * 處理模板相關訊息
   */
  async handleTemplateMessage(message, userId = null) {
    this.updateUsageStats(message);

    // 檢查是否為模板觸發訊息
    if (isTemplateTrigger(message)) {
      return await this.handleTemplateRequest();
    }

    // 檢查是否為特定模板查詢
    const specificTemplate = this.parseSpecificTemplateRequest(message);
    if (specificTemplate) {
      return await this.handleSpecificTemplateRequest(specificTemplate);
    }

    // 檢查是否為模板管理指令
    const managementCommand = this.parseManagementCommand(message);
    if (managementCommand) {
      return await this.handleManagementCommand(managementCommand, userId);
    }

    return null; // 不是模板相關訊息
  }

  /**
   * 處理模板請求
   */
  async handleTemplateRequest() {
    const response = generateTemplateResponse();

    return {
      type: "template_response",
      content: response,
      templateCount: getTemplateStats().totalTemplates,
    };
  }

  /**
   * 解析特定模板請求
   */
  parseSpecificTemplateRequest(message) {
    const patterns = [
      /^模板\s*[:：]\s*(.+)$/,
      /^template\s*[:：]\s*(.+)$/i,
      /^查看\s*(.+)\s*模板$/,
      /^show\s+(.+)\s+template$/i,
    ];

    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    return null;
  }

  /**
   * 將中文模板名稱轉換為英文鍵值
   */
  mapChineseToTemplateKey(chineseName) {
    const mapping = {
      日曆: "calendar",
      廣播: "broadcast",
      通知: "notification",
      查詢: "query",
      統計: "statistics",
      設定: "settings",
    };

    return mapping[chineseName] || chineseName;
  }

  /**
   * 處理特定模板請求
   */
  async handleSpecificTemplateRequest(templateKey) {
    // 嘗試直接查找
    let template = getTemplate(templateKey);

    // 如果找不到，嘗試中文名稱映射
    if (!template) {
      const mappedKey = this.mapChineseToTemplateKey(templateKey);
      if (mappedKey !== templateKey) {
        template = getTemplate(mappedKey);
        templateKey = mappedKey; // 更新為實際的鍵值
      }
    }

    if (!template) {
      return {
        type: "template_not_found",
        content: `❌ 找不到模板：${templateKey}\n\n💡 請輸入「訊息模板」查看所有可用模板。`,
      };
    }

    const response = this.generateSpecificTemplateResponse(
      template,
      templateKey
    );

    return {
      type: "specific_template_response",
      content: response,
      templateKey: templateKey,
    };
  }

  /**
   * 生成特定模板回應
   */
  generateSpecificTemplateResponse(template, templateKey) {
    let response = `${template.title}\n\n`;
    response += `${template.description}\n\n`;
    response += `📝 模板格式：\n`;
    response += `${template.template}\n\n`;

    if (template.examples && template.examples.length > 0) {
      response += `💡 範例：\n`;
      template.examples.forEach((example, index) => {
        response += `${index + 1}. ${example.title}：\n`;
        response += `   ${example.content}\n\n`;
      });
    }

    response += `🔗 模板ID: ${templateKey}\n`;
    response += `📅 最後更新: ${new Date().toLocaleDateString("zh-TW")}`;

    return response;
  }

  /**
   * 解析管理指令
   */
  parseManagementCommand(message) {
    const patterns = [
      /^添加模板\s*[:：]\s*(.+)$/,
      /^add\s+template\s*[:：]\s*(.+)$/i,
      /^刪除模板\s*[:：]\s*(.+)$/,
      /^remove\s+template\s*[:：]\s*(.+)$/i,
      /^模板統計$/,
      /^template\s+stats$/i,
    ];

    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match) {
        return {
          command:
            pattern.source.includes("add") || pattern.source.includes("添加")
              ? "add"
              : pattern.source.includes("remove") ||
                pattern.source.includes("刪除")
                ? "remove"
                : "stats",
          params: match[1] || null,
        };
      }
    }

    return null;
  }

  /**
   * 處理管理指令
   */
  async handleManagementCommand(command, userId) {
    // 這裡可以添加權限檢查
    if (!this.hasManagementPermission(userId)) {
      return {
        type: "permission_denied",
        content: "❌ 您沒有權限執行此操作。",
      };
    }

    switch (command.command) {
    case "add":
      return await this.handleAddTemplate(command.params);
    case "remove":
      return await this.handleRemoveTemplate(command.params);
    case "stats":
      return await this.handleTemplateStats();
    default:
      return {
        type: "unknown_command",
        content: "❌ 未知的管理指令。",
      };
    }
  }

  /**
   * 處理添加模板
   */
  async handleAddTemplate(params) {
    // 這裡可以實現添加模板的邏輯
    // 暫時返回提示訊息
    return {
      type: "add_template_response",
      content: "🔄 添加模板功能正在開發中...\n\n請聯繫管理員添加新模板。",
    };
  }

  /**
   * 處理刪除模板
   */
  async handleRemoveTemplate(params) {
    // 這裡可以實現刪除模板的邏輯
    // 暫時返回提示訊息
    return {
      type: "remove_template_response",
      content: "🔄 刪除模板功能正在開發中...\n\n請聯繫管理員刪除模板。",
    };
  }

  /**
   * 處理模板統計
   */
  async handleTemplateStats() {
    const stats = getTemplateStats();
    const usageStats = this.usageStats;

    let response = "📊 模板使用統計：\n\n";
    response += `📋 模板總數: ${stats.totalTemplates}\n`;
    response += `📂 分類總數: ${stats.totalCategories}\n`;
    response += `💡 範例總數: ${stats.examplesCount}\n`;
    response += `📈 請求總數: ${usageStats.totalRequests}\n`;

    if (usageStats.lastRequestTime) {
      response += `🕒 最後請求: ${usageStats.lastRequestTime.toLocaleString(
        "zh-TW"
      )}\n`;
    }

    response += "\n📂 分類統計：\n";
    Object.entries(stats.templatesByCategory).forEach(([category, count]) => {
      response += `• ${category}: ${count} 個模板\n`;
    });

    return {
      type: "template_stats_response",
      content: response,
      stats: { ...stats, usage: usageStats },
    };
  }

  /**
   * 更新使用統計
   */
  updateUsageStats(message) {
    this.usageStats.totalRequests++;
    this.usageStats.lastRequestTime = new Date();

    // 記錄特定模板的使用情況
    const specificTemplate = this.parseSpecificTemplateRequest(message);
    if (specificTemplate) {
      this.usageStats.requestsByTemplate[specificTemplate] =
        (this.usageStats.requestsByTemplate[specificTemplate] || 0) + 1;
    }
  }

  /**
   * 檢查管理權限
   */
  hasManagementPermission(userId) {
    // 這裡可以實現權限檢查邏輯
    // 暫時允許所有用戶（開發階段）
    return true;
  }

  /**
   * 獲取模板建議
   */
  getTemplateSuggestions(userInput) {
    const templates = getAllTemplates().templates;
    const suggestions = [];

    Object.keys(templates).forEach((key) => {
      const template = templates[key];
      if (
        template.title.toLowerCase().includes(userInput.toLowerCase()) ||
        template.description.toLowerCase().includes(userInput.toLowerCase())
      ) {
        suggestions.push({
          key: key,
          title: template.title,
          description: template.description,
        });
      }
    });

    return suggestions.slice(0, 3); // 最多返回3個建議
  }

  /**
   * 生成模板建議回應
   */
  generateSuggestionsResponse(suggestions) {
    if (suggestions.length === 0) {
      return null;
    }

    let response = "💡 您可能在尋找這些模板：\n\n";
    suggestions.forEach((suggestion, index) => {
      response += `${index + 1}. ${suggestion.title}\n`;
      response += `   ${suggestion.description}\n`;
      response += `   輸入「模板: ${suggestion.key}」查看詳細內容\n\n`;
    });

    return response;
  }
}

module.exports = TemplateService;
