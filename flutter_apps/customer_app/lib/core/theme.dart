import 'package:flutter/material.dart';

class AppTheme {
  // Brand Palette
  static const Color primaryAmber = Color(0xFFF59E0B);
  static const Color primaryAmberDark = Color(0xFFD97706);
  static const Color primaryAmberLight = Color(0xFFFEF3C7);
  
  static const Color slateDark = Color(0xFF0F172A);
  static const Color slateCard = Color(0xFF1E293B);
  static const Color slateMuted = Color(0xFF64748B);
  static const Color slateLight = Color(0xFFF8FAFC);
  static const Color slateBorder = Color(0xFFE2E8F0);

  static const Color signalEmerald = Color(0xFF10B981);
  static const Color signalEmeraldBg = Color(0xFFD1FAE5);
  static const Color signalCrimson = Color(0xFFEF4444);
  static const Color signalCrimsonBg = Color(0xFFFEE2E2);

  static ThemeData lightTheme = ThemeData(
    useMaterial3: true,
    scaffoldBackgroundColor: slateLight,
    primaryColor: primaryAmber,
    colorScheme: const ColorScheme.light(
      primary: primaryAmber,
      secondary: slateDark,
      surface: Colors.white,
      error: signalCrimson,
    ),
    appBarTheme: const AppBarTheme(
      backgroundColor: Colors.white,
      elevation: 0,
      centerTitle: false,
      iconTheme: IconThemeData(color: slateDark),
      titleTextStyle: TextStyle(
        color: slateDark,
        fontSize: 18,
        fontWeight: FontWeight.w700,
      ),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: primaryAmber,
        foregroundColor: Colors.white,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(14),
        ),
        textStyle: const TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.w700,
        ),
      ),
    ),
  );
}

