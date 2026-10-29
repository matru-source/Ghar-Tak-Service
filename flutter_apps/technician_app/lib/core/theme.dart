import 'package:flutter/material.dart';

class TechTheme {
  // Brand Color Palette - Matching Native Kotlin App (Electric Safety Orange)
  static const Color flameOrange = Color(0xFFE65100);
  static const Color flameOrangeDark = Color(0xFFBF360C);
  static const Color flameOrangeLight = Color(0xFFFF7043);
  static const Color flameOrangeAmber = Color(0xFFFFB300);

  // Amber Compatibility Aliases
  static const Color primaryAmber = Color(0xFFF59E0B);
  static const Color primaryAmberDark = Color(0xFFD97706);
  static const Color primaryAmberLight = Color(0xFFFEF3C7);

  // Surface & Neutrals
  static const Color bgDark = Color(0xFF0F172A);
  static const Color bgDarkCard = Color(0xFF1E293B);
  static const Color bgDarkBorder = Color(0xFF334155);

  static const Color slateLight = Color(0xFFF8F9FA);
  static const Color slateCard = Colors.white;
  static const Color slateBorder = Color(0xFFE2E8F0);
  static const Color slateDark = Color(0xFF1E293B);
  static const Color slateMuted = Color(0xFF64748B);

  // Operational Signals
  static const Color signalOnlineEmerald = Color(0xFF2E7D32);
  static const Color signalOnlineBg = Color(0xFFE8F5E9);
  static const Color signalOfflineSlate = Color(0xFF94A3B8);

  static const Color signalCrimson = Color(0xFFD32F2F);
  static const Color signalAlertCrimson = Color(0xFFD32F2F);
  static const Color signalCrimsonBg = Color(0xFFFEE2E2);

  static const Color signalCobalt = Color(0xFF1976D2);
  static const Color signalCobaltBg = Color(0xFFE3F2FD);

  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      scaffoldBackgroundColor: slateLight,
      colorScheme: ColorScheme.fromSeed(
        seedColor: flameOrange,
        primary: flameOrange,
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
          backgroundColor: flameOrange,
          foregroundColor: Colors.white,
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
          textStyle: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w800,
          ),
        ),
      ),
    );
  }
}
