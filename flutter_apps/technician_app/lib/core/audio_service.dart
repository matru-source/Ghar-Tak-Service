import 'dart:async';
import 'package:flutter/services.dart';

class AudioService {
  static bool _isPlayingSiren = false;
  static Timer? _hapticLoop;

  static bool get isPlayingSiren => _isPlayingSiren;

  static void startDispatchSiren() {
    if (_isPlayingSiren) return;
    _isPlayingSiren = true;

    // Trigger high-intensity emergency haptic pulses every 800ms
    _hapticLoop = Timer.periodic(const Duration(milliseconds: 800), (timer) {
      if (!_isPlayingSiren) {
        timer.cancel();
      } else {
        HapticFeedback.heavyImpact();
      }
    });

    // Automatically stop after 60 seconds if unacknowledged
    Future.delayed(const Duration(seconds: 60), () {
      stopDispatchSiren();
    });
  }

  static void stopDispatchSiren() {
    _isPlayingSiren = false;
    _hapticLoop?.cancel();
    _hapticLoop = null;
  }
}
