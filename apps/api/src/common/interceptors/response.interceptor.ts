import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { ApiResponse } from '../interfaces/api-response.interface';

@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    const request = context.switchToHttp().getRequest();
    const requestId = request.headers['x-request-id'] || crypto.randomUUID();

    return next.handle().pipe(
      map((data) => {
        // Transform nulls to undefined first, before any other processing
        const transformedData = this.transformNullsToUndefined(data);

        // Handle different response formats
        if (
          transformedData &&
          typeof transformedData === 'object' &&
          'success' in transformedData
        ) {
          // Already formatted response
          return {
            ...transformedData,
            meta: {
              timestamp: new Date().toISOString(),
              path: request.url,
              method: request.method,
              requestId,
              version: 'v1',
            },
          };
        }

        // Auto-format response
        return {
          success: true,
          message:
            transformedData?.message || 'Operation completed successfully',
          data: 'data' in (transformedData || {})
            ? transformedData.data
            : transformedData?.message
              ? undefined
              : transformedData,
          meta: {
            timestamp: new Date().toISOString(),
            path: request.url,
            method: request.method,
            requestId,
            version: 'v1',
          },
        };
      }),
    );
  }

  /**
   * Recursively transforms null values to undefined
   * Optimized for performance with early returns and minimal object creation
   */
  private transformNullsToUndefined(obj: any): any {
    // Handle primitives and null early
    if (obj === null) return undefined;
    if (obj === undefined || typeof obj !== 'object') return obj;

    // Handle arrays
    if (Array.isArray(obj)) {
      // Only create new array if we find nulls (performance optimization)
      let hasNulls = false;
      for (let i = 0; i < obj.length; i++) {
        if (
          obj[i] === null ||
          (typeof obj[i] === 'object' && obj[i] !== null)
        ) {
          hasNulls = true;
          break;
        }
      }

      if (!hasNulls) return obj;

      return obj.map((item) => this.transformNullsToUndefined(item));
    }

    // Handle Date objects and other special objects
    if (
      obj instanceof Date ||
      obj instanceof RegExp ||
      obj instanceof Map ||
      obj instanceof Set
    ) {
      return obj;
    }

    // Handle plain objects
    // First pass: check if transformation is needed
    let needsTransform = false;
    for (const value of Object.values(obj)) {
      if (
        value === null ||
        (typeof value === 'object' && value !== null)
      ) {
        needsTransform = true;
        break;
      }
    }

    // If no transformation needed, return original object
    if (!needsTransform) return obj;

    // Transform object properties
    const transformed: any = {};
    for (const [key, value] of Object.entries(obj)) {
      transformed[key] = this.transformNullsToUndefined(value);
    }

    return transformed;
  }
}
