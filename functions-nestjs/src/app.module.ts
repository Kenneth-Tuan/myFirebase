import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LineWebhookHandler } from './handlers/line-webhook.handler';
import { FirebaseConfig } from './config/firebase.config';
import { environmentConfig } from './config/environment.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [environmentConfig],
      // Temporarily disable validation for development
      // validate: (config) => {
      //   validateEnvironment(config.environment);
      //   return config;
      // },
    }),
  ],
  controllers: [AppController],
  providers: [AppService, LineWebhookHandler, FirebaseConfig],
})
export class AppModule {}
