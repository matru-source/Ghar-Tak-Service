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
  // Empty, dynamic controllers (No hardcoded mock values)
  final _identifierController = TextEditingController();
  final _badgeController = TextEditingController();
  final _otpController = TextEditingController();

  bool _isOtpSent = false;
  bool _isLoading = false;
  String? _errorMessage;

  @override
  void dispose() {
    _identifierController.dispose();
    _badgeController.dispose();
    _otpController.dispose();
    super.dispose();
  }

  Future<void> _handleSendOtp() async {
    final rawInput = _identifierController.text.trim();
    final badge = _badgeController.text.trim();

    if (rawInput.isEmpty) {
      setState(() => _errorMessage = 'Please enter your registered mobile number or email');
      return;
    }

    final isEmail = rawInput.contains('@');
    String cleanIdentifier = rawInput;

    if (!isEmail) {
      final digits = rawInput.replaceAll(RegExp(r'\D'), '');
      if (digits.length < 10) {
        setState(() => _errorMessage = 'Please enter a valid 10-digit mobile number');
        return;
      }
      cleanIdentifier = digits.length == 10 ? '+91$digits' : (digits.startsWith('91') ? '+$digits' : '+91$digits');
    } else {
      if (!RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$').test(rawInput)) {
        setState(() => _errorMessage = 'Please enter a valid email address');
        return;
      }
      cleanIdentifier = rawInput.toLowerCase();
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final res = await TechAuthService.sendOtp(
      identifier: cleanIdentifier,
      badgeNumber: badge.isNotEmpty ? badge : null,
    );

    setState(() => _isLoading = false);

    if (res.success) {
      setState(() => _isOtpSent = true);
      final channelMsg = isEmail
          ? 'Verification OTP sent to $cleanIdentifier via Brevo Email'
          : 'Verification OTP sent to $cleanIdentifier via SMS';
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(channelMsg),
          backgroundColor: TechTheme.signalOnlineEmerald,
          duration: const Duration(seconds: 4),
        ),
      );
    } else {
      setState(() => _errorMessage = res.message ?? 'Failed to send OTP. Please verify credentials.');
    }
  }

  Future<void> _handleVerifyOtp() async {
    final rawInput = _identifierController.text.trim();
    final badge = _badgeController.text.trim();
    final otp = _otpController.text.trim();

    if (otp.length < 4) {
      setState(() => _errorMessage = 'Enter the complete verification code');
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final isEmail = rawInput.contains('@');
    final cleanIdentifier = isEmail
        ? rawInput.toLowerCase()
        : (rawInput.startsWith('+91') ? rawInput : '+91${rawInput.replaceAll(RegExp(r'\D'), '').padLeft(10, '0')}');

    final res = await TechAuthService.verifyOtp(
      identifier: cleanIdentifier,
      otp: otp,
      badgeNumber: badge.isNotEmpty ? badge : 'GTS-TECH-101',
    );

    setState(() => _isLoading = false);

    if (res.success && mounted) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (_) => const TechDashboardScreen()),
      );
    } else {
      setState(() => _errorMessage = res.message ?? 'Invalid verification code. Please retry.');
    }
  }

  Future<void> _handleGoogleSignIn() async {
    final googleEmailController = TextEditingController();
    final googleNameController = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.white,
                shape: BoxShape.circle,
                border: Border.all(color: Colors.grey.shade300),
              ),
              child: const Icon(Icons.g_mobiledata_rounded, color: Colors.blue, size: 28),
            ),
            const SizedBox(width: 10),
            const Text('Technician Google Login', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: TechTheme.slateDark)),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Authenticate using your registered partner Google / Gmail ID.',
              style: TextStyle(fontSize: 12, color: TechTheme.slateMuted),
            ),
            const SizedBox(height: 14),
            TextField(
              controller: googleEmailController,
              keyboardType: TextInputType.emailAddress,
              decoration: const InputDecoration(
                labelText: 'Partner Email',
                hintText: 'partner@gmail.com',
                prefixIcon: Icon(Icons.email_outlined, size: 20),
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: googleNameController,
              decoration: const InputDecoration(
                labelText: 'Technician Name',
                hintText: 'e.g. Rajesh Kumar',
                prefixIcon: Icon(Icons.person_outline, size: 20),
                border: OutlineInputBorder(),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: TechTheme.primaryAmber,
              foregroundColor: Colors.white,
            ),
            onPressed: () async {
              final email = googleEmailController.text.trim();
              final name = googleNameController.text.trim();
              if (!email.contains('@')) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Please enter a valid Google email address')),
                );
                return;
              }
              Navigator.pop(ctx);
              setState(() => _isLoading = true);
              final res = await TechAuthService.loginWithGoogle(
                email: email,
                fullName: name.isNotEmpty ? name : 'Field Technician',
              );
              setState(() => _isLoading = false);

              if (res.success && mounted) {
                Navigator.pushReplacement(
                  context,
                  MaterialPageRoute(builder: (_) => const TechDashboardScreen()),
                );
              } else {
                setState(() => _errorMessage = res.message ?? 'Google Sign-In failed');
              }
            },
            child: const Text('Continue'),
          ),
        ],
      ),
    );
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
                    'assets/images/logo_gts_nobg.png',
                    height: 52,
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
                'Technician Sign In',
                style: TextStyle(
                  fontSize: 26,
                  fontWeight: FontWeight.w900,
                  color: Colors.white,
                  letterSpacing: -0.5,
                ),
              ),
              const SizedBox(height: 6),
              const Text(
                'Access your assigned dispatch queue, 1000V safety gates, and 70% direct commission wallet.',
                style: TextStyle(fontSize: 13, color: TechTheme.slateMuted, height: 1.4),
              ),
              const SizedBox(height: 28),

              if (_errorMessage != null)
                Container(
                  padding: const EdgeInsets.all(12),
                  margin: const EdgeInsets.only(bottom: 20),
                  decoration: BoxDecoration(
                    color: TechTheme.signalAlertCrimson.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: TechTheme.signalAlertCrimson.withOpacity(0.4)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.error_outline_rounded, color: TechTheme.signalAlertCrimson, size: 20),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          _errorMessage!,
                          style: const TextStyle(color: TechTheme.signalAlertCrimson, fontSize: 13, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ],
                  ),
                ),

              if (!_isOtpSent) ...[
                // Badge ID Input
                const Text(
                  'TECHNICIAN BADGE ID (OPTIONAL)',
                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: TechTheme.slateMuted, letterSpacing: 0.8),
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: _badgeController,
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                  decoration: InputDecoration(
                    hintText: 'e.g. GTS-TECH-101',
                    hintStyle: const TextStyle(color: TechTheme.slateMuted),
                    filled: true,
                    fillColor: TechTheme.bgDarkCard,
                    prefixIcon: const Icon(Icons.badge_outlined, color: TechTheme.primaryAmber),
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
                const SizedBox(height: 18),

                // Registered Phone / Email Input
                const Text(
                  'REGISTERED MOBILE NUMBER OR EMAIL',
                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: TechTheme.slateMuted, letterSpacing: 0.8),
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: _identifierController,
                  keyboardType: TextInputType.emailAddress,
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                  decoration: InputDecoration(
                    hintText: 'e.g. 9820012345 or partner@gmail.com',
                    hintStyle: const TextStyle(color: TechTheme.slateMuted),
                    filled: true,
                    fillColor: TechTheme.bgDarkCard,
                    prefixIcon: const Icon(Icons.phone_android_rounded, color: TechTheme.primaryAmber),
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
                const SizedBox(height: 24),

                ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: TechTheme.primaryAmber,
                    foregroundColor: Colors.white,
                    minimumSize: const Size(double.infinity, 54),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                  onPressed: _isLoading ? null : _handleSendOtp,
                  child: _isLoading
                      ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5))
                      : const Text('REQUEST OTP ACCESS', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w900, letterSpacing: 0.8)),
                ),

                const SizedBox(height: 20),

                // Google Sign In Button
                OutlinedButton.icon(
                  style: OutlinedButton.styleFrom(
                    minimumSize: const Size(double.infinity, 50),
                    side: const BorderSide(color: TechTheme.bgDarkBorder),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    backgroundColor: TechTheme.bgDarkCard,
                  ),
                  icon: const Icon(Icons.g_mobiledata_rounded, color: Colors.blue, size: 28),
                  label: const Text(
                    'Partner Sign In with Google',
                    style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: Colors.white),
                  ),
                  onPressed: _handleGoogleSignIn,
                ),
              ] else ...[
                // OTP Input
                const Text(
                  'SECURITY VERIFICATION CODE',
                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: TechTheme.slateMuted, letterSpacing: 0.8),
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: _otpController,
                  keyboardType: TextInputType.number,
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18),
                  decoration: InputDecoration(
                    hintText: 'Enter 6-digit code',
                    hintStyle: const TextStyle(color: TechTheme.slateMuted),
                    filled: true,
                    fillColor: TechTheme.bgDarkCard,
                    prefixIcon: const Icon(Icons.lock_clock_outlined, color: TechTheme.primaryAmber),
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
                const SizedBox(height: 24),

                ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: TechTheme.signalOnlineEmerald,
                    foregroundColor: Colors.white,
                    minimumSize: const Size(double.infinity, 54),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                  onPressed: _isLoading ? null : _handleVerifyOtp,
                  child: _isLoading
                      ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5))
                      : const Text('VERIFY & ENTER RADAR', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w900, letterSpacing: 0.8)),
                ),

                const SizedBox(height: 14),
                Center(
                  child: TextButton(
                    onPressed: () => setState(() => _isOtpSent = false),
                    child: const Text('Change Mobile / Badge', style: TextStyle(color: TechTheme.primaryAmber)),
                  ),
                ),
              ],

              const SizedBox(height: 32),
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: TechTheme.bgDarkCard,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: TechTheme.bgDarkBorder),
                ),
                child: Row(
                  children: const [
                    Icon(Icons.shield_outlined, color: TechTheme.primaryAmber, size: 22),
                    SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'Licensed under Ghar Tak Technician Standards ? IEC 60900 Dielectric Protocol Enforced',
                        style: TextStyle(fontSize: 11, color: TechTheme.slateMuted, height: 1.3),
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
