/**
 * Advanced TypeScript utility types for the application
 */

/**
 * Make all properties of T optional recursively
 */
export type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;

/**
 * Make all properties of T required recursively
 */
export type DeepRequired<T> = T extends object
  ? {
      [P in keyof T]-?: DeepRequired<T[P]>;
    }
  : T;

/**
 * Make all properties of T readonly recursively
 */
export type DeepReadonly<T> = T extends
  | ((...args: any[]) => any)
  | Date
  | RegExp
  ? T
  : T extends ReadonlyArray<infer R>
    ? ReadonlyArray<DeepReadonly<R>>
    : T extends object
      ? {
          readonly [P in keyof T]: DeepReadonly<T[P]>;
        }
      : T;

/**
 * Extract the type of array elements
 */
export type ArrayElement<T> = T extends readonly (infer U)[] ? U : never;

/**
 * Extract the return type of a promise
 */
export type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;

/**
 * Extract the return type of an async function
 */
export type AsyncReturnType<T extends (...args: any) => Promise<any>> =
  UnwrapPromise<ReturnType<T>>;

/**
 * Make specified keys of T required
 */
export type RequireKeys<T, K extends keyof T> = Omit<T, K> &
  Required<Pick<T, K>>;

/**
 * Make specified keys of T optional
 */
export type OptionalKeys<T, K extends keyof T> = Omit<T, K> &
  Partial<Pick<T, K>>;

/**
 * Extract keys of T that are of type U
 */
export type KeysOfType<T, U> = {
  [K in keyof T]: T[K] extends U ? K : never;
}[keyof T];

/**
 * Pick properties of T that are of type U
 */
export type PickByType<T, U> = Pick<T, KeysOfType<T, U>>;

/**
 * Omit properties of T that are of type U
 */
export type OmitByType<T, U> = Omit<T, KeysOfType<T, U>>;

/**
 * Create a type with at least one property from T
 */
export type AtLeastOne<T, Keys extends keyof T = keyof T> = Partial<T> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>;
  }[Keys];

/**
 * Create a type with exactly one property from T
 */
export type ExactlyOne<T, Keys extends keyof T = keyof T> = {
  [K in Keys]-?: Required<Pick<T, K>> &
    Partial<Record<Exclude<Keys, K>, never>>;
}[Keys];

/**
 * Merge two types, with properties in T2 overriding those in T1
 */
export type Merge<T1, T2> = Omit<T1, keyof T2> & T2;

/**
 * Create a type that represents either T or null
 */
export type Nullable<T> = T | null;

/**
 * Create a type that represents either T, null, or undefined
 */
export type Maybe<T> = T | null | undefined;

/**
 * Remove null and undefined from T
 */
export type NonNullable<T> = T extends null | undefined ? never : T;

/**
 * Create a branded type for nominal typing
 */
export type Brand<T, B> = T & { __brand: B };

/**
 * Common branded types
 */
export type UUID = Brand<string, 'UUID'>;
export type Email = Brand<string, 'Email'>;
export type URL = Brand<string, 'URL'>;
export type PhoneNumber = Brand<string, 'PhoneNumber'>;
export type Timestamp = Brand<number, 'Timestamp'>;

/**
 * Type-safe object entries
 */
export type Entries<T> = {
  [K in keyof T]: [K, T[K]];
}[keyof T][];

/**
 * Type-safe object from entries
 */
export type FromEntries<T extends ReadonlyArray<readonly [PropertyKey, any]>> =
  {
    [K in T[number][0]]: Extract<T[number], readonly [K, any]>[1];
  };

/**
 * Prettify complex types for better IDE display
 */
export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

/**
 * Extract the instance type of a class constructor
 */
export type InstanceType<T extends abstract new (...args: any) => any> =
  T extends abstract new (...args: any) => infer R ? R : any;

/**
 * Create a type-safe enum-like object
 */
export type ValueOf<T> = T[keyof T];

/**
 * Path type for nested object access
 */
export type Path<T> = T extends object
  ? {
      [K in keyof T]: K extends string
        ? T[K] extends object
          ? K | `${K}.${Path<T[K]>}`
          : K
        : never;
    }[keyof T]
  : never;

/**
 * Get the type at a specific path in an object
 */
export type PathValue<
  T,
  P extends Path<T>,
> = P extends `${infer K}.${infer Rest}`
  ? K extends keyof T
    ? Rest extends Path<T[K]>
      ? PathValue<T[K], Rest>
      : never
    : never
  : P extends keyof T
    ? T[P]
    : never;

/**
 * Create a readonly deep freeze type
 */
export type Immutable<T> = T extends primitive
  ? T
  : T extends Array<infer U>
    ? ReadonlyArray<Immutable<U>>
    : T extends Map<infer K, infer V>
      ? ReadonlyMap<Immutable<K>, Immutable<V>>
      : T extends Set<infer S>
        ? ReadonlySet<Immutable<S>>
        : {
            readonly [K in keyof T]: Immutable<T[K]>;
          };

/**
 * Primitive types
 */
export type primitive =
  | string
  | number
  | boolean
  | bigint
  | symbol
  | undefined
  | null;

/**
 * JSON-serializable types
 */
export type JsonPrimitive = string | number | boolean | null;
export type JsonObject = { [key: string]: JsonValue };
export type JsonArray = JsonValue[];
export type JsonValue = JsonPrimitive | JsonObject | JsonArray;

/**
 * Constructor type
 */
export type Constructor<T = object> = new (...args: any[]) => T;

/**
 * Abstract constructor type
 */
export type AbstractConstructor<T = object> = abstract new (
  ...args: any[]
) => T;
