class PastOrderItem {
  final String ticketNumber;
  final String invoiceNumber;
  final String serviceTitle;
  final String dateText;
  final String technicianName;
  final double amountInr;
  final double taxableAmount;
  final double cgstAmount;
  final double sgstAmount;
  final String status;

  const PastOrderItem({
    required this.ticketNumber,
    required this.invoiceNumber,
    required this.serviceTitle,
    required this.dateText,
    required this.technicianName,
    required this.amountInr,
    required this.taxableAmount,
    required this.cgstAmount,
    required this.sgstAmount,
    this.status = 'COMPLETED',
  });

  Map<String, dynamic> toJson() => {
    'ticketNumber': ticketNumber,
    'invoiceNumber': invoiceNumber,
    'serviceTitle': serviceTitle,
    'dateText': dateText,
    'technicianName': technicianName,
    'amountInr': amountInr,
    'taxableAmount': taxableAmount,
    'cgstAmount': cgstAmount,
    'sgstAmount': sgstAmount,
    'status': status,
  };

  factory PastOrderItem.fromJson(Map<String, dynamic> json) => PastOrderItem(
    ticketNumber: json['ticketNumber'] ?? 'GTS-1001',
    invoiceNumber: json['invoiceNumber'] ?? 'INV-2026-1001',
    serviceTitle: json['serviceTitle'] ?? 'Electrical Service',
    dateText: json['dateText'] ?? 'Today',
    technicianName: json['technicianName'] ?? 'Rajesh Kumar (GTS Certified)',
    amountInr: (json['amountInr'] as num?)?.toDouble() ?? 299.0,
    taxableAmount: (json['taxableAmount'] as num?)?.toDouble() ?? 253.39,
    cgstAmount: (json['cgstAmount'] as num?)?.toDouble() ?? 22.80,
    sgstAmount: (json['sgstAmount'] as num?)?.toDouble() ?? 22.80,
    status: json['status'] ?? 'COMPLETED',
  );
}
