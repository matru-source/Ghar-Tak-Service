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
          content: Text('OTP sent to $phoneFormatted!'),
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

    final res = await AuthService.verifyOtpAndLogin(
      identifier: phoneFormatted,
      code: code,
      fullName: _nameController.text.trim(),
      address: _addressController.text.trim(),
      pincode: '400001',
    );

    setState(() => _isLoading = false);

    if (res.success && mounted) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (_) => const HomeScreen()),
      );
    } else {
      setState(() => _errorMessage = res.message ?? 'Verification failed. Please check OTP.');
    }
  }

  void _showEnvironmentSwitcher() {
    final urlController = TextEditingController(text: SessionManager.getBaseUrl());
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('API Environment Switcher', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text(
              'Select or enter backend server URL:',
              style: TextStyle(fontSize: 12, color: AppTheme.slateMuted),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: urlController,
              decoration: const InputDecoration(
                border: OutlineInputBorder(),
                hintText: 'http://10.0.2.2:3000/api',
              ),
            ),
            const SizedBox(height: 10),
            Wrap(
              spacing: 6,
              children: [
                ActionChip(
                  label: const Text('Emulator (10.0.2.2)', style: TextStyle(fontSize: 11)),
                  onPressed: () => urlController.text = AppConstants.defaultBaseUrl,
                ),
                ActionChip(
                  label: const Text('Localhost (3000)', style: TextStyle(fontSize: 11)),
                  onPressed: () => urlController.text = AppConstants.localWebBaseUrl,
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        actions: [
          IconButton(
            icon: const Icon(Icons.settings_outlined, color: AppTheme.slateMuted),
            tooltip: 'Environment Settings',
            onPressed: _showEnvironmentSwitcher,
          ),
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Image.asset(
                  'assets/images/logo_gts_nobg.png',
                  height: 64,
                  errorBuilder: (_, __, ___) => const Icon(
                    Icons.electric_bolt_rounded,
                    color: AppTheme.primaryAmber,
                    size: 48,
                  ),
                ),
              ),
              const SizedBox(height: 24),
              const Text(
                'Welcome to Ghar Tak',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.w900,
                  color: AppTheme.slateDark,
                ),
              ),
              const SizedBox(height: 6),
              const Text(
                'Enter your mobile number to book verified electricians and home technicians.',
                style: TextStyle(
                  fontSize: 14,
                  color: AppTheme.slateMuted,
                  height: 1.4,
                ),
              ),
              const SizedBox(height: 28),

              if (!_isOtpSent) ...[
                CustomTextField(
                  controller: _phoneController,
                  label: 'Mobile Number',
                  hint: '9830123456',
                  prefixIcon: Icons.phone_android_rounded,
                  keyboardType: TextInputType.phone,
                ),
                const SizedBox(height: 16),
                CustomTextField(
                  controller: _nameController,
                  label: 'Full Name',
                  hint: 'e.g. Priyanka Sen',
                  prefixIcon: Icons.person_outline_rounded,
                ),
                const SizedBox(height: 16),
                CustomTextField(
                  controller: _addressController,
                  label: 'Doorstep Address',
                  hint: 'Flat number, building name, landmark',
                  prefixIcon: Icons.home_outlined,
                  maxLines: 2,
                ),
              ] else ...[
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppTheme.primaryAmberLight.withOpacity(0.4),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppTheme.primaryAmber.withOpacity(0.5)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.mark_email_read_outlined, color: AppTheme.primaryAmberDark),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          'OTP sent to ${_phoneController.text.trim()}',
                          style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13, color: AppTheme.slateDark),
                        ),
                      ),
                      TextButton(
                        onPressed: () => setState(() => _isOtpSent = false),
                        child: const Text('Edit', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 13)),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
                CustomTextField(
                  controller: _otpController,
                  label: '4-Digit Verification Code',
                  hint: 'Enter received code',
                  prefixIcon: Icons.key_outlined,
                  keyboardType: TextInputType.number,
                ),
              ],

              if (_errorMessage != null) ...[
                const SizedBox(height: 14),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppTheme.signalCrimsonBg,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.error_outline_rounded, color: AppTheme.signalCrimson, size: 20),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          _errorMessage!,
                          style: const TextStyle(color: AppTheme.signalCrimson, fontSize: 12, fontWeight: FontWeight.w600),
                        ),
                      ),
                    ],
                  ),
                ),
              ],

              const SizedBox(height: 28),
              CustomButton(
                text: _isOtpSent ? 'Verify & Continue' : 'Get Verification Code',
                isLoading: _isLoading,
                onPressed: _isOtpSent ? _handleVerifyAndLogin : _handleSendOtp,
              ),

              const SizedBox(height: 24),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: const [
                  Icon(Icons.verified_user_outlined, size: 16, color: AppTheme.signalEmerald),
                  SizedBox(width: 6),
                  Text(
                    '100% Verified Professionals • 18% GST Invoicing',
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppTheme.slateMuted),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

