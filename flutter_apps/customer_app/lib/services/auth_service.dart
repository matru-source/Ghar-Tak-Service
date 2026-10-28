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
    // 1. Verify OTP challenge
    final verifyRes = await ApiClient.post('/auth/otp/verify', {
      'identifier': identifier,
      'code': code,
    });

    if (!verifyRes.success) {
      return ApiResponse(
        success: false,
        message: verifyRes.message ?? 'Invalid verification code',
        statusCode: verifyRes.statusCode,
      );
    }

    // 2. Register / Authenticate customer account
    final isEmail = identifier.contains('@');
    final regRes = await ApiClient.post('/auth/register', {
      'fullName': fullName ?? 'GTS Customer',
      'email': isEmail ? identifier : 'customer_${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}@ghartak.in',
      'phone': !isEmail ? identifier : '+919830000000',
      'password': 'password123',
      'address': address ?? 'Flat 904, Sea Green Horizon, Colaba, Mumbai',
      'pincode': pincode ?? '400001',
    });

    if (regRes.success && regRes.data != null) {
      final token = regRes.data['token']?.toString();
      if (token != null) {
        await SessionManager.saveAuthToken(token);
      }
      final user = UserModel.fromJson(regRes.data);
      await SessionManager.saveCurrentUser(user);
      return ApiResponse(success: true, data: user, statusCode: 200);
    }

    return ApiResponse(
      success: false,
      message: regRes.message ?? 'Failed to authenticate user',
      statusCode: regRes.statusCode,
    );
  }
}

