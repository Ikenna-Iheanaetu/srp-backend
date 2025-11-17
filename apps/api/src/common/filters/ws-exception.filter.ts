import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { ApiResponse, ApiError } from '../interfaces/api-response.interface';

@Catch()
export class WsExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(WsExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToWs();
    const client = ctx.getClient<Socket>();
    const pattern = ctx.getPattern();

    // Get the acknowledgement callback if it exists
    // In Socket.IO, the callback is typically the last argument
    const args = host.getArgs();
    const callback = args[args.length - 1];

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error occurred';
    let errors: ApiError[] = [];

    // Handle different exception types
    if (exception instanceof WsException) {
      const errorResponse = exception.getError();

      if (typeof errorResponse === 'string') {
        message = errorResponse;
        status = HttpStatus.BAD_REQUEST;
      } else if (typeof errorResponse === 'object') {
        const response = errorResponse as any;
        message = Array.isArray(response.message)
          ? response.message[0] || message
          : response.message || message;
        status = response.statusCode || HttpStatus.BAD_REQUEST;

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
    } else if (exception instanceof HttpException) {
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
    this.logger.error(`WebSocket Error on event '${pattern}': ${message}`, {
      socketId: client.id,
      event: pattern,
      stack: exception instanceof Error ? exception.stack : undefined,
    });

    // Send consistent error response using ApiResponse structure
    const errorResponse: ApiResponse = {
      success: false,
      message,
      errors: errors.length > 0 ? errors : undefined,
      meta: {
        timestamp: new Date().toISOString(),
        path: `/ws/${pattern}`,
        method: 'WS',
        requestId: crypto.randomUUID(),
        version: 'v1',
      },
    };

    // Send error through acknowledgement callback if it exists
    if (typeof callback === 'function') {
      this.logger.debug(`Sending error through acknowledgement callback for event: ${pattern}`);
      callback(errorResponse);
    } else {
      // Fallback: emit error event to client
      this.logger.debug(`No callback found, emitting error event for: ${pattern}`);
      client.emit('exception', errorResponse);
    }
  }
}
