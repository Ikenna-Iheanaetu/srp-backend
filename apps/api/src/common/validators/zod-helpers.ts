import { z } from 'zod';

/**
 * Zod helper utilities for common validation patterns
 * These are designed to work with JSON Schema generation for NestJS/Swagger
 */

/**
 * Parses JSON string to object and validates against schema
 * Usage: zodJsonString(NestedSchema).optional()
 * Equivalent to: @TransformObject() @Type(() => NestedDto) @ValidateNested()
 */
export function zodJsonString<T extends z.ZodTypeAny>(schema: T) {
  return z.preprocess((val) => {
    if (typeof val === 'string') {
      try {
        return JSON.parse(val);
      } catch {
        return val; // Let schema validation handle the error
      }
    }
    return val;
  }, schema);
}

/**
 * Parses JSON string array and validates each item
 * Usage: zodStringArray(z.string()).optional()
 * Equivalent to: @TransformStringArray() @IsArray() @IsString({ each: true })
 */
export function zodStringArray<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.preprocess((val) => {
    if (typeof val === 'string') {
      try {
        const parsed = JSON.parse(val);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return Array.isArray(val) ? val : [];
  }, z.array(itemSchema));
}

/**
 * Transforms string/boolean to boolean
 * Usage: zodBoolean().optional()
 * Equivalent to: @TransformBoolean() @IsBoolean()
 */
export function zodBoolean() {
  return z.preprocess((val) => {
    if (typeof val === 'string') {
      const lowerValue = val.toLowerCase();
      if (lowerValue === 'true' || lowerValue === '1') return true;
      if (lowerValue === 'false' || lowerValue === '0') return false;
    }
    if (typeof val === 'boolean') return val;
    return undefined;
  }, z.boolean());
}

/**
 * Transforms string/number to integer
 * Usage: zodInteger(z.number().int().min(1).max(100)).optional()
 * Equivalent to: @TransformInteger() @IsInt() @Min(1) @Max(100)
 */
export function zodInteger(schema: z.ZodNumber = z.number().int()) {
  return z.preprocess((val) => {
    if (typeof val === 'string') {
      const parsed = parseInt(val, 10);
      return isNaN(parsed) ? undefined : parsed;
    }
    if (typeof val === 'number') return Math.floor(val);
    return undefined;
  }, schema);
}

/**
 * Transforms string/number to number
 * Usage: zodNumber(z.number().min(0)).optional()
 * Equivalent to: @TransformNumber() @IsNumber() @Min(0)
 */
export function zodNumber(schema: z.ZodNumber = z.number()) {
  return z.preprocess((val) => {
    if (typeof val === 'string') {
      const parsed = Number(val);
      return isNaN(parsed) ? undefined : parsed;
    }
    return typeof val === 'number' ? val : undefined;
  }, schema);
}

/**
 * Validates MongoDB ObjectId format
 * Usage: zodMongoId()
 * Equivalent to: @IsString() @Validate(IsValidIdConstraint)
 */
export function zodMongoId() {
  return z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid identifier format');
}

/**
 * Transforms value to uppercase then validates against enum
 * Usage: zodEnumTransform(UserType)
 * Equivalent to: @Transform(({ value }) => value?.toUpperCase()) @IsEnum(UserType)
 */
export function zodEnumTransform<T extends Record<string, string | number>>(
  enumType: T,
) {
  const enumValues = Object.values(enumType);

  return z.preprocess(
    (val) => {
      if (typeof val === 'string') {
        return val.toUpperCase();
      }
      return val;
    },
    z.enum(enumValues as [string, ...string[]]),
  );
}

/**
 * Transforms query parameters to arrays
 * Usage: zodQueryArray(z.string())
 * Equivalent to: @TransformQueryArray() @IsArray()
 */
export function zodQueryArray<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.preprocess((val) => {
    if (val === undefined || val === null || val === '') return undefined;
    return Array.isArray(val) ? val : [val];
  }, z.array(itemSchema).optional());
}

/**
 * Transforms query array parameters to uppercase enum values
 * Usage: zodQueryArrayToUppercase(NotificationStatus)
 * Equivalent to: @TransformQueryArrayToUppercase() @IsArray() @IsEnum(Enum, { each: true })
 */
export function zodQueryArrayToUppercase<
  T extends Record<string, string | number>,
>(enumType?: T) {
  if (enumType) {
    const enumValues = Object.values(enumType);

    return z.preprocess(
      (val) => {
        if (val === undefined || val === null || val === '') {
          return undefined;
        }
        const values = Array.isArray(val) ? val : [val];
        const uppercased = values
          .map((v) => v?.toString().toUpperCase())
          .filter((v) => v && v !== '');

        // Validate each value is in enum
        for (const value of uppercased) {
          if (!enumValues.includes(value as any)) {
            throw new Error(
              `Invalid enum value: ${value}. Expected one of: ${enumValues.join(', ')}`,
            );
          }
        }
        return uppercased;
      },
      z.array(z.enum(enumValues as [string, ...string[]])).optional(),
    );
  }

  return z.preprocess((val) => {
    if (val === undefined || val === null || val === '') {
      return undefined;
    }
    const values = Array.isArray(val) ? val : [val];
    return values
      .map((v) => v?.toString().toUpperCase())
      .filter((v) => v && v !== '');
  }, z.array(z.string()).optional());
}
