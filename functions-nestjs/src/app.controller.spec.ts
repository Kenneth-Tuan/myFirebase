import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { LineWebhookHandler } from './handlers/line-webhook.handler';
import { ConfigService } from '@nestjs/config';
import { LineWebhookEvent } from './types';

describe('AppController', () => {
  let appController: AppController;
  let lineWebhookHandler: LineWebhookHandler;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: LineWebhookHandler,
          useValue: {
            verifySignature: jest.fn(),
            handleWebhook: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
    lineWebhookHandler = app.get<LineWebhookHandler>(LineWebhookHandler);
  });

  describe('root', () => {
    it('should return "LINE Bot NestJS API is running!"', () => {
      expect(appController.getHello()).toBe('LINE Bot NestJS API is running!');
    });
  });

  describe('health', () => {
    it('should return health status', () => {
      const result = appController.getHealth();
      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('healthy');
      expect(result.data?.timestamp).toBeDefined();
    });
  });

  describe('webhook', () => {
    it('should handle webhook with valid signature and no events', async () => {
      const mockBody = { events: [] };
      const mockSignature = 'valid-signature';
      const mockHeaders = {};

      jest.spyOn(lineWebhookHandler, 'verifySignature').mockReturnValue(true);
      jest.spyOn(lineWebhookHandler, 'handleWebhook').mockResolvedValue();

      const result = await appController.handleWebhook(
        mockBody,
        mockSignature,
        mockHeaders,
      );

      expect(result.success).toBe(true);
      expect(result.data?.processed).toBe(0);
      expect(lineWebhookHandler.verifySignature).toHaveBeenCalled();
      expect(lineWebhookHandler.handleWebhook).not.toHaveBeenCalled();
    });

    it('should reject webhook with invalid signature', async () => {
      const mockBody = { events: [] };
      const mockSignature = 'invalid-signature';
      const mockHeaders = {};

      jest.spyOn(lineWebhookHandler, 'verifySignature').mockReturnValue(false);

      const result = await appController.handleWebhook(
        mockBody,
        mockSignature,
        mockHeaders,
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid signature');
      expect(lineWebhookHandler.verifySignature).toHaveBeenCalled();
      expect(lineWebhookHandler.handleWebhook).not.toHaveBeenCalled();
    });

    it('should handle webhook with events', async () => {
      const mockEvent: LineWebhookEvent = {
        type: 'message',
        mode: 'active',
        timestamp: 1234567890,
        source: { type: 'user', userId: '123' },
        webhookEventId: 'test-id',
        deliveryContext: { isRedelivery: false },
      };
      const mockBody = { events: [mockEvent] };
      const mockSignature = 'valid-signature';
      const mockHeaders = {};

      jest.spyOn(lineWebhookHandler, 'verifySignature').mockReturnValue(true);
      jest.spyOn(lineWebhookHandler, 'handleWebhook').mockResolvedValue();

      const result = await appController.handleWebhook(
        mockBody,
        mockSignature,
        mockHeaders,
      );

      expect(result.success).toBe(true);
      expect(result.data?.processed).toBe(1);
      expect(lineWebhookHandler.verifySignature).toHaveBeenCalled();
      expect(lineWebhookHandler.handleWebhook).toHaveBeenCalledWith(
        mockBody.events,
      );
    });
  });

  describe('test', () => {
    it('should handle test endpoint', async () => {
      const mockBody = { test: 'data' };

      const result = await appController.testEndpoint(mockBody);

      expect(result.success).toBe(true);
      expect(result.data?.message).toBe('Test endpoint working');
      expect(result.data?.received).toEqual(mockBody);
    });
  });
});
