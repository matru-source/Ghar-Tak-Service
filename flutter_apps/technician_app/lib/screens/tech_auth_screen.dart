import 'package:flutter/material.dart';
import '../core/theme.dart';
import '../services/tech_auth_service.dart';
import 'tech_dashboard_screen.dart';

class TechAuthScreen extends StatefulWidget {
  const TechAuthScreen({super.key});

  @override
  State<TechAuthScreen> createState() => _TechAuthScreenState();
}

class _TechAuthScreenState extends State<TechAuthScreen> {
  final _phoneController = TextEditingController(text: '9820012345');
  final _badgeController = TextEditingController(text: 'GTS-TECH-101');
  final _otpController = TextEditingController();

  bool _isOtpSent = false;
  bool _isLoading = false;
  String? _errorMessage;

  Future<void> _handleSendOtp() async {
    final phone = _phoneController.text.trim();
    final badge = _badgeController.text.trim();

    if (phone.length < 10) {
      setState(() => _errorMessage = 'Please enter a valid 10-digit mobile number');
      return;
    }
    if (badge.isEmpty) {
      setState(() => _errorMessage = 'Technician badge number is required');
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final res = await TechAuthService.sendOtp(phone: phone, badgeNumber: badge);

    setState(() => _isLoading = false);

    if (res.success) {
      setState(() => _isOtpSent = true);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Verification code sent to your registered partner phone'),
          backgroundColor: TechTheme.signalOnlineEmerald,
        ),
      );
    } else {
      setState(() => _errorMessage = res.message ?? 'Failed to send OTP. Please verify badge credentials.');
    }
  }

  Future<void> _handleVerifyOtp() async {
    final phone = _phoneController.text.trim();
    final badge = _badgeController.text.trim();
    final otp = _otpController.text.trim();

    if (otp.length < 4) {
      setState(() => _errorMessage = 'Enter full verification code');
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final res = await TechAuthService.verifyOtp(phone: phone, otp: otp, badgeNumber: badge);

    setState(() => _isLoading = false);

    if (res.success && mounted) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (_) => const TechDashboardScreen()),
      );
    } else {
      setState(() => _errorMessage = res.message ?? 'Invalid code. Please retry.');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: TechTheme.bgDark,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: TechTheme.bgDarkCard,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: TechTheme.bgDarkBorder),
                  ),
                  child: Image.asset(
                    'assets/images/logo-gts-white.png',
                    width: 120,
                    errorBuilder: (_, __, ___) => const Icon(
                      Icons.electric_bolt_rounded,
                      color: TechTheme.primaryAmber,
                      size: 48,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 32),
              const Text(
                'Partner Sign In',
                style: TextStyle(
                  fontSize: 26,
                  fontWeight: FontWeight.w900,
                  color: Colors.white,
                ),
              ),
              const SizedBox(height: 6),
              const Text(
                'Access your assigned dispatch queue, 1000V safety gates, and 70% direct commission wallet.',
                style: TextStyle(
                  fontSize: 13,
                  color: Colors.white60,
                  height: 1.4,
                ),
              ),
              const SizedBox(height: 28),

              if (_errorMessage != null) ...[
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: TechTheme.signalCrimson.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: TechTheme.signalCrimson),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.error_outline_rounded, color: TechTheme.signalCrimson, size: 20),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          _errorMessage!,
                          style: const TextStyle(color: Colors.white, fontSize: 12),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 18),
              ],

              if (!_isOtpSent) ...[
                // Badge ID Input
                const Text(
                  'TECHNICIAN BADGE ID',
                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: Colors.white70, letterSpacing: 0.8),
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: _badgeController,
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                  decoration: InputDecoration(
                    prefixIcon: const Icon(Icons.badge_outlined, color: TechTheme.primaryAmber),
                    hintText: 'e.g. GTS-TECH-101',
                    hintStyle: const TextStyle(color: Colors.white38),
                    filled: true,
                    fillColor: TechTheme.bgDarkCard,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(14),
                      borderSide: const BorderSide(color: TechTheme.bgDarkBorder),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(14),
                      borderSide: const BorderSide(color: TechTheme.bgDarkBorder),
                    ),
                  ),
                ),
                const SizedBox(height: 20),

                // Mobile Number Input
                const Text(
                  'REGISTERED MOBILE NUMBER',
                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: Colors.white70, letterSpacing: 0.8),
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: _phoneController,
                  keyboardType: TextInputType.phone,
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                  decoration: InputDecoration(
                    prefixIcon: const Icon(Icons.phone_android_rounded, color: TechTheme.primaryAmber),
                    prefixText: '+91 ',
                    prefixStyle: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                    hintText: '9820012345',
                    hintStyle: const TextStyle(color: Colors.white38),
                    filled: true,
                    fillColor: TechTheme.bgDarkCard,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(14),
                      borderSide: const BorderSide(color: TechTheme.bgDarkBorder),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(14),
                      borderSide: const BorderSide(color: TechTheme.bgDarkBorder),
                    ),
                  ),
                ),
                const SizedBox(height: 28),

                ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: TechTheme.primaryAmber,
                    foregroundColor: TechTheme.slateDark,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    minimumSize: const Size.fromHeight(54),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                  onPressed: _isLoading ? null : _handleSendOtp,
                  child: _isLoading
                      ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(color: TechTheme.slateDark, strokeWidth: 2))
                      : const Text('REQUEST OTP ACCESS', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 14)),
                ),
              ] else ...[
                // OTP Input Form
                const Text(
                  'ENTER 6-DIGIT VERIFICATION CODE',
                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: Colors.white70, letterSpacing: 0.8),
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: _otpController,
                  keyboardType: TextInputType.number,
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w900,
                    fontSize: 24,
                    letterSpacing: 10,
                  ),
                  decoration: InputDecoration(
                    hintText: '••••••',
                    hintStyle: const TextStyle(color: Colors.white38, letterSpacing: 10),
                    filled: true,
                    fillColor: TechTheme.bgDarkCard,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(14),
                      borderSide: const BorderSide(color: TechTheme.primaryAmber),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(14),
                      borderSide: const BorderSide(color: TechTheme.primaryAmber),
                    ),
                  ),
                ),
                const SizedBox(height: 24),

                ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: TechTheme.primaryAmber,
                    foregroundColor: TechTheme.slateDark,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    minimumSize: const Size.fromHeight(54),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                  onPressed: _isLoading ? null : _handleVerifyOtp,
                  child: _isLoading
                      ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(color: TechTheme.slateDark, strokeWidth: 2))
                      : const Text('VERIFY & ENTER CONSOLE', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 14)),
                ),
                const SizedBox(height: 14),

                Center(
                  child: TextButton(
                    onPressed: () => setState(() => _isOtpSent = false),
                    child: const Text('Change Badge or Phone Number', style: TextStyle(color: Colors.white70)),
                  ),
                ),
              ],

              const SizedBox(height: 40),
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: TechTheme.bgDarkCard,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: TechTheme.bgDarkBorder),
                ),
                child: Row(
                  children: const [
                    Icon(Icons.shield_outlined, color: TechTheme.primaryAmber, size: 20),
                    SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        'Licensed under Ghar Tak Partner Fleet Standards • IEC 60900 Dielectric Protocol Enforced',
                        style: TextStyle(color: Colors.white54, fontSize: 11, height: 1.3),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

