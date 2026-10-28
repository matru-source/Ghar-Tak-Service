import '../core/api_client.dart';
import '../models/job_model.dart';

class JobService {
  static Future<ApiResponse<JobModel>> createBooking({
    required String customerId,
    required String customerName,
    required String customerPhone,
    required String serviceId,
    required String serviceTitle,
    required String pincode,
    required String addressText,
    String? technicianId,
  }) async {
    final res = await ApiClient.post('/jobs', {
      'customerId': customerId,
      'customerName': customerName,
      'customerPhone': customerPhone,
      'serviceId': serviceId,
      'serviceTitle': serviceTitle,
      'pincode': pincode,
      'customerAddressText': addressText,
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

  static Future<bool> triggerEmergencySos(String jobId, String reason) async {
    final res = await ApiClient.post('/emergency-sos', {
      'jobId': jobId,
      'reason': reason,
      'triggeredBy': 'CUSTOMER',
    });
    return res.success;
  }
}

