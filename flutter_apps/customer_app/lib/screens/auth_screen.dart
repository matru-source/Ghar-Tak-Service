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
  final _phoneController = TextEditingController(text: '9830123456');
  final _otpController = TextEditingController();
  final _nameController = TextEditingController(text: 'Priyanka Sen');
  final _addressController = TextEditingController(text: 'Flat 904, Sea Green Horizon, Colaba, Mumbai');

  bool _isOtpSent = false;
  bool _isLoading = false;
  String? _errorMessage;

  Future<void> _handleSendOtp() async {
    final identifier = _phoneController.text.trim();
    if (identifier.length < 10) {
      setState(() => _errorMessage = 'Please enter a valid 10-digit mobile number');
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final phoneFormatted = identifier.startsWith('+91') ? identifier : '+91$identifier';
    final res = await AuthService.sendOtp(identifier: phoneFormatted);

    setState(() => _isLoading = false);

    if (res.success) {
      setState(() => _isOtpSent = true);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('OTP sent to $phoneFormatted! (Sandbox OTP: 123456)'),
          backgroundColor: AppTheme.signalEmerald,
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

    final identifier = _phoneController.text.trim();
    final phoneFormatted = identifier.startsWith('+91') ? identifier : '+91$identifier';
    final name = _nameController.text.trim().isEmpty ? 'GTS Customer' : _nameController.text.trim();
    final address = _addressController.text.trim().isEmpty ? 'Colaba, Mumbai' : _addressController.text.trim();

    final res = await AuthService.verifyOtp(
      identifier: phoneFormatted,
      otp: code,
      name: name,
      address: address,
    );

    setState(() => _isLoading = false);

    if (res.success && res.data != null) {
      await SessionManager.saveUser(res.data!);
      if (mounted) {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (_) => const HomeScreen()),
        );
      }
    } else {
      setState(() => _errorMessage = res.message ?? 'Verification failed. Please check OTP.');
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
                  label: const Text('Emulator (10.0.2.2)', style: TextStyle(fontSize: 11)),
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
              errorBuilder: (_, __, ___) => const SizedBox(),
            ),
          ),

          // Logo & Branding on Left
          Positioned(
            top: 50,
            left: 20,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.95),
                    borderRadius: BorderRadius.circular(12),
                    boxShadow: [
                      BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 10),
                    ],
                  ),
                  child: Image.asset(
                    'assets/images/logo_gts_nobg.png',
                    height: 38,
                    errorBuilder: (_, __, ___) => const Text(
                      'GTS',
                      style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: AppTheme.sapphireBlue900),
                    ),
                  ),
                ),
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: AppTheme.sapphireBlue900.withOpacity(0.9),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: const Text(
                    'ON-DEMAND ELECTRICAL & SAFETY',
                    style: TextStyle(
                      fontSize: 8.5,
                      fontWeight: FontWeight.w900,
                      color: Colors.white,
                      letterSpacing: 0.5,
                    ),
                  ),
                ),
                const SizedBox(height: 10),
                _buildTrustChip(Icons.verified_user_rounded, 'Verified Pros'),
                const SizedBox(height: 4),
                _buildTrustChip(Icons.bolt_rounded, '30-Min Arrival'),
              ],
            ),
          ),

          // Top Right Env Switcher
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
                          _isOtpSent ? 'Verify Mobile' : 'Book Doorstep Pro',
                          style: const TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.w800,
                            color: AppTheme.slateDark,
                          ),
                        ),
                        if (_isOtpSent)
                          TextButton(
                            onPressed: () => setState(() => _isOtpSent = false),
                            child: const Text('Change Phone', style: TextStyle(color: AppTheme.sapphireBlue800)),
                          ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      _isOtpSent
                          ? 'Enter the 6-digit verification code sent to your phone'
                          : 'Enter your phone number for instant technician dispatch',
                      style: const TextStyle(fontSize: 13, color: AppTheme.slateMuted),
                    ),
                    const SizedBox(height: 20),

                    if (_errorMessage != null)
                      Container(
                        padding: const EdgeInsets.all(12),
                        margin: const EdgeInsets.bottom(16),
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
                        controller: _phoneController,
                        label: 'Mobile Number',
                        hint: '98301 23456',
                        prefixIcon: Icons.phone_android_rounded,
                        keyboardType: TextInputType.phone,
                      ),
                      const SizedBox(height: 14),
                      CustomTextField(
                        controller: _nameController,
                        label: 'Full Name',
                        hint: 'Your Name',
                        prefixIcon: Icons.person_outline_rounded,
                      ),
                      const SizedBox(height: 14),
                      CustomTextField(
                        controller: _addressController,
                        label: 'Service Address',
                        hint: 'House/Flat No, Area, City',
                        prefixIcon: Icons.location_on_outlined,
                      ),
                      const SizedBox(height: 24),
                      CustomButton(
                        text: 'GET VERIFICATION CODE',
                        isLoading: _isLoading,
                        onPressed: _handleSendOtp,
                        backgroundColor: AppTheme.sapphireBlue800,
                      ),
                    ] else ...[
                      CustomTextField(
                        controller: _otpController,
                        label: 'Verification Code (OTP)',
                        hint: 'Enter 123456',
                        prefixIcon: Icons.lock_clock_outlined,
                        keyboardType: TextInputType.number,
                      ),
                      const SizedBox(height: 24),
                      CustomButton(
                        text: 'VERIFY & ENTER GHAR TAK',
                        isLoading: _isLoading,
                        onPressed: _handleVerifyAndLogin,
                        backgroundColor: AppTheme.sapphireBlue800,
                      ),
                    ],

                    const SizedBox(height: 20),
                    Center(
                      child: Text(
                        'By continuing, you agree to Ghar Tak Terms of Service & Privacy Policy',
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
