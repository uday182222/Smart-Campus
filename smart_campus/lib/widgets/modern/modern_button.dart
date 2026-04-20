import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';

class ModernButton extends StatelessWidget {
  final String text;
  final VoidCallback? onPressed;
  final Color? backgroundColor;
  final Color? textColor;
  final double? width;
  final double? height;
  final EdgeInsets? padding;
  final BorderRadius? borderRadius;
  final IconData? icon;
  final bool isLoading;
  final bool isOutlined;
  final ButtonSize size;

  const ModernButton({
    super.key,
    required this.text,
    this.onPressed,
    this.backgroundColor,
    this.textColor,
    this.width,
    this.height,
    this.padding,
    this.borderRadius,
    this.icon,
    this.isLoading = false,
    this.isOutlined = false,
    this.size = ButtonSize.medium,
  });

  @override
  Widget build(BuildContext context) {
    final buttonHeight = _getButtonHeight();
    final buttonPadding = _getButtonPadding();
    final textStyle = _getTextStyle();

    return SizedBox(
      width: width,
      height: height ?? buttonHeight,
      child: isOutlined
          ? OutlinedButton(
              onPressed: isLoading ? null : onPressed,
              style: OutlinedButton.styleFrom(
                padding: padding ?? buttonPadding,
                shape: RoundedRectangleBorder(
                  borderRadius: borderRadius ?? BorderRadius.circular(AppTheme.radiusMD),
                ),
                side: BorderSide(
                  color: backgroundColor ?? AppTheme.primaryColor,
                  width: 2,
                ),
              ),
              child: _buildButtonContent(textStyle),
            )
          : ElevatedButton(
              onPressed: isLoading ? null : onPressed,
              style: ElevatedButton.styleFrom(
                backgroundColor: backgroundColor ?? AppTheme.primaryColor,
                foregroundColor: textColor ?? AppTheme.textLight,
                padding: padding ?? buttonPadding,
                shape: RoundedRectangleBorder(
                  borderRadius: borderRadius ?? BorderRadius.circular(AppTheme.radiusMD),
                ),
                elevation: AppTheme.elevationSM,
                shadowColor: AppTheme.primaryColor.withValues(alpha: 0.3),
              ),
              child: _buildButtonContent(textStyle),
            ),
    );
  }

  Widget _buildButtonContent(TextStyle textStyle) {
    if (isLoading) {
      return SizedBox(
        width: 20,
        height: 20,
        child: CircularProgressIndicator(
          strokeWidth: 2,
          valueColor: AlwaysStoppedAnimation<Color>(
            textColor ?? AppTheme.textLight,
          ),
        ),
      );
    }

    if (icon != null) {
      return Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: _getIconSize()),
          const SizedBox(width: AppTheme.spacingSM),
          Text(text, style: textStyle),
        ],
      );
    }

    return Text(text, style: textStyle);
  }

  double _getButtonHeight() {
    switch (size) {
      case ButtonSize.small:
        return 32;
      case ButtonSize.medium:
        return 48;
      case ButtonSize.large:
        return 56;
    }
  }

  EdgeInsets _getButtonPadding() {
    switch (size) {
      case ButtonSize.small:
        return const EdgeInsets.symmetric(
          horizontal: AppTheme.spacingMD,
          vertical: AppTheme.spacingSM,
        );
      case ButtonSize.medium:
        return const EdgeInsets.symmetric(
          horizontal: AppTheme.spacingLG,
          vertical: AppTheme.spacingMD,
        );
      case ButtonSize.large:
        return const EdgeInsets.symmetric(
          horizontal: AppTheme.spacingXL,
          vertical: AppTheme.spacingLG,
        );
    }
  }

  TextStyle _getTextStyle() {
    switch (size) {
      case ButtonSize.small:
        return AppTheme.buttonSmall;
      case ButtonSize.medium:
        return AppTheme.buttonMedium;
      case ButtonSize.large:
        return AppTheme.buttonLarge;
    }
  }

  double _getIconSize() {
    switch (size) {
      case ButtonSize.small:
        return 16;
      case ButtonSize.medium:
        return 20;
      case ButtonSize.large:
        return 24;
    }
  }
}

enum ButtonSize { small, medium, large }

class ModernIconButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback? onPressed;
  final Color? backgroundColor;
  final Color? iconColor;
  final double? size;
  final EdgeInsets? padding;
  final String? tooltip;
  final bool isSelected;

  const ModernIconButton({
    super.key,
    required this.icon,
    this.onPressed,
    this.backgroundColor,
    this.iconColor,
    this.size,
    this.padding,
    this.tooltip,
    this.isSelected = false,
  });

  @override
  Widget build(BuildContext context) {
    Widget button = Container(
      padding: padding ?? const EdgeInsets.all(AppTheme.spacingMD),
      decoration: BoxDecoration(
        color: isSelected 
            ? AppTheme.primaryColor.withValues(alpha: 0.1)
            : backgroundColor ?? AppTheme.surfaceLight,
        borderRadius: BorderRadius.circular(AppTheme.radiusMD),
        border: isSelected 
            ? Border.all(color: AppTheme.primaryColor, width: 2)
            : null,
      ),
      child: Icon(
        icon,
        color: isSelected 
            ? AppTheme.primaryColor
            : iconColor ?? AppTheme.textSecondary,
        size: size ?? 24,
      ),
    );

    if (onPressed != null) {
      button = InkWell(
        onTap: onPressed,
        borderRadius: BorderRadius.circular(AppTheme.radiusMD),
        child: button,
      );
    }

    if (tooltip != null) {
      button = Tooltip(
        message: tooltip!,
        child: button,
      );
    }

    return button;
  }
}

class ModernFloatingActionButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback? onPressed;
  final Color? backgroundColor;
  final Color? iconColor;
  final String? tooltip;
  final FloatingActionButtonSize size;

  const ModernFloatingActionButton({
    super.key,
    required this.icon,
    this.onPressed,
    this.backgroundColor,
    this.iconColor,
    this.tooltip,
    this.size = FloatingActionButtonSize.medium,
  });

  @override
  Widget build(BuildContext context) {
    final fabSize = _getFabSize();
    final iconSize = _getIconSize();

    Widget fab = Container(
      width: fabSize,
      height: fabSize,
      decoration: BoxDecoration(
        color: backgroundColor ?? AppTheme.primaryColor,
        borderRadius: BorderRadius.circular(AppTheme.radiusLG),
        boxShadow: [AppShadows.large],
      ),
      child: Icon(
        icon,
        color: iconColor ?? AppTheme.textLight,
        size: iconSize,
      ),
    );

    if (onPressed != null) {
      fab = InkWell(
        onTap: onPressed,
        borderRadius: BorderRadius.circular(AppTheme.radiusLG),
        child: fab,
      );
    }

    if (tooltip != null) {
      fab = Tooltip(
        message: tooltip!,
        child: fab,
      );
    }

    return fab;
  }

  double _getFabSize() {
    switch (size) {
      case FloatingActionButtonSize.small:
        return 48;
      case FloatingActionButtonSize.medium:
        return 56;
      case FloatingActionButtonSize.large:
        return 64;
    }
  }

  double _getIconSize() {
    switch (size) {
      case FloatingActionButtonSize.small:
        return 20;
      case FloatingActionButtonSize.medium:
        return 24;
      case FloatingActionButtonSize.large:
        return 28;
    }
  }
}

enum FloatingActionButtonSize { small, medium, large }
