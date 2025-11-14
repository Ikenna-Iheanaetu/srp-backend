import { ArgumentMetadata } from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';

/**
 * Custom validation pipe that normalizes query array parameters before validation
 * Converts field[] to field automatically for all query parameters
 *
 * Example:
 * Before: { 'status[]': ['read', 'unread'], page: '1' }
 * After:  { status: ['read', 'unread'], page: '1' }
 */
export class QueryValidationPipe extends ZodValidationPipe {
  async transform(value: any, metadata: ArgumentMetadata) {
    // Only normalize query parameters
    if (metadata.type === 'query' && value && typeof value === 'object') {
      const normalized: Record<string, any> = {};

      Object.keys(value).forEach((key) => {
        if (key.endsWith('[]')) {
          // Remove brackets from the key
          const cleanKey = key.slice(0, -2);
          normalized[cleanKey] = value[key];
        } else {
          normalized[key] = value[key];
        }
      });

      // Pass normalized value to the parent ZodValidationPipe
      return super.transform(normalized, metadata);
    }

    // For non-query parameters, use standard validation
    return super.transform(value, metadata);
  }
}