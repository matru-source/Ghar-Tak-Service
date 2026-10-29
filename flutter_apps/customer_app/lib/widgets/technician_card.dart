import 'package:flutter/material.dart';
import '../core/theme.dart';

class TechnicianCard extends StatelessWidget {
  final String name;
  final String badgeNumber;
  final double rating;
  final String phone;
  final String? electricalLicenseNumber;
  final bool isGlovesVerified;

  const TechnicianCard({
    super.key,
    required this.name,
    required this.badgeNumber,
    required this.rating,
    required this.phone,
    this.electricalLicenseNumber,
    this.isGlovesVerified = true,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppTheme.slateBorder),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          Row(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(16),
                child: Image.asset(
                  'assets/images/img_technician_rajesh.png',
                  width: 56,
                  height: 56,
                  fit: BoxFit.cover,
                  errorBuilder: (_, __, ___) => Container(
                    width: 56,
                    height: 56,
                    color: AppTheme.primaryAmberLight,
                    child: const Icon(Icons.person, color: AppTheme.primaryAmberDark, size: 30),
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
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w800,
                              color: AppTheme.slateDark,
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        const SizedBox(width: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: AppTheme.signalEmeraldBg,
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: const Text(
                            'VERIFIED',
                            style: TextStyle(
                              fontSize: 9,
                              fontWeight: FontWeight.w800,
                              color: AppTheme.signalEmerald,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 3),
                    Text(
                      'Badge: $badgeNumber • Govt License Holder',
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppTheme.slateMuted,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        const Icon(Icons.star_rounded, color: AppTheme.primaryAmber, size: 16),
                        const SizedBox(width: 3),
                        Text(
                          '$rating (50+ Jobs)',
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                            color: AppTheme.slateDark,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: AppTheme.slateLight,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                const Icon(Icons.shield_outlined, color: AppTheme.signalEmerald, size: 16),
                const SizedBox(width: 8),
                const Expanded(
                  child: Text(
                    '1000V Insulated Safety Kit & Multimeter Calibrated',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: AppTheme.slateDark,
                    ),
                  ),
                ),
                Text(
                  isGlovesVerified ? 'PASS' : 'PENDING',
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w800,
                    color: isGlovesVerified ? AppTheme.signalEmerald : AppTheme.primaryAmberDark,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

