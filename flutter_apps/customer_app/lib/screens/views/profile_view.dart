import 'package:flutter/material.dart';
import '../../core/session_manager.dart';
import '../../core/theme.dart';
import '../../models/user_model.dart';
import '../auth_screen.dart';

class ProfileView extends StatefulWidget {
  final VoidCallback onLogout;

  const ProfileView({
    super.key,
    required this.onLogout,
  });

  @override
  State<ProfileView> createState() => _ProfileViewState();
}

class _ProfileViewState extends State<ProfileView> {
  UserModel? _user;
  String _amcTier = 'ZEX-SHIELD AMC PLATINUM';
  String _amcExpiry = '31 Dec 2026';
  String _selectedLanguage = 'English';
  String? _secondaryAddress;
  String? _secondaryLabel;

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  void _loadProfile() {
    setState(() {
      _user = SessionManager.getCurrentUser();
      _amcTier = SessionManager.getAmcTier();
      _amcExpiry = SessionManager.getAmcExpiry();
      _secondaryAddress = SessionManager.getSecondaryAddress();
      _secondaryLabel = SessionManager.getSecondaryLabel() ?? 'Work / Office';
    });
  }

  void _showEditProfileDialog() {
    final nameCtrl = TextEditingController(text: _user?.fullName ?? '');
    final emailCtrl = TextEditingController(text: _user?.email ?? '');
    final phoneCtrl = TextEditingController(text: _user?.phone ?? '');
    final addrCtrl = TextEditingController(text: _user?.address ?? '');

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Edit Profile & Address', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: nameCtrl,
                decoration: const InputDecoration(labelText: 'Full Name', border: OutlineInputBorder()),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: emailCtrl,
                decoration: const InputDecoration(labelText: 'Email Address', border: OutlineInputBorder()),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: phoneCtrl,
                decoration: const InputDecoration(labelText: 'Phone Number', border: OutlineInputBorder()),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: addrCtrl,
                maxLines: 2,
                decoration: const InputDecoration(labelText: 'Primary Service Address', border: OutlineInputBorder()),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.sapphireBlue, foregroundColor: Colors.white),
            onPressed: () async {
              final updated = UserModel(
                id: _user?.id ?? 'usr_${DateTime.now().millisecondsSinceEpoch}',
                fullName: nameCtrl.text.trim(),
                email: emailCtrl.text.trim(),
                phone: phoneCtrl.text.trim(),
                address: addrCtrl.text.trim(),
                pincode: _user?.pincode ?? '400001',
              );
              await SessionManager.saveCurrentUser(updated);
              setState(() => _user = updated);
              Navigator.pop(ctx);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Profile details updated successfully.')),
              );
            },
            child: const Text('Save Changes'),
          ),
        ],
      ),
    );
  }

  void _showAddSecondaryAddressDialog() {
    final labelCtrl = TextEditingController(text: _secondaryLabel ?? 'Office');
    final addrCtrl = TextEditingController(text: _secondaryAddress ?? '');

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Saved Address', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: labelCtrl,
              decoration: const InputDecoration(labelText: 'Address Label (e.g. Office, Parents)', border: OutlineInputBorder()),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: addrCtrl,
              maxLines: 3,
              decoration: const InputDecoration(labelText: 'Full Doorstep Address', border: OutlineInputBorder()),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.sapphireBlue, foregroundColor: Colors.white),
            onPressed: () async {
              await SessionManager.saveSecondaryAddress(labelCtrl.text.trim(), addrCtrl.text.trim());
              _loadProfile();
              Navigator.pop(ctx);
            },
            child: const Text('Save Address'),
          ),
        ],
      ),
    );
  }

  void _showLogoutDialog() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Log Out of Ghar Tak Services?', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        content: const Text(
          'You will need to sign in with your verified mobile number or email next time.',
          style: TextStyle(fontSize: 13, color: AppTheme.slateMuted),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFDC2626),
              foregroundColor: Colors.white,
            ),
            onPressed: () async {
              Navigator.pop(ctx);
              await SessionManager.logout();
              if (mounted) {
                Navigator.pushAndRemoveUntil(
                  context,
                  MaterialPageRoute(builder: (_) => const AuthScreen()),
                  (route) => false,
                );
              }
            },
            child: const Text('Yes, Log Out'),
          ),
        ],
      ),
    );
  }

  String _getInitials(String name) {
    final parts = name.trim().split(' ').where((p) => p.isNotEmpty).toList();
    if (parts.length >= 2) {
      return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    }
    if (parts.isNotEmpty && parts[0].isNotEmpty) {
      return parts[0].substring(0, parts[0].length >= 2 ? 2 : 1).toUpperCase();
    }
    return 'GT';
  }

  @override
  Widget build(BuildContext context) {
    final name = _user?.fullName ?? 'Valued Customer';
    final email = _user?.email ?? 'customer@ghartak.in';
    final phone = _user?.phone ?? '+91 98200 12345';
    final address = _user?.address ?? 'Colaba, Mumbai, Maharashtra';

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // User Profile Card
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: AppTheme.slateBorder),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.02),
                  blurRadius: 8,
                  offset: const Offset(0, 3),
                ),
              ],
            ),
            child: Row(
              children: [
                Container(
                  width: 58,
                  height: 58,
                  decoration: BoxDecoration(
                    color: AppTheme.sapphireBlue,
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: AppTheme.sapphireBlue.withOpacity(0.3),
                        blurRadius: 8,
                        offset: const Offset(0, 3),
                      ),
                    ],
                  ),
                  alignment: Alignment.Center,
                  child: Text(
                    _getInitials(name),
                    style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.white),
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              name,
                              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.slateDark),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          const Icon(Icons.verified_rounded, color: AppTheme.signalEmerald, size: 16),
                        ],
                      ),
                      const SizedBox(height: 3),
                      Text(phone, style: const TextStyle(fontSize: 12, color: AppTheme.slateMuted)),
                      Text(email, style: const TextStyle(fontSize: 11, color: AppTheme.slateMuted)),
                    ],
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.edit_outlined, color: AppTheme.sapphireBlue),
                  onPressed: _showEditProfileDialog,
                ),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // ZEX-SHIELD AMC Membership Card
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF0F2B48), Color(0xFF1E3A5F)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(20),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF0F2B48).withOpacity(0.2),
                  blurRadius: 10,
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
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppTheme.primaryAmber,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Text(
                        'ACTIVE MEMBERSHIP',
                        style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.white, letterSpacing: 0.5),
                      ),
                    ),
                    const Icon(Icons.shield_rounded, color: AppTheme.primaryAmber, size: 28),
                  ],
                ),
                const SizedBox(height: 12),
                Text(
                  _amcTier,
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: Colors.white),
                ),
                const SizedBox(height: 4),
                const Text(
                  '₹0 Labor Charges on All Household Electrical Repairs',
                  style: TextStyle(fontSize: 12, color: Color(0xFFE2E8F0), fontWeight: FontWeight.w500),
                ),
                const SizedBox(height: 12),
                const Divider(color: Colors.white24, height: 1),
                const SizedBox(height: 10),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Valid Through', style: TextStyle(fontSize: 11, color: Color(0xFF94A3B8))),
                    Text(_amcExpiry, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white)),
                  ],
                ),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // Saved Addresses Section
          const Text(
            'Saved Doorstep Addresses',
            style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppTheme.slateDark),
          ),
          const SizedBox(height: 10),

          // Primary Address Card
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: AppTheme.slateBorder),
            ),
            child: Row(
              children: [
                const Icon(Icons.home_rounded, color: AppTheme.sapphireBlue, size: 22),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Primary Home Address', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppTheme.slateDark)),
                      const SizedBox(height: 2),
                      Text(address, style: const TextStyle(fontSize: 11.5, color: AppTheme.slateMuted), maxLines: 2, overflow: TextOverflow.ellipsis),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),

          // Secondary Address Card
          if (_secondaryAddress != null && _secondaryAddress!.isNotEmpty)
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: AppTheme.slateBorder),
              ),
              child: Row(
                children: [
                  const Icon(Icons.business_rounded, color: AppTheme.slateDark, size: 22),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(_secondaryLabel ?? 'Secondary Address', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppTheme.slateDark)),
                        const SizedBox(height: 2),
                        Text(_secondaryAddress!, style: const TextStyle(fontSize: 11.5, color: AppTheme.slateMuted), maxLines: 2, overflow: TextOverflow.ellipsis),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.edit_outlined, size: 18, color: AppTheme.slateMuted),
                    onPressed: _showAddSecondaryAddressDialog,
                  ),
                ],
              ),
            )
          else
            OutlinedButton.icon(
              style: OutlinedButton.styleFrom(
                minimumSize: const Size.fromHeight(44),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                side: const BorderSide(color: AppTheme.sapphireBlue),
              ),
              icon: const Icon(Icons.add_location_alt_rounded, size: 18, color: AppTheme.sapphireBlue),
              label: const Text('Add Secondary Address (Office / Clinic)', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.sapphireBlue)),
              onPressed: _showAddSecondaryAddressDialog,
            ),

          const SizedBox(height: 16),

          // App Preferences & Language
          const Text(
            'Preferences & Support',
            style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppTheme.slateDark),
          ),
          const SizedBox(height: 10),

          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppTheme.slateBorder),
            ),
            child: Column(
              children: [
                ListTile(
                  leading: const Icon(Icons.translate_rounded, color: AppTheme.sapphireBlue),
                  title: const Text('App Language', style: TextStyle(fontSize: 13.5, fontWeight: FontWeight.w600)),
                  trailing: DropdownButton<String>(
                    value: _selectedLanguage,
                    underline: const SizedBox(),
                    items: ['English', 'Hindi (हिंदी)', 'Odia (ଓଡ଼ିଆ)', 'Marathi (मराठी)'].map((lang) {
                      return DropdownMenuItem(value: lang, child: Text(lang, style: const TextStyle(fontSize: 12)));
                    }).toList(),
                    onChanged: (val) {
                      if (val != null) setState(() => _selectedLanguage = val);
                    },
                  ),
                ),
                const Divider(height: 1, color: AppTheme.slateBorder),
                ListTile(
                  leading: const Icon(Icons.support_agent_rounded, color: AppTheme.sapphireBlue),
                  title: const Text('24/7 GTS Support Hotline', style: TextStyle(fontSize: 13.5, fontWeight: FontWeight.w600)),
                  subtitle: const Text('1800-GHAR-TAK (Toll Free)', style: TextStyle(fontSize: 11, color: AppTheme.slateMuted)),
                  trailing: const Icon(Icons.arrow_forward_ios_rounded, size: 14, color: AppTheme.slateMuted),
                  onTap: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Dialing GTS 24/7 Support: 1800-442-7825')),
                    );
                  },
                ),
              ],
            ),
          ),

          const SizedBox(height: 24),

          // Logout Button
          SizedBox(
            width: double.infinity,
            height: 48,
            child: OutlinedButton.icon(
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: Color(0xFFDC2626)),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              icon: const Icon(Icons.logout_rounded, color: Color(0xFFDC2626), size: 18),
              label: const Text(
                'LOG OUT OF GHAR TAK',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Color(0xFFDC2626)),
              ),
              onPressed: _showLogoutDialog,
            ),
          ),

          const SizedBox(height: 32),
        ],
      ),
    );
  }
}
