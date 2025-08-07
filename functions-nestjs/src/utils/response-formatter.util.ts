import { ApiResponse, PaginatedResponse } from '../types';

export class ResponseFormatter {
  static success<T>(data: T, message?: string): ApiResponse<T> {
    return {
      success: true,
      data,
      message,
      timestamp: new Date(),
    };
  }

  static error(error: string, message?: string): ApiResponse<null> {
    return {
      success: false,
      error,
      message,
      timestamp: new Date(),
    };
  }

  static paginated<T>(
    data: T[],
    page: number,
    limit: number,
    total: number,
    message?: string
  ): PaginatedResponse<T> {
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  static formatLineMessage(text: string, quickReply?: any): any {
    const message: any = {
      type: 'text',
      text,
    };

    if (quickReply) {
      message.quickReply = quickReply;
    }

    return message;
  }

  static formatTemplateMessage(
    type: string,
    altText: string,
    template: any
  ): any {
    return {
      type: 'template',
      altText,
      template: {
        type,
        ...template,
      },
    };
  }

  static formatQuickReply(items: Array<{ label: string; text?: string; data?: string; uri?: string }>): any {
    return {
      items: items.map(item => ({
        type: 'action',
        action: {
          type: item.uri ? 'uri' : 'postback',
          label: item.label,
          ...(item.text && { text: item.text }),
          ...(item.data && { data: item.data }),
          ...(item.uri && { uri: item.uri }),
        },
      })),
    };
  }
}
