import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { LineWebhookEvent } from '../types';
import { ErrorHandler } from '../utils/error-handler.util';

@Injectable()
export class LineWebhookHandler {
  private readonly logger = new Logger(LineWebhookHandler.name);

  constructor(private configService: ConfigService) {}

  /**
   * Verify LINE webhook signature
   */
  verifySignature(body: string, signature: string): boolean {
    const channelSecret = this.configService.get<string>(
      'environment.LINE_CHANNEL_SECRET',
    );

    if (!channelSecret) {
      this.logger.error('LINE_CHANNEL_SECRET not configured');
      return false;
    }

    const hash = crypto
      .createHmac('SHA256', channelSecret)
      .update(body, 'utf8')
      .digest('base64');

    return hash === signature;
  }

  /**
   * Process incoming LINE webhook events
   */
  async handleWebhook(events: LineWebhookEvent[]): Promise<void> {
    try {
      for (const event of events) {
        await this.processEvent(event);
      }
    } catch (error) {
      const appError = ErrorHandler.handle(error);
      ErrorHandler.logError(appError, { events });
      throw appError;
    }
  }

  /**
   * Process individual LINE event
   */
  private async processEvent(event: LineWebhookEvent): Promise<void> {
    this.logger.log(`Processing event: ${event.type}`);

    switch (event.type) {
      case 'message':
        await this.handleMessageEvent(event);
        break;
      case 'postback':
        await this.handlePostbackEvent(event);
        break;
      case 'follow':
        await this.handleFollowEvent(event);
        break;
      case 'unfollow':
        await this.handleUnfollowEvent(event);
        break;
      case 'join':
        await this.handleJoinEvent(event);
        break;
      case 'leave':
        await this.handleLeaveEvent(event);
        break;
      case 'memberJoined':
        await this.handleMemberJoinedEvent(event);
        break;
      case 'memberLeft':
        await this.handleMemberLeftEvent(event);
        break;
      default:
        this.logger.warn(`Unhandled event type: ${event.type}`);
    }
  }

  /**
   * Handle text message events
   */
  private async handleMessageEvent(event: LineWebhookEvent): Promise<void> {
    if (!event.message || event.message.type !== 'text') {
      return;
    }

    const userId = event.source.userId;
    const text = event.message.text;

    if (!userId || !text) {
      this.logger.warn('Message event without userId or text');
      return;
    }

    this.logger.log(`Received message from ${userId}: ${text}`);

    // TODO: Implement message processing logic
    // This will be connected to the query system in Phase 2
    this.processUserMessage(userId, text, event.replyToken);
  }

  /**
   * Handle postback events (button clicks, etc.)
   */
  private async handlePostbackEvent(event: LineWebhookEvent): Promise<void> {
    if (!event.postback) {
      return;
    }

    const userId = event.source.userId;
    const data = event.postback.data;

    if (!userId) {
      this.logger.warn('Postback event without userId');
      return;
    }

    this.logger.log(`Received postback from ${userId}: ${data}`);

    // TODO: Implement postback processing logic
    this.processPostback(userId, data, event.replyToken);
  }

  /**
   * Handle follow events (user adds the bot)
   */
  private async handleFollowEvent(event: LineWebhookEvent): Promise<void> {
    if (!event.follow) {
      return;
    }

    const userId = event.source.userId;
    const replyToken = event.follow.replyToken;

    if (!userId) {
      this.logger.warn('Follow event without userId');
      return;
    }

    this.logger.log(`User ${userId} followed the bot`);

    // TODO: Implement user registration logic
    this.handleUserFollow(userId, replyToken);
  }

  /**
   * Handle unfollow events (user blocks the bot)
   */
  private async handleUnfollowEvent(event: LineWebhookEvent): Promise<void> {
    const userId = event.source.userId;

    if (!userId) {
      this.logger.warn('Unfollow event without userId');
      return;
    }

    this.logger.log(`User ${userId} unfollowed the bot`);

    // TODO: Implement user cleanup logic
    this.handleUserUnfollow(userId);
  }

  /**
   * Handle join events (bot added to group/room)
   */
  private async handleJoinEvent(event: LineWebhookEvent): Promise<void> {
    if (!event.join) {
      return;
    }

    const replyToken = event.join.replyToken;
    const sourceType = event.source.type;
    const sourceId = event.source.groupId || event.source.roomId;

    if (!sourceId) {
      this.logger.warn('Join event without source ID');
      return;
    }

    this.logger.log(`Bot joined ${sourceType}: ${sourceId}`);

    // TODO: Implement join logic
    this.handleBotJoin(sourceType, sourceId, replyToken);
  }

  /**
   * Handle leave events (bot removed from group/room)
   */
  private async handleLeaveEvent(event: LineWebhookEvent): Promise<void> {
    const sourceType = event.source.type;
    const sourceId = event.source.groupId || event.source.roomId;

    if (!sourceId) {
      this.logger.warn('Leave event without source ID');
      return;
    }

    this.logger.log(`Bot left ${sourceType}: ${sourceId}`);

    // TODO: Implement leave logic
    this.handleBotLeave(sourceType, sourceId);
  }

  /**
   * Handle member joined events
   */
  private async handleMemberJoinedEvent(
    event: LineWebhookEvent,
  ): Promise<void> {
    if (!event.memberJoined) {
      return;
    }

    const replyToken = event.memberJoined.replyToken;
    const members = event.memberJoined.members;

    this.logger.log(
      `Members joined: ${members.map((m) => m.userId).join(', ')}`,
    );

    // TODO: Implement member joined logic
    this.handleMembersJoined(members, replyToken);
  }

  /**
   * Handle member left events
   */
  private async handleMemberLeftEvent(event: LineWebhookEvent): Promise<void> {
    if (!event.memberLeft) {
      return;
    }

    const members = event.memberLeft.members;

    this.logger.log(`Members left: ${members.map((m) => m.userId).join(', ')}`);

    // TODO: Implement member left logic
    this.handleMembersLeft(members);
  }

  // Placeholder methods for future implementation
  private processUserMessage(
    userId: string,
    text: string,
    replyToken?: string,
  ): void {
    // TODO: Implement in Phase 2 with query system
    this.logger.log(`Processing message: ${text} from user: ${userId}`);
    if (replyToken) {
      this.logger.log(`Reply token available: ${replyToken}`);
    }
  }

  private processPostback(
    userId: string,
    data: string,
    replyToken?: string,
  ): void {
    // TODO: Implement in Phase 2 with query system
    this.logger.log(`Processing postback: ${data} from user: ${userId}`);
    if (replyToken) {
      this.logger.log(`Reply token available: ${replyToken}`);
    }
  }

  private handleUserFollow(userId: string, replyToken: string): void {
    // TODO: Implement user registration
    this.logger.log(`Handling user follow: ${userId}`);
    this.logger.log(`Reply token: ${replyToken}`);
  }

  private handleUserUnfollow(userId: string): void {
    // TODO: Implement user cleanup
    this.logger.log(`Handling user unfollow: ${userId}`);
  }

  private handleBotJoin(
    sourceType: string,
    sourceId: string,
    replyToken: string,
  ): void {
    // TODO: Implement bot join logic
    this.logger.log(`Handling bot join: ${sourceType} ${sourceId}`);
    this.logger.log(`Reply token: ${replyToken}`);
  }

  private handleBotLeave(sourceType: string, sourceId: string): void {
    // TODO: Implement bot leave logic
    this.logger.log(`Handling bot leave: ${sourceType} ${sourceId}`);
  }

  private handleMembersJoined(
    members: Array<{ type: string; userId: string }>,
    replyToken: string,
  ): void {
    // TODO: Implement members joined logic
    this.logger.log(`Handling members joined: ${members.length} members`);
    this.logger.log(`Reply token: ${replyToken}`);
  }

  private handleMembersLeft(
    members: Array<{ type: string; userId: string }>,
  ): void {
    // TODO: Implement members left logic
    this.logger.log(`Handling members left: ${members.length} members`);
  }
}
