import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';
import { z } from 'zod';

/**
 * Custom decorator to validate JSONB fields using Zod schemas
 * This bridges class-validator with Zod for complex nested validation
 *
 * @param schema - Zod schema to validate against
 * @param validationOptions - Optional class-validator options
 *
 * @example
 * ```typescript
 * @IsValidJsonb(ChecklistSchema)
 * checklist?: ChecklistItem[];
 * ```
 */
export function IsValidJsonb(
  schema: z.ZodSchema,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isValidJsonb',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown): boolean {
          // Allow undefined/null for optional fields
          if (value === undefined || value === null) {
            return true;
          }

          const result = schema.safeParse(value);
          return result.success;
        },
        defaultMessage(args: ValidationArguments): string {
          const result = schema.safeParse(args.value);
          if (!result.success) {
            // Extract first error for clearer message
            const firstError = result.error.issues[0];
            const path = firstError.path.join('.');
            const message = firstError.message;
            return `${args.property}${path ? `.${path}` : ''}: ${message}`;
          }
          return `${args.property} has invalid structure`;
        },
      },
    });
  };
}

/**
 * Validates an array of items against a Zod schema
 * Provides detailed error messages for each invalid item
 */
export function IsValidJsonbArray(
  itemSchema: z.ZodSchema,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isValidJsonbArray',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown): boolean {
          if (value === undefined || value === null) {
            return true;
          }

          if (!Array.isArray(value)) {
            return false;
          }

          return value.every((item) => itemSchema.safeParse(item).success);
        },
        defaultMessage(args: ValidationArguments): string {
          const value = args.value;

          if (!Array.isArray(value)) {
            return `${args.property} must be an array`;
          }

          // Find first invalid item and report the error
          for (let i = 0; i < value.length; i++) {
            const result = itemSchema.safeParse(value[i]);
            if (!result.success) {
              const firstError = result.error.issues[0];
              const path = firstError.path.join('.');
              return `${args.property}[${i}]${path ? `.${path}` : ''}: ${firstError.message}`;
            }
          }

          return `${args.property} contains invalid items`;
        },
      },
    });
  };
}
