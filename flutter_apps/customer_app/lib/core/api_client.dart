import 'dart:convert';
import 'package:http/http.dart' as http;
import 'session_manager.dart';

class ApiResponse<T> {
  final bool success;
  final String? message;
  final T? data;
  final int statusCode;

  ApiResponse({
    required this.success,
    this.message,
    this.data,
    required this.statusCode,
  });
}

class ApiClient {
  static Future<Map<String, String>> _headers() async {
    final headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'x-client-app': 'customer',
      'x-user-role': 'CUSTOMER',
    };
    final token = SessionManager.getAuthToken();
    if (token != null && token.isNotEmpty) {
      headers['Authorization'] = 'Bearer $token';
    }
    return headers;
  }

  static String _resolveUrl(String endpoint) {
    final baseUrl = SessionManager.getBaseUrl().replaceAll(RegExp(r'/+$'), '');
    final cleanEndpoint = endpoint.startsWith('/') ? endpoint : '/$endpoint';
    return '$baseUrl$cleanEndpoint';
  }

  static Future<ApiResponse<dynamic>> get(String endpoint) async {
    try {
      final url = Uri.parse(_resolveUrl(endpoint));
      final headers = await _headers();
      final response = await http.get(url, headers: headers);
      return _parseResponse(response);
    } catch (e) {
      return ApiResponse(success: false, message: e.toString(), statusCode: 500);
    }
  }

  static Future<ApiResponse<dynamic>> post(String endpoint, Map<String, dynamic> body) async {
    try {
      final url = Uri.parse(_resolveUrl(endpoint));
      final headers = await _headers();
      final response = await http.post(url, headers: headers, body: jsonEncode(body));
      return _parseResponse(response);
    } catch (e) {
      return ApiResponse(success: false, message: e.toString(), statusCode: 500);
    }
  }

  static Future<ApiResponse<dynamic>> patch(String endpoint, Map<String, dynamic> body) async {
    try {
      final url = Uri.parse(_resolveUrl(endpoint));
      final headers = await _headers();
      final response = await http.patch(url, headers: headers, body: jsonEncode(body));
      return _parseResponse(response);
    } catch (e) {
      return ApiResponse(success: false, message: e.toString(), statusCode: 500);
    }
  }

  static ApiResponse<dynamic> _parseResponse(http.Response response) {
    try {
      final json = jsonDecode(response.body);
      final isSuccess = response.statusCode >= 200 && response.statusCode < 300;
      final success = json['success'] == true || (isSuccess && json['success'] != false);
      final message = json['message'] ?? json['error'] ?? (isSuccess ? 'Success' : 'Request failed');
      final data = json['data'] ?? json;
      return ApiResponse(
        success: success,
        message: message?.toString(),
        data: data,
        statusCode: response.statusCode,
      );
    } catch (_) {
      return ApiResponse(
        success: response.statusCode >= 200 && response.statusCode < 300,
        message: response.body,
        data: response.body,
        statusCode: response.statusCode,
      );
    }
  }
}

