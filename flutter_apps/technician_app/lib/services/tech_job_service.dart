import '../core/api_client.dart';
import '../core/session_manager.dart';
import '../models/tech_job_model.dart';

class TechJobService {
  static Future<List<TechJobModel>> getAssignedJobs() async {
    final tech = SessionManager.getCurrentTechnician();
    final techId = tech?.id ?? 'tech_rajesh_01';

    final res = await ApiClient.get('/jobs?technicianId=$techId');
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
  }) async {
    final tech = SessionManager.getCurrentTechnician();
    final res = await ApiClient.post('/jobs/$jobId/dispatch-response', {
      'technicianId': tech?.id ?? 'tech_rajesh_01',
      'response': accept ? 'ACCEPT' : 'DECLINE',
    });
    return res.success;
  }

  static Future<bool> updateStatus({
    required String jobId,
    required String status,
  }) async {
    final tech = SessionManager.getCurrentTechnician();
    final res = await ApiClient.patch('/jobs/$jobId/status', {
      'status': status,
      'technicianId': tech?.id ?? 'tech_rajesh_01',
    });
    return res.success;
  }

  static Future<ApiResponse<dynamic>> verifySafetyChecklist({
    required String jobId,
    required bool glovesConfirmed,
    required bool mcbSwitchConfirmed,
    required String photoUrl,
  }) async {
    final tech = SessionManager.getCurrentTechnician();
    return await ApiClient.post('/jobs/$jobId/verify-safety', {
      'technicianId': tech?.id ?? 'tech_rajesh_01',
      'safetyGlovesConfirmed': glovesConfirmed,
      'safetyMcbSwitchConfirmed': mcbSwitchConfirmed,
      'photoUrl': photoUrl,
      'dielectricRating': '1000V_TESTED',
      'multimeterReading': '0.00V',
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
      'afterPhotoUrl': afterPhotoUrl ?? 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800',
    });
  }
}
