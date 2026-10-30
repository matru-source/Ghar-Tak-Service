import 'package:flutter/material.dart';
import '../core/theme.dart';
import '../models/job_model.dart';
import '../utils/offline_invoice_generator.dart';
import '../widgets/custom_button.dart';
import 'home_screen.dart';

class InvoiceScreen extends StatefulWidget {
  final JobModel job;

  const InvoiceScreen({
    super.key,
    required this.job,
  });

  @override
  State<InvoiceScreen> createState() => _InvoiceScreenState();
}

class _InvoiceScreenState extends State<InvoiceScreen> {
  int _selectedRating = 5;
  final TextEditingController _feedbackController = TextEditingController();
  bool _feedbackSubmitted = false;

  @override
  Widget build(BuildContext context) {
    final invoiceNo = widget.job.invoiceNumber ?? 'INV-2026-${widget.job.jobTicketNumber.replaceAll(RegExp(r'[^0-9]'), '')}';
    final baseAmount = (widget.job.totalAmountInr / 1.18).roundToDouble();
    final totalGst = widget.job.totalAmountInr - baseAmount;
    final cgst = totalGst / 2;
    final sgst = totalGst / 2;

    return Scaffold(
      backgroundColor: AppTheme.slateLight,
      appBar: AppBar(
        title: const Text('Tax Invoice & Receipt', style: TextStyle(fontWeight: FontWeight.bold)),
        automaticallyImplyLeading: false,
        actions: [
          IconButton(
            icon: const Icon(Icons.share_outlined),
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Invoice link copied to clipboard')),
              );
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            // Success Header Badge
            Container(
              padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
              width: double.infinity,
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF065F46), Color(0xFF047857)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(24),
                boxShadow: [
                  BoxShadow(
                    color: AppTheme.signalEmerald.withOpacity(0.25),
                    blurRadius: 16,
                    offset: const Offset(0, 6),
                  ),
                ],
              ),
              child: Column(
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.2),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.check_circle_rounded, color: Colors.white, size: 44),
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    'Work Completed & Verified',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: Colors.white),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Invoice #$invoiceNo',
                    style: TextStyle(fontSize: 12, color: Colors.white.withOpacity(0.85), letterSpacing: 0.8),
                  ),
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: const Text(
                      'ZEX-SHIELD 90-DAY WARRANTY APPLIED',
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w900,
                        color: Color(0xFF065F46),
                        letterSpacing: 0.6,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Itemized Bill Card
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppTheme.slateBorder),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'STATUTORY TAX INVOICE',
                        style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: AppTheme.slateMuted, letterSpacing: 1.0),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: AppTheme.signalEmeraldBg,
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: const Text(
                          'PAID ONLINE',
                          style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: AppTheme.signalEmerald),
                        ),
                      ),
                    ],
                  ),
                  const Divider(height: 24),
                  _buildBillRow('Job Ticket', widget.job.jobTicketNumber),
                  _buildBillRow('Service Plan', widget.job.serviceTitle),
                  _buildBillRow('Technician', widget.job.technicianName ?? 'GTS Certified Pro'),
                  _buildBillRow('GSTIN', '27AABCZ9921D1Z4 (MH)'),
                  const Divider(height: 24),
                  _buildBillRow('Base Diagnostic & Labor', '₹${baseAmount.toStringAsFixed(2)}'),
                  _buildBillRow('CGST (9.0%)', '₹${cgst.toStringAsFixed(2)}'),
                  _buildBillRow('SGST (9.0%)', '₹${sgst.toStringAsFixed(2)}'),
                  const Divider(height: 24),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Total Amount Paid',
                        style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: AppTheme.slateDark),
                      ),
                      Text(
                        '₹${widget.job.totalAmountInr.toStringAsFixed(2)}',
                        style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: AppTheme.signalEmerald),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),

            // Offline PDF Download / View Action
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.sapphireBlue,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
                icon: const Icon(Icons.picture_as_pdf_rounded, size: 20),
                label: const Text('Download / Open Official GST PDF (Offline)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                onPressed: () => OfflineInvoiceGenerator.generateAndOpenInvoice(context, widget.job),
              ),
            ),
            const SizedBox(height: 20),

            // Customer Feedback & Rating Card
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppTheme.slateBorder),
              ),
              child: _feedbackSubmitted
                  ? Column(
                      children: const [
                        Icon(Icons.thumb_up_rounded, color: AppTheme.primaryAmberDark, size: 36),
                        SizedBox(height: 10),
                        Text(
                          'Thank you for your feedback!',
                          style: TextStyle(fontWeight: FontWeight.w800, fontSize: 15, color: AppTheme.slateDark),
                        ),
                        SizedBox(height: 4),
                        Text(
                          'Your review directly empowers our technician incentive pool.',
                          style: TextStyle(fontSize: 12, color: AppTheme.slateMuted),
                          textAlign: TextAlign.center,
                        ),
                      ],
                    )
                  : Column(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        const Text(
                          'Rate Technician Performance',
                          style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14, color: AppTheme.slateDark),
                        ),
                        const SizedBox(height: 4),
                        const Text(
                          'Did the pro follow 1000V glove isolation protocol?',
                          style: TextStyle(fontSize: 11, color: AppTheme.slateMuted),
                        ),
                        const SizedBox(height: 14),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: List.generate(5, (index) {
                            final star = index + 1;
                            return IconButton(
                              icon: Icon(
                                star <= _selectedRating ? Icons.star_rounded : Icons.star_outline_rounded,
                                color: AppTheme.primaryAmber,
                                size: 36,
                              ),
                              onPressed: () => setState(() => _selectedRating = star),
                            );
                          }),
                        ),
                        const SizedBox(height: 12),
                        TextField(
                          controller: _feedbackController,
                          maxLines: 2,
                          decoration: InputDecoration(
                            hintText: 'Add compliments or notes for safety audit...',
                            hintStyle: const TextStyle(fontSize: 12, color: AppTheme.slateMuted),
                            filled: true,
                            fillColor: AppTheme.slateLight,
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: BorderSide(color: AppTheme.slateBorder),
                            ),
                            enabledBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: BorderSide(color: AppTheme.slateBorder),
                            ),
                          ),
                        ),
                        const SizedBox(height: 14),
                        CustomButton(
                          text: 'Submit Review',
                          onPressed: () {
                            setState(() => _feedbackSubmitted = true);
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Feedback recorded successfully')),
                            );
                          },
                        ),
                      ],
                    ),
            ),
            const SizedBox(height: 20),

            // Return to Home
            OutlinedButton.icon(
              style: OutlinedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
                minimumSize: const Size.fromHeight(50),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                side: const BorderSide(color: AppTheme.slateBorder),
              ),
              icon: const Icon(Icons.home_rounded, color: AppTheme.slateDark),
              label: const Text(
                'Return to Home Dashboard',
                style: TextStyle(color: AppTheme.slateDark, fontWeight: FontWeight.w700),
              ),
              onPressed: () {
                Navigator.pushAndRemoveUntil(
                  context,
                  MaterialPageRoute(builder: (_) => const HomeScreen()),
                  (route) => false,
                );
              },
            ),
            const SizedBox(height: 30),
          ],
        ),
      ),
    );
  }

  Widget _buildBillRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 5),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(fontSize: 12, color: AppTheme.slateMuted)),
          Text(value, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppTheme.slateDark)),
        ],
      ),
    );
  }
}

