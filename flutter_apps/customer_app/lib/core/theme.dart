import 'package:flutter/material.dart';

class AppTheme {
  // Brand Palette - Matching Native Kotlin App (Sapphire Blue 2.0)
  static const Color gtsHeaderGradientStart = Color(0xFF083C74); // Deep Royal Midnight
  static const Color gtsHeaderGradientMid = Color(0xFF0056B3);   // Vibrant Sapphire Blue
  static const Color gtsHeaderGradientEnd = Color(0xFF0284C7);   // Bright Sky Cerulean
  static const Color sapphireBlue900 = Color(0xFF0D47A1);
  static const Color sapphireBlue800 = Color(0xFF1565C0);
  static const Color sapphireBlue = Color(0xFF1565C0);
  static const Color sapphireBlueLight = Color(0xFFEFF6FF);
  static const Color electricCyan = Color(0xFF00B4D8);

  // Amber & Accent
  static const Color primaryAmber = Color(0xFFF59E0B);
  static const Color primaryAmberDark = Color(0xFFD97706);
  static const Color primaryAmberLight = Color(0xFFFEF3C7);

  // Surface & Neutral Tokens
  static const Color slateDark = Color(0xFF0F172A);
  static const Color navyDark900 = Color(0xFF0A1128);
  static const Color slateCard = Color(0xFF1E293B);
  static const Color slateMuted = Color(0xFF64748B);
  static const Color slateLight = Color(0xFFF8FAFC);
  static const Color slateBorder = Color(0xFFE2E8F0);

  // Signals
  static const Color signalEmerald = Color(0xFF10B981);
  static const Color signalEmeraldBg = Color(0xFFD1FAE5);
  static const Color signalCrimson = Color(0xFFDC2626);
  static const Color signalCrimsonBg = Color(0xFFFEE2E2);
  static const Color signalCobalt = Color(0xFF2563EB);
  static const Color signalCobaltBg = Color(0xFFDBEAFE);

  static LinearGradient gtsHeaderGradient() {
    return const LinearGradient(
      colors: [gtsHeaderGradientStart, gtsHeaderGradientMid, gtsHeaderGradientEnd],
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
    );
  }

  static ThemeData lightTheme = ThemeData(
    useMaterial3: true,
    scaffoldBackgroundColor: slateLight,
    primaryColor: sapphireBlue800,
    colorScheme: const ColorScheme.light(
      primary: sapphireBlue800,
      secondary: electricCyan,
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
        backgroundColor: sapphireBlue800,
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
