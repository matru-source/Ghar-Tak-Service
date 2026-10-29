import '../core/api_client.dart';
import '../core/session_manager.dart';
import '../models/wallet_model.dart';

class WalletService {
  static Future<WalletModel> getWalletData() async {
    final tech = SessionManager.getCurrentTechnician();
    final techId = tech?.id ?? 'tech_rajesh_01';

    final res = await ApiClient.get('/finance/wallets/$techId');
    if (res.success && res.data != null) {
      return WalletModel.fromJson(res.data);
    }

    return WalletModel(
      balance: tech?.walletBalance ?? 1033.0,
      todayEarnings: 1033.0,
      totalLifetimeEarnings: 48600.0,
      recentTransactions: [
        WalletTransaction(
          id: 'tx_01',
          type: 'CREDIT',
          amount: 1033.0,
          description: '70% Commission Payout for Work Order',
          timestamp: 'Today',
          status: 'SETTLED',
        ),
      ],
    );
  }

  static Future<ApiResponse<dynamic>> requestUpiWithdrawal({
    required double amount,
    required String upiId,
  }) async {
    final tech = SessionManager.getCurrentTechnician();
    return await ApiClient.post('/finance/withdrawals', {
      'technicianId': tech?.id ?? 'tech_rajesh_01',
      'amountInr': amount,
      'payoutMethod': 'UPI',
      'upiId': upiId,
    });
  }
}
