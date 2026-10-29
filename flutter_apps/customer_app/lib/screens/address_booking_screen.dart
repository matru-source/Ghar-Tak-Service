import 'package:flutter/material.dart';
import '../../core/session_manager.dart';
import '../../core/theme.dart';
import '../../models/service_model.dart';
import '../../utils/indian_pincode_resolver.dart';
import 'payment_screen.dart';

class AddressBookingScreen extends StatefulWidget {
  final ServiceModel service;

  const AddressBookingScreen({
    super.key,
    required this.service,
  });

  @override
  State<AddressBookingScreen> createState() => _AddressBookingScreenState();
}

class _AddressBookingScreenState extends State<AddressBookingScreen> {
  final _flatController = TextEditingController();
  final _streetController = TextEditingController();
  final _landmarkController = TextEditingController();
  final _pincodeController = TextEditingController();
  final _instructionsController = TextEditingController();

  String _resolvedArea = 'Colaba / Fort Hub';
  String _resolvedState = 'Maharashtra';
  String _stateCode = 'MH';
  String _gstinCode = '27AAACG1234F1Z5 (27-MH)';
  bool _isServiceable = true;

  bool _isEmergencyDispatch = true; // true = 30-min Emergency, false = Scheduled
  DateTime _scheduledDate = DateTime.now();
  String _scheduledTimeSlot = 'Morning (09:00 AM - 12:00 PM)';

  final List<String> _timeSlots = [
    'Morning (09:00 AM - 12:00 PM)',
    'Afternoon (12:00 PM - 03:00 PM)',
    'Evening (03:00 PM - 06:00 PM)',
    'Night (06:00 PM - 09:00 PM)',
  ];

  @override
  void initState() {
    super.initState();
    final user = SessionManager.getCurrentUser();
    final pin = SessionManager.getPincode();
    _pincodeController.text = pin;

    if (user != null && user.address != null && user.address!.isNotEmpty) {
      final parts = user.address!.split(',');
      if (parts.isNotEmpty) _flatController.text = parts[0].trim();
      if (parts.length > 1) _streetController.text = parts[1].trim();
      if (parts.length > 2) _landmarkController.text = parts.sublist(2).join(', ').trim();
    } else {
      _flatController.text = 'Flat 402, Building 4B';
      _streetController.text = 'Sea Face Road, Colaba';
      _landmarkController.text = 'Near Radio Club';
    }

    _resolvePincodeDetails(pin);
  }

  void _resolvePincodeDetails(String pin) {
    final details = IndianPincodeResolver.resolvePincode(pin);
    setState(() {
      _resolvedArea = details.areaName;
      _resolvedState = details.state;
      _stateCode = details.stateCode;
      _gstinCode = details.gstinStateCode;
      _isServiceable = details.isServiceable;
    });
  }

  double get _basePrice => widget.service.basePriceInr;
  double get _priorityFee => _isEmergencyDispatch ? 150.0 : 0.0;
  double get _subtotal => _basePrice + _priorityFee;
  double get _gst => _subtotal * 0.18;
  double get _totalPayable => _subtotal + _gst;

  bool get _canProceed {
    return _flatController.text.trim().isNotEmpty &&
        _streetController.text.trim().isNotEmpty &&
        _pincodeController.text.trim().length == 6 &&
        _isServiceable;
  }

  void _detectCurrentLocation() {
    setState(() {
      _flatController.text = 'Flat 904, Sea Green Horizon';
      _streetController.text = 'Colaba Causeway';
      _landmarkController.text = 'Opposite Taj Mahal Palace';
      _pincodeController.text = '400005';
    });
    _resolvePincodeDetails('400005');
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('GPS Auto-detected: Colaba Causeway, Mumbai (400005)')),
    );
  }

  void _proceedToPayment() {
    final fullAddress = '${_flatController.text.trim()}, ${_streetController.text.trim()}, ${_landmarkController.text.trim()}';

    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => PaymentScreen(
          service: widget.service,
          fullAddress: fullAddress,
          pincode: _pincodeController.text.trim(),
          areaName: _resolvedArea,
          stateCode: _stateCode,
          gstinCode: _gstinCode,
          isEmergency: _isEmergencyDispatch,
          scheduledTime: _isEmergencyDispatch ? 'Immediate (~30 mins)' : '${_scheduledDate.day}/${_scheduledDate.month}/${_scheduledDate.year} • $_scheduledTimeSlot',
          instructions: _instructionsController.text.trim(),
          basePrice: _basePrice,
          priorityFee: _priorityFee,
          gstAmount: _gst,
          totalAmount: _totalPayable,
        ),
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
          children: const [
            Text('ADDRESS & TIME SLOT', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            Text('Pincode Verification • Auto-Allocation', style: TextStyle(fontSize: 11, color: AppTheme.sapphireBlue)),
          ],
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Selected Service Summary Card
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppTheme.slateBorder),
              ),
              child: Row(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(10),
                    child: Container(
                      width: 48,
                      height: 48,
                      color: const Color(0xFFF1F5F9),
                      child: const Icon(Icons.build_rounded, color: AppTheme.sapphireBlue, size: 24),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(widget.service.title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                        Text('${widget.service.category} • ~${widget.service.durationMinutes} mins', style: const TextStyle(fontSize: 11, color: AppTheme.slateMuted)),
                      ],
                    ),
                  ),
                  Text(
                    '₹${widget.service.basePriceInr.toStringAsFixed(0)}',
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: AppTheme.sapphireBlue),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // Doorstep Address Form Card
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
                      const Text('Service Address Details', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
                      TextButton.icon(
                        style: TextButton.styleFrom(visualDensity: VisualDensity.compact),
                        icon: const Icon(Icons.my_location_rounded, size: 16, color: AppTheme.sapphireBlue),
                        label: const Text('Auto-Detect GPS', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppTheme.sapphireBlue)),
                        onPressed: _detectCurrentLocation,
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  TextField(
                    controller: _flatController,
                    onChanged: (_) => setState(() {}),
                    decoration: const InputDecoration(
                      labelText: 'Flat / Door / House No. *',
                      border: OutlineInputBorder(),
                      contentPadding: EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                    ),
                  ),
                  const SizedBox(height: 10),

                  TextField(
                    controller: _streetController,
                    onChanged: (_) => setState(() {}),
                    decoration: const InputDecoration(
                      labelText: 'Street / Building / Society Name *',
                      border: OutlineInputBorder(),
                      contentPadding: EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                    ),
                  ),
                  const SizedBox(height: 10),

                  TextField(
                    controller: _landmarkController,
                    decoration: const InputDecoration(
                      labelText: 'Nearby Landmark (e.g. Near Metro / Hospital)',
                      border: OutlineInputBorder(),
                      contentPadding: EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                    ),
                  ),
                  const SizedBox(height: 10),

                  // Pincode with Auto-Resolver Banner
                  TextField(
                    controller: _pincodeController,
                    keyboardType: TextInputType.number,
                    maxLength: 6,
                    onChanged: (val) {
                      if (val.length == 6) {
                        _resolvePincodeDetails(val);
                      }
                    },
                    decoration: InputDecoration(
                      labelText: '6-Digit Pincode *',
                      border: const OutlineInputBorder(),
                      counterText: '',
                      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                      suffixIcon: _pincodeController.text.length == 6
                          ? const Icon(Icons.check_circle_rounded, color: AppTheme.signalEmerald)
                          : null,
                    ),
                  ),
                  const SizedBox(height: 6),

                  // Resolved Locality Pill
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: const Color(0xFFEFF6FF),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: const Color(0xFFBFDBFE)),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.pin_drop_rounded, size: 16, color: AppTheme.sapphireBlue),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            'Zone: $_resolvedArea • $_resolvedState',
                            style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.bold, color: AppTheme.sapphireBlue),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // Live Nearby Technicians Telemetry Radar
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
                    children: [
                      Container(
                        width: 8,
                        height: 8,
                        decoration: const BoxDecoration(color: AppTheme.signalEmerald, shape: BoxShape.circle),
                      ),
                      const SizedBox(width: 8),
                      const Text(
                        'Nearby Certified Electricians (Live Radar)',
                        style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppTheme.slateBorder),
                    ),
                    child: Row(
                      children: [
                        ClipRRect(
                          borderRadius: BorderRadius.circular(20),
                          child: Image.asset(
                            'assets/images/img_technician_rajesh.png',
                            width: 38,
                            height: 38,
                            fit: BoxFit.cover,
                            errorBuilder: (_, __, ___) => const CircleAvatar(
                              radius: 19,
                              backgroundColor: AppTheme.sapphireBlue,
                              child: Icon(Icons.person, color: Colors.white, size: 20),
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: const [
                              Text('Rajesh Kumar (GTS-TECH-101)', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                              Text('4.9★ (120+ jobs) • 1.2 km away in your zone', style: TextStyle(fontSize: 11, color: AppTheme.slateMuted)),
                            ],
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: const Color(0xFFDCFCE7),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: const Text('ETA ~12m', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF15803D))),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // Service Urgency / Slot Selector Card
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
                  const Text('Booking Priority & Slot', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 12),

                  // Option 1: Emergency Rush Dispatch
                  InkWell(
                    onTap: () => setState(() => _isEmergencyDispatch = true),
                    borderRadius: BorderRadius.circular(12),
                    child: Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: _isEmergencyDispatch ? const Color(0xFFEFF6FF) : Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: _isEmergencyDispatch ? AppTheme.sapphireBlue : AppTheme.slateBorder,
                          width: _isEmergencyDispatch ? 1.5 : 1.0,
                        ),
                      ),
                      child: Row(
                        children: [
                          Icon(
                            _isEmergencyDispatch ? Icons.radio_button_checked : Icons.radio_button_off,
                            color: _isEmergencyDispatch ? AppTheme.sapphireBlue : AppTheme.slateMuted,
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: const [
                                Text('Immediate Emergency Dispatch (~30 mins)', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                                Text('Guaranteed technician arrival within 30 minutes', style: TextStyle(fontSize: 11, color: AppTheme.slateMuted)),
                              ],
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: AppTheme.primaryAmber,
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: const Text('+₹150', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.white)),
                          ),
                        ],
                      ),
                    ),
                  ),

                  const SizedBox(height: 10),

                  // Option 2: Scheduled Slot
                  InkWell(
                    onTap: () => setState(() => _isEmergencyDispatch = false),
                    borderRadius: BorderRadius.circular(12),
                    child: Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: !_isEmergencyDispatch ? const Color(0xFFEFF6FF) : Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: !_isEmergencyDispatch ? AppTheme.sapphireBlue : AppTheme.slateBorder,
                          width: !_isEmergencyDispatch ? 1.5 : 1.0,
                        ),
                      ),
                      child: Row(
                        children: [
                          Icon(
                            !_isEmergencyDispatch ? Icons.radio_button_checked : Icons.radio_button_off,
                            color: !_isEmergencyDispatch ? AppTheme.sapphireBlue : AppTheme.slateMuted,
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: const [
                                Text('Schedule for Later', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                                Text('Pick your preferred date & convenient time window', style: TextStyle(fontSize: 11, color: AppTheme.slateMuted)),
                              ],
                            ),
                          ),
                          const Text('₹0 Surge', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppTheme.signalEmerald)),
                        ],
                      ),
                    ),
                  ),

                  if (!_isEmergencyDispatch) ...[
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton.icon(
                            icon: const Icon(Icons.calendar_today_rounded, size: 16),
                            label: Text('${_scheduledDate.day}/${_scheduledDate.month}/${_scheduledDate.year}'),
                            onPressed: () async {
                              final picked = await showDatePicker(
                                context: context,
                                initialDate: _scheduledDate,
                                firstDate: DateTime.now(),
                                lastDate: DateTime.now().add(const Duration(days: 14)),
                              );
                              if (picked != null) setState(() => _scheduledDate = picked);
                            },
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    DropdownButtonFormField<String>(
                      value: _scheduledTimeSlot,
                      decoration: const InputDecoration(border: OutlineInputBorder(), contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8)),
                      items: _timeSlots.map((s) => DropdownMenuItem(value: s, child: Text(s, style: const TextStyle(fontSize: 12)))).toList(),
                      onChanged: (val) {
                        if (val != null) setState(() => _scheduledTimeSlot = val);
                      },
                    ),
                  ],
                ],
              ),
            ),

            const SizedBox(height: 16),

            // Special Instructions
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
                  const Text('Special Access Instructions (Optional)', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  TextField(
                    controller: _instructionsController,
                    maxLines: 2,
                    decoration: const InputDecoration(
                      hintText: 'e.g., Gate code 402, ring doorbell twice, watch out for pet...',
                      hintStyle: TextStyle(fontSize: 12, color: AppTheme.slateMuted),
                      border: OutlineInputBorder(),
                    ),
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
                const Text('TOTAL WITH 18% GST', style: TextStyle(fontSize: 9.5, fontWeight: FontWeight.bold, color: AppTheme.slateMuted)),
                Text(
                  '₹${_totalPayable.toStringAsFixed(2)}',
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
              onPressed: _canProceed ? _proceedToPayment : null,
              child: Row(
                children: const [
                  Text('CONTINUE TO PAYMENT', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                  SizedBox(width: 6),
                  Icon(Icons.arrow_forward_rounded, size: 16),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

