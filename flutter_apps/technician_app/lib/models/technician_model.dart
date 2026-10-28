class TechnicianModel {
  final String id;
  final String fullName;
  final String phone;
  final String badgeNumber;
  final bool isAvailable;
  final String partnerId;
  final List<String> territoryPincodes;
  final double rating;
  final int completedJobsCount;
  final double walletBalance;
  final String electricalLicense;

  TechnicianModel({
    required this.id,
    required this.fullName,
    required this.phone,
    required this.badgeNumber,
    this.isAvailable = true,
    this.partnerId = 'ptnr_mah_01',
    this.territoryPincodes = const ['400001', '400005', '400021'],
    this.rating = 4.9,
    this.completedJobsCount = 142,
    this.walletBalance = 1033.0,
    this.electricalLicense = 'PWD/MH/ELEC-883921',
  });

  factory TechnicianModel.fromJson(Map<String, dynamic> json) {
    final tech = json['technician'] is Map ? json['technician'] : json;
    
    List<String> pincodes = [];
    if (tech['territoryPincodes'] is List) {
      pincodes = (tech['territoryPincodes'] as List).map((e) => e.toString()).toList();
    } else {
      pincodes = ['400001', '400005', '400021'];
    }

    return TechnicianModel(
      id: tech['id']?.toString() ?? 'tech_rajesh_01',
      fullName: tech['fullName']?.toString() ?? 'Rajesh Kumar',
      phone: tech['phone']?.toString() ?? '+91 98200 12345',
      badgeNumber: tech['badgeNumber']?.toString() ?? 'GTS-TECH-101',
      isAvailable: tech['isAvailable'] == true || tech['isOnline'] == true,
      partnerId: tech['partnerId']?.toString() ?? 'ptnr_mah_01',
      territoryPincodes: pincodes,
      rating: (tech['rating'] is num) ? (tech['rating'] as num).toDouble() : 4.9,
      completedJobsCount: tech['completedJobsCount'] is int ? tech['completedJobsCount'] : 142,
      walletBalance: (tech['walletBalance'] is num) ? (tech['walletBalance'] as num).toDouble() : 1033.0,
      electricalLicense: tech['electricalLicense']?.toString() ?? 'PWD/MH/ELEC-883921',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'fullName': fullName,
      'phone': phone,
      'badgeNumber': badgeNumber,
      'isAvailable': isAvailable,
      'partnerId': partnerId,
      'territoryPincodes': territoryPincodes,
      'rating': rating,
      'completedJobsCount': completedJobsCount,
      'walletBalance': walletBalance,
      'electricalLicense': electricalLicense,
    };
  }

  TechnicianModel copyWith({
    String? id,
    String? fullName,
    String? phone,
    String? badgeNumber,
    bool? isAvailable,
    String? partnerId,
    List<String>? territoryPincodes,
    double? rating,
    int? completedJobsCount,
    double? walletBalance,
    String? electricalLicense,
  }) {
    return TechnicianModel(
      id: id ?? this.id,
      fullName: fullName ?? this.fullName,
      phone: phone ?? this.phone,
      badgeNumber: badgeNumber ?? this.badgeNumber,
      isAvailable: isAvailable ?? this.isAvailable,
      partnerId: partnerId ?? this.partnerId,
      territoryPincodes: territoryPincodes ?? this.territoryPincodes,
      rating: rating ?? this.rating,
      completedJobsCount: completedJobsCount ?? this.completedJobsCount,
      walletBalance: walletBalance ?? this.walletBalance,
      electricalLicense: electricalLicense ?? this.electricalLicense,
    );
  }
}

