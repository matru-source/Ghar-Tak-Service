import 'package:flutter/material.dart';
import '../core/theme.dart';

class SafetyItemTile extends StatelessWidget {
  final String title;
  final String description;
  final String standardCode;
  final bool isChecked;
  final bool isPhotoAttached;
  final VoidCallback onToggleCheck;
  final VoidCallback onAttachPhoto;

  const SafetyItemTile({
    super.key,
    required this.title,
    required this.description,
    required this.standardCode,
    required this.isChecked,
    this.isPhotoAttached = false,
    required this.onToggleCheck,
    required this.onAttachPhoto,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isChecked ? TechTheme.signalOnlineBg.withOpacity(0.3) : Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: isChecked ? TechTheme.signalOnlineEmerald : TechTheme.slateBorder,
          width: isChecked ? 1.5 : 1.0,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              InkWell(
                onTap: onToggleCheck,
                borderRadius: BorderRadius.circular(8),
                child: Container(
                  width: 26,
                  height: 26,
                  decoration: BoxDecoration(
                    color: isChecked ? TechTheme.signalOnlineEmerald : Colors.white,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                      color: isChecked ? TechTheme.signalOnlineEmerald : TechTheme.slateBorder,
                      width: 2,
                    ),
                  ),
                  child: isChecked
                      ? const Icon(Icons.check_rounded, color: Colors.white, size: 18)
                      : null,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            title,
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w800,
                              color: isChecked ? TechTheme.slateDark : TechTheme.slateDark,
                            ),
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: TechTheme.primaryAmberLight,
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            standardCode,
                            style: const TextStyle(
                              fontSize: 9,
                              fontWeight: FontWeight.w800,
                              color: TechTheme.primaryAmberDark,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      description,
                      style: const TextStyle(
                        fontSize: 12,
                        color: TechTheme.slateMuted,
                        height: 1.3,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          const Divider(height: 1),
          const SizedBox(height: 10),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                isPhotoAttached ? '✓ Photo Verification Attached' : 'Photo Evidence Required',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: isPhotoAttached ? TechTheme.signalOnlineEmerald : TechTheme.slateMuted,
                ),
              ),
              InkWell(
                onTap: onAttachPhoto,
                borderRadius: BorderRadius.circular(10),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: isPhotoAttached ? TechTheme.signalOnlineBg : TechTheme.slateLight,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                      color: isPhotoAttached ? TechTheme.signalOnlineEmerald : TechTheme.slateBorder,
                    ),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        isPhotoAttached ? Icons.check_circle_outline_rounded : Icons.camera_alt_outlined,
                        size: 14,
                        color: isPhotoAttached ? TechTheme.signalOnlineEmerald : TechTheme.slateDark,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        isPhotoAttached ? 'Retake' : 'Snap Photo',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          color: isPhotoAttached ? TechTheme.signalOnlineEmerald : TechTheme.slateDark,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

