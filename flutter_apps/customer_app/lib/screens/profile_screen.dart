import 'package:flutter/material.dart';
import '../core/session_manager.dart';
import '../core/theme.dart';
import '../models/user_model.dart';
import '../widgets/custom_button.dart';
import 'auth_screen.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  UserModel? _user;

  @override
  void initState() {
    super.initState();
    _user = SessionManager.getCurrentUser();
  }

  void _handleLogout() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Confirm Logout', style: TextStyle(fontWeight: FontWeight.bold)),
        content: const Text('Are you sure you want to end your current session?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.signalCrimson),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Logout', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );

    if (confirm == true) {
      await SessionManager.clearSession();
      if (mounted) {
        Navigator.pushAndRemoveUntil(
          context,
          MaterialPageRoute(builder: (_) => const AuthScreen()),
          (route) => false,
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.slateLight,
      appBar: AppBar(
        title: const Text('Customer Account', style: TextStyle(fontWeight: FontWeight.bold)),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            // User Header Card
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: AppTheme.slateBorder),
              ),
              child: Row(
                children: [
                  Container(
                    width: 64,
                    height: 64,
                    decoration: BoxDecoration(
                      color: AppTheme.primaryAmberLight,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: const Icon(Icons.person_rounded, color: AppTheme.primaryAmberDark, size: 36),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          _user?.fullName ?? 'Valued Customer',
                          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: AppTheme.slateDark),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          _user?.phone ?? '+91 98200 12345',
                          style: const TextStyle(fontSize: 13, color: AppTheme.slateMuted, fontWeight: FontWeight.w500),
                        ),
                        const SizedBox(height: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                          decoration: BoxDecoration(
                            color: AppTheme.signalEmeraldBg,
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: const Text(
                            'OTP VERIFIED RESIDENCE',
                            style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: AppTheme.signalEmerald),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // ZEX-SHIELD AMC Membership Card
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF1E293B), Color(0xFF0F172A)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(24),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.15),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: const [
                          Icon(Icons.shield_rounded, color: AppTheme.primaryAmber, size: 24),
                          SizedBox(width: 8),
                          Text(
                            'ZEX-SHIELD AMC',
                            style: TextStyle(fontWeight: FontWeight.w900, color: Colors.white, fontSize: 14, letterSpacing: 0.8),
                          ),
                        ],
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: AppTheme.primaryAmber,
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: const Text(
                          'GOLD ACTIVE',
                          style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.white),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'Annual Electrical Protection Plan',
                    style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: Colors.white),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Covers 100% replacement labor, emergency tripouts, and quarterly 1000V dielectric audits.',
                    style: TextStyle(fontSize: 12, color: Colors.white.withOpacity(0.7), height: 1.4),
                  ),
                  const SizedBox(height: 14),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Member ID: GTS-AMC-${_user?.id.substring(0, 6).toUpperCase() ?? "GOLD01"}',
                        style: TextStyle(fontSize: 11, color: Colors.white.withOpacity(0.5), fontFamily: 'monospace'),
                      ),
                      Text(
                        'Renews: Oct 2027',
                        style: TextStyle(fontSize: 11, color: AppTheme.primaryAmber.withOpacity(0.9), fontWeight: FontWeight.w600),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Profile Details & Addresses
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppTheme.slateBorder),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'REGISTERED LOCATION',
                    style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: AppTheme.slateMuted, letterSpacing: 1.0),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Icon(Icons.pin_drop_rounded, color: AppTheme.primaryAmberDark, size: 20),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              _user?.address ?? 'Flat 904, Sea Green Horizon, Colaba, Mumbai',
                              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppTheme.slateDark, height: 1.3),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Service Zone: Mumbai Colaba Hub (MH-01)',
                              style: const TextStyle(fontSize: 11, color: AppTheme.slateMuted),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Trust & Safety Badges
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppTheme.slateBorder),
              ),
              child: Column(
                children: [
                  _buildSafetyRow(Icons.verified_user_rounded, 'Strict 1000V Dielectric Gloves Mandatory'),
                  const Divider(height: 20),
                  _buildSafetyRow(Icons.electric_bolt_rounded, 'Physical MCB Padlock & 0.00V Multi-meter Test'),
                  const Divider(height: 20),
                  _buildSafetyRow(Icons.description_rounded, 'Mandatory 18% GST Compliant Invoices Only'),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Logout Action
            CustomButton(
              title: 'Sign Out Account',
              backgroundColor: AppTheme.signalCrimson,
              onPressed: _handleLogout,
            ),
            const SizedBox(height: 30),
          ],
        ),
      ),
    );
  }

  Widget _buildSafetyRow(IconData icon, String text) {
    return Row(
      children: [
        Icon(icon, color: AppTheme.signalEmerald, size: 20),
        const SizedBox(width: 12),
        Expanded(
          child: Text(
            text,
            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppTheme.slateDark),
          ),
        ),
      ],
    );
  }
}

