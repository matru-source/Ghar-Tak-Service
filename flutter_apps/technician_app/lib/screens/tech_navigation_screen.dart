import 'dart:async';
import 'package:flutter/material.dart';
import '../../core/theme.dart';
import '../../models/tech_job_model.dart';
import '../../services/tech_job_service.dart';
import 'safety_checklist_screen.dart';

class TechNavigationScreen extends StatefulWidget {
  final TechJobModel job;

  const TechNavigationScreen({
    super.key,
    required this.job,
  });

  @override
  State<TechNavigationScreen> createState() => _TechNavigationScreenState();
}

class _TechNavigationScreenState extends State<TechNavigationScreen> with SingleTickerProviderStateMixin {
  late TechJobModel _job;
  int _etaMinutes = 11;
  double _distanceKm = 2.4;
  bool _hasArrived = false;
  bool _isUpdating = false;
  Timer? _telemetryTimer;
  late AnimationController _radarController;

  @override
  void initState() {
    super.initState();
    _job = widget.job;
    _hasArrived = _job.status == 'ARRIVED' || _job.status == 'DOORSTEP_ARRIVED';

    _radarController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat();

    _startTelemetryTimer();
  }

  @override
  void dispose() {
    _telemetryTimer?.cancel();
    _radarController.dispose();
    super.dispose();
  }

  void _startTelemetryTimer() {
    _telemetryTimer = Timer.periodic(const Duration(seconds: 5), (timer) async {
      if (_distanceKm > 0.3) {
        setState(() {
          _distanceKm -= 0.2;
          if (_etaMinutes > 2) _etaMinutes--;
        });
      }

      await TechJobService.updateCustomerTelemetry(
        jobId: _job.id,
        lat: 18.9220 + (_distanceKm * 0.005),
        lng: 72.8347 + (_distanceKm * 0.005),
        etaMinutes: _etaMinutes,
      );
    });
  }

  Future<void> _handleArrivedAtDoorstep() async {
    setState(() => _isUpdating = true);

    await TechJobService.updateCustomerTelemetry(
      jobId: _job.id,
      lat: 18.9220,
      lng: 72.8347,
      status: 'ARRIVED',
      etaMinutes: 0,
    );

    setState(() {
      _hasArrived = true;
      _distanceKm = 0.0;
      _etaMinutes = 0;
      _isUpdating = false;
      _job = _job.copyWith(status: 'ARRIVED');
    });

    if (mounted) {
      showDialog(
        context: context,
        builder: (ctx) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: Row(
            children: const [
              Icon(Icons.doorbell_rounded, color: TechTheme.signalOnlineEmerald, size: 28),
              SizedBox(width: 8),
              Text('Doorstep Arrival Logged', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            ],
          ),
          content: const Text(
            'Customer app has been notified of your arrival. Please verify your 1000V dielectric safety equipment before opening any circuit panel.',
            style: TextStyle(fontSize: 13, height: 1.4),
          ),
          actions: [
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: TechTheme.flameOrange,
                foregroundColor: Colors.white,
              ),
              onPressed: () {
                Navigator.pop(ctx);
                _proceedToSafetyGate();
              },
              child: const Text('PROCEED TO SAFETY GATE'),
            ),
          ],
        ),
      );
    }
  }

  void _proceedToSafetyGate() async {
    final passed = await Navigator.push<bool>(
      context,
      MaterialPageRoute(
        builder: (_) => SafetyChecklistScreen(job: _job),
      ),
    );
    if (passed == true && mounted) {
      Navigator.pop(context); // Return cleanly to dashboard with active job card in progress
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: TechTheme.slateLight,
      appBar: AppBar(
        title: Text('En Route: #${_job.jobTicketNumber}'),
        backgroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.phone_in_talk_rounded, color: TechTheme.signalCobalt),
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text('Calling customer ${_job.customerName}: ${_job.customerPhone}')),
              );
            },
          ),
        ],
      ),
      body: Column(
        children: [
          // Simulated Radar Canvas
          Container(
            height: 240,
            width: double.infinity,
            color: const Color(0xFF0F172A),
            child: Stack(
              alignment: Alignment.center,
              children: [
                // Animated radar rings
                AnimatedBuilder(
                  animation: _radarController,
                  builder: (context, child) {
                    return CustomPaint(
                      painter: _RadarPulsePainter(_radarController.value),
                      size: const Size(200, 200),
                    );
                  },
                ),
                // Technician position
                Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: const BoxDecoration(
                        color: TechTheme.flameOrange,
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(color: TechTheme.flameOrange, blurRadius: 16, spreadRadius: 2),
                        ],
                      ),
                      child: const Icon(Icons.navigation_rounded, color: Colors.white, size: 28),
                    ),
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.black.withOpacity(0.6),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        _hasArrived ? 'AT DOORSTEP' : '${_distanceKm.toStringAsFixed(1)} KM • $_etaMinutes MINS',
                        style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 12, color: Colors.white),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          // Customer Premise & Instructions Card
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(color: TechTheme.slateBorder),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('DESTINATION PREMISE', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: TechTheme.slateMuted, letterSpacing: 0.5)),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(color: const Color(0xFFEFF6FF), borderRadius: BorderRadius.circular(6)),
                              child: Text('PIN: ${_job.pincode}', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: TechTheme.signalCobalt)),
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),
                        Text(_job.customerAddressText, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: TechTheme.slateDark, height: 1.3)),
                        const SizedBox(height: 12),
                        const Divider(),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            const Icon(Icons.person_rounded, size: 16, color: TechTheme.slateMuted),
                            const SizedBox(width: 8),
                            Text(_job.customerName, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: TechTheme.slateDark)),
                            const Spacer(),
                            Text(_job.customerPhone, style: const TextStyle(fontSize: 12, color: TechTheme.slateMuted)),
                          ],
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 16),

                  // Service Overview Card
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(color: TechTheme.slateBorder),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('WORK ORDER SCOPE', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: TechTheme.slateMuted, letterSpacing: 0.5)),
                        const SizedBox(height: 8),
                        Text(_job.serviceTitle, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: TechTheme.slateDark)),
                        const SizedBox(height: 6),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('Estimated Labor Payout:', style: TextStyle(fontSize: 12, color: TechTheme.slateMuted)),
                            Text('₹${_job.techEarningInr.toStringAsFixed(0)}', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: TechTheme.signalOnlineEmerald)),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Bottom Action Bar
          Container(
            padding: const EdgeInsets.all(16),
            decoration: const BoxDecoration(
              color: Colors.white,
              border: Border(top: BorderSide(color: TechTheme.slateBorder)),
            ),
            child: Row(
              children: [
                if (!_hasArrived)
                  Expanded(
                    child: ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: TechTheme.signalOnlineEmerald,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      ),
                      onPressed: _isUpdating ? null : _handleArrivedAtDoorstep,
                      icon: const Icon(Icons.doorbell_rounded),
                      label: const Text('I HAVE ARRIVED AT DOORSTEP', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                    ),
                  )
                else
                  Expanded(
                    child: ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: TechTheme.flameOrange,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      ),
                      onPressed: _proceedToSafetyGate,
                      icon: const Icon(Icons.bolt_rounded),
                      label: const Text('PROCEED TO 1000V SAFETY GATE', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _RadarPulsePainter extends CustomPainter {
  final double animationValue;

  _RadarPulsePainter(this.animationValue);

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final paint = Paint()
      ..color = TechTheme.flameOrange.withOpacity((1.0 - animationValue).clamp(0.0, 1.0) * 0.5)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.0;

    canvas.drawCircle(center, 40 * animationValue + 30, paint);
    canvas.drawCircle(center, 70 * animationValue + 40, paint);
  }

  @override
  bool shouldRepaint(covariant _RadarPulsePainter oldDelegate) => true;
}

