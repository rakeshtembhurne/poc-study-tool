import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

/**
 * Custom validation decorators with TypeScript type safety
 */

/**
 * Validate that a string is a valid phone number
 */
export function IsPhoneNumber(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isPhoneNumber',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown): boolean {
          if (typeof value !== 'string') return false;
          const phoneRegex = /^\+?[1-9]\d{1,14}$/;
          return phoneRegex.test(value.replace(/[\s-]/g, ''));
        },
        defaultMessage(args: ValidationArguments): string {
          return `${args.property} must be a valid phone number`;
        },
      },
    });
  };
}

/**
 * Validate that a string is a valid strong password
 */
export function IsStrongPassword(
  options?: {
    minLength?: number;
    minUppercase?: number;
    minLowercase?: number;
    minNumbers?: number;
    minSymbols?: number;
  },
  validationOptions?: ValidationOptions
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isStrongPassword',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown): boolean {
          if (typeof value !== 'string') return false;

          const minLength = options?.minLength ?? 8;
          const minUppercase = options?.minUppercase ?? 1;
          const minLowercase = options?.minLowercase ?? 1;
          const minNumbers = options?.minNumbers ?? 1;
          const minSymbols = options?.minSymbols ?? 1;

          if (value.length < minLength) return false;

          const uppercase = (value.match(/[A-Z]/g) || []).length;
          const lowercase = (value.match(/[a-z]/g) || []).length;
          const numbers = (value.match(/[0-9]/g) || []).length;
          const symbols = (value.match(/[^A-Za-z0-9]/g) || []).length;

          return (
            uppercase >= minUppercase &&
            lowercase >= minLowercase &&
            numbers >= minNumbers &&
            symbols >= minSymbols
          );
        },
        defaultMessage(args: ValidationArguments): string {
          return `${args.property} must be a strong password`;
        },
      },
    });
  };
}

/**
 * Validate that a value is within a specific enum
 */
export function IsEnum<T extends Record<string, unknown>>(
  enumType: T,
  validationOptions?: ValidationOptions
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isEnum',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [enumType],
      validator: {
        validate(value: unknown, args: ValidationArguments): boolean {
          const [enumType] = args.constraints as [Record<string, unknown>];
          const enumValues = Object.values(enumType);
          return enumValues.includes(value);
        },
        defaultMessage(args: ValidationArguments): string {
          const [enumType] = args.constraints as [Record<string, unknown>];
          const enumValues = Object.values(enumType).join(', ');
          return `${args.property} must be one of: ${enumValues}`;
        },
      },
    });
  };
}

/**
 * Validate that a date is in the future
 */
export function IsFutureDate(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isFutureDate',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown): boolean {
          if (!(value instanceof Date) && typeof value !== 'string')
            return false;
          const date = new Date(value);
          return date.getTime() > Date.now();
        },
        defaultMessage(args: ValidationArguments): string {
          return `${args.property} must be a future date`;
        },
      },
    });
  };
}

/**
 * Validate that a date is in the past
 */
export function IsPastDate(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isPastDate',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown): boolean {
          if (!(value instanceof Date) && typeof value !== 'string')
            return false;
          const date = new Date(value);
          return date.getTime() < Date.now();
        },
        defaultMessage(args: ValidationArguments): string {
          return `${args.property} must be a past date`;
        },
      },
    });
  };
}

/**
 * Constraint for array unique validation
 */
@ValidatorConstraint({ name: 'arrayUnique', async: false })
export class ArrayUniqueConstraint implements ValidatorConstraintInterface {
  validate(array: unknown): boolean {
    if (!Array.isArray(array)) return false;
    return new Set(array).size === array.length;
  }

  defaultMessage(args: ValidationArguments): string {
    return `${args.property} must contain unique values`;
  }
}

/**
 * Validate that an array contains unique values
 */
export function ArrayUnique(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'arrayUnique',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: ArrayUniqueConstraint,
    });
  };
}

/**
 * Validate that a string matches a specific pattern
 */
export function Matches(
  pattern: RegExp,
  validationOptions?: ValidationOptions
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'matches',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [pattern],
      validator: {
        validate(value: unknown, args: ValidationArguments): boolean {
          if (typeof value !== 'string') return false;
          const [pattern] = args.constraints as [RegExp];
          return pattern.test(value);
        },
        defaultMessage(args: ValidationArguments): string {
          return `${args.property} must match the required pattern`;
        },
      },
    });
  };
}

/**
 * Validate JSON string
 */
export function IsJsonString(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isJsonString',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown): boolean {
          if (typeof value !== 'string') return false;
          try {
            JSON.parse(value);
            return true;
          } catch {
            return false;
          }
        },
        defaultMessage(args: ValidationArguments): string {
          return `${args.property} must be a valid JSON string`;
        },
      },
    });
  };
}
