import '../core/api_client.dart';
import '../core/session_manager.dart';
import '../models/job_model.dart';

class JobService {
  static Future<ApiResponse<JobModel>> createBooking({
    required String customerId,
    required String customerName,
    required String customerPhone,
    required String serviceId,
    required String serviceTitle,
    required String pincode,
    String? addressText,
    String? customerAddressText,
    String? technicianId,
  }) async {
    final effectiveAddress = (customerAddressText != null && customerAddressText.trim().isNotEmpty)
        ? customerAddressText.trim()
        : (addressText != null && addressText.trim().isNotEmpty)
            ? addressText.trim()
            : 'Doorstep Premise Address';

    final res = await ApiClient.post('/jobs', {
      'customerId': customerId,
      'customerName': customerName,
      'customerPhone': customerPhone,
      'serviceId': serviceId,
      'serviceTitle': serviceTitle,
      'pincode': pincode,
      // Canonical and legacy field aliases for 100% interoperability
      'customerAddressText': effectiveAddress,
      'addressText': effectiveAddress,
      'address': effectiveAddress,
      'customerAddress': effectiveAddress,
      if (technicianId != null) 'technicianId': technicianId,
    });

    if (res.success && res.data != null) {
      final job = JobModel.fromJson(res.data);
      return ApiResponse(success: true, data: job, statusCode: res.statusCode);
    }

    return ApiResponse(
      success: false,
      message: res.message ?? 'Failed to book service',
      statusCode: res.statusCode,
    );
  }

  static Future<JobModel?> getJobDetails(String jobId) async {
    final res = await ApiClient.get('/jobs/$jobId?role=CUSTOMER');
    if (res.success && res.data != null) {
      return JobModel.fromJson(res.data);
    }
    return null;
  }

  static Future<Map<String, dynamic>?> getJobParts(String jobId) async {
    final res = await ApiClient.get('/jobs/$jobId/parts');
    if (res.success && res.data != null && res.data is Map) {
      return Map<String, dynamic>.from(res.data);
    }
    return null;
  }

  static Future<ApiResponse<dynamic>> approvePartsQuote({
    required String jobId,
    required String partId,
    required String decision,
    String? paymentMethod,
  }) async {
    final user = SessionManager.getCurrentUser();
    return await ApiClient.post('/jobs/$jobId/parts/approve', {
      'partId': partId,
      'decision': decision,
      'customerId': user?.id,
      if (paymentMethod != null) 'paymentMethod': paymentMethod,
    });
  }

  static Future<bool> triggerEmergencySos(String jobId, String reason) async {
    final user = SessionManager.getCurrentUser();
    final res = await ApiClient.post('/emergency-sos', {
      'jobId': jobId,
      'reason': reason,
      'role': 'CUSTOMER',
      'triggeredBy': 'CUSTOMER',
      'customerId': user?.id,
      'customerName': user?.fullName,
      'phone': user?.phone,
      'ticketNumber': SessionManager.getActiveJobTicketNumber(),
    });
    return res.success;
  }

  static Future<ApiResponse<dynamic>> submitJobRating({
    required String jobId,
    required int rating,
    String? feedback,
    List<String>? feedbackTags,
    bool isSignatureAdopted = false,
  }) async {
    final user = SessionManager.getCurrentUser();
    return await ApiClient.post('/jobs/$jobId/rating', {
      'rating': rating,
      'customerRating': rating,
      if (feedback != null) 'feedback': feedback,
      if (feedbackTags != null) 'feedbackTags': feedbackTags,
      'isSignatureAdopted': isSignatureAdopted,
      'customerId': user?.id,
    });
  }
}

