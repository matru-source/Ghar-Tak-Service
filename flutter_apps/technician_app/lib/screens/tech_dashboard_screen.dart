import 'dart:async';
import 'package:flutter/material.dart';
import '../core/session_manager.dart';
import '../core/theme.dart';
import '../models/tech_job_model.dart';
import '../models/technician_model.dart';
import '../services/tech_auth_service.dart';
import '../services/tech_job_service.dart';
import '../services/telemetry_service.dart';
import '../widgets/dispatch_siren_dialog.dart';
import '../widgets/gps_tracker_widget.dart';
import 'job_completion_screen.dart';
import 'safety_checklist_screen.dart';
import 'tech_auth_screen.dart';
import 'wallet_screen.dart';

class TechDashboardScreen extends StatefulWidget {
  const TechDashboardScreen({super.key});

  @override
  State<TechDashboardScreen> createState() => _TechDashboardScreenState();
}

class _TechDashboardScreenState extends State<TechDashboardScreen> {
  TechnicianModel? _technician;
  bool _isOnline = true;
  bool _isLoading = true;
  List<TechJobModel> _assignedJobs = [];
  Timer? _jobPoller;

  @override
  void initState() {
    super.initState();
    _loadTechnicianData();
    _startPoller();
  }

  @override
  void dispose() {
    _jobPoller?.cancel();
    super.dispose();
  }

  Future<void> _loadTechnicianData() async {
    setState(() => _isLoading = true);
    _technician = SessionManager.getCurrentTechnician() ?? TechnicianModel(
      id: 'tech_rajesh_01',
      fullName: 'Rajesh Kumar',
      phone: '+91 98200 12345',
      badgeNumber: 'GTS-TECH-101',
      walletBalance: 1033.0,
    );
    _isOnline = SessionManager.isDutyOnline();

    final jobs = await TechJobService.getAssignedJobs();
    setState(() {
      _assignedJobs = jobs;
      _isLoading = false;
    });

    if (_isOnline) {
      TelemetryService.startLiveTelemetry();
    }
  }

  void _startPoller() {
    _jobPoller = Timer.periodic(const Duration(seconds: 5), (timer) async {
      if (!mounted) return;
      final jobs = await TechJobService.getAssignedJobs();
      if (mounted) {
        setState(() => _assignedJobs = jobs);
      }
    });
  }

  Future<void> _toggleDuty(bool value) async {
    setState(() => _isOnline = value);
    await TelemetryService.setDutyStatus(value);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(value ? 'You are now ONLINE. Dispatch radar active.' : 'You are now OFFLINE. Dispatches paused.'),
        backgroundColor: value ? TechTheme.signalOnlineEmerald : TechTheme.slateMuted,
      ),
    );
  }

  void _showSimulatedDispatch() {
    final mockJob = TechJobModel(
      id: 'mock_job_${DateTime.now().millisecondsSinceEpoch}',
      jobTicketNumber: 'J-${(1000 + DateTime.now().second)}',
      status: 'PENDING_ACCEPTANCE',
      serviceTitle: 'Emergency Fuse Box Flashover Diagnostic',
      customerName: 'Anil Mehta',
      customerPhone: '+91 98199 87654',
      customerAddressText: 'Flat 402, Sea Green View, Colaba, Mumbai 400001',
      pincode: '400001',
      totalAmountInr: 1475.0,
      techEarningInr: 1033.0,
    );

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => DispatchSirenDialog(
        job: mockJob,
        onResponse: (accepted) async {
          Navigator.pop(ctx);
          if (accepted) {
            final acceptedJob = mockJob.copyWith(status: 'ASSIGNED');
            setState(() {
              _assignedJobs.insert(0, acceptedJob);
            });
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Dispatch order accepted! Proceeding to premise navigation.'),
                backgroundColor: TechTheme.signalOnlineEmerald,
              ),
            );
          } else {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Dispatch order declined. Returning to pool.')),
            );
          }
        },
      ),
    );
  }

  Future<void> _advanceJobStep(TechJobModel job) async {
    String nextStatus;
    switch (job.status) {
      case 'ASSIGNED':
        nextStatus = 'EN_ROUTE';
        break;
      case 'EN_ROUTE':
        nextStatus = 'ARRIVED';
        break;
      case 'ARRIVED':
        // Navigate to Safety Checklist
        final res = await Navigator.push<bool>(
          context,
          MaterialPageRoute(builder: (_) => SafetyChecklistScreen(job: job)),
        );
        if (res == true) {
          _loadTechnicianData();
        }
        return;
      case 'SAFETY_CHECKED':
      case 'IN_PROGRESS':
        // Navigate to Job Completion Handover
        final res = await Navigator.push<bool>(
          context,
          MaterialPageRoute(builder: (_) => JobCompletionScreen(job: job)),
        );
        if (res == true) {
          _loadTechnicianData();
        }
        return;
      default:
        nextStatus = 'EN_ROUTE';
    }

    setState(() => _isLoading = true);
    await TechJobService.updateStatus(jobId: job.id, status: nextStatus);
    final updatedList = await TechJobService.getAssignedJobs();
    setState(() {
      _assignedJobs = updatedList;
      _isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: TechTheme.slateLight,
      appBar: AppBar(
        title: Row(
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(10),
              child: Image.asset(
                'assets/images/img_technician_rajesh.png',
                width: 36,
                height: 36,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => Container(
                  width: 36,
                  height: 36,
                  color: TechTheme.primaryAmberLight,
                  child: const Icon(Icons.person, color: TechTheme.primaryAmberDark, size: 20),
                ),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    _technician?.fullName ?? 'Rajesh Kumar',
                    style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15, color: TechTheme.slateDark),
                  ),
                  Text(
                    'Badge: ${_technician?.badgeNumber ?? "GTS-TECH-101"} • Zone MH-01',
                    style: const TextStyle(fontSize: 11, color: TechTheme.slateMuted),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.account_balance_wallet_outlined, color: TechTheme.slateDark),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const WalletScreen()),
              );
            },
          ),
          IconButton(
            icon: const Icon(Icons.logout_rounded, color: TechTheme.slateMuted),
            onPressed: () async {
              await SessionManager.logout();
              if (mounted) {
                Navigator.pushAndRemoveUntil(
                  context,
                  MaterialPageRoute(builder: (_) => const TechAuthScreen()),
                  (route) => false,
                );
              }
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadTechnicianData,
        color: TechTheme.primaryAmber,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Online / Offline Duty Switch Card
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                decoration: BoxDecoration(
                  color: _isOnline ? TechTheme.bgDark : Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: _isOnline ? TechTheme.bgDarkBorder : TechTheme.slateBorder),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.06),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        Container(
                          width: 12,
                          height: 12,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: _isOnline ? TechTheme.signalOnlineEmerald : TechTheme.signalOfflineSlate,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              _isOnline ? 'DUTY ONLINE' : 'DUTY OFFLINE',
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w900,
                                color: _isOnline ? Colors.white : TechTheme.slateDark,
                                letterSpacing: 0.8,
                              ),
                            ),
                            Text(
                              _isOnline ? 'Available for emergency dispatch' : 'Radar paused • Toggle to receive orders',
                              style: TextStyle(
                                fontSize: 11,
                                color: _isOnline ? Colors.white60 : TechTheme.slateMuted,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                    Switch.adaptive(
                      value: _isOnline,
                      activeColor: TechTheme.signalOnlineEmerald,
                      onChanged: _toggleDuty,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // Live GPS Radar Bar
              GpsTrackerWidget(
                isTracking: _isOnline,
                statusText: 'Fleet Telemetry: Colaba 400001 (Lat 18.922, Lng 72.834)',
              ),
              const SizedBox(height: 20),

              // Wallet & 70% Direct Payout Summary Card
              InkWell(
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const WalletScreen()),
                  );
                },
                borderRadius: BorderRadius.circular(20),
                child: Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFF1E293B), Color(0xFF0F172A)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'TODAY\'S COMMISSION EARNINGS',
                            style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: Colors.white60, letterSpacing: 1.0),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            '₹${(_technician?.walletBalance ?? 1033.0).toStringAsFixed(0)}',
                            style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w900, color: TechTheme.primaryAmber),
                          ),
                          const SizedBox(height: 4),
                          const Text(
                            'Direct 70% share • Instant UPI withdrawal',
                            style: TextStyle(fontSize: 11, color: Colors.white70),
                          ),
                        ],
                      ),
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.1),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.arrow_forward_ios_rounded, color: Colors.white, size: 18),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),

              // Active Work Orders Header
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'ACTIVE WORK ORDERS',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w800,
                      color: TechTheme.slateMuted,
                      letterSpacing: 1.0,
                    ),
                  ),
                  TextButton.icon(
                    icon: const Icon(Icons.notifications_active_rounded, size: 16, color: TechTheme.primaryAmberDark),
                    label: const Text('Test Siren Alert', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: TechTheme.primaryAmberDark)),
                    onPressed: _showSimulatedDispatch,
                  ),
                ],
              ),
              const SizedBox(height: 10),

              // Orders List
              if (_assignedJobs.isEmpty) ...[
                Container(
                  padding: const EdgeInsets.symmetric(vertical: 40, horizontal: 20),
                  width: double.infinity,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: TechTheme.slateBorder),
                  ),
                  child: Column(
                    children: const [
                      Icon(Icons.radar_rounded, size: 48, color: TechTheme.primaryAmberDark),
                      SizedBox(height: 14),
                      Text(
                        'Scanning Territory for Dispatches',
                        style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: TechTheme.slateDark),
                      ),
                      SizedBox(height: 4),
                      Text(
                        'Assigned to Colaba Zone (400001, 400005).\nTap "Test Siren Alert" above to test audio & haptic order dispatch.',
                        textAlign: TextAlign.center,
                        style: TextStyle(fontSize: 12, color: TechTheme.slateMuted, height: 1.4),
                      ),
                    ],
                  ),
                ),
              ] else ...[
                ..._assignedJobs.map((job) => _buildJobCard(job)),
              ],

              const SizedBox(height: 30),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildJobCard(TechJobModel job) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: TechTheme.slateBorder),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header: Ticket + Status
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Ticket #${job.jobTicketNumber}',
                style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13, color: TechTheme.slateDark),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: _getStatusBg(job.status),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  job.status,
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w900,
                    color: _getStatusColor(job.status),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),

          // Service Title
          Text(
            job.serviceTitle,
            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: TechTheme.slateDark),
          ),
          const SizedBox(height: 6),

          // Customer Premise Location
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Icon(Icons.location_on_outlined, color: TechTheme.primaryAmberDark, size: 18),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  '${job.customerAddressText} (PIN: ${job.pincode})',
                  style: const TextStyle(fontSize: 12, color: TechTheme.slateMuted, height: 1.3),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),

          // Customer Phone & Payout Row
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  const Icon(Icons.phone_outlined, size: 16, color: TechTheme.slateMuted),
                  const SizedBox(width: 4),
                  Text(
                    job.customerPhone,
                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: TechTheme.slateDark),
                  ),
                ],
              ),
              Text(
                'Earn: ₹${job.techEarningInr.toStringAsFixed(0)} (70%)',
                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w900, color: TechTheme.signalOnlineEmerald),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Action Button
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: _getActionButtonColor(job.status),
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 14),
              minimumSize: const Size.fromHeight(48),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            ),
            onPressed: () => _advanceJobStep(job),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(_getActionButtonIcon(job.status), size: 18),
                const SizedBox(width: 8),
                Text(
                  _getActionButtonLabel(job.status),
                  style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 13),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Color _getStatusBg(String status) {
    switch (status) {
      case 'WORK_COMPLETED':
        return TechTheme.signalOnlineBg;
      case 'SAFETY_CHECKED':
      case 'IN_PROGRESS':
        return TechTheme.signalCobaltBg;
      default:
        return TechTheme.primaryAmberLight;
    }
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'WORK_COMPLETED':
        return TechTheme.signalOnlineEmerald;
      case 'SAFETY_CHECKED':
      case 'IN_PROGRESS':
        return TechTheme.signalCobalt;
      default:
        return TechTheme.primaryAmberDark;
    }
  }

  Color _getActionButtonColor(String status) {
    switch (status) {
      case 'ARRIVED':
        return TechTheme.primaryAmberDark;
      case 'SAFETY_CHECKED':
      case 'IN_PROGRESS':
        return TechTheme.signalOnlineEmerald;
      default:
        return TechTheme.slateDark;
    }
  }

  IconData _getActionButtonIcon(String status) {
    switch (status) {
      case 'ASSIGNED':
        return Icons.navigation_rounded;
      case 'EN_ROUTE':
        return Icons.door_front_door_rounded;
      case 'ARRIVED':
        return Icons.health_and_safety_rounded;
      case 'SAFETY_CHECKED':
      case 'IN_PROGRESS':
        return Icons.checklist_rounded;
      default:
        return Icons.arrow_forward_rounded;
    }
  }

  String _getActionButtonLabel(String status) {
    switch (status) {
      case 'ASSIGNED':
        return 'START NAVIGATION (MARK EN ROUTE)';
      case 'EN_ROUTE':
        return 'MARK ARRIVED AT DOORSTEP';
      case 'ARRIVED':
        return 'OPEN MANDATORY SAFETY GATE';
      case 'SAFETY_CHECKED':
      case 'IN_PROGRESS':
        return 'COMPLETE JOB & VERIFY OTP';
      case 'WORK_COMPLETED':
        return 'VIEW FINAL SETTLEMENT';
      default:
        return 'UPDATE JOB STATUS';
    }
  }
}

