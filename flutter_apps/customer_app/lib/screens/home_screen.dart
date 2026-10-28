import 'package:flutter/material.dart';
import '../core/session_manager.dart';
import '../core/theme.dart';
import '../models/service_model.dart';
import '../models/user_model.dart';
import '../services/service_catalog_service.dart';
import 'profile_screen.dart';
import 'quote_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  UserModel? _currentUser;
  List<ServiceModel> _services = [];
  bool _isLoading = true;
  String _selectedPincode = '400001';

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    _currentUser = SessionManager.getCurrentUser();
    _selectedPincode = SessionManager.getPincode();
    final services = await ServiceCatalogService.getServices();
    setState(() {
      _services = services;
      _isLoading = false;
    });
  }

  void _showPincodeSelector() {
    final controller = TextEditingController(text: _selectedPincode);
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Change Service Pincode', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('Enter 6-digit postal code:', style: TextStyle(fontSize: 12, color: AppTheme.slateMuted)),
            const SizedBox(height: 10),
            TextField(
              controller: controller,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(border: OutlineInputBorder(), hintText: '400001'),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () async {
              final pin = controller.text.trim();
              if (pin.length == 6) {
                await SessionManager.savePincode(pin);
                setState(() => _selectedPincode = pin);
                Navigator.pop(ctx);
              }
            },
            child: const Text('Apply'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.slateLight,
      appBar: AppBar(
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: AppTheme.primaryAmberLight,
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(Icons.location_on_rounded, color: AppTheme.primaryAmberDark, size: 20),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: InkWell(
                onTap: _showPincodeSelector,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(
                          'Pincode: $_selectedPincode',
                          style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: AppTheme.slateDark),
                        ),
                        const Icon(Icons.keyboard_arrow_down_rounded, size: 18, color: AppTheme.slateMuted),
                      ],
                    ),
                    Text(
                      _currentUser?.address ?? 'Colaba, Mumbai, Maharashtra',
                      style: const TextStyle(fontSize: 11, color: AppTheme.slateMuted, fontWeight: FontWeight.w500),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.person_outline_rounded, color: AppTheme.slateDark),
            onPressed: () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const ProfileScreen()),
            ),
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.primaryAmber))
          : RefreshIndicator(
              onRefresh: _loadData,
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(18),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // ZEX-SHIELD AMC Banner
                    Container(
                      padding: const EdgeInsets.all(18),
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [AppTheme.slateDark, Color(0xFF1E293B)],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(22),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.12),
                            blurRadius: 16,
                            offset: const Offset(0, 6),
                          ),
                        ],
                      ),
                      child: Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                  decoration: BoxDecoration(
                                    color: AppTheme.primaryAmber,
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: const Text(
                                    'ZEX-SHIELD AMC',
                                    style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.white),
                                  ),
                                ),
                                const SizedBox(height: 8),
                                const Text(
                                  '₹0 Labor Charges on All Repairs',
                                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: Colors.white),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  'Includes unlimited circuit maintenance, MCB inspection, & emergency dispatch.',
                                  style: TextStyle(fontSize: 11, color: Colors.white.withOpacity(0.7)),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 12),
                          const Icon(Icons.verified_outlined, color: AppTheme.primaryAmber, size: 48),
                        ],
                      ),
                    ),

                    const SizedBox(height: 24),
                    const Text(
                      'Service Categories',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: AppTheme.slateDark),
                    ),
                    const SizedBox(height: 12),

                    // Category Chips Row
                    SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: [
                          _buildCategoryChip('Electrician', Icons.electric_bolt_rounded, true),
                          _buildCategoryChip('Plumber', Icons.plumbing_rounded, false),
                          _buildCategoryChip('AC Repair', Icons.ac_unit_rounded, false),
                          _buildCategoryChip('Appliance', Icons.kitchen_rounded, false),
                          _buildCategoryChip('Carpenter', Icons.handyman_rounded, false),
                        ],
                      ),
                    ),

                    const SizedBox(height: 24),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: const [
                        Text(
                          'Doorstep Electrical Services',
                          style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: AppTheme.slateDark),
                        ),
                        Text(
                          '18% GST',
                          style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppTheme.signalEmerald),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),

                    // Service List
                    ListView.separated(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: _services.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 14),
                      itemBuilder: (context, index) {
                        final service = _services[index];
                        return _buildServiceCard(service);
                      },
                    ),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildCategoryChip(String title, IconData icon, bool isSelected) {
    return Container(
      margin: const EdgeInsets.only(right: 10),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: isSelected ? AppTheme.slateDark : Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: isSelected ? AppTheme.slateDark : AppTheme.slateBorder),
      ),
      child: Row(
        children: [
          Icon(icon, size: 16, color: isSelected ? AppTheme.primaryAmber : AppTheme.slateMuted),
          const SizedBox(width: 8),
          Text(
            title,
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w700,
              color: isSelected ? Colors.white : AppTheme.slateDark,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildServiceCard(ServiceModel service) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppTheme.slateBorder),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(14),
                child: Image.asset(
                  service.imageAsset ?? 'assets/images/service_switchboard.png',
                  width: 68,
                  height: 68,
                  fit: BoxFit.cover,
                  errorBuilder: (_, __, ___) => Container(
                    width: 68,
                    height: 68,
                    color: AppTheme.primaryAmberLight,
                    child: const Icon(Icons.build_circle_outlined, color: AppTheme.primaryAmberDark),
                  ),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (service.isEmergencySosEligible) ...[
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: AppTheme.signalCrimsonBg,
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: const Text(
                          '24/7 EMERGENCY SOS ELIGIBLE',
                          style: TextStyle(fontSize: 9, fontWeight: FontWeight.w800, color: AppTheme.signalCrimson),
                        ),
                      ),
                      const SizedBox(height: 4),
                    ],
                    Text(
                      service.title,
                      style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: AppTheme.slateDark),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      service.description ?? 'Doorstep service by certified technician.',
                      style: const TextStyle(fontSize: 12, color: AppTheme.slateMuted, height: 1.3),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          const Divider(height: 1, color: AppTheme.slateBorder),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Base Labor + 18% GST', style: TextStyle(fontSize: 11, color: AppTheme.slateMuted)),
                  Text(
                    '₹${service.basePriceInr.toStringAsFixed(0)}',
                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: AppTheme.slateDark),
                  ),
                ],
              ),
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primaryAmber,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  elevation: 0,
                ),
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => QuoteScreen(service: service, pincode: _selectedPincode),
                    ),
                  );
                },
                child: const Text('Calculate Quote & Book', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 13)),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

