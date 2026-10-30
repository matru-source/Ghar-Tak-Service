class TechJobModel {
  final String id;
  final String jobTicketNumber;
  final String status;
  final String serviceTitle;
  final String customerName;
  final String customerPhone;
  final String customerAddressText;
  final String pincode;
  final double? customerLatitude;
  final double? customerLongitude;
  final String priority;
  final double totalAmountInr;
  final double techEarningInr;
  final bool safetyGlovesConfirmed;
  final bool safetyMcbSwitchConfirmed;
  final String? safetyPhotoUrl;
  final String? beforePhotoUrl;
  final String? afterPhotoUrl;
  final String? handoverOtp;
  final String? invoiceNumber;
  final String? scheduledAt;
  final String? dispatchedAt;
  final String? createdAt;
  final String? completedAt;
  final String? resolutionSummary;

  String get addressText => customerAddressText;

  TechJobModel({
    required this.id,
    required this.jobTicketNumber,
    required this.status,
    required this.serviceTitle,
    required this.customerName,
    required this.customerPhone,
    required this.customerAddressText,
    required this.pincode,
    this.customerLatitude,
    this.customerLongitude,
    this.priority = 'NORMAL',
    required this.totalAmountInr,
    required this.techEarningInr,
    this.safetyGlovesConfirmed = false,
    this.safetyMcbSwitchConfirmed = false,
    this.safetyPhotoUrl,
    this.beforePhotoUrl,
    this.afterPhotoUrl,
    this.handoverOtp,
    this.invoiceNumber,
    this.scheduledAt,
    this.dispatchedAt,
    this.createdAt,
    this.completedAt,
    this.resolutionSummary,
  });

  factory TechJobModel.fromJson(Map<String, dynamic> json) {
    final data = json['job'] is Map ? json['job'] : json;
    
    final total = (data['totalAmountInr'] is num)
        ? (data['totalAmountInr'] as num).toDouble()
        : double.tryParse(data['totalAmountInr']?.toString() ?? '1475') ?? 1475.0;

    // Direct 70% technician earning share
    final techEarning = (data['technicianShareInr'] is num)
        ? (data['technicianShareInr'] as num).toDouble()
        : (data['techEarningInr'] is num)
            ? (data['techEarningInr'] as num).toDouble()
            : (total * 0.70).roundToDouble();

    final customer = data['customer'] is Map ? data['customer'] : null;

    final lat = (data['customerLatitude'] is num)
        ? (data['customerLatitude'] as num).toDouble()
        : (data['latitude'] is num) ? (data['latitude'] as num).toDouble() : null;

    final lng = (data['customerLongitude'] is num)
        ? (data['customerLongitude'] as num).toDouble()
        : (data['longitude'] is num) ? (data['longitude'] as num).toDouble() : null;

    return TechJobModel(
      id: data['id']?.toString() ?? '',
      jobTicketNumber: data['jobTicketNumber']?.toString() ?? 'J-1001',
      status: data['status']?.toString() ?? 'ASSIGNED',
      serviceTitle: data['serviceTitle']?.toString() ?? 'Circuit Diagnostic & Repair',
      customerName: data['customerName']?.toString() ?? customer?['fullName']?.toString() ?? 'Premise Owner',
      customerPhone: data['customerPhone']?.toString() ?? customer?['phone']?.toString() ?? '+91 98200 54321',
      customerAddressText: data['customerAddressText']?.toString() ??
          data['addressText']?.toString() ??
          data['address']?.toString() ??
          data['customerAddress']?.toString() ??
          data['fullAddress']?.toString() ??
          'Customer Premise Address',
      pincode: data['pincode']?.toString() ?? '400001',
      customerLatitude: lat,
      customerLongitude: lng,
      priority: data['priority']?.toString() ?? 'NORMAL',
      totalAmountInr: total,
      techEarningInr: techEarning,
      safetyGlovesConfirmed: data['safetyGlovesConfirmed'] == true,
      safetyMcbSwitchConfirmed: data['safetyMcbSwitchConfirmed'] == true,
      safetyPhotoUrl: data['safetyPhotoUrl']?.toString(),
      beforePhotoUrl: data['beforePhotoUrl']?.toString(),
      afterPhotoUrl: data['afterPhotoUrl']?.toString(),
      handoverOtp: data['handoverOtp']?.toString(),
      invoiceNumber: data['invoiceNumber']?.toString(),
      scheduledAt: data['scheduledAt']?.toString(),
      dispatchedAt: data['dispatchedAt']?.toString(),
      createdAt: data['createdAt']?.toString(),
      completedAt: data['completedAt']?.toString(),
      resolutionSummary: data['resolutionSummary']?.toString() ?? data['resolutionNotes']?.toString(),
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
    double? customerLatitude,
    double? customerLongitude,
    String? priority,
    double? totalAmountInr,
    double? techEarningInr,
    bool? safetyGlovesConfirmed,
    bool? safetyMcbSwitchConfirmed,
    String? safetyPhotoUrl,
    String? beforePhotoUrl,
    String? afterPhotoUrl,
    String? handoverOtp,
    String? invoiceNumber,
    String? scheduledAt,
    String? dispatchedAt,
    String? createdAt,
    String? completedAt,
    String? resolutionSummary,
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
      customerLatitude: customerLatitude ?? this.customerLatitude,
      customerLongitude: customerLongitude ?? this.customerLongitude,
      priority: priority ?? this.priority,
      totalAmountInr: totalAmountInr ?? this.totalAmountInr,
      techEarningInr: techEarningInr ?? this.techEarningInr,
      safetyGlovesConfirmed: safetyGlovesConfirmed ?? this.safetyGlovesConfirmed,
      safetyMcbSwitchConfirmed: safetyMcbSwitchConfirmed ?? this.safetyMcbSwitchConfirmed,
      safetyPhotoUrl: safetyPhotoUrl ?? this.safetyPhotoUrl,
      beforePhotoUrl: beforePhotoUrl ?? this.beforePhotoUrl,
      afterPhotoUrl: afterPhotoUrl ?? this.afterPhotoUrl,
      handoverOtp: handoverOtp ?? this.handoverOtp,
      invoiceNumber: invoiceNumber ?? this.invoiceNumber,
      scheduledAt: scheduledAt ?? this.scheduledAt,
      dispatchedAt: dispatchedAt ?? this.dispatchedAt,
      createdAt: createdAt ?? this.createdAt,
      completedAt: completedAt ?? this.completedAt,
      resolutionSummary: resolutionSummary ?? this.resolutionSummary,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'jobTicketNumber': jobTicketNumber,
      'status': status,
      'serviceTitle': serviceTitle,
      'customerName': customerName,
      'customerPhone': customerPhone,
      'customerAddressText': customerAddressText,
      'pincode': pincode,
      'customerLatitude': customerLatitude,
      'customerLongitude': customerLongitude,
      'priority': priority,
      'totalAmountInr': totalAmountInr,
      'techEarningInr': techEarningInr,
      'safetyGlovesConfirmed': safetyGlovesConfirmed,
      'safetyMcbSwitchConfirmed': safetyMcbSwitchConfirmed,
      'safetyPhotoUrl': safetyPhotoUrl,
      'beforePhotoUrl': beforePhotoUrl,
      'afterPhotoUrl': afterPhotoUrl,
      'handoverOtp': handoverOtp,
      'invoiceNumber': invoiceNumber,
      'scheduledAt': scheduledAt,
      'dispatchedAt': dispatchedAt,
      'createdAt': createdAt,
      'completedAt': completedAt,
      'resolutionSummary': resolutionSummary,
    };
  }
}
