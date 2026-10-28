import 'dart:async';
import '../core/api_client.dart';
import '../core/session_manager.dart';

class TelemetryService {
  static Timer? _telemetryTimer;

  static Future<bool> setDutyStatus(bool isOnline) async {
    final tech = SessionManager.getCurrentTechnician();
    if (tech == null) return false;

    await SessionManager.setDutyOnline(isOnline);

    final res = await ApiClient.patch('/technicians/${tech.id}/availability', {
      'isAvailable': isOnline,
      'isOnline': isOnline,
    });

    if (isOnline) {
      startLiveTelemetry();
    } else {
      stopLiveTelemetry();
    }

    return res.success;
  }

  static void startLiveTelemetry() {
    _telemetryTimer?.cancel();
    _telemetryTimer = Timer.periodic(const Duration(seconds: 15), (timer) async {
      final tech = SessionManager.getCurrentTechnician();
      if (tech == null || !SessionManager.isDutyOnline()) {
        timer.cancel();
        return;
      }

      // Mumbai Colaba area realistic telemetry coordinates
      await ApiClient.post('/technicians/telemetry', {
        'technicianId': tech.id,
        'latitude': 18.9220,
        'longitude': 72.8347,
        'speed': 18.5,
        'heading': 45.0,
      });
    });
  }

  static void stopLiveTelemetry() {
    _telemetryTimer?.cancel();
    _telemetryTimer = null;
  }
}
