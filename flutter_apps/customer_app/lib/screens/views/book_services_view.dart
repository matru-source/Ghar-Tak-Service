import 'package:flutter/material.dart';
import '../../core/session_manager.dart';
import '../../core/theme.dart';
import '../../models/service_model.dart';
import '../../services/service_catalog_service.dart';
import '../address_booking_screen.dart';

class BookServicesView extends StatefulWidget {
  final String initialCategory;

  const BookServicesView({
    super.key,
    this.initialCategory = 'All',
  });

  @override
  State<BookServicesView> createState() => _BookServicesViewState();
}

class _BookServicesViewState extends State<BookServicesView> {
  List<ServiceModel> _allServices = [];
  bool _isLoading = true;
  String _selectedCategory = 'All';
  String _searchQuery = '';
  final TextEditingController _searchController = TextEditingController();

  final List<String> _categoryFilterOptions = [
    'All',
    'Fans & Fixtures',
    'Lighting',
    'Switchboards & MCB',
    'Heavy Appliances/Geyser',
    'House Wiring',
    'Plumbing',
    'Appliance Repair',
  ];

  @override
  void initState() {
    super.initState();
    _selectedCategory = widget.initialCategory;
    _loadCatalog();
  }

  @override
  void didUpdateWidget(covariant BookServicesView oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.initialCategory != oldWidget.initialCategory && widget.initialCategory.isNotEmpty) {
      setState(() => _selectedCategory = widget.initialCategory);
    }
  }

  Future<void> _loadCatalog() async {
    setState(() => _isLoading = true);
    final services = await ServiceCatalogService.getServices();
    if (mounted) {
      setState(() {
        _allServices = services;
        _isLoading = false;
      });
    }
  }

  List<ServiceModel> get _filteredServices {
    return _allServices.filterServices(_selectedCategory, _searchQuery);
  }

  void _handleBookNow(ServiceModel service) {
    if (SessionManager.hasActiveJob()) {
      final ticket = SessionManager.getActiveJobTicketNumber();
      showDialog(
        context: context,
        builder: (ctx) => AlertDialog(
          icon: const Icon(Icons.info_rounded, color: AppTheme.sapphireBlue, size: 36),
          title: const Text('Active Job in Progress', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
          content: Text(
            'You have an active job in progress ($ticket). Please wait for completion before booking another service.',
            style: const TextStyle(fontSize: 13, color: AppTheme.slateMuted),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('DISMISS')),
          ],
        ),
      );
      return;
    }

    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => AddressBookingScreen(service: service),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator(color: AppTheme.sapphireBlue));
    }

    final services = _filteredServices;

    return RefreshIndicator(
      onRefresh: _loadCatalog,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Top Hero Banner (Sapphire Blue 900)
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: const Color(0xFF0F2B48),
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.1),
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
                      const Text(
                        'BOOK DOORSTEP SERVICES',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 14,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 0.5,
                        ),
                      ),
                      InkWell(
                        onTap: _loadCatalog,
                        borderRadius: BorderRadius.circular(8),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: Colors.cyanAccent.withOpacity(0.15),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.sync_rounded, color: Colors.white, size: 12),
                              const SizedBox(width: 4),
                              Text(
                                '${_allServices.length} Services',
                                style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  const Text(
                    'Select any service below to enter your address & view nearby verified trade technicians ready for dispatch.',
                    style: TextStyle(color: Color(0xFFBBDEFB), fontSize: 11.5, height: 1.3),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 14),

            // Horizontal Filter Carousel
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: _categoryFilterOptions.map((cat) {
                  final isSelected = _selectedCategory.toLowerCase() == cat.toLowerCase();
                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: InkWell(
                      onTap: () => setState(() => _selectedCategory = cat),
                      borderRadius: BorderRadius.circular(20),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
                        decoration: BoxDecoration(
                          color: isSelected ? AppTheme.sapphireBlue : const Color(0xFFF1F5F9),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(
                            color: isSelected ? AppTheme.sapphireBlue : const Color(0xFFCBD5E1),
                          ),
                        ),
                        child: Text(
                          cat,
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                            color: isSelected ? Colors.white : AppTheme.slateDark,
                          ),
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
            ),

            const SizedBox(height: 14),

            // Search Bar
            TextField(
              controller: _searchController,
              onChanged: (val) => setState(() => _searchQuery = val),
              decoration: InputDecoration(
                hintText: 'Search services (e.g. MCB, Fan, Rewiring)...',
                hintStyle: const TextStyle(fontSize: 13, color: AppTheme.slateMuted),
                prefixIcon: const Icon(Icons.search_rounded, color: AppTheme.sapphireBlue, size: 20),
                suffixIcon: _searchQuery.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear_rounded, size: 18),
                        onPressed: () {
                          _searchController.clear();
                          setState(() => _searchQuery = '');
                        },
                      )
                    : null,
                contentPadding: const EdgeInsets.symmetric(vertical: 12),
                filled: true,
                fillColor: Colors.white,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: AppTheme.slateBorder),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: AppTheme.slateBorder),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: AppTheme.sapphireBlue),
                ),
              ),
            ),

            const SizedBox(height: 14),

            // Count Indicator
            Text(
              'AVAILABLE SERVICES (${services.length})',
              style: const TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.bold,
                color: AppTheme.slateMuted,
                letterSpacing: 0.5,
              ),
            ),

            const SizedBox(height: 10),

            // Service Cards List
            if (services.isEmpty)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: AppTheme.slateBorder),
                ),
                child: Column(
                  children: [
                    const Icon(Icons.search_off_rounded, size: 36, color: AppTheme.slateMuted),
                    const SizedBox(height: 8),
                    const Text('No matching services found', style: TextStyle(fontWeight: FontWeight.bold)),
                    const SizedBox(height: 4),
                    TextButton(
                      onPressed: () {
                        _searchController.clear();
                        setState(() {
                          _selectedCategory = 'All';
                          _searchQuery = '';
                        });
                      },
                      child: const Text('Reset Search & Filters'),
                    ),
                  ],
                ),
              )
            else
              ListView.separated(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: services.length,
                separatorBuilder: (_, __) => const SizedBox(height: 14),
                itemBuilder: (context, index) {
                  final service = services[index];
                  return _buildServiceBookingCard(service);
                },
              ),

            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _buildServiceBookingCard(ServiceModel service) {
    final imageAsset = _resolveImageAsset(service.title, service.category);
    final isHighVoltage = service.title.toLowerCase().contains('mcb') ||
        service.title.toLowerCase().contains('wiring') ||
        service.title.toLowerCase().contains('meter') ||
        service.title.toLowerCase().contains('short circuit');

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.slateBorder),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 8,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Category Pill & Rating/Duration Row
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: AppTheme.sapphireBlue.withOpacity(0.08),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  service.category.toUpperCase(),
                  style: const TextStyle(
                    color: AppTheme.sapphireBlue,
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              Row(
                children: [
                  const Icon(Icons.star_rounded, color: Color(0xFFF59E0B), size: 14),
                  const SizedBox(width: 3),
                  const Text('4.8', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                  const SizedBox(width: 6),
                  Text('• ${service.durationMinutes} mins', style: const TextStyle(fontSize: 11, color: AppTheme.slateMuted)),
                ],
              ),
            ],
          ),

          const SizedBox(height: 10),

          // Illustration + Title + Description
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: Container(
                  width: 58,
                  height: 58,
                  color: const Color(0xFFF8FAFC),
                  padding: const EdgeInsets.all(3),
                  child: Image.asset(
                    imageAsset,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => const Icon(Icons.bolt, color: AppTheme.sapphireBlue),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      service.title,
                      style: const TextStyle(fontSize: 14.5, fontWeight: FontWeight.bold, color: AppTheme.slateDark),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      service.description ?? 'Doorstep service performed by verified technicians.',
                      style: const TextStyle(fontSize: 11.5, color: AppTheme.slateMuted, height: 1.3),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
            ],
          ),

          const SizedBox(height: 12),

          // Warranty & Safety Badge Row
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                decoration: BoxDecoration(
                  color: const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Row(
                  children: const [
                    Icon(Icons.verified_rounded, color: AppTheme.signalEmerald, size: 11),
                    SizedBox(width: 3),
                    Text('6-Month Warranty', style: TextStyle(fontSize: 10, color: AppTheme.slateDark)),
                  ],
                ),
              ),
              if (isHighVoltage) ...[
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                  decoration: BoxDecoration(
                    color: const Color(0xFFDC2626).withOpacity(0.08),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Row(
                    children: const [
                      Icon(Icons.electric_bolt_rounded, color: Color(0xFFDC2626), size: 11),
                      SizedBox(width: 3),
                      Text('1000V Certified Only', style: TextStyle(fontSize: 10, color: Color(0xFFDC2626), fontWeight: FontWeight.bold)),
                    ],
                  ),
                ),
              ],
            ],
          ),

          const SizedBox(height: 12),
          const Divider(height: 1, color: AppTheme.slateBorder),
          const SizedBox(height: 12),

          // Price + Book Now Button
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '₹${service.basePriceInr.toStringAsFixed(0)}',
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w900,
                      color: Color(0xFF0F2B48),
                    ),
                  ),
                  const Text(
                    '+ 18% GST Applicable',
                    style: TextStyle(fontSize: 10, color: AppTheme.slateMuted),
                  ),
                ],
              ),
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.sapphireBlue,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
                onPressed: () => _handleBookNow(service),
                child: const Text('BOOK NOW', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
              ),
            ],
          ),
        ],
      ),
    );
  }

  String _resolveImageAsset(String title, String category) {
    final t = title.toLowerCase();
    if (t.contains('fan')) return 'assets/images/service_fan.png';
    if (t.contains('geyser') || t.contains('heater')) return 'assets/images/service_geyser.png';
    if (t.contains('light') || t.contains('chandelier') || t.contains('led')) return 'assets/images/service_light.png';
    if (t.contains('switch') || t.contains('mcb') || t.contains('socket')) return 'assets/images/service_switchboard.png';
    if (t.contains('wire') || t.contains('wiring')) return 'assets/images/service_wiring.png';
    return 'assets/images/service_switchboard.png';
  }
}

extension on List<ServiceModel> {
  List<ServiceModel> filterServices(String category, String query) {
    return where((item) {
      final matchesCat = category == 'All' ||
          item.category.toLowerCase().contains(category.toLowerCase()) ||
          (category.contains('Fan') && item.title.toLowerCase().contains('fan')) ||
          (category.contains('Light') && item.title.toLowerCase().contains('light')) ||
          (category.contains('Switchboard') && (item.title.toLowerCase().contains('switch') || item.title.toLowerCase().contains('mcb'))) ||
          (category.contains('Wiring') && item.title.toLowerCase().contains('wir'));

      final q = query.trim().toLowerCase();
      final matchesQuery = q.isEmpty ||
          item.title.toLowerCase().contains(q) ||
          (item.description?.toLowerCase().contains(q) ?? false) ||
          item.category.toLowerCase().contains(q);

      return matchesCat && matchesQuery;
    }).toList();
  }
}

