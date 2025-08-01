/**
 * 模板管理工具
 * 提供方便的 API 來動態管理訊息模板
 */

const { logger } = require("firebase-functions");
const {
  MESSAGE_TEMPLATES,
  addTemplate,
  removeTemplate,
  updateTemplateOrder,
} = require("./templates");

/**
 * 模板管理工具類
 */
class TemplateManager {
  constructor() {
    this.templates = MESSAGE_TEMPLATES;
  }

  /**
   * 添加新模板
   * @param {string} key - 模板鍵值
   * @param {Object} template - 模板配置
   * @param {string} template.title - 模板標題
   * @param {string} template.description - 模板描述
   * @param {string} template.template - 模板格式
   * @param {Array} template.examples - 範例列表
   * @param {string} category - 模板分類
   */
  addTemplate(key, template, category = "其他功能") {
    try {
      // 驗證模板格式
      this.validateTemplate(template);

      // 添加模板
      addTemplate(key, template);

      // 添加分類
      if (!this.templates.categories[key]) {
        this.templates.categories[key] = category;
      }

      logger.info(`Template added successfully: ${key}`);
      return {
        success: true,
        message: `模板「${template.title}」添加成功`,
        key: key,
      };
    } catch (error) {
      logger.error(`Failed to add template ${key}:`, error);
      throw error;
    }
  }

  /**
   * 移除模板
   * @param {string} key - 模板鍵值
   */
  removeTemplate(key) {
    try {
      if (!this.templates.templates[key]) {
        throw new Error(`Template ${key} not found`);
      }

      const templateTitle = this.templates.templates[key].title;
      removeTemplate(key);

      // 移除分類
      delete this.templates.categories[key];

      logger.info(`Template removed successfully: ${key}`);
      return {
        success: true,
        message: `模板「${templateTitle}」移除成功`,
        key: key,
      };
    } catch (error) {
      logger.error(`Failed to remove template ${key}:`, error);
      throw error;
    }
  }

  /**
   * 更新模板
   * @param {string} key - 模板鍵值
   * @param {Object} updates - 更新內容
   */
  updateTemplate(key, updates) {
    try {
      if (!this.templates.templates[key]) {
        throw new Error(`Template ${key} not found`);
      }

      const template = this.templates.templates[key];
      const updatedTemplate = { ...template, ...updates };

      // 驗證更新後的模板
      this.validateTemplate(updatedTemplate);

      // 更新模板
      this.templates.templates[key] = updatedTemplate;

      logger.info(`Template updated successfully: ${key}`);
      return {
        success: true,
        message: `模板「${updatedTemplate.title}」更新成功`,
        key: key,
      };
    } catch (error) {
      logger.error(`Failed to update template ${key}:`, error);
      throw error;
    }
  }

  /**
   * 獲取模板列表
   * @param {string} category - 可選分類篩選
   */
  getTemplateList(category = null) {
    try {
      const templates = this.templates.templates;
      const categories = this.templates.categories;
      const order = this.templates.order;

      let templateList = [];

      order.forEach((key) => {
        if (category && categories[key] !== category) {
          return;
        }

        const template = templates[key];
        templateList.push({
          key: key,
          title: template.title,
          description: template.description,
          category: categories[key] || "未分類",
          examplesCount: template.examples ? template.examples.length : 0,
        });
      });

      return {
        success: true,
        templates: templateList,
        total: templateList.length,
        category: category,
      };
    } catch (error) {
      logger.error("Failed to get template list:", error);
      throw error;
    }
  }

  /**
   * 獲取模板詳情
   * @param {string} key - 模板鍵值
   */
  getTemplateDetail(key) {
    try {
      const template = this.templates.templates[key];
      if (!template) {
        throw new Error(`Template ${key} not found`);
      }

      return {
        success: true,
        template: {
          key: key,
          ...template,
          category: this.templates.categories[key] || "未分類",
        },
      };
    } catch (error) {
      logger.error(`Failed to get template detail ${key}:`, error);
      throw error;
    }
  }

  /**
   * 搜尋模板
   * @param {string} query - 搜尋關鍵字
   */
  searchTemplates(query) {
    try {
      const templates = this.templates.templates;
      const categories = this.templates.categories;
      const results = [];

      Object.keys(templates).forEach((key) => {
        const template = templates[key];
        const searchText = `${template.title} ${template.description} ${
          categories[key] || ""
        }`.toLowerCase();

        if (searchText.includes(query.toLowerCase())) {
          results.push({
            key: key,
            title: template.title,
            description: template.description,
            category: categories[key] || "未分類",
            matchScore: this.calculateMatchScore(searchText, query),
          });
        }
      });

      // 按匹配度排序
      results.sort((a, b) => b.matchScore - a.matchScore);

      return {
        success: true,
        results: results.slice(0, 10), // 最多返回10個結果
        query: query,
        total: results.length,
      };
    } catch (error) {
      logger.error("Failed to search templates:", error);
      throw error;
    }
  }

  /**
   * 獲取分類列表
   */
  getCategories() {
    try {
      const categories = this.templates.categories;
      const categoryCount = {};

      Object.values(categories).forEach((category) => {
        categoryCount[category] = (categoryCount[category] || 0) + 1;
      });

      return {
        success: true,
        categories: Object.keys(categoryCount),
        counts: categoryCount,
        total: Object.keys(categories).length,
      };
    } catch (error) {
      logger.error("Failed to get categories:", error);
      throw error;
    }
  }

  /**
   * 驗證模板格式
   * @param {Object} template - 模板配置
   */
  validateTemplate(template) {
    const requiredFields = ["title", "description", "template"];

    for (const field of requiredFields) {
      if (!template[field] || typeof template[field] !== "string") {
        throw new Error(`Missing or invalid required field: ${field}`);
      }
    }

    if (template.examples && !Array.isArray(template.examples)) {
      throw new Error("Examples must be an array");
    }

    if (template.examples) {
      template.examples.forEach((example, index) => {
        if (!example.title || !example.content) {
          throw new Error(
            `Invalid example at index ${index}: missing title or content`
          );
        }
      });
    }
  }

  /**
   * 計算搜尋匹配度
   * @param {string} text - 搜尋文字
   * @param {string} query - 查詢關鍵字
   */
  calculateMatchScore(text, query) {
    const queryWords = query.toLowerCase().split(/\s+/);
    let score = 0;

    queryWords.forEach((word) => {
      if (text.includes(word)) {
        score += 1;
        // 標題匹配給予更高分數
        if (text.includes(word)) {
          score += 0.5;
        }
      }
    });

    return score;
  }

  /**
   * 匯出模板配置
   */
  exportTemplates() {
    try {
      return {
        success: true,
        templates: this.templates,
        exportTime: new Date().toISOString(),
      };
    } catch (error) {
      logger.error("Failed to export templates:", error);
      throw error;
    }
  }

  /**
   * 匯入模板配置
   * @param {Object} config - 模板配置
   */
  importTemplates(config) {
    try {
      // 驗證配置格式
      if (!config.templates || !config.order || !config.categories) {
        throw new Error("Invalid template configuration format");
      }

      // 備份當前配置
      const backup = { ...this.templates };

      try {
        // 驗證所有模板
        Object.keys(config.templates).forEach((key) => {
          this.validateTemplate(config.templates[key]);
        });

        // 更新配置
        Object.assign(this.templates, config);

        logger.info("Templates imported successfully");
        return {
          success: true,
          message: "模板配置匯入成功",
          importedCount: Object.keys(config.templates).length,
        };
      } catch (error) {
        // 恢復備份
        Object.assign(this.templates, backup);
        throw error;
      }
    } catch (error) {
      logger.error("Failed to import templates:", error);
      throw error;
    }
  }
}

module.exports = TemplateManager;
