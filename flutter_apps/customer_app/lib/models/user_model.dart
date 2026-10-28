class UserModel {
  final String id;
  final String fullName;
  final String? email;
  final String phone;
  final String role;
  final String? avatarUrl;
  final String? address;
  final String? pincode;
  final bool hasActiveSubscription;

  UserModel({
    required this.id,
    required this.fullName,
    this.email,
    required this.phone,
    required this.role,
    this.avatarUrl,
    this.address,
    this.pincode,
    this.hasActiveSubscription = false,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    final userMap = json['user'] is Map ? json['user'] : json;
    return UserModel(
      id: userMap['id']?.toString() ?? '',
      fullName: userMap['fullName']?.toString() ?? userMap['name']?.toString() ?? 'GTS Customer',
      email: userMap['email']?.toString(),
      phone: userMap['phone']?.toString() ?? '',
      role: userMap['role']?.toString() ?? 'CUSTOMER',
      avatarUrl: userMap['avatarUrl']?.toString(),
      address: userMap['address']?.toString() ?? userMap['customerProfile']?['defaultAddressLine']?.toString(),
      pincode: userMap['pincode']?.toString() ?? userMap['customerProfile']?['defaultPincode']?.toString() ?? '400001',
      hasActiveSubscription: userMap['hasActiveSubscription'] == true ||
          userMap['customerProfile']?['activeSubscriptionPlan'] == 'ZEX_SHIELD_PRO',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'fullName': fullName,
      'email': email,
      'phone': phone,
      'role': role,
      'avatarUrl': avatarUrl,
      'address': address,
      'pincode': pincode,
      'hasActiveSubscription': hasActiveSubscription,
    };
  }
}

