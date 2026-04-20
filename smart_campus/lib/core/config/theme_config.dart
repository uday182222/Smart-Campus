import 'package:flutter/material.dart';
import '../constants/app_constants.dart';

class ThemeConfig {
  // Light Theme
  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      colorScheme: _lightColorScheme,
      appBarTheme: _appBarTheme,
      cardTheme: _cardTheme,
      elevatedButtonTheme: _elevatedButtonTheme,
      outlinedButtonTheme: _outlinedButtonTheme,
      textButtonTheme: _textButtonTheme,
      inputDecorationTheme: _inputDecorationTheme,
      bottomNavigationBarTheme: _bottomNavigationBarTheme,
      floatingActionButtonTheme: _floatingActionButtonTheme,
      chipTheme: _chipTheme,
      dividerTheme: _dividerTheme,
      iconTheme: _iconTheme,
      textTheme: _textTheme,
      fontFamily: 'Roboto',
    );
  }

  // Dark Theme
  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      colorScheme: _darkColorScheme,
      appBarTheme: _appBarThemeDark,
      cardTheme: _cardThemeDark,
      elevatedButtonTheme: _elevatedButtonThemeDark,
      outlinedButtonTheme: _outlinedButtonThemeDark,
      textButtonTheme: _textButtonThemeDark,
      inputDecorationTheme: _inputDecorationThemeDark,
      bottomNavigationBarTheme: _bottomNavigationBarThemeDark,
      floatingActionButtonTheme: _floatingActionButtonThemeDark,
      chipTheme: _chipThemeDark,
      dividerTheme: _dividerThemeDark,
      iconTheme: _iconThemeDark,
      textTheme: _textThemeDark,
      fontFamily: 'Roboto',
    );
  }

  // Light Color Scheme
  static const ColorScheme _lightColorScheme = ColorScheme(
    brightness: Brightness.light,
    primary: AppConstants.primaryColor,
    onPrimary: AppConstants.textWhite,
    primaryContainer: AppConstants.primaryLightColor,
    onPrimaryContainer: AppConstants.textPrimary,
    secondary: AppConstants.accentColor,
    onSecondary: AppConstants.textWhite,
    secondaryContainer: Color(0xFFE3F2FD),
    onSecondaryContainer: AppConstants.textPrimary,
    tertiary: AppConstants.successColor,
    onTertiary: AppConstants.textWhite,
    tertiaryContainer: Color(0xFFE8F5E8),
    onTertiaryContainer: AppConstants.textPrimary,
    error: AppConstants.errorColor,
    onError: AppConstants.textWhite,
    errorContainer: Color(0xFFFFEBEE),
    onErrorContainer: AppConstants.errorColor,
    background: AppConstants.backgroundColor,
    onBackground: AppConstants.textPrimary,
    surface: AppConstants.surfaceColor,
    onSurface: AppConstants.textPrimary,
    surfaceVariant: Color(0xFFF5F5F5),
    onSurfaceVariant: AppConstants.textSecondary,
    outline: Color(0xFFE0E0E0),
    outlineVariant: Color(0xFFCCCCCC),
    shadow: Color(0xFF000000),
    scrim: Color(0xFF000000),
    inverseSurface: AppConstants.textPrimary,
    onInverseSurface: AppConstants.surfaceColor,
    inversePrimary: AppConstants.primaryLightColor,
    surfaceTint: AppConstants.primaryColor,
  );

  // Dark Color Scheme
  static const ColorScheme _darkColorScheme = ColorScheme(
    brightness: Brightness.dark,
    primary: AppConstants.primaryColor,
    onPrimary: AppConstants.textWhite,
    primaryContainer: AppConstants.primaryDarkColor,
    onPrimaryContainer: AppConstants.textWhite,
    secondary: AppConstants.accentColor,
    onSecondary: AppConstants.textWhite,
    secondaryContainer: Color(0xFF1976D2),
    onSecondaryContainer: AppConstants.textWhite,
    tertiary: AppConstants.successColor,
    onTertiary: AppConstants.textWhite,
    tertiaryContainer: Color(0xFF2E7D32),
    onTertiaryContainer: AppConstants.textWhite,
    error: AppConstants.errorColor,
    onError: AppConstants.textWhite,
    errorContainer: Color(0xFFC62828),
    onErrorContainer: AppConstants.textWhite,
    background: Color(0xFF121212),
    onBackground: AppConstants.textWhite,
    surface: Color(0xFF1E1E1E),
    onSurface: AppConstants.textWhite,
    surfaceVariant: Color(0xFF2D2D2D),
    onSurfaceVariant: Color(0xFFBDBDBD),
    outline: Color(0xFF424242),
    outlineVariant: Color(0xFF616161),
    shadow: Color(0xFF000000),
    scrim: Color(0xFF000000),
    inverseSurface: AppConstants.textWhite,
    onInverseSurface: Color(0xFF1E1E1E),
    inversePrimary: AppConstants.primaryDarkColor,
    surfaceTint: AppConstants.primaryColor,
  );

  // App Bar Theme
  static const AppBarTheme _appBarTheme = AppBarTheme(
    backgroundColor: AppConstants.primaryColor,
    foregroundColor: AppConstants.textWhite,
    elevation: 0,
    centerTitle: true,
    titleTextStyle: TextStyle(
      fontSize: 20.0,
      fontWeight: FontWeight.w600,
      color: AppConstants.textWhite,
    ),
    iconTheme: IconThemeData(
      color: AppConstants.textWhite,
      size: 24.0,
    ),
  );

  static const AppBarTheme _appBarThemeDark = AppBarTheme(
    backgroundColor: AppConstants.primaryDarkColor,
    foregroundColor: AppConstants.textWhite,
    elevation: 0,
    centerTitle: true,
    titleTextStyle: TextStyle(
      fontSize: 20.0,
      fontWeight: FontWeight.w600,
      color: AppConstants.textWhite,
    ),
    iconTheme: IconThemeData(
      color: AppConstants.textWhite,
      size: 24.0,
    ),
  );

  // Card Theme
  static CardThemeData get _cardTheme => CardThemeData(
    elevation: AppConstants.elevationSmall,
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(AppConstants.borderRadiusMedium),
    ),
    margin: const EdgeInsets.all(AppConstants.paddingSmall),
  );

  static CardThemeData get _cardThemeDark => CardThemeData(
    elevation: AppConstants.elevationSmall,
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(AppConstants.borderRadiusMedium),
    ),
    margin: const EdgeInsets.all(AppConstants.paddingSmall),
    color: const Color(0xFF2D2D2D),
  );

  // Elevated Button Theme
  static ElevatedButtonThemeData get _elevatedButtonTheme {
    return ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: AppConstants.primaryColor,
        foregroundColor: AppConstants.textWhite,
        elevation: AppConstants.elevationSmall,
        padding: const EdgeInsets.symmetric(
          horizontal: AppConstants.paddingLarge,
          vertical: AppConstants.paddingMedium,
        ),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppConstants.borderRadiusMedium),
        ),
        textStyle: const TextStyle(
          fontSize: 16.0,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }

  static ElevatedButtonThemeData get _elevatedButtonThemeDark {
    return ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: AppConstants.primaryColor,
        foregroundColor: AppConstants.textWhite,
        elevation: AppConstants.elevationSmall,
        padding: const EdgeInsets.symmetric(
          horizontal: AppConstants.paddingLarge,
          vertical: AppConstants.paddingMedium,
        ),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppConstants.borderRadiusMedium),
        ),
        textStyle: const TextStyle(
          fontSize: 16.0,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }

  // Outlined Button Theme
  static OutlinedButtonThemeData get _outlinedButtonTheme {
    return OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: AppConstants.primaryColor,
        side: const BorderSide(color: AppConstants.primaryColor),
        padding: const EdgeInsets.symmetric(
          horizontal: AppConstants.paddingLarge,
          vertical: AppConstants.paddingMedium,
        ),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppConstants.borderRadiusMedium),
        ),
        textStyle: const TextStyle(
          fontSize: 16.0,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }

  static OutlinedButtonThemeData get _outlinedButtonThemeDark {
    return OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: AppConstants.primaryColor,
        side: const BorderSide(color: AppConstants.primaryColor),
        padding: const EdgeInsets.symmetric(
          horizontal: AppConstants.paddingLarge,
          vertical: AppConstants.paddingMedium,
        ),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppConstants.borderRadiusMedium),
        ),
        textStyle: const TextStyle(
          fontSize: 16.0,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }

  // Text Button Theme
  static TextButtonThemeData get _textButtonTheme {
    return TextButtonThemeData(
      style: TextButton.styleFrom(
        foregroundColor: AppConstants.primaryColor,
        padding: const EdgeInsets.symmetric(
          horizontal: AppConstants.paddingMedium,
          vertical: AppConstants.paddingSmall,
        ),
        textStyle: const TextStyle(
          fontSize: 16.0,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }

  static TextButtonThemeData get _textButtonThemeDark {
    return TextButtonThemeData(
      style: TextButton.styleFrom(
        foregroundColor: AppConstants.primaryColor,
        padding: const EdgeInsets.symmetric(
          horizontal: AppConstants.paddingMedium,
          vertical: AppConstants.paddingSmall,
        ),
        textStyle: const TextStyle(
          fontSize: 16.0,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }

  // Input Decoration Theme
  static InputDecorationTheme get _inputDecorationTheme {
    return InputDecorationTheme(
      filled: true,
      fillColor: AppConstants.surfaceColor,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(AppConstants.borderRadiusMedium),
        borderSide: const BorderSide(color: AppConstants.textLight),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(AppConstants.borderRadiusMedium),
        borderSide: const BorderSide(color: AppConstants.textLight),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(AppConstants.borderRadiusMedium),
        borderSide: const BorderSide(color: AppConstants.primaryColor, width: 2.0),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(AppConstants.borderRadiusMedium),
        borderSide: const BorderSide(color: AppConstants.errorColor),
      ),
      focusedErrorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(AppConstants.borderRadiusMedium),
        borderSide: const BorderSide(color: AppConstants.errorColor, width: 2.0),
      ),
      contentPadding: const EdgeInsets.symmetric(
        horizontal: AppConstants.paddingMedium,
        vertical: AppConstants.paddingMedium,
      ),
      labelStyle: const TextStyle(color: AppConstants.textSecondary),
      hintStyle: const TextStyle(color: AppConstants.textLight),
    );
  }

  static InputDecorationTheme get _inputDecorationThemeDark {
    return InputDecorationTheme(
      filled: true,
      fillColor: const Color(0xFF2D2D2D),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(AppConstants.borderRadiusMedium),
        borderSide: const BorderSide(color: Color(0xFF424242)),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(AppConstants.borderRadiusMedium),
        borderSide: const BorderSide(color: Color(0xFF424242)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(AppConstants.borderRadiusMedium),
        borderSide: const BorderSide(color: AppConstants.primaryColor, width: 2.0),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(AppConstants.borderRadiusMedium),
        borderSide: const BorderSide(color: AppConstants.errorColor),
      ),
      focusedErrorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(AppConstants.borderRadiusMedium),
        borderSide: const BorderSide(color: AppConstants.errorColor, width: 2.0),
      ),
      contentPadding: const EdgeInsets.symmetric(
        horizontal: AppConstants.paddingMedium,
        vertical: AppConstants.paddingMedium,
      ),
      labelStyle: const TextStyle(color: Color(0xFFBDBDBD)),
      hintStyle: const TextStyle(color: Color(0xFF757575)),
    );
  }

  // Bottom Navigation Bar Theme
  static const BottomNavigationBarThemeData _bottomNavigationBarTheme = BottomNavigationBarThemeData(
    backgroundColor: AppConstants.surfaceColor,
    selectedItemColor: AppConstants.primaryColor,
    unselectedItemColor: AppConstants.textSecondary,
    type: BottomNavigationBarType.fixed,
    elevation: AppConstants.elevationMedium,
  );

  static const BottomNavigationBarThemeData _bottomNavigationBarThemeDark = BottomNavigationBarThemeData(
    backgroundColor: Color(0xFF1E1E1E),
    selectedItemColor: AppConstants.primaryColor,
    unselectedItemColor: Color(0xFFBDBDBD),
    type: BottomNavigationBarType.fixed,
    elevation: AppConstants.elevationMedium,
  );

  // Floating Action Button Theme
  static const FloatingActionButtonThemeData _floatingActionButtonTheme = FloatingActionButtonThemeData(
    backgroundColor: AppConstants.primaryColor,
    foregroundColor: AppConstants.textWhite,
    elevation: AppConstants.elevationMedium,
  );

  static const FloatingActionButtonThemeData _floatingActionButtonThemeDark = FloatingActionButtonThemeData(
    backgroundColor: AppConstants.primaryColor,
    foregroundColor: AppConstants.textWhite,
    elevation: AppConstants.elevationMedium,
  );

  // Chip Theme
  static ChipThemeData get _chipTheme {
    return ChipThemeData(
      backgroundColor: AppConstants.primaryLightColor,
      selectedColor: AppConstants.primaryColor,
      disabledColor: AppConstants.textLight,
      labelStyle: const TextStyle(color: AppConstants.textPrimary),
      padding: const EdgeInsets.symmetric(horizontal: AppConstants.paddingSmall),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppConstants.borderRadiusSmall),
      ),
    );
  }

  static ChipThemeData get _chipThemeDark {
    return ChipThemeData(
      backgroundColor: AppConstants.primaryDarkColor,
      selectedColor: AppConstants.primaryColor,
      disabledColor: AppConstants.textLight,
      labelStyle: const TextStyle(color: AppConstants.textWhite),
      padding: const EdgeInsets.symmetric(horizontal: AppConstants.paddingSmall),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppConstants.borderRadiusSmall),
      ),
    );
  }

  // Divider Theme
  static const DividerThemeData _dividerTheme = DividerThemeData(
    color: AppConstants.textLight,
    thickness: 1.0,
    space: 1.0,
  );

  static const DividerThemeData _dividerThemeDark = DividerThemeData(
    color: Color(0xFF424242),
    thickness: 1.0,
    space: 1.0,
  );

  // Icon Theme
  static const IconThemeData _iconTheme = IconThemeData(
    color: AppConstants.textPrimary,
    size: 24.0,
  );

  static const IconThemeData _iconThemeDark = IconThemeData(
    color: AppConstants.textWhite,
    size: 24.0,
  );

  // Text Theme
  static TextTheme get _textTheme {
    return const TextTheme(
      displayLarge: TextStyle(
        fontSize: 32.0,
        fontWeight: FontWeight.bold,
        color: AppConstants.textPrimary,
      ),
      displayMedium: TextStyle(
        fontSize: 28.0,
        fontWeight: FontWeight.bold,
        color: AppConstants.textPrimary,
      ),
      displaySmall: TextStyle(
        fontSize: 24.0,
        fontWeight: FontWeight.bold,
        color: AppConstants.textPrimary,
      ),
      headlineLarge: TextStyle(
        fontSize: 22.0,
        fontWeight: FontWeight.w600,
        color: AppConstants.textPrimary,
      ),
      headlineMedium: TextStyle(
        fontSize: 20.0,
        fontWeight: FontWeight.w600,
        color: AppConstants.textPrimary,
      ),
      headlineSmall: TextStyle(
        fontSize: 18.0,
        fontWeight: FontWeight.w600,
        color: AppConstants.textPrimary,
      ),
      titleLarge: TextStyle(
        fontSize: 16.0,
        fontWeight: FontWeight.w600,
        color: AppConstants.textPrimary,
      ),
      titleMedium: TextStyle(
        fontSize: 14.0,
        fontWeight: FontWeight.w600,
        color: AppConstants.textPrimary,
      ),
      titleSmall: TextStyle(
        fontSize: 12.0,
        fontWeight: FontWeight.w600,
        color: AppConstants.textPrimary,
      ),
      bodyLarge: TextStyle(
        fontSize: 16.0,
        color: AppConstants.textPrimary,
      ),
      bodyMedium: TextStyle(
        fontSize: 14.0,
        color: AppConstants.textPrimary,
      ),
      bodySmall: TextStyle(
        fontSize: 12.0,
        color: AppConstants.textSecondary,
      ),
      labelLarge: TextStyle(
        fontSize: 14.0,
        fontWeight: FontWeight.w600,
        color: AppConstants.textPrimary,
      ),
      labelMedium: TextStyle(
        fontSize: 12.0,
        fontWeight: FontWeight.w600,
        color: AppConstants.textPrimary,
      ),
      labelSmall: TextStyle(
        fontSize: 10.0,
        fontWeight: FontWeight.w600,
        color: AppConstants.textSecondary,
      ),
    );
  }

  static TextTheme get _textThemeDark {
    return const TextTheme(
      displayLarge: TextStyle(
        fontSize: 32.0,
        fontWeight: FontWeight.bold,
        color: AppConstants.textWhite,
      ),
      displayMedium: TextStyle(
        fontSize: 28.0,
        fontWeight: FontWeight.bold,
        color: AppConstants.textWhite,
      ),
      displaySmall: TextStyle(
        fontSize: 24.0,
        fontWeight: FontWeight.bold,
        color: AppConstants.textWhite,
      ),
      headlineLarge: TextStyle(
        fontSize: 22.0,
        fontWeight: FontWeight.w600,
        color: AppConstants.textWhite,
      ),
      headlineMedium: TextStyle(
        fontSize: 20.0,
        fontWeight: FontWeight.w600,
        color: AppConstants.textWhite,
      ),
      headlineSmall: TextStyle(
        fontSize: 18.0,
        fontWeight: FontWeight.w600,
        color: AppConstants.textWhite,
      ),
      titleLarge: TextStyle(
        fontSize: 16.0,
        fontWeight: FontWeight.w600,
        color: AppConstants.textWhite,
      ),
      titleMedium: TextStyle(
        fontSize: 14.0,
        fontWeight: FontWeight.w600,
        color: AppConstants.textWhite,
      ),
      titleSmall: TextStyle(
        fontSize: 12.0,
        fontWeight: FontWeight.w600,
        color: AppConstants.textWhite,
      ),
      bodyLarge: TextStyle(
        fontSize: 16.0,
        color: AppConstants.textWhite,
      ),
      bodyMedium: TextStyle(
        fontSize: 14.0,
        color: AppConstants.textWhite,
      ),
      bodySmall: TextStyle(
        fontSize: 12.0,
        color: Color(0xFFBDBDBD),
      ),
      labelLarge: TextStyle(
        fontSize: 14.0,
        fontWeight: FontWeight.w600,
        color: AppConstants.textWhite,
      ),
      labelMedium: TextStyle(
        fontSize: 12.0,
        fontWeight: FontWeight.w600,
        color: AppConstants.textWhite,
      ),
      labelSmall: TextStyle(
        fontSize: 10.0,
        fontWeight: FontWeight.w600,
        color: Color(0xFFBDBDBD),
      ),
    );
  }

  // Get theme based on user preference
  static ThemeData getTheme({required bool isDarkMode}) {
    return isDarkMode ? darkTheme : lightTheme;
  }

  // Get color scheme based on user preference
  static ColorScheme getColorScheme({required bool isDarkMode}) {
    return isDarkMode ? _darkColorScheme : _lightColorScheme;
  }
} 