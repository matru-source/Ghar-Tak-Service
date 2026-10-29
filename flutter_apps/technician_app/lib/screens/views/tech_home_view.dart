import 'dart:async';
import 'package:flutter/material.dart';
import '../../core/session_manager.dart';
import '../../core/theme.dart';
import '../../core/realtime_stream_manager.dart';
import '../../core/audio_service.dart';
import '../../models/tech_job_model.dart';
import '../../models/technician_model.dart';
import '../../services/tech_job_service.dart';
import '../../services/telemetry_service.dart';
import '../job_completion_screen.dart';
import '../safety_checklist_screen.dart';
import '../tech_dispatch_alert_screen.dart';
import '../tech_navigation_screen.dart';

class TechHomeView extends StatefulWidget {
  final Function(int tabIndex) onSwitchTab;

  const TechHomeView({
    super.key,
    required this.onSwitchTab,
  });

  @override
  State<TechHomeView> createState() => _TechHomeViewState();
}

class _TechHomeViewState extends State<TechHomeView> {
  TechnicianModel? _technician;
  bool _isOnline = true;
  bool _isLoading = true;
  List<TechJobModel> _assignedJobs = [];
  Timer? _poller;
  StreamSubscription? _sseSub;

  TechJobModel? get _activeJob {
    try {
      return _assignedJobs.firstWhere(
        (j) => j.status == 'EN_ROUTE' || j.status == 'ARRIVED' || j.status == 'IN_PROGRESS' || j.status == 'DOORSTEP_ARRIVED',
      );
    } catch (_) {
      return _assignedJobs.isNotEmpty && _assignedJobs.first.status != 'COMPLETED' ? _assignedJobs.first : null;
    }
  }

  @override
  void initState() {
    super.initState();
    _loadData();
    _startPoller();
  }

  @override
  void dispose() {
    _sseSub?.cancel();
    _poller?.cancel();
    super.dispose();
  }

  Future<void> _loadData() async {
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
    if (mounted) {
      setState(() {
        _assignedJobs = jobs;
        _isLoading = false;
      });
    }

    if (_isOnline) {
      TelemetryService.startLiveTelemetry();
      _setupRealtimeStream();
    }
  }

  void _setupRealtimeStream() {
    _sseSub?.cancel();
    final sse = RealtimeStreamManager();
    sse.connect(technicianId: _technician?.id);
    _sseSub = sse.eventStream.listen((event) async {
      if (!mounted || !_isOnline) return;
      final type = event['type']?.toString() ?? '';
      if (type == 'DISPATCH_BROADCAST' ||
          type == 'NEW_JOB' ||
          type == 'TECH_DISPATCHED' ||
          type == 'EMERGENCY_SOS') {
        final jobs = await TechJobService.getAssignedJobs();
        if (!mounted) return;
        setState(() => _assignedJobs = jobs);
        final incoming = jobs.where((j) => j.status == 'DISPATCHED' || j.status == 'PENDING_ACCEPTANCE').toList();
        if (incoming.isNotEmpty) {
          _showIncomingDispatch(incoming.first);
        }
      }
    });
  }

  void _startPoller() {
    _poller = Timer.periodic(const Duration(seconds: 4), (timer) async {
      if (!mounted) return;
      final jobs = await TechJobService.getAssignedJobs();
      if (mounted) {
        // Check for newly dispatched job
        final incoming = jobs.where((j) => j.status == 'DISPATCHED' || j.status == 'PENDING_ACCEPTANCE').toList();
        if (incoming.isNotEmpty && _isOnline) {
          final target = incoming.first;
          if (_assignedJobs.every((j) => j.id != target.id || j.status != target.status)) {
            _showIncomingDispatch(target);
          }
        }
        setState(() => _assignedJobs = jobs);
      }
    });
  }

  void _showIncomingDispatch(TechJobModel job) {
    // Wake screen up from pocket / locked state
    AudioService.acquireScreenWakeLock();

    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => TechDispatchAlertScreen(
          job: job,
          onAccepted: (acceptedJob) {
            AudioService.releaseScreenWakeLock();
            setState(() {
              _assignedJobs = [acceptedJob, ..._assignedJobs.where((j) => j.id != acceptedJob.id)];
            });
            Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => TechNavigationScreen(job: acceptedJob)),
            );
          },
        ),
      ),
    );
  }

  Future<void> _toggleDuty(bool value) async {
    setState(() => _isOnline = value);
    await TelemetryService.setDutyStatus(value);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(value ? '🟢 You are now ONLINE. Dispatch radar active.' : '⚪ You are now OFFLINE. Dispatches paused.'),
        backgroundColor: value ? TechTheme.signalOnlineEmerald : TechTheme.slateMuted,
        duration: const Duration(seconds: 2),
      ),
    );
  }

  void _simulateIncomingDispatch() {
    final mockJob = TechJobModel(
      id: 'mock_job_${DateTime.now().millisecondsSinceEpoch}',
      jobTicketNumber: 'J-${(1000 + DateTime.now().second * 3)}',
      status: 'PENDING_ACCEPTANCE',
      serviceTitle: 'Emergency Fuse Box Flashover Diagnostic',
      customerName: 'Anil Mehta',
      customerPhone: '+91 98199 87654',
      customerAddressText: 'Flat 402, Sea Green View, Colaba, Mumbai 400001',
      pincode: '400001',
      customerLatitude: 18.9220,
      customerLongitude: 72.8347,
      totalAmountInr: 1475.0,
      techEarningInr: 1033.0,
      dispatchedAt: DateTime.now().toIso8601String(),
    );
    _showIncomingDispatch(mockJob);
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator(color: TechTheme.flameOrange));
    }

    final active = _activeJob;

    return RefreshIndicator(
      onRefresh: _loadData,
      color: TechTheme.flameOrange,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ==========================================
            // 1. ONLINE / OFFLINE DUTY RADAR BANNER
            // ==========================================
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(
                  color: _isOnline ? TechTheme.signalOnlineEmerald.withOpacity(0.3) : TechTheme.slateBorder,
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.04),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Row(
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: _isOnline ? TechTheme.signalOnlineBg : const Color(0xFFF1F5F9),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      _isOnline ? Icons.radar_rounded : Icons.power_settings_new_rounded,
                      color: _isOnline ? TechTheme.signalOnlineEmerald : TechTheme.slateMuted,
                      size: 24,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Text(
                              _isOnline ? 'DUTY ONLINE' : 'DUTY OFFLINE',
                              style: TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.w900,
                                color: _isOnline ? TechTheme.signalOnlineEmerald : TechTheme.slateMuted,
                                letterSpacing: 0.5,
                              ),
                            ),
                            const SizedBox(width: 6),
                            Container(
                              width: 8,
                              height: 8,
                              decoration: BoxDecoration(
                                color: _isOnline ? TechTheme.signalOnlineEmerald : TechTheme.slateMuted,
                                shape: BoxShape.circle,
                              ),
                            ),
                          ],
                        ),
                        Text(
                          _isOnline
                              ? 'GPS radar active in ${_technician?.assignedPincode ?? "400001"} hub'
                              : 'Tap switch to receive doorstep dispatches',
                          style: const TextStyle(fontSize: 12, color: TechTheme.slateMuted),
                        ),
                      ],
                    ),
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

            // ==========================================
            // 2. TODAY'S METRICS & EARNINGS BANNER
            // ==========================================
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF1E293B), Color(0xFF0F172A)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF0F172A).withOpacity(0.25),
                    blurRadius: 14,
                    offset: const Offset(0, 6),
                  ),
                ],
              ),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'TODAY\'S FIELD EARNINGS',
                            style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: Color(0xFF94A3B8), letterSpacing: 1),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            '₹${_technician?.walletBalance.toStringAsFixed(0) ?? "1033"}',
                            style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w900, color: Colors.white),
                          ),
                        ],
                      ),
                      ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: TechTheme.flameOrange,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        onPressed: () => widget.onSwitchTab(2),
                        icon: const Icon(Icons.account_balance_wallet_rounded, size: 16),
                        label: const Text('WALLET', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  const Divider(color: Color(0xFF334155), height: 1),
                  const SizedBox(height: 14),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      _buildMetricItem(Icons.task_alt_rounded, '${_technician?.completedJobsCount ?? 142}', 'Completed'),
                      _buildMetricItem(Icons.star_rounded, '${_technician?.rating ?? 4.9}★', 'Rating'),
                      _buildMetricItem(Icons.speed_rounded, '98%', 'Acceptance'),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // ==========================================
            // 3. LIVE ACTIVE WORK ORDER CARD
            // ==========================================
            if (active != null) ...[
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('ACTIVE WORK ORDER', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: TechTheme.slateDark, letterSpacing: 0.5)),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(color: TechTheme.signalOnlineBg, borderRadius: BorderRadius.circular(8)),
                    child: Text(active.status, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: TechTheme.signalOnlineEmerald)),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: TechTheme.flameOrange.withOpacity(0.4), width: 1.5),
                  boxShadow: [
                    BoxShadow(color: TechTheme.flameOrange.withOpacity(0.08), blurRadius: 12, offset: const Offset(0, 4)),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('#${active.jobTicketNumber}', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16, color: TechTheme.flameOrange)),
                        Text('₹${active.techEarningInr.toStringAsFixed(0)} Earning', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 14, color: TechTheme.signalOnlineEmerald)),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(active.serviceTitle, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: TechTheme.slateDark)),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        const Icon(Icons.location_on_rounded, size: 16, color: TechTheme.slateMuted),
                        const SizedBox(width: 6),
                        Expanded(child: Text(active.customerAddressText, style: const TextStyle(fontSize: 12, color: TechTheme.slateMuted), maxLines: 1, overflow: TextOverflow.ellipsis)),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        const Icon(Icons.person_outline_rounded, size: 16, color: TechTheme.slateMuted),
                        const SizedBox(width: 6),
                        Text(active.customerName, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: TechTheme.slateDark)),
                        const Spacer(),
                        Text('Pin: ${active.pincode}', style: const TextStyle(fontSize: 11, color: TechTheme.slateMuted)),
                      ],
                    ),
                    const SizedBox(height: 14),
                    const Divider(height: 1),
                    const SizedBox(height: 12),

                    // Action Grid
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton.icon(
                            style: OutlinedButton.styleFrom(
                              foregroundColor: TechTheme.signalCobalt,
                              side: const BorderSide(color: TechTheme.signalCobalt),
                              padding: const EdgeInsets.symmetric(vertical: 10),
                            ),
                            onPressed: () {
                              Navigator.push(context, MaterialPageRoute(builder: (_) => TechNavigationScreen(job: active)));
                            },
                            icon: const Icon(Icons.navigation_rounded, size: 16),
                            label: const Text('NAVIGATE', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: ElevatedButton.icon(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: TechTheme.flameOrange,
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(vertical: 10),
                            ),
                            onPressed: () {
                              if (active.status == 'IN_PROGRESS') {
                                Navigator.push(context, MaterialPageRoute(builder: (_) => JobCompletionScreen(job: active)));
                              } else {
                                Navigator.push(context, MaterialPageRoute(builder: (_) => SafetyChecklistScreen(job: active)));
                              }
                            },
                            icon: Icon(active.status == 'IN_PROGRESS' ? Icons.verified_rounded : Icons.bolt_rounded, size: 16),
                            label: Text(active.status == 'IN_PROGRESS' ? 'COMPLETE' : 'SAFETY GATE', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
            ],

            // ==========================================
            // 4. QUICK SIMULATION & DEMO ACTIONS
            // ==========================================
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: const Color(0xFFFFF7ED),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFFFEDD5)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.vibration_rounded, color: TechTheme.flameOrange, size: 28),
                  const SizedBox(width: 12),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Dispatch Siren Simulator', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: TechTheme.slateDark)),
                        Text('Trigger 60s incoming job siren radar for live test', style: TextStyle(fontSize: 11, color: TechTheme.slateMuted)),
                      ],
                    ),
                  ),
                  ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: TechTheme.flameOrange,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                    onPressed: _simulateIncomingDispatch,
                    child: const Text('TEST SIREN', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // ==========================================
            // 5. ASSIGNED JOBS QUEUE
            // ==========================================
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('RECENT WORK ORDERS', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: TechTheme.slateDark, letterSpacing: 0.5)),
                TextButton(
                  onPressed: () => widget.onSwitchTab(1),
                  child: const Text('VIEW ALL', style: TextStyle(fontWeight: FontWeight.bold, color: TechTheme.flameOrange, fontSize: 12)),
                ),
              ],
            ),
            const SizedBox(height: 8),

            if (_assignedJobs.isEmpty)
              Container(
                padding: const EdgeInsets.all(28),
                alignment: Alignment.center,
                decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: TechTheme.slateBorder)),
                child: const Column(
                  children: [
                    Icon(Icons.inbox_rounded, size: 40, color: TechTheme.slateMuted),
                    SizedBox(height: 10),
                    Text('No pending jobs assigned', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: TechTheme.slateDark)),
                    SizedBox(height: 4),
                    Text('Keep duty online to automatically receive dispatches', style: TextStyle(fontSize: 12, color: TechTheme.slateMuted)),
                  ],
                ),
              )
            else
              ..._assignedJobs.take(3).map((job) => _buildJobQueueItem(job)),

            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _buildMetricItem(IconData icon, String value, String label) {
    return Column(
      children: [
        Row(
          children: [
            Icon(icon, color: TechTheme.flameOrangeAmber, size: 14),
            const SizedBox(width: 4),
            Text(value, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Colors.white)),
          ],
        ),
        const SizedBox(height: 2),
        Text(label, style: const TextStyle(fontSize: 10, color: Color(0xFF94A3B8))),
      ],
    );
  }

  Widget _buildJobQueueItem(TechJobModel job) {
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(14),
        side: const BorderSide(color: TechTheme.slateBorder),
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
        leading: CircleAvatar(
          backgroundColor: TechTheme.flameOrange.withOpacity(0.1),
          child: const Icon(Icons.handyman_rounded, color: TechTheme.flameOrange, size: 20),
        ),
        title: Text('#${job.jobTicketNumber} — ${job.serviceTitle}', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: TechTheme.slateDark), maxLines: 1, overflow: TextOverflow.ellipsis),
        subtitle: Text('${job.customerName} • ₹${job.techEarningInr.toStringAsFixed(0)}', style: const TextStyle(fontSize: 11, color: TechTheme.slateMuted)),
        trailing: Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          decoration: BoxDecoration(
            color: job.status == 'COMPLETED' ? TechTheme.signalOnlineBg : const Color(0xFFEFF6FF),
            borderRadius: BorderRadius.circular(6),
          ),
          child: Text(
            job.status,
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.bold,
              color: job.status == 'COMPLETED' ? TechTheme.signalOnlineEmerald : TechTheme.signalCobalt,
            ),
          ),
        ),
        onTap: () {
          widget.onSwitchTab(1);
        },
      ),
    );
  }
}

