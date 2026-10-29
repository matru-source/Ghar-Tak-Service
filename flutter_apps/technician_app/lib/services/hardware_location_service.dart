import 'package:flutter/services.dart';

class HardwareLocation {
  final double latitude;
  final double longitude;
  final double speed;
  final double heading;
  final double accuracy;
  final bool isMock;

  HardwareLocation({
    required this.latitude,
    required this.longitude,
    required this.speed,
    required this.heading,
    required this.accuracy,
    required this.isMock,
  });
}

class HardwareLocationService {
  static const MethodChannel _channel = MethodChannel('com.ghartak.technician/hardware');

  static Future<HardwareLocation> getCurrentLocation() async {
    try {
      final res = await _channel.invokeMethod('getLocation');
      if (res is Map) {
        return HardwareLocation(
          latitude: (res['latitude'] as num?)?.toDouble() ?? 18.9220,
          longitude: (res['longitude'] as num?)?.toDouble() ?? 72.8347,
          speed: (res['speed'] as num?)?.toDouble() ?? 0.0,
          heading: (res['heading'] as num?)?.toDouble() ?? 0.0,
          accuracy: (res['accuracy'] as num?)?.toDouble() ?? 10.0,
          isMock: res['isMock'] == true,
        );
      }
    } catch (_) {}

    return HardwareLocation(
      latitude: 18.9220,
      longitude: 72.8347,
      speed: 0.0,
      heading: 0.0,
      accuracy: 15.0,
      isMock: true,
    );
  }
}

