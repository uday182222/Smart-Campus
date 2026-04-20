# Smart Campus - Gluestack UI Design System

## Overview

This React Native app has been transformed into a production-ready, polished UI using **Gluestack UI** as the design system foundation, combined with **Moti** for smooth animations and **Lucide React Native** for consistent, modern icons.

## Design Philosophy

- **Minimal & Clean**: Apple-style smoothness with shadcn-level cleanliness
- **Consistent**: Uniform spacing, colors, and typography across all screens
- **Smooth Animations**: Subtle, responsive transitions using Moti
- **Professional**: Production-ready UI that feels polished and cohesive

## Tech Stack

### UI Framework
- **@gluestack-ui/themed**: Core UI component library
- **@gluestack-style/react**: Styling engine

### Animations
- **moti**: Framer Motion for React Native - handles all animations
- Uses spring physics and timing functions for natural motion

### Icons
- **lucide-react-native**: Modern, consistent icon set
- Paired with text labels for clarity

### Navigation
- **React Navigation**: Stack, Tab, and Drawer navigators
- Smooth transitions with custom header styles

## Project Structure

```
SmartCampusMobile/
├── components/
│   └── ui/                       # Reusable UI components
│       ├── GluestackProvider.tsx # Provider wrapper
│       ├── AnimatedButton.tsx    # Button with Moti animations
│       ├── AnimatedCard.tsx      # Card with entry animations
│       ├── AnimatedInput.tsx     # Input with focus states
│       ├── StatCard.tsx          # Stats display card
│       └── GradientBox.tsx       # Gradient background
├── screens/                      # Production screens
│   ├── ProductionLoginScreen.tsx
│   ├── ProductionStudentDashboard.tsx
│   ├── ProductionTeacherDashboard.tsx
│   ├── ProductionParentDashboard.tsx
│   ├── ProductionAdminDashboard.tsx
│   └── ProductionSplashScreen.tsx
├── theme/
│   └── gluestack.config.ts       # Custom theme configuration
├── navigation/
│   └── AppNavigator.tsx          # Navigation setup
└── App.tsx                       # Root with GluestackProvider

```

## Theme Configuration

### Colors

**Primary Brand**: Rich gradient from indigo to purple
- Primary: `#6366f1` → `#8b5cf6`
- Used for: Buttons, headers, active states

**Color Palette**:
- **Primary**: Indigo/Blue shades (`$primary400`, `$primary500`, etc.)
- **Secondary**: Purple shades (`$secondary400`, `$secondary500`)
- **Success**: Green (`$success400`) - for positive states
- **Warning**: Amber (`$warning400`) - for alerts
- **Error**: Red (`$error400`) - for errors
- **Info**: Sky blue (`$info400`)

**Background Colors**:
- Light: `$backgroundLight` (white), `$backgroundLight50` (off-white)
- Dark: `$backgroundDark` (for dark mode support)

**Text Colors**:
- Dark: `$textDark` (#111827)
- Muted: `$textMuted` (#6b7280)
- Light: `$textLight` (white)

### Spacing

Based on 4px scale:
```typescript
$1 = 4px   $2 = 8px   $3 = 12px  $4 = 16px
$5 = 20px  $6 = 24px  $8 = 32px  $10 = 40px
```

Common usage:
- Card padding: `$4` to `$6`
- Element margins: `$3` to `$5`
- Section spacing: `$6` to `$8`

### Border Radius

Rounded, modern corners:
```typescript
$lg = 12px   $xl = 16px   $2xl = 20px   $3xl = 24px   $full = 9999px
```

Common usage:
- Buttons: `$xl` (16px)
- Cards: `$xl` to `$2xl`
- Avatars: `$full` (circular)

### Typography

**Font Sizes**:
- xs: 12px, sm: 14px, md: 16px, lg: 18px
- xl: 20px, 2xl: 24px, 3xl: 30px, 4xl: 36px

**Font Weights**:
- Regular: 400, Medium: 500, Semibold: 600, Bold: 700

## Core Components

### 1. AnimatedButton

Modern button with press animations and variants.

```tsx
import { AnimatedButton } from '../components/ui/AnimatedButton';
import { Mail } from 'lucide-react-native';

<AnimatedButton
  onPress={handleSubmit}
  variant="primary"      // primary, secondary, outline, ghost
  size="lg"              // sm, md, lg
  isLoading={loading}
  fullWidth
  leftIcon={<Mail size={20} color="#fff" />}
>
  Send Message
</AnimatedButton>
```

**Variants**:
- `primary`: Solid background with brand color
- `secondary`: Purple accent
- `outline`: Transparent with border
- `ghost`: Minimal, transparent

### 2. AnimatedCard

Card component with entrance animations.

```tsx
import { AnimatedCard } from '../components/ui/AnimatedCard';

<AnimatedCard
  variant="elevated"     // elevated, outline, filled, glass
  onPress={() => {}}     // Optional: makes it tappable
  delay={200}            // Stagger animations
  padding="$5"
>
  {children}
</AnimatedCard>
```

**Variants**:
- `elevated`: Drop shadow (default)
- `outline`: Border only
- `filled`: Solid background
- `glass`: Frosted glass effect

### 3. AnimatedInput

Input field with focus states and validation.

```tsx
import { AnimatedInput } from '../components/ui/AnimatedInput';
import { Lock } from 'lucide-react-native';

<AnimatedInput
  label="Password"
  placeholder="Enter password"
  value={password}
  onChangeText={setPassword}
  secureTextEntry
  leftIcon={<Lock size={20} color="#6b7280" />}
  error={errorMessage}
/>
```

### 4. StatCard

Display statistics with icon and value.

```tsx
import { StatCard } from '../components/ui/StatCard';
import { Users } from 'lucide-react-native';

<StatCard
  icon={<Users size={24} color="#6366f1" />}
  title="Total Students"
  value="156"
  subtitle="Across 5 classes"
  color="$primary400"
  delay={100}
  onPress={() => {}}  // Optional
/>
```

### 5. GradientBox

Linear gradient background.

```tsx
import { GradientBox } from '../components/ui/GradientBox';

<GradientBox colors={['#6366f1', '#8b5cf6', '#d946ef']}>
  {children}
</GradientBox>
```

## Animation Guidelines

### Entry Animations

All screens and cards use staggered entry animations:

```tsx
import { MotiView } from 'moti';

<MotiView
  from={{ opacity: 0, translateY: 20 }}
  animate={{ opacity: 1, translateY: 0 }}
  transition={{ type: 'timing', duration: 600, delay: 200 }}
>
  {content}
</MotiView>
```

**Best Practices**:
- Use delays (100-200ms increments) for staggered effects
- Duration: 400-800ms for smooth transitions
- Keep animations subtle (translate < 30px)

### Press Animations

Buttons scale down slightly on press:

```tsx
<MotiView
  animate={{ scale: pressed ? 0.95 : 1 }}
  transition={{ type: 'timing', duration: 150 }}
>
  {button}
</MotiView>
```

### Loading States

Use skeleton loaders or fade transitions:

```tsx
<MotiView
  animate={{ opacity: loading ? 0.5 : 1 }}
  transition={{ type: 'timing', duration: 300 }}
>
  {content}
</MotiView>
```

## Screen Structure

### Standard Layout

```tsx
import { SafeAreaView, ScrollView, StatusBar } from 'react-native';
import { Box, Text } from '@gluestack-ui/themed';
import { GradientBox } from '../components/ui/GradientBox';

const Screen = () => {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <StatusBar barStyle="light-content" backgroundColor="#6366f1" />
      
      {/* Header with gradient */}
      <GradientBox colors={['#6366f1', '#8b5cf6']} style={{ height: 'auto' }}>
        <Box padding="$5">
          {/* Header content */}
        </Box>
      </GradientBox>

      {/* Content */}
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        {/* Screen content */}
      </ScrollView>
    </SafeAreaView>
  );
};
```

## Icon Usage

### Lucide Icons

```tsx
import { 
  Mail, 
  Lock, 
  User, 
  Calendar,
  MessageCircle 
} from 'lucide-react-native';

// In component
<Mail size={20} color="#6366f1" />
```

**Icon Sizes**:
- Small: 16-18px (in text)
- Medium: 20-24px (buttons, inputs)
- Large: 32-48px (headers, empty states)

**Icon Colors**:
- Match brand: `#6366f1` (primary)
- Muted: `#6b7280` (secondary)
- Success: `#10b981`, Warning: `#f59e0b`, Error: `#ef4444`

## Responsive Design

### Grid Layouts

Use flex with wrap for responsive grids:

```tsx
<Box flexDirection="row" flexWrap="wrap" justifyContent="space-between">
  {items.map((item, index) => (
    <Box key={index} width="48%" marginBottom="$4">
      <StatCard {...item} />
    </Box>
  ))}
</Box>
```

### Spacing

Consistent padding/margin across breakpoints:
- Mobile: `padding="$4"` to `padding="$5"`
- Tablets: Scale up to `padding="$6"`

## Accessibility

- Semantic color usage (green = success, red = error)
- Clear text hierarchy with font sizes
- Tap targets > 44px (following iOS guidelines)
- Focus states on inputs
- Screen reader support via React Native accessibility props

## Performance

### Optimizations

1. **Moti Animations**: Use `useNativeDriver: true` for 60fps
2. **Lazy Loading**: Screens load on demand via React Navigation
3. **Image Optimization**: Use Expo's optimized image loading
4. **Memoization**: Use `React.memo` for expensive components

### Animation Performance

```tsx
// Good: Native driver for transform/opacity
<MotiView
  animate={{ opacity: 1, translateY: 0 }}
  transition={{ type: 'timing', duration: 600 }}
/>

// Avoid: Non-animatable properties
// Don't animate: height, width (use scale instead)
```

## Dark Mode Support (Future)

Theme is configured for dark mode:

```typescript
// In gluestack.config.ts
colors: {
  backgroundDark: '#1f2937',
  textLight: '#ffffff',
  // ... other dark mode colors
}
```

To enable, wrap with mode toggle and use conditional styling.

## Common Patterns

### Dashboard Stats Grid

```tsx
const stats = [
  { icon: <Users />, title: 'Students', value: '156', color: '$primary400' },
  // ...
];

<Box flexDirection="row" flexWrap="wrap" justifyContent="space-between">
  {stats.map((stat, index) => (
    <Box key={index} width="48%" marginBottom="$4">
      <StatCard {...stat} delay={index * 100} />
    </Box>
  ))}
</Box>
```

### List with Separators

```tsx
{items.map((item, index) => (
  <AnimatedCard key={index} variant="elevated" padding="$4" delay={500 + index * 100}>
    <Box>
      {/* Item content */}
    </Box>
  </AnimatedCard>
))}
```

### Empty States

```tsx
<Box alignItems="center" padding="$10">
  <Text fontSize={64}>📭</Text>
  <Text fontSize="$xl" fontWeight="$bold" color="$textDark" marginTop="$4">
    No messages yet
  </Text>
  <Text fontSize="$sm" color="$textMuted" marginTop="$2" textAlign="center">
    Start a conversation with your teachers
  </Text>
</Box>
```

## Next Steps

### Implementing New Screens

1. Copy a production screen template (e.g., `ProductionStudentDashboard.tsx`)
2. Update data and layout
3. Use existing UI components
4. Add Moti animations with staggered delays
5. Test on device for smooth 60fps animations

### Extending Components

Create new components in `components/ui/`:

```tsx
import { Box, Text } from '@gluestack-ui/themed';
import { MotiView } from 'moti';

export const CustomComponent = () => {
  return (
    <MotiView
      from={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <Box>{/* content */}</Box>
    </MotiView>
  );
};
```

## Resources

- **Gluestack UI Docs**: https://gluestack.io/
- **Moti Docs**: https://moti.fyi/
- **Lucide Icons**: https://lucide.dev/
- **React Navigation**: https://reactnavigation.org/

## Troubleshooting

### Animations not smooth?
- Check that `useNativeDriver: true` is set (Moti does this by default)
- Avoid animating layout properties (height, width)
- Use `scale` instead of `height`/`width`

### Type errors with Gluestack?
- Ensure `@gluestack-ui/themed` and `@gluestack-style/react` are installed
- Check `gluestack.config.ts` has proper type declarations

### Icons not showing?
- Verify `lucide-react-native` is installed
- Check icon names are correct (PascalCase)

---

**Built with ❤️ using Gluestack UI, Moti, and Lucide Icons**

