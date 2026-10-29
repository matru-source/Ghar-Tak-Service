import 'package:flutter/material.dart';
import '../../core/session_manager.dart';
import '../../core/theme.dart';
import '../../models/wallet_model.dart';
import '../../services/wallet_service.dart';

class TechEarningsView extends StatefulWidget {
  const TechEarningsView({super.key});

  @override
  State<TechEarningsView> createState() => _TechEarningsViewState();
}

class _TechEarningsViewState extends State<TechEarningsView> {
  WalletModel? _wallet;
  bool _isLoading = true;
  String _selectedPeriod = 'Today'; // 'Today', 'This Week', 'This Month'

  @override
  void initState() {
    super.initState();
    _loadWallet();
  }

  Future<void> _loadWallet() async {
    setState(() => _isLoading = true);
    final data = await WalletService.getWalletData();
    if (mounted) {
      setState(() {
        _wallet = data;
        _isLoading = false;
      });
    }
  }

  void _showWithdrawDialog() {
    final upiController = TextEditingController(text: 'rajesh@okaxis');
    final amountController = TextEditingController(text: '${_wallet?.balance.toStringAsFixed(0) ?? "1033"}');
    bool isSubmitting = false;

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setModalState) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: Row(
            children: const [
              Icon(Icons.account_balance_rounded, color: TechTheme.flameOrange, size: 24),
              SizedBox(width: 8),
              Text('Instant UPI Payout', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Funds are directly disbursed via IMPS / UPI rail to your verified bank account.',
                style: TextStyle(fontSize: 12, color: TechTheme.slateMuted),
              ),
              const SizedBox(height: 14),
              TextField(
                controller: amountController,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  labelText: 'Withdrawal Amount (₹)',
                  prefixIcon: Icon(Icons.currency_rupee_rounded, size: 20),
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: upiController,
                decoration: const InputDecoration(
                  labelText: 'Beneficiary UPI VPA',
                  hintText: 'mobile@upi or name@okaxis',
                  prefixIcon: Icon(Icons.qr_code_rounded, size: 20),
                  border: OutlineInputBorder(),
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: TechTheme.flameOrange,
                foregroundColor: Colors.white,
              ),
              onPressed: isSubmitting
                  ? null
                  : () async {
                      final amt = double.tryParse(amountController.text.trim()) ?? 0.0;
                      final upi = upiController.text.trim();
                      if (amt <= 0 || !upi.contains('@')) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Please enter a valid amount and UPI VPA')),
                        );
                        return;
                      }

                      setModalState(() => isSubmitting = true);
                      final res = await WalletService.requestUpiWithdrawal(amount: amt, upiId: upi);
                      setModalState(() => isSubmitting = false);
                      Navigator.pop(ctx);

                      if (res.success) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text('✓ Payout of ₹${amt.toStringAsFixed(0)} initiated to $upi!'),
                            backgroundColor: TechTheme.signalOnlineEmerald,
                          ),
                        );
                        _loadWallet();
                      } else {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text(res.message ?? 'Payout processing. Please check statement.')),
                        );
                      }
                    },
              child: isSubmitting
                  ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : const Text('Withdraw Now'),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator(color: TechTheme.flameOrange));
    }

    final balance = _wallet?.balance ?? 1033.0;
    final today = _wallet?.todayEarnings ?? 1033.0;
    final lifetime = _wallet?.totalLifetimeEarnings ?? 48600.0;
    final transactions = _wallet?.recentTransactions ?? [];

    return RefreshIndicator(
      onRefresh: _loadWallet,
      color: TechTheme.flameOrange,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ==========================================
            // 1. TOTAL BALANCE CARD
            // ==========================================
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [TechTheme.flameOrange, TechTheme.flameOrangeDark],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(22),
                boxShadow: [
                  BoxShadow(color: TechTheme.flameOrange.withOpacity(0.3), blurRadius: 14, offset: const Offset(0, 6)),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('AVAILABLE PAYOUT BALANCE', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: Colors.white70, letterSpacing: 1)),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(color: Colors.white.withOpacity(0.2), borderRadius: BorderRadius.circular(8)),
                        child: const Text('Direct Settlement', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.white)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text('₹${balance.toStringAsFixed(2)}', style: const TextStyle(fontSize: 32, fontWeight: FontWeight.w900, color: Colors.white)),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: ElevatedButton.icon(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.white,
                            foregroundColor: TechTheme.flameOrange,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            padding: const EdgeInsets.symmetric(vertical: 12),
                          ),
                          onPressed: _showWithdrawDialog,
                          icon: const Icon(Icons.account_balance_rounded, size: 18),
                          label: const Text('INSTANT WITHDRAW', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 18),

            // ==========================================
            // 2. TIMEFRAME FILTER CHIPS
            // ==========================================
            Row(
              children: ['Today', 'This Week', 'This Month'].map((p) {
                final isSel = _selectedPeriod == p;
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: ChoiceChip(
                    label: Text(p),
                    selected: isSel,
                    onSelected: (_) => setState(() => _selectedPeriod = p),
                    selectedColor: TechTheme.flameOrange,
                    labelStyle: TextStyle(color: isSel ? Colors.white : TechTheme.slateDark, fontWeight: FontWeight.bold, fontSize: 12),
                    backgroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20), side: const BorderSide(color: TechTheme.slateBorder)),
                  ),
                );
              }).toList(),
            ),

            const SizedBox(height: 16),

            // ==========================================
            // 3. STATUTORY COMMISSION BREAKDOWN
            // ==========================================
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: TechTheme.slateBorder),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('FEE STRUCTURE & BREAKDOWN', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: TechTheme.slateMuted, letterSpacing: 0.5)),
                  const SizedBox(height: 12),
                  _buildStatRow('Gross Doorstep Billings', '₹${(balance / 0.70).toStringAsFixed(0)}'),
                  const SizedBox(height: 8),
                  _buildStatRow('Statutory 18% GST (CGST 9% + SGST 9%)', 'Included'),
                  const SizedBox(height: 8),
                  _buildStatRow('GTS Platform Fee (30%)', '-₹${((balance / 0.70) * 0.30).toStringAsFixed(0)}'),
                  const Divider(height: 20),
                  _buildStatRow('Technician Take-Home (70%)', '₹${balance.toStringAsFixed(0)}', isBold: true, color: TechTheme.signalOnlineEmerald),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // ==========================================
            // 4. TRANSACTION AUDIT LEDGER
            // ==========================================
            const Text('TRANSACTION AUDIT LOG', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: TechTheme.slateDark, letterSpacing: 0.5)),
            const SizedBox(height: 10),

            if (transactions.isEmpty)
              Container(
                padding: const EdgeInsets.all(24),
                alignment: Alignment.center,
                decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: TechTheme.slateBorder)),
                child: const Text('No transactions recorded yet', style: TextStyle(fontSize: 12, color: TechTheme.slateMuted)),
              )
            else
              ...transactions.map((tx) => Card(
                    margin: const EdgeInsets.only(bottom: 10),
                    elevation: 0,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14), side: const BorderSide(color: TechTheme.slateBorder)),
                    child: ListTile(
                      leading: CircleAvatar(
                        backgroundColor: tx.type == 'CREDIT' ? TechTheme.signalOnlineBg : TechTheme.signalCrimsonBg,
                        child: Icon(
                          tx.type == 'CREDIT' ? Icons.arrow_downward_rounded : Icons.arrow_upward_rounded,
                          color: tx.type == 'CREDIT' ? TechTheme.signalOnlineEmerald : TechTheme.signalCrimson,
                          size: 18,
                        ),
                      ),
                      title: Text(tx.description, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                      subtitle: Text('${tx.timestamp} • ${tx.status}', style: const TextStyle(fontSize: 11, color: TechTheme.slateMuted)),
                      trailing: Text(
                        '${tx.type == 'CREDIT' ? "+" : "-"}₹${tx.amount.toStringAsFixed(0)}',
                        style: TextStyle(
                          fontWeight: FontWeight.w900,
                          fontSize: 14,
                          color: tx.type == 'CREDIT' ? TechTheme.signalOnlineEmerald : TechTheme.signalCrimson,
                        ),
                      ),
                    ),
                  )),

            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _buildStatRow(String label, String value, {bool isBold = false, Color? color}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: TextStyle(fontSize: 12, color: isBold ? TechTheme.slateDark : TechTheme.slateMuted, fontWeight: isBold ? FontWeight.bold : FontWeight.normal)),
        Text(value, style: TextStyle(fontSize: 12, fontWeight: isBold ? FontWeight.w900 : FontWeight.bold, color: color ?? TechTheme.slateDark)),
      ],
    );
  }
}
