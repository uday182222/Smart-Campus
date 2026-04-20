import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../theme/modern_theme.dart';

/// Modern text input field with glassmorphism effect
class ModernTextInput extends StatefulWidget {
  final String? label;
  final String? hint;
  final String? errorText;
  final TextEditingController? controller;
  final TextInputType? keyboardType;
  final bool obscureText;
  final bool enabled;
  final int? maxLines;
  final int? maxLength;
  final Widget? prefixIcon;
  final Widget? suffixIcon;
  final String? Function(String?)? validator;
  final void Function(String)? onChanged;
  final void Function(String)? onSubmitted;
  final List<TextInputFormatter>? inputFormatters;
  final TextCapitalization textCapitalization;
  final bool autofocus;
  final FocusNode? focusNode;

  const ModernTextInput({
    super.key,
    this.label,
    this.hint,
    this.errorText,
    this.controller,
    this.keyboardType,
    this.obscureText = false,
    this.enabled = true,
    this.maxLines = 1,
    this.maxLength,
    this.prefixIcon,
    this.suffixIcon,
    this.validator,
    this.onChanged,
    this.onSubmitted,
    this.inputFormatters,
    this.textCapitalization = TextCapitalization.none,
    this.autofocus = false,
    this.focusNode,
  });

  @override
  State<ModernTextInput> createState() => _ModernTextInputState();
}

class _ModernTextInputState extends State<ModernTextInput>
    with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _focusAnimation;
  late FocusNode _focusNode;
  bool _isFocused = false;

  @override
  void initState() {
    super.initState();
    _focusNode = widget.focusNode ?? FocusNode();
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 200),
      vsync: this,
    );
    _focusAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeInOut,
    ));

    _focusNode.addListener(_onFocusChange);
  }

  @override
  void dispose() {
    if (widget.focusNode == null) {
      _focusNode.dispose();
    }
    _animationController.dispose();
    super.dispose();
  }

  void _onFocusChange() {
    setState(() {
      _isFocused = _focusNode.hasFocus;
    });
    if (_isFocused) {
      _animationController.forward();
    } else {
      _animationController.reverse();
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textColor = isDark ? Colors.white : Colors.black87;
    final hintColor = isDark ? Colors.white60 : Colors.black54;
    final borderColor = isDark ? Colors.white30 : Colors.black26;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (widget.label != null) ...[
          Text(
            widget.label!,
            style: TextStyle(
              color: textColor,
              fontWeight: FontWeight.w500,
              fontSize: 14,
              fontFamily: ModernTheme.fontFamily,
            ),
          ),
          const SizedBox(height: ModernTheme.spacingSM),
        ],
        AnimatedBuilder(
          animation: _focusAnimation,
          builder: (context, child) {
            return Container(
              decoration: BoxDecoration(
                color: isDark ? ModernTheme.glassBlack : ModernTheme.glassWhite,
                borderRadius: BorderRadius.circular(ModernTheme.radiusMD),
                border: Border.all(
                  color: _isFocused
                      ? ModernTheme.primaryColor
                      : borderColor,
                  width: _isFocused ? 2 : 1,
                ),
                boxShadow: _isFocused ? ModernTheme.glassShadow : null,
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(ModernTheme.radiusMD),
                child: BackdropFilter(
                  filter: ImageFilter.blur(sigmaX: 10.0, sigmaY: 10.0),
                  child: TextFormField(
                    controller: widget.controller,
                    focusNode: _focusNode,
                    keyboardType: widget.keyboardType,
                    obscureText: widget.obscureText,
                    enabled: widget.enabled,
                    maxLines: widget.maxLines,
                    maxLength: widget.maxLength,
                    validator: widget.validator,
                    onChanged: widget.onChanged,
                    onFieldSubmitted: widget.onSubmitted,
                    inputFormatters: widget.inputFormatters,
                    textCapitalization: widget.textCapitalization,
                    autofocus: widget.autofocus,
                    style: TextStyle(
                      color: textColor,
                      fontSize: 16,
                      fontFamily: ModernTheme.fontFamily,
                    ),
                    decoration: InputDecoration(
                      hintText: widget.hint,
                      hintStyle: TextStyle(
                        color: hintColor,
                        fontSize: 16,
                        fontFamily: ModernTheme.fontFamily,
                      ),
                      prefixIcon: widget.prefixIcon,
                      suffixIcon: widget.suffixIcon,
                      border: InputBorder.none,
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: ModernTheme.spacingMD,
                        vertical: ModernTheme.spacingMD,
                      ),
                      counterText: '',
                    ),
                  ),
                ),
              ),
            );
          },
        ),
        if (widget.errorText != null) ...[
          const SizedBox(height: ModernTheme.spacingXS),
          Text(
            widget.errorText!,
            style: TextStyle(
              color: ModernTheme.errorColor,
              fontSize: 12,
              fontFamily: ModernTheme.fontFamily,
            ),
          ),
        ],
      ],
    );
  }
}

/// Modern search input with glassmorphism effect
class ModernSearchInput extends StatefulWidget {
  final String? hint;
  final TextEditingController? controller;
  final void Function(String)? onChanged;
  final void Function(String)? onSubmitted;
  final VoidCallback? onClear;
  final bool autofocus;

  const ModernSearchInput({
    super.key,
    this.hint,
    this.controller,
    this.onChanged,
    this.onSubmitted,
    this.onClear,
    this.autofocus = false,
  });

  @override
  State<ModernSearchInput> createState() => _ModernSearchInputState();
}

class _ModernSearchInputState extends State<ModernSearchInput> {
  late TextEditingController _controller;
  bool _hasText = false;

  @override
  void initState() {
    super.initState();
    _controller = widget.controller ?? TextEditingController();
    _controller.addListener(_onTextChanged);
  }

  @override
  void dispose() {
    if (widget.controller == null) {
      _controller.dispose();
    }
    super.dispose();
  }

  void _onTextChanged() {
    setState(() {
      _hasText = _controller.text.isNotEmpty;
    });
  }

  void _clearText() {
    _controller.clear();
    widget.onClear?.call();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textColor = isDark ? Colors.white : Colors.black87;
    final hintColor = isDark ? Colors.white60 : Colors.black54;

    return Container(
      decoration: BoxDecoration(
        color: isDark ? ModernTheme.glassBlack : ModernTheme.glassWhite,
        borderRadius: BorderRadius.circular(ModernTheme.radiusFull),
        border: Border.all(
          color: isDark ? Colors.white.withOpacity(0.2) : Colors.black.withOpacity(0.2),
          width: 1,
        ),
        boxShadow: ModernTheme.shadowSM,
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(ModernTheme.radiusFull),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 10.0, sigmaY: 10.0),
          child: TextField(
            controller: _controller,
            onChanged: widget.onChanged,
            onSubmitted: widget.onSubmitted,
            autofocus: widget.autofocus,
            style: TextStyle(
              color: textColor,
              fontSize: 16,
              fontFamily: ModernTheme.fontFamily,
            ),
            decoration: InputDecoration(
              hintText: widget.hint ?? 'Search...',
              hintStyle: TextStyle(
                color: hintColor,
                fontSize: 16,
                fontFamily: ModernTheme.fontFamily,
              ),
              prefixIcon: Icon(
                Icons.search,
                color: hintColor,
                size: 20,
              ),
              suffixIcon: _hasText
                  ? IconButton(
                      icon: Icon(
                        Icons.clear,
                        color: hintColor,
                        size: 20,
                      ),
                      onPressed: _clearText,
                    )
                  : null,
              border: InputBorder.none,
              contentPadding: const EdgeInsets.symmetric(
                horizontal: ModernTheme.spacingMD,
                vertical: ModernTheme.spacingMD,
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// Modern dropdown with glassmorphism effect
class ModernDropdown<T> extends StatefulWidget {
  final String? label;
  final String? hint;
  final T? value;
  final List<DropdownMenuItem<T>> items;
  final void Function(T?)? onChanged;
  final String? Function(T?)? validator;
  final bool enabled;

  const ModernDropdown({
    super.key,
    this.label,
    this.hint,
    this.value,
    required this.items,
    this.onChanged,
    this.validator,
    this.enabled = true,
  });

  @override
  State<ModernDropdown<T>> createState() => _ModernDropdownState<T>();
}

class _ModernDropdownState<T> extends State<ModernDropdown<T>> {
  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textColor = isDark ? Colors.white : Colors.black87;
    final hintColor = isDark ? Colors.white60 : Colors.black54;
    final borderColor = isDark ? Colors.white30 : Colors.black26;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (widget.label != null) ...[
          Text(
            widget.label!,
            style: TextStyle(
              color: textColor,
              fontWeight: FontWeight.w500,
              fontSize: 14,
              fontFamily: ModernTheme.fontFamily,
            ),
          ),
          const SizedBox(height: ModernTheme.spacingSM),
        ],
        Container(
          decoration: BoxDecoration(
            color: isDark ? ModernTheme.glassBlack : ModernTheme.glassWhite,
            borderRadius: BorderRadius.circular(ModernTheme.radiusMD),
            border: Border.all(
              color: borderColor,
              width: 1,
            ),
            boxShadow: ModernTheme.shadowSM,
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(ModernTheme.radiusMD),
            child: BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 10.0, sigmaY: 10.0),
              child: DropdownButtonFormField<T>(
                value: widget.value,
                items: widget.items,
                onChanged: widget.enabled ? widget.onChanged : null,
                validator: widget.validator,
                style: TextStyle(
                  color: textColor,
                  fontSize: 16,
                  fontFamily: ModernTheme.fontFamily,
                ),
                decoration: InputDecoration(
                  hintText: widget.hint,
                  hintStyle: TextStyle(
                    color: hintColor,
                    fontSize: 16,
                    fontFamily: ModernTheme.fontFamily,
                  ),
                  border: InputBorder.none,
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: ModernTheme.spacingMD,
                    vertical: ModernTheme.spacingMD,
                  ),
                ),
                dropdownColor: isDark ? ModernTheme.darkSurface : Colors.white,
                icon: Icon(
                  Icons.keyboard_arrow_down,
                  color: hintColor,
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}
