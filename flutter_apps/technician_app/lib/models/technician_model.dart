class TechnicianModel {
  final String id;
  final String fullName;
  final String phone;
  final String email;
  final String badgeNumber;
  final bool isAvailable;
  final String partnerId;
  final String assignedPincode;
  final List<String> territoryPincodes;
  final double rating;
  final int completedJobsCount;
  final double walletBalance;
  final String electricalLicense;
  final String location;
  final String languages;
  final String specialization;
  final String experience;
  final String trade;
  final String? avatarUrl;
  final String kycStatus;
  final String? aadharDocUrl;
  final String? panDocUrl;
  final String? electricalLicenseDocUrl;
  final String? safetyKitSerial;

  TechnicianModel({
    required this.id,
    required this.fullName,
    required this.phone,
    this.email = 'technician@ghartak.in',
    required this.badgeNumber,
    this.isAvailable = true,
    this.partnerId = 'ptnr_mah_01',
    this.assignedPincode = '400001',
    this.territoryPincodes = const ['400001', '400005', '400021'],
    this.rating = 4.9,
    this.completedJobsCount = 142,
    this.walletBalance = 1033.0,
    this.electricalLicense = 'PWD/MH/ELEC-883921',
    this.location = 'Mumbai Central Hub',
    this.languages = 'Hindi, Marathi, English',
    this.specialization = 'Certified Electrician (1000V Dielectric)',
    this.experience = '6+ Years Field Experience',
    this.trade = 'ELECTRICAL',
    this.avatarUrl,
    this.kycStatus = 'PENDING_REVIEW',
    this.aadharDocUrl,
    this.panDocUrl,
    this.electricalLicenseDocUrl,
    this.safetyKitSerial,
  });

  factory TechnicianModel.fromJson(Map<String, dynamic> json) {
    final tech = json['technician'] is Map ? json['technician'] : json;
    
    List<String> pincodes = [];
    if (tech['territoryPincodes'] is List) {
      pincodes = (tech['territoryPincodes'] as List).map((e) => e.toString()).toList();
    } else {
      pincodes = ['400001', '400005', '400021'];
    }

    final pin = tech['assignedPincode']?.toString() ?? '400001';

    return TechnicianModel(
      id: tech['id']?.toString() ?? 'tech_rajesh_01',
      fullName: tech['fullName']?.toString() ?? 'Rajesh Kumar',
      phone: tech['phone']?.toString() ?? '+91 98200 12345',
      email: tech['email']?.toString() ?? 'rajesh.kumar@ghartak.in',
      badgeNumber: tech['badgeNumber']?.toString() ?? 'GTS-TECH-101',
      isAvailable: tech['isAvailable'] == true || tech['isOnline'] == true,
      partnerId: tech['partnerId']?.toString() ?? 'ptnr_mah_01',
      assignedPincode: pin,
      territoryPincodes: pincodes,
      rating: (tech['rating'] is num) ? (tech['rating'] as num).toDouble() : 4.9,
      completedJobsCount: tech['completedJobsCount'] is int ? tech['completedJobsCount'] : 142,
      walletBalance: (tech['walletBalance'] is num) ? (tech['walletBalance'] as num).toDouble() : 1033.0,
      electricalLicense: tech['electricalLicense']?.toString() ?? 'PWD/MH/ELEC-883921',
      location: tech['location']?.toString() ?? 'Mumbai Central Hub',
      languages: tech['languages']?.toString() ?? 'Hindi, Marathi, English',
      specialization: tech['specialization']?.toString() ?? 'Certified Electrician (1000V Dielectric)',
      experience: tech['experience']?.toString() ?? '6+ Years Field Experience',
      trade: tech['trade']?.toString() ?? 'ELECTRICAL',
      avatarUrl: tech['avatarUrl']?.toString(),
      kycStatus: tech['kycStatus']?.toString() ?? 'PENDING_REVIEW',
      aadharDocUrl: tech['aadharDocUrl']?.toString(),
      panDocUrl: tech['panDocUrl']?.toString(),
      electricalLicenseDocUrl: tech['electricalLicenseDocUrl']?.toString(),
      safetyKitSerial: tech['safetyKitSerial']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'fullName': fullName,
      'phone': phone,
      'email': email,
      'badgeNumber': badgeNumber,
      'isAvailable': isAvailable,
      'partnerId': partnerId,
      'assignedPincode': assignedPincode,
      'territoryPincodes': territoryPincodes,
      'rating': rating,
      'completedJobsCount': completedJobsCount,
      'walletBalance': walletBalance,
      'electricalLicense': electricalLicense,
      'location': location,
      'languages': languages,
      'specialization': specialization,
      'experience': experience,
      'trade': trade,
      'avatarUrl': avatarUrl,
      'kycStatus': kycStatus,
      'aadharDocUrl': aadharDocUrl,
      'panDocUrl': panDocUrl,
      'electricalLicenseDocUrl': electricalLicenseDocUrl,
      'safetyKitSerial': safetyKitSerial,
    };
  }

  TechnicianModel copyWith({
    String? id,
    String? fullName,
    String? phone,
    String? email,
    String? badgeNumber,
    bool? isAvailable,
    String? partnerId,
    String? assignedPincode,
    List<String>? territoryPincodes,
    double? rating,
    int? completedJobsCount,
    double? walletBalance,
    String? electricalLicense,
    String? location,
    String? languages,
    String? specialization,
    String? experience,
    String? trade,
    String? avatarUrl,
    String? kycStatus,
    String? aadharDocUrl,
    String? panDocUrl,
    String? electricalLicenseDocUrl,
    String? safetyKitSerial,
  }) {
    return TechnicianModel(
      id: id ?? this.id,
      fullName: fullName ?? this.fullName,
      phone: phone ?? this.phone,
      email: email ?? this.email,
      badgeNumber: badgeNumber ?? this.badgeNumber,
      isAvailable: isAvailable ?? this.isAvailable,
      partnerId: partnerId ?? this.partnerId,
      assignedPincode: assignedPincode ?? this.assignedPincode,
      territoryPincodes: territoryPincodes ?? this.territoryPincodes,
      rating: rating ?? this.rating,
      completedJobsCount: completedJobsCount ?? this.completedJobsCount,
      walletBalance: walletBalance ?? this.walletBalance,
      electricalLicense: electricalLicense ?? this.electricalLicense,
      location: location ?? this.location,
      languages: languages ?? this.languages,
      specialization: specialization ?? this.specialization,
      experience: experience ?? this.experience,
      trade: trade ?? this.trade,
      avatarUrl: avatarUrl ?? this.avatarUrl,
      kycStatus: kycStatus ?? this.kycStatus,
      aadharDocUrl: aadharDocUrl ?? this.aadharDocUrl,
      panDocUrl: panDocUrl ?? this.panDocUrl,
      electricalLicenseDocUrl: electricalLicenseDocUrl ?? this.electricalLicenseDocUrl,
      safetyKitSerial: safetyKitSerial ?? this.safetyKitSerial,
    );
  }
}
