# Crash debug — "Cannot assign to property default which has only a getter"

## Step 1 (current)

**App.tsx** is minimal: only `global.css`, `SafeAreaProvider`, `GestureHandlerRootView`, and a static "Smart Campus / Loading..." view. A global `ErrorUtils` handler logs:

- `=== CRASH FILE ===`
- `e.message`
- `e.stack`
- `=== END CRASH ===`

**Run:** `npx expo start --clear`

- **If it crashes** → Problem is in `global.css`, `GestureHandlerRootView`, or `SafeAreaProvider`. Check Metro/Expo console for the `=== CRASH FILE ===` block and the stack trace.
- **If it does NOT crash** → Problem is in one of the app imports. Continue with Step 2.

---

## Step 2 — Add imports back one at a time

Edit `App.tsx` and add one of these, then run and see if it crashes.

**Test A — AuthContext**

```tsx
import { AuthProvider } from './contexts/AuthContext';
// Wrap children: <AuthProvider><View>...</View></AuthProvider>
```

**Test B — SchoolThemeProvider**

```tsx
import { SchoolThemeProvider } from './contexts/SchoolThemeContext';
// Wrap inside AuthProvider: <SchoolThemeProvider>...</SchoolThemeProvider>
```

**Test C — ActiveChildProvider**

```tsx
import { ActiveChildProvider } from './contexts/ActiveChildContext';
```

**Test D — AppNavigator**

```tsx
import AppNavigator from './navigation/AppNavigator';
// Replace the View/Text with <AppNavigator />
```

If crash happens on **Test D** → AppNavigator or one of its screen imports is the cause.

---

## Step 3 — Isolate navigator

Use **TestNavigator** instead of AppNavigator:

```tsx
import TestNavigator from './navigation/TestNavigator';
// In App: <TestNavigator />
```

- If this **does not** crash → The full `AppNavigator` (or a screen it imports) is the problem.
- Then binary-search: in `navigation/AppNavigator.tsx`, comment out screen imports in groups, add back in groups of ~5 until the crash returns; then narrow to the single broken file.

---

## Step 5 — SafeAreaView

All screens/components should use:

```ts
import { SafeAreaView } from 'react-native-safe-area-context';
```

**Fixed:** `screens/FeeManagementScreen.tsx` (was importing SafeAreaView from `react-native`).

---

## Step 7 — Reanimated shim

`shims/reanimatedDrawerShim.js` is used so `@react-navigation/drawer` gets a stub for `useAnimatedGestureHandler` (Reanimated 4 removed it). The shim uses `Object.defineProperty(out, 'default', { writable: true, ... })`. If the crash points at this shim or reanimated, we may need to try removing the drawer shim and using a different drawer or Reanimated version.

---

## Step 8 — Versions (Expo 54)

Current: `react-native-reanimated ~4.1.1`, `react-native-gesture-handler ~2.28.0`, `react-native-safe-area-context ~5.6.0`, `@react-navigation/drawer ^6.6.6`. To align with Expo 54:

```bash
npx expo install react-native-reanimated react-native-gesture-handler react-native-safe-area-context @react-navigation/native @react-navigation/stack @react-navigation/drawer
```

---

**Paste the full `=== CRASH FILE ===` block from the console so we can see the exact file and line.**
