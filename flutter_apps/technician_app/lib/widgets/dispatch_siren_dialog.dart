import 'dart:async';
import 'package:flutter/material.dart';
import '../core/audio_service.dart';
import '../core/theme.dart';
import '../models/tech_job_model.dart';

class DispatchSirenDialog extends StatefulWidget {
  final TechJobModel job;
  final Function(bool accepted) onResponse;

  const DispatchSirenDialog({
    super.key,
    required this.job,
    required this.onResponse,
  });

  @override
  State<DispatchSirenDialog> createState() => _DispatchSirenDialogState();
}

class _DispatchSirenDialogState extends State<DispatchSirenDialog> with SingleTickerProviderStateMixin {
  int _secondsRemaining = 60;
  Timer? _countdownTimer;
  late AnimationController _pulseController;

  @override
  void initState() {
    super.initState();
    AudioService.startDispatchSiren();

    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    )..repeat(reverse: true);

    _countdownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_secondsRemaining > 1) {
        setState(() => _secondsRemaining--);
      } else {
        _handleDecline();
      }
    });
  }

  @override
  void dispose() {
    _countdownTimer?.cancel();
    _pulseController.dispose();
    AudioService.stopDispatchSiren();
    super.dispose();
  }

  void _handleAccept() {
    _countdownTimer?.cancel();
    AudioService.stopDispatchSiren();
    widget.onResponse(true);
  }

  void _handleDecline() {
    _countdownTimer?.cancel();
    AudioService.stopDispatchSiren();
    widget.onResponse(false);
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: Colors.transparent,
      insetPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
      child: Container(
        decoration: BoxDecoration(
          color: TechTheme.bgDark,
          borderRadius: BorderRadius.circular(28),
          border: Border.all(color: TechTheme.primaryAmber, width: 2),
          boxShadow: [
            BoxShadow(
              color: TechTheme.primaryAmber.withOpacity(0.35),
              blurRadius: 30,
              spreadRadius: 4,
            ),
          ],
        ),
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Siren Header
            AnimatedBuilder(
              animation: _pulseController,
              builder: (context, child) {
                return Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                  decoration: BoxDecoration(
                    color: TechTheme.signalCrimson.withOpacity(0.2 + (_pulseController.value * 0.3)),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: TechTheme.signalCrimson),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: const [
                      Icon(Icons.warning_amber_rounded, color: Colors.white, size: 18),
                      SizedBox(width: 6),
                      Text(
                        'HIGH PRIORITY DISPATCH ALERT',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 11,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 1.0,
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
            const SizedBox(height: 20),

            // Circular Countdown Timer
            Stack(
              alignment: Alignment.center,
              children: [
                SizedBox(
                  width: 90,
                  height: 90,
                  child: CircularProgressIndicator(
                    value: _secondsRemaining / 60.0,
                    strokeWidth: 6,
                    backgroundColor: Colors.white12,
                    valueColor: AlwaysStoppedAnimation<Color>(
                      _secondsRemaining < 15 ? TechTheme.signalCrimson : TechTheme.primaryAmber,
                    ),
                  ),
                ),
                Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      '$_secondsRemaining',
                      style: const TextStyle(
                        fontSize: 32,
                        fontWeight: FontWeight.w900,
                        color: Colors.white,
                      ),
                    ),
                    const Text(
                      'SECONDS',
                      style: TextStyle(
                        fontSize: 9,
                        fontWeight: FontWeight.w700,
                        color: Colors.white54,
                        letterSpacing: 0.5,
                      ),
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 20),

            // Service Title & Ticket
            Text(
              widget.job.serviceTitle,
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w800,
                color: Colors.white,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 4),
            Text(
              'Ticket #${widget.job.jobTicketNumber} • Pin: ${widget.job.pincode}',
              style: const TextStyle(fontSize: 12, color: Colors.white60, fontWeight: FontWeight.w500),
            ),
            const SizedBox(height: 16),

            // Payout Badge (70% Direct Share)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              decoration: BoxDecoration(
                color: TechTheme.bgDarkCard,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: TechTheme.signalOnlineEmerald.withOpacity(0.5)),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: const [
                      Text('YOUR 70% COMMISSION', style: TextStyle(fontSize: 10, color: Colors.white60, fontWeight: FontWeight.w700)),
                      Text('Direct bank/UPI payout', style: TextStyle(fontSize: 9, color: Colors.white38)),
                    ],
                  ),
                  Text(
                    '₹${widget.job.techEarningInr.toStringAsFixed(0)}',
                    style: const TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.w900,
                      color: TechTheme.signalOnlineEmerald,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 14),

            // Address Preview
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: TechTheme.bgDarkCard,
                borderRadius: BorderRadius.circular(14),
              ),
              child: Row(
                children: [
                  const Icon(Icons.location_on_outlined, color: TechTheme.primaryAmber, size: 20),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      widget.job.customerAddressText,
                      style: const TextStyle(fontSize: 12, color: Colors.white70, height: 1.3),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Accept & Decline Buttons
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      side: const BorderSide(color: Colors.white30),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                    onPressed: _handleDecline,
                    child: const Text('DECLINE', style: TextStyle(color: Colors.white70, fontWeight: FontWeight.w800)),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  flex: 2,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: TechTheme.primaryAmber,
                      foregroundColor: TechTheme.slateDark,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                    onPressed: _handleAccept,
                    child: const Text('ACCEPT ORDER', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 14)),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

