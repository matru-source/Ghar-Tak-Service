import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'constants.dart';
import '../models/technician_model.dart';

class SessionManager {
  static SharedPreferences? _prefs;

  static Future<void> init() async {
    _prefs ??= await SharedPreferences.getInstance();
  }

  static String getBaseUrl() {
    final custom = _prefs?.getString(AppConstants.keyCustomBaseUrl);
    if (custom != null && custom.isNotEmpty && !custom.contains('vercel.app')) {
      return custom;
    }
    return AppConstants.defaultBaseUrl;
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

  static TechnicianModel? getCurrentTechnician() {
    final str = _prefs?.getString(AppConstants.keyTechnicianJson);
    if (str == null || str.isEmpty) return null;
    try {
      return TechnicianModel.fromJson(jsonDecode(str));
    } catch (_) {
      return null;
    }
  }

  static Future<void> saveCurrentTechnician(TechnicianModel technician) async {
    await _prefs?.setString(AppConstants.keyTechnicianJson, jsonEncode(technician.toJson()));
  }

  static String? getPushToken() {
    return _prefs?.getString(AppConstants.keyPushToken);
  }

  static Future<void> savePushToken(String token) async {
    await _prefs?.setString(AppConstants.keyPushToken, token);
  }

  static bool isDutyOnline() {
    return _prefs?.getBool(AppConstants.keyIsOnline) ?? true;
  }

  static Future<void> setDutyOnline(bool isOnline) async {
    await _prefs?.setBool(AppConstants.keyIsOnline, isOnline);
  }

  static bool isLoggedIn() {
    final token = getAuthToken();
    return token != null && token.isNotEmpty;
  }

  static Future<void> logout() async {
    await _prefs?.remove(AppConstants.keyAuthToken);
    await _prefs?.remove(AppConstants.keyTechnicianJson);
    await _prefs?.remove(AppConstants.keyIsOnline);
  }

  static Future<void> clearSession() => logout();
}

