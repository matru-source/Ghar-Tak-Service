import 'package:flutter/material.dart';
import '../core/theme.dart';
import '../models/tech_job_model.dart';
import '../services/tech_job_service.dart';
import 'wallet_screen.dart';

class JobCompletionScreen extends StatefulWidget {
  final TechJobModel job;

  const JobCompletionScreen({
    super.key,
    required this.job,
  });

  @override
  State<JobCompletionScreen> createState() => _JobCompletionScreenState();
}

class _JobCompletionScreenState extends State<JobCompletionScreen> {
  final _otpController = TextEditingController();
  final _notesController = TextEditingController(text: 'Replaced faulty miniature breaker, verified terminal torque, and confirmed 230V balanced output.');
  bool _isPhotoSnapped = false;
  bool _isSubmitting = false;
  String? _errorMessage;

  Future<void> _handleCompleteJob() async {
    final otp = _otpController.text.trim();
    if (otp.length != 4) {
      setState(() => _errorMessage = 'Please ask customer for their 4-digit Handover Code');
      return;
    }

    setState(() {
      _isSubmitting = true;
      _errorMessage = null;
    });

    final res = await TechJobService.completeJob(
      jobId: widget.job.id,
      handoverOtp: otp,
      resolutionNotes: _notesController.text.trim(),
      afterPhotoUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800',
    );

    setState(() => _isSubmitting = false);

    if (res.success && mounted) {
      _showPayoutCelebrationDialog();
    } else {
      setState(() => _errorMessage = res.message ?? 'Invalid Handover OTP. Please ask customer to check their screen.');
    }
  }

  void _showPayoutCelebrationDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: const BoxDecoration(
                color: TechTheme.signalOnlineBg,
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.check_circle_rounded, color: TechTheme.signalOnlineEmerald, size: 52),
            ),
            const SizedBox(height: 18),
            const Text(
              'Job Completed & Verified!',
              style: TextStyle(fontWeight: FontWeight.w900, fontSize: 18, color: TechTheme.slateDark),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              'Ticket #${widget.job.jobTicketNumber} closed successfully.',
              style: const TextStyle(fontSize: 12, color: TechTheme.slateMuted),
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: TechTheme.slateLight,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: TechTheme.slateBorder),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Direct Payout Credited:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: TechTheme.slateMuted)),
                  Text(
                    '₹${widget.job.techEarningInr.toStringAsFixed(0)}',
                    style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: TechTheme.signalOnlineEmerald),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: TechTheme.slateDark,
                foregroundColor: Colors.white,
                minimumSize: const Size.fromHeight(48),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
              onPressed: () {
                Navigator.pop(ctx); // Close dialog
                Navigator.pushReplacement(
                  context,
                  MaterialPageRoute(builder: (_) => const WalletScreen()),
                );
              },
              child: const Text('VIEW EARNINGS IN WALLET', style: TextStyle(fontWeight: FontWeight.w800)),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: TechTheme.slateLight,
      appBar: AppBar(
        title: const Text('Job Handover & Sign Off'),
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
            // Handover OTP Input Box
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: TechTheme.primaryAmber, width: 1.5),
                boxShadow: [
                  BoxShadow(
                    color: TechTheme.primaryAmber.withOpacity(0.08),
                    blurRadius: 16,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: const [
                      Icon(Icons.key_rounded, color: TechTheme.primaryAmberDark, size: 20),
                      SizedBox(width: 8),
                      Text(
                        'CUSTOMER HANDOVER OTP',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w800,
                          color: TechTheme.primaryAmberDark,
                          letterSpacing: 1.0,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  const Text(
                    'Ask the customer for the 4-digit code displayed on their screen after they physically inspect the repair.',
                    style: TextStyle(fontSize: 12, color: TechTheme.slateMuted, height: 1.3),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 18),
                  TextField(
                    controller: _otpController,
                    keyboardType: TextInputType.number,
                    textAlign: TextAlign.center,
                    maxLength: 4,
                    style: const TextStyle(
                      fontSize: 32,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 16,
                      color: TechTheme.slateDark,
                    ),
                    decoration: InputDecoration(
                      counterText: '',
                      hintText: '••••',
                      hintStyle: const TextStyle(color: Colors.black26, letterSpacing: 16),
                      filled: true,
                      fillColor: TechTheme.slateLight,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(16),
                        borderSide: const BorderSide(color: TechTheme.slateBorder),
                      ),
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

            // Resolution Notes
            const Text(
              'RESOLUTION AUDIT NOTES',
              style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: TechTheme.slateMuted, letterSpacing: 1.0),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: _notesController,
              maxLines: 3,
              style: const TextStyle(fontSize: 13, color: TechTheme.slateDark),
              decoration: InputDecoration(
                hintText: 'Describe components replaced, voltage measurements, etc.',
                filled: true,
                fillColor: Colors.white,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(16),
                  borderSide: const BorderSide(color: TechTheme.slateBorder),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(16),
                  borderSide: const BorderSide(color: TechTheme.slateBorder),
                ),
              ),
            ),
            const SizedBox(height: 20),

            // Completion Photo Snap
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
                      color: _isPhotoSnapped ? TechTheme.signalOnlineBg : TechTheme.slateLight,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(
                      _isPhotoSnapped ? Icons.check_circle_rounded : Icons.photo_camera_rounded,
                      color: _isPhotoSnapped ? TechTheme.signalOnlineEmerald : TechTheme.slateMuted,
                      size: 26,
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          _isPhotoSnapped ? 'After-Repair Photo Snapped' : 'Completed Work Photo',
                          style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13, color: TechTheme.slateDark),
                        ),
                        const SizedBox(height: 2),
                        const Text(
                          'Required for customer warranty record',
                          style: TextStyle(fontSize: 11, color: TechTheme.slateMuted),
                        ),
                      ],
                    ),
                  ),
                  ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: _isPhotoSnapped ? TechTheme.slateLight : TechTheme.slateDark,
                      foregroundColor: _isPhotoSnapped ? TechTheme.slateDark : Colors.white,
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                      elevation: 0,
                    ),
                    onPressed: () {
                      setState(() => _isPhotoSnapped = true);
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Post-repair verification photo attached')),
                      );
                    },
                    child: Text(_isPhotoSnapped ? 'Retake' : 'Snap Photo'),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 28),

            // Complete Work Button
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: TechTheme.signalOnlineEmerald,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                minimumSize: const Size.fromHeight(54),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              ),
              onPressed: _isSubmitting ? null : _handleCompleteJob,
              child: _isSubmitting
                  ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                  : Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: const [
                        Icon(Icons.verified_rounded, size: 20),
                        SizedBox(width: 8),
                        Text('VERIFY OTP & FINALIZE JOB', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 14)),
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
