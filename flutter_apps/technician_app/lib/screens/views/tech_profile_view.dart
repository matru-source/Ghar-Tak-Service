import 'package:flutter/material.dart';
import '../../core/session_manager.dart';
import '../../core/theme.dart';
import '../../models/technician_model.dart';
import '../../services/tech_job_service.dart';
import '../../services/upload_service.dart';
import '../tech_auth_screen.dart';

class TechProfileView extends StatefulWidget {
  final VoidCallback onLogout;

  const TechProfileView({
    super.key,
    required this.onLogout,
  });

  @override
  State<TechProfileView> createState() => _TechProfileViewState();
}

class _TechProfileViewState extends State<TechProfileView> {
  TechnicianModel? _technician;
  int _logoTapCount = 0;

  bool _isUploadingAadhar = false;
  bool _isUploadingPan = false;
  bool _isUploadingLicense = false;
  bool _isSubmittingKyc = false;

  late TextEditingController _licenseCtrl;
  late TextEditingController _safetySerialCtrl;
  String? _aadharDocUrl;
  String? _panDocUrl;
  String? _electricalLicenseDocUrl;

  @override
  void initState() {
    super.initState();
    _technician = SessionManager.getCurrentTechnician() ?? TechnicianModel(
      id: 'tech_rajesh_01',
      fullName: 'Rajesh Kumar',
      phone: '+91 98200 12345',
      badgeNumber: 'GTS-TECH-101',
      walletBalance: 1033.0,
      assignedPincode: '400001',
    );

    final t = _technician;
    _licenseCtrl = TextEditingController(text: t?.electricalLicense ?? 'PWD/MH/ELEC-883921');
    _safetySerialCtrl = TextEditingController(text: t?.safetyKitSerial ?? 'SK-1000V-992');
    _aadharDocUrl = t?.aadharDocUrl;
    _panDocUrl = t?.panDocUrl;
    _electricalLicenseDocUrl = t?.electricalLicenseDocUrl;
  }

  @override
  void dispose() {
    _licenseCtrl.dispose();
    _safetySerialCtrl.dispose();
    super.dispose();
  }

  Future<void> _uploadDocument(String docType) async {
    final techId = _technician?.id ?? 'tech_rajesh_01';
    setState(() {
      if (docType == 'AADHAAR') _isUploadingAadhar = true;
      if (docType == 'PAN') _isUploadingPan = true;
      if (docType == 'LICENSE') _isUploadingLicense = true;
    });

    try {
      final url = await UploadService.uploadEvidencePhoto(
        jobId: techId,
        category: 'KYC_$docType',
      );
      setState(() {
        if (docType == 'AADHAAR') _aadharDocUrl = url;
        if (docType == 'PAN') _panDocUrl = url;
        if (docType == 'LICENSE') _electricalLicenseDocUrl = url;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('$docType document uploaded successfully!'),
            backgroundColor: TechTheme.signalOnlineEmerald,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to upload $docType document: $e'),
            backgroundColor: TechTheme.signalCrimson,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          if (docType == 'AADHAAR') _isUploadingAadhar = false;
          if (docType == 'PAN') _isUploadingPan = false;
          if (docType == 'LICENSE') _isUploadingLicense = false;
        });
      }
    }
  }

  Future<void> _submitKycDossier() async {
    final license = _licenseCtrl.text.trim();
    if (license.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Government Wireman / Trade License Number is required'),
          backgroundColor: TechTheme.signalCrimson,
        ),
      );
      return;
    }

    final techId = _technician?.id ?? 'tech_rajesh_01';
    setState(() => _isSubmittingKyc = true);

    try {
      final res = await TechJobService.submitKycDocuments(
        technicianId: techId,
        electricalLicenseNumber: license,
        electricalLicenseDocUrl: _electricalLicenseDocUrl,
        aadharDocUrl: _aadharDocUrl,
        panDocUrl: _panDocUrl,
        safetyKitSerial: _safetySerialCtrl.text.trim().isNotEmpty
            ? _safetySerialCtrl.text.trim()
            : null,
      );

      if (res.success) {
        final updated = _technician?.copyWith(
          kycStatus: 'PENDING_REVIEW',
          electricalLicense: license,
          safetyKitSerial: _safetySerialCtrl.text.trim(),
          aadharDocUrl: _aadharDocUrl,
          panDocUrl: _panDocUrl,
          electricalLicenseDocUrl: _electricalLicenseDocUrl,
        );

        if (updated != null) {
          await SessionManager.saveCurrentTechnician(updated);
          setState(() => _technician = updated);
        }

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('KYC dossier submitted successfully! Under review by compliance officer.'),
              backgroundColor: TechTheme.signalOnlineEmerald,
            ),
          );
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(res.error ?? 'Failed to submit KYC documents'),
              backgroundColor: TechTheme.signalCrimson,
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Network error: $e'),
            backgroundColor: TechTheme.signalCrimson,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isSubmittingKyc = false);
      }
    }
  }

  void _showEditProfileDialog() {
    final nameCtrl = TextEditingController(text: _technician?.fullName);
    final phoneCtrl = TextEditingController(text: _technician?.phone);
    final emailCtrl = TextEditingController(text: _technician?.email);
    final pinCtrl = TextEditingController(text: _technician?.assignedPincode);
    final langCtrl = TextEditingController(text: _technician?.languages);

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Edit Partner Details', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(controller: nameCtrl, decoration: const InputDecoration(labelText: 'Full Name', border: OutlineInputBorder())),
              const SizedBox(height: 10),
              TextField(controller: phoneCtrl, decoration: const InputDecoration(labelText: 'Mobile Number', border: OutlineInputBorder())),
              const SizedBox(height: 10),
              TextField(controller: emailCtrl, decoration: const InputDecoration(labelText: 'Email Address', border: OutlineInputBorder())),
              const SizedBox(height: 10),
              TextField(controller: pinCtrl, decoration: const InputDecoration(labelText: 'Assigned Hub Pincode', border: OutlineInputBorder())),
              const SizedBox(height: 10),
              TextField(controller: langCtrl, decoration: const InputDecoration(labelText: 'Spoken Languages', border: OutlineInputBorder())),
            ],
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: TechTheme.flameOrange, foregroundColor: Colors.white),
            onPressed: () async {
              final updated = _technician?.copyWith(
                fullName: nameCtrl.text.trim(),
                phone: phoneCtrl.text.trim(),
                email: emailCtrl.text.trim(),
                assignedPincode: pinCtrl.text.trim(),
                languages: langCtrl.text.trim(),
              );
              if (updated != null) {
                await SessionManager.saveCurrentTechnician(updated);
                setState(() => _technician = updated);
              }
              Navigator.pop(ctx);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Partner details updated successfully!')),
              );
            },
            child: const Text('Save Changes'),
          ),
        ],
      ),
    );
  }

  void _handleLogoTap() {
    _logoTapCount++;
    if (_logoTapCount >= 6) {
      _logoTapCount = 0;
      _showEnvSwitcher();
    }
  }

  void _showEnvSwitcher() {
    final ctrl = TextEditingController(text: SessionManager.getBaseUrl());
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Developer API Switcher', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('Configure backend API URL for local or staging testing:', style: TextStyle(fontSize: 12, color: TechTheme.slateMuted)),
            const SizedBox(height: 10),
            TextField(controller: ctrl, decoration: const InputDecoration(border: OutlineInputBorder())),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () async {
              await SessionManager.setBaseUrl(ctrl.text.trim());
              Navigator.pop(ctx);
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text('Base URL set to ${ctrl.text.trim()}')),
              );
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }

  void _showLogoutDialog() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Sign Out of Console?', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        content: const Text(
          'Your duty status will be toggled OFFLINE and incoming doorstep dispatches will pause until you sign in again.',
          style: TextStyle(fontSize: 13, color: TechTheme.slateMuted),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: TechTheme.signalCrimson, foregroundColor: Colors.white),
            onPressed: () async {
              await SessionManager.logout();
              Navigator.pop(ctx);
              Navigator.pushAndRemoveUntil(
                context,
                MaterialPageRoute(builder: (_) => const TechAuthScreen()),
                (route) => false,
              );
            },
            child: const Text('Sign Out'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final tech = _technician;
    final name = tech?.fullName ?? 'Rajesh Kumar';

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          // Header Card
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: TechTheme.slateBorder),
            ),
            child: Row(
              children: [
                GestureDetector(
                  onTap: _handleLogoTap,
                  child: Container(
                    width: 60,
                    height: 60,
                    decoration: BoxDecoration(
                      color: TechTheme.flameOrange,
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(color: TechTheme.flameOrange.withOpacity(0.3), blurRadius: 10, offset: const Offset(0, 4)),
                      ],
                    ),
                    alignment: Alignment.center,
                    child: Text(
                      name.isNotEmpty ? name.substring(0, 1).toUpperCase() : 'T',
                      style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white),
                    ),
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Flexible(
                            child: Text(
                              name,
                              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: TechTheme.slateDark),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          const SizedBox(width: 6),
                          const Icon(Icons.verified_rounded, color: TechTheme.flameOrange, size: 18),
                        ],
                      ),
                      const SizedBox(height: 2),
                      Text('Badge: ${tech?.badgeNumber ?? "GTS-TECH-101"}', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: TechTheme.slateMuted)),
                      const SizedBox(height: 2),
                      Text('Hub: ${tech?.assignedPincode ?? "400001"} • ${tech?.specialization ?? "Certified Electrician"}', style: const TextStyle(fontSize: 11, color: TechTheme.slateMuted)),
                    ],
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.edit_note_rounded, color: TechTheme.flameOrange),
                  onPressed: _showEditProfileDialog,
                ),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // Regulatory Compliance & KYC Section
          _buildKycDossierSection(),

          const SizedBox(height: 16),

          // Verification Badges Row
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
                const Text('FIELD QUALIFICATIONS & BADGES', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: TechTheme.slateMuted, letterSpacing: 0.5)),
                const SizedBox(height: 12),
                _buildBadgeItem(Icons.bolt_rounded, '1000V Dielectric Safety Certified', 'Active & Verified', TechTheme.flameOrange),
                const SizedBox(height: 10),
                _buildBadgeItem(Icons.shield_rounded, 'Police Background Verification', 'Cleared & Cleared on File', TechTheme.signalOnlineEmerald),
                const SizedBox(height: 10),
                _buildBadgeItem(Icons.card_membership_rounded, 'Trade License & Tool Calibration', 'PWD/MH/ELEC-883921', TechTheme.signalCobalt),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // Actions Menu Card
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: TechTheme.slateBorder),
            ),
            child: Column(
              children: [
                ListTile(
                  leading: const Icon(Icons.support_agent_rounded, color: TechTheme.signalCobalt),
                  title: const Text('24x7 GTS Field Support Hotline', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                  subtitle: const Text('Toll-free priority assistance for active field orders', style: TextStyle(fontSize: 11)),
                  trailing: const Icon(Icons.chevron_right_rounded),
                  onTap: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Dialing GTS Support Desk: 1800-419-GHAR (Toll-Free)')),
                    );
                  },
                ),
                const Divider(height: 1),
                ListTile(
                  leading: const Icon(Icons.settings_suggest_rounded, color: TechTheme.flameOrange),
                  title: const Text('Developer API Switcher', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                  subtitle: Text(SessionManager.getBaseUrl(), style: const TextStyle(fontSize: 11), maxLines: 1, overflow: TextOverflow.ellipsis),
                  trailing: const Icon(Icons.chevron_right_rounded),
                  onTap: _showEnvSwitcher,
                ),
                const Divider(height: 1),
                ListTile(
                  leading: const Icon(Icons.logout_rounded, color: TechTheme.signalCrimson),
                  title: const Text('Sign Out', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: TechTheme.signalCrimson)),
                  subtitle: const Text('Toggle offline & clear local technician credentials', style: TextStyle(fontSize: 11)),
                  trailing: const Icon(Icons.chevron_right_rounded),
                  onTap: _showLogoutDialog,
                ),
              ],
            ),
          ),

          const SizedBox(height: 24),
          const Text('Ghar Tak Partner Console v2.0.0 (Build 2026)', style: TextStyle(fontSize: 11, color: TechTheme.slateMuted)),
        ],
      ),
    );
  }

  Widget _buildKycDossierSection() {
    final kyc = _technician?.kycStatus ?? 'PENDING_REVIEW';
    Color statusColor;
    Color statusBg;
    IconData statusIcon;
    String statusText;

    if (kyc == 'VERIFIED') {
      statusColor = TechTheme.signalOnlineEmerald;
      statusBg = TechTheme.signalOnlineBg;
      statusIcon = Icons.verified_rounded;
      statusText = 'VERIFIED';
    } else if (kyc == 'REJECTED') {
      statusColor = TechTheme.signalCrimson;
      statusBg = TechTheme.signalCrimsonBg;
      statusIcon = Icons.warning_amber_rounded;
      statusText = 'REJECTED';
    } else {
      statusColor = TechTheme.primaryAmberDark;
      statusBg = TechTheme.primaryAmberLight;
      statusIcon = Icons.hourglass_top_rounded;
      statusText = 'PENDING REVIEW';
    }

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: TechTheme.slateBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'REGULATORY COMPLIANCE & KYC',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w800,
                  color: TechTheme.slateMuted,
                  letterSpacing: 0.5,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: statusBg,
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(statusIcon, color: statusColor, size: 12),
                    const SizedBox(width: 4),
                    Text(
                      statusText,
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                        color: statusColor,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          const Text(
            'Mandatory compliance under Indian Electrical Board & GTS Safety Standard. Submit verified credentials to unlock priority doorstep dispatches.',
            style: TextStyle(fontSize: 11, color: TechTheme.slateMuted),
          ),
          const SizedBox(height: 14),

          // Wireman License Number Input
          TextField(
            controller: _licenseCtrl,
            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
            decoration: InputDecoration(
              labelText: 'Government Wireman License Number',
              labelStyle: const TextStyle(fontSize: 11, color: TechTheme.slateMuted),
              hintText: 'e.g. PWD/MH/ELEC-883921',
              prefixIcon: const Icon(Icons.badge_rounded, color: TechTheme.flameOrange, size: 18),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            ),
          ),
          const SizedBox(height: 10),

          // Safety Kit Serial Input
          TextField(
            controller: _safetySerialCtrl,
            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
            decoration: InputDecoration(
              labelText: '1000V Dielectric Safety Kit Serial',
              labelStyle: const TextStyle(fontSize: 11, color: TechTheme.slateMuted),
              hintText: 'e.g. SK-1000V-992',
              prefixIcon: const Icon(Icons.shield_rounded, color: TechTheme.signalCobalt, size: 18),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            ),
          ),
          const SizedBox(height: 14),

          // Documents Upload List
          const Text(
            'FIELD VERIFICATION PROOFS',
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w700,
              color: TechTheme.slateMuted,
              letterSpacing: 0.5,
            ),
          ),
          const SizedBox(height: 8),

          // 1. Aadhaar Card
          _buildKycDocRow(
            icon: Icons.fingerprint_rounded,
            title: 'Government Aadhaar UID Card',
            isUploaded: _aadharDocUrl != null && _aadharDocUrl!.isNotEmpty,
            isLoading: _isUploadingAadhar,
            onUpload: () => _uploadDocument('AADHAAR'),
          ),
          const SizedBox(height: 8),

          // 2. PAN Card
          _buildKycDocRow(
            icon: Icons.credit_card_rounded,
            title: 'Income Tax PAN Card',
            isUploaded: _panDocUrl != null && _panDocUrl!.isNotEmpty,
            isLoading: _isUploadingPan,
            onUpload: () => _uploadDocument('PAN'),
          ),
          const SizedBox(height: 8),

          // 3. Electrical License Doc
          _buildKycDocRow(
            icon: Icons.assignment_turned_in_rounded,
            title: 'State Wireman License Scan',
            isUploaded: _electricalLicenseDocUrl != null && _electricalLicenseDocUrl!.isNotEmpty,
            isLoading: _isUploadingLicense,
            onUpload: () => _uploadDocument('LICENSE'),
          ),
          const SizedBox(height: 16),

          // Submit KYC Dossier CTA
          SizedBox(
            width: double.infinity,
            height: 44,
            child: ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: TechTheme.flameOrange,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                elevation: 0,
              ),
              onPressed: _isSubmittingKyc ? null : _submitKycDossier,
              icon: _isSubmittingKyc
                  ? const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                    )
                  : const Icon(Icons.verified_user_rounded, size: 18),
              label: Text(
                _isSubmittingKyc ? 'SUBMITTING DOSSIER...' : 'SUBMIT KYC DOSSIER FOR AUDIT',
                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 0.5),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildKycDocRow({
    required IconData icon,
    required String title,
    required bool isUploaded,
    required bool isLoading,
    required VoidCallback onUpload,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: TechTheme.slateLight,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: TechTheme.slateBorder),
      ),
      child: Row(
        children: [
          Icon(icon, color: isUploaded ? TechTheme.signalOnlineEmerald : TechTheme.slateMuted, size: 20),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: TechTheme.slateDark)),
                Text(
                  isUploaded ? 'Document Attached (Verified CDN)' : 'No file attached · Upload required',
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: isUploaded ? FontWeight.w600 : FontWeight.normal,
                    color: isUploaded ? TechTheme.signalOnlineEmerald : TechTheme.slateMuted,
                  ),
                ),
              ],
            ),
          ),
          OutlinedButton(
            style: OutlinedButton.styleFrom(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              minimumSize: const Size(60, 30),
              side: BorderSide(
                color: isUploaded ? TechTheme.signalOnlineEmerald : TechTheme.flameOrange,
              ),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
            onPressed: isLoading ? null : onUpload,
            child: isLoading
                ? const SizedBox(
                    width: 12,
                    height: 12,
                    child: CircularProgressIndicator(strokeWidth: 1.5),
                  )
                : Text(
                    isUploaded ? 'Replace' : 'Upload',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      color: isUploaded ? TechTheme.signalOnlineEmerald : TechTheme.flameOrange,
                    ),
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildBadgeItem(IconData icon, String title, String subtitle, Color color) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(10)),
          child: Icon(icon, color: color, size: 20),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: TechTheme.slateDark)),
              Text(subtitle, style: const TextStyle(fontSize: 10, color: TechTheme.slateMuted)),
            ],
          ),
        ),
      ],
    );
  }
}

