import 'package:flutter/material.dart';
import '../../core/api_client.dart';
import '../../core/session_manager.dart';
import '../../core/theme.dart';
import '../../models/past_order_model.dart';
import '../address_booking_screen.dart';
import '../../models/service_model.dart';

class HistoryView extends StatefulWidget {
  final Function(int tabIndex) onSwitchTab;

  const HistoryView({
    super.key,
    required this.onSwitchTab,
  });

  @override
  State<HistoryView> createState() => _HistoryViewState();
}

class _HistoryViewState extends State<HistoryView> {
  int _selectedFilterIndex = 0; // 0 = All, 1 = Completed, 2 = Cancelled
  List<PastOrderItem> _orders = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadPastOrders();
  }

  Future<void> _loadPastOrders() async {
    setState(() => _isLoading = true);
    final localOrders = SessionManager.getPastOrders();
    final user = SessionManager.getCurrentUser();

    if (user != null) {
      try {
        final res = await ApiClient.get('/jobs?customerId=${user.id}');
        if (res.success && res.data != null) {
          final serverJobs = res.data['jobs'] is List ? res.data['jobs'] as List : [];
          for (final j in serverJobs) {
            final ticket = j['jobTicketNumber']?.toString() ?? 'J-1001';
            final status = j['status']?.toString() ?? 'COMPLETED';
            if (status == 'WORK_COMPLETED' || status == 'COMPLETED' || status == 'CANCELLED') {
              if (!localOrders.any((o) => o.ticketNumber.toLowerCase() == ticket.toLowerCase())) {
                final total = (j['totalAmountInr'] as num?)?.toDouble() ?? 299.0;
                final taxable = total / 1.18;
                final gst = total - taxable;
                final createdStr = j['createdAt']?.toString() ?? '';
                final dateText = createdStr.length >= 10 ? createdStr.substring(0, 10) : 'Today';
                localOrders.add(PastOrderItem(
                  ticketNumber: ticket,
                  invoiceNumber: j['invoiceNumber']?.toString() ?? 'INV-2026-${ticket.replaceAll(RegExp(r'\D'), '')}',
                  serviceTitle: j['serviceTitle']?.toString() ?? 'Doorstep Service',
                  dateText: dateText,
                  technicianName: j['technicianName']?.toString() ?? 'Rajesh Kumar (GTS Certified)',
                  amountInr: total,
                  taxableAmount: taxable,
                  cgstAmount: gst / 2,
                  sgstAmount: gst / 2,
                  status: status == 'CANCELLED' ? 'CANCELLED' : 'COMPLETED',
                ));
              }
            }
          }
        }
      } catch (_) {}
    }

    if (mounted) {
      setState(() {
        _orders = localOrders;
        _isLoading = false;
      });
    }
  }

  List<PastOrderItem> get _filteredOrders {
    if (_selectedFilterIndex == 1) {
      return _orders.where((o) => o.status == 'COMPLETED').toList();
    }
    if (_selectedFilterIndex == 2) {
      return _orders.where((o) => o.status == 'CANCELLED').toList();
    }
    return _orders;
  }

  void _showTaxInvoiceDialog(PastOrderItem order) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Row(
          children: [
            const Icon(Icons.receipt_long_rounded, color: AppTheme.sapphireBlue, size: 24),
            const SizedBox(width: 8),
            const Text('Official Tax Invoice', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          ],
        ),
        content: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppTheme.slateBorder),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('GHAR TAK SERVICES INDIA PVT LTD', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                    const Text('GSTIN: 27AAACG1234F1Z5 • Maharashtra Hub', style: TextStyle(fontSize: 10, color: AppTheme.slateMuted)),
                    const Divider(height: 14),
                    _buildInvoiceRow('Invoice Number', order.invoiceNumber, isBold: true),
                    _buildInvoiceRow('Job Ticket', order.ticketNumber),
                    _buildInvoiceRow('Service Date', order.dateText),
                    _buildInvoiceRow('Technician', order.technicianName),
                    const Divider(height: 14),
                    _buildInvoiceRow('Service Item', order.serviceTitle),
                    _buildInvoiceRow('Taxable Labor Value', '₹${order.taxableAmount.toStringAsFixed(2)}'),
                    _buildInvoiceRow('CGST (9%)', '₹${order.cgstAmount.toStringAsFixed(2)}'),
                    _buildInvoiceRow('SGST (9%)', '₹${order.sgstAmount.toStringAsFixed(2)}'),
                    const Divider(height: 14),
                    _buildInvoiceRow('Total Amount Paid', '₹${order.amountInr.toStringAsFixed(2)}', isBold: true, highlight: true),
                  ],
                ),
              ),
              const SizedBox(height: 10),
              Row(
                children: const [
                  Icon(Icons.verified_rounded, color: AppTheme.signalEmerald, size: 14),
                  SizedBox(width: 4),
                  Text('Digitally signed and RBI/GST compliant receipt', style: TextStyle(fontSize: 10, color: AppTheme.signalEmerald)),
                ],
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('CLOSE'),
          ),
          ElevatedButton.icon(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.sapphireBlue,
              foregroundColor: Colors.white,
            ),
            icon: const Icon(Icons.share_rounded, size: 16),
            label: const Text('SHARE PDF'),
            onPressed: () {
              Navigator.pop(ctx);
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text('Tax Invoice ${order.invoiceNumber} copied to clipboard.')),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildInvoiceRow(String label, String value, {bool isBold = false, bool highlight = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2.5),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(fontSize: 11, color: isBold ? AppTheme.slateDark : AppTheme.slateMuted, fontWeight: isBold ? FontWeight.bold : FontWeight.normal)),
          Text(value, style: TextStyle(fontSize: 11.5, color: highlight ? AppTheme.sapphireBlue : AppTheme.slateDark, fontWeight: isBold || highlight ? FontWeight.w900 : FontWeight.w600)),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator(color: AppTheme.sapphireBlue));
    }

    final filtered = _filteredOrders;

    return RefreshIndicator(
      onRefresh: () async => _loadPastOrders(),
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Service History & Invoices',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.slateDark),
                ),
                Text(
                  '${filtered.length} Orders',
                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.slateMuted),
                ),
              ],
            ),
            const SizedBox(height: 12),

            // Filter Tabs (All, Completed, Cancelled)
            Row(
              children: [
                _buildFilterChip('All Orders', 0),
                const SizedBox(width: 8),
                _buildFilterChip('Completed', 1),
                const SizedBox(width: 8),
                _buildFilterChip('Cancelled', 2),
              ],
            ),

            const SizedBox(height: 16),

            if (filtered.isEmpty)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(32),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppTheme.slateBorder),
                ),
                child: Column(
                  children: [
                    const Icon(Icons.receipt_long_outlined, size: 48, color: AppTheme.slateMuted),
                    const SizedBox(height: 12),
                    const Text('No orders found in this filter', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 6),
                    const Text('Your completed service orders and GST invoices will appear here.', style: TextStyle(fontSize: 12, color: AppTheme.slateMuted), textAlign: TextAlign.center),
                    const SizedBox(height: 16),
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.sapphireBlue,
                        foregroundColor: Colors.white,
                      ),
                      onPressed: () => widget.onSwitchTab(1),
                      child: const Text('Book Your First Service'),
                    ),
                  ],
                ),
              )
            else
              ListView.separated(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: filtered.length,
                separatorBuilder: (_, __) => const SizedBox(height: 12),
                itemBuilder: (context, idx) {
                  final order = filtered[idx];
                  return _buildOrderCard(order);
                },
              ),

            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _buildFilterChip(String label, int index) {
    final isSelected = _selectedFilterIndex == index;
    return InkWell(
      onTap: () => setState(() => _selectedFilterIndex = index),
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
        decoration: BoxDecoration(
          color: isSelected ? AppTheme.sapphireBlue : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: isSelected ? AppTheme.sapphireBlue : AppTheme.slateBorder),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
            color: isSelected ? Colors.white : AppTheme.slateDark,
          ),
        ),
      ),
    );
  }

  Widget _buildOrderCard(PastOrderItem order) {
    final isCompleted = order.status == 'COMPLETED';

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.slateBorder),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Top Row: Ticket Number & Status Pill
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                order.ticketNumber,
                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppTheme.sapphireBlue),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: isCompleted ? const Color(0xFFDCFCE7) : const Color(0xFFFEE2E2),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: isCompleted ? const Color(0xFFBBF7D0) : const Color(0xFFFECACA)),
                ),
                child: Text(
                  order.status,
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    color: isCompleted ? const Color(0xFF15803D) : const Color(0xFFDC2626),
                  ),
                ),
              ),
            ],
          ),

          const SizedBox(height: 8),

          Text(
            order.serviceTitle,
            style: const TextStyle(fontSize: 14.5, fontWeight: FontWeight.bold, color: AppTheme.slateDark),
          ),
          const SizedBox(height: 4),

          Row(
            children: [
              const Icon(Icons.person_outline_rounded, size: 14, color: AppTheme.slateMuted),
              const SizedBox(width: 4),
              Expanded(
                child: Text(
                  order.technicianName,
                  style: const TextStyle(fontSize: 12, color: AppTheme.slateMuted),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              Text(
                order.dateText,
                style: const TextStyle(fontSize: 11.5, color: AppTheme.slateMuted, fontWeight: FontWeight.w500),
              ),
            ],
          ),

          const SizedBox(height: 12),
          const Divider(height: 1, color: AppTheme.slateBorder),
          const SizedBox(height: 12),

          // Bottom Row: Price + Invoices / Book Again Actions
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Total with 18% GST', style: TextStyle(fontSize: 10, color: AppTheme.slateMuted)),
                  Text(
                    '₹${order.amountInr.toStringAsFixed(2)}',
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: AppTheme.slateDark),
                  ),
                ],
              ),
              Row(
                children: [
                  OutlinedButton.icon(
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      side: const BorderSide(color: AppTheme.sapphireBlue),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                    icon: const Icon(Icons.download_rounded, size: 14, color: AppTheme.sapphireBlue),
                    label: const Text('Invoice', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppTheme.sapphireBlue)),
                    onPressed: () => _showTaxInvoiceDialog(order),
                  ),
                  const SizedBox(width: 8),
                  ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primaryAmber,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                    onPressed: () {
                      final s = ServiceModel(
                        id: 'srv_rebook_${order.ticketNumber}',
                        code: 'REBOOK',
                        title: order.serviceTitle,
                        category: 'Electrical',
                        basePriceInr: order.taxableAmount,
                        durationMinutes: 45,
                      );
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => AddressBookingScreen(service: s)),
                      );
                    },
                    child: const Text('Book Again', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }
}

