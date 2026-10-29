import 'package:flutter/material.dart';
import '../core/session_manager.dart';
import '../core/theme.dart';
import '../utils/indian_pincode_resolver.dart';
import 'views/home_dashboard_view.dart';
import 'views/book_services_view.dart';
import 'views/history_view.dart';
import 'views/profile_view.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _currentTab = 0;
  String _selectedCategory = 'All';
  String _currentPincode = '400001';
  String _currentAreaName = 'Fort / Marine Drive, Mumbai';
  int _logoTapCount = 0;

  @override
  void initState() {
    super.initState();
    _currentPincode = SessionManager.getPincode();
    final details = IndianPincodeResolver.resolvePincode(_currentPincode);
    _currentAreaName = details.areaName;
  }

  void _showPincodeSelector() {
    final controller = TextEditingController(text: _currentPincode);
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Change Service Pincode', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Enter 6-digit postal code to check live technician availability:', style: TextStyle(fontSize: 12, color: AppTheme.slateMuted)),
            const SizedBox(height: 12),
            TextField(
              controller: controller,
              keyboardType: TextInputType.number,
              maxLength: 6,
              decoration: const InputDecoration(
                border: OutlineInputBorder(),
                hintText: '400001',
                prefixIcon: Icon(Icons.location_on_rounded, color: AppTheme.sapphireBlue),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.sapphireBlue,
              foregroundColor: Colors.white,
            ),
            onPressed: () async {
              final pin = controller.text.trim();
              if (pin.length == 6) {
                await SessionManager.savePincode(pin);
                final details = IndianPincodeResolver.resolvePincode(pin);
                setState(() {
                  _currentPincode = pin;
                  _currentAreaName = details.areaName;
                });
                Navigator.pop(ctx);
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('Switched to ${details.areaName} ($pin)')),
                );
              }
            },
            child: const Text('Apply Pincode'),
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
            const Text('Configure backend API URL for local or staging testing:', style: TextStyle(fontSize: 12, color: AppTheme.slateMuted)),
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

  void _showNotificationCenter() {
    final hasJob = SessionManager.hasActiveJob();
    final hasAmc = SessionManager.hasActiveAmc();

    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Notifications & Alerts', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                IconButton(icon: const Icon(Icons.close_rounded), onPressed: () => Navigator.pop(ctx)),
              ],
            ),
            const SizedBox(height: 12),
            if (hasJob)
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: const CircleAvatar(backgroundColor: Color(0xFFDCFCE7), child: Icon(Icons.bolt, color: Color(0xFF15803D))),
                title: Text('Active Job ${SessionManager.getActiveJobTicketNumber()}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                subtitle: Text('Technician ${SessionManager.getActiveJobTechName()} is en route. Handover OTP: ${SessionManager.getActiveJobOtp()}'),
              ),
            if (hasAmc)
              const ListTile(
                contentPadding: EdgeInsets.zero,
                leading: CircleAvatar(backgroundColor: Color(0xFFEFF6FF), child: Icon(Icons.shield_rounded, color: AppTheme.sapphireBlue)),
                title: Text('ZEX-SHIELD AMC Active', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                subtitle: Text('Your membership is active with ₹0 labor charges across all services.'),
              ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        title: InkWell(
          onTap: _showPincodeSelector,
          borderRadius: BorderRadius.circular(10),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(7),
                decoration: BoxDecoration(
                  color: const Color(0xFFEFF6FF),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(Icons.location_on_rounded, color: AppTheme.sapphireBlue, size: 20),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(
                          'Pincode: $_currentPincode',
                          style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: AppTheme.slateDark),
                        ),
                        const Icon(Icons.keyboard_arrow_down_rounded, size: 16, color: AppTheme.slateMuted),
                      ],
                    ),
                    Text(
                      _currentAreaName,
                      style: const TextStyle(fontSize: 11, color: AppTheme.slateMuted, fontWeight: FontWeight.w500),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        actions: [
          // Secret 6-tap GTS logo
          GestureDetector(
            onTap: _handleLogoTap,
            child: Image.asset(
              'assets/images/logo_gts_nobg.png',
              width: 38,
              height: 38,
              errorBuilder: (_, __, ___) => const SizedBox(),
            ),
          ),
          IconButton(
            icon: Stack(
              children: [
                const Icon(Icons.notifications_none_rounded, color: AppTheme.slateDark),
                if (SessionManager.hasActiveJob())
                  Positioned(
                    right: 2,
                    top: 2,
                    child: Container(
                      width: 8,
                      height: 8,
                      decoration: const BoxDecoration(color: Color(0xFFDC2626), shape: BoxShape.circle),
                    ),
                  ),
              ],
            ),
            onPressed: _showNotificationCenter,
          ),
          const SizedBox(width: 4),
        ],
      ),
      body: IndexedStack(
        index: _currentTab,
        children: [
          // Tab 0: Home Dashboard
          HomeDashboardView(
            onSwitchTab: (idx) => setState(() => _currentTab = idx),
            onSelectCategory: (cat) => setState(() => _selectedCategory = cat),
          ),
          // Tab 1: Book Services Catalog
          BookServicesView(
            initialCategory: _selectedCategory,
          ),
          // Tab 2: History & Past Invoices
          HistoryView(
            onSwitchTab: (idx) => setState(() => _currentTab = idx),
          ),
          // Tab 3: Profile & Account
          ProfileView(
            onLogout: () {},
          ),
        ],
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentTab,
        onDestinationSelected: (idx) => setState(() => _currentTab = idx),
        backgroundColor: Colors.white,
        elevation: 8,
        indicatorColor: const Color(0xFFEFF6FF),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.home_outlined),
            selectedIcon: Icon(Icons.home_rounded, color: AppTheme.sapphireBlue),
            label: 'Home',
          ),
          NavigationDestination(
            icon: Icon(Icons.build_outlined),
            selectedIcon: Icon(Icons.build_rounded, color: AppTheme.sapphireBlue),
            label: 'Book',
          ),
          NavigationDestination(
            icon: Icon(Icons.receipt_long_outlined),
            selectedIcon: Icon(Icons.receipt_long_rounded, color: AppTheme.sapphireBlue),
            label: 'History',
          ),
          NavigationDestination(
            icon: Icon(Icons.person_outline_rounded),
            selectedIcon: Icon(Icons.person_rounded, color: AppTheme.sapphireBlue),
            label: 'Profile',
          ),
        ],
      ),
    );
  }
}
