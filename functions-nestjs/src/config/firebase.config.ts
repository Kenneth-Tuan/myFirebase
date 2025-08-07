import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { EnvironmentConfig } from '../types';

@Injectable()
export class FirebaseConfig implements OnModuleInit {
  private firebaseApp: admin.app.App;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    this.initializeFirebase();
  }

  private initializeFirebase(): void {
    const config = this.configService.get<EnvironmentConfig>('environment');

    if (!config) {
      throw new Error('Environment configuration not found');
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

      console.log('Firebase Admin SDK initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Firebase Admin SDK:', error);
      throw error;
    }
  }

  getFirestore(): admin.firestore.Firestore {
    return this.firebaseApp.firestore();
  }

  getAuth(): admin.auth.Auth {
    return this.firebaseApp.auth();
  }

  getApp(): admin.app.App {
    return this.firebaseApp;
  }
}
