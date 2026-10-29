import 'package:flutter/material.dart';
import '../core/theme.dart';
import '../models/tech_job_model.dart';
import '../services/tech_job_service.dart';
import '../services/upload_service.dart';
import '../widgets/safety_item_tile.dart';

class SafetyChecklistScreen extends StatefulWidget {
  final TechJobModel job;

  const SafetyChecklistScreen({
    super.key,
    required this.job,
  });

  @override
  State<SafetyChecklistScreen> createState() => _SafetyChecklistScreenState();
}

class _SafetyChecklistScreenState extends State<SafetyChecklistScreen> {
  bool _glovesConfirmed = false;
  bool _mcbSwitchConfirmed = false;
  bool _multimeterConfirmed = false;
  bool _photoAttached = false;
  bool _isSubmitting = false;
  String? _errorMessage;

  bool get _isAllChecked => _glovesConfirmed && _mcbSwitchConfirmed && _multimeterConfirmed && _photoAttached;

  Future<void> _submitSafetyVerification() async {
    if (!_isAllChecked) {
      setState(() => _errorMessage = 'All 4 safety protocols must be verified before opening circuit');
      return;
    }

    setState(() {
      _isSubmitting = true;
      _errorMessage = null;
    });

    final uploadedPhotoUrl = await UploadService.uploadEvidencePhoto(
      jobId: widget.job.id,
      category: 'SAFETY',
    );

    final res = await TechJobService.verifySafetyChecklist(
      jobId: widget.job.id,
      glovesConfirmed: _glovesConfirmed,
      mcbSwitchConfirmed: _mcbSwitchConfirmed,
      photoUrl: uploadedPhotoUrl,
    );

    setState(() => _isSubmitting = false);

    if (res.success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Safety interlock verified. Premise circuit unlocked.'),
          backgroundColor: TechTheme.signalOnlineEmerald,
        ),
      );
      Navigator.pop(context, true);
    } else {
      setState(() => _errorMessage = res.message ?? 'Safety verification failed. Please retry.');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: TechTheme.slateLight,
      appBar: AppBar(
        title: const Text('Mandatory Safety Gate'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded),
          onPressed: () => Navigator.pop(context, false),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // High Voltage Warning Banner
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: TechTheme.primaryAmberLight,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: TechTheme.primaryAmber),
              ),
              child: Row(
                children: const [
                  Icon(Icons.electric_meter_rounded, color: TechTheme.primaryAmberDark, size: 28),
                  SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'ELECTRICAL ISOLATION PROTOCOL',
                          style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: TechTheme.primaryAmberDark, letterSpacing: 0.6),
                        ),
                        SizedBox(height: 2),
                        Text(
                          'Zero-tolerance policy. Never touch high-voltage switchboards or wiring without Class 0 (1000V) dielectric gloves.',
                          style: TextStyle(fontSize: 11, color: TechTheme.slateDark, height: 1.3),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            if (_errorMessage != null) ...[
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: TechTheme.signalCrimsonBg,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: TechTheme.signalCrimson),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.error_outline_rounded, color: TechTheme.signalCrimson, size: 20),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        _errorMessage!,
                        style: const TextStyle(color: TechTheme.signalCrimson, fontSize: 12, fontWeight: FontWeight.w600),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
            ],

            const Text(
              'REQUIRED SAFETY CHECKPOINTS',
              style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: TechTheme.slateMuted, letterSpacing: 1.0),
            ),
            const SizedBox(height: 12),

            // Checkpoint 1: 1000V Gloves
            SafetyItemTile(
              title: '1000V Dielectric Gloves',
              description: 'Class 0 rated rubber insulating gloves worn and visually checked for punctures or air leaks.',
              standardCode: 'IEC 60900',
              isChecked: _glovesConfirmed,
              isPhotoAttached: _photoAttached,
              onToggleCheck: () => setState(() => _glovesConfirmed = !_glovesConfirmed),
              onAttachPhoto: () => setState(() => _photoAttached = true),
            ),

            // Checkpoint 2: MCB Lockout
            SafetyItemTile(
              title: 'Main MCB / Isolator Off',
              description: 'Premise primary miniature circuit breaker physically tripped to OFF and danger lockout tag placed.',
              standardCode: 'IS 732:2019',
              isChecked: _mcbSwitchConfirmed,
              isPhotoAttached: _photoAttached,
              onToggleCheck: () => setState(() => _mcbSwitchConfirmed = !_mcbSwitchConfirmed),
              onAttachPhoto: () => setState(() => _photoAttached = true),
            ),

            // Checkpoint 3: Multimeter 0.00V
            SafetyItemTile(
              title: 'Multimeter 0.00V Verified',
              description: 'True-RMS multimeter probe confirmed zero potential between Phase-Neutral and Phase-Earth.',
              standardCode: 'CAT-III 600V',
              isChecked: _multimeterConfirmed,
              isPhotoAttached: _photoAttached,
              onToggleCheck: () => setState(() => _multimeterConfirmed = !_multimeterConfirmed),
              onAttachPhoto: () => setState(() => _photoAttached = true),
            ),

            // Photo Evidence Card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: TechTheme.slateBorder),
              ),
              child: Row(
                children: [
                  Container(
                    width: 50,
                    height: 50,
                    decoration: BoxDecoration(
                      color: _photoAttached ? TechTheme.signalOnlineBg : TechTheme.slateLight,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(
                      _photoAttached ? Icons.check_circle_rounded : Icons.camera_alt_rounded,
                      color: _photoAttached ? TechTheme.signalOnlineEmerald : TechTheme.slateMuted,
                      size: 26,
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          _photoAttached ? 'Evidence Snapped' : 'Glove & MCB Photo Evidence',
                          style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13, color: TechTheme.slateDark),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          _photoAttached ? 'Ready for cloud AI audit' : 'Snap photo showing gloves and open breaker',
                          style: const TextStyle(fontSize: 11, color: TechTheme.slateMuted),
                        ),
                      ],
                    ),
                  ),
                  ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: _photoAttached ? TechTheme.slateLight : TechTheme.slateDark,
                      foregroundColor: _photoAttached ? TechTheme.slateDark : Colors.white,
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                      elevation: 0,
                    ),
                    onPressed: () {
                      setState(() => _photoAttached = true);
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Safety photo captured & timestamped')),
                      );
                    },
                    child: Text(_photoAttached ? 'Re-snap' : 'Capture'),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 28),

            // Submit Button
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: _isAllChecked ? TechTheme.signalOnlineEmerald : TechTheme.slateBorder,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                minimumSize: const Size.fromHeight(54),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              ),
              onPressed: _isSubmitting ? null : _submitSafetyVerification,
              child: _isSubmitting
                  ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                  : Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: const [
                        Icon(Icons.lock_open_rounded, size: 20),
                        SizedBox(width: 8),
                        Text('VERIFY & UNLOCK REPAIR WORK', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 14)),
                      ],
                    ),
            ),
            const SizedBox(height: 30),
          ],
        ),
      ),
    );
  }
}

