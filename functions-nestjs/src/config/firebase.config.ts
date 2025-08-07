import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { EnvironmentConfig } from '../types';

@Injectable()
export class FirebaseConfig implements OnModuleInit {
  private firebaseApp: admin.app.App;
  private readonly logger = new Logger(FirebaseConfig.name);

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    this.initializeFirebase();
  }

  private initializeFirebase(): void {
    const config = this.configService.get<EnvironmentConfig>('environment');

    if (!config) {
      this.logger.error('Environment configuration not found');
      return;
    }

    // Log configuration for debugging
    this.logger.log('Firebase configuration:');
    this.logger.log(`Project ID: ${config.FIREBASE_PROJECT_ID}`);
    this.logger.log(`Client Email: ${config.FIREBASE_CLIENT_EMAIL}`);
    this.logger.log(`Private Key exists: ${!!config.FIREBASE_PRIVATE_KEY}`);

    // Check if required Firebase config is available
    if (
      !config.FIREBASE_PROJECT_ID ||
      !config.FIREBASE_CLIENT_EMAIL ||
      !config.FIREBASE_PRIVATE_KEY
    ) {
      this.logger.warn(
        'Firebase configuration incomplete, skipping Firebase initialization',
      );
      this.logger.warn(
        'This is normal for development without Firebase credentials',
      );
      return;
    }

    // Parse the private key if it's a string
    const privateKey = config.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');

    const serviceAccount = {
      projectId: config.FIREBASE_PROJECT_ID,
      privateKey: privateKey,
      clientEmail: config.FIREBASE_CLIENT_EMAIL,
    };

    try {
      this.firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: config.FIREBASE_PROJECT_ID,
      });

      this.logger.log('Firebase Admin SDK initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Firebase Admin SDK:', error);
      // Don't throw error, just log it
    }
  }

  getFirestore(): admin.firestore.Firestore | null {
    return this.firebaseApp?.firestore() || null;
  }

  getAuth(): admin.auth.Auth | null {
    return this.firebaseApp?.auth() || null;
  }

  getApp(): admin.app.App | null {
    return this.firebaseApp || null;
  }

  isInitialized(): boolean {
    return !!this.firebaseApp;
  }
}
