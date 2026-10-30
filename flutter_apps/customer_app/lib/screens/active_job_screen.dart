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

class _ActiveJobScreenState extends State<ActiveJobScreen> with SingleTickerProviderStateMixin {
  late JobModel _job;
  Timer? _statusPoller;
  StreamSubscription? _sseSubscription;
  bool _hasPromptedArrival = false;
  bool _isPartsModalOpen = false;
  Map<String, dynamic>? _pendingPartsQuote;
  int _etaMinutes = 12;

  late AnimationController _radarPulseController;
  late Animation<double> _radarPulseAnimation;

  final List<Map<String, String>> _statusSteps = [
    {'key': 'DISPATCHED', 'label': 'Dispatched', 'sub': 'Assigned to nearest hub'},
    {'key': 'EN_ROUTE', 'label': 'En Route', 'sub': 'Electrician traveling'},
    {'key': 'ARRIVED', 'label': 'Arrived', 'sub': 'Technician at doorstep'},
    {'key': 'IN_PROGRESS', 'label': 'In Progress', 'sub': 'Work underway'},
    {'key': 'WORK_COMPLETED', 'label': 'Completed', 'sub': 'Safety verified'},
  ];

  bool get _isUnassigned {
    final status = _job.status.toUpperCase();
    if (status == 'PENDING_DISPATCH' || status == 'PENDING') return true;
    final techId = _job.technicianId;
    return techId == null ||
        techId.trim().isEmpty ||
        techId == 'null' ||
        techId == 'tech_unassigned' ||
        _job.technicianName == null ||
        _job.technicianName!.trim().isEmpty ||
        _job.technicianName == 'Searching Pro...' ||
        _job.technicianName == 'Searching Nearest Specialist...';
  }

  @override
  void initState() {
    super.initState();
    _job = widget.initialJob;
    _radarPulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1400),
    )..repeat(reverse: true);
    _radarPulseAnimation = Tween<double>(begin: 0.94, end: 1.08).animate(
      CurvedAnimation(parent: _radarPulseController, curve: Curves.easeInOut),
    );
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

      // Tech Assigned or Reassigned: Immediately sync new technician profile
      if (eventType == 'TECH_ACCEPTED' ||
          eventType == 'JOB_REASSIGNED' ||
          eventType == 'TECH_DISPATCHED' ||
          newStatus == 'ASSIGNED' ||
          newStatus == 'EN_ROUTE') {
        _fetchFullJobDetails();
      }

      // Tech Rejected / Dispatch Exhaustion: Transition to unassigned searching radar
      if (eventType == 'TECH_REJECTED' ||
          eventType == 'DISPATCH_EXHAUSTED' ||
          newStatus == 'PENDING_DISPATCH') {
        setState(() {
          _job = _job.copyWith(
            status: 'PENDING_DISPATCH',
            technicianId: '',
            technicianName: '',
            technicianBadge: '',
            technicianPhone: '',
          );
        });
        SessionManager.updateActiveJobStatus('PENDING_DISPATCH');
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('⚡ Re-routing ticket to nearest standby pro in PIN ${_job.pincode}...'),
            backgroundColor: AppTheme.sapphireBlue,
            duration: const Duration(seconds: 3),
          ),
        );
      }

      // Real-time Parts Quote Intercept (Issue 7)
      if (eventType == 'QUOTE_APPROVAL_REQUESTED' ||
          eventType == 'JOB_PRICE_UPDATED' ||
          newStatus == 'WAITING_CUSTOMER_APPROVAL') {
        final partData = event['details']?['part'] ?? event['details']?['pendingQuote'];
        if (partData != null && partData is Map) {
          _pendingPartsQuote = Map<String, dynamic>.from(partData);
        }
        if (!_isPartsModalOpen && mounted) {
          _openPartsApprovalModal(_pendingPartsQuote);
        }
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

  Future<void> _fetchFullJobDetails() async {
    final updated = await JobService.getJobDetails(_job.id);
    if (updated != null && mounted) {
      setState(() {
        _job = updated;
      });
      if (updated.technicianName != null && updated.technicianName!.isNotEmpty) {
        await SessionManager.setActiveJob(
          jobId: updated.id,
          title: updated.serviceTitle,
          ticketNumber: updated.jobTicketNumber,
          techName: updated.technicianName!,
          techPhone: updated.technicianPhone ?? '',
          techBadge: updated.technicianBadge ?? '',
          status: updated.status,
          otp: updated.handoverOtp ?? '4829',
          total: updated.totalAmountInr,
          eta: '12 mins',
        );
      }
    }
  }

  @override
  void dispose() {
    _radarPulseController.dispose();
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
          if (!_isUnassigned && _etaMinutes > 2) _etaMinutes--;
        });

        // Prompt arrival dialog
        if ((_job.status == 'ARRIVED' || _job.status == 'DOORSTEP_ARRIVED') && !_hasPromptedArrival) {
          _hasPromptedArrival = true;
          _showArrivalDialog();
        }

        // Parts approval trigger from poller (Issue 7)
        if (_job.status == 'WAITING_CUSTOMER_APPROVAL' && !_isPartsModalOpen) {
          _fetchAndPromptPendingParts();
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
          '${_job.technicianName ?? "Your technician"} has arrived at your doorstep.\n\nPlease share the 4-digit Handover Code ${_job.handoverOtp ?? SessionManager.getActiveJobOtp()} to verify identity and begin service.',
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

  Future<void> _fetchAndPromptPendingParts() async {
    final partsData = await JobService.getJobParts(_job.id);
    if (partsData != null && mounted) {
      final pending = partsData['pendingQuote'];
      if (pending != null && pending is Map) {
        _pendingPartsQuote = Map<String, dynamic>.from(pending);
      }
      if (!_isPartsModalOpen && mounted) {
        _openPartsApprovalModal(_pendingPartsQuote);
      }
    }
  }

  void _openPartsApprovalModal(Map<String, dynamic>? initialQuote) async {
    if (_isPartsModalOpen) return;
    _isPartsModalOpen = true;

    final quote = initialQuote ?? _pendingPartsQuote ?? {
      'id': 'part_latest',
      'name': 'Schneider Electric 63A Double Pole MCB',
      'sku': 'SKU-MCB-63A-DP',
      'unitPriceInr': 450.0,
      'quantity': 1,
      'subtotalInr': 450.0,
      'gstAmountInr': 81.0,
      'totalAmountInr': 531.0,
      'damagedComponentPhotoUrl': 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=500',
    };

    final partId = quote['id']?.toString() ?? 'latest';
    final partName = quote['name']?.toString() ?? quote['partName']?.toString() ?? 'Replacement Spare Part';
    final partSku = quote['sku']?.toString() ?? 'GEN-SPARE-01';
    final qty = (quote['quantity'] is num) ? (quote['quantity'] as num).toInt() : 1;
    final unitPrice = (quote['unitPriceInr'] is num) ? (quote['unitPriceInr'] as num).toDouble() : 450.0;
    final subtotal = (quote['subtotalInr'] is num) ? (quote['subtotalInr'] as num).toDouble() : unitPrice * qty;
    final gst = (quote['gstAmountInr'] is num) ? (quote['gstAmountInr'] as num).toDouble() : subtotal * 0.18;
    final addedTotal = (quote['totalAmountInr'] is num) ? (quote['totalAmountInr'] as num).toDouble() : subtotal + gst;
    final damagedPhoto = quote['damagedComponentPhotoUrl']?.toString() ?? quote['photoUrl']?.toString();

    final baseLabor = _job.totalAmountInr;
    final revisedGrandTotal = baseLabor + addedTotal;

    String selectedPaymentMode = 'UPI';
    bool isSubmitting = false;

    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return Padding(
              padding: EdgeInsets.only(
                left: 20,
                right: 20,
                top: 16,
                bottom: MediaQuery.of(context).viewInsets.bottom + 24,
              ),
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Pull Handle
                    Center(
                      child: Container(
                        width: 40,
                        height: 4,
                        decoration: BoxDecoration(
                          color: const Color(0xFFCBD5E1),
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Top Banner
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFEF3C7),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Icon(Icons.build_circle_rounded, color: Color(0xFFD97706), size: 28),
                        ),
                        const SizedBox(width: 12),
                        const Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Spare Part Approval Required',
                                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: Color(0xFF0F172A)),
                              ),
                              SizedBox(height: 2),
                              Text(
                                'Technician detected a component requiring replacement',
                                style: TextStyle(fontSize: 11, color: Color(0xFF64748B)),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 18),

                    // Damaged Component Photographic Evidence
                    if (damagedPhoto != null && damagedPhoto.isNotEmpty) ...[
                      ClipRRect(
                        borderRadius: BorderRadius.circular(14),
                        child: Stack(
                          children: [
                            Image.network(
                              damagedPhoto,
                              height: 150,
                              width: double.infinity,
                              fit: BoxFit.cover,
                              errorBuilder: (_, __, ___) => Container(
                                height: 110,
                                color: const Color(0xFFF1F5F9),
                                child: const Center(
                                  child: Icon(Icons.broken_image_rounded, color: Color(0xFF94A3B8), size: 36),
                                ),
                              ),
                            ),
                            Positioned(
                              top: 10,
                              left: 10,
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                decoration: BoxDecoration(
                                  color: Colors.black.withOpacity(0.75),
                                  borderRadius: BorderRadius.circular(20),
                                ),
                                child: const Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Icon(Icons.camera_alt_rounded, color: Colors.white, size: 12),
                                    SizedBox(width: 6),
                                    Text(
                                      'Technician Diagnostic Photo',
                                      style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),
                    ],

                    // Part Details Card
                    Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                      ),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  partName,
                                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Color(0xFF0F172A)),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  'SKU: $partSku • Qty: $qty',
                                  style: const TextStyle(fontSize: 11, color: Color(0xFF64748B), fontFamily: 'monospace'),
                                ),
                              ],
                            ),
                          ),
                          Text(
                            '₹${unitPrice.toStringAsFixed(0)}',
                            style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w900, color: Color(0xFF0F172A)),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 14),

                    // Recalculation Breakdown Card
                    Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF1F5F9),
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: Column(
                        children: [
                          _buildPriceRow('Base Spare Part Price', '₹${subtotal.toStringAsFixed(2)}'),
                          const SizedBox(height: 6),
                          _buildPriceRow('Applicable GST (18%)', '₹${gst.toStringAsFixed(2)}'),
                          const SizedBox(height: 6),
                          _buildPriceRow('Added Part Total', '+₹${addedTotal.toStringAsFixed(2)}', isHighlight: true),
                          const SizedBox(height: 6),
                          _buildPriceRow('Initial Labor & Service', '₹${baseLabor.toStringAsFixed(2)}'),
                          const Padding(
                            padding: EdgeInsets.symmetric(vertical: 8),
                            child: Divider(height: 1, color: Color(0xFFCBD5E1)),
                          ),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text(
                                'Revised Grand Total',
                                style: TextStyle(fontWeight: FontWeight.w900, fontSize: 14, color: Color(0xFF0F172A)),
                              ),
                              Text(
                                '₹${revisedGrandTotal.toStringAsFixed(2)}',
                                style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 18, color: AppTheme.signalEmerald),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Payment Mode Toggle
                    const Text(
                      'PAYMENT METHOD FOR REVISED ESTIMATE',
                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: Color(0xFF64748B), letterSpacing: 0.5),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Expanded(
                          child: InkWell(
                            onTap: () => setModalState(() => selectedPaymentMode = 'UPI'),
                            borderRadius: BorderRadius.circular(12),
                            child: Container(
                              padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 12),
                              decoration: BoxDecoration(
                                color: selectedPaymentMode == 'UPI' ? const Color(0xFFEFF6FF) : Colors.white,
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(
                                  color: selectedPaymentMode == 'UPI' ? AppTheme.sapphireBlue : const Color(0xFFE2E8F0),
                                  width: selectedPaymentMode == 'UPI' ? 1.5 : 1.0,
                                ),
                              ),
                              child: Row(
                                children: [
                                  Icon(
                                    selectedPaymentMode == 'UPI' ? Icons.radio_button_checked : Icons.radio_button_off,
                                    size: 16,
                                    color: selectedPaymentMode == 'UPI' ? AppTheme.sapphireBlue : const Color(0xFF94A3B8),
                                  ),
                                  const SizedBox(width: 8),
                                  const Text(
                                    'Instant UPI',
                                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: InkWell(
                            onTap: () => setModalState(() => selectedPaymentMode = 'CASH'),
                            borderRadius: BorderRadius.circular(12),
                            child: Container(
                              padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 12),
                              decoration: BoxDecoration(
                                color: selectedPaymentMode == 'CASH' ? const Color(0xFFEFF6FF) : Colors.white,
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(
                                  color: selectedPaymentMode == 'CASH' ? AppTheme.sapphireBlue : const Color(0xFFE2E8F0),
                                  width: selectedPaymentMode == 'CASH' ? 1.5 : 1.0,
                                ),
                              ),
                              child: Row(
                                children: [
                                  Icon(
                                    selectedPaymentMode == 'CASH' ? Icons.radio_button_checked : Icons.radio_button_off,
                                    size: 16,
                                    color: selectedPaymentMode == 'CASH' ? AppTheme.sapphireBlue : const Color(0xFF94A3B8),
                                  ),
                                  const SizedBox(width: 8),
                                  const Text(
                                    'Cash on Done',
                                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),

                    // Decision Action Buttons
                    Row(
                      children: [
                        Expanded(
                          flex: 1,
                          child: OutlinedButton(
                            style: OutlinedButton.styleFrom(
                              foregroundColor: const Color(0xFFDC2626),
                              side: const BorderSide(color: Color(0xFFDC2626)),
                              padding: const EdgeInsets.symmetric(vertical: 14),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                            ),
                            onPressed: isSubmitting
                                ? null
                                : () async {
                                    setModalState(() => isSubmitting = true);
                                    await JobService.approvePartsQuote(
                                      jobId: _job.id,
                                      partId: partId,
                                      decision: 'REJECT',
                                    );
                                    Navigator.pop(ctx);
                                    setState(() {
                                      _pendingPartsQuote = null;
                                      _job = _job.copyWith(status: 'IN_PROGRESS');
                                    });
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      const SnackBar(
                                        content: Text('Spare part estimate declined. Technician proceeding without replacement.'),
                                        backgroundColor: Color(0xFF475569),
                                      ),
                                    );
                                  },
                            child: const Text('DECLINE', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          flex: 2,
                          child: ElevatedButton(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppTheme.signalEmerald,
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(vertical: 14),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                            ),
                            onPressed: isSubmitting
                                ? null
                                : () async {
                                    setModalState(() => isSubmitting = true);
                                    await JobService.approvePartsQuote(
                                      jobId: _job.id,
                                      partId: partId,
                                      decision: 'ACCEPT',
                                      paymentMethod: selectedPaymentMode,
                                    );
                                    Navigator.pop(ctx);
                                    setState(() {
                                      _pendingPartsQuote = null;
                                      _job = _job.copyWith(
                                        status: 'IN_PROGRESS',
                                        totalAmountInr: revisedGrandTotal,
                                      );
                                    });
                                    SessionManager.updateActiveJobStatus('IN_PROGRESS');
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      SnackBar(
                                        content: Text('✓ Parts approved! ₹${addedTotal.toStringAsFixed(0)} added to estimate ($selectedPaymentMode).'),
                                        backgroundColor: AppTheme.signalEmerald,
                                      ),
                                    );
                                  },
                            child: isSubmitting
                                ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                                : Text(
                                    'APPROVE (₹${revisedGrandTotal.toStringAsFixed(0)})',
                                    style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 12),
                                  ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );

    _isPartsModalOpen = false;
  }

  Widget _buildPriceRow(String label, String value, {bool isHighlight = false}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            color: isHighlight ? const Color(0xFF0F172A) : const Color(0xFF64748B),
            fontWeight: isHighlight ? FontWeight.bold : FontWeight.normal,
          ),
        ),
        Text(
          value,
          style: TextStyle(
            fontSize: 12,
            fontWeight: isHighlight ? FontWeight.w900 : FontWeight.w600,
            color: isHighlight ? const Color(0xFFD97706) : const Color(0xFF0F172A),
          ),
        ),
      ],
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
    if (_isUnassigned || status == 'PENDING_DISPATCH' || status == 'PENDING') return 0;
    if (status == 'DISPATCHED' || status == 'ASSIGNED') return 0;
    if (status == 'EN_ROUTE') return 1;
    if (status == 'ARRIVED' || status == 'DOORSTEP_ARRIVED') return 2;
    if (status == 'SAFETY_CHECKED' || status == 'IN_PROGRESS' || status == 'WAITING_CUSTOMER_APPROVAL') return 3;
    if (status == 'WORK_COMPLETED' || status == 'COMPLETED' || status == 'PAYMENT_PENDING' || status == 'SETTLED') return 4;
    return 0;
  }

  @override
  Widget build(BuildContext context) {
    final currentStep = _getCurrentStepIndex();
    final techName = _job.technicianName ?? 'Certified Pro';
    final techBadge = _job.technicianBadge ?? 'GTS-TECH-101';
    final techPhone = _job.technicianPhone ?? '';

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
                gradient: LinearGradient(
                  colors: _isUnassigned
                      ? const [Color(0xFF0F172A), Color(0xFF1E293B)]
                      : const [Color(0xFF0F2B48), Color(0xFF1E3A5F)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(
                    color: (_isUnassigned ? const Color(0xFF0F172A) : const Color(0xFF0F2B48)).withOpacity(0.25),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Row(
                children: [
                  _isUnassigned
                      ? ScaleTransition(
                          scale: _radarPulseAnimation,
                          child: Container(
                            width: 52,
                            height: 52,
                            decoration: BoxDecoration(
                              color: const Color(0xFF0284C7).withOpacity(0.2),
                              shape: BoxShape.circle,
                              border: Border.all(color: const Color(0xFF38BDF8), width: 1.5),
                            ),
                            child: const Icon(Icons.radar_rounded, color: Color(0xFF38BDF8), size: 28),
                          ),
                        )
                      : Container(
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
                        Text(
                          _isUnassigned ? 'FLEET DISPATCH IN PROGRESS' : 'ESTIMATED ARRIVAL',
                          style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 0.5),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          _isUnassigned
                              ? 'Locating Nearest Pro...'
                              : (currentStep >= 3
                                  ? (_job.status.toUpperCase() == 'SAFETY_CHECKED'
                                      ? 'Safety Verified • In Progress'
                                      : 'Repair in Progress')
                                  : (currentStep == 2 ? 'At Your Doorstep' : 'Arriving in ~$_etaMinutes mins')),
                          style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w900),
                        ),
                        Text(
                          _isUnassigned
                              ? 'Hub: PIN ${_job.pincode} • Sub-30 Min SLA Active'
                              : 'Assigned Hub: ${SessionManager.getPincode()} Colaba Fleet',
                          style: const TextStyle(color: Color(0xFFCBD5E1), fontSize: 11),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: (_isUnassigned ? const Color(0xFF0284C7) : AppTheme.signalEmerald).withOpacity(0.2),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: (_isUnassigned ? const Color(0xFF38BDF8) : AppTheme.signalEmerald).withOpacity(0.5)),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        if (_isUnassigned) ...[
                          const SizedBox(
                            width: 8,
                            height: 8,
                            child: CircularProgressIndicator(strokeWidth: 1.5, color: Color(0xFF38BDF8)),
                          ),
                          const SizedBox(width: 5),
                        ],
                        Text(
                          _isUnassigned ? 'SEARCHING FLEET' : 'LIVE GPS',
                          style: TextStyle(
                            color: _isUnassigned ? const Color(0xFF38BDF8) : AppTheme.signalEmerald,
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // Pending Parts Approval Alert Banner (Issue 7)
            if (_job.status.toUpperCase() == 'WAITING_CUSTOMER_APPROVAL' || _pendingPartsQuote != null) ...[
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: const Color(0xFFFFFBEB),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFF59E0B), width: 1.5),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFFF59E0B).withOpacity(0.12),
                      blurRadius: 10,
                      offset: const Offset(0, 3),
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
                      child: const Icon(Icons.build_circle_rounded, color: Color(0xFFD97706), size: 26),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Action Required: Spare Part Estimate',
                            style: TextStyle(fontSize: 13, fontWeight: FontWeight.w900, color: Color(0xFF92400E)),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            _pendingPartsQuote != null
                                ? '${_pendingPartsQuote!['name'] ?? 'Replacement part'} requires your approval.'
                                : 'Technician submitted a spare part quote for your approval.',
                            style: const TextStyle(fontSize: 11, color: Color(0xFF78350F)),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 8),
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFD97706),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                      onPressed: () => _openPartsApprovalModal(_pendingPartsQuote),
                      child: const Text('REVIEW', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 11.5)),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
            ],

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
                      children: [
                        const Text('Handover Start OTP', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                        Text(
                          _isUnassigned
                              ? 'Share this code once the technician arrives at your doorstep'
                              : 'Share this code only after verifying identity',
                          style: const TextStyle(fontSize: 11, color: AppTheme.slateMuted),
                        ),
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
                      (_job.handoverOtp != null && _job.handoverOtp!.isNotEmpty)
                          ? _job.handoverOtp!
                          : SessionManager.getActiveJobOtp(),
                      style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: AppTheme.sapphireBlue, letterSpacing: 2),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            if (_isUnassigned) ...[
              // Searching Active Standby Fleet Radar Card
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFBAE6FD), width: 1.5),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFF0284C7).withOpacity(0.06),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        ScaleTransition(
                          scale: _radarPulseAnimation,
                          child: Container(
                            width: 48,
                            height: 48,
                            decoration: BoxDecoration(
                              color: const Color(0xFFF0F9FF),
                              shape: BoxShape.circle,
                              border: Border.all(color: const Color(0xFF38BDF8), width: 1.5),
                            ),
                            child: const Center(
                              child: Icon(Icons.sensors_rounded, color: Color(0xFF0284C7), size: 24),
                            ),
                          ),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: const [
                                  Text(
                                    'Searching Standby Fleet',
                                    style: TextStyle(fontSize: 14.5, fontWeight: FontWeight.bold, color: AppTheme.slateDark),
                                  ),
                                  SizedBox(width: 6),
                                  Icon(Icons.shield_rounded, color: AppTheme.sapphireBlue, size: 14),
                                ],
                              ),
                              const SizedBox(height: 2),
                              Text(
                                'Broadcasting ticket to verified technicians in PIN ${_job.pincode}...',
                                style: const TextStyle(fontSize: 11.5, color: AppTheme.slateMuted),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(4),
                      child: const LinearProgressIndicator(
                        minHeight: 4,
                        backgroundColor: Color(0xFFE2E8F0),
                        color: AppTheme.sapphireBlue,
                      ),
                    ),
                    const SizedBox(height: 12),
                    const Divider(height: 1, color: AppTheme.slateBorder),
                    const SizedBox(height: 10),
                    Row(
                      children: const [
                        Icon(Icons.timer_outlined, size: 14, color: Color(0xFF0284C7)),
                        SizedBox(width: 6),
                        Text('Average response time: < 45 seconds', style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w600, color: AppTheme.slateDark)),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Row(
                      children: const [
                        Icon(Icons.verified_user_rounded, size: 14, color: Color(0xFF16A34A)),
                        SizedBox(width: 6),
                        Text('100% Background-checked & Tool-insulated technicians', style: TextStyle(fontSize: 11.5, color: AppTheme.slateMuted)),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        const Icon(Icons.bolt_rounded, size: 14, color: AppTheme.primaryAmber),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Text(
                            'Franchise Cluster: PIN ${_job.pincode} • Sub-30 Min Doorstep SLA Active',
                            style: const TextStyle(fontSize: 11, color: AppTheme.slateMuted),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ] else ...[
              // Assigned Technician Profile Card
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
                                children: [
                                  const Icon(Icons.star_rounded, size: 14, color: Color(0xFFF59E0B)),
                                  const SizedBox(width: 3),
                                  Text(
                                    '${_job.technicianRating > 0 ? _job.technicianRating.toStringAsFixed(1) : "4.9"} Rating',
                                    style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.bold),
                                  ),
                                  const SizedBox(width: 8),
                                  const Text('• 140+ completed jobs', style: TextStyle(fontSize: 11, color: AppTheme.slateMuted)),
                                ],
                              ),
                            ],
                          ),
                        ),
                        IconButton.filled(
                          style: IconButton.styleFrom(backgroundColor: const Color(0xFFEFF6FF), foregroundColor: AppTheme.sapphireBlue),
                          icon: const Icon(Icons.call_rounded),
                          onPressed: () {
                            if (techPhone.isNotEmpty) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(content: Text('Calling technician at $techPhone...')),
                              );
                            } else {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(content: Text('Technician phone number not available')),
                              );
                            }
                          },
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    const Divider(height: 1, color: AppTheme.slateBorder),
                    const SizedBox(height: 8),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: const [
                        Text('Service Vehicle:', style: TextStyle(fontSize: 11.5, color: AppTheme.slateMuted)),
                        Text('Two-Wheeler Service Unit', style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.bold, color: AppTheme.slateDark)),
                      ],
                    ),
                  ],
                ),
              ),
            ],

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
                                idx == 0 && _isUnassigned ? 'Dispatching Fleet' : step['label']!,
                                style: TextStyle(
                                  fontSize: 13,
                                  fontWeight: isCurrent || isDone ? FontWeight.bold : FontWeight.w500,
                                  color: isCurrent || isDone ? AppTheme.slateDark : AppTheme.slateMuted,
                                ),
                              ),
                              Text(
                                idx == 0 && _isUnassigned
                                    ? 'Locating nearest certified pro in PIN ${_job.pincode}'
                                    : (step['key'] == 'IN_PROGRESS' && _job.status.toUpperCase() == 'SAFETY_CHECKED'
                                        ? 'Safety verified • Repair in progress'
                                        : (idx == 0 && !_isUnassigned ? 'Assigned to $techName' : step['sub']!)),
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
                          setState(() {
                            _job = _job.copyWith(status: 'WAITING_CUSTOMER_APPROVAL');
                          });
                          _openPartsApprovalModal(null);
                        },
                        child: const Text('Parts Quote', style: TextStyle(fontSize: 11, color: Color(0xFFD97706), fontWeight: FontWeight.bold)),
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
