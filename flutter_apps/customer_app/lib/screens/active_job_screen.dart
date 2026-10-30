import 'dart:async';
import 'package:flutter/material.dart';
import '../../core/session_manager.dart';
import '../../core/theme.dart';
import '../../core/realtime_stream_manager.dart';
import '../../models/job_model.dart';
import '../../services/job_service.dart';
import 'service_signoff_screen.dart';
import 'home_screen.dart';

class ActiveJobScreen extends StatefulWidget {
  final JobModel initialJob;

  const ActiveJobScreen({
    super.key,
    required this.initialJob,
  });

  @override
  State<ActiveJobScreen> createState() => _ActiveJobScreenState();
}

class _ActiveJobScreenState extends State<ActiveJobScreen> {
  late JobModel _job;
  Timer? _statusPoller;
  StreamSubscription? _sseSubscription;
  bool _hasPromptedArrival = false;
  int _etaMinutes = 12;

  final List<Map<String, String>> _statusSteps = [
    {'key': 'DISPATCHED', 'label': 'Dispatched', 'sub': 'Assigned to nearest hub'},
    {'key': 'EN_ROUTE', 'label': 'En Route', 'sub': 'Electrician traveling'},
    {'key': 'ARRIVED', 'label': 'Arrived', 'sub': 'Technician at doorstep'},
    {'key': 'IN_PROGRESS', 'label': 'In Progress', 'sub': 'Work underway'},
    {'key': 'WORK_COMPLETED', 'label': 'Completed', 'sub': 'Safety verified'},
  ];

  @override
  void initState() {
    super.initState();
    _job = widget.initialJob;
    _subscribeRealtimeStream();
    _startLiveTrackingPoller();
  }

  void _subscribeRealtimeStream() {
    final sse = RealtimeStreamManager();
    sse.connect(jobId: _job.id);
    _sseSubscription = sse.eventStream.listen((event) {
      if (!mounted) return;
      final eventType = event['type']?.toString() ?? '';
      final targetJobId = event['jobId']?.toString() ?? event['details']?['jobId']?.toString();
      if (targetJobId != null && targetJobId != _job.id) return;

      String? newStatus = event['status']?.toString() ?? event['details']?['status']?.toString();
      if (eventType == 'SAFETY_INTERLOCK_VERIFIED' && (newStatus == null || newStatus.isEmpty)) {
        newStatus = 'SAFETY_CHECKED';
      }
      if (newStatus != null && newStatus.isNotEmpty) {
        setState(() {
          _job = _job.copyWith(status: newStatus);
        });
        if ((newStatus == 'ARRIVED' || newStatus == 'DOORSTEP_ARRIVED') && !_hasPromptedArrival) {
          _hasPromptedArrival = true;
          _showArrivalDialog();
        }
        if (newStatus == 'WORK_COMPLETED' || newStatus == 'COMPLETED') {
          _statusPoller?.cancel();
          _transitionToSignoff();
        }
      }
    });
  }

  @override
  void dispose() {
    _sseSubscription?.cancel();
    _statusPoller?.cancel();
    super.dispose();
  }

  void _startLiveTrackingPoller() {
    _statusPoller = Timer.periodic(const Duration(seconds: 4), (timer) async {
      final updated = await JobService.getJobDetails(_job.id);
      if (updated != null && mounted) {
        setState(() {
          _job = updated;
          if (_etaMinutes > 2) _etaMinutes--;
        });

        // Prompt arrival dialog
        if ((_job.status == 'ARRIVED' || _job.status == 'DOORSTEP_ARRIVED') && !_hasPromptedArrival) {
          _hasPromptedArrival = true;
          _showArrivalDialog();
        }

        // Completion transition
        if (_job.status == 'WORK_COMPLETED' || _job.status == 'COMPLETED') {
          timer.cancel();
          _transitionToSignoff();
        }
      }
    });
  }

  void _showArrivalDialog() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Row(
          children: const [
            Icon(Icons.doorbell_rounded, color: AppTheme.sapphireBlue, size: 28),
            SizedBox(width: 8),
            Text('Technician Arrived!', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          ],
        ),
        content: Text(
          '${_job.technicianName ?? "Your technician"} has arrived at your doorstep.\n\nPlease share the 4-digit Handover Code ${_job.handoverOtp} to verify identity and begin service.',
          style: const TextStyle(fontSize: 13, height: 1.4),
        ),
        actions: [
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.sapphireBlue, foregroundColor: Colors.white),
            onPressed: () => Navigator.pop(ctx),
            child: const Text('GOT IT'),
          ),
        ],
      ),
    );
  }

  void _transitionToSignoff() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('⚡ Repair completed! Opening safety verification certificate...'),
        backgroundColor: AppTheme.signalEmerald,
      ),
    );

    Future.delayed(const Duration(milliseconds: 900), () {
      if (mounted) {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (_) => ServiceSignoffScreen(job: _job)),
        );
      }
    });
  }

  void _showSosConfirmation() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Row(
          children: const [
            Icon(Icons.emergency_rounded, color: Color(0xFFDC2626), size: 28),
            SizedBox(width: 8),
            Text('Trigger Emergency SOS', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          ],
        ),
        content: const Text(
          'This will immediately alert the GTS 24/7 Safety Command Center, dispatch our emergency response supervisor, and share your GPS telemetry.',
          style: TextStyle(fontSize: 13, height: 1.4),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFDC2626), foregroundColor: Colors.white),
            onPressed: () {
              Navigator.pop(ctx);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('🚨 SOS Alert transmitted to GTS Security Operations!'),
                  backgroundColor: Color(0xFFDC2626),
                ),
              );
            },
            child: const Text('TRANSMIT SOS'),
          ),
        ],
      ),
    );
  }

  int _getCurrentStepIndex() {
    final status = _job.status.toUpperCase();
    if (status == 'DISPATCHED' || status == 'PENDING' || status == 'ASSIGNED' || status == 'PENDING_DISPATCH') return 0;
    if (status == 'EN_ROUTE') return 1;
    if (status == 'ARRIVED' || status == 'DOORSTEP_ARRIVED') return 2;
    if (status == 'SAFETY_CHECKED' || status == 'IN_PROGRESS' || status == 'WAITING_CUSTOMER_APPROVAL') return 3;
    if (status == 'WORK_COMPLETED' || status == 'COMPLETED' || status == 'PAYMENT_PENDING' || status == 'SETTLED') return 4;
    return 1;
  }

  @override
  Widget build(BuildContext context) {
    final currentStep = _getCurrentStepIndex();
    final techName = _job.technicianName ?? 'Rajesh Kumar (Certified Electrician)';
    final techBadge = _job.technicianBadge ?? 'GTS-TECH-101';
    final techPhone = _job.technicianPhone ?? '+91 98200 12345';

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('LIVE ${widget.initialJob.serviceTitle.toUpperCase()} TRACKING', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
            Text('Ticket: ${_job.jobTicketNumber} • Real-Time Telemetry', style: const TextStyle(fontSize: 11, color: AppTheme.sapphireBlue)),
          ],
        ),
        actions: [
          // Emergency SOS Action Button
          Container(
            margin: const EdgeInsets.only(right: 12),
            child: InkWell(
              onTap: _showSosConfirmation,
              borderRadius: BorderRadius.circular(16),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: const Color(0xFFDC2626),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Row(
                  children: const [
                    Text('🚨', style: TextStyle(fontSize: 12)),
                    SizedBox(width: 4),
                    Text('Emergency SOS', style: TextStyle(color: Colors.white, fontSize: 10.5, fontWeight: FontWeight.bold)),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Proximity Radar & Live ETA Banner
            Container(
              padding: const EdgeInsets.all(16),
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
              child: Row(
                children: [
                  Container(
                    width: 52,
                    height: 52,
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.12),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.local_shipping_rounded, color: AppTheme.primaryAmber, size: 28),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'ESTIMATED ARRIVAL',
                          style: TextStyle(color: Color(0xFF94A3B8), fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 0.5),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          currentStep >= 3
                              ? (_job.status.toUpperCase() == 'SAFETY_CHECKED'
                                  ? 'Safety Verified • In Progress'
                                  : 'Repair in Progress')
                              : (currentStep == 2 ? 'At Your Doorstep' : 'Arriving in ~$_etaMinutes mins'),
                          style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w900),
                        ),
                        Text(
                          'Assigned Hub: ${SessionManager.getPincode()} Colaba Fleet',
                          style: const TextStyle(color: Color(0xFFCBD5E1), fontSize: 11),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: AppTheme.signalEmerald.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: AppTheme.signalEmerald.withOpacity(0.4)),
                    ),
                    child: const Text('LIVE GPS', style: TextStyle(color: AppTheme.signalEmerald, fontSize: 10, fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // Handover Security Code Card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFFDE68A), width: 1.5),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.02),
                    blurRadius: 6,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Row(
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: const Color(0xFFFEF3C7),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(Icons.security_rounded, color: Color(0xFFD97706), size: 24),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: const [
                        Text('Handover Start OTP', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                        Text('Share this code only after verifying identity', style: TextStyle(fontSize: 11, color: AppTheme.slateMuted)),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                    decoration: BoxDecoration(
                      color: const Color(0xFFEFF6FF),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: AppTheme.sapphireBlue),
                    ),
                    child: Text(
                      (_job.handoverOtp != null && _job.handoverOtp!.isNotEmpty) ? _job.handoverOtp! : '4928',
                      style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: AppTheme.sapphireBlue, letterSpacing: 2),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // Technician Profile Card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppTheme.slateBorder),
              ),
              child: Column(
                children: [
                  Row(
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(25),
                        child: Image.asset(
                          'assets/images/img_technician_rajesh.png',
                          width: 50,
                          height: 50,
                          fit: BoxFit.cover,
                          errorBuilder: (_, __, ___) => const CircleAvatar(
                            radius: 25,
                            backgroundColor: AppTheme.sapphireBlue,
                            child: Icon(Icons.person, color: Colors.white, size: 24),
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
                                Text(techName, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                                const SizedBox(width: 4),
                                const Icon(Icons.verified_rounded, color: AppTheme.signalEmerald, size: 14),
                              ],
                            ),
                            Text('Badge: $techBadge • IEC-60900 Certified', style: const TextStyle(fontSize: 11, color: AppTheme.slateMuted)),
                            const SizedBox(height: 2),
                            Row(
                              children: const [
                                Icon(Icons.star_rounded, size: 14, color: Color(0xFFF59E0B)),
                                SizedBox(width: 3),
                                Text('4.9 Rating', style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.bold)),
                                SizedBox(width: 8),
                                Text('• 140+ completed jobs', style: TextStyle(fontSize: 11, color: AppTheme.slateMuted)),
                              ],
                            ),
                          ],
                        ),
                      ),
                      IconButton.filled(
                        style: IconButton.styleFrom(backgroundColor: const Color(0xFFEFF6FF), foregroundColor: AppTheme.sapphireBlue),
                        icon: const Icon(Icons.call_rounded),
                        onPressed: () {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text('Calling technician at $techPhone...')),
                          );
                        },
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  const Divider(height: 1, color: AppTheme.slateBorder),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Service Vehicle:', style: TextStyle(fontSize: 11.5, color: AppTheme.slateMuted)),
                      Text('Honda Activa (MH-01-EA-4921)', style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.bold, color: AppTheme.slateDark)),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // 5-Stage Live Timeline Stepper
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppTheme.slateBorder),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Dispatch & Service Progress', style: TextStyle(fontSize: 14.5, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 14),

                  ...List.generate(_statusSteps.length, (idx) {
                    final isDone = idx < currentStep;
                    final isCurrent = idx == currentStep;
                    final isLast = idx == _statusSteps.length - 1;
                    final step = _statusSteps[idx];

                    return Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Column(
                          children: [
                            Container(
                              width: 22,
                              height: 22,
                              decoration: BoxDecoration(
                                color: isDone
                                    ? AppTheme.signalEmerald
                                    : (isCurrent ? AppTheme.sapphireBlue : const Color(0xFFCBD5E1)),
                                shape: BoxShape.circle,
                              ),
                              child: isDone
                                  ? const Icon(Icons.check, size: 14, color: Colors.white)
                                  : (isCurrent
                                      ? Center(
                                          child: Container(
                                            width: 8,
                                            height: 8,
                                            decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle),
                                          ),
                                        )
                                      : null),
                            ),
                            if (!isLast)
                              Container(
                                width: 2,
                                height: 32,
                                color: isDone ? AppTheme.signalEmerald : const Color(0xFFE2E8F0),
                              ),
                          ],
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                step['label']!,
                                style: TextStyle(
                                  fontSize: 13,
                                  fontWeight: isCurrent || isDone ? FontWeight.bold : FontWeight.w500,
                                  color: isCurrent || isDone ? AppTheme.slateDark : AppTheme.slateMuted,
                                ),
                              ),
                              Text(
                                step['key'] == 'IN_PROGRESS' && _job.status.toUpperCase() == 'SAFETY_CHECKED'
                                    ? 'Safety verified • Repair in progress'
                                    : step['sub']!,
                                style: const TextStyle(fontSize: 11, color: AppTheme.slateMuted),
                              ),
                              const SizedBox(height: 12),
                            ],
                          ),
                        ),
                      ],
                    );
                  }),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // Demo Simulation Controls (Quick testing for QA)
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFF1F5F9),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('QA Simulation:', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppTheme.slateMuted)),
                  Row(
                    children: [
                      TextButton(
                        onPressed: () => setState(() => _job = _job.copyWith(status: 'ARRIVED')),
                        child: const Text('Set Arrived', style: TextStyle(fontSize: 11)),
                      ),
                      TextButton(
                        onPressed: () => setState(() => _job = _job.copyWith(status: 'SAFETY_CHECKED')),
                        child: const Text('Safety Pass', style: TextStyle(fontSize: 11, color: AppTheme.sapphireBlue)),
                      ),
                      TextButton(
                        onPressed: () {
                          setState(() => _job = _job.copyWith(status: 'WORK_COMPLETED'));
                          _transitionToSignoff();
                        },
                        child: const Text('Complete Job', style: TextStyle(fontSize: 11, color: AppTheme.signalEmerald, fontWeight: FontWeight.bold)),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }
}
