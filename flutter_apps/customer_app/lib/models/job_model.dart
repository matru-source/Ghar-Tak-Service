class JobModel {
  final String id;
  final String jobTicketNumber;
  final String status;
  final String serviceTitle;
  final String pincode;
  final String customerAddressText;
  final double totalAmountInr;
  final String? handoverOtp;
  final String? technicianId;
  final String? technicianName;
  final String? technicianBadge;
  final String? technicianPhone;
  final double technicianRating;
  final String? invoiceNumber;
  final String? scheduledAt;
  final String? completedAt;
  final String? createdAt;
  final bool safetyGlovesConfirmed;
  final bool safetyMcbSwitchConfirmed;

  String get addressText => customerAddressText;

  JobModel({
    required this.id,
    required this.jobTicketNumber,
    required this.status,
    required this.serviceTitle,
    required this.pincode,
    String? customerAddressText,
    String? addressText,
    required this.totalAmountInr,
    this.handoverOtp,
    this.technicianId,
    this.technicianName,
    this.technicianBadge,
    this.technicianPhone,
    this.technicianRating = 5.0,
    this.invoiceNumber,
    this.scheduledAt,
    this.completedAt,
    this.createdAt,
    this.safetyGlovesConfirmed = false,
    this.safetyMcbSwitchConfirmed = false,
  }) : customerAddressText = customerAddressText ?? addressText ?? 'Doorstep Location';

  JobModel copyWith({
    String? id,
    String? jobTicketNumber,
    String? status,
    String? serviceTitle,
    String? pincode,
    String? customerAddressText,
    double? totalAmountInr,
    String? handoverOtp,
    String? technicianId,
    String? technicianName,
    String? technicianBadge,
    String? technicianPhone,
    double? technicianRating,
    String? invoiceNumber,
    String? scheduledAt,
    String? completedAt,
    String? createdAt,
    bool? safetyGlovesConfirmed,
    bool? safetyMcbSwitchConfirmed,
  }) {
    return JobModel(
      id: id ?? this.id,
      jobTicketNumber: jobTicketNumber ?? this.jobTicketNumber,
      status: status ?? this.status,
      serviceTitle: serviceTitle ?? this.serviceTitle,
      pincode: pincode ?? this.pincode,
      customerAddressText: customerAddressText ?? this.customerAddressText,
      totalAmountInr: totalAmountInr ?? this.totalAmountInr,
      handoverOtp: handoverOtp ?? this.handoverOtp,
      technicianId: technicianId ?? this.technicianId,
      technicianName: technicianName ?? this.technicianName,
      technicianBadge: technicianBadge ?? this.technicianBadge,
      technicianPhone: technicianPhone ?? this.technicianPhone,
      technicianRating: technicianRating ?? this.technicianRating,
      invoiceNumber: invoiceNumber ?? this.invoiceNumber,
      scheduledAt: scheduledAt ?? this.scheduledAt,
      completedAt: completedAt ?? this.completedAt,
      createdAt: createdAt ?? this.createdAt,
      safetyGlovesConfirmed: safetyGlovesConfirmed ?? this.safetyGlovesConfirmed,
      safetyMcbSwitchConfirmed: safetyMcbSwitchConfirmed ?? this.safetyMcbSwitchConfirmed,
    );
  }

  factory JobModel.fromJson(Map<String, dynamic> json) {
    final data = json['job'] is Map ? json['job'] : json;
    final total = (data['totalAmountInr'] is num)
        ? (data['totalAmountInr'] as num).toDouble()
        : double.tryParse(data['totalAmountInr']?.toString() ?? '1475') ?? 1475.0;

    final tech = data['technician'] is Map ? data['technician'] : null;

    final resolvedAddress = data['customerAddressText']?.toString() ??
        data['addressText']?.toString() ??
        data['address']?.toString() ??
        data['customerAddress']?.toString() ??
        data['fullAddress']?.toString() ??
        'Doorstep Location';

    return JobModel(
      id: data['id']?.toString() ?? '',
      jobTicketNumber: data['jobTicketNumber']?.toString() ?? 'J-1001',
      status: data['status']?.toString() ?? 'ASSIGNED',
      serviceTitle: data['serviceTitle']?.toString() ?? 'Circuit Diagnostic',
      pincode: data['pincode']?.toString() ?? '400001',
      customerAddressText: resolvedAddress,
      totalAmountInr: total,
      handoverOtp: data['handoverOtp']?.toString(),
      technicianId: data['technicianId']?.toString() ?? tech?['id']?.toString(),
      technicianName: data['technicianName']?.toString() ?? tech?['fullName']?.toString() ?? 'Verified Pro',
      technicianBadge: tech?['badgeNumber']?.toString() ?? 'GTS-TECH-101',
      technicianPhone: tech?['phone']?.toString() ?? '',
      technicianRating: (tech?['rating'] is num) ? (tech!['rating'] as num).toDouble() : 4.9,
      invoiceNumber: data['invoiceNumber']?.toString() ?? data['invoice']?['invoiceNumber']?.toString(),
      scheduledAt: data['scheduledAt']?.toString(),
      completedAt: data['completedAt']?.toString(),
      createdAt: data['createdAt']?.toString(),
      safetyGlovesConfirmed: data['safetyGlovesConfirmed'] == true,
      safetyMcbSwitchConfirmed: data['safetyMcbSwitchConfirmed'] == true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'jobTicketNumber': jobTicketNumber,
      'status': status,
      'serviceTitle': serviceTitle,
      'pincode': pincode,
      'customerAddressText': customerAddressText,
      'addressText': customerAddressText,
      'address': customerAddressText,
      'totalAmountInr': totalAmountInr,
      'handoverOtp': handoverOtp,
      'technicianId': technicianId,
      'technicianName': technicianName,
      'technicianBadge': technicianBadge,
      'technicianPhone': technicianPhone,
      'technicianRating': technicianRating,
      'invoiceNumber': invoiceNumber,
      'scheduledAt': scheduledAt,
      'completedAt': completedAt,
      'createdAt': createdAt,
      'safetyGlovesConfirmed': safetyGlovesConfirmed,
      'safetyMcbSwitchConfirmed': safetyMcbSwitchConfirmed,
    };
  }
}
