import '../core/api_client.dart';
import '../core/session_manager.dart';
import '../models/technician_model.dart';

class TechAuthService {
  static Future<ApiResponse<dynamic>> sendOtp({
    required String phone,
    required String badgeNumber,
  }) async {
    return await ApiClient.post('/auth/otp/send', {
      'identifier': phone,
      'phone': phone,
      'purpose': 'LOGIN',
      'role': 'TECHNICIAN',
      'badgeNumber': badgeNumber,
    });
  }

  static Future<ApiResponse<TechnicianModel>> verifyOtp({
    required String phone,
    required String otp,
    required String badgeNumber,
  }) async {
    final res = await ApiClient.post('/auth/otp/verify', {
      'identifier': phone,
      'phone': phone,
      'code': otp,
      'otp': otp,
      'purpose': 'LOGIN',
      'role': 'TECHNICIAN',
      'badgeNumber': badgeNumber,
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
          fullName: res.data['fullName']?.toString() ?? 'Rajesh Kumar',
          phone: phone,
          badgeNumber: badgeNumber.isNotEmpty ? badgeNumber : 'GTS-TECH-101',
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
