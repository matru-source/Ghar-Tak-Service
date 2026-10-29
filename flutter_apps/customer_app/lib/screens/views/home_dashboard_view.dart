import 'package:flutter/material.dart';
import '../../core/session_manager.dart';
import '../../core/theme.dart';
import '../../models/service_model.dart';
import '../../models/user_model.dart';
import '../../services/service_catalog_service.dart';
import '../address_booking_screen.dart';
import '../active_job_screen.dart';
import '../../models/job_model.dart';

class HomeDashboardView extends StatefulWidget {
  final Function(int tabIndex) onSwitchTab;
  final Function(String category) onSelectCategory;

  const HomeDashboardView({
    super.key,
    required this.onSwitchTab,
    required this.onSelectCategory,
  });

  @override
  State<HomeDashboardView> createState() => _HomeDashboardViewState();
}

class _HomeDashboardViewState extends State<HomeDashboardView> {
  List<ServiceModel> _services = [];
  bool _isLoading = true;
  bool _hasActiveJob = false;
  UserModel? _user;

  final List<Map<String, dynamic>> _allCategories = [
    {'name': 'Electrical', 'icon': Icons.electric_bolt_rounded, 'color': Color(0xFF2563EB)},
    {'name': 'Fans & Fixtures', 'icon': Icons.mode_fan_off_rounded, 'color': Color(0xFF0284C7)},
    {'name': 'Lighting', 'icon': Icons.lightbulb_rounded, 'color': Color(0xFFD97706)},
    {'name': 'Switchboards', 'icon': Icons.power_rounded, 'color': Color(0xFF4F46E5)},
    {'name': 'Geyser & Heavy', 'icon': Icons.water_drop_rounded, 'color': Color(0xFF0D9488)},
    {'name': 'House Wiring', 'icon': Icons.cable_rounded, 'color': Color(0xFF9333EA)},
    {'name': 'Plumbing', 'icon': Icons.plumbing_rounded, 'color': Color(0xFF0891B2)},
    {'name': 'AC Servicing', 'icon': Icons.ac_unit_rounded, 'color': Color(0xFF059669)},
    {'name': 'Appliance Repair', 'icon': Icons.kitchen_rounded, 'color': Color(0xFFEA580C)},
    {'name': 'Carpentry', 'icon': Icons.handyman_rounded, 'color': Color(0xFFB45309)},
    {'name': 'Deep Cleaning', 'icon': Icons.cleaning_services_rounded, 'color': Color(0xFF16A34A)},
    {'name': 'Painting', 'icon': Icons.format_paint_rounded, 'color': Color(0xFFDB2777)},
    {'name': 'Masonry & Tiles', 'icon': Icons.grid_view_rounded, 'color': Color(0xFF64748B)},
    {'name': 'Washing Machine', 'icon': Icons.local_laundry_service_rounded, 'color': Color(0xFF4338CA)},
    {'name': 'Water Purifier', 'icon': Icons.filter_alt_rounded, 'color': Color(0xFF0284C7)},
    {'name': 'Smart Home', 'icon': Icons.videocam_rounded, 'color': Color(0xFF475569)},
    {'name': 'Inverter & Battery', 'icon': Icons.battery_charging_full_rounded, 'color': Color(0xFFE11D48)},
    {'name': 'Emergency SOS', 'icon': Icons.emergency_rounded, 'color': Color(0xFFDC2626)},
  ];

  @override
  void initState() {
    super.initState();
    _loadDashboardData();
  }

  Future<void> _loadDashboardData() async {
    setState(() => _isLoading = true);
    _user = SessionManager.getCurrentUser();
    _hasActiveJob = SessionManager.hasActiveJob();
    final list = await ServiceCatalogService.getServices();
    if (mounted) {
      setState(() {
        _services = list;
        _isLoading = false;
      });
    }
  }

  void _handleServiceClick(ServiceModel service) {
    if (SessionManager.hasActiveJob()) {
      _showActiveJobPrompt();
    } else {
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => AddressBookingScreen(service: service),
        ),
      );
    }
  }

  void _showActiveJobPrompt() {
    final ticket = SessionManager.getActiveJobTicketNumber();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        icon: const Icon(Icons.info_rounded, color: AppTheme.sapphireBlue, size: 36),
        title: const Text('Active Job in Progress', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('You have an active job in progress ($ticket).', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
            const SizedBox(height: 8),
            const Text(
              'Please wait for your current service to complete before booking a new one so your live tracking and OTP are preserved.',
              style: TextStyle(fontSize: 13, color: AppTheme.slateMuted, height: 1.4),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('CLOSE'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.sapphireBlue,
              foregroundColor: Colors.white,
            ),
            onPressed: () {
              Navigator.pop(ctx);
              _openActiveTracking();
            },
            child: const Text('VIEW LIVE TRACKING'),
          ),
        ],
      ),
    );
  }

  void _openActiveTracking() {
    final job = JobModel(
      id: SessionManager.getActiveJobId(),
      jobTicketNumber: SessionManager.getActiveJobTicketNumber(),
      serviceTitle: SessionManager.getActiveJobTitle(),
      status: SessionManager.getActiveJobStatus(),
      pincode: SessionManager.getPincode(),
      addressText: _user?.address ?? 'Customer Doorstep Location',
      technicianName: SessionManager.getActiveJobTechName(),
      technicianBadge: SessionManager.getActiveJobTechBadge(),
      technicianPhone: SessionManager.getActiveJobTechPhone(),
      handoverOtp: SessionManager.getActiveJobOtp(),
      totalAmountInr: SessionManager.getActiveJobTotal(),
      createdAt: DateTime.now().toIso8601String(),
    );

    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => ActiveJobScreen(initialJob: job)),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator(color: AppTheme.sapphireBlue));
    }

    return RefreshIndicator(
      onRefresh: _loadDashboardData,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ==========================================
            // 1. SECTION: Quick Actions (3 Cards with Chevrons)
            // ==========================================
            const Text(
              'Quick Actions',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.slateDark),
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(
                  child: _buildQuickActionCard(
                    icon: Icons.calendar_month_rounded,
                    iconBg: const Color(0xFFEFF6FF),
                    iconColor: AppTheme.sapphireBlue,
                    title: 'Book Service',
                    subtitle: 'Schedule visit',
                    onTap: () => widget.onSwitchTab(1),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: _buildQuickActionCard(
                    icon: Icons.location_on_rounded,
                    iconBg: const Color(0xFFEFF6FF),
                    iconColor: AppTheme.sapphireBlue,
                    title: 'Track Service',
                    subtitle: _hasActiveJob ? 'Live updates' : 'No active jobs',
                    onTap: () {
                      if (_hasActiveJob) {
                        _openActiveTracking();
                      } else {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('No active job in progress right now.')),
                        );
                      }
                    },
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: _buildQuickActionCard(
                    icon: Icons.receipt_long_rounded,
                    iconBg: const Color(0xFFEFF6FF),
                    iconColor: AppTheme.sapphireBlue,
                    title: 'History',
                    subtitle: 'Past invoices',
                    onTap: () => widget.onSwitchTab(2),
                  ),
                ),
              ],
            ),

            const SizedBox(height: 18),

            // ==========================================
            // 2. SECTION: Household service at your doorstep (18 Categories in 2 Rows)
            // ==========================================
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFFDE68A), width: 1.5),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.04),
                    blurRadius: 10,
                    offset: const Offset(0, 3),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Household service at your doorstep',
                        style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppTheme.slateDark),
                      ),
                      InkWell(
                        onTap: () => widget.onSwitchTab(1),
                        child: const Text(
                          'View All >',
                          style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.sapphireBlue),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Row 1 (9 categories)
                        Row(
                          children: _allCategories.take(9).map((cat) {
                            return _buildCategoryGridItem(cat);
                          }).toList(),
                        ),
                        const SizedBox(height: 12),
                        // Row 2 (9 categories)
                        Row(
                          children: _allCategories.skip(9).map((cat) {
                            return _buildCategoryGridItem(cat);
                          }).toList(),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 18),

            // ==========================================
            // 3. SECTION: Active Service Card (With Live Stepper & ETA)
            // ==========================================
            Row(
              children: [
                const Text(
                  'Active Service',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.slateDark),
                ),
                if (_hasActiveJob) ...[
                  const SizedBox(width: 8),
                  Container(
                    width: 8,
                    height: 8,
                    decoration: const BoxDecoration(
                      color: AppTheme.signalEmerald,
                      shape: BoxShape.circle,
                    ),
                  ),
                ],
              ],
            ),
            const SizedBox(height: 10),

            if (_hasActiveJob)
              _buildLiveActiveServiceCard()
            else
              _buildNoActiveBookingCard(),

            const SizedBox(height: 20),

            // ==========================================
            // 4. SECTION: Popular Electrical Offerings
            // ==========================================
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Popular Doorstep Services',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.slateDark),
                ),
                InkWell(
                  onTap: () => widget.onSwitchTab(1),
                  child: const Text(
                    'View Catalog >',
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.sapphireBlue),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),

            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: _services.take(4).length,
              separatorBuilder: (_, __) => const SizedBox(height: 12),
              itemBuilder: (context, idx) {
                final s = _services[idx];
                return _buildServiceRowCard(s);
              },
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _buildQuickActionCard({
    required IconData icon,
    required Color iconBg,
    required Color iconColor,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(14),
      child: Container(
        height: 94,
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppTheme.slateBorder),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.02),
              blurRadius: 6,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                    color: iconBg,
                    shape: BoxShape.circle,
                  ),
                  child: Icon(icon, color: iconColor, size: 18),
                ),
                const Icon(Icons.arrow_forward_ios_rounded, size: 12, color: AppTheme.slateMuted),
              ],
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.slateDark),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                Text(
                  subtitle,
                  style: const TextStyle(fontSize: 10, color: AppTheme.slateMuted),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCategoryGridItem(Map<String, dynamic> cat) {
    return InkWell(
      onTap: () {
        widget.onSelectCategory(cat['name'] as String);
        widget.onSwitchTab(1);
      },
      borderRadius: BorderRadius.circular(12),
      child: Container(
        width: 76,
        margin: const EdgeInsets.only(right: 10),
        child: Column(
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: (cat['color'] as Color).withOpacity(0.12),
                shape: BoxShape.circle,
                border: Border.all(color: (cat['color'] as Color).withOpacity(0.24)),
              ),
              child: Icon(cat['icon'] as IconData, color: cat['color'] as Color, size: 24),
            ),
            const SizedBox(height: 6),
            Text(
              cat['name'] as String,
              style: const TextStyle(fontSize: 10.5, fontWeight: FontWeight.w600, color: AppTheme.slateDark),
              textAlign: TextAlign.center,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLiveActiveServiceCard() {
    final title = SessionManager.getActiveJobTitle();
    final tech = SessionManager.getActiveJobTechName();
    final eta = SessionManager.getActiveJobEta();

    return InkWell(
      onTap: _openActiveTracking,
      borderRadius: BorderRadius.circular(18),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: const Color(0xFFE2E8F0)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.04),
              blurRadius: 10,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: Column(
          children: [
            // Top Row: Status Dot & Technician En Route Chip
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Container(
                      width: 8,
                      height: 8,
                      decoration: const BoxDecoration(
                        color: AppTheme.signalEmerald,
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 6),
                    const Text(
                      'Active Doorstep Service',
                      style: TextStyle(color: AppTheme.sapphireBlue, fontSize: 13, fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: const Color(0xFFDCFCE7),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: const Color(0xFFBBF7D0)),
                  ),
                  child: Row(
                    children: const [
                      Icon(Icons.directions_bike_rounded, size: 12, color: Color(0xFF15803D)),
                      SizedBox(width: 4),
                      Text(
                        'Technician En Route',
                        style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF15803D)),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),

            // Product image + Service Info + Technician Info
            Row(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(10),
                  child: Image.asset(
                    'assets/images/service_fan.png',
                    width: 52,
                    height: 52,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => Container(
                      width: 52,
                      height: 52,
                      color: AppTheme.sapphireBlueLight,
                      child: const Icon(Icons.bolt_rounded, color: AppTheme.sapphireBlue),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppTheme.slateDark),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 3),
                      Row(
                        children: [
                          const Icon(Icons.location_on_rounded, size: 12, color: AppTheme.slateMuted),
                          const SizedBox(width: 3),
                          Expanded(
                            child: Text(
                              _user?.address ?? 'Colaba, Mumbai • ${SessionManager.getPincode()}',
                              style: const TextStyle(fontSize: 11, color: AppTheme.slateMuted),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                // Technician mini avatar
                Row(
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(20),
                      child: Image.asset(
                        'assets/images/img_technician_rajesh.png',
                        width: 38,
                        height: 38,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => const CircleAvatar(
                          radius: 19,
                          backgroundColor: AppTheme.primaryAmber,
                          child: Icon(Icons.person, color: Colors.white, size: 20),
                        ),
                      ),
                    ),
                    const SizedBox(width: 6),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          tech,
                          style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppTheme.slateDark),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        Row(
                          children: const [
                            Icon(Icons.star_rounded, size: 12, color: Color(0xFFF59E0B)),
                            SizedBox(width: 2),
                            Text('4.9', style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.bold)),
                          ],
                        ),
                      ],
                    ),
                  ],
                ),
              ],
            ),

            const SizedBox(height: 12),
            const Divider(height: 1, color: Color(0xFFF1F5F9)),
            const SizedBox(height: 12),

            // Stepper Row with ETA Pill on Right
            Row(
              children: [
                Expanded(
                  child: Row(
                    children: [
                      _buildMiniStepItem(label: 'Confirmed', isDone: true, isActive: false),
                      _buildMiniStepDivider(isDone: true),
                      _buildMiniStepItem(label: 'En Route', isDone: false, isActive: true),
                      _buildMiniStepDivider(isDone: false),
                      _buildMiniStepItem(label: 'Arrived', isDone: false, isActive: false),
                      _buildMiniStepDivider(isDone: false),
                      _buildMiniStepItem(label: 'Complete', isDone: false, isActive: false),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
                  decoration: BoxDecoration(
                    color: const Color(0xFFEFF6FF),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: const Color(0xFFBFDBFE)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.local_shipping_rounded, color: AppTheme.sapphireBlue, size: 16),
                      const SizedBox(width: 4),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('ETA', style: TextStyle(fontSize: 8, fontWeight: FontWeight.bold, color: AppTheme.slateMuted)),
                          Text(eta, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: AppTheme.sapphireBlue)),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMiniStepItem({required String label, required bool isDone, required bool isActive}) {
    Color bg = const Color(0xFFCBD5E1);
    if (isDone) bg = AppTheme.signalEmerald;
    if (isActive) bg = AppTheme.sapphireBlue;

    return Expanded(
      child: Column(
        children: [
          Container(
            width: 14,
            height: 14,
            decoration: BoxDecoration(color: bg, shape: BoxShape.circle),
            child: isDone
                ? const Icon(Icons.check, size: 9, color: Colors.white)
                : (isActive
                    ? Center(
                        child: Container(
                          width: 5,
                          height: 5,
                          decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle),
                        ),
                      )
                    : null),
          ),
          const SizedBox(height: 3),
          Text(
            label,
            style: TextStyle(
              fontSize: 8.5,
              fontWeight: isActive || isDone ? FontWeight.bold : FontWeight.normal,
              color: isActive || isDone ? AppTheme.slateDark : AppTheme.slateMuted,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }

  Widget _buildMiniStepDivider({required bool isDone}) {
    return Container(
      width: 12,
      height: 2,
      color: isDone ? AppTheme.signalEmerald : const Color(0xFFCBD5E1),
      margin: const EdgeInsets.only(bottom: 12),
    );
  }

  Widget _buildNoActiveBookingCard() {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppTheme.slateBorder),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: const [
              Icon(Icons.check_circle_outline_rounded, color: AppTheme.signalEmerald, size: 20),
              SizedBox(width: 8),
              Text(
                'No active bookings right now.',
                style: TextStyle(fontSize: 13, color: AppTheme.slateMuted),
              ),
            ],
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.sapphireBlue,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
            onPressed: () => widget.onSwitchTab(1),
            child: const Text('BOOK NOW', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  Widget _buildServiceRowCard(ServiceModel s) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppTheme.slateBorder),
      ),
      child: Row(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(10),
            child: Image.asset(
              s.imageAsset ?? 'assets/images/service_fan.png',
              width: 54,
              height: 54,
              fit: BoxFit.cover,
              errorBuilder: (_, __, ___) => Container(
                width: 54,
                height: 54,
                color: AppTheme.sapphireBlueLight,
                child: const Icon(Icons.bolt, color: AppTheme.sapphireBlue),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  s.title,
                  style: const TextStyle(fontSize: 13.5, fontWeight: FontWeight.bold, color: AppTheme.slateDark),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 3),
                Row(
                  children: [
                    const Icon(Icons.star_rounded, size: 13, color: Color(0xFFF59E0B)),
                    const SizedBox(width: 3),
                    const Text('4.8', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                    const SizedBox(width: 6),
                    Text('• ${s.durationMinutes} mins', style: const TextStyle(fontSize: 11, color: AppTheme.slateMuted)),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  '₹${s.basePriceInr.toStringAsFixed(0)} + 18% GST',
                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: AppTheme.sapphireBlue),
                ),
              ],
            ),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.primaryAmber,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
            onPressed: () => _handleServiceClick(s),
            child: const Text('BOOK', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }
}

