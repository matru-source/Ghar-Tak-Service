import 'package:flutter/material.dart';
import '../core/theme.dart';
import '../models/tech_job_model.dart';
import '../services/tech_job_service.dart';
import '../services/upload_service.dart';
import '../widgets/safety_item_tile.dart';

class SafetyChecklistScreen extends StatefulWidget {
  final TechJobModel job;

  const SafetyChecklistScreen({
    super.key,
    required this.job,
  });

  @override
  State<SafetyChecklistScreen> createState() => _SafetyChecklistScreenState();
}

class _SafetyChecklistScreenState extends State<SafetyChecklistScreen> {
  final Set<int> _checkedIndices = {};
  bool _photoAttached = false;
  bool _isSubmitting = false;
  String? _errorMessage;

  late final _TradeSafetyConfig _config;

  @override
  void initState() {
    super.initState();
    _config = _resolveTradeConfig(widget.job.trade, widget.job.serviceTitle);
  }

  bool get _isAllChecked =>
      _checkedIndices.length == _config.checkpoints.length && _photoAttached;

  _TradeSafetyConfig _resolveTradeConfig(String trade, String serviceTitle) {
    final lowerTrade = trade.toLowerCase();
    final lowerTitle = serviceTitle.toLowerCase();

    if (lowerTrade.contains('plumb') || lowerTitle.contains('plumb') || lowerTitle.contains('pipe') || lowerTitle.contains('tap') || lowerTitle.contains('leak') || lowerTitle.contains('drain') || lowerTitle.contains('water')) {
      return const _TradeSafetyConfig(
        tradeCategory: 'PLUMBING',
        bannerTitle: 'WATER SUPPLY ISOLATION PROTOCOL',
        bannerSubtitle: 'Premise flooding mitigation. Shut off the main water stopcock and purge standing line pressure before servicing pipes or fixtures.',
        bannerIcon: Icons.water_damage_rounded,
        bannerBg: Color(0xFFE0F2FE),
        bannerBorder: Color(0xFF38BDF8),
        bannerIconColor: Color(0xFF0284C7),
        photoTitle: 'Stopcock & Catch Basin Evidence',
        photoSubtitle: 'Snap photo showing closed water valve and dry catch basin',
        checkpoints: [
          _SafetyCheckpoint(
            title: 'Main Stopcock Shut Off',
            description: 'Premise primary supply valve turned fully OFF to isolate mains water pressure.',
            standardCode: 'IS 2065:1983',
          ),
          _SafetyCheckpoint(
            title: 'Line Depressurized & Drained',
            description: 'Lowest premise tap opened to bleed residual line pressure into a catch bucket.',
            standardCode: 'BIS-PLUMB-04',
          ),
          _SafetyCheckpoint(
            title: 'Non-Slip Grip Footwear Worn',
            description: 'Water-resistant safety grip footwear equipped to prevent wet tile slipping hazards.',
            standardCode: 'ISO 20345',
          ),
        ],
      );
    }

    if (lowerTrade.contains('carpent') || lowerTitle.contains('carpent') || lowerTitle.contains('wood') || lowerTitle.contains('door') || lowerTitle.contains('furniture') || lowerTitle.contains('cupboard') || lowerTitle.contains('table')) {
      return const _TradeSafetyConfig(
        tradeCategory: 'CARPENTRY',
        bannerTitle: 'EYE PROTECTION & MACHINE SAFETY',
        bannerSubtitle: 'High-velocity debris protocol. Never operate circular saws, planers, or chisels without ANSI Z87.1 certified eye goggles.',
        bannerIcon: Icons.carpenter_rounded,
        bannerBg: Color(0xFFFFF7ED),
        bannerBorder: Color(0xFFFB923C),
        bannerIconColor: Color(0xFFEA580C),
        photoTitle: 'Eye Goggles & Clamped Workpiece Evidence',
        photoSubtitle: 'Snap photo showing protective eyewear equipped and workpiece clamped',
        checkpoints: [
          _SafetyCheckpoint(
            title: 'ANSI Z87.1 Protective Eye Goggles',
            description: 'Impact-resistant safety goggles securely worn against flying chips, nails, and sawdust.',
            standardCode: 'ANSI Z87.1',
          ),
          _SafetyCheckpoint(
            title: 'Blade Guard & Tool Shield Tested',
            description: 'Power tool mechanical blade guards verified for smooth, unobstructed self-retraction.',
            standardCode: 'OSHA 1910.213',
          ),
          _SafetyCheckpoint(
            title: 'Workpiece Clamped / Vice-Locked',
            description: 'Timber securely anchored using G-clamps or workbench vice to prevent violent kickback.',
            standardCode: 'BIS-WOOD-02',
          ),
        ],
      );
    }

    if (lowerTrade.contains('clean') || lowerTitle.contains('clean') || lowerTitle.contains('sanit') || lowerTitle.contains('wash') || lowerTitle.contains('pest') || lowerTitle.contains('sofa')) {
      return const _TradeSafetyConfig(
        tradeCategory: 'CLEANING',
        bannerTitle: 'CHEMICAL RESPIRATOR & VENTILATION',
        bannerSubtitle: 'Hazardous fume containment protocol. Ensure N95 / chemical vapor mask is fitted and premise windows are open for cross-ventilation.',
        bannerIcon: Icons.cleaning_services_rounded,
        bannerBg: Color(0xFFF0FDF4),
        bannerBorder: Color(0xFF4ADE80),
        bannerIconColor: Color(0xFF16A34A),
        photoTitle: 'Chemical PPE & Respirator Evidence',
        photoSubtitle: 'Snap photo showing chemical respirator mask and protective gloves',
        checkpoints: [
          _SafetyCheckpoint(
            title: 'Vapor Respirator / N95 Mask Fitted',
            description: 'Sealed respirator equipped to prevent inhalation of volatile solvent, bleach, or acidic fumes.',
            standardCode: 'EN 149:2001',
          ),
          _SafetyCheckpoint(
            title: 'Nitrile Chemical-Resistant Gloves',
            description: 'Heavy-duty chemical-barrier gloves worn to eliminate direct caustic dermal contact.',
            standardCode: 'EN 374-1',
          ),
          _SafetyCheckpoint(
            title: 'Cross-Ventilation Established',
            description: 'Premise windows and exterior doors opened to maintain continuous fresh airflow.',
            standardCode: 'ASHRAE 62.1',
          ),
        ],
      );
    }

    // Default to Electrical
    return const _TradeSafetyConfig(
      tradeCategory: 'ELECTRICAL',
      bannerTitle: 'ELECTRICAL ISOLATION PROTOCOL',
      bannerSubtitle: 'Zero-tolerance policy. Never touch high-voltage switchboards or wiring without Class 0 (1000V) dielectric gloves.',
      bannerIcon: Icons.electric_meter_rounded,
      bannerBg: TechTheme.primaryAmberLight,
      bannerBorder: TechTheme.primaryAmber,
      bannerIconColor: TechTheme.primaryAmberDark,
      photoTitle: 'Glove & MCB Photo Evidence',
      photoSubtitle: 'Snap photo showing 1000V gloves and open circuit breaker',
      checkpoints: [
        _SafetyCheckpoint(
          title: '1000V Dielectric Gloves',
          description: 'Class 0 rated rubber insulating gloves worn and visually checked for punctures or air leaks.',
          standardCode: 'IEC 60900',
        ),
        _SafetyCheckpoint(
          title: 'Main MCB / Isolator Off',
          description: 'Premise primary miniature circuit breaker physically tripped to OFF and danger lockout tag placed.',
          standardCode: 'IS 732:2019',
        ),
        _SafetyCheckpoint(
          title: 'Multimeter 0.00V Verified',
          description: 'True-RMS multimeter probe confirmed zero potential between Phase-Neutral and Phase-Earth.',
          standardCode: 'CAT-III 600V',
        ),
      ],
    );
  }

  Future<void> _submitSafetyVerification() async {
    if (!_isAllChecked) {
      setState(() => _errorMessage = 'All ${_config.checkpoints.length} safety checkpoints and photo evidence must be verified before starting work.');
      return;
    }

    setState(() {
      _isSubmitting = true;
      _errorMessage = null;
    });

    final uploadedPhotoUrl = await UploadService.uploadEvidencePhoto(
      jobId: widget.job.id,
      category: 'SAFETY',
    );

    final res = await TechJobService.verifySafetyChecklist(
      jobId: widget.job.id,
      category: _config.tradeCategory,
      trade: _config.tradeCategory,
      glovesConfirmed: true,
      mcbSwitchConfirmed: _config.tradeCategory == 'ELECTRICAL',
      mainValveOffConfirmed: _config.tradeCategory == 'PLUMBING',
      chemicalSafetyMaskConfirmed: _config.tradeCategory == 'CLEANING',
      eyeGogglesConfirmed: _config.tradeCategory == 'CARPENTRY',
      bladeGuardConfirmed: _config.tradeCategory == 'CARPENTRY',
      photoUrl: uploadedPhotoUrl,
    );

    setState(() => _isSubmitting = false);

    if (res.success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('${_config.tradeCategory} safety interlock verified. Premise unlocked for service.'),
          backgroundColor: TechTheme.signalOnlineEmerald,
        ),
      );
      Navigator.pop(context, true);
    } else {
      setState(() => _errorMessage = res.message ?? 'Safety verification failed. Please retry.');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: TechTheme.slateLight,
      appBar: AppBar(
        title: Text('${widget.job.trade} Safety Gate'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded),
          onPressed: () => Navigator.pop(context, false),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Dynamic Trade Warning Banner
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: _config.bannerBg,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: _config.bannerBorder),
              ),
              child: Row(
                children: [
                  Icon(_config.bannerIcon, color: _config.bannerIconColor, size: 28),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          _config.bannerTitle,
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w900,
                            color: _config.bannerIconColor,
                            letterSpacing: 0.6,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          _config.bannerSubtitle,
                          style: const TextStyle(fontSize: 11, color: TechTheme.slateDark, height: 1.3),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            if (_errorMessage != null) ...[
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: TechTheme.signalCrimsonBg,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: TechTheme.signalCrimson),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.error_outline_rounded, color: TechTheme.signalCrimson, size: 20),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        _errorMessage!,
                        style: const TextStyle(color: TechTheme.signalCrimson, fontSize: 12, fontWeight: FontWeight.w600),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
            ],

            const Text(
              'REQUIRED SAFETY CHECKPOINTS',
              style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: TechTheme.slateMuted, letterSpacing: 1.0),
            ),
            const SizedBox(height: 12),

            // Dynamic Checkpoints List
            ...List.generate(_config.checkpoints.length, (index) {
              final item = _config.checkpoints[index];
              final isChecked = _checkedIndices.contains(index);

              return SafetyItemTile(
                title: item.title,
                description: item.description,
                standardCode: item.standardCode,
                isChecked: isChecked,
                isPhotoAttached: _photoAttached,
                onToggleCheck: () {
                  setState(() {
                    if (isChecked) {
                      _checkedIndices.remove(index);
                    } else {
                      _checkedIndices.add(index);
                    }
                  });
                },
                onAttachPhoto: () => setState(() => _photoAttached = true),
              );
            }),

            // Photo Evidence Card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: TechTheme.slateBorder),
              ),
              child: Row(
                children: [
                  Container(
                    width: 50,
                    height: 50,
                    decoration: BoxDecoration(
                      color: _photoAttached ? TechTheme.signalOnlineBg : TechTheme.slateLight,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(
                      _photoAttached ? Icons.check_circle_rounded : Icons.camera_alt_rounded,
                      color: _photoAttached ? TechTheme.signalOnlineEmerald : TechTheme.slateMuted,
                      size: 26,
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          _photoAttached ? 'Evidence Snapped' : _config.photoTitle,
                          style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13, color: TechTheme.slateDark),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          _photoAttached ? 'Ready for cloud AI audit' : _config.photoSubtitle,
                          style: const TextStyle(fontSize: 11, color: TechTheme.slateMuted),
                        ),
                      ],
                    ),
                  ),
                  ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: _photoAttached ? TechTheme.slateLight : TechTheme.slateDark,
                      foregroundColor: _photoAttached ? TechTheme.slateDark : Colors.white,
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                      elevation: 0,
                    ),
                    onPressed: () {
                      setState(() => _photoAttached = true);
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Safety photo captured & timestamped')),
                      );
                    },
                    child: Text(_photoAttached ? 'Re-snap' : 'Capture'),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 28),

            // Submit Button
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: _isAllChecked ? TechTheme.signalOnlineEmerald : TechTheme.slateBorder,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                minimumSize: const Size.fromHeight(54),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              ),
              onPressed: _isSubmitting ? null : _submitSafetyVerification,
              child: _isSubmitting
                  ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                  : Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: const [
                        Icon(Icons.lock_open_rounded, size: 20),
                        SizedBox(width: 8),
                        Text('VERIFY & UNLOCK REPAIR WORK', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 14)),
                      ],
                    ),
            ),
            const SizedBox(height: 30),
          ],
        ),
      ),
    );
  }
}

class _TradeSafetyConfig {
  final String tradeCategory;
  final String bannerTitle;
  final String bannerSubtitle;
  final IconData bannerIcon;
  final Color bannerBg;
  final Color bannerBorder;
  final Color bannerIconColor;
  final String photoTitle;
  final String photoSubtitle;
  final List<_SafetyCheckpoint> checkpoints;

  const _TradeSafetyConfig({
    required this.tradeCategory,
    required this.bannerTitle,
    required this.bannerSubtitle,
    required this.bannerIcon,
    required this.bannerBg,
    required this.bannerBorder,
    required this.bannerIconColor,
    required this.photoTitle,
    required this.photoSubtitle,
    required this.checkpoints,
  });
}

class _SafetyCheckpoint {
  final String title;
  final String description;
  final String standardCode;

  const _SafetyCheckpoint({
    required this.title,
    required this.description,
    required this.standardCode,
  });
}
