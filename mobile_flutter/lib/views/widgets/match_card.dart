import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';
import '../../models/match_model.dart';

class MatchCard extends StatefulWidget {
  final MatchModel match;
  final VoidCallback onTap;

  const MatchCard({
    super.key,
    required this.match,
    required this.onTap,
  });

  @override
  State<MatchCard> createState() => _MatchCardState();
}

class _MatchCardState extends State<MatchCard> with SingleTickerProviderStateMixin {
  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;
  bool _isPressed = false;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    );
    _pulseAnimation = Tween<double>(begin: 0.35, end: 1.0).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );

    if (widget.match.status.toLowerCase() == 'live') {
      _pulseController.repeat(reverse: true);
    }
  }

  @override
  void didUpdateWidget(covariant MatchCard oldWidget) {
    super.didUpdateWidget(oldWidget);
    final isLive = widget.match.status.toLowerCase() == 'live';
    if (isLive && !_pulseController.isAnimating) {
      _pulseController.repeat(reverse: true);
    } else if (!isLive && _pulseController.isAnimating) {
      _pulseController.stop();
    }
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final isDark = context.isDarkMode;
    final match = widget.match;

    final isLive = match.status.toLowerCase() == 'live';
    final isCompleted = match.status.toLowerCase() == 'completed' || match.status.toLowerCase() == 'finished';
    final hasInsight = match.insight.isPublished;
    final isUnlocked = match.isUnlocked || match.insight.isUnlocked;

    return AnimatedScale(
      scale: _isPressed ? 0.98 : 1.0,
      duration: const Duration(milliseconds: 120),
      curve: Curves.easeOutQuad,
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: colors.surface,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isLive
                ? colors.accentRed.withValues(alpha: isDark ? 0.5 : 0.4)
                : colors.border,
            width: isLive ? 1.5 : 1,
          ),
          boxShadow: isLive
              ? [
                  ...colors.cardShadow,
                  BoxShadow(
                    color: colors.accentRed.withValues(alpha: isDark ? 0.12 : 0.08),
                    blurRadius: 16,
                    spreadRadius: 1,
                  ),
                ]
              : colors.cardShadow,
        ),
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: widget.onTap,
            onHighlightChanged: (pressed) {
              if (mounted) setState(() => _isPressed = pressed);
            },
            borderRadius: BorderRadius.circular(20),
            splashColor: colors.primary.withValues(alpha: 0.1),
            highlightColor: colors.primary.withValues(alpha: 0.05),
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Top Row: Status badge + Venue / Date
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: isLive
                              ? colors.accentRed.withValues(alpha: isDark ? 0.2 : 0.1)
                              : isCompleted
                                  ? colors.surfaceLight.withValues(alpha: 0.6)
                                  : colors.primary.withValues(alpha: isDark ? 0.15 : 0.1),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(
                            color: isLive
                                ? colors.accentRed
                                : isCompleted
                                    ? colors.textMuted.withValues(alpha: 0.4)
                                    : colors.primary.withValues(alpha: 0.7),
                            width: 1,
                          ),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            if (isLive) ...[
                              FadeTransition(
                                opacity: _pulseAnimation,
                                child: Container(
                                  width: 7,
                                  height: 7,
                                  decoration: BoxDecoration(
                                    color: colors.accentRed,
                                    shape: BoxShape.circle,
                                    boxShadow: [
                                      BoxShadow(
                                        color: colors.accentRed.withValues(alpha: 0.6),
                                        blurRadius: 4,
                                        spreadRadius: 1,
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                              const SizedBox(width: 6),
                            ],
                            Text(
                              isLive
                                  ? 'LIVE'
                                  : isCompleted
                                      ? 'FINISHED'
                                      : 'UPCOMING',
                              style: TextStyle(
                                color: isLive
                                    ? colors.accentRed
                                    : isCompleted
                                        ? colors.textSecondary
                                        : colors.primary,
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                                letterSpacing: 0.5,
                              ),
                            ),
                          ],
                        ),
                      ),
                      Expanded(
                        child: Text(
                          match.formattedDateTimeIST,
                          textAlign: TextAlign.end,
                          style: TextStyle(
                            color: colors.textSecondary,
                            fontSize: 11,
                            fontWeight: FontWeight.w500,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Teams Row
                  Row(
                    children: [
                      // Team A
                      Expanded(
                        child: Row(
                          children: [
                            Container(
                              width: 36,
                              height: 36,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                gradient: LinearGradient(
                                  colors: [
                                    colors.primary.withValues(alpha: isDark ? 0.3 : 0.15),
                                    colors.primary.withValues(alpha: isDark ? 0.1 : 0.05),
                                  ],
                                  begin: Alignment.topLeft,
                                  end: Alignment.bottomRight,
                                ),
                                border: Border.all(
                                  color: colors.primary.withValues(alpha: isDark ? 0.4 : 0.3),
                                  width: 1.2,
                                ),
                              ),
                              alignment: Alignment.center,
                              child: Text(
                                match.teamA.isNotEmpty ? match.teamA[0].toUpperCase() : 'A',
                                style: TextStyle(
                                  color: colors.primary,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 15,
                                ),
                              ),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Text(
                                match.teamA,
                                style: TextStyle(
                                  color: colors.textPrimary,
                                  fontSize: 15,
                                  fontWeight: FontWeight.bold,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                        ),
                      ),

                      // VS Badge
                      Container(
                        margin: const EdgeInsets.symmetric(horizontal: 6),
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: colors.surfaceLight.withValues(alpha: isDark ? 0.6 : 0.8),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: colors.border, width: 0.8),
                        ),
                        child: Text(
                          'VS',
                          style: TextStyle(
                            color: colors.textMuted,
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),

                      // Team B
                      Expanded(
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.end,
                          children: [
                            Expanded(
                              child: Text(
                                match.teamB,
                                textAlign: TextAlign.end,
                                style: TextStyle(
                                  color: colors.textPrimary,
                                  fontSize: 15,
                                  fontWeight: FontWeight.bold,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            const SizedBox(width: 10),
                            Container(
                              width: 36,
                              height: 36,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                gradient: LinearGradient(
                                  colors: [
                                    colors.secondary.withValues(alpha: isDark ? 0.3 : 0.15),
                                    colors.secondary.withValues(alpha: isDark ? 0.1 : 0.05),
                                  ],
                                  begin: Alignment.topLeft,
                                  end: Alignment.bottomRight,
                                ),
                                border: Border.all(
                                  color: colors.secondary.withValues(alpha: isDark ? 0.4 : 0.3),
                                  width: 1.2,
                                ),
                              ),
                              alignment: Alignment.center,
                              child: Text(
                                match.teamB.isNotEmpty ? match.teamB[0].toUpperCase() : 'B',
                                style: TextStyle(
                                  color: colors.secondary,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 15,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Divider(color: colors.border, height: 1),
                  const SizedBox(height: 12),

                  // Bottom Action & Insight Preview Tag
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      if (hasInsight) ...[
                        Row(
                          children: [
                            Icon(
                              isUnlocked ? Icons.lock_open_rounded : Icons.auto_awesome,
                              size: 16,
                              color: isUnlocked ? colors.accentGreen : colors.secondary,
                            ),
                            const SizedBox(width: 6),
                            Text(
                              isUnlocked
                                  ? 'Insights Unlocked'
                                  : 'Astro Analysis Available',
                              style: TextStyle(
                                color: isUnlocked ? colors.accentGreen : colors.secondary,
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ] else ...[
                        Text(
                          'Awaiting Astro Posting',
                          style: TextStyle(
                            color: colors.textMuted,
                            fontSize: 12,
                          ),
                        ),
                      ],

                      // View Button
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
                        decoration: BoxDecoration(
                          gradient: hasInsight ? colors.buttonGradient : null,
                          color: hasInsight ? null : colors.surfaceLight.withValues(alpha: 0.8),
                          borderRadius: BorderRadius.circular(10),
                          boxShadow: hasInsight
                              ? [
                                  BoxShadow(
                                    color: colors.primary.withValues(alpha: 0.25),
                                    blurRadius: 6,
                                    offset: const Offset(0, 2),
                                  ),
                                ]
                              : null,
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              hasInsight
                                  ? (isUnlocked ? 'View Analysis' : 'Unlock ₹${match.insight.price.toInt()}')
                                  : 'Match Info',
                              style: TextStyle(
                                color: hasInsight ? Colors.white : colors.textSecondary,
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(width: 4),
                            Icon(
                              Icons.arrow_forward_ios_rounded,
                              size: 10,
                              color: hasInsight ? Colors.white : colors.textSecondary,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
