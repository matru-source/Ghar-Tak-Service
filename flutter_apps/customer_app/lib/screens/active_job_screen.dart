import 'dart:async';
import 'package:flutter/material.dart';
import '../core/theme.dart';
import '../models/job_model.dart';
import '../services/job_service.dart';
import '../widgets/handover_otp_card.dart';
import '../widgets/technician_card.dart';
import 'home_screen.dart';
import 'invoice_screen.dart';

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
  bool _isRefreshing = false;
  bool _isSosActive = false;

  @override
  void initState() {
    super.initState();
    _job = widget.initialJob;
    _startPolling();
  }

  @override
  void dispose() {
    _statusPoller?.cancel();
    super.dispose();
  }

  void _startPolling() {
    _statusPoller = Timer.periodic(const Duration(seconds: 4), (timer) async {
      final updated = await JobService.getJobDetails(_job.id);
      if (updated != null && mounted) {
        setState(() => _job = updated);
        if (_job.status == 'WORK_COMPLETED') {
          timer.cancel();
          // Prompt user or auto-transition
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Repair complete! Generating your GST tax invoice...'),
              backgroundColor: AppTheme.signalEmerald,
            ),
          );
          Future.delayed(const Duration(seconds: 1), () {
            if (mounted) {
              Navigator.pushReplacement(
                context,
                MaterialPageRoute(builder: (_) => InvoiceScreen(job: _job)),
              );
            }
          });
        }
      }
    });
  }

  Future<void> _manualRefresh() async {
    setState(() => _isRefreshing = true);
    final updated = await JobService.getJobDetails(_job.id);
    if (updated != null && mounted) {
      setState(() => _job = updated);
      if (_job.status == 'WORK_COMPLETED') {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (_) => InvoiceScreen(job: _job)),
        );
      }
    }
    setState(() => _isRefreshing = false);
  }

  void _triggerSos() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Row(
          children: const [
            Icon(Icons.warning_amber_rounded, color: AppTheme.signalCrimson, size: 28),
            SizedBox(width: 8),
            Text('Trigger Emergency SOS', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          ],
        ),
        content: const Text(
          'This will immediately alert the ZEX 24/7 Security Operations Center, broadcast your GPS coordinates to our emergency field fleet, and log an audit incident ticket.',
          style: TextStyle(fontSize: 13, height: 1.4),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel', style: TextStyle(color: AppTheme.slateMuted)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.signalCrimson),
            onPressed: () async {
              Navigator.pop(ctx);
              setState(() => _isSosActive = true);
              final success = await JobService.triggerEmergencySos(
                _job.id,
                'Customer safety SOS triggered during dispatch',
              );
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(success ? 'SOS Alert Dispatched to Emergency Fleet' : 'Failed to reach SOS server'),
                    backgroundColor: success ? AppTheme.signalCrimson : Colors.grey,
                  ),
                );
              }
            },
            child: const Text('CONFIRM SOS', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  int _getStatusStep(String status) {
    switch (status) {
      case 'PENDING_ACCEPTANCE':
        return 0;
      case 'ASSIGNED':
        return 1;
      case 'EN_ROUTE':
        return 2;
      case 'ARRIVED':
        return 3;
      case 'SAFETY_CHECKED':
        return 4;
      case 'IN_PROGRESS':
        return 4;
      case 'WORK_COMPLETED':
        return 5;
      default:
        return 1;
    }
  }

  @override
  Widget build(BuildContext context) {
    final currentStep = _getStatusStep(_job.status);

    return Scaffold(
      backgroundColor: AppTheme.slateLight,
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Ticket #${_job.jobTicketNumber}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            Text(_job.serviceTitle, style: const TextStyle(fontSize: 12, color: AppTheme.slateMuted)),
          ],
        ),
        actions: [
          IconButton(
            icon: _isRefreshing
                ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))
                : const Icon(Icons.refresh_rounded),
            onPressed: _manualRefresh,
          ),
          IconButton(
            icon: const Icon(Icons.close_rounded),
            onPressed: () {
              Navigator.pushAndRemoveUntil(
                context,
                MaterialPageRoute(builder: (_) => const HomeScreen()),
                (route) => false,
              );
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Status Banner
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              decoration: BoxDecoration(
                color: _getStatusBgColor(_job.status),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: _getStatusBorderColor(_job.status)),
              ),
              child: Row(
                children: [
                  Icon(_getStatusIcon(_job.status), color: _getStatusTextColor(_job.status), size: 24),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          _getStatusTitle(_job.status),
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w800,
                            color: _getStatusTextColor(_job.status),
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          _getStatusSubtitle(_job.status),
                          style: TextStyle(
                            fontSize: 11,
                            color: _getStatusTextColor(_job.status).withOpacity(0.85),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // 5-Stage Stepper Track
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppTheme.slateBorder),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'LIVE WORKFLOW TRACKER',
                    style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: AppTheme.slateMuted, letterSpacing: 1.0),
                  ),
                  const SizedBox(height: 16),
                  _buildWorkflowStep(1, 'Technician Assigned', 'Rajesh K. accepted service order', currentStep >= 1, currentStep == 1),
                  _buildWorkflowDivider(currentStep > 1),
                  _buildWorkflowStep(2, 'En Route to Doorstep', 'Live GPS telemetry active', currentStep >= 2, currentStep == 2),
                  _buildWorkflowDivider(currentStep > 2),
                  _buildWorkflowStep(3, 'Arrived at Location', 'Technician is outside premises', currentStep >= 3, currentStep == 3),
                  _buildWorkflowDivider(currentStep > 3),
                  _buildWorkflowStep(4, 'Safety Isolation Active', '1000V Gloves & MCB verified', currentStep >= 4, currentStep == 4),
                  _buildWorkflowDivider(currentStep > 4),
                  _buildWorkflowStep(5, 'Repair Completed', 'Quality verified & customer handover', currentStep >= 5, currentStep == 5),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Handover OTP Card
            if (_job.handoverOtp != null && _job.handoverOtp!.isNotEmpty) ...[
              HandoverOtpCard(otpCode: _job.handoverOtp!),
              const SizedBox(height: 20),
            ],

            // Assigned Technician Profile
            if (_job.technicianName != null) ...[
              TechnicianCard(
                name: _job.technicianName!,
                badgeNumber: _job.technicianBadge ?? 'GTS-TECH-101',
                rating: _job.technicianRating,
                phone: _job.technicianPhone ?? '+91 98200 12345',
                electricalLicenseNumber: 'PWD/MH/ELEC-883921',
                isGlovesVerified: _job.safetyGlovesConfirmed || currentStep >= 4,
              ),
              const SizedBox(height: 20),
            ],

            // Service Location Card
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
                  Row(
                    children: const [
                      Icon(Icons.location_on_outlined, color: AppTheme.primaryAmberDark, size: 20),
                      SizedBox(width: 8),
                      Text('Service Location', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13, color: AppTheme.slateDark)),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    _job.customerAddressText,
                    style: const TextStyle(fontSize: 13, color: AppTheme.slateDark, height: 1.3),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Pincode: ${_job.pincode}',
                    style: const TextStyle(fontSize: 11, color: AppTheme.slateMuted, fontWeight: FontWeight.w600),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Emergency SOS & Support
            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.white,
                      foregroundColor: AppTheme.signalCrimson,
                      side: const BorderSide(color: AppTheme.signalCrimson),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                    icon: const Icon(Icons.emergency_share_rounded, size: 20),
                    label: const Text('SOS Safety Alert', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                    onPressed: _triggerSos,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.slateDark,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                    icon: const Icon(Icons.support_agent_rounded, size: 20),
                    label: const Text('Live Support', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                    onPressed: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Connecting to Ghar Tak 24/7 Command Dispatch...')),
                      );
                    },
                  ),
                ),
              ],
            ),
            const SizedBox(height: 30),
          ],
        ),
      ),
    );
  }

  Widget _buildWorkflowStep(int stepNum, String title, String subtitle, bool isCompleted, bool isCurrent) {
    Color circleColor = isCompleted ? AppTheme.signalEmerald : AppTheme.slateBorder;
    Color textColor = isCompleted ? AppTheme.slateDark : AppTheme.slateMuted;

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 28,
          height: 28,
          decoration: BoxDecoration(
            color: isCompleted ? AppTheme.signalEmerald : (isCurrent ? AppTheme.primaryAmber : Colors.white),
            shape: BoxShape.circle,
            border: Border.all(
              color: isCompleted ? AppTheme.signalEmerald : (isCurrent ? AppTheme.primaryAmber : AppTheme.slateBorder),
              width: 2,
            ),
          ),
          child: Center(
            child: isCompleted
                ? const Icon(Icons.check, size: 16, color: Colors.white)
                : Text(
                    '$stepNum',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: isCurrent ? Colors.white : AppTheme.slateMuted,
                    ),
                  ),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: isCurrent || isCompleted ? FontWeight.w700 : FontWeight.w500,
                  color: textColor,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                subtitle,
                style: TextStyle(
                  fontSize: 11,
                  color: isCurrent ? AppTheme.primaryAmberDark : AppTheme.slateMuted,
                ),
              ),
            ],
          ),
        ),
        if (isCurrent)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
            decoration: BoxDecoration(
              color: AppTheme.primaryAmberLight,
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Text(
              'LIVE',
              style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: AppTheme.primaryAmberDark),
            ),
          ),
      ],
    );
  }

  Widget _buildWorkflowDivider(bool isCompleted) {
    return Container(
      margin: const EdgeInsets.only(left: 13, top: 4, bottom: 4),
      height: 20,
      width: 2,
      color: isCompleted ? AppTheme.signalEmerald : AppTheme.slateBorder,
    );
  }

  Color _getStatusBgColor(String status) {
    switch (status) {
      case 'WORK_COMPLETED':
        return AppTheme.signalEmeraldBg;
      case 'SAFETY_CHECKED':
      case 'IN_PROGRESS':
        return AppTheme.signalCobaltBg;
      case 'ARRIVED':
      case 'EN_ROUTE':
        return AppTheme.primaryAmberLight;
      default:
        return const Color(0xFFF1F5F9);
    }
  }

  Color _getStatusBorderColor(String status) {
    switch (status) {
      case 'WORK_COMPLETED':
        return AppTheme.signalEmerald.withOpacity(0.5);
      case 'SAFETY_CHECKED':
      case 'IN_PROGRESS':
        return AppTheme.signalCobalt.withOpacity(0.5);
      case 'ARRIVED':
      case 'EN_ROUTE':
        return AppTheme.primaryAmber;
      default:
        return AppTheme.slateBorder;
    }
  }

  Color _getStatusTextColor(String status) {
    switch (status) {
      case 'WORK_COMPLETED':
        return AppTheme.signalEmerald;
      case 'SAFETY_CHECKED':
      case 'IN_PROGRESS':
        return AppTheme.signalCobalt;
      case 'ARRIVED':
      case 'EN_ROUTE':
        return AppTheme.primaryAmberDark;
      default:
        return AppTheme.slateDark;
    }
  }

  IconData _getStatusIcon(String status) {
    switch (status) {
      case 'WORK_COMPLETED':
        return Icons.verified_rounded;
      case 'SAFETY_CHECKED':
      case 'IN_PROGRESS':
        return Icons.build_circle_rounded;
      case 'ARRIVED':
        return Icons.home_repair_service_rounded;
      case 'EN_ROUTE':
        return Icons.directions_bike_rounded;
      default:
        return Icons.person_pin_circle_rounded;
    }
  }

  String _getStatusTitle(String status) {
    switch (status) {
      case 'WORK_COMPLETED':
        return 'Job Successfully Completed';
      case 'SAFETY_CHECKED':
        return 'Safety Isolated (0.00V Verified)';
      case 'IN_PROGRESS':
        return 'Diagnostics & Repair In Progress';
      case 'ARRIVED':
        return 'Technician Arrived at Location';
      case 'EN_ROUTE':
        return 'Technician is En Route';
      case 'ASSIGNED':
      default:
        return 'Technician Dispatched & Assigned';
    }
  }

  String _getStatusSubtitle(String status) {
    switch (status) {
      case 'WORK_COMPLETED':
        return 'Warranty registered under ZEX-SHIELD AMC';
      case 'SAFETY_CHECKED':
      case 'IN_PROGRESS':
        return '1000V Gloves and MCB lockout verified';
      case 'ARRIVED':
        return 'Technician is waiting for premise entry';
      case 'EN_ROUTE':
        return 'Estimated arrival time: ~12-15 mins';
      case 'ASSIGNED':
      default:
        return 'Review credentials below before premise entry';
    }
  }
}
