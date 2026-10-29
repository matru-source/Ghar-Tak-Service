class QuoteModel {
  final double baseLaborInr;
  final double cgstAmountInr;
  final double sgstAmountInr;
  final double totalGstAmountInr;
  final double totalPayableInr;
  final String serviceCode;
  final String serviceTitle;
  final String pincode;

  QuoteModel({
    required this.baseLaborInr,
    required this.cgstAmountInr,
    required this.sgstAmountInr,
    required this.totalGstAmountInr,
    required this.totalPayableInr,
    required this.serviceCode,
    required this.serviceTitle,
    required this.pincode,
  });

  factory QuoteModel.fromJson(Map<String, dynamic> json) {
    final data = json['data'] is Map ? json['data'] : json;
    final base = (data['baseLaborInr'] is num)
        ? (data['baseLaborInr'] as num).toDouble()
        : double.tryParse(data['baseLaborInr']?.toString() ?? '499') ?? 499.0;
    final cgst = (data['cgstAmountInr'] is num)
        ? (data['cgstAmountInr'] as num).toDouble()
        : MathRound(base * 0.09);
    final sgst = (data['sgstAmountInr'] is num)
        ? (data['sgstAmountInr'] as num).toDouble()
        : MathRound(base * 0.09);
    final total = (data['totalPayableInr'] is num)
        ? (data['totalPayableInr'] as num).toDouble()
        : (base + cgst + sgst);

    return QuoteModel(
      baseLaborInr: base,
      cgstAmountInr: cgst,
      sgstAmountInr: sgst,
      totalGstAmountInr: cgst + sgst,
      totalPayableInr: total,
      serviceCode: data['serviceCode']?.toString() ?? 'SRV-01',
      serviceTitle: data['serviceTitle']?.toString() ?? 'Electrical Service',
      pincode: data['pincode']?.toString() ?? '400001',
    );
  }

  static double MathRound(double val) {
    return (val * 100).round() / 100;
  }
}

