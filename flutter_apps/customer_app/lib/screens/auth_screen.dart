import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import '../core/constants.dart';
import '../core/session_manager.dart';
import '../core/theme.dart';
import '../services/auth_service.dart';
import '../widgets/custom_button.dart';
import '../widgets/custom_text_field.dart';
import 'home_screen.dart';

class AuthScreen extends StatefulWidget {
  const AuthScreen({super.key});

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  // Empty, dynamic controllers (No hardcoded mock values)
  final _identifierController = TextEditingController();
  final _otpController = TextEditingController();
  final _nameController = TextEditingController();
  final _addressController = TextEditingController();

  bool _isOtpSent = false;
  bool _isLoading = false;
  String? _errorMessage;
  int _logoTapCount = 0;
  DateTime? _lastLogoTapTime;

  @override
  void dispose() {
    _identifierController.dispose();
    _otpController.dispose();
    _nameController.dispose();
    _addressController.dispose();
    super.dispose();
  }

  bool get _isEmailInput {
    return _identifierController.text.trim().contains('@');
  }

  Future<void> _handleSendOtp() async {
    final rawInput = _identifierController.text.trim();
    if (rawInput.isEmpty) {
      setState(() => _errorMessage = 'Please enter your mobile number or email address');
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
      if (!RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$').hasMatch(rawInput)) {
        setState(() => _errorMessage = 'Please enter a valid email address');
        return;
      }
      cleanIdentifier = rawInput.toLowerCase();
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final res = await AuthService.sendOtp(identifier: cleanIdentifier);

    setState(() => _isLoading = false);

    if (res.success) {
      setState(() => _isOtpSent = true);
      final channelMessage = isEmail
          ? 'Security OTP dispatched to $cleanIdentifier via Brevo Email.'
          : 'Security OTP dispatched to $cleanIdentifier via SMS.';
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(channelMessage),
          backgroundColor: AppTheme.signalEmerald,
          duration: const Duration(seconds: 4),
        ),
      );
    } else {
      setState(() => _errorMessage = res.message ?? 'Failed to send verification code');
    }
  }

  Future<void> _handleVerifyAndLogin() async {
    final code = _otpController.text.trim();
    if (code.isEmpty) {
      setState(() => _errorMessage = 'Please enter the verification code');
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final rawInput = _identifierController.text.trim();
    final isEmail = rawInput.contains('@');
    final identifier = isEmail
        ? rawInput.toLowerCase()
        : (rawInput.startsWith('+91') ? rawInput : '+91${rawInput.replaceAll(RegExp(r'\D'), '').padLeft(10, '0')}');

    final name = _nameController.text.trim().isEmpty ? 'GTS Customer' : _nameController.text.trim();
    final address = _addressController.text.trim().isEmpty ? 'Doorstep Service Premise' : _addressController.text.trim();

    final res = await AuthService.verifyOtp(
      identifier: identifier,
      otp: code,
      name: name,
      address: address,
    );

    setState(() => _isLoading = false);

    if (res.success && res.data != null) {
      if (mounted) {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (_) => const HomeScreen()),
        );
      }
    } else {
      setState(() => _errorMessage = res.message ?? 'Verification failed. Please check your code.');
    }
  }

  Future<void> _handleGoogleSignIn() async {
    // Show Google Account selection or input dialog
    final googleEmailController = TextEditingController();
    final googleNameController = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
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
            const Text('Sign In with Google', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Authenticate securely using your Google Workspace or Gmail account.',
              style: TextStyle(fontSize: 12, color: AppTheme.slateMuted),
            ),
            const SizedBox(height: 14),
            TextField(
              controller: googleEmailController,
              keyboardType: TextInputType.emailAddress,
              decoration: const InputDecoration(
                labelText: 'Google Email',
                hintText: 'user@gmail.com',
                prefixIcon: Icon(Icons.email_outlined, size: 20),
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: googleNameController,
              decoration: const InputDecoration(
                labelText: 'Full Name',
                hintText: 'Your Display Name',
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
              backgroundColor: AppTheme.sapphireBlue800,
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
              final res = await AuthService.loginWithGoogle(
                email: email,
                fullName: name.isNotEmpty ? name : email.split('@')[0],
              );
              setState(() => _isLoading = false);

              if (res.success && mounted) {
                Navigator.pushReplacement(
                  context,
                  MaterialPageRoute(builder: (_) => const HomeScreen()),
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

  void _onLogoTap() {
    final now = DateTime.now();
    if (_lastLogoTapTime == null || now.difference(_lastLogoTapTime!).inSeconds > 2) {
      _logoTapCount = 1;
    } else {
      _logoTapCount++;
    }
    _lastLogoTapTime = now;

    if (_logoTapCount >= 6) {
      _logoTapCount = 0;
      _showEnvironmentSwitcher();
    }
  }

  void _showEnvironmentSwitcher() {
    final urlController = TextEditingController(text: SessionManager.getBaseUrl());
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Developer API Config', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Active backend server URL:',
              style: TextStyle(fontSize: 12, color: AppTheme.slateMuted),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: urlController,
              decoration: const InputDecoration(
                border: OutlineInputBorder(),
                hintText: 'https://ghar-tak-service.vercel.app/api',
              ),
            ),
            const SizedBox(height: 10),
            Wrap(
              spacing: 6,
              children: [
                ActionChip(
                  label: const Text('Live Vercel API', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                  onPressed: () => urlController.text = 'https://ghar-tak-service.vercel.app/api',
                ),
                ActionChip(
                  label: const Text('Local (10.0.2.2)', style: TextStyle(fontSize: 11)),
                  onPressed: () => urlController.text = AppConstants.defaultBaseUrl,
                ),
              ],
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () async {
              await SessionManager.setBaseUrl(urlController.text.trim());
              Navigator.pop(ctx);
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text('API Base URL set to ${urlController.text.trim()}')),
              );
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }

  Widget _buildTrustChip(IconData icon, String text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.9),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppTheme.slateBorder),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: AppTheme.sapphireBlue800),
          const SizedBox(width: 4),
          Text(
            text,
            style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppTheme.slateDark),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.slateLight,
      body: Stack(
        children: [
          // Background Villa Architecture
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            height: 280,
            child: Image.asset(
              'assets/images/bg_auth_villa.png',
              fit: BoxFit.cover,
              errorBuilder: (_, __, ___) => Container(
                decoration: BoxDecoration(gradient: AppTheme.gtsHeaderGradient()),
              ),
            ),
          ),

          // Electrician Cutout Overlooking Villa
          Positioned(
            top: 50,
            right: 12,
            height: 220,
            child: Image.asset(
              'assets/images/img_auth_electrician.png',
              fit: BoxFit.contain,
              errorBuilder: (_, __, ___) => const SizedBox.shrink(),
            ),
          ),

          // Header Left: GTS Logo + Slogan + Trust Badges
          Positioned(
            top: 48,
            left: 20,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                GestureDetector(
                  onTap: _onLogoTap,
                  child: Image.asset(
                    'assets/images/logo_gts_nobg.png',
                    height: 48,
                    errorBuilder: (_, __, ___) => const Text(
                      'GHAR TAK SERVICE',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: AppTheme.slateDark),
                    ),
                  ),
                ),
                const SizedBox(height: 6),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: AppTheme.sapphireBlue800,
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: const Text(
                    'ON-DEMAND ELECTRICAL & SAFETY',
                    style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: Colors.white, letterSpacing: 0.5),
                  ),
                ),
                const SizedBox(height: 10),
                _buildTrustChip(Icons.verified_user_rounded, 'Verified Pros'),
                const SizedBox(height: 4),
                _buildTrustChip(Icons.bolt_rounded, '30-Min Arrival'),
              ],
            ),
          ),

          // Top Right Dev Settings Icon
          Positioned(
            top: 40,
            right: 8,
            child: IconButton(
              icon: const Icon(Icons.settings_outlined, color: Colors.white),
              tooltip: 'Dev Settings',
              onPressed: _showEnvironmentSwitcher,
            ),
          ),

          // Main Login Card Bottom Sheet
          Positioned.fill(
            top: 250,
            child: Container(
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
                boxShadow: [
                  BoxShadow(color: Colors.black12, blurRadius: 20, offset: Offset(0, -4)),
                ],
              ),
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(24, 28, 24, 24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          _isOtpSent ? 'Verify Code' : 'Book Doorstep Pro',
                          style: const TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.w800,
                            color: AppTheme.slateDark,
                          ),
                        ),
                        if (_isOtpSent)
                          TextButton(
                            onPressed: () => setState(() => _isOtpSent = false),
                            child: const Text('Change Details', style: TextStyle(color: AppTheme.sapphireBlue800)),
                          ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      _isOtpSent
                          ? 'Enter the 6-digit verification code sent to your mobile or email'
                          : 'Sign in with your mobile number or email address',
                      style: const TextStyle(fontSize: 13, color: AppTheme.slateMuted),
                    ),
                    const SizedBox(height: 20),

                    if (_errorMessage != null)
                      Container(
                        padding: const EdgeInsets.all(12),
                        margin: const EdgeInsets.only(bottom: 16),
                        decoration: BoxDecoration(
                          color: AppTheme.signalCrimsonBg,
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: AppTheme.signalCrimson.withOpacity(0.3)),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.error_outline_rounded, color: AppTheme.signalCrimson, size: 20),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                _errorMessage!,
                                style: const TextStyle(color: AppTheme.signalCrimson, fontSize: 13, fontWeight: FontWeight.w600),
                              ),
                            ),
                          ],
                        ),
                      ),

                    if (!_isOtpSent) ...[
                      CustomTextField(
                        controller: _identifierController,
                        label: 'Mobile Number or Email',
                        hint: 'e.g. 9830123456 or name@gmail.com',
                        prefixIcon: Icons.contact_mail_outlined,
                        keyboardType: TextInputType.emailAddress,
                      ),
                      const SizedBox(height: 14),
                      CustomTextField(
                        controller: _nameController,
                        label: 'Full Name',
                        hint: 'e.g. Rahul Sharma',
                        prefixIcon: Icons.person_outline_rounded,
                      ),
                      const SizedBox(height: 14),
                      CustomTextField(
                        controller: _addressController,
                        label: 'Service Address',
                        hint: 'Flat/House No, Area, Landmark, City',
                        prefixIcon: Icons.location_on_outlined,
                      ),
                      const SizedBox(height: 24),
                      CustomButton(
                        text: 'GET VERIFICATION CODE',
                        isLoading: _isLoading,
                        onPressed: _handleSendOtp,
                        backgroundColor: AppTheme.sapphireBlue800,
                      ),
                      const SizedBox(height: 16),

                      // Google Sign In Divider & Button
                      Row(
                        children: const [
                          Expanded(child: Divider()),
                          Padding(
                            padding: EdgeInsets.symmetric(horizontal: 12),
                            child: Text('OR', style: TextStyle(fontSize: 12, color: AppTheme.slateMuted)),
                          ),
                          Expanded(child: Divider()),
                        ],
                      ),
                      const SizedBox(height: 14),
                      OutlinedButton.icon(
                        style: OutlinedButton.styleFrom(
                          minimumSize: const Size(double.infinity, 50),
                          side: const BorderSide(color: AppTheme.slateBorder),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                          backgroundColor: Colors.white,
                        ),
                        icon: const Icon(Icons.g_mobiledata_rounded, color: Colors.blue, size: 28),
                        label: const Text(
                          'Continue with Google',
                          style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: AppTheme.slateDark),
                        ),
                        onPressed: _handleGoogleSignIn,
                      ),
                    ] else ...[
                      CustomTextField(
                        controller: _otpController,
                        label: 'Verification Code (OTP)',
                        hint: 'Enter 6-digit code',
                        prefixIcon: Icons.lock_clock_outlined,
                        keyboardType: TextInputType.number,
                      ),
                      const SizedBox(height: 24),
                      CustomButton(
                        text: 'VERIFY & ENTER GHAR TAK SERVICE',
                        isLoading: _isLoading,
                        onPressed: _handleVerifyAndLogin,
                        backgroundColor: AppTheme.sapphireBlue800,
                      ),
                    ],

                    const SizedBox(height: 20),
                    Center(
                      child: Text(
                        'By continuing, you agree to Ghar Tak Service Terms & Privacy Policy',
                        textAlign: TextAlign.center,
                        style: TextStyle(fontSize: 11, color: AppTheme.slateMuted.withOpacity(0.8)),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
