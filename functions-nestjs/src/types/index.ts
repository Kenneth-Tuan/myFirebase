// Core types for the LINE Bot application

export interface LineWebhookEvent {
  type: string;
  mode: string;
  timestamp: number;
  source: {
    type: string;
    userId?: string;
    groupId?: string;
    roomId?: string;
  };
  webhookEventId: string;
  deliveryContext: {
    isRedelivery: boolean;
  };
  message?: {
    id: string;
    type: string;
    quoteToken?: string;
    text?: string;
    emojis?: Array<{
      index: number;
      productId: string;
      emojiId: string;
    }>;
    mention?: {
      mentionees: Array<{
        index: number;
        length: number;
        type: string;
        userId?: string;
      }>;
    };
  };
  postback?: {
    data: string;
    params?: {
      date?: string;
      time?: string;
      datetime?: string;
    };
  };
  follow?: {
    replyToken: string;
  };
  unfollow?: {};
  join?: {
    replyToken: string;
  };
  leave?: {};
  memberJoined?: {
    replyToken: string;
    members: Array<{
      type: string;
      userId: string;
    }>;
  };
  memberLeft?: {
    members: Array<{
      type: string;
      userId: string;
    }>;
  };
  replyToken?: string;
}

export interface LineMessage {
  type: string;
  text?: string;
  quickReply?: {
    items: Array<{
      type: string;
      action: {
        type: string;
        label: string;
        text?: string;
        data?: string;
        uri?: string;
      };
    }>;
  };
  template?: {
    type: string;
    altText: string;
    columns?: Array<{
      thumbnailImageUrl?: string;
      title: string;
      text: string;
      actions: Array<{
        type: string;
        label: string;
        text?: string;
        uri?: string;
        data?: string;
      }>;
    }>;
    text?: string;
    actions?: Array<{
      type: string;
      label: string;
      text?: string;
      uri?: string;
      data?: string;
    }>;
  };
}

export interface GoogleCalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  location?: string;
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: string;
  }>;
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{
      method: string;
      minutes: number;
    }>;
  };
}

export interface UserProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
  language?: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiry?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CalendarConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

export interface QueryResult {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}

export interface ScheduleQuery {
  userId: string;
  date?: string;
  timeRange?: {
    start: string;
    end: string;
  };
  includeDetails?: boolean;
}

export interface BroadcastMessage {
  message: LineMessage;
  targetAudience?: {
    userIds?: string[];
    groupIds?: string[];
    roomIds?: string[];
  };
  scheduledTime?: Date;
}

export interface TokenInfo {
  accessToken: string;
  refreshToken: string;
  expiryDate: Date;
  scope: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: Date;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Error types
export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 500,
    public readonly isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string) {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string) {
    super(message, 403);
  }
}

// Environment variables interface
export interface EnvironmentConfig {
  NODE_ENV: string;
  PORT: number;
  LINE_CHANNEL_SECRET: string;
  LINE_CHANNEL_ACCESS_TOKEN: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GOOGLE_REDIRECT_URI: string;
  FIREBASE_PROJECT_ID: string;
  FIREBASE_PRIVATE_KEY: string;
  FIREBASE_CLIENT_EMAIL: string;
}
