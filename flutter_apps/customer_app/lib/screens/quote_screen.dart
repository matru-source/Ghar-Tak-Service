import 'package:flutter/material.dart';
import '../core/session_manager.dart';
import '../core/theme.dart';
import '../models/job_model.dart';
import '../models/quote_model.dart';
import '../models/service_model.dart';
import '../services/job_service.dart';
import '../services/service_catalog_service.dart';
import '../widgets/custom_button.dart';
import 'active_job_screen.dart';

class QuoteScreen extends StatefulWidget {
  final ServiceModel service;
  final String pincode;

  const QuoteScreen({
    super.key,
    required this.service,
    required this.pincode,
  });

  @override
  State<QuoteScreen> createState() => _QuoteScreenState();
}

class _QuoteScreenState extends State<QuoteScreen> {
  QuoteModel? _quote;
  bool _isLoadingQuote = true;
  bool _isBooking = false;
  String? _errorMessage;

  final _addressController = TextEditingController();

  @override
  void initState() {
    super.initState();
    final user = SessionManager.getCurrentUser();
    _addressController.text = user?.address ?? '';
    _fetchQuote();
  }

  Future<void> _fetchQuote() async {
    setState(() => _isLoadingQuote = true);
    final quote = await ServiceCatalogService.calculateQuote(
      serviceCode: widget.service.code,
      pincode: widget.pincode,
    );
    setState(() {
      _quote = quote;
      _isLoadingQuote = false;
    });
  }

  Future<void> _handleBookJob() async {
    final user = SessionManager.getCurrentUser();
    if (user == null) return;

    setState(() {
      _isBooking = true;
      _errorMessage = null;
    });

    final res = await JobService.createBooking(
      customerId: user.id,
      customerName: user.fullName,
      customerPhone: user.phone,
      serviceId: widget.service.id,
      serviceTitle: widget.service.title,
      pincode: widget.pincode,
      addressText: _addressController.text.trim(),
    );

    setState(() => _isBooking = false);

    if (res.success && res.data != null && mounted) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (_) => ActiveJobScreen(initialJob: res.data!),
        ),
      );
    } else {
      setState(() => _errorMessage = res.message ?? 'Booking dispatch failed. Please retry.');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.slateLight,
      appBar: AppBar(
        title: const Text('Statutory 18% GST Quote'),
      ),
      body: _isLoadingQuote
          ? const Center(child: CircularProgressIndicator(color: AppTheme.primaryAmber))
          : SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Service Title Card
                  Container(
                    padding: const EdgeInsets.all(18),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: AppTheme.slateBorder),
                    ),
                    child: Row(
                      children: [
                        ClipRRect(
                          borderRadius: BorderRadius.circular(14),
                          child: Image.asset(
                            widget.service.imageAsset ?? 'assets/images/service_switchboard.png',
                            width: 60,
                            height: 60,
                            fit: BoxFit.cover,
                            errorBuilder: (_, __, ___) => const Icon(Icons.bolt, size: 40, color: AppTheme.primaryAmber),
                          ),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                widget.service.title,
                                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: AppTheme.slateDark),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                'Service Code: ${widget.service.code} • Area: ${widget.pincode}',
                                style: const TextStyle(fontSize: 12, color: AppTheme.slateMuted, fontWeight: FontWeight.w600),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 20),
                  const Text(
                    'Itemized Indian GST Breakdown',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: AppTheme.slateDark),
                  ),
                  const SizedBox(height: 10),

                  // GST Breakdown Card
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: AppTheme.slateBorder),
                    ),
                    child: Column(
                      children: [
                        _buildPriceRow('Base Labor & Diagnostic Fee', '₹${_quote?.baseLaborInr.toStringAsFixed(2)}'),
                        const SizedBox(height: 10),
                        _buildPriceRow('Central GST (CGST @ 9.0%)', '₹${_quote?.cgstAmountInr.toStringAsFixed(2)}'),
                        const SizedBox(height: 10),
                        _buildPriceRow('State GST (SGST @ 9.0%)', '₹${_quote?.sgstAmountInr.toStringAsFixed(2)}'),
                        const SizedBox(height: 14),
                        const Divider(height: 1, color: AppTheme.slateBorder),
                        const SizedBox(height: 14),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text(
                              'Total Payable Amount',
                              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: AppTheme.slateDark),
                            ),
                            Text(
                              '₹${_quote?.totalPayableInr.toStringAsFixed(2)}',
                              style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: AppTheme.primaryAmberDark),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 20),
                  const Text(
                    'Confirm Service Address',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: AppTheme.slateDark),
                  ),
                  const SizedBox(height: 10),
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(color: AppTheme.slateBorder),
                    ),
                    child: TextField(
                      controller: _addressController,
                      maxLines: 2,
                      decoration: const InputDecoration(
                        border: InputBorder.none,
                        prefixIcon: Icon(Icons.home_outlined, color: AppTheme.slateMuted),
                        hintText: 'Enter complete flat, building, and street address',
                      ),
                    ),
                  ),

                  if (_errorMessage != null) ...[
                    const SizedBox(height: 14),
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppTheme.signalCrimsonBg,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        _errorMessage!,
                        style: const TextStyle(color: AppTheme.signalCrimson, fontSize: 13, fontWeight: FontWeight.w600),
                      ),
                    ),
                  ],

                  const SizedBox(height: 28),
                  CustomButton(
                    text: 'Confirm & Dispatch Technician',
                    isLoading: _isBooking,
                    onPressed: _handleBookJob,
                    icon: Icons.electric_bolt_rounded,
                  ),

                  const SizedBox(height: 16),
                  const Center(
                    child: Text(
                      'Automated 60-second dispatch siren to nearest verified technician',
                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppTheme.slateMuted),
                    ),
                  ),
                ],
              ),
            ),
    );
  }

  Widget _buildPriceRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(fontSize: 13, color: AppTheme.slateMuted, fontWeight: FontWeight.w600)),
        Text(value, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppTheme.slateDark)),
      ],
    );
  }
}

