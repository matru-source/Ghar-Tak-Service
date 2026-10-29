import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../core/theme.dart';
import '../models/job_model.dart';

class OfflineInvoiceGenerator {
  static const MethodChannel _channel = MethodChannel('com.ghartak.customer/hardware');

  static Future<bool> generateAndOpenInvoice(BuildContext context, JobModel job) async {
    final invoiceNo = job.invoiceNumber ?? 'INV-2026-${job.jobTicketNumber.replaceAll(RegExp(r'[^0-9]'), '')}';
    final baseAmount = (job.totalAmountInr / 1.18).roundToDouble();
    final totalGst = job.totalAmountInr - baseAmount;

    try {
      final res = await _channel.invokeMethod('generatePdfInvoice', {
        'invoiceNumber': invoiceNo,
        'ticketNumber': job.jobTicketNumber,
        'serviceTitle': job.serviceTitle,
        'customerName': job.customerName,
        'technicianName': job.technicianName ?? 'Certified Electrician',
        'totalAmount': '₹${job.totalAmountInr.toStringAsFixed(2)}',
        'taxableAmount': '₹${baseAmount.toStringAsFixed(2)}',
        'gstAmount': '₹${totalGst.toStringAsFixed(2)}',
      });

      if (res != null) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              backgroundColor: AppTheme.signalEmerald,
              content: Text('✓ Official GST PDF Generated & Saved: $invoiceNo.pdf'),
            ),
          );
        }
        return true;
      }
    } catch (_) {}

    // Fallback: Show In-App Tax Invoice Sheet if PDF viewer or platform channel unavailable
    if (context.mounted) {
      _showInAppInvoiceSheet(context, job, invoiceNo, baseAmount, totalGst);
    }
    return true;
  }

  static void _showInAppInvoiceSheet(
    BuildContext context,
    JobModel job,
    String invoiceNo,
    double baseAmount,
    double totalGst,
  ) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        padding: const EdgeInsets.all(24),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Tax Invoice (Offline)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppTheme.signalEmerald.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Text('PAID • 18% GST', style: TextStyle(color: AppTheme.signalEmerald, fontWeight: FontWeight.bold, fontSize: 11)),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Text('Invoice #: $invoiceNo', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
            Text('Job Ticket: ${job.jobTicketNumber}', style: const TextStyle(color: AppTheme.slateMuted, fontSize: 12)),
            Text('Customer: ${job.customerName}', style: const TextStyle(color: AppTheme.slateMuted, fontSize: 12)),
            const Divider(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(child: Text(job.serviceTitle, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13))),
                Text('₹${baseAmount.toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.w600)),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('CGST (9%) + SGST (9%)', style: TextStyle(color: AppTheme.slateMuted, fontSize: 12)),
                Text('₹${totalGst.toStringAsFixed(2)}', style: const TextStyle(color: AppTheme.slateMuted, fontSize: 12)),
              ],
            ),
            const Divider(height: 20),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Grand Total Paid', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                Text('₹${job.totalAmountInr.toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: AppTheme.signalEmerald)),
              ],
            ),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                icon: const Icon(Icons.check_circle_outline_rounded),
                label: const Text('Close Invoice'),
                onPressed: () => Navigator.pop(ctx),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

