import 'dart:convert';
import 'package:http/http.dart' as http;
import 'constants.dart';
import 'session_manager.dart';

class ApiResponse<T> {
  final bool success;
  final T? data;
  final String? message;
  final int statusCode;

  ApiResponse({
    required this.success,
    this.data,
    this.message,
    required this.statusCode,
  });
}

class ApiClient {
  static Map<String, String> _buildHeaders() {
    final headers = {'Content-Type': 'application/json'};
    final token = SessionManager.getAuthToken();
    if (token != null && token.isNotEmpty) {
      headers['Authorization'] = 'Bearer $token';
    }
    return headers;
  }

  static Future<ApiResponse<dynamic>> get(String endpoint) async {
    final baseUrl = SessionManager.getBaseUrl();
    try {
      final res = await http.get(
        Uri.parse('$baseUrl$endpoint'),
        headers: _buildHeaders(),
      ).timeout(const Duration(seconds: 10));

      return _handleResponse(res);
    } catch (e) {
      return ApiResponse(success: false, message: e.toString(), statusCode: 500);
    }
  }

  static Future<ApiResponse<dynamic>> post(String endpoint, Map<String, dynamic> body) async {
    final baseUrl = SessionManager.getBaseUrl();
    try {
      final res = await http.post(
        Uri.parse('$baseUrl$endpoint'),
        headers: _buildHeaders(),
        body: jsonEncode(body),
      ).timeout(const Duration(seconds: 10));

      return _handleResponse(res);
    } catch (e) {
      return ApiResponse(success: false, message: e.toString(), statusCode: 500);
    }
  }

  static Future<ApiResponse<dynamic>> patch(String endpoint, Map<String, dynamic> body) async {
    final baseUrl = SessionManager.getBaseUrl();
    try {
      final res = await http.patch(
        Uri.parse('$baseUrl$endpoint'),
        headers: _buildHeaders(),
        body: jsonEncode(body),
      ).timeout(const Duration(seconds: 10));

      return _handleResponse(res);
    } catch (e) {
      return ApiResponse(success: false, message: e.toString(), statusCode: 500);
    }
  }

  static ApiResponse<dynamic> _handleResponse(http.Response res) {
    try {
      final dynamic decoded = jsonDecode(res.body);
      if (res.statusCode >= 200 && res.statusCode < 300) {
        return ApiResponse(success: true, data: decoded, statusCode: res.statusCode);
      } else {
        final msg = decoded is Map && decoded['error'] != null
            ? decoded['error'].toString()
            : (decoded is Map && decoded['message'] != null ? decoded['message'].toString() : 'Server Error');
        return ApiResponse(success: false, message: msg, statusCode: res.statusCode);
      }
    } catch (_) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        return ApiResponse(success: true, data: res.body, statusCode: res.statusCode);
      }
      return ApiResponse(success: false, message: 'Invalid server response (${res.statusCode})', statusCode: res.statusCode);
    }
  }
}
