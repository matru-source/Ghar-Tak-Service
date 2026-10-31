import 'package:flutter/material.dart';
import '../core/session_manager.dart';
import '../core/theme.dart';
import '../models/technician_model.dart';
import 'views/tech_home_view.dart';
import 'views/tech_jobs_view.dart';
import 'views/tech_earnings_view.dart';
import 'views/tech_profile_view.dart';

class TechDashboardScreen extends StatefulWidget {
  const TechDashboardScreen({super.key});

  @override
  State<TechDashboardScreen> createState() => _TechDashboardScreenState();
}

class _TechDashboardScreenState extends State<TechDashboardScreen> {
  int _currentTab = 0;
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

  void _onNavigationDestinationSelected(int index) {
    setState(() => _currentTab = index);
  }

  @override
  Widget build(BuildContext context) {
    final isOnline = SessionManager.isDutyOnline();
    final hubPin = _technician?.assignedPincode ?? '400001';

    return Scaffold(
      backgroundColor: TechTheme.slateLight,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        title: Row(
          children: [
            GestureDetector(
              onTap: _handleLogoTap,
              child: Image.asset(
                'assets/images/logo_gts_nobg.png',
                width: 34,
                height: 34,
                errorBuilder: (_, __, ___) => const Icon(Icons.handyman_rounded, color: TechTheme.flameOrange),
              ),
            ),
            const SizedBox(width: 10),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(
                      'GTS Partner Console',
                      style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: TechTheme.slateDark),
                    ),
                    const SizedBox(width: 6),
                    Container(
                      width: 7,
                      height: 7,
                      decoration: BoxDecoration(
                        color: isOnline ? TechTheme.signalOnlineEmerald : TechTheme.slateMuted,
                        shape: BoxShape.circle,
                      ),
                    ),
                  ],
                ),
                Text(
                  'Assigned Territory: $hubPin Hub',
                  style: const TextStyle(fontSize: 11, color: TechTheme.slateMuted, fontWeight: FontWeight.w500),
                ),
              ],
            ),
          ],
        ),
      ),
      body: IndexedStack(
        index: _currentTab,
        children: [
          // Tab 0: Home Dashboard
          TechHomeView(
            onSwitchTab: (idx) => setState(() => _currentTab = idx),
          ),
          // Tab 1: All Work Orders
          TechJobsView(
            onSwitchTab: (idx) => setState(() => _currentTab = idx),
          ),
          // Tab 2: Earnings & Wallet
          const TechEarningsView(),
          // Tab 3: Profile & Qualifications
          TechProfileView(
            onLogout: () {},
          ),
        ],
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentTab,
        onDestinationSelected: _onNavigationDestinationSelected,
        backgroundColor: Colors.white,
        elevation: 8,
        indicatorColor: const Color(0xFFFFF3E0),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.home_outlined),
            selectedIcon: Icon(Icons.home_rounded, color: TechTheme.flameOrange),
            label: 'Home',
          ),
          NavigationDestination(
            icon: Icon(Icons.list_alt_outlined),
            selectedIcon: Icon(Icons.list_alt_rounded, color: TechTheme.flameOrange),
            label: 'Jobs',
          ),
          NavigationDestination(
            icon: Icon(Icons.bar_chart_outlined),
            selectedIcon: Icon(Icons.bar_chart_rounded, color: TechTheme.flameOrange),
            label: 'Earnings',
          ),
          NavigationDestination(
            icon: Icon(Icons.person_outline_rounded),
            selectedIcon: Icon(Icons.person_rounded, color: TechTheme.flameOrange),
            label: 'Profile',
          ),
        ],
      ),
    );
  }
}
