import 'package:flutter/material.dart';

class AppColorPalette {
  final bool isDark;
  final Color background;
  final Color surface;
  final Color surfaceLight;
  final Color primary;
  final Color primaryDark;
  final Color secondary;
  final Color accentGreen;
  final Color accentRed;
  final Color textPrimary;
  final Color textSecondary;
  final Color textMuted;
  final Color border;
  final Color divider;
  final LinearGradient cardGradient;
  final LinearGradient liveGradient;
  final LinearGradient goldGradient;
  final LinearGradient buttonGradient;
  final List<BoxShadow> cardShadow;

  const AppColorPalette({
    required this.isDark,
    required this.background,
    required this.surface,
    required this.surfaceLight,
    required this.primary,
    required this.primaryDark,
    required this.secondary,
    required this.accentGreen,
    required this.accentRed,
    required this.textPrimary,
    required this.textSecondary,
    required this.textMuted,
    required this.border,
    required this.divider,
    required this.cardGradient,
    required this.liveGradient,
    required this.goldGradient,
    required this.buttonGradient,
    required this.cardShadow,
  });
}

class AppColors {
  // Static references (defaults to dark for backward compatibility)
  static const Color background = Color(0xFF0F172A);
  static const Color surface = Color(0xFF1E293B);
  static const Color surfaceLight = Color(0xFF334155);
  static const Color primary = Color(0xFF38BDF8);
  static const Color primaryDark = Color(0xFF0284C7);
  static const Color secondary = Color(0xFFF59E0B);
  static const Color accentGreen = Color(0xFF10B981);
  static const Color accentRed = Color(0xFFEF4444);
  static const Color textPrimary = Color(0xFFF8FAFC);
  static const Color textSecondary = Color(0xFF94A3B8);
  static const Color textMuted = Color(0xFF64748B);
  static const Color border = Color(0xFF334155);
  static const Color divider = Color(0xFF1E293B);

  static const LinearGradient cardGradient = LinearGradient(
    colors: [Color(0xFF1E293B), Color(0xFF0F172A)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient liveGradient = LinearGradient(
    colors: [Color(0xFFEF4444), Color(0xFFDC2626)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient goldGradient = LinearGradient(
    colors: [Color(0xFFF59E0B), Color(0xFFD97706)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient buttonGradient = LinearGradient(
    colors: [Color(0xFF0284C7), Color(0xFF2563EB)],
    begin: Alignment.centerLeft,
    end: Alignment.centerRight,
  );

  // Concrete dark palette
  static const AppColorPalette darkPalette = AppColorPalette(
    isDark: true,
    background: Color(0xFF0F172A),
    surface: Color(0xFF1E293B),
    surfaceLight: Color(0xFF334155),
    primary: Color(0xFF38BDF8),
    primaryDark: Color(0xFF0284C7),
    secondary: Color(0xFFF59E0B),
    accentGreen: Color(0xFF10B981),
    accentRed: Color(0xFFEF4444),
    textPrimary: Color(0xFFF8FAFC),
    textSecondary: Color(0xFF94A3B8),
    textMuted: Color(0xFF64748B),
    border: Color(0xFF334155),
    divider: Color(0xFF1E293B),
    cardGradient: LinearGradient(
      colors: [Color(0xFF1E293B), Color(0xFF0F172A)],
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
    ),
    liveGradient: LinearGradient(
      colors: [Color(0xFFEF4444), Color(0xFFDC2626)],
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
    ),
    goldGradient: LinearGradient(
      colors: [Color(0xFFF59E0B), Color(0xFFD97706)],
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
    ),
    buttonGradient: LinearGradient(
      colors: [Color(0xFF0284C7), Color(0xFF2563EB)],
      begin: Alignment.centerLeft,
      end: Alignment.centerRight,
    ),
    cardShadow: [
      BoxShadow(
        color: Color(0x55000000),
        blurRadius: 14,
        offset: Offset(0, 4),
      ),
    ],
  );

  // Concrete light palette
  static const AppColorPalette lightPalette = AppColorPalette(
    isDark: false,
    background: Color(0xFFF8FAFC),
    surface: Color(0xFFFFFFFF),
    surfaceLight: Color(0xFFF1F5F9),
    primary: Color(0xFF0284C7),
    primaryDark: Color(0xFF0369A1),
    secondary: Color(0xFFD97706),
    accentGreen: Color(0xFF059669),
    accentRed: Color(0xFFDC2626),
    textPrimary: Color(0xFF0F172A),
    textSecondary: Color(0xFF475569),
    textMuted: Color(0xFF94A3B8),
    border: Color(0xFFE2E8F0),
    divider: Color(0xFFE2E8F0),
    cardGradient: LinearGradient(
      colors: [Color(0xFFFFFFFF), Color(0xFFF8FAFC)],
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
    ),
    liveGradient: LinearGradient(
      colors: [Color(0xFFEF4444), Color(0xFFDC2626)],
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
    ),
    goldGradient: LinearGradient(
      colors: [Color(0xFFF59E0B), Color(0xFFD97706)],
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
    ),
    buttonGradient: LinearGradient(
      colors: [Color(0xFF0284C7), Color(0xFF2563EB)],
      begin: Alignment.centerLeft,
      end: Alignment.centerRight,
    ),
    cardShadow: [
      BoxShadow(
        color: Color(0x0F0F172A),
        blurRadius: 16,
        offset: Offset(0, 4),
        spreadRadius: 0,
      ),
      BoxShadow(
        color: Color(0x080F172A),
        blurRadius: 4,
        offset: Offset(0, 1),
      ),
    ],
  );

  // Dynamic context accessor
  static AppColorPalette of(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return isDark ? darkPalette : lightPalette;
  }
}

// Convenient extension on BuildContext
extension BuildContextThemeExt on BuildContext {
  AppColorPalette get colors => AppColors.of(this);
  bool get isDarkMode => Theme.of(this).brightness == Brightness.dark;
}
