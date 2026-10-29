class AppConstants {
  static const String appName = 'Ghar Tak Technician';
  static const String appTagline = 'Field Technician & Electrical Safety Console';

  // Google OAuth 2.0 Web Client ID for Android Google Sign-In verification
  static const String googleServerClientId = '458445561611-rjrjgt5angqj7qgdqdup8i8ag954j57c.apps.googleusercontent.com';

  // API Configuration (Live Cloud Vercel Production)
  static const String defaultBaseUrl = 'https://ghar-tak-service.vercel.app/api';
  static const String fallbackLocalUrl = 'http://10.0.2.2:3000/api';

  // Storage Keys
  static const String keyAuthToken = 'tech_auth_token';
  static const String keyTechnicianJson = 'tech_profile_json';
  static const String keyIsOnline = 'tech_is_online';
  static const String keyCustomBaseUrl = 'tech_custom_base_url';

  // Dispatch siren timeout in seconds
  static const int dispatchSirenTimeoutSeconds = 60;

  // Revenue Share
  static const double technicianCommissionRate = 0.70; // 70% direct commission
}

