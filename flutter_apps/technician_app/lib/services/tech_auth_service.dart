import '../core/api_client.dart';
import '../core/session_manager.dart';
import '../models/technician_model.dart';

class TechAuthService {
  static Future<ApiResponse<dynamic>> sendOtp({
    required String identifier,
    String? badgeNumber,
  }) async {
    return await ApiClient.post('/auth/otp/send', {
      'identifier': identifier,
      'purpose': 'LOGIN',
      'role': 'TECHNICIAN',
      if (badgeNumber != null && badgeNumber.isNotEmpty) 'badgeNumber': badgeNumber,
    });
  }

  static Future<ApiResponse<TechnicianModel>> verifyOtp({
    required String identifier,
    required String otp,
    String? badgeNumber,
  }) async {
    final res = await ApiClient.post('/auth/otp/verify', {
      'identifier': identifier,
      'code': otp,
      'otp': otp,
      'purpose': 'LOGIN',
      'role': 'TECHNICIAN',
      if (badgeNumber != null && badgeNumber.isNotEmpty) 'badgeNumber': badgeNumber,
    });

    if (res.success && res.data != null) {
      final token = res.data['token']?.toString() ?? 'tech_jwt_session_token';
      await SessionManager.saveAuthToken(token);

      TechnicianModel tech;
      if (res.data['user'] != null || res.data['technician'] != null) {
        tech = TechnicianModel.fromJson(res.data['technician'] ?? res.data['user']);
      } else {
        tech = TechnicianModel(
          id: res.data['id']?.toString() ?? 'tech_rajesh_01',
          fullName: res.data['fullName']?.toString() ?? 'Field Technician',
          phone: identifier,
          badgeNumber: (badgeNumber != null && badgeNumber.isNotEmpty) ? badgeNumber : 'GTS-TECH-101',
        );
      }
      await SessionManager.saveCurrentTechnician(tech);
      return ApiResponse(success: true, data: tech, statusCode: res.statusCode);
    }

    return ApiResponse(
      success: false,
      message: res.message ?? 'Invalid OTP code. Please retry.',
      statusCode: res.statusCode,
    );
  }

  static Future<ApiResponse<TechnicianModel>> loginWithGoogle({
    required String email,
    required String fullName,
    String? idToken,
    String? googleId,
  }) async {
    final res = await ApiClient.post('/auth/google', {
      'email': email,
      'fullName': fullName,
      'idToken': idToken,
      'googleId': googleId,
      'role': 'TECHNICIAN',
    });

    if (res.success && res.data != null && res.data is Map<String, dynamic>) {
      final token = res.data['token']?.toString();
      if (token != null && token.isNotEmpty) {
        await SessionManager.saveAuthToken(token);
      }
      final userData = res.data['user'] is Map<String, dynamic>
          ? res.data['user'] as Map<String, dynamic>
          : res.data;
      final tech = TechnicianModel.fromJson(userData);
      await SessionManager.saveCurrentTechnician(tech);
      return ApiResponse(success: true, data: tech, statusCode: 200);
    }

    return ApiResponse(
      success: false,
      message: res.message ?? 'Google Sign-In failed',
      statusCode: res.statusCode,
    );
  }

  static Future<TechnicianModel?> refreshProfile() async {
    final current = SessionManager.getCurrentTechnician();
    if (current == null) return null;

    final res = await ApiClient.get('/technicians/${current.id}');
    if (res.success && res.data != null) {
      final updated = TechnicianModel.fromJson(res.data);
      await SessionManager.saveCurrentTechnician(updated);
      return updated;
    }
    return current;
  }
}
