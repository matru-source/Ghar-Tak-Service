import 'dart:async';
import 'dart:math';
import 'package:flutter/material.dart';
import '../core/audio_service.dart';
import '../core/theme.dart';
import '../models/tech_job_model.dart';
import '../services/tech_job_service.dart';

class TechDispatchAlertScreen extends StatefulWidget {
  final TechJobModel job;
  final Function(TechJobModel acceptedJob) onAccepted;

  const TechDispatchAlertScreen({
    super.key,
    required this.job,
    required this.onAccepted,
  });

  @override
  State<TechDispatchAlertScreen> createState() => _TechDispatchAlertScreenState();
}

class _TechDispatchAlertScreenState extends State<TechDispatchAlertScreen> with SingleTickerProviderStateMixin {
  int _secondsRemaining = 60;
  Timer? _timer;
  bool _isProcessing = false;
  late AnimationController _pulseController;

  @override
  void initState() {
    super.initState();
    _startCountdown();
    AudioService.playDispatchSiren();

    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1000),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _timer?.cancel();
    _pulseController.dispose();
    AudioService.stopSiren();
    super.dispose();
  }

  void _startCountdown() {
    _timer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (_secondsRemaining > 1) {
        setState(() => _secondsRemaining--);
      } else {
        t.cancel();
        _handleDecline(timeout: true);
      }
    });
  }

  Future<void> _handleAccept() async {
    setState(() => _isProcessing = true);
    AudioService.stopSiren();

    final success = await TechJobService.respondToDispatch(
      jobId: widget.job.id,
      accept: true,
    );

    setState(() => _isProcessing = false);

    if (mounted) {
      final updated = widget.job.copyWith(status: 'EN_ROUTE');
      Navigator.pop(context);
      widget.onAccepted(updated);
    }
  }

  Future<void> _handleDecline({bool timeout = false}) async {
    setState(() => _isProcessing = true);
    AudioService.stopSiren();

    await TechJobService.respondToDispatch(
      jobId: widget.job.id,
      accept: false,
      reason: timeout ? 'TIMEOUT_EXPIRED_60S' : 'TECHNICIAN_DECLINED',
    );

    if (mounted) {
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(timeout ? 'Dispatch window expired. Job passed to next technician.' : 'Dispatch declined.'),
          backgroundColor: TechTheme.slateMuted,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final urgencyColor = _secondsRemaining <= 15
        ? TechTheme.signalAlertCrimson
        : _secondsRemaining <= 30
            ? const Color(0xFFD97706)
            : TechTheme.flameOrange;

    return WillPopScope(
      onWillPop: () async => false, // Prevent accidental dismiss
      child: Scaffold(
        backgroundColor: const Color(0xFF0F172A),
        body: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            child: Column(
              children: [
                // Top Header Pill
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                  decoration: BoxDecoration(
                    color: urgencyColor.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: urgencyColor.withOpacity(0.4)),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.bolt_rounded, color: urgencyColor, size: 16),
                      const SizedBox(width: 6),
                      Text(
                        'PRIORITY DOORSTEP DISPATCH',
                        style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: urgencyColor, letterSpacing: 1),
                      ),
                    ],
                  ),
                ),

                const Spacer(),

                // 60-Second Circular Countdown Radar
                Stack(
                  alignment: Alignment.center,
                  children: [
                    SizedBox(
                      width: 170,
                      height: 170,
                      child: CircularProgressIndicator(
                        value: _secondsRemaining / 60.0,
                        strokeWidth: 10,
                        backgroundColor: const Color(0xFF1E293B),
                        valueColor: AlwaysStoppedAnimation<Color>(urgencyColor),
                      ),
                    ),
                    Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          '$_secondsRemaining',
                          style: TextStyle(
                            fontSize: 52,
                            fontWeight: FontWeight.w900,
                            color: urgencyColor,
                            height: 1.0,
                          ),
                        ),
                        const SizedBox(height: 4),
                        const Text(
                          'SECONDS',
                          style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: Color(0xFF94A3B8), letterSpacing: 1),
                        ),
                      ],
                    ),
                  ],
                ),

                const Spacer(),

                // Job Details Card
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: const Color(0xFF1E293B),
                    borderRadius: BorderRadius.circular(22),
                    border: Border.all(color: const Color(0xFF334155)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            '#${widget.job.jobTicketNumber}',
                            style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: urgencyColor),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: TechTheme.signalOnlineBg,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              '₹${widget.job.techEarningInr.toStringAsFixed(0)} EARNING',
                              style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 13, color: TechTheme.signalOnlineEmerald),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      Text(
                        widget.job.serviceTitle,
                        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          const Icon(Icons.location_on_rounded, size: 16, color: Color(0xFF94A3B8)),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              widget.job.customerAddressText,
                              style: const TextStyle(fontSize: 12, color: Color(0xFFCBD5E1)),
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          const Icon(Icons.timer_outlined, size: 16, color: Color(0xFF94A3B8)),
                          const SizedBox(width: 8),
                          Text(
                            'Est. Travel: 2.4 km (~10 mins) • Pin: ${widget.job.pincode}',
                            style: const TextStyle(fontSize: 12, color: Color(0xFF94A3B8)),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 24),

                // Accept & Decline Buttons
                Row(
                  children: [
                    Expanded(
                      flex: 2,
                      child: OutlinedButton(
                        style: OutlinedButton.styleFrom(
                          foregroundColor: const Color(0xFF94A3B8),
                          side: const BorderSide(color: Color(0xFF475569)),
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        ),
                        onPressed: _isProcessing ? null : () => _handleDecline(timeout: false),
                        child: const Text('PASS', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      flex: 4,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: TechTheme.signalOnlineEmerald,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                          elevation: 6,
                        ),
                        onPressed: _isProcessing ? null : _handleAccept,
                        child: _isProcessing
                            ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                            : const Text('ACCEPT WORK ORDER', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 14, letterSpacing: 0.5)),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

