import 'package:flutter/material.dart';

class AppColors {
  // Primary Dark Backgrounds
  static const Color background = Color(0xFF0F172A); // Deep Slate Navy
  static const Color surface = Color(0xFF1E293B);    // Card Surface
  static const Color surfaceLight = Color(0xFF334155);

  // Vibrant Accents
  static const Color primary = Color(0xFF38BDF8);    // Bright Sky Blue
  static const Color primaryDark = Color(0xFF0284C7);
  static const Color secondary = Color(0xFFF59E0B);  // Gold / Amber
  static const Color accentGreen = Color(0xFF10B981); // Emerald Live Green
  static const Color accentRed = Color(0xFFEF4444);   // Live Badge Red

  // Text Colors
  static const Color textPrimary = Color(0xFFF8FAFC);
  static const Color textSecondary = Color(0xFF94A3B8);
  static const Color textMuted = Color(0xFF64748B);

  // Border & Divider
  static const Color border = Color(0xFF334155);
  static const Color divider = Color(0xFF1E293B);

  // Gradients
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
    colors: [Color(0xFF2563EB), Color(0xFF1D4ED8)],
    begin: Alignment.centerLeft,
    end: Alignment.centerRight,
  );
}
