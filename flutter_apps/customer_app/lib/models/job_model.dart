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
  final bool safetyGlovesConfirmed;
  final bool safetyMcbSwitchConfirmed;

  JobModel({
    required this.id,
    required this.jobTicketNumber,
    required this.status,
    required this.serviceTitle,
    required this.pincode,
    required this.customerAddressText,
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
    this.safetyGlovesConfirmed = false,
    this.safetyMcbSwitchConfirmed = false,
  });

  factory JobModel.fromJson(Map<String, dynamic> json) {
    final data = json['job'] is Map ? json['job'] : json;
    final total = (data['totalAmountInr'] is num)
        ? (data['totalAmountInr'] as num).toDouble()
        : double.tryParse(data['totalAmountInr']?.toString() ?? '1475') ?? 1475.0;

    final tech = data['technician'] is Map ? data['technician'] : null;

    return JobModel(
      id: data['id']?.toString() ?? '',
      jobTicketNumber: data['jobTicketNumber']?.toString() ?? 'J-1001',
      status: data['status']?.toString() ?? 'ASSIGNED',
      serviceTitle: data['serviceTitle']?.toString() ?? 'Circuit Diagnostic',
      pincode: data['pincode']?.toString() ?? '400001',
      customerAddressText: data['customerAddressText']?.toString() ?? 'Doorstep Location',
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
      safetyGlovesConfirmed: data['safetyGlovesConfirmed'] == true,
      safetyMcbSwitchConfirmed: data['safetyMcbSwitchConfirmed'] == true,
    );
  }
}

