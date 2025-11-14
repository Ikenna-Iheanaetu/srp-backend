import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiResponse, ApiError } from '../interfaces/api-response.interface';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error occurred';
    let errors: ApiError[] = [];

    // Handle different exception types
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const response = exceptionResponse as any;
        message = Array.isArray(response.message)
          ? response.message[0] || message
          : response.message || message;

        // Handle validation errors
        if (response.errors && Array.isArray(response.errors)) {
          errors = response.errors;
        } else if (response.message && Array.isArray(response.message)) {
          // Handle class-validator errors
          errors = response.message.map((msg: any) => ({
            field: typeof msg === 'object' ? msg.property : undefined,
            message:
              typeof msg === 'object'
                ? Object.values(msg.constraints || {})[0]
                : msg,
            code: 'VALIDATION_ERROR',
          }));
        }
      }
    } else if (exception instanceof Error) {
      message = exception.message;

      // Handle specific error types
      if (exception.name === 'PrismaClientKnownRequestError') {
        const prismaError = exception as any;
        switch (prismaError.code) {
          case 'P2002':
            status = HttpStatus.CONFLICT;
            message = 'Resource already exists';
            errors = [
              {
                field: prismaError.meta?.target?.[0],
                message: 'This value is already taken',
                code: 'DUPLICATE_VALUE',
              },
            ];
            break;
          case 'P2025':
            status = HttpStatus.NOT_FOUND;
            message = 'Resource not found';
            break;
        }
      }
    }

    // Log error for monitoring
    this.logger.error(`HTTP ${status} Error: ${message}`, {
      path: request.url,
      method: request.method,
      userAgent: request.get('user-agent'),
      ip: request.ip,
      body: request.body,
      query: request.query,
      params: request.params,
      stack: exception instanceof Error ? exception.stack : undefined,
    });

    // Send consistent error response
    const errorResponse: ApiResponse = {
      success: false,
      message,
      errors: errors.length > 0 ? errors : undefined,
      meta: {
        timestamp: new Date().toISOString(),
        path: request.url,
        method: request.method,
        requestId:
          (request.headers['x-request-id'] as string) || crypto.randomUUID(),
        version: 'v1',
      },
    };

    response.status(status).json(errorResponse);
  }
}
