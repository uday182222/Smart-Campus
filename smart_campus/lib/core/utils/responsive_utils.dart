import 'package:flutter/material.dart';

class ResponsiveUtils {
  // Breakpoints for different screen sizes
  static const double mobileBreakpoint = 768.0;
  static const double tabletBreakpoint = 1024.0;
  static const double desktopBreakpoint = 1200.0;
  static const double largeDesktopBreakpoint = 1440.0;

  // Screen size detection
  static bool isMobile(BuildContext context) {
    return MediaQuery.of(context).size.width < mobileBreakpoint;
  }

  static bool isTablet(BuildContext context) {
    final width = MediaQuery.of(context).size.width;
    return width >= mobileBreakpoint && width < tabletBreakpoint;
  }

  static bool isDesktop(BuildContext context) {
    final width = MediaQuery.of(context).size.width;
    return width >= tabletBreakpoint && width < desktopBreakpoint;
  }

  static bool isLargeDesktop(BuildContext context) {
    return MediaQuery.of(context).size.width >= largeDesktopBreakpoint;
  }

  // Responsive padding
  static EdgeInsets getResponsivePadding(BuildContext context) {
    if (isMobile(context)) {
      return const EdgeInsets.all(12.0);
    } else if (isTablet(context)) {
      return const EdgeInsets.all(16.0);
    } else if (isDesktop(context)) {
      return const EdgeInsets.all(24.0);
    } else {
      return const EdgeInsets.all(32.0);
    }
  }

  static EdgeInsets getResponsiveHorizontalPadding(BuildContext context) {
    if (isMobile(context)) {
      return const EdgeInsets.symmetric(horizontal: 12.0);
    } else if (isTablet(context)) {
      return const EdgeInsets.symmetric(horizontal: 16.0);
    } else if (isDesktop(context)) {
      return const EdgeInsets.symmetric(horizontal: 24.0);
    } else {
      return const EdgeInsets.symmetric(horizontal: 32.0);
    }
  }

  // Responsive spacing
  static double getResponsiveSpacing(BuildContext context) {
    if (isMobile(context)) {
      return 8.0;
    } else if (isTablet(context)) {
      return 12.0;
    } else if (isDesktop(context)) {
      return 16.0;
    } else {
      return 20.0;
    }
  }

  // Responsive font sizes
  static double getResponsiveFontSize(BuildContext context, {
    double? mobile,
    double? tablet,
    double? desktop,
    double? largeDesktop,
  }) {
    if (isMobile(context)) {
      return mobile ?? 14.0;
    } else if (isTablet(context)) {
      return tablet ?? 16.0;
    } else if (isDesktop(context)) {
      return desktop ?? 18.0;
    } else {
      return largeDesktop ?? 20.0;
    }
  }

  // Responsive icon sizes
  static double getResponsiveIconSize(BuildContext context, {
    double? mobile,
    double? tablet,
    double? desktop,
    double? largeDesktop,
  }) {
    if (isMobile(context)) {
      return mobile ?? 20.0;
    } else if (isTablet(context)) {
      return tablet ?? 24.0;
    } else if (isDesktop(context)) {
      return desktop ?? 28.0;
    } else {
      return largeDesktop ?? 32.0;
    }
  }

  // Responsive grid columns
  static int getResponsiveGridColumns(BuildContext context) {
    if (isMobile(context)) {
      return 1;
    } else if (isTablet(context)) {
      return 2;
    } else if (isDesktop(context)) {
      return 3;
    } else {
      return 4;
    }
  }

  // Responsive card aspect ratio
  static double getResponsiveCardAspectRatio(BuildContext context) {
    if (isMobile(context)) {
      return 1.2;
    } else if (isTablet(context)) {
      return 1.4;
    } else if (isDesktop(context)) {
      return 1.5;
    } else {
      return 1.6;
    }
  }

  // Responsive sidebar width
  static double getResponsiveSidebarWidth(BuildContext context, bool isCollapsed) {
    if (isCollapsed) {
      return 70.0;
    }
    
    if (isMobile(context)) {
      return 250.0;
    } else if (isTablet(context)) {
      return 200.0;
    } else if (isDesktop(context)) {
      return 250.0;
    } else {
      return 280.0;
    }
  }

  // Responsive table columns
  static List<DataColumn> getResponsiveTableColumns(BuildContext context, List<DataColumn> columns) {
    if (isMobile(context)) {
      // Show only essential columns on mobile
      return columns.take(2).toList();
    } else if (isTablet(context)) {
      // Show 3-4 columns on tablet
      return columns.take(3).toList();
    } else {
      // Show all columns on desktop
      return columns;
    }
  }

  // Responsive button size
  static ButtonStyle getResponsiveButtonStyle(BuildContext context) {
    return ElevatedButton.styleFrom(
      padding: EdgeInsets.symmetric(
        horizontal: isMobile(context) ? 12.0 : 16.0,
        vertical: isMobile(context) ? 8.0 : 12.0,
      ),
      textStyle: TextStyle(
        fontSize: getResponsiveFontSize(context, mobile: 12.0, tablet: 14.0, desktop: 16.0),
      ),
    );
  }

  // Responsive input decoration
  static InputDecoration getResponsiveInputDecoration(BuildContext context, String label) {
    return InputDecoration(
      labelText: label,
      contentPadding: EdgeInsets.symmetric(
        horizontal: isMobile(context) ? 12.0 : 16.0,
        vertical: isMobile(context) ? 8.0 : 12.0,
      ),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(isMobile(context) ? 8.0 : 12.0),
      ),
    );
  }

  // Responsive card decoration
  static BoxDecoration getResponsiveCardDecoration(BuildContext context) {
    return BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.circular(isMobile(context) ? 8.0 : 12.0),
      boxShadow: [
        BoxShadow(
          color: Colors.grey.withValues(alpha: 0.1),
          blurRadius: isMobile(context) ? 4.0 : 8.0,
          offset: const Offset(0, 2),
        ),
      ],
    );
  }

  // Responsive list tile
  static ListTile getResponsiveListTile(BuildContext context, {
    required Widget leading,
    required Widget title,
    Widget? subtitle,
    Widget? trailing,
    VoidCallback? onTap,
  }) {
    return ListTile(
      leading: leading,
      title: title,
      subtitle: subtitle,
      trailing: trailing,
      onTap: onTap,
      contentPadding: EdgeInsets.symmetric(
        horizontal: isMobile(context) ? 12.0 : 16.0,
        vertical: isMobile(context) ? 4.0 : 8.0,
      ),
      dense: isMobile(context),
    );
  }

  // Responsive divider
  static Widget getResponsiveDivider(BuildContext context) {
    return Divider(
      height: isMobile(context) ? 8.0 : 16.0,
      thickness: isMobile(context) ? 0.5 : 1.0,
    );
  }

  // Responsive spacing widget
  static Widget getResponsiveSpacingWidget(BuildContext context) {
    return SizedBox(height: getResponsiveSpacing(context));
  }

  // Responsive horizontal spacing widget
  static Widget getResponsiveHorizontalSpacingWidget(BuildContext context) {
    return SizedBox(width: getResponsiveSpacing(context));
  }

  // Responsive text style
  static TextStyle getResponsiveTextStyle(BuildContext context, {
    double? fontSize,
    FontWeight? fontWeight,
    Color? color,
    double? height,
  }) {
    return TextStyle(
      fontSize: fontSize ?? getResponsiveFontSize(context),
      fontWeight: fontWeight ?? FontWeight.normal,
      color: color,
      height: height,
    );
  }

  // Responsive heading style
  static TextStyle getResponsiveHeadingStyle(BuildContext context, {
    double? fontSize,
    FontWeight? fontWeight,
    Color? color,
  }) {
    return getResponsiveTextStyle(
      context,
      fontSize: fontSize ?? getResponsiveFontSize(
        context,
        mobile: 18.0,
        tablet: 20.0,
        desktop: 24.0,
        largeDesktop: 28.0,
      ),
      fontWeight: fontWeight ?? FontWeight.bold,
      color: color,
    );
  }

  // Responsive subheading style
  static TextStyle getResponsiveSubheadingStyle(BuildContext context, {
    double? fontSize,
    FontWeight? fontWeight,
    Color? color,
  }) {
    return getResponsiveTextStyle(
      context,
      fontSize: fontSize ?? getResponsiveFontSize(
        context,
        mobile: 16.0,
        tablet: 18.0,
        desktop: 20.0,
        largeDesktop: 22.0,
      ),
      fontWeight: fontWeight ?? FontWeight.w600,
      color: color,
    );
  }

  // Responsive body style
  static TextStyle getResponsiveBodyStyle(BuildContext context, {
    double? fontSize,
    FontWeight? fontWeight,
    Color? color,
  }) {
    return getResponsiveTextStyle(
      context,
      fontSize: fontSize ?? getResponsiveFontSize(
        context,
        mobile: 14.0,
        tablet: 16.0,
        desktop: 18.0,
        largeDesktop: 20.0,
      ),
      fontWeight: fontWeight ?? FontWeight.normal,
      color: color,
    );
  }

  // Responsive caption style
  static TextStyle getResponsiveCaptionStyle(BuildContext context, {
    double? fontSize,
    FontWeight? fontWeight,
    Color? color,
  }) {
    return getResponsiveTextStyle(
      context,
      fontSize: fontSize ?? getResponsiveFontSize(
        context,
        mobile: 12.0,
        tablet: 14.0,
        desktop: 16.0,
        largeDesktop: 18.0,
      ),
      fontWeight: fontWeight ?? FontWeight.normal,
      color: color,
    );
  }
} 