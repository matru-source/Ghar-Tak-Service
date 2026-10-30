import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'constants.dart';
import '../models/user_model.dart';
import '../models/past_order_model.dart';

class SessionManager {
  static SharedPreferences? _prefs;

  static const String _keyActiveJobId = 'key_active_job_id';
  static const String _keyActiveJobTitle = 'key_active_job_title';
  static const String _keyActiveJobTicketNo = 'key_active_job_ticket_no';
  static const String _keyActiveJobTechName = 'key_active_job_tech_name';
  static const String _keyActiveJobTechPhone = 'key_active_job_tech_phone';
  static const String _keyActiveJobTechBadge = 'key_active_job_tech_badge';
  static const String _keyActiveJobStatus = 'key_active_job_status';
  static const String _keyActiveJobOtp = 'key_active_job_otp';
  static const String _keyActiveJobEta = 'key_active_job_eta';
  static const String _keyActiveJobTotal = 'key_active_job_total';

  static const String _keyHasAmc = 'key_has_active_amc';
  static const String _keyAmcTier = 'key_amc_tier_name';
  static const String _keyAmcExpiry = 'key_amc_expiry_date';

  static const String _keyPastOrders = 'key_past_orders';
  static const String _keySecondaryAddress = 'key_secondary_address';
  static const String _keySecondaryLabel = 'key_secondary_label';

  static Future<void> init() async {
    _prefs ??= await SharedPreferences.getInstance();
  }

  static String getBaseUrl() {
    final custom = _prefs?.getString(AppConstants.keyCustomBaseUrl);
    if (custom != null && custom.isNotEmpty && !custom.contains('vercel.app')) {
      return custom;
    }
    return AppConstants.defaultBaseUrl;
  }

  static Future<void> setBaseUrl(String url) async {
    await _prefs?.setString(AppConstants.keyCustomBaseUrl, url);
  }

  static String? getAuthToken() {
    return _prefs?.getString(AppConstants.keyAuthToken);
  }

  static Future<void> saveAuthToken(String token) async {
    await _prefs?.setString(AppConstants.keyAuthToken, token);
  }

  static UserModel? getCurrentUser() {
    final str = _prefs?.getString(AppConstants.keyUserJson);
    if (str == null || str.isEmpty) return null;
    try {
      return UserModel.fromJson(jsonDecode(str));
    } catch (_) {
      return null;
    }
  }

  static Future<void> saveCurrentUser(UserModel user) async {
    await _prefs?.setString(AppConstants.keyUserJson, jsonEncode(user.toJson()));
  }

  static String getPincode() {
    return _prefs?.getString(AppConstants.keySelectedPincode) ?? AppConstants.defaultPincode;
  }

  static Future<void> savePincode(String pincode) async {
    await _prefs?.setString(AppConstants.keySelectedPincode, pincode);
  }

  static bool isLoggedIn() {
    final token = getAuthToken();
    return token != null && token.isNotEmpty;
  }

  // Active Job Management
  static bool hasActiveJob() {
    final id = _prefs?.getString(_keyActiveJobId);
    final status = _prefs?.getString(_keyActiveJobStatus) ?? '';
    return id != null && id.isNotEmpty && status != 'COMPLETED' && status != 'CANCELLED';
  }

  static String getActiveJobId() => _prefs?.getString(_keyActiveJobId) ?? '';
  static String getActiveJobTitle() => _prefs?.getString(_keyActiveJobTitle) ?? 'Electrical Doorstep Service';
  static String getActiveJobTicketNumber() => _prefs?.getString(_keyActiveJobTicketNo) ?? '#J-1001';
  static String getActiveJobTechName() => _prefs?.getString(_keyActiveJobTechName) ?? '';
  static String getActiveJobTechPhone() => _prefs?.getString(_keyActiveJobTechPhone) ?? '';
  static String getActiveJobTechBadge() => _prefs?.getString(_keyActiveJobTechBadge) ?? '';
  static String getActiveJobStatus() => _prefs?.getString(_keyActiveJobStatus) ?? 'PENDING_DISPATCH';
  static String getActiveJobOtp() => _prefs?.getString(_keyActiveJobOtp) ?? '4829';
  static String getActiveJobEta() => _prefs?.getString(_keyActiveJobEta) ?? 'Assigning...';
  static double getActiveJobTotal() => _prefs?.getDouble(_keyActiveJobTotal) ?? 299.0;

  static bool isJobAssigned() {
    final status = getActiveJobStatus().toUpperCase();
    final name = getActiveJobTechName();
    return status != 'PENDING_DISPATCH' &&
        status != 'PENDING' &&
        name.trim().isNotEmpty &&
        name != 'Searching Pro...' &&
        name != 'Searching Nearest Specialist...';
  }

  static Future<void> setActiveJob({
    required String jobId,
    required String title,
    required String ticketNumber,
    required String techName,
    required String techPhone,
    required String techBadge,
    required String status,
    String? otp,
    String eta = 'Assigning...',
    double total = 299.0,
  }) async {
    await _prefs?.setString(_keyActiveJobId, jobId);
    await _prefs?.setString(_keyActiveJobTitle, title);
    await _prefs?.setString(_keyActiveJobTicketNo, ticketNumber);
    await _prefs?.setString(_keyActiveJobTechName, techName);
    await _prefs?.setString(_keyActiveJobTechPhone, techPhone);
    await _prefs?.setString(_keyActiveJobTechBadge, techBadge);
    await _prefs?.setString(_keyActiveJobStatus, status);
    await _prefs?.setString(_keyActiveJobOtp, otp ?? '4829');
    await _prefs?.setString(_keyActiveJobEta, eta);
    await _prefs?.setDouble(_keyActiveJobTotal, total);
  }

  static Future<void> updateActiveJobTechnician({
    required String techName,
    required String techPhone,
    required String techBadge,
    String? status,
    String? eta,
  }) async {
    await _prefs?.setString(_keyActiveJobTechName, techName);
    await _prefs?.setString(_keyActiveJobTechPhone, techPhone);
    await _prefs?.setString(_keyActiveJobTechBadge, techBadge);
    if (status != null) await _prefs?.setString(_keyActiveJobStatus, status);
    if (eta != null) await _prefs?.setString(_keyActiveJobEta, eta);
  }

  static Future<void> updateActiveJobStatus(String status) async {
    await _prefs?.setString(_keyActiveJobStatus, status);
  }

  static Future<void> clearActiveJob() async {
    await _prefs?.remove(_keyActiveJobId);
    await _prefs?.remove(_keyActiveJobTitle);
    await _prefs?.remove(_keyActiveJobTicketNo);
    await _prefs?.remove(_keyActiveJobTechName);
    await _prefs?.remove(_keyActiveJobTechPhone);
    await _prefs?.remove(_keyActiveJobTechBadge);
    await _prefs?.remove(_keyActiveJobStatus);
    await _prefs?.remove(_keyActiveJobOtp);
    await _prefs?.remove(_keyActiveJobEta);
    await _prefs?.remove(_keyActiveJobTotal);
  }

  // AMC Subscription
  static bool hasActiveAmc() => _prefs?.getBool(_keyHasAmc) ?? true;
  static String getAmcTier() => _prefs?.getString(_keyAmcTier) ?? 'ZEX-SHIELD AMC PLATINUM';
  static String getAmcExpiry() => _prefs?.getString(_keyAmcExpiry) ?? '31 Dec 2026';

  static Future<void> setAmcSubscription(bool active, String tier, String expiry) async {
    await _prefs?.setBool(_keyHasAmc, active);
    await _prefs?.setString(_keyAmcTier, tier);
    await _prefs?.setString(_keyAmcExpiry, expiry);
  }

  // Past Orders
  static List<PastOrderItem> getPastOrders() {
    final str = _prefs?.getString(_keyPastOrders);
    if (str == null || str.isEmpty) {
      return [
        const PastOrderItem(
          ticketNumber: 'GTS-89421',
          invoiceNumber: 'INV-2026-89421',
          serviceTitle: 'Ceiling Fan Installation & Safety Clamp',
          dateText: '26 Oct, 2026',
          technicianName: 'Rajesh Kumar (GTS Certified)',
          amountInr: 352.82,
          taxableAmount: 299.0,
          cgstAmount: 26.91,
          sgstAmount: 26.91,
          status: 'COMPLETED',
        ),
        const PastOrderItem(
          ticketNumber: 'GTS-76192',
          invoiceNumber: 'INV-2026-76192',
          serviceTitle: 'MCB Tripping Diagnostic & Neutral Balancer',
          dateText: '18 Oct, 2026',
          technicianName: 'Amit Verma (1000V Certified)',
          amountInr: 588.82,
          taxableAmount: 499.0,
          cgstAmount: 44.91,
          sgstAmount: 44.91,
          status: 'COMPLETED',
        ),
      ];
    }
    try {
      final List list = jsonDecode(str);
      return list.map((item) => PastOrderItem.fromJson(item)).toList();
    } catch (_) {
      return [];
    }
  }

  static Future<void> addPastOrder(PastOrderItem order) async {
    final list = getPastOrders();
    list.insert(0, order);
    final encoded = jsonEncode(list.map((e) => e.toJson()).toList());
    await _prefs?.setString(_keyPastOrders, encoded);
  }

  // Saved Secondary Address
  static String? getSecondaryAddress() => _prefs?.getString(_keySecondaryAddress);
  static String? getSecondaryLabel() => _prefs?.getString(_keySecondaryLabel);

  static Future<void> saveSecondaryAddress(String label, String address) async {
    await _prefs?.setString(_keySecondaryLabel, label);
    await _prefs?.setString(_keySecondaryAddress, address);
  }

  static Future<void> logout() async {
    await _prefs?.remove(AppConstants.keyAuthToken);
    await _prefs?.remove(AppConstants.keyUserJson);
    await clearActiveJob();
  }

  // Compatibility aliases
  static Future<void> saveUser(UserModel user) => saveCurrentUser(user);
  static Future<void> saveToken(String token) => saveAuthToken(token);
  static Future<void> clearSession() => logout();
}
