import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'constants.dart';
import '../models/user_model.dart';

class SessionManager {
  static SharedPreferences? _prefs;

  static Future<void> init() async {
    _prefs ??= await SharedPreferences.getInstance();
  }

  static String getBaseUrl() {
    return _prefs?.getString(AppConstants.keyCustomBaseUrl) ?? AppConstants.defaultBaseUrl;
  }

  static Future<void> setBaseUrl(String url) async {
    await _prefs?.setString(AppConstants.keyCustomBaseUrl, url);
  }

  static String? getAuthToken() {
    return _prefs?.getString(AppConstants.keyAuthToken);
  }

  static Future<void> saveAuthToken(String token) async {
    await _prefs?.setString(AppConstants.keyAuthToken, token);
  }

  static UserModel? getCurrentUser() {
    final str = _prefs?.getString(AppConstants.keyUserJson);
    if (str == null || str.isEmpty) return null;
    try {
      return UserModel.fromJson(jsonDecode(str));
    } catch (_) {
      return null;
    }
  }

  static Future<void> saveCurrentUser(UserModel user) async {
    await _prefs?.setString(AppConstants.keyUserJson, jsonEncode(user.toJson()));
  }

  static String getPincode() {
    return _prefs?.getString(AppConstants.keySelectedPincode) ?? AppConstants.defaultPincode;
  }

  static Future<void> savePincode(String pincode) async {
    await _prefs?.setString(AppConstants.keySelectedPincode, pincode);
  }

  static bool isLoggedIn() {
    final token = getAuthToken();
    return token != null && token.isNotEmpty;
  }

  static Future<void> logout() async {
    await _prefs?.remove(AppConstants.keyAuthToken);
    await _prefs?.remove(AppConstants.keyUserJson);
  }

  // Compatibility aliases
  static Future<void> saveUser(UserModel user) => saveCurrentUser(user);
  static Future<void> saveToken(String token) => saveAuthToken(token);
  static Future<void> clearSession() => logout();
}
