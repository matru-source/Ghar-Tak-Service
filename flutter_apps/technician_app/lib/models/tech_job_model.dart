class TechJobModel {
  final String id;
  final String jobTicketNumber;
  final String status;
  final String serviceTitle;
  final String customerName;
  final String customerPhone;
  final String customerAddressText;
  final String pincode;
  final double totalAmountInr;
  final double techEarningInr;
  final bool safetyGlovesConfirmed;
  final bool safetyMcbSwitchConfirmed;
  final String? safetyPhotoUrl;
  final String? scheduledAt;
  final String? completedAt;

  TechJobModel({
    required this.id,
    required this.jobTicketNumber,
    required this.status,
    required this.serviceTitle,
    required this.customerName,
    required this.customerPhone,
    required this.customerAddressText,
    required this.pincode,
    required this.totalAmountInr,
    required this.techEarningInr,
    this.safetyGlovesConfirmed = false,
    this.safetyMcbSwitchConfirmed = false,
    this.safetyPhotoUrl,
    this.scheduledAt,
    this.completedAt,
  });

  factory TechJobModel.fromJson(Map<String, dynamic> json) {
    final data = json['job'] is Map ? json['job'] : json;
    
    final total = (data['totalAmountInr'] is num)
        ? (data['totalAmountInr'] as num).toDouble()
        : double.tryParse(data['totalAmountInr']?.toString() ?? '1475') ?? 1475.0;

    // Direct 70% payout share
    final techEarning = (data['technicianShareInr'] is num)
        ? (data['technicianShareInr'] as num).toDouble()
        : (total * 0.70).roundToDouble();

    final customer = data['customer'] is Map ? data['customer'] : null;

    return TechJobModel(
      id: data['id']?.toString() ?? '',
      jobTicketNumber: data['jobTicketNumber']?.toString() ?? 'J-1001',
      status: data['status']?.toString() ?? 'ASSIGNED',
      serviceTitle: data['serviceTitle']?.toString() ?? 'Circuit Diagnostic & Repair',
      customerName: data['customerName']?.toString() ?? customer?['fullName']?.toString() ?? 'Premise Owner',
      customerPhone: data['customerPhone']?.toString() ?? customer?['phone']?.toString() ?? '+91 98200 54321',
      customerAddressText: data['customerAddressText']?.toString() ?? 'Customer Premise Address',
      pincode: data['pincode']?.toString() ?? '400001',
      totalAmountInr: total,
      techEarningInr: techEarning,
      safetyGlovesConfirmed: data['safetyGlovesConfirmed'] == true,
      safetyMcbSwitchConfirmed: data['safetyMcbSwitchConfirmed'] == true,
      safetyPhotoUrl: data['safetyPhotoUrl']?.toString(),
      scheduledAt: data['scheduledAt']?.toString(),
      completedAt: data['completedAt']?.toString(),
    );
  }

  TechJobModel copyWith({
    String? id,
    String? jobTicketNumber,
    String? status,
    String? serviceTitle,
    String? customerName,
    String? customerPhone,
    String? customerAddressText,
    String? pincode,
    double? totalAmountInr,
    double? techEarningInr,
    bool? safetyGlovesConfirmed,
    bool? safetyMcbSwitchConfirmed,
    String? safetyPhotoUrl,
    String? scheduledAt,
    String? completedAt,
  }) {
    return TechJobModel(
      id: id ?? this.id,
      jobTicketNumber: jobTicketNumber ?? this.jobTicketNumber,
      status: status ?? this.status,
      serviceTitle: serviceTitle ?? this.serviceTitle,
      customerName: customerName ?? this.customerName,
      customerPhone: customerPhone ?? this.customerPhone,
      customerAddressText: customerAddressText ?? this.customerAddressText,
      pincode: pincode ?? this.pincode,
      totalAmountInr: totalAmountInr ?? this.totalAmountInr,
      techEarningInr: techEarningInr ?? this.techEarningInr,
      safetyGlovesConfirmed: safetyGlovesConfirmed ?? this.safetyGlovesConfirmed,
      safetyMcbSwitchConfirmed: safetyMcbSwitchConfirmed ?? this.safetyMcbSwitchConfirmed,
      safetyPhotoUrl: safetyPhotoUrl ?? this.safetyPhotoUrl,
      scheduledAt: scheduledAt ?? this.scheduledAt,
      completedAt: completedAt ?? this.completedAt,
    );
  }
}
