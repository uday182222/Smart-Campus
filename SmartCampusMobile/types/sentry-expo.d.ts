declare module 'sentry-expo' {
  export const Native: { captureException: (error: unknown, options?: object) => void };
  export function init(options: object): void;
}
