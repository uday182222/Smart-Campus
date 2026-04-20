import 'dart:ui';
import 'package:flutter/material.dart';
import '../../theme/modern_theme.dart';

/// Modern glassmorphism card widget with blur effects and transparency
class GlassmorphismCard extends StatelessWidget {
  final Widget child;
  final double? width;
  final double? height;
  final EdgeInsetsGeometry? padding;
  final EdgeInsetsGeometry? margin;
  final double borderRadius;
  final Color? backgroundColor;
  final List<BoxShadow>? boxShadow;
  final Border? border;
  final VoidCallback? onTap;
  final bool enableBlur;

  const GlassmorphismCard({
    super.key,
    required this.child,
    this.width,
    this.height,
    this.padding,
    this.margin,
    this.borderRadius = ModernTheme.radiusLG,
    this.backgroundColor,
    this.boxShadow,
    this.border,
    this.onTap,
    this.enableBlur = true,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final defaultBackgroundColor = backgroundColor ?? 
        (isDark ? ModernTheme.glassBlack : ModernTheme.glassWhite);
    final defaultBorder = border ?? Border.all(
      color: isDark 
          ? Colors.white.withOpacity(0.1) 
          : Colors.black.withOpacity(0.1),
      width: 1,
    );
    final defaultShadow = boxShadow ?? ModernTheme.glassShadow;

    Widget cardContent = Container(
      width: width,
      height: height,
      margin: margin,
      decoration: BoxDecoration(
        color: defaultBackgroundColor,
        borderRadius: BorderRadius.circular(borderRadius),
        border: defaultBorder,
        boxShadow: defaultShadow,
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(borderRadius),
        child: enableBlur
            ? BackdropFilter(
                filter: ImageFilter.blur(sigmaX: 10.0, sigmaY: 10.0),
                child: Padding(
                  padding: padding ?? const EdgeInsets.all(ModernTheme.spacingMD),
                  child: child,
                ),
              )
            : Padding(
                padding: padding ?? const EdgeInsets.all(ModernTheme.spacingMD),
                child: child,
              ),
      ),
    );

    if (onTap != null) {
      return GestureDetector(
        onTap: onTap,
        child: cardContent,
      );
    }

    return cardContent;
  }
}

/// Glassmorphism container with gradient background
class GlassmorphismContainer extends StatelessWidget {
  final Widget child;
  final double? width;
  final double? height;
  final EdgeInsetsGeometry? padding;
  final EdgeInsetsGeometry? margin;
  final double borderRadius;
  final Gradient? gradient;
  final List<BoxShadow>? boxShadow;
  final Border? border;
  final VoidCallback? onTap;

  const GlassmorphismContainer({
    super.key,
    required this.child,
    this.width,
    this.height,
    this.padding,
    this.margin,
    this.borderRadius = ModernTheme.radiusLG,
    this.gradient,
    this.boxShadow,
    this.border,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final defaultGradient = gradient ?? 
        (isDark ? ModernTheme.glassGradient : ModernTheme.glassGradient);
    final defaultBorder = border ?? Border.all(
      color: isDark 
          ? Colors.white.withOpacity(0.2) 
          : Colors.black.withOpacity(0.1),
      width: 1,
    );
    final defaultShadow = boxShadow ?? ModernTheme.glassShadow;

    Widget containerContent = Container(
      width: width,
      height: height,
      margin: margin,
      decoration: BoxDecoration(
        gradient: defaultGradient,
        borderRadius: BorderRadius.circular(borderRadius),
        border: defaultBorder,
        boxShadow: defaultShadow,
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(borderRadius),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 10.0, sigmaY: 10.0),
          child: Padding(
            padding: padding ?? const EdgeInsets.all(ModernTheme.spacingMD),
            child: child,
          ),
        ),
      ),
    );

    if (onTap != null) {
      return GestureDetector(
        onTap: onTap,
        child: containerContent,
      );
    }

    return containerContent;
  }
}

/// Glassmorphism button with modern styling
class GlassmorphismButton extends StatelessWidget {
  final Widget child;
  final VoidCallback? onPressed;
  final EdgeInsetsGeometry? padding;
  final double borderRadius;
  final Color? backgroundColor;
  final List<BoxShadow>? boxShadow;
  final Border? border;
  final bool isLoading;

  const GlassmorphismButton({
    super.key,
    required this.child,
    this.onPressed,
    this.padding,
    this.borderRadius = ModernTheme.radiusMD,
    this.backgroundColor,
    this.boxShadow,
    this.border,
    this.isLoading = false,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final defaultBackgroundColor = backgroundColor ?? 
        (isDark ? ModernTheme.glassBlack : ModernTheme.glassWhite);
    final defaultBorder = border ?? Border.all(
      color: isDark 
          ? Colors.white.withOpacity(0.2) 
          : Colors.black.withOpacity(0.1),
      width: 1,
    );
    final defaultShadow = boxShadow ?? ModernTheme.glassShadow;

    return GestureDetector(
      onTap: isLoading ? null : onPressed,
      child: Container(
        padding: padding ?? const EdgeInsets.symmetric(
          horizontal: ModernTheme.spacingLG,
          vertical: ModernTheme.spacingMD,
        ),
        decoration: BoxDecoration(
          color: defaultBackgroundColor,
          borderRadius: BorderRadius.circular(borderRadius),
          border: defaultBorder,
          boxShadow: defaultShadow,
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(borderRadius),
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 10.0, sigmaY: 10.0),
            child: isLoading
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor: AlwaysStoppedAnimation<Color>(ModernTheme.primaryColor),
                    ),
                  )
                : child,
          ),
        ),
      ),
    );
  }
}

/// Glassmorphism app bar with blur effect
class GlassmorphismAppBar extends StatelessWidget implements PreferredSizeWidget {
  final String? title;
  final Widget? titleWidget;
  final List<Widget>? actions;
  final Widget? leading;
  final bool centerTitle;
  final double elevation;
  final Color? backgroundColor;
  final double? toolbarHeight;

  const GlassmorphismAppBar({
    super.key,
    this.title,
    this.titleWidget,
    this.actions,
    this.leading,
    this.centerTitle = true,
    this.elevation = 0,
    this.backgroundColor,
    this.toolbarHeight,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final defaultBackgroundColor = backgroundColor ?? 
        (isDark ? ModernTheme.glassBlack : ModernTheme.glassWhite);

    return AppBar(
      title: titleWidget ?? (title != null ? Text(title!) : null),
      actions: actions,
      leading: leading,
      centerTitle: centerTitle,
      elevation: elevation,
      backgroundColor: Colors.transparent,
      flexibleSpace: ClipRRect(
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 10.0, sigmaY: 10.0),
          child: Container(
            decoration: BoxDecoration(
              color: defaultBackgroundColor,
              border: Border(
                bottom: BorderSide(
                  color: isDark 
                      ? Colors.white.withOpacity(0.1) 
                      : Colors.black.withOpacity(0.1),
                  width: 1,
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  @override
  Size get preferredSize => Size.fromHeight(toolbarHeight ?? kToolbarHeight);
}
