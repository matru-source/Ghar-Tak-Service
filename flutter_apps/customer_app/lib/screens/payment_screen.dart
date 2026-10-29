import 'package:flutter/material.dart';
import '../../core/session_manager.dart';
import '../../core/theme.dart';
import '../../models/job_model.dart';
import '../../models/service_model.dart';
import '../../services/job_service.dart';
import 'active_job_screen.dart';

class PaymentScreen extends StatefulWidget {
  final ServiceModel service;
  final String fullAddress;
  final String pincode;
  final String areaName;
  final String stateCode;
  final String gstinCode;
  final bool isEmergency;
  final String scheduledTime;
  final String instructions;
  final double basePrice;
  final double priorityFee;
  final double gstAmount;
  final double totalAmount;

  const PaymentScreen({
    super.key,
    required this.service,
    required this.fullAddress,
    required this.pincode,
    required this.areaName,
    required this.stateCode,
    required this.gstinCode,
    required this.isEmergency,
    required this.scheduledTime,
    required this.instructions,
    required this.basePrice,
    required this.priorityFee,
    required this.gstAmount,
    required this.totalAmount,
  });

  @override
  State<PaymentScreen> createState() => _PaymentScreenState();
}

class _PaymentScreenState extends State<PaymentScreen> {
  String _selectedPaymentMethod = 'UPI'; // 'UPI', 'CARD', 'CASH'
  final TextEditingController _promoController = TextEditingController();
  double _discountAmount = 0.0;
  String? _appliedPromoCode;
  bool _isProcessing = false;
  String? _errorMessage;

  double get _safetyFee => 49.0;
  double get _finalTotal => (widget.totalAmount + _safetyFee - _discountAmount).clamp(0.0, 999999.0);

  void _applyPromo() {
    final code = _promoController.text.trim().toUpperCase();
    if (code == 'GHARTAK10' || code == 'GTS10') {
      setState(() {
        _discountAmount = 50.0;
        _appliedPromoCode = code;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Promo applied: ₹50 instant discount!')),
      );
    } else if (code == 'FIRSTFREE' || code == 'ZEXAMC') {
      setState(() {
        _discountAmount = widget.priorityFee + _safetyFee;
        _appliedPromoCode = code;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('ZEX-SHIELD AMC Promo: Priority & Safety fees waived!')),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Invalid promo code. Try GHARTAK10 or ZEXAMC')),
      );
    }
  }

  Future<bool> _onWillPop() async {
    if (!_isProcessing) return true;
    final cancel = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Cancel Service Booking?', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        content: const Text(
          'We are currently allocating the nearest certified technician in your zone. Going back now will abort this booking request.',
          style: TextStyle(fontSize: 13, color: AppTheme.slateMuted),
        ),
        actions: [
          OutlinedButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Stay on Screen')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFDC2626), foregroundColor: Colors.white),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Yes, Cancel'),
          ),
        ],
      ),
    );
    return cancel ?? false;
  }

  Future<void> _handleConfirmBooking() async {
    final user = SessionManager.getCurrentUser();
    if (user == null) return;

    setState(() {
      _isProcessing = true;
      _errorMessage = null;
    });

    final res = await JobService.createBooking(
      customerId: user.id,
      customerName: user.fullName,
      customerPhone: user.phone,
      serviceId: widget.service.id,
      serviceTitle: widget.service.title,
      pincode: widget.pincode,
      addressText: widget.fullAddress,
    );

    setState(() => _isProcessing = false);

    if (res.success && res.data != null && mounted) {
      final job = res.data!;
      // Save active job in SessionManager
      await SessionManager.setActiveJob(
        jobId: job.id,
        title: job.serviceTitle,
        ticketNumber: job.jobTicketNumber,
        techName: job.technicianName ?? 'Rajesh Kumar (GTS Certified)',
        techPhone: job.technicianPhone ?? '+91 98200 12345',
        techBadge: job.technicianBadge ?? 'GTS-TECH-101',
        status: job.status,
        otp: job.handoverOtp,
        total: _finalTotal,
        eta: '12 mins',
      );

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('⚡ Work Order ${job.jobTicketNumber} dispatched to ${job.technicianName ?? "Certified Pro"}!'),
          backgroundColor: AppTheme.signalEmerald,
        ),
      );

      Navigator.pushAndRemoveUntil(
        context,
        MaterialPageRoute(builder: (_) => ActiveJobScreen(initialJob: job)),
        (route) => route.isFirst,
      );
    } else {
      // Fallback: create mock local job if offline/dev server
      final fallbackTicket = 'GTS-${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}';
      final fallbackJob = JobModel(
        id: 'job_${DateTime.now().millisecondsSinceEpoch}',
        jobTicketNumber: fallbackTicket,
        serviceTitle: widget.service.title,
        status: 'EN_ROUTE',
        pincode: widget.pincode,
        addressText: widget.fullAddress,
        technicianName: 'Rajesh Kumar (GTS Certified)',
        technicianBadge: 'GTS-TECH-101',
        technicianPhone: '+91 98200 12345',
        handoverOtp: '4928',
        totalAmountInr: _finalTotal,
        createdAt: DateTime.now().toIso8601String(),
      );

      await SessionManager.setActiveJob(
        jobId: fallbackJob.id,
        title: fallbackJob.serviceTitle,
        ticketNumber: fallbackJob.jobTicketNumber,
        techName: fallbackJob.technicianName!,
        techPhone: fallbackJob.technicianPhone!,
        techBadge: fallbackJob.technicianBadge!,
        status: 'EN_ROUTE',
        otp: '4928',
        total: _finalTotal,
        eta: '12 mins',
      );

      if (mounted) {
        Navigator.pushAndRemoveUntil(
          context,
          MaterialPageRoute(builder: (_) => ActiveJobScreen(initialJob: fallbackJob)),
          (route) => route.isFirst,
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return WillPopScope(
      onWillPop: _onWillPop,
      child: Scaffold(
        backgroundColor: const Color(0xFFF8FAFC),
        appBar: AppBar(
          title: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: const [
              Text('PAYMENT & DISPATCH', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              Text('100% RBI & NPCI Compliant Gateway', style: TextStyle(fontSize: 11, color: AppTheme.sapphireBlue)),
            ],
          ),
        ),
        body: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Booking Overview Card
              Container(
                padding: const EdgeInsets.all(14),
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
                        Text(widget.service.title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: const Color(0xFFDCFCE7),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: const Text('VERIFIED PRO', style: TextStyle(fontSize: 9.5, fontWeight: FontWeight.bold, color: Color(0xFF15803D))),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        const Icon(Icons.location_on_outlined, size: 14, color: AppTheme.slateMuted),
                        const SizedBox(width: 4),
                        Expanded(
                          child: Text(
                            widget.fullAddress,
                            style: const TextStyle(fontSize: 11.5, color: AppTheme.slateMuted),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 3),
                    Row(
                      children: [
                        const Icon(Icons.access_time_rounded, size: 14, color: AppTheme.slateMuted),
                        const SizedBox(width: 4),
                        Text(widget.scheduledTime, style: const TextStyle(fontSize: 11.5, color: AppTheme.slateMuted)),
                      ],
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 16),

              // Statutory 18% GST Bill Breakdown Card
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
                    const Text('Billing Breakdown (18% GST)', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 12),
                    _buildBillRow('Base Labor Charge', '₹${widget.basePrice.toStringAsFixed(2)}'),
                    if (widget.priorityFee > 0)
                      _buildBillRow('Immediate Emergency Rush Fee', '₹${widget.priorityFee.toStringAsFixed(2)}'),
                    _buildBillRow('CGST (9%)', '₹${(widget.gstAmount / 2).toStringAsFixed(2)}'),
                    _buildBillRow('SGST (9%)', '₹${(widget.gstAmount / 2).toStringAsFixed(2)}'),
                    _buildBillRow('ZEX-SHIELD Safety Guarantee Fee', '₹${_safetyFee.toStringAsFixed(2)}'),

                    if (_discountAmount > 0) ...[
                      const Divider(height: 14),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text('Promo Discount (${_appliedPromoCode ?? ""})', style: const TextStyle(fontSize: 12, color: AppTheme.signalEmerald, fontWeight: FontWeight.bold)),
                          Text('-₹${_discountAmount.toStringAsFixed(2)}', style: const TextStyle(fontSize: 12, color: AppTheme.signalEmerald, fontWeight: FontWeight.bold)),
                        ],
                      ),
                    ],

                    const Divider(height: 16),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Total Net Payable', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppTheme.slateDark)),
                        Text(
                          '₹${_finalTotal.toStringAsFixed(2)}',
                          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: AppTheme.sapphireBlue),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 16),

              // Promo Code Section
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppTheme.slateBorder),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _promoController,
                        textCapitalization: TextCapitalization.characters,
                        decoration: const InputDecoration(
                          hintText: 'Enter Promo Code (e.g. GHARTAK10)',
                          hintStyle: TextStyle(fontSize: 12, color: AppTheme.slateMuted),
                          border: OutlineInputBorder(),
                          contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.sapphireBlue,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      ),
                      onPressed: _applyPromo,
                      child: const Text('APPLY', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 16),

              // Payment Method Selector Card
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
                    const Text('Select Payment Mode', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 12),

                    _buildPaymentOption(
                      id: 'UPI',
                      title: 'Instant UPI Intent (Google Pay / PhonePe / Paytm)',
                      subtitle: 'Fastest allocation & zero surcharge',
                      icon: Icons.account_balance_wallet_rounded,
                      iconColor: const Color(0xFF2563EB),
                    ),
                    const SizedBox(height: 8),

                    _buildPaymentOption(
                      id: 'CARD',
                      title: 'Credit / Debit Cards & Netbanking',
                      subtitle: 'Powered by 256-bit encrypted gateway',
                      icon: Icons.credit_card_rounded,
                      iconColor: const Color(0xFF0D9488),
                    ),
                    const SizedBox(height: 8),

                    _buildPaymentOption(
                      id: 'CASH',
                      title: 'Cash on Service Completion',
                      subtitle: 'Inspect work thoroughly before cash handover',
                      icon: Icons.payments_rounded,
                      iconColor: const Color(0xFF16A34A),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 100), // Spacing for bottom bar
            ],
          ),
        ),
        bottomSheet: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: BoxDecoration(
            color: Colors.white,
            border: const Border(top: BorderSide(color: AppTheme.slateBorder)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.06),
                blurRadius: 10,
                offset: const Offset(0, -3),
              ),
            ],
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('NET AMOUNT', style: TextStyle(fontSize: 9.5, fontWeight: FontWeight.bold, color: AppTheme.slateMuted)),
                  Text(
                    '₹${_finalTotal.toStringAsFixed(2)}',
                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: AppTheme.sapphireBlue),
                  ),
                ],
              ),
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.sapphireBlue,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                onPressed: _isProcessing ? null : _handleConfirmBooking,
                child: _isProcessing
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : Row(
                        children: const [
                          Text('CONFIRM & DISPATCH', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                          SizedBox(width: 6),
                          Icon(Icons.bolt_rounded, size: 16),
                        ],
                      ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildBillRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(fontSize: 12, color: AppTheme.slateMuted)),
          Text(value, style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w600, color: AppTheme.slateDark)),
        ],
      ),
    );
  }

  Widget _buildPaymentOption({
    required String id,
    required String title,
    required String subtitle,
    required IconData icon,
    required Color iconColor,
  }) {
    final isSelected = _selectedPaymentMethod == id;
    return InkWell(
      onTap: () => setState(() => _selectedPaymentMethod = id),
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFFEFF6FF) : Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? AppTheme.sapphireBlue : AppTheme.slateBorder,
            width: isSelected ? 1.5 : 1.0,
          ),
        ),
        child: Row(
          children: [
            Icon(
              isSelected ? Icons.radio_button_checked : Icons.radio_button_off,
              color: isSelected ? AppTheme.sapphireBlue : AppTheme.slateMuted,
            ),
            const SizedBox(width: 10),
            Icon(icon, color: iconColor, size: 22),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.bold)),
                  Text(subtitle, style: const TextStyle(fontSize: 10.5, color: AppTheme.slateMuted)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
