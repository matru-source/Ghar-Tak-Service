import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'core/session_manager.dart';
import 'core/theme.dart';
import 'screens/tech_splash_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await SessionManager.init();

  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
    ),
  );

  runApp(const GharTakTechnicianApp());
}

class GharTakTechnicianApp extends StatelessWidget {
  const GharTakTechnicianApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Ghar Tak Partner - Field Technician Console',
      debugShowCheckedModeBanner: false,
      theme: TechTheme.lightTheme,
      home: const TechSplashScreen(),
    );
  }
}

