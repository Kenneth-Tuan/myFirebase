import { AppError, ValidationError, NotFoundError, UnauthorizedError, ForbiddenError } from '../types';

export class ErrorHandler {
  static handle(error: unknown): AppError {
    if (error instanceof AppError) {
      return error;
    }

    if (error instanceof Error) {
      // Handle specific error types
      if (error.message.includes('validation')) {
        return new ValidationError(error.message);
      }

      if (error.message.includes('not found') || error.message.includes('404')) {
        return new NotFoundError(error.message);
      }

      if (error.message.includes('unauthorized') || error.message.includes('401')) {
        return new UnauthorizedError(error.message);
      }

      if (error.message.includes('forbidden') || error.message.includes('403')) {
        return new ForbiddenError(error.message);
      }

      // Return generic AppError for other Error instances
      return new AppError(error.message);
    }

    // Handle unknown error types
    const errorMessage = typeof error === 'string' ? error : 'An unexpected error occurred';
    return new AppError(errorMessage);
  }

  static logError(error: AppError, context?: Record<string, any>): void {
    const logData = {
      name: error.name,
      message: error.message,
      statusCode: error.statusCode,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
    };

    if (error.statusCode >= 500) {
      console.error('Server Error:', logData);
    } else {
      console.warn('Client Error:', logData);
    }
  }

  static formatErrorResponse(error: AppError): { success: boolean; error: string; message?: string } {
    return {
      success: false,
      error: error.message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
    };
  }
}
