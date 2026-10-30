import '../core/api_client.dart';
import '../models/service_model.dart';
import '../models/quote_model.dart';

class ServiceCatalogService {
  static Future<List<ServiceModel>> getServices({String? pincode}) async {
    final endpoint = (pincode != null && pincode.trim().length == 6)
        ? '/services?pincode=${pincode.trim()}'
        : '/services';
    final res = await ApiClient.get(endpoint);
    if (res.success && res.data != null) {
      final list = res.data['services'] ?? res.data;
      if (list is List) {
        return list.map((item) => ServiceModel.fromJson(item)).toList();
      }
    }
    // High-fidelity fallback catalog
    return [
      ServiceModel(
        id: 'SRV-MCB-02',
        code: 'SRV-MCB-02',
        title: 'Circuit Breaker Tripping & Short-Circuit Diagnostic',
        categoryId: 'cat_electrician',
        basePriceInr: 499.0,
        imageAsset: 'assets/images/service_switchboard.png',
        description: 'Comprehensive high-voltage diagnostic, distribution board testing, and MCB isolation.',
        isEmergencySosEligible: true,
      ),
      ServiceModel(
        id: 'SRV-FAN-01',
        code: 'SRV-FAN-01',
        title: 'Ceiling Fan Installation & Speed Regulator Repair',
        categoryId: 'cat_electrician',
        basePriceInr: 299.0,
        imageAsset: 'assets/images/service_fan.png',
        description: 'Precision balanced installation, capacitor replacement, and safety downrod locking.',
      ),
      ServiceModel(
        id: 'SRV-WIRING-03',
        code: 'SRV-WIRING-03',
        title: 'Concealed Wiring & Earth Leakage Diagnostic',
        categoryId: 'cat_electrician',
        basePriceInr: 799.0,
        imageAsset: 'assets/images/service_wiring.png',
        description: 'Insulation resistance megger test, phase load balancing, and neutral wire diagnosis.',
        isEmergencySosEligible: true,
      ),
      ServiceModel(
        id: 'SRV-GEYSER-01',
        code: 'SRV-GEYSER-01',
        title: 'Instant Water Geyser Heating Element Replacement',
        categoryId: 'cat_electrician',
        basePriceInr: 599.0,
        imageAsset: 'assets/images/service_geyser.png',
        description: 'Thermostat calibration, copper heating coil check, and anti-scald testing.',
      ),
      ServiceModel(
        id: 'SRV-LIGHT-01',
        code: 'SRV-LIGHT-01',
        title: 'Architectural LED Panel & Chandelier Installation',
        categoryId: 'cat_electrician',
        basePriceInr: 399.0,
        imageAsset: 'assets/images/service_light.png',
        description: 'False ceiling fitting, driver transformer testing, and dimmable circuit setup.',
      ),
    ];
  }

  static Future<QuoteModel?> calculateQuote({
    required String serviceCode,
    required String pincode,
  }) async {
    final res = await ApiClient.post('/services/calculate-quote', {
      'serviceCode': serviceCode,
      'pincode': pincode,
    });
    if (res.success && res.data != null) {
      return QuoteModel.fromJson(res.data);
    }
    // Deterministic 18% GST fallback
    return QuoteModel(
      baseLaborInr: 499.0,
      cgstAmountInr: 44.91,
      sgstAmountInr: 44.91,
      totalGstAmountInr: 89.82,
      totalPayableInr: 588.82,
      serviceCode: serviceCode,
      serviceTitle: 'Electrical Diagnostic & Repair',
      pincode: pincode,
    );
  }

  static Future<bool> checkServiceable(String pincode) async {
    final res = await ApiClient.get('/pincodes/check-serviceable?pincode=$pincode');
    return res.success;
  }
}

