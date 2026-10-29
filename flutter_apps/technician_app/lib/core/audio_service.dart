import 'dart:async';
import 'package:flutter/services.dart';

class AudioService {
  static const MethodChannel _channel = MethodChannel('com.ghartak.technician/hardware');
  static bool _isPlayingSiren = false;
  static Timer? _hapticLoop;

  static bool get isPlayingSiren => _isPlayingSiren;

  static Future<void> startDispatchSiren() async {
    if (_isPlayingSiren) return;
    _isPlayingSiren = true;

    // 1. Invoke Hardware Audible Siren and Screen WakeUp
    try {
      await _channel.invokeMethod('playSiren');
    } catch (_) {}

    // 2. High-intensity haptic vibration pulses
    _hapticLoop = Timer.periodic(const Duration(milliseconds: 800), (timer) {
      if (!_isPlayingSiren) {
        timer.cancel();
      } else {
        HapticFeedback.heavyImpact();
      }
    });

    // 3. 60-second automatic safety cutoff
    Future.delayed(const Duration(seconds: 60), () {
      stopDispatchSiren();
    });
  }

  static void playDispatchSiren() => startDispatchSiren();
  static void stopSiren() => stopDispatchSiren();

  static Future<void> stopDispatchSiren() async {
    _isPlayingSiren = false;
    _hapticLoop?.cancel();
    _hapticLoop = null;

    try {
      await _channel.invokeMethod('stopSiren');
    } catch (_) {}
  }

  static Future<void> acquireScreenWakeLock() async {
    try {
      await _channel.invokeMethod('acquireWakeLock');
    } catch (_) {}
  }

  static Future<void> releaseScreenWakeLock() async {
    try {
      await _channel.invokeMethod('releaseWakeLock');
    } catch (_) {}
  }
}
