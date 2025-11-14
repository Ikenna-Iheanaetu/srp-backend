import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Observable, map, catchError, of } from 'rxjs';
import { WsException } from '@nestjs/websockets';

export interface WsResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: any[];
  meta: {
    timestamp: string;
    event: string;
    requestId: string;
  };
}

@Injectable()
export class WsResponseInterceptor<T>
  implements NestInterceptor<T, WsResponse<T>>
{
  private readonly logger = new Logger(WsResponseInterceptor.name);

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<WsResponse<T>> {
    const wsContext = context.switchToWs();
    const data = wsContext.getData();

    // Extract event name from the handler
    const eventName = context.getHandler().name.replace('handle', '').toLowerCase();
    const requestId = data?.requestId || crypto.randomUUID();

    return next.handle().pipe(
      map((response) => {
        // Transform nulls to undefined
        const transformedResponse = this.transformNullsToUndefined(response);

        // If already formatted with success field
        if (
          transformedResponse &&
          typeof transformedResponse === 'object' &&
          'success' in transformedResponse
        ) {
          return {
            ...transformedResponse,
            meta: {
              timestamp: new Date().toISOString(),
              event: transformedResponse.event || eventName,
              requestId,
            },
          };
        }

        // Auto-format response
        return {
          success: true,
          message: transformedResponse?.message || 'Operation completed successfully',
          data: transformedResponse?.data
            ? transformedResponse.data
            : transformedResponse?.message
              ? undefined
              : transformedResponse,
          meta: {
            timestamp: new Date().toISOString(),
            event: transformedResponse?.event || eventName,
            requestId,
          },
        };
      }),
      catchError((error) => {
        this.logger.error(`WebSocket Error in ${eventName}:`, error);

        let message = 'An error occurred';
        let errors: any[] = [];

        // Handle WsException
        if (error instanceof WsException) {
          const errorResponse = error.getError();
          if (typeof errorResponse === 'string') {
            message = errorResponse;
          } else if (typeof errorResponse === 'object') {
            message = (errorResponse as any).message || message;
            errors = (errorResponse as any).errors || [];
          }
        }
        // Handle HTTP Exceptions (BadRequestException, NotFoundException, etc.)
        else if (
          error instanceof BadRequestException ||
          error instanceof NotFoundException ||
          error instanceof ForbiddenException ||
          error instanceof UnauthorizedException
        ) {
          const exceptionResponse = error.getResponse();
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
        }
        // Handle generic Error
        else if (error instanceof Error) {
          message = error.message;
        }

        // Return formatted error response
        const errorResponse: WsResponse<T> = {
          success: false,
          message,
          errors: errors.length > 0 ? errors : undefined,
          meta: {
            timestamp: new Date().toISOString(),
            event: eventName,
            requestId,
          },
        };

        // Return error as observable value (Socket.IO will send to callback)
        // Using 'of' instead of 'throwError' ensures the callback receives the response
        return of(errorResponse);
      }),
    );
  }

  /**
   * Recursively transforms null values to undefined
   */
  private transformNullsToUndefined(obj: any): any {
    if (obj === null) return undefined;
    if (obj === undefined || typeof obj !== 'object') return obj;

    if (Array.isArray(obj)) {
      return obj.map((item) => this.transformNullsToUndefined(item));
    }

    if (
      obj instanceof Date ||
      obj instanceof RegExp ||
      obj instanceof Map ||
      obj instanceof Set
    ) {
      return obj;
    }

    const transformed: any = {};
    for (const [key, value] of Object.entries(obj)) {
      transformed[key] = this.transformNullsToUndefined(value);
    }

    return transformed;
  }
}
