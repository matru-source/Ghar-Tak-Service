import 'dart:math';

class PincodeDetails {
  final String pincode;
  final String state;
  final String district;
  final String hubName;
  final String gstinStateCode;
  final String stateCode;
  final bool isServiceable;
  final int etaMinutes;
  final double latitude;
  final double longitude;
  final String areaName;

  const PincodeDetails({
    required this.pincode,
    required this.state,
    required this.district,
    required this.hubName,
    required this.gstinStateCode,
    this.stateCode = 'MH',
    this.isServiceable = true,
    this.etaMinutes = 15,
    this.latitude = 18.9220,
    this.longitude = 72.8347,
    this.areaName = 'Doorstep Service Hub',
  });
}

class KnownHubLocation {
  final String pincode;
  final String areaName;
  final String city;
  final String state;
  final double lat;
  final double lng;

  const KnownHubLocation({
    required this.pincode,
    required this.areaName,
    required this.city,
    required this.state,
    required this.lat,
    required this.lng,
  });
}

class IndianPincodeResolver {
  static const List<KnownHubLocation> knownHubs = [
    // Maharashtra & Goa
    KnownHubLocation(pincode: '400001', areaName: 'Fort / Marine Drive', city: 'Mumbai', state: 'Maharashtra', lat: 18.9220, lng: 72.8347),
    KnownHubLocation(pincode: '400005', areaName: 'Colaba Causeway / Cuffe Parade', city: 'Mumbai', state: 'Maharashtra', lat: 18.9067, lng: 72.8147),
    KnownHubLocation(pincode: '400020', areaName: 'Churchgate / Nariman Point', city: 'Mumbai', state: 'Maharashtra', lat: 18.9322, lng: 72.8264),
    KnownHubLocation(pincode: '400050', areaName: 'Bandra West / Linking Rd', city: 'Mumbai', state: 'Maharashtra', lat: 19.0596, lng: 72.8295),
    KnownHubLocation(pincode: '400053', areaName: 'Andheri West / Lokhandwala', city: 'Mumbai', state: 'Maharashtra', lat: 19.1363, lng: 72.8277),
    KnownHubLocation(pincode: '400092', areaName: 'Borivali West', city: 'Mumbai', state: 'Maharashtra', lat: 19.2307, lng: 72.8567),
    KnownHubLocation(pincode: '400601', areaName: 'Naupada / Station', city: 'Thane', state: 'Maharashtra', lat: 19.2183, lng: 72.9781),
    KnownHubLocation(pincode: '400703', areaName: 'Vashi Sector 17', city: 'Navi Mumbai', state: 'Maharashtra', lat: 19.0771, lng: 72.9986),
    KnownHubLocation(pincode: '411001', areaName: 'Camp / Station', city: 'Pune', state: 'Maharashtra', lat: 18.5204, lng: 73.8567),
    KnownHubLocation(pincode: '411057', areaName: 'Hinjewadi IT Park', city: 'Pune', state: 'Maharashtra', lat: 18.5913, lng: 73.7389),
    KnownHubLocation(pincode: '440001', areaName: 'Sitabuldi / Civil Lines', city: 'Nagpur', state: 'Maharashtra', lat: 21.1458, lng: 79.0882),
    KnownHubLocation(pincode: '422001', areaName: 'College Road / Nashik City', city: 'Nashik', state: 'Maharashtra', lat: 19.9975, lng: 73.7898),
    KnownHubLocation(pincode: '403001', areaName: 'Miramar / Panaji', city: 'Panaji', state: 'Goa', lat: 15.4909, lng: 73.8278),

    // Odisha
    KnownHubLocation(pincode: '759001', areaName: 'Dhenkanal Town / Kunjakanta', city: 'Dhenkanal', state: 'Odisha', lat: 20.6600, lng: 85.5900),
    KnownHubLocation(pincode: '751001', areaName: 'Master Canteen / Saheed Nagar', city: 'Bhubaneswar', state: 'Odisha', lat: 20.2961, lng: 85.8245),
    KnownHubLocation(pincode: '751024', areaName: 'Patia / Infocity', city: 'Bhubaneswar', state: 'Odisha', lat: 20.3533, lng: 85.8189),
    KnownHubLocation(pincode: '753001', areaName: 'Badambadi / CDA', city: 'Cuttack', state: 'Odisha', lat: 20.4625, lng: 85.8830),
    KnownHubLocation(pincode: '769001', areaName: 'Civil Township / Panposh', city: 'Rourkela', state: 'Odisha', lat: 22.2604, lng: 84.8536),
    KnownHubLocation(pincode: '752001', areaName: 'Grand Road / Temple', city: 'Puri', state: 'Odisha', lat: 19.8135, lng: 85.8312),
    KnownHubLocation(pincode: '760001', areaName: 'Giri Road / City Center', city: 'Berhampur', state: 'Odisha', lat: 19.3150, lng: 84.7941),

    // Delhi NCR & North
    KnownHubLocation(pincode: '110001', areaName: 'Connaught Place / Barakhamba', city: 'New Delhi', state: 'Delhi', lat: 28.6315, lng: 77.2167),
    KnownHubLocation(pincode: '110016', areaName: 'Hauz Khas / Green Park', city: 'New Delhi', state: 'Delhi', lat: 28.5494, lng: 77.2001),
    KnownHubLocation(pincode: '122001', areaName: 'Cyber City / DLF', city: 'Gurugram', state: 'Haryana', lat: 28.4595, lng: 77.0266),
    KnownHubLocation(pincode: '201301', areaName: 'Sector 18 / Atta Market', city: 'Noida', state: 'Uttar Pradesh', lat: 28.5708, lng: 77.3271),
    KnownHubLocation(pincode: '560001', areaName: 'MG Road / Brigade Rd', city: 'Bengaluru', state: 'Karnataka', lat: 12.9756, lng: 77.6066),
    KnownHubLocation(pincode: '560034', areaName: 'Koramangala 4th Block', city: 'Bengaluru', state: 'Karnataka', lat: 12.9352, lng: 77.6245),
    KnownHubLocation(pincode: '500001', areaName: 'Abids / Koti', city: 'Hyderabad', state: 'Telangana', lat: 17.3850, lng: 78.4867),
    KnownHubLocation(pincode: '600001', areaName: 'George Town / Parrys', city: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lng: 80.2707),
    KnownHubLocation(pincode: '700001', areaName: 'BBD Bagh / Park St', city: 'Kolkata', state: 'West Bengal', lat: 22.5726, lng: 88.3639),
  ];

  static PincodeDetails resolvePincode(String rawPincode) {
    final cleanPin = rawPincode.replaceAll(RegExp(r'[^0-9]'), '').padRight(6, '0').substring(0, 6);

    for (final hub in knownHubs) {
      if (hub.pincode == cleanPin) {
        return PincodeDetails(
          pincode: cleanPin,
          state: hub.state,
          district: hub.city,
          hubName: '${hub.city} Regional Hub',
          gstinStateCode: getGstCode(hub.state),
          stateCode: getStateShortCode(hub.state),
          isServiceable: true,
          etaMinutes: 15,
          latitude: hub.lat,
          longitude: hub.lng,
          areaName: '${hub.areaName}, ${hub.city}',
        );
      }
    }

    final prefix2 = int.tryParse(cleanPin.substring(0, 2)) ?? 40;
    final (state, code) = _getStateAndCodeForPrefix(prefix2);
    final (lat, lng) = getCoordinatesForPincode(cleanPin);
    final area = getAreaForPincode(cleanPin);

    return PincodeDetails(
      pincode: cleanPin,
      state: state,
      district: state,
      hubName: '$code $state Regional Hub',
      gstinStateCode: getGstCode(state),
      stateCode: code.split('-').first,
      isServiceable: true,
      etaMinutes: 15,
      latitude: lat,
      longitude: lng,
      areaName: area,
    );
  }

  static String getAreaForPincode(String pincode) {
    final cleanPin = pincode.replaceAll(RegExp(r'[^0-9]'), '').padRight(6, '0').substring(0, 6);
    for (final hub in knownHubs) {
      if (hub.pincode == cleanPin) {
        return '${hub.areaName}, ${hub.city}';
      }
    }

    final prefix2 = int.tryParse(cleanPin.substring(0, 2)) ?? 40;
    switch (prefix2) {
      case 11:
        return 'Central Delhi Hub';
      case 12:
      case 13:
        return 'Haryana Urban Hub';
      case 40:
      case 41:
      case 42:
      case 43:
      case 44:
        return 'Maharashtra Hub';
      case 75:
      case 76:
      case 77:
        return 'Odisha Doorstep Hub';
      case 56:
      case 57:
      case 58:
      case 59:
        return 'Karnataka Tech Hub';
      default:
        return 'Metro Service Hub ($cleanPin)';
    }
  }

  static (double, double) getCoordinatesForPincode(String pincode) {
    final cleanPin = pincode.replaceAll(RegExp(r'[^0-9]'), '').padRight(6, '0').substring(0, 6);
    for (final hub in knownHubs) {
      if (hub.pincode == cleanPin) {
        return (hub.lat, hub.lng);
      }
    }

    final prefix2 = int.tryParse(cleanPin.substring(0, 2)) ?? 40;
    switch (prefix2) {
      case 11:
        return (28.6139, 77.2090); // Delhi
      case 40:
      case 41:
      case 42:
      case 43:
      case 44:
        return (18.9220, 72.8347); // Mumbai
      case 75:
      case 76:
      case 77:
        return (20.2961, 85.8245); // Bhubaneswar
      case 56:
      case 57:
      case 58:
      case 59:
        return (12.9716, 77.5946); // Bengaluru
      default:
        return (18.9220, 72.8347);
    }
  }

  static double calculateDistanceKm(double lat1, double lon1, double lat2, double lon2) {
    if (lat1 == 0.0 || lon1 == 0.0 || lat2 == 0.0 || lon2 == 0.0) return 1.2;
    const r = 6371.0;
    final dLat = (lat2 - lat1) * (pi / 180.0);
    final dLon = (lon2 - lon1) * (pi / 180.0);
    final a = sin(dLat / 2) * sin(dLat / 2) +
        cos(lat1 * (pi / 180.0)) * cos(lat2 * (pi / 180.0)) * sin(dLon / 2) * sin(dLon / 2);
    final c = 2 * atan2(sqrt(a), sqrt(1 - a));
    return r * c;
  }

  static int calculateEtaMinutes(double distanceKm) {
    if (distanceKm <= 0.05) return 0;
    return max(1, ((distanceKm / 22.0) * 60).round());
  }

  static (String, String) _getStateAndCodeForPrefix(int prefix2) {
    if (prefix2 == 11) return ('Delhi', 'DL-01');
    if (prefix2 == 12 || prefix2 == 13) return ('Haryana', 'HR-01');
    if (prefix2 >= 20 && prefix2 <= 28) return ('Uttar Pradesh', 'UP-01');
    if (prefix2 >= 40 && prefix2 <= 44) return ('Maharashtra', 'MH-01');
    if (prefix2 >= 50 && prefix2 <= 53) return ('Telangana', 'TS-01');
    if (prefix2 >= 56 && prefix2 <= 59) return ('Karnataka', 'KA-01');
    if (prefix2 >= 60 && prefix2 <= 64) return ('Tamil Nadu', 'TN-01');
    if (prefix2 >= 70 && prefix2 <= 74) return ('West Bengal', 'WB-01');
    if (prefix2 >= 75 && prefix2 <= 77) return ('Odisha', 'OD-01');
    return ('National Hub', 'IN-01');
  }

  static String getGstCode(String state) {
    if (state.toLowerCase().contains('maharashtra')) return '27AAACG1234F1Z5 (27-MH)';
    if (state.toLowerCase().contains('odisha')) return '21AAACG1234F1Z5 (21-OD)';
    if (state.toLowerCase().contains('delhi')) return '07AAACG1234F1Z5 (07-DL)';
    if (state.toLowerCase().contains('karnataka')) return '29AAACG1234F1Z5 (29-KA)';
    if (state.toLowerCase().contains('tamil')) return '33AAACG1234F1Z5 (33-TN)';
    if (state.toLowerCase().contains('bengal')) return '19AAACG1234F1Z5 (19-WB)';
    return '27AAACG1234F1Z5';
  }

  static String getStateShortCode(String state) {
    if (state.toLowerCase().contains('maharashtra')) return 'MH';
    if (state.toLowerCase().contains('odisha')) return 'OD';
    if (state.toLowerCase().contains('delhi')) return 'DL';
    if (state.toLowerCase().contains('karnataka')) return 'KA';
    if (state.toLowerCase().contains('tamil')) return 'TN';
    if (state.toLowerCase().contains('bengal')) return 'WB';
    return 'MH';
  }
}
