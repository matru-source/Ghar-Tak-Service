import '../core/api_client.dart';
import '../core/session_manager.dart';
import '../models/user_model.dart';

class AuthService {
  static Future<ApiResponse<dynamic>> sendOtp({
    required String identifier,
    String purpose = 'LOGIN',
  }) async {
    return await ApiClient.post('/auth/otp/send', {
      'identifier': identifier,
      'purpose': purpose,
    });
  }

  static Future<ApiResponse<UserModel>> verifyOtpAndLogin({
    required String identifier,
    required String code,
    String? fullName,
    String? address,
    String? pincode,
  }) async {
    // 1. Verify OTP challenge against backend
    final verifyRes = await ApiClient.post('/auth/otp/verify', {
      'identifier': identifier,
      'code': code,
      'otp': code,
      'fullName': fullName,
      'role': 'CUSTOMER',
    });

    if (!verifyRes.success) {
      return ApiResponse(
        success: false,
        message: verifyRes.message ?? 'Invalid verification code',
        statusCode: verifyRes.statusCode,
      );
    }

    final data = verifyRes.data;
    if (data != null && data is Map<String, dynamic>) {
      final token = data['token']?.toString();
      if (token != null && token.isNotEmpty) {
        await SessionManager.saveAuthToken(token);
      }

      final userData = data['user'] is Map<String, dynamic>
          ? data['user'] as Map<String, dynamic>
          : data;

      final user = UserModel.fromJson({
        ...userData,
        'address': address ?? userData['address'] ?? 'Doorstep Service Premise',
        'pincode': pincode ?? userData['pincode'] ?? '400001',
      });

      await SessionManager.saveCurrentUser(user);
      return ApiResponse(success: true, data: user, statusCode: 200);
    }

    return ApiResponse(
      success: false,
      message: 'Failed to parse authentication payload',
      statusCode: 500,
    );
  }

  static Future<ApiResponse<UserModel>> verifyOtp({
    required String identifier,
    required String otp,
    String? name,
    String? address,
    String? pincode,
  }) async {
    return await verifyOtpAndLogin(
      identifier: identifier,
      code: otp,
      fullName: name,
      address: address,
      pincode: pincode,
    );
  }

  static Future<ApiResponse<UserModel>> loginWithGoogle({
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
      'role': 'CUSTOMER',
    });

    if (res.success && res.data != null && res.data is Map<String, dynamic>) {
      final token = res.data['token']?.toString();
      if (token != null && token.isNotEmpty) {
        await SessionManager.saveAuthToken(token);
      }
      final userData = res.data['user'] is Map<String, dynamic>
          ? res.data['user'] as Map<String, dynamic>
          : res.data;
      final user = UserModel.fromJson(userData);
      await SessionManager.saveCurrentUser(user);
      return ApiResponse(success: true, data: user, statusCode: 200);
    }

    return ApiResponse(
      success: false,
      message: res.message ?? 'Google Sign-In failed',
      statusCode: res.statusCode,
    );
  }
}
