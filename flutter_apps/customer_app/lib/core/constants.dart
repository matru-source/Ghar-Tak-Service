class AppConstants {
  static const String appName = 'Ghar Tak';
  static const String appTagline = 'Fast • Safe • Transparent Doorstep Services';
  
  // Base API configuration (Live Cloud Vercel Production)
  static const String defaultBaseUrl = 'https://ghar-tak-service.vercel.app/api';
  static const String localWebBaseUrl = 'http://localhost:3000/api';
  static const String emulatorBaseUrl = 'http://10.0.2.2:3000/api';
  static const String productionBaseUrl = 'https://ghar-tak-service.vercel.app/api';

  // Storage Keys
  static const String keyAuthToken = 'gts_customer_jwt_token';
  static const String keyUserJson = 'gts_customer_user_json';
  static const String keySelectedPincode = 'gts_customer_pincode';
  static const String keyCustomBaseUrl = 'gts_custom_base_url';

  // Default Territory & Pincode
  static const String defaultPincode = '400001';
  static const String defaultCity = 'Mumbai, Maharashtra';
}

