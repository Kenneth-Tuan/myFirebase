import { Controller, Post, Get, Body, Headers, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { LineWebhookHandler } from './handlers/line-webhook.handler';
import { LineWebhookEvent } from './types';
import { ErrorHandler } from './utils/error-handler.util';
import { ResponseFormatter } from './utils/response-formatter.util';

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(private readonly lineWebhookHandler: LineWebhookHandler) {}

  @Get()
  getHello(): string {
    return 'LINE Bot NestJS API is running!';
  }

  @Get('health')
  getHealth() {
    return ResponseFormatter.success({ status: 'healthy', timestamp: new Date() });
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Body() body: { events: LineWebhookEvent[] },
    @Headers('x-line-signature') signature: string,
    @Headers() headers: Record<string, string>
  ) {
    try {
      this.logger.log('Received webhook request');

      // Verify LINE signature
      const rawBody = JSON.stringify(body);
      if (!this.lineWebhookHandler.verifySignature(rawBody, signature)) {
        this.logger.error('Invalid LINE signature');
        return ResponseFormatter.error('Invalid signature');
      }

      // Process webhook events
      if (body.events && body.events.length > 0) {
        await this.lineWebhookHandler.handleWebhook(body.events);
        this.logger.log(`Processed ${body.events.length} events`);
      }

      return ResponseFormatter.success({ processed: body.events?.length || 0 });
    } catch (error) {
      const appError = ErrorHandler.handle(error);
      ErrorHandler.logError(appError, { body, headers });
      
      return ResponseFormatter.error(appError.message);
    }
  }

  @Post('test')
  @HttpCode(HttpStatus.OK)
  async testEndpoint(@Body() body: any) {
    this.logger.log('Test endpoint called', body);
    return ResponseFormatter.success({ message: 'Test endpoint working', received: body });
  }
}
