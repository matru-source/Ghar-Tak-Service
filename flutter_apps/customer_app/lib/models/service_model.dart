class ServiceModel {
  final String id;
  final String code;
  final String title;
  final String categoryId;
  final double basePriceInr;
  final double gstRatePct;
  final int estimatedDurationMinutes;
  final String? imageAsset;
  final String? description;

  String get category {
    if (categoryId.toLowerCase().contains('fan')) return 'Fans & Fixtures';
    if (categoryId.toLowerCase().contains('light')) return 'Lighting';
    if (categoryId.toLowerCase().contains('switch') || categoryId.toLowerCase().contains('mcb')) return 'Switchboards & MCB';
    if (categoryId.toLowerCase().contains('geyser') || categoryId.toLowerCase().contains('appliance')) return 'Heavy Appliances/Geyser';
    if (categoryId.toLowerCase().contains('wir')) return 'House Wiring';
    if (categoryId.toLowerCase().contains('plumb')) return 'Plumbing';
    return 'Electrical';
  }

  int get durationMinutes => estimatedDurationMinutes;

  ServiceModel({
    required this.id,
    required this.code,
    required this.title,
    String? categoryId,
    String? category,
    required this.basePriceInr,
    this.gstRatePct = 18.0,
    int? estimatedDurationMinutes,
    int? durationMinutes,
    this.imageAsset,
    this.description,
  })  : categoryId = categoryId ?? category ?? 'Electrical',
        estimatedDurationMinutes = estimatedDurationMinutes ?? durationMinutes ?? 45;

  factory ServiceModel.fromJson(Map<String, dynamic> json) {
    final title = json['title']?.toString() ?? 'Electrical Service';
    String? resolvedImage;
    final lowerTitle = title.toLowerCase();
    if (lowerTitle.contains('switch') || lowerTitle.contains('board')) {
      resolvedImage = 'assets/images/service_switchboard.png';
    } else if (lowerTitle.contains('fan')) {
      resolvedImage = 'assets/images/service_fan.png';
    } else if (lowerTitle.contains('geyser') || lowerTitle.contains('heater')) {
      resolvedImage = 'assets/images/service_geyser.png';
    } else if (lowerTitle.contains('light') || lowerTitle.contains('chandelier')) {
      resolvedImage = 'assets/images/service_light.png';
    } else if (lowerTitle.contains('wiring') || lowerTitle.contains('circuit')) {
      resolvedImage = 'assets/images/service_wiring.png';
    }

    return ServiceModel(
      id: json['id']?.toString() ?? '',
      code: json['code']?.toString() ?? 'SRV-01',
      title: title,
      categoryId: json['categoryId']?.toString() ?? json['category']?.toString() ?? 'Electrical',
      basePriceInr: (json['basePriceInr'] is num)
          ? (json['basePriceInr'] as num).toDouble()
          : double.tryParse(json['basePriceInr']?.toString() ?? '499') ?? 499.0,
      gstRatePct: (json['gstRatePct'] is num)
          ? (json['gstRatePct'] as num).toDouble()
          : 18.0,
      estimatedDurationMinutes: json['estimatedDurationMinutes'] ?? json['durationMinutes'] ?? 45,
      imageAsset: resolvedImage ?? 'assets/images/service_switchboard.png',
      description: json['description']?.toString() ?? 'Complete diagnostic, repair, and safety verification by verified professional.',
    );
  }
}
