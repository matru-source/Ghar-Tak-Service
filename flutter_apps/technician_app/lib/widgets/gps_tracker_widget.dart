import 'package:flutter/material.dart';
import '../core/theme.dart';

class GpsTrackerWidget extends StatefulWidget {
  final bool isTracking;
  final String statusText;

  const GpsTrackerWidget({
    super.key,
    required this.isTracking,
    this.statusText = 'Live Telemetry Active • Broadcasting to Fleet Command',
  });

  @override
  State<GpsTrackerWidget> createState() => _GpsTrackerWidgetState();
}

class _GpsTrackerWidgetState extends State<GpsTrackerWidget> with SingleTickerProviderStateMixin {
  late AnimationController _pulseController;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat();
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (!widget.isTracking) return const SizedBox.shrink();

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: TechTheme.bgDarkCard,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: TechTheme.signalOnlineEmerald.withOpacity(0.4)),
      ),
      child: Row(
        children: [
          AnimatedBuilder(
            animation: _pulseController,
            builder: (context, child) {
              return Stack(
                alignment: Alignment.center,
                children: [
                  Container(
                    width: 18 + (_pulseController.value * 12),
                    height: 18 + (_pulseController.value * 12),
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: TechTheme.signalOnlineEmerald.withOpacity(0.4 - (_pulseController.value * 0.4)),
                    ),
                  ),
                  Container(
                    width: 10,
                    height: 10,
                    decoration: const BoxDecoration(
                      shape: BoxShape.circle,
                      color: TechTheme.signalOnlineEmerald,
                    ),
                  ),
                ],
              );
            },
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              widget.statusText,
              style: const TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: Colors.white,
              ),
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }
}
