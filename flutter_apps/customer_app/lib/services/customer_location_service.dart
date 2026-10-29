import 'package:flutter/services.dart';
import '../core/api_client.dart';
import '../utils/indian_pincode_resolver.dart';

class GeocodedAddress {
  final double latitude;
  final double longitude;
  final String formattedAddress;
  final String street;
  final String area;
  final String pincode;
  final String state;
  final bool isLiveGps;

  GeocodedAddress({
    required this.latitude,
    required this.longitude,
    required this.formattedAddress,
    required this.street,
    required this.area,
    required this.pincode,
    required this.state,
    required this.isLiveGps,
  });
}

class CustomerLocationService {
  static const MethodChannel _channel = MethodChannel('com.ghartak.customer/hardware');

  static Future<GeocodedAddress> detectCurrentGpsAddress() async {
    double lat = 18.9220;
    double lng = 72.8347;
    bool isLive = false;

    // 1. Fetch hardware GPS coordinates from native Android LocationManager
    try {
      final loc = await _channel.invokeMethod('getLocation');
      if (loc is Map) {
        lat = (loc['latitude'] as num?)?.toDouble() ?? 18.9220;
        lng = (loc['longitude'] as num?)?.toDouble() ?? 72.8347;
        isLive = loc['isMock'] != true;
      }
    } catch (_) {}

    // 2. Query backend reverse geocoder
    try {
      final res = await ApiClient.post('/integrations/maps/reverse-geocode', {
        'latitude': lat,
        'longitude': lng,
      });

      if (res.success && res.data != null && res.data is Map) {
        final d = res.data as Map<String, dynamic>;
        final pin = d['pincode']?.toString() ?? '400001';
        return GeocodedAddress(
          latitude: lat,
          longitude: lng,
          formattedAddress: d['formattedAddress']?.toString() ?? 'Doorstep Location',
          street: d['street']?.toString() ?? d['formattedAddress']?.toString() ?? 'Main Road',
          area: d['area']?.toString() ?? 'Colaba Hub',
          pincode: pin,
          state: d['state']?.toString() ?? 'Maharashtra',
          isLiveGps: isLive,
        );
      }
    } catch (_) {}

    // 3. Fallback to local Indian Pincode Resolver
    final fallbackPin = '400001';
    final details = IndianPincodeResolver.resolvePincode(fallbackPin);
    return GeocodedAddress(
      latitude: lat,
      longitude: lng,
      formattedAddress: '${details.areaName}, ${details.state} - $fallbackPin',
      street: 'Colaba Causeway',
      area: details.areaName,
      pincode: fallbackPin,
      state: details.state,
      isLiveGps: isLive,
    );
  }
}

