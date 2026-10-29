import '../core/api_client.dart';
import '../core/session_manager.dart';
import '../models/tech_job_model.dart';

class TechJobService {
  static Future<List<TechJobModel>> getAssignedJobs({String? status}) async {
    final tech = SessionManager.getCurrentTechnician();
    final techId = tech?.id ?? 'tech_rajesh_01';

    String endpoint = '/jobs?technicianId=$techId';
    if (status != null && status.isNotEmpty && status != 'All') {
      endpoint += '&status=$status';
    }

    final res = await ApiClient.get(endpoint);
    if (res.success && res.data != null) {
      final list = (res.data is List) ? res.data : (res.data['jobs'] as List? ?? []);
      return list.map<TechJobModel>((j) => TechJobModel.fromJson(j as Map<String, dynamic>)).toList();
    }
    return [];
  }

  static Future<TechJobModel?> getJobDetails(String jobId) async {
    final res = await ApiClient.get('/jobs/$jobId?role=TECHNICIAN');
    if (res.success && res.data != null) {
      return TechJobModel.fromJson(res.data);
    }
    return null;
  }

  static Future<bool> respondToDispatch({
    required String jobId,
    required bool accept,
    String? reason,
  }) async {
    final tech = SessionManager.getCurrentTechnician();
    final res = await ApiClient.post('/jobs/$jobId/dispatch-response', {
      'technicianId': tech?.id ?? 'tech_rajesh_01',
      'action': accept ? 'ACCEPT' : 'REJECT',
      'reason': reason ?? (accept ? 'Technician accepted dispatch' : 'Technician unavailable'),
    });
    return res.success;
  }

  static Future<bool> updateStatus({
    required String jobId,
    required String status,
  }) async {
    final tech = SessionManager.getCurrentTechnician();
    final res = await ApiClient.patch('/jobs/$jobId', {
      'status': status,
      'actorId': tech?.id ?? 'tech_rajesh_01',
    });
    return res.success;
  }

  static Future<bool> updateCustomerTelemetry({
    required String jobId,
    required double lat,
    required double lng,
    String? status,
    int? etaMinutes,
  }) async {
    final tech = SessionManager.getCurrentTechnician();
    final res = await ApiClient.post('/jobs/$jobId/customer-telemetry', {
      'technicianId': tech?.id ?? 'tech_rajesh_01',
      'latitude': lat,
      'longitude': lng,
      if (status != null) 'status': status,
      if (etaMinutes != null) 'etaMinutes': etaMinutes,
      'timestamp': DateTime.now().toIso8601String(),
    });
    return res.success;
  }

  static Future<ApiResponse<dynamic>> verifySafetyChecklist({
    required String jobId,
    required bool glovesConfirmed,
    required bool mcbSwitchConfirmed,
    required String photoUrl,
    String multimeterReading = '0.00V',
  }) async {
    final tech = SessionManager.getCurrentTechnician();
    return await ApiClient.post('/jobs/$jobId/verify-safety', {
      'technicianId': tech?.id ?? 'tech_rajesh_01',
      'safetyGlovesConfirmed': glovesConfirmed,
      'safetyMcbSwitchConfirmed': mcbSwitchConfirmed,
      'photoUrl': photoUrl,
      'dielectricRating': '1000V_TESTED',
      'multimeterReading': multimeterReading,
    });
  }

  static Future<ApiResponse<dynamic>> completeJob({
    required String jobId,
    required String handoverOtp,
    required String resolutionNotes,
    String? afterPhotoUrl,
  }) async {
    final tech = SessionManager.getCurrentTechnician();
    return await ApiClient.post('/jobs/$jobId/complete', {
      'technicianId': tech?.id ?? 'tech_rajesh_01',
      'handoverOtp': handoverOtp,
      'resolutionSummary': resolutionNotes,
      'afterPhotoUrl': afterPhotoUrl ?? 'https://uploads.ghartak.in/evidence/completion.jpg',
      'beforePhotoUrl': 'https://uploads.ghartak.in/uploads/pre_inspection_baseline.jpg',
      'supervisorApproval': true,
    });
  }

  static Future<bool> triggerEmergencySos({
    required String jobId,
    required String reason,
    double? lat,
    double? lng,
  }) async {
    final tech = SessionManager.getCurrentTechnician();
    final res = await ApiClient.post('/emergency-sos', {
      'jobId': jobId,
      'role': 'TECHNICIAN',
      'triggeredBy': 'TECHNICIAN',
      'technicianId': tech?.id ?? 'tech_rajesh_01',
      'technicianName': tech?.fullName ?? 'Field Technician',
      'phone': tech?.phone ?? '+919999000000',
      'reason': reason,
      'latitude': lat ?? 18.9220,
      'longitude': lng ?? 72.8347,
    });
    return res.success;
  }
}
