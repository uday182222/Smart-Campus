/**
 * Global type patches to satisfy TypeScript across the app without changing UI/logic.
 * Allows string for fontWeight and relaxes some RN style types where tokens are used.
 */
import 'react-native';

declare module 'react-native' {
  interface TextStyle {
    fontWeight?: string | number;
  }
}
