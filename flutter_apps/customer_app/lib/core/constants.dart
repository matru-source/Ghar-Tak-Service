class AppConstants {
  static const String appName = 'Ghar Tak';
  static const String appTagline = 'Fast • Safe • Transparent Doorstep Services';
  
  // Base API configuration (Supports Emulator, Real Device & Production)
  static const String defaultBaseUrl = 'http://10.0.2.2:3000/api';
  static const String localWebBaseUrl = 'http://localhost:3000/api';
  static const String productionBaseUrl = 'https://gts-api.saralgroups.com/api';

  // Storage Keys
  static const String keyAuthToken = 'gts_customer_jwt_token';
  static const String keyUserJson = 'gts_customer_user_json';
  static const String keySelectedPincode = 'gts_customer_pincode';
  static const String keyCustomBaseUrl = 'gts_custom_base_url';

  // Default Territory & Pincode
  static const String defaultPincode = '400001';
  static const String defaultCity = 'Mumbai, Maharashtra';
}

