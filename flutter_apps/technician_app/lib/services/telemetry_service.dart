import 'dart:async';
import '../core/api_client.dart';
import '../core/session_manager.dart';
import 'hardware_location_service.dart';

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
    _telemetryTimer = Timer.periodic(const Duration(seconds: 12), (timer) async {
      final tech = SessionManager.getCurrentTechnician();
      if (tech == null || !SessionManager.isDutyOnline()) {
        timer.cancel();
        return;
      }

      // Query real device hardware GPS sensor
      final loc = await HardwareLocationService.getCurrentLocation();

      await ApiClient.post('/technicians/telemetry', {
        'technicianId': tech.id,
        'latitude': loc.latitude,
        'longitude': loc.longitude,
        'speed': loc.speed,
        'heading': loc.heading,
        'accuracy': loc.accuracy,
        'isMock': loc.isMock,
      });
    });
  }

  static void stopLiveTelemetry() {
    _telemetryTimer?.cancel();
    _telemetryTimer = null;
  }
}

