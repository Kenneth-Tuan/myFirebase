# LINE Bot NestJS Migration - Phase 1

This is the first phase of migrating the LINE Bot from Express.js to NestJS. This phase establishes the core foundation and basic structure.

## 🎯 Phase 1 Goals

- ✅ Set up NestJS project structure
- ✅ Configure Firebase Functions integration
- ✅ Implement core TypeScript interfaces and types
- ✅ Create environment configuration system
- ✅ Set up Firebase Admin SDK integration
- ✅ Implement LINE webhook handler with signature verification
- ✅ Create error handling and response formatting utilities
- ✅ Set up basic testing framework
- ✅ Configure CORS and API routing

## 📁 Project Structure

```
src/
├── config/
│   ├── environment.config.ts    # Environment variables configuration
│   └── firebase.config.ts       # Firebase Admin SDK setup
├── handlers/
│   └── line-webhook.handler.ts  # Main LINE webhook event processor
├── modules/                     # Future module organization
│   ├── firestore/              # Firestore operations (Phase 2)
│   ├── status/                 # Status management (Phase 2)
│   ├── calendar/               # Google Calendar integration (Phase 3)
│   └── line/                   # LINE API operations (Phase 2)
├── services/                   # Business logic services (Phase 2)
├── utils/
│   ├── error-handler.util.ts   # Centralized error handling
│   └── response-formatter.util.ts # API response formatting
├── types/
│   └── index.ts                # TypeScript interfaces and types
├── app.controller.ts           # Main API controller
├── app.module.ts              # Root application module
├── main.ts                    # Application bootstrap
└── firebase-functions.ts      # Firebase Functions entry point
```

## 🚀 Getting Started

### Prerequisites

- Node.js >= 22
- Yarn package manager
- Firebase CLI
- LINE Bot Channel credentials
- Google Calendar API credentials

### Installation

```bash
# Install dependencies
yarn install

# Build the project
yarn build

# Run tests
yarn test

# Start development server
yarn start:dev
```

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# LINE Bot Configuration
LINE_CHANNEL_SECRET=your_line_channel_secret
LINE_CHANNEL_ACCESS_TOKEN=your_line_channel_access_token

# Google Calendar Configuration
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=your_google_redirect_uri

# Firebase Configuration
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_PRIVATE_KEY=your_firebase_private_key
FIREBASE_CLIENT_EMAIL=your_firebase_client_email

# Application Configuration
NODE_ENV=development
PORT=3000
```

### Firebase Functions Deployment

```bash
# Deploy to Firebase Functions
yarn deploy

# View logs
yarn logs

# Run Firebase emulator
yarn serve
```

## 🔧 API Endpoints

### Health Check
- **GET** `/api/health` - Application health status

### LINE Webhook
- **POST** `/api/webhook` - LINE webhook endpoint
  - Requires `x-line-signature` header for signature verification
  - Processes LINE events (messages, postbacks, follows, etc.)

### Test Endpoint
- **POST** `/api/test` - Test endpoint for development

## 🧪 Testing

The project includes comprehensive tests for the core functionality:

```bash
# Run all tests
yarn test

# Run tests in watch mode
yarn test:watch

# Run tests with coverage
yarn test:cov
```

### Test Coverage

- ✅ LINE webhook signature verification
- ✅ Webhook event processing
- ✅ Error handling
- ✅ Response formatting
- ✅ Controller endpoints

## 🔒 Security Features

- **LINE Signature Verification**: All webhook requests are verified using HMAC-SHA256
- **Environment Validation**: Required environment variables are validated at startup
- **Error Handling**: Centralized error handling with proper logging
- **CORS Configuration**: Proper CORS setup for webhook calls

## 📝 TypeScript Features

- **Strict TypeScript**: Full type safety with strict mode enabled
- **Interface Definitions**: Comprehensive type definitions for all data structures
- **Error Types**: Custom error classes with proper inheritance
- **API Response Types**: Typed API responses for consistency

## 🔄 Migration Status

### Phase 1 ✅ COMPLETED
- Core NestJS setup
- Basic LINE webhook handling
- Firebase integration
- Error handling and utilities

### Phase 2 🔄 NEXT
- Query system implementation
- LINE API service
- Firestore operations
- User management

### Phase 3 📋 PLANNED
- Google Calendar integration
- Schedule management
- OAuth flow
- Advanced features

## 🐛 Known Issues

- Some linter warnings about async methods (will be resolved in Phase 2)
- Firebase Functions v2 import warnings (non-critical)

## 📚 Documentation

- [NestJS Documentation](https://docs.nestjs.com/)
- [Firebase Functions Documentation](https://firebase.google.com/docs/functions)
- [LINE Bot API Documentation](https://developers.line.biz/en/docs/messaging-api/)

## 🤝 Contributing

1. Follow the established TypeScript and NestJS patterns
2. Write tests for new functionality
3. Update documentation for any API changes
4. Follow the migration plan phases

## 📄 License

This project is part of the LINE Bot migration to NestJS.
