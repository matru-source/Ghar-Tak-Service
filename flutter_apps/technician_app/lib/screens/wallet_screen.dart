import 'package:flutter/material.dart';
import '../core/theme.dart';
import '../models/wallet_model.dart';
import '../services/wallet_service.dart';

class WalletScreen extends StatefulWidget {
  const WalletScreen({super.key});

  @override
  State<WalletScreen> createState() => _WalletScreenState();
}

class _WalletScreenState extends State<WalletScreen> {
  WalletModel? _wallet;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadWallet();
  }

  Future<void> _loadWallet() async {
    setState(() => _isLoading = true);
    final wallet = await WalletService.getWalletData();
    setState(() {
      _wallet = wallet;
      _isLoading = false;
    });
  }

  void _showWithdrawalModal() {
    final upiController = TextEditingController(text: 'rajesh.kumar@okhdfcbank');
    final amountController = TextEditingController(text: (_wallet?.balance ?? 1033.0).toStringAsFixed(0));
    bool isRequesting = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      builder: (ctx) => StatefulBuilder(
        builder: (context, setModalState) {
          return Padding(
            padding: EdgeInsets.only(
              left: 24,
              right: 24,
              top: 24,
              bottom: MediaQuery.of(context).viewInsets.bottom + 24,
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Instant UPI Withdrawal',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: TechTheme.slateDark),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close_rounded),
                      onPressed: () => Navigator.pop(ctx),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                const Text(
                  'Transfers are processed in 60 seconds directly to your VPA via RazorpayX IMPS payout rail.',
                  style: TextStyle(fontSize: 12, color: TechTheme.slateMuted, height: 1.3),
                ),
                const SizedBox(height: 20),

                // Amount
                const Text('WITHDRAWAL AMOUNT (INR)', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: TechTheme.slateMuted)),
                const SizedBox(height: 6),
                TextField(
                  controller: amountController,
                  keyboardType: TextInputType.number,
                  style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: TechTheme.slateDark),
                  decoration: InputDecoration(
                    prefixText: '₹ ',
                    prefixStyle: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: TechTheme.slateDark),
                    filled: true,
                    fillColor: TechTheme.slateLight,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: TechTheme.slateBorder)),
                  ),
                ),
                const SizedBox(height: 16),

                // UPI ID
                const Text('DESTINATION UPI VPA', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: TechTheme.slateMuted)),
                const SizedBox(height: 6),
                TextField(
                  controller: upiController,
                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: TechTheme.slateDark),
                  decoration: InputDecoration(
                    hintText: 'yourname@upi',
                    filled: true,
                    fillColor: TechTheme.slateLight,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: TechTheme.slateBorder)),
                  ),
                ),
                const SizedBox(height: 24),

                ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: TechTheme.signalOnlineEmerald,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    minimumSize: const Size.fromHeight(52),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                  onPressed: isRequesting
                      ? null
                      : () async {
                          final amount = double.tryParse(amountController.text.trim()) ?? 0;
                          final upi = upiController.text.trim();
                          if (amount <= 0 || upi.isEmpty) return;

                          setModalState(() => isRequesting = true);
                          final res = await WalletService.requestUpiWithdrawal(amount: amount, upiId: upi);
                          setModalState(() => isRequesting = false);

                          if (mounted) {
                            Navigator.pop(ctx);
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text(res.success
                                    ? 'Withdrawal request of ₹${amount.toStringAsFixed(0)} routed to bank'
                                    : 'Withdrawal processing: pending partner settlement'),
                                backgroundColor: TechTheme.signalOnlineEmerald,
                              ),
                            );
                            _loadWallet();
                          }
                        },
                  child: isRequesting
                      ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                      : const Text('CONFIRM INSTANT PAYOUT', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 13)),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: TechTheme.slateLight,
      appBar: AppBar(
        title: const Text('Earnings & Commission Ledger'),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: TechTheme.primaryAmber))
          : RefreshIndicator(
              onRefresh: _loadWallet,
              color: TechTheme.primaryAmber,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Balance Showcase Card
                    Container(
                      padding: const EdgeInsets.all(24),
                      width: double.infinity,
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [Color(0xFF0F172A), Color(0xFF1E293B)],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(24),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.12),
                            blurRadius: 16,
                            offset: const Offset(0, 6),
                          ),
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text(
                                'TOTAL AVAILABLE FOR PAYOUT',
                                style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: Colors.white60, letterSpacing: 1.0),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                decoration: BoxDecoration(
                                  color: TechTheme.signalOnlineEmerald,
                                  borderRadius: BorderRadius.circular(20),
                                ),
                                child: const Text(
                                  '70% DIRECT SHARE',
                                  style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: Colors.white),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 10),
                          Text(
                            '₹${(_wallet?.balance ?? 1033.0).toStringAsFixed(2)}',
                            style: const TextStyle(fontSize: 36, fontWeight: FontWeight.w900, color: TechTheme.primaryAmber),
                          ),
                          const SizedBox(height: 6),
                          const Text(
                            'Calculated on statutory net revenue after 18% GST isolation.',
                            style: TextStyle(fontSize: 11, color: Colors.white60),
                          ),
                          const SizedBox(height: 20),
                          ElevatedButton.icon(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: TechTheme.signalOnlineEmerald,
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(vertical: 14),
                              minimumSize: const Size.fromHeight(48),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                            ),
                            icon: const Icon(Icons.flash_on_rounded, size: 20),
                            label: const Text('WITHDRAW VIA INSTANT UPI', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 13)),
                            onPressed: _showWithdrawalModal,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),

                    // Metrics Row
                    Row(
                      children: [
                        Expanded(
                          child: Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(18),
                              border: Border.all(color: TechTheme.slateBorder),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text('TODAY\'S REVENUE', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: TechTheme.slateMuted)),
                                const SizedBox(height: 6),
                                Text(
                                  '₹${(_wallet?.todayEarnings ?? 1033.0).toStringAsFixed(0)}',
                                  style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: TechTheme.slateDark),
                                ),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(18),
                              border: Border.all(color: TechTheme.slateBorder),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text('LIFETIME EARNED', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: TechTheme.slateMuted)),
                                const SizedBox(height: 6),
                                Text(
                                  '₹${(_wallet?.totalLifetimeEarnings ?? 48600.0).toStringAsFixed(0)}',
                                  style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: TechTheme.signalOnlineEmerald),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),

                    // Ledger Section
                    const Text(
                      'TRANSACTION LEDGER',
                      style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: TechTheme.slateMuted, letterSpacing: 1.0),
                    ),
                    const SizedBox(height: 12),

                    ...(_wallet?.recentTransactions ?? []).map((tx) {
                      final isCredit = tx.type == 'CREDIT';
                      return Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: TechTheme.slateBorder),
                        ),
                        child: Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(10),
                              decoration: BoxDecoration(
                                color: isCredit ? TechTheme.signalOnlineBg : TechTheme.signalCrimsonBg,
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Icon(
                                isCredit ? Icons.arrow_downward_rounded : Icons.arrow_upward_rounded,
                                color: isCredit ? TechTheme.signalOnlineEmerald : TechTheme.signalCrimson,
                                size: 18,
                              ),
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    tx.description,
                                    style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: TechTheme.slateDark),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    '${tx.timestamp} • Status: ${tx.status}',
                                    style: const TextStyle(fontSize: 11, color: TechTheme.slateMuted),
                                  ),
                                ],
                              ),
                            ),
                            Text(
                              '${isCredit ? "+" : "-"}₹${tx.amount.toStringAsFixed(0)}',
                              style: TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.w900,
                                color: isCredit ? TechTheme.signalOnlineEmerald : TechTheme.signalCrimson,
                              ),
                            ),
                          ],
                        ),
                      );
                    }),

                    const SizedBox(height: 30),
                  ],
                ),
              ),
            ),
    );
  }
}
