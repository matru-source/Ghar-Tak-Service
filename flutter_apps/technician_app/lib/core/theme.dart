import 'package:flutter/material.dart';

class TechTheme {
  // Brand Color Palette
  static const Color primaryAmber = Color(0xFFF59E0B);
  static const Color primaryAmberDark = Color(0xFFD97706);
  static const Color primaryAmberLight = Color(0xFFFEF3C7);

  // Surface & Neutrals
  static const Color bgDark = Color(0xFF0F172A);
  static const Color bgDarkCard = Color(0xFF1E293B);
  static const Color bgDarkBorder = Color(0xFF334155);

  static const Color slateLight = Color(0xFFF8FAFC);
  static const Color slateCard = Colors.white;
  static const Color slateBorder = Color(0xFFE2E8F0);
  static const Color slateDark = Color(0xFF0F172A);
  static const Color slateMuted = Color(0xFF64748B);

  // Operational Signals
  static const Color signalOnlineEmerald = Color(0xFF10B981);
  static const Color signalOnlineBg = Color(0xFFD1FAE5);
  static const Color signalOfflineSlate = Color(0xFF94A3B8);

  static const Color signalCrimson = Color(0xFFEF4444);
  static const Color signalCrimsonBg = Color(0xFFFEE2E2);

  static const Color signalCobalt = Color(0xFF2563EB);
  static const Color signalCobaltBg = Color(0xFFDBEAFE);

  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      scaffoldBackgroundColor: slateLight,
      colorScheme: ColorScheme.fromSeed(
        seedColor: primaryAmber,
        primary: primaryAmberDark,
        secondary: signalCobalt,
        surface: Colors.white,
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: Colors.white,
        elevation: 0,
        centerTitle: false,
        iconTheme: IconThemeData(color: slateDark),
        titleTextStyle: TextStyle(
          color: slateDark,
          fontSize: 18,
          fontWeight: FontWeight.w800,
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primaryAmber,
          foregroundColor: Colors.white,
          elevation: 0,
          textStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
        ),
      ),
      cardTheme: CardTheme(
        color: Colors.white,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: slateBorder),
        ),
      ),
    );
  }
}
