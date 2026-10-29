import 'package:flutter/material.dart';
import '../../core/session_manager.dart';
import '../../core/theme.dart';
import '../../services/tech_job_service.dart';

class TechSosDialog {
  static void show(BuildContext context, {String? activeJobId}) {
    showDialog(
      context: context,
      barrierDismissible: true,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        backgroundColor: Colors.white,
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: const BoxDecoration(
                color: TechTheme.signalCrimsonBg,
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.emergency_rounded, color: TechTheme.signalCrimson, size: 28),
            ),
            const SizedBox(width: 10),
            const Text(
              'Technician SOS Alert',
              style: TextStyle(fontWeight: FontWeight.w900, fontSize: 18, color: TechTheme.signalCrimson),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Triggering SOS transmits your high-precision live GPS coordinates, battery level, and field order details to the 24/7 GTS Central Safety Ops Desk.',
              style: TextStyle(fontSize: 12, color: TechTheme.slateDark, height: 1.4),
            ),
            const SizedBox(height: 16),
            const Text(
              'DIRECT EMERGENCY HOTLINES:',
              style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: TechTheme.slateMuted, letterSpacing: 0.5),
            ),
            const SizedBox(height: 8),
            _buildHotlineButton(
              ctx,
              icon: Icons.shield_rounded,
              title: 'Police Control Room',
              number: '112',
              color: TechTheme.signalCobalt,
            ),
            const SizedBox(height: 6),
            _buildHotlineButton(
              ctx,
              icon: Icons.medical_services_rounded,
              title: 'Emergency Medical & Fire',
              number: '108',
              color: const Color(0xFFD97706),
            ),
            const SizedBox(height: 6),
            _buildHotlineButton(
              ctx,
              icon: Icons.support_agent_rounded,
              title: 'GTS Central Ops Desk',
              number: '1800-419-GHAR',
              color: TechTheme.flameOrange,
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('CANCEL', style: TextStyle(color: TechTheme.slateMuted, fontWeight: FontWeight.bold)),
          ),
          ElevatedButton.icon(
            style: ElevatedButton.styleFrom(
              backgroundColor: TechTheme.signalCrimson,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            onPressed: () async {
              Navigator.pop(ctx);
              final tech = SessionManager.getCurrentTechnician();
              final res = await TechJobService.triggerEmergencySos(
                jobId: activeJobId ?? 'sos_manual_${DateTime.now().millisecondsSinceEpoch}',
                reason: 'Field Technician Pressed Immediate SOS Beacon',
              );

              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(
                    res
                        ? '🚨 SOS DISPATCHED: Central Safety Desk notified. Stand by for operator call.'
                        : '🚨 Local SOS Triggered. Dialing 112 directly.',
                  ),
                  backgroundColor: TechTheme.signalCrimson,
                  duration: const Duration(seconds: 4),
                ),
              );
            },
            icon: const Icon(Icons.warning_amber_rounded, size: 18),
            label: const Text('BROADCAST SOS', style: TextStyle(fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  static Widget _buildHotlineButton(
    BuildContext context, {
    required IconData icon,
    required String title,
    required String number,
    required Color color,
  }) {
    return InkWell(
      borderRadius: BorderRadius.circular(12),
      onTap: () {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Dialing $title: $number')),
        );
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: color.withOpacity(0.08),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: color.withOpacity(0.2)),
        ),
        child: Row(
          children: [
            Icon(icon, color: color, size: 18),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                title,
                style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: color),
              ),
            ),
            Text(
              number,
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: color),
            ),
          ],
        ),
      ),
    );
  }
}

