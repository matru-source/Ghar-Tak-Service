class WalletTransaction {
  final String id;
  final String type; // CREDIT or WITHDRAWAL
  final double amount;
  final String description;
  final String timestamp;
  final String status;

  WalletTransaction({
    required this.id,
    required this.type,
    required this.amount,
    required this.description,
    required this.timestamp,
    required this.status,
  });

  factory WalletTransaction.fromJson(Map<String, dynamic> json) {
    return WalletTransaction(
      id: json['id']?.toString() ?? '',
      type: json['type']?.toString() ?? 'CREDIT',
      amount: (json['amount'] is num) ? (json['amount'] as num).toDouble() : 1033.0,
      description: json['description']?.toString() ?? '70% Commission Payout',
      timestamp: json['createdAt']?.toString() ?? DateTime.now().toIso8601String(),
      status: json['status']?.toString() ?? 'SETTLED',
    );
  }
}

class WalletModel {
  final double balance;
  final double todayEarnings;
  final double totalLifetimeEarnings;
  final List<WalletTransaction> recentTransactions;

  WalletModel({
    required this.balance,
    required this.todayEarnings,
    required this.totalLifetimeEarnings,
    required this.recentTransactions,
  });

  factory WalletModel.fromJson(Map<String, dynamic> json) {
    final bal = (json['balance'] is num)
        ? (json['balance'] as num).toDouble()
        : double.tryParse(json['balance']?.toString() ?? '1033') ?? 1033.0;

    final today = (json['todayEarnings'] is num)
        ? (json['todayEarnings'] as num).toDouble()
        : 1033.0;

    final lifetime = (json['totalLifetimeEarnings'] is num)
        ? (json['totalLifetimeEarnings'] as num).toDouble()
        : 48600.0;

    List<WalletTransaction> txs = [];
    if (json['transactions'] is List) {
      txs = (json['transactions'] as List)
          .map((e) => WalletTransaction.fromJson(e as Map<String, dynamic>))
          .toList();
    } else {
      txs = [
        WalletTransaction(
          id: 'tx_01',
          type: 'CREDIT',
          amount: 1033.0,
          description: '70% Payout for Job #J-1001',
          timestamp: 'Just now',
          status: 'SETTLED',
        ),
        WalletTransaction(
          id: 'tx_02',
          type: 'WITHDRAWAL',
          amount: 2500.0,
          description: 'Instant UPI to rajesh@okhdfcbank',
          timestamp: 'Yesterday',
          status: 'COMPLETED',
        ),
      ];
    }

    return WalletModel(
      balance: bal,
      todayEarnings: today,
      totalLifetimeEarnings: lifetime,
      recentTransactions: txs,
    );
  }
}
