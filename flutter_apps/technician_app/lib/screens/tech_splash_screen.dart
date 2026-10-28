import 'package:flutter/material.dart';
import '../core/session_manager.dart';
import '../core/theme.dart';
import 'tech_auth_screen.dart';
import 'tech_dashboard_screen.dart';

class TechSplashScreen extends StatefulWidget {
  const TechSplashScreen({super.key});

  @override
  State<TechSplashScreen> createState() => _TechSplashScreenState();
}

class _TechSplashScreenState extends State<TechSplashScreen> {
  @override
  void initState() {
    super.initState();
    _checkSession();
  }

  Future<void> _checkSession() async {
    await Future.delayed(const Duration(milliseconds: 1600));
    if (!mounted) return;

    if (SessionManager.isLoggedIn()) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (_) => const TechDashboardScreen()),
      );
    } else {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (_) => const TechAuthScreen()),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: TechTheme.bgDark,
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: TechTheme.bgDarkCard,
                borderRadius: BorderRadius.circular(28),
                border: Border.all(color: TechTheme.primaryAmber.withOpacity(0.5)),
                boxShadow: [
                  BoxShadow(
                    color: TechTheme.primaryAmber.withOpacity(0.15),
                    blurRadius: 30,
                    spreadRadius: 2,
                  ),
                ],
              ),
              child: Image.asset(
                'assets/images/logo-gts-white.png',
                width: 140,
                errorBuilder: (_, __, ___) => const Icon(
                  Icons.electric_bolt_rounded,
                  color: TechTheme.primaryAmber,
                  size: 72,
                ),
              ),
            ),
            const SizedBox(height: 28),
            const Text(
              'GHAR TAK PARTNER',
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.w900,
                color: Colors.white,
                letterSpacing: 2.0,
              ),
            ),
            const SizedBox(height: 6),
            const Text(
              'Field Technician & Safety Operations Console',
              style: TextStyle(
                fontSize: 12,
                color: Colors.white60,
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 36),
            const SizedBox(
              width: 24,
              height: 24,
              child: CircularProgressIndicator(
                color: TechTheme.primaryAmber,
                strokeWidth: 2.5,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
