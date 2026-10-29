import 'package:flutter/material.dart';
import '../../core/theme.dart';
import '../../models/tech_job_model.dart';
import '../../services/tech_job_service.dart';
import '../job_completion_screen.dart';
import '../safety_checklist_screen.dart';
import '../tech_navigation_screen.dart';

class TechJobsView extends StatefulWidget {
  final Function(int tabIndex) onSwitchTab;

  const TechJobsView({
    super.key,
    required this.onSwitchTab,
  });

  @override
  State<TechJobsView> createState() => _TechJobsViewState();
}

class _TechJobsViewState extends State<TechJobsView> {
  String _selectedFilter = 'All';
  bool _isLoading = true;
  List<TechJobModel> _allJobs = [];
  String _searchQuery = '';

  final List<String> _filters = ['All', 'Active', 'Completed', 'Cancelled'];

  @override
  void initState() {
    super.initState();
    _loadJobs();
  }

  Future<void> _loadJobs() async {
    setState(() => _isLoading = true);
    final jobs = await TechJobService.getAssignedJobs();
    if (mounted) {
      setState(() {
        _allJobs = jobs;
        _isLoading = false;
      });
    }
  }

  List<TechJobModel> get _filteredJobs {
    return _allJobs.where((j) {
      final matchesFilter = _selectedFilter == 'All' ||
          (_selectedFilter == 'Active' && (j.status == 'EN_ROUTE' || j.status == 'ARRIVED' || j.status == 'IN_PROGRESS' || j.status == 'DISPATCHED' || j.status == 'PENDING_ACCEPTANCE')) ||
          (_selectedFilter == 'Completed' && (j.status == 'COMPLETED' || j.status == 'WORK_COMPLETED')) ||
          (_selectedFilter == 'Cancelled' && j.status == 'CANCELLED');

      final matchesQuery = _searchQuery.isEmpty ||
          j.jobTicketNumber.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          j.serviceTitle.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          j.customerName.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          j.customerAddressText.toLowerCase().contains(_searchQuery.toLowerCase());

      return matchesFilter && matchesQuery;
    }).toList();
  }

  void _showJobDetailSheet(TechJobModel job) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        padding: const EdgeInsets.all(22),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Ticket #${job.jobTicketNumber}',
                  style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 18, color: TechTheme.flameOrange),
                ),
                IconButton(icon: const Icon(Icons.close_rounded), onPressed: () => Navigator.pop(ctx)),
              ],
            ),
            const SizedBox(height: 8),
            Text(job.serviceTitle, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: TechTheme.slateDark)),
            const SizedBox(height: 14),
            const Divider(),
            const SizedBox(height: 10),

            _buildDetailRow(Icons.person_outline_rounded, 'Customer', job.customerName),
            const SizedBox(height: 8),
            _buildDetailRow(Icons.phone_outlined, 'Phone', job.customerPhone),
            const SizedBox(height: 8),
            _buildDetailRow(Icons.location_on_outlined, 'Address', job.customerAddressText),
            const SizedBox(height: 8),
            _buildDetailRow(Icons.pin_drop_outlined, 'Pincode', job.pincode),
            const SizedBox(height: 8),
            _buildDetailRow(Icons.currency_rupee_rounded, 'Net Earning', '₹${job.techEarningInr.toStringAsFixed(0)} (Gross: ₹${job.totalAmountInr.toStringAsFixed(0)})'),
            const SizedBox(height: 8),
            _buildDetailRow(Icons.timeline_rounded, 'Current Status', job.status),

            const SizedBox(height: 20),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    style: OutlinedButton.styleFrom(
                      foregroundColor: TechTheme.signalCobalt,
                      side: const BorderSide(color: TechTheme.signalCobalt),
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                    onPressed: () {
                      Navigator.pop(ctx);
                      Navigator.push(context, MaterialPageRoute(builder: (_) => TechNavigationScreen(job: job)));
                    },
                    icon: const Icon(Icons.navigation_rounded),
                    label: const Text('NAVIGATE', style: TextStyle(fontWeight: FontWeight.bold)),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: TechTheme.flameOrange,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                    onPressed: () {
                      Navigator.pop(ctx);
                      if (job.status == 'IN_PROGRESS') {
                        Navigator.push(context, MaterialPageRoute(builder: (_) => JobCompletionScreen(job: job)));
                      } else {
                        Navigator.push(context, MaterialPageRoute(builder: (_) => SafetyChecklistScreen(job: job)));
                      }
                    },
                    icon: Icon(job.status == 'IN_PROGRESS' ? Icons.verified_rounded : Icons.bolt_rounded),
                    label: Text(job.status == 'IN_PROGRESS' ? 'COMPLETE' : 'SAFETY GATE', style: const TextStyle(fontWeight: FontWeight.bold)),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDetailRow(IconData icon, String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 18, color: TechTheme.slateMuted),
        const SizedBox(width: 10),
        SizedBox(
          width: 90,
          child: Text(label, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: TechTheme.slateMuted)),
        ),
        Expanded(
          child: Text(value, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: TechTheme.slateDark)),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Search & Filter Header
        Container(
          color: Colors.white,
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
          child: Column(
            children: [
              TextField(
                onChanged: (val) => setState(() => _searchQuery = val),
                decoration: InputDecoration(
                  hintText: 'Search ticket #, customer, address...',
                  hintStyle: const TextStyle(fontSize: 13, color: TechTheme.slateMuted),
                  prefixIcon: const Icon(Icons.search_rounded, size: 20, color: TechTheme.slateMuted),
                  filled: true,
                  fillColor: const Color(0xFFF8FAFC),
                  contentPadding: const EdgeInsets.symmetric(vertical: 0),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: TechTheme.slateBorder)),
                  enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: TechTheme.slateBorder)),
                ),
              ),
              const SizedBox(height: 10),
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: _filters.map((f) {
                    final isSel = _selectedFilter == f;
                    return Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: FilterChip(
                        label: Text(f),
                        selected: isSel,
                        onSelected: (_) => setState(() => _selectedFilter = f),
                        selectedColor: TechTheme.flameOrange,
                        labelStyle: TextStyle(
                          color: isSel ? Colors.white : TechTheme.slateDark,
                          fontWeight: isSel ? FontWeight.bold : FontWeight.w500,
                          fontSize: 12,
                        ),
                        backgroundColor: const Color(0xFFF1F5F9),
                        checkmarkColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20), side: BorderSide.none),
                      ),
                    );
                  }).toList(),
                ),
              ),
            ],
          ),
        ),

        // Jobs List
        Expanded(
          child: _isLoading
              ? const Center(child: CircularProgressIndicator(color: TechTheme.flameOrange))
              : RefreshIndicator(
                  onRefresh: _loadJobs,
                  color: TechTheme.flameOrange,
                  child: _filteredJobs.isEmpty
                      ? ListView(
                          physics: const AlwaysScrollableScrollPhysics(),
                          children: const [
                            SizedBox(height: 100),
                            Center(
                              child: Column(
                                children: [
                                  Icon(Icons.assignment_outlined, size: 48, color: TechTheme.slateMuted),
                                  SizedBox(height: 12),
                                  Text('No work orders found', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: TechTheme.slateDark)),
                                  SizedBox(height: 4),
                                  Text('Change filter or check duty status', style: TextStyle(fontSize: 12, color: TechTheme.slateMuted)),
                                ],
                              ),
                            ),
                          ],
                        )
                      : ListView.builder(
                          padding: const EdgeInsets.all(16),
                          itemCount: _filteredJobs.length,
                          itemBuilder: (ctx, idx) {
                            final job = _filteredJobs[idx];
                            return _buildJobCard(job);
                          },
                        ),
                ),
        ),
      ],
    );
  }

  Widget _buildJobCard(TechJobModel job) {
    final isDone = job.status == 'COMPLETED' || job.status == 'WORK_COMPLETED';
    final isCancelled = job.status == 'CANCELLED';

    Color statusBg = const Color(0xFFEFF6FF);
    Color statusColor = TechTheme.signalCobalt;
    if (isDone) {
      statusBg = TechTheme.signalOnlineBg;
      statusColor = TechTheme.signalOnlineEmerald;
    } else if (isCancelled) {
      statusBg = TechTheme.signalCrimsonBg;
      statusColor = TechTheme.signalCrimson;
    }

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: const BorderSide(color: TechTheme.slateBorder),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: () => _showJobDetailSheet(job),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('#${job.jobTicketNumber}', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 15, color: TechTheme.flameOrange)),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(color: statusBg, borderRadius: BorderRadius.circular(6)),
                    child: Text(job.status, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: statusColor)),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              Text(job.serviceTitle, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: TechTheme.slateDark)),
              const SizedBox(height: 8),
              Row(
                children: [
                  const Icon(Icons.location_on_outlined, size: 14, color: TechTheme.slateMuted),
                  const SizedBox(width: 4),
                  Expanded(
                    child: Text(
                      job.customerAddressText,
                      style: const TextStyle(fontSize: 11, color: TechTheme.slateMuted),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              const Divider(height: 1),
              const SizedBox(height: 10),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Customer: ${job.customerName}',
                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: TechTheme.slateDark),
                  ),
                  Text(
                    '₹${job.techEarningInr.toStringAsFixed(0)} Take-Home',
                    style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w900, color: TechTheme.signalOnlineEmerald),
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
