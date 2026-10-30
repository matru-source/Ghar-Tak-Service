import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'session_manager.dart';
import 'api_client.dart';

typedef TechRealtimeEventCallback = void Function(String eventType, Map<String, dynamic> data);

class RealtimeStreamManager {
  static final RealtimeStreamManager _instance = RealtimeStreamManager._internal();
  factory RealtimeStreamManager() => _instance;
  RealtimeStreamManager._internal();

  HttpClient? _client;
  HttpClientRequest? _request;
  StreamSubscription? _subscription;
  bool _isConnected = false;
  bool _shouldReconnect = true;
  Timer? _reconnectTimer;
  Timer? _heartbeatWatchdog;

  final List<TechRealtimeEventCallback> _listeners = [];
  final StreamController<Map<String, dynamic>> _eventStreamController =
      StreamController<Map<String, dynamic>>.broadcast();

  Stream<Map<String, dynamic>> get eventStream => _eventStreamController.stream;
  bool get isConnected => _isConnected;

  void addListener(TechRealtimeEventCallback listener) {
    if (!_listeners.contains(listener)) {
      _listeners.add(listener);
    }
  }

  void removeListener(TechRealtimeEventCallback listener) {
    _listeners.remove(listener);
  }

  /// Reset the 35-second heartbeat watchdog. Reconnects if the background connection stalls.
  void _resetHeartbeatWatchdog() {
    _heartbeatWatchdog?.cancel();
    _heartbeatWatchdog = Timer(const Duration(seconds: 35), () {
      // Background socket likely dropped or froze during device doze mode
      _handleDisconnect();
    });
  }

  void connect({String? technicianId, String? hubId}) {
    disconnect();
    _shouldReconnect = true;

    final tech = SessionManager.getCurrentTechnician();
    final effectiveTechId = technicianId ?? tech?.id ?? '';
    final baseUrl = SessionManager.getBaseUrl().replaceAll(RegExp(r'/+$'), '');

    String streamUrl = '$baseUrl/realtime/events?role=TECHNICIAN';
    if (effectiveTechId.isNotEmpty) {
      streamUrl += '&technicianId=$effectiveTechId';
    }
    if (hubId != null && hubId.isNotEmpty) {
      streamUrl += '&partnerId=$hubId';
    }

    _startSseStream(streamUrl);
  }

  Future<void> _startSseStream(String urlString) async {
    try {
      _client = HttpClient();
      _client!.connectionTimeout = const Duration(seconds: 15);

      final uri = Uri.parse(urlString);
      _request = await _client!.getUrl(uri);
      _request!.headers.set('Accept', 'text/event-stream');
      _request!.headers.set('Cache-Control', 'no-cache');
      _request!.headers.set('Connection', 'keep-alive');

      final token = SessionManager.getAuthToken();
      if (token != null && token.isNotEmpty) {
        _request!.headers.set('Authorization', 'Bearer $token');
      }

      final response = await _request!.close();
      if (response.statusCode == 200) {
        _isConnected = true;
        _resetHeartbeatWatchdog();

        String buffer = '';
        _subscription = response.transform(utf8.decoder).listen(
          (chunk) {
            _resetHeartbeatWatchdog();
            buffer += chunk;
            while (buffer.contains('\n\n')) {
              final eventEndIndex = buffer.indexOf('\n\n');
              final rawEvent = buffer.substring(0, eventEndIndex);
              buffer = buffer.substring(eventEndIndex + 2);
              _processRawSseEvent(rawEvent);
            }
          },
          onError: (err) {
            _handleDisconnect();
          },
          onDone: () {
            _handleDisconnect();
          },
          cancelOnError: false,
        );
      } else {
        _handleDisconnect();
      }
    } catch (_) {
      _handleDisconnect();
    }
  }

  void _processRawSseEvent(String rawEvent) {
    String? eventType;
    String? dataStr;

    final lines = rawEvent.split('\n');
    for (final line in lines) {
      final trimmed = line.trim();
      if (trimmed.startsWith('event:')) {
        eventType = trimmed.substring(6).trim();
      } else if (trimmed.startsWith('data:')) {
        dataStr = trimmed.substring(5).trim();
      }
    }

    if (dataStr != null && dataStr.isNotEmpty) {
      try {
        final decoded = jsonDecode(dataStr);
        if (decoded is Map<String, dynamic>) {
          final type = decoded['type']?.toString() ?? eventType ?? 'MESSAGE';
          _eventStreamController.add(decoded);
          for (final callback in List.from(_listeners)) {
            try {
              callback(type, decoded);
            } catch (_) {}
          }
        }
      } catch (_) {}
    }
  }

  /// Ingest background Firebase Cloud Messaging (FCM) or APNs notification payload directly
  /// and wake up the 60-second dispatch siren dialog even if SSE was asleep.
  void handleIncomingPushNotification(Map<String, dynamic> fcmData) {
    final type = fcmData['type']?.toString() ?? 'DISPATCH_BROADCAST';
    _eventStreamController.add(fcmData);
    for (final callback in List.from(_listeners)) {
      try {
        callback(type, fcmData);
      } catch (_) {}
    }
  }

  /// Register or sync this device's push token with the backend dispatch engine.
  Future<bool> registerDevicePushToken(String token) async {
    final tech = SessionManager.getCurrentTechnician();
    if (tech == null) return false;

    await SessionManager.savePushToken(token);

    final res = await ApiClient.post('/technicians/${tech.id}/push-token', {
      'token': token,
      'platform': Platform.isAndroid ? 'android' : 'ios',
    });

    return res.success;
  }

  /// Called when the application resumes from the background or locked screen.
  /// Instantly verifies connection and recovers if the background socket was frozen.
  void onAppResumed() {
    if (!_isConnected) {
      final tech = SessionManager.getCurrentTechnician();
      connect(technicianId: tech?.id);
    } else {
      _resetHeartbeatWatchdog();
    }
  }

  void _handleDisconnect() {
    _isConnected = false;
    _cleanup();
    if (_shouldReconnect) {
      _reconnectTimer?.cancel();
      _reconnectTimer = Timer(const Duration(seconds: 4), () {
        if (_shouldReconnect) {
          final tech = SessionManager.getCurrentTechnician();
          connect(technicianId: tech?.id);
        }
      });
    }
  }

  void _cleanup() {
    _heartbeatWatchdog?.cancel();
    _heartbeatWatchdog = null;
    _subscription?.cancel();
    _subscription = null;
    _request = null;
    _client?.close(force: true);
    _client = null;
  }

  void disconnect() {
    _shouldReconnect = false;
    _isConnected = false;
    _reconnectTimer?.cancel();
    _reconnectTimer = null;
    _cleanup();
  }
}
