import 'package:flutter/material.dart';
import '../../core/session_manager.dart';
import '../../core/theme.dart';
import '../../models/job_model.dart';
import '../../models/past_order_model.dart';
import 'home_screen.dart';

class ServiceSignoffScreen extends StatefulWidget {
  final JobModel job;

  const ServiceSignoffScreen({
    super.key,
    required this.job,
  });

  @override
  State<ServiceSignoffScreen> createState() => _ServiceSignoffScreenState();
}

class _ServiceSignoffScreenState extends State<ServiceSignoffScreen> {
  int _selectedRating = 5;
  final Set<String> _selectedFeedbackTags = {'Punctual', 'Spotless Cleanup'};
  bool _checkItem1 = true;
  bool _checkItem2 = true;
  final List<Offset?> _signaturePoints = [];
  bool _isSignatureAdopted = false;

  late final List<String> _feedbackTags;
  late final String _checkItem1Text;
  late final String _checkItem2Text;

  @override
  void initState() {
    super.initState();
    final titleLower = widget.job.serviceTitle.toLowerCase();

    if (titleLower.contains('plumb') || titleLower.contains('water') || titleLower.contains('pipe')) {
      _feedbackTags = ['Zero Leakage', 'Punctual', 'Quality Piping', 'Spotless Cleanup', 'Pressure Tested', 'Polite'];
      _checkItem1Text = 'Water lines, valves & fittings inspected with zero active leaks.';
      _checkItem2Text = 'Work area wiped clean and dry; water main shut-off valves secured.';
    } else if (titleLower.contains('appliance') || titleLower.contains('geyser') || titleLower.contains('heater')) {
      _feedbackTags = ['Genuine Spares', 'Punctual', 'Heating Tested', 'Spotless Cleanup', 'Quiet Run', 'Polite'];
      _checkItem1Text = 'Appliance heating elements, thermostat, and safety controls tested.';
      _checkItem2Text = 'Electrical earthing continuity verified with calibrated multimeter.';
    } else {
      // Electrical default
      _feedbackTags = ['1000V Safe', 'Punctual', 'Neat Wiring', 'Spotless Cleanup', 'Calibrated Tester', 'Polite'];
      _checkItem1Text = 'Power & all circuit breakers inspected and functioning normally.';
      _checkItem2Text = 'Insulation debris cleared and distribution box panel lid securely fastened.';
    }
  }

  void _handleSubmitSignoff() async {
    final invoiceNo = widget.job.invoiceNumber ?? 'INV-2026-${widget.job.jobTicketNumber.replaceAll(RegExp(r'[^0-9]'), '')}';
    final total = widget.job.totalAmountInr > 0 ? widget.job.totalAmountInr : 299.0;
    final taxable = (total / 1.18);
    final gst = total - taxable;
    final cgst = gst / 2;
    final sgst = gst / 2;

    // Add order to past orders
    final pastOrder = PastOrderItem(
      ticketNumber: widget.job.jobTicketNumber,
      invoiceNumber: invoiceNo,
      serviceTitle: widget.job.serviceTitle,
      dateText: '${DateTime.now().day} Oct, 2026',
      technicianName: widget.job.technicianName ?? 'Rajesh Kumar (GTS Certified)',
      amountInr: total,
      taxableAmount: taxable,
      cgstAmount: cgst,
      sgstAmount: sgst,
      status: 'COMPLETED',
    );

    await SessionManager.addPastOrder(pastOrder);
    await SessionManager.clearActiveJob();

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('✓ Service signed off and certified! Thank you for choosing Ghar Tak.'),
          backgroundColor: AppTheme.signalEmerald,
        ),
      );

      Navigator.pushAndRemoveUntil(
        context,
        MaterialPageRoute(builder: (_) => const HomeScreen()),
        (route) => false,
      );
    }
  }

  void _showTaxInvoicePreview() {
    final invoiceNo = widget.job.invoiceNumber ?? 'INV-2026-${widget.job.jobTicketNumber.replaceAll(RegExp(r'[^0-9]'), '')}';
    final total = widget.job.totalAmountInr > 0 ? widget.job.totalAmountInr : 299.0;
    final taxable = (total / 1.18);
    final gst = total - taxable;

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Official Tax Invoice', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Invoice #: $invoiceNo', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
            Text('Job Ticket: ${widget.job.jobTicketNumber}', style: const TextStyle(fontSize: 12, color: AppTheme.slateMuted)),
            const Divider(height: 14),
            Text('Service: ${widget.job.serviceTitle}', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
            Text('Technician: ${widget.job.technicianName ?? "Certified Professional"}', style: const TextStyle(fontSize: 12)),
            const Divider(height: 14),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Taxable Value:'),
                Text('₹${taxable.toStringAsFixed(2)}'),
              ],
            ),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('18% GST (CGST+SGST):'),
                Text('₹${gst.toStringAsFixed(2)}'),
              ],
            ),
            const Divider(height: 14),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Total Amount Paid:', style: TextStyle(fontWeight: FontWeight.bold)),
                Text('₹${total.toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.w900, color: AppTheme.sapphireBlue)),
              ],
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('CLOSE')),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('SERVICE SIGN-OFF & INVOICE', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
            Text('Ticket: ${widget.job.jobTicketNumber} • 18% GST Compliant', style: const TextStyle(fontSize: 11, color: AppTheme.sapphireBlue)),
          ],
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Column(
          children: [
            // Work Completion Certificate Card
            Container(
              padding: const EdgeInsets.all(18),
              width: double.infinity,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppTheme.signalEmerald.withOpacity(0.5), width: 1.5),
              ),
              child: Column(
                children: [
                  Container(
                    width: 52,
                    height: 52,
                    decoration: BoxDecoration(
                      color: AppTheme.signalEmerald.withOpacity(0.12),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.verified_rounded, color: AppTheme.signalEmerald, size: 32),
                  ),
                  const SizedBox(height: 10),
                  const Text(
                    'ELECTRICAL WORK RESTORED & CERTIFIED',
                    style: TextStyle(
                      color: AppTheme.signalEmerald,
                      fontSize: 12.5,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 0.5,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'All 1000V Dielectric Safety Protocols verified by ${widget.job.technicianName ?? "Certified Specialist"}.',
                    style: const TextStyle(fontSize: 11.5, color: AppTheme.slateMuted),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // Dynamic Safety Quality Checklist Card
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
                  const Text('Quality Verification Checklist', style: TextStyle(fontSize: 14.5, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 10),

                  CheckboxListTile(
                    value: _checkItem1,
                    onChanged: (val) => setState(() => _checkItem1 = val ?? true),
                    dense: true,
                    contentPadding: EdgeInsets.zero,
                    activeColor: AppTheme.signalEmerald,
                    title: Text(_checkItem1Text, style: const TextStyle(fontSize: 12)),
                  ),
                  CheckboxListTile(
                    value: _checkItem2,
                    onChanged: (val) => setState(() => _checkItem2 = val ?? true),
                    dense: true,
                    contentPadding: EdgeInsets.zero,
                    activeColor: AppTheme.signalEmerald,
                    title: Text(_checkItem2Text, style: const TextStyle(fontSize: 12)),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // 5-Star Rating & Review Tags Card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppTheme.slateBorder),
              ),
              child: Column(
                children: [
                  const Text('Rate Service Experience', style: TextStyle(fontSize: 14.5, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),

                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: List.generate(5, (index) {
                      final star = index + 1;
                      return IconButton(
                        icon: Icon(
                          star <= _selectedRating ? Icons.star_rounded : Icons.star_border_rounded,
                          color: const Color(0xFFF59E0B),
                          size: 32,
                        ),
                        onPressed: () => setState(() => _selectedRating = star),
                      );
                    }),
                  ),
                  const SizedBox(height: 8),

                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: _feedbackTags.map((tag) {
                      final isSelected = _selectedFeedbackTags.contains(tag);
                      return FilterChip(
                        label: Text(tag, style: TextStyle(fontSize: 11, fontWeight: isSelected ? FontWeight.bold : FontWeight.normal)),
                        selected: isSelected,
                        selectedColor: const Color(0xFFEFF6FF),
                        checkmarkColor: AppTheme.sapphireBlue,
                        onSelected: (val) {
                          setState(() {
                            if (val) {
                              _selectedFeedbackTags.add(tag);
                            } else {
                              _selectedFeedbackTags.remove(tag);
                            }
                          });
                        },
                      );
                    }).toList(),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // Digital Touch Signature Canvas Card
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
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Customer Digital Sign-Off', style: TextStyle(fontSize: 14.5, fontWeight: FontWeight.bold)),
                      TextButton(
                        onPressed: () => setState(() {
                          _signaturePoints.clear();
                          _isSignatureAdopted = false;
                        }),
                        child: const Text('Clear Signature', style: TextStyle(fontSize: 11, color: Color(0xFFDC2626))),
                      ),
                    ],
                  ),
                  const Text('Draw your signature with your finger below to authorize work completion:', style: TextStyle(fontSize: 11.5, color: AppTheme.slateMuted)),
                  const SizedBox(height: 10),

                  Container(
                    height: 130,
                    width: double.infinity,
                    decoration: BoxDecoration(
                      color: const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFCBD5E1), style: BorderStyle.solid),
                    ),
                    child: GestureDetector(
                      onPanUpdate: (DragUpdateDetails details) {
                        setState(() {
                          RenderBox renderBox = context.findRenderObject() as RenderBox;
                          _signaturePoints.add(details.localPosition);
                          _isSignatureAdopted = true;
                        });
                      },
                      onPanEnd: (DragEndDetails details) {
                        _signaturePoints.add(null);
                      },
                      child: CustomPaint(
                        painter: SignaturePainter(points: _signaturePoints),
                        size: Size.infinite,
                      ),
                    ),
                  ),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      Icon(
                        _isSignatureAdopted ? Icons.check_circle_rounded : Icons.info_outline_rounded,
                        color: _isSignatureAdopted ? AppTheme.signalEmerald : AppTheme.slateMuted,
                        size: 14,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        _isSignatureAdopted ? 'Signature captured and stored.' : 'Please sign in the box above.',
                        style: TextStyle(fontSize: 11, color: _isSignatureAdopted ? AppTheme.signalEmerald : AppTheme.slateMuted),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // Tax Invoice Action Row
            OutlinedButton.icon(
              style: OutlinedButton.styleFrom(
                minimumSize: const Size.fromHeight(46),
                side: const BorderSide(color: AppTheme.sapphireBlue),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              icon: const Icon(Icons.receipt_long_rounded, color: AppTheme.sapphireBlue),
              label: const Text('View Official 18% GST Tax Invoice', style: TextStyle(fontWeight: FontWeight.bold, color: AppTheme.sapphireBlue)),
              onPressed: _showTaxInvoicePreview,
            ),

            const SizedBox(height: 20),

            // Submit Button
            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.sapphireBlue,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                icon: const Icon(Icons.check_circle_rounded),
                label: const Text('SUBMIT SIGN-OFF & RETURN TO HOME', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                onPressed: _handleSubmitSignoff,
              ),
            ),

            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }
}

class SignaturePainter extends CustomPainter {
  final List<Offset?> points;

  SignaturePainter({required this.points});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = const Color(0xFF0F2B48)
      ..strokeCap = StrokeCap.round
      ..strokeWidth = 2.5;

    for (int i = 0; i < points.length - 1; i++) {
      if (points[i] != null && points[i + 1] != null) {
        canvas.drawLine(points[i]!, points[i + 1]!, paint);
      }
    }
  }

  @override
  bool shouldRepaint(covariant SignaturePainter oldDelegate) => true;
}

