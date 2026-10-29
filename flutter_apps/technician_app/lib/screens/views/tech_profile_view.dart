import 'package:flutter/material.dart';
import '../../core/session_manager.dart';
import '../../core/theme.dart';
import '../../models/technician_model.dart';
import '../tech_auth_screen.dart';

class TechProfileView extends StatefulWidget {
  final VoidCallback onLogout;

  const TechProfileView({
    super.key,
    required this.onLogout,
  });

  @override
  State<TechProfileView> createState() => _TechProfileViewState();
}

class _TechProfileViewState extends State<TechProfileView> {
  TechnicianModel? _technician;
  int _logoTapCount = 0;

  @override
  void initState() {
    super.initState();
    _technician = SessionManager.getCurrentTechnician() ?? TechnicianModel(
      id: 'tech_rajesh_01',
      fullName: 'Rajesh Kumar',
      phone: '+91 98200 12345',
      badgeNumber: 'GTS-TECH-101',
      walletBalance: 1033.0,
      assignedPincode: '400001',
    );
  }

  void _showEditProfileDialog() {
    final nameCtrl = TextEditingController(text: _technician?.fullName);
    final phoneCtrl = TextEditingController(text: _technician?.phone);
    final emailCtrl = TextEditingController(text: _technician?.email);
    final pinCtrl = TextEditingController(text: _technician?.assignedPincode);
    final langCtrl = TextEditingController(text: _technician?.languages);

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Edit Partner Details', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(controller: nameCtrl, decoration: const InputDecoration(labelText: 'Full Name', border: OutlineInputBorder())),
              const SizedBox(height: 10),
              TextField(controller: phoneCtrl, decoration: const InputDecoration(labelText: 'Mobile Number', border: OutlineInputBorder())),
              const SizedBox(height: 10),
              TextField(controller: emailCtrl, decoration: const InputDecoration(labelText: 'Email Address', border: OutlineInputBorder())),
              const SizedBox(height: 10),
              TextField(controller: pinCtrl, decoration: const InputDecoration(labelText: 'Assigned Hub Pincode', border: OutlineInputBorder())),
              const SizedBox(height: 10),
              TextField(controller: langCtrl, decoration: const InputDecoration(labelText: 'Spoken Languages', border: OutlineInputBorder())),
            ],
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: TechTheme.flameOrange, foregroundColor: Colors.white),
            onPressed: () async {
              final updated = _technician?.copyWith(
                fullName: nameCtrl.text.trim(),
                phone: phoneCtrl.text.trim(),
                email: emailCtrl.text.trim(),
                assignedPincode: pinCtrl.text.trim(),
                languages: langCtrl.text.trim(),
              );
              if (updated != null) {
                await SessionManager.saveCurrentTechnician(updated);
                setState(() => _technician = updated);
              }
              Navigator.pop(ctx);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Partner details updated successfully!')),
              );
            },
            child: const Text('Save Changes'),
          ),
        ],
      ),
    );
  }

  void _handleLogoTap() {
    _logoTapCount++;
    if (_logoTapCount >= 6) {
      _logoTapCount = 0;
      _showEnvSwitcher();
    }
  }

  void _showEnvSwitcher() {
    final ctrl = TextEditingController(text: SessionManager.getBaseUrl());
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Developer API Switcher', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('Configure backend API URL for local or staging testing:', style: TextStyle(fontSize: 12, color: TechTheme.slateMuted)),
            const SizedBox(height: 10),
            TextField(controller: ctrl, decoration: const InputDecoration(border: OutlineInputBorder())),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () async {
              await SessionManager.setBaseUrl(ctrl.text.trim());
              Navigator.pop(ctx);
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text('Base URL set to ${ctrl.text.trim()}')),
              );
            },
            child: const Text('Save'),
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
        title: const Text('Sign Out of Console?', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        content: const Text(
          'Your duty status will be toggled OFFLINE and incoming doorstep dispatches will pause until you sign in again.',
          style: TextStyle(fontSize: 13, color: TechTheme.slateMuted),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: TechTheme.signalCrimson, foregroundColor: Colors.white),
            onPressed: () async {
              await SessionManager.logout();
              Navigator.pop(ctx);
              Navigator.pushAndRemoveUntil(
                context,
                MaterialPageRoute(builder: (_) => const TechAuthScreen()),
                (route) => false,
              );
            },
            child: const Text('Sign Out'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final tech = _technician;
    final name = tech?.fullName ?? 'Rajesh Kumar';

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          // Header Card
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: TechTheme.slateBorder),
            ),
            child: Row(
              children: [
                GestureDetector(
                  onTap: _handleLogoTap,
                  child: Container(
                    width: 60,
                    height: 60,
                    decoration: BoxDecoration(
                      color: TechTheme.flameOrange,
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(color: TechTheme.flameOrange.withOpacity(0.3), blurRadius: 10, offset: const Offset(0, 4)),
                      ],
                    ),
                    alignment: Alignment.center,
                    child: Text(
                      name.isNotEmpty ? name.substring(0, 1).toUpperCase() : 'T',
                      style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white),
                    ),
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Flexible(
                            child: Text(
                              name,
                              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: TechTheme.slateDark),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          const SizedBox(width: 6),
                          const Icon(Icons.verified_rounded, color: TechTheme.flameOrange, size: 18),
                        ],
                      ),
                      const SizedBox(height: 2),
                      Text('Badge: ${tech?.badgeNumber ?? "GTS-TECH-101"}', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: TechTheme.slateMuted)),
                      const SizedBox(height: 2),
                      Text('Hub: ${tech?.assignedPincode ?? "400001"} • ${tech?.specialization ?? "Certified Electrician"}', style: const TextStyle(fontSize: 11, color: TechTheme.slateMuted)),
                    ],
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.edit_note_rounded, color: TechTheme.flameOrange),
                  onPressed: _showEditProfileDialog,
                ),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // Verification Badges Row
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: TechTheme.slateBorder),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('FIELD QUALIFICATIONS & BADGES', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: TechTheme.slateMuted, letterSpacing: 0.5)),
                const SizedBox(height: 12),
                _buildBadgeItem(Icons.bolt_rounded, '1000V Dielectric Safety Certified', 'Active & Verified', TechTheme.flameOrange),
                const SizedBox(height: 10),
                _buildBadgeItem(Icons.shield_rounded, 'Police Background Verification', 'Cleared & Cleared on File', TechTheme.signalOnlineEmerald),
                const SizedBox(height: 10),
                _buildBadgeItem(Icons.card_membership_rounded, 'Trade License & Tool Calibration', 'PWD/MH/ELEC-883921', TechTheme.signalCobalt),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // Actions Menu Card
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: TechTheme.slateBorder),
            ),
            child: Column(
              children: [
                ListTile(
                  leading: const Icon(Icons.support_agent_rounded, color: TechTheme.signalCobalt),
                  title: const Text('24x7 GTS Field Support Hotline', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                  subtitle: const Text('Toll-free priority assistance for active field orders', style: TextStyle(fontSize: 11)),
                  trailing: const Icon(Icons.chevron_right_rounded),
                  onTap: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Dialing GTS Support Desk: 1800-419-GHAR (Toll-Free)')),
                    );
                  },
                ),
                const Divider(height: 1),
                ListTile(
                  leading: const Icon(Icons.settings_suggest_rounded, color: TechTheme.flameOrange),
                  title: const Text('Developer API Switcher', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                  subtitle: Text(SessionManager.getBaseUrl(), style: const TextStyle(fontSize: 11), maxLines: 1, overflow: TextOverflow.ellipsis),
                  trailing: const Icon(Icons.chevron_right_rounded),
                  onTap: _showEnvSwitcher,
                ),
                const Divider(height: 1),
                ListTile(
                  leading: const Icon(Icons.logout_rounded, color: TechTheme.signalCrimson),
                  title: const Text('Sign Out', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: TechTheme.signalCrimson)),
                  subtitle: const Text('Toggle offline & clear local technician credentials', style: TextStyle(fontSize: 11)),
                  trailing: const Icon(Icons.chevron_right_rounded),
                  onTap: _showLogoutDialog,
                ),
              ],
            ),
          ),

          const SizedBox(height: 24),
          const Text('Ghar Tak Partner Console v2.0.0 (Build 2026)', style: TextStyle(fontSize: 11, color: TechTheme.slateMuted)),
        ],
      ),
    );
  }

  Widget _buildBadgeItem(IconData icon, String title, String subtitle, Color color) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(10)),
          child: Icon(icon, color: color, size: 20),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: TechTheme.slateDark)),
              Text(subtitle, style: const TextStyle(fontSize: 10, color: TechTheme.slateMuted)),
            ],
          ),
        ),
      ],
    );
  }
}

