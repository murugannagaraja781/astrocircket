import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../models/match_model.dart';
import '../../providers/match_provider.dart';
import '../../providers/payment_provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/theme_provider.dart';

class MatchInsightsScreen extends StatelessWidget {
  final MatchModel match;

  const MatchInsightsScreen({super.key, required this.match});

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final isDark = context.isDarkMode;

    return Consumer<MatchProvider>(
      builder: (context, matchProvider, child) {
        // Use updated match from provider if available
        final currentMatch = (matchProvider.selectedMatch?.id == match.id)
            ? matchProvider.selectedMatch!
            : match;

        final isUnlocked = currentMatch.isUnlocked || currentMatch.insight.isUnlocked;
        final hasInsight = currentMatch.insight.isPublished;

        return Scaffold(
          appBar: AppBar(
            title: Text(
              '${currentMatch.teamA} vs ${currentMatch.teamB}',
              style: TextStyle(
                color: colors.textPrimary,
                fontSize: 17,
                fontWeight: FontWeight.bold,
              ),
            ),
            actions: [
              Consumer<ThemeProvider>(
                builder: (context, themeProv, _) => IconButton(
                  icon: Icon(
                    isDark ? Icons.light_mode_rounded : Icons.dark_mode_rounded,
                    color: isDark ? Colors.amber : colors.textPrimary,
                    size: 22,
                  ),
                  tooltip: isDark ? 'Light Mode' : 'Dark Mode',
                  onPressed: () => themeProv.toggleTheme(context),
                ),
              ),
              IconButton(
                icon: Icon(Icons.share_outlined, color: colors.textPrimary),
                onPressed: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      backgroundColor: colors.surface,
                      content: Text(
                        'Match link copied!',
                        style: TextStyle(color: colors.textPrimary),
                      ),
                    ),
                  );
                },
              ),
            ],
          ),
          body: SingleChildScrollView(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header Match Banner
                _buildMatchHeader(currentMatch, colors, isDark),
                const SizedBox(height: 20),

                if (!hasInsight)
                  _buildAwaitingInsightsCard(colors)
                else if (isUnlocked)
                  _buildUnlockedAnalysis(context, currentMatch, colors, isDark)
                else
                  _buildLockedPaywall(context, currentMatch, colors, isDark),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildMatchHeader(MatchModel match, AppColorPalette colors, bool isDark) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: colors.surface,
        gradient: colors.cardGradient,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: colors.border),
        boxShadow: colors.cardShadow,
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              // Team A
              Expanded(
                child: Column(
                  children: [
                    Container(
                      width: 56,
                      height: 56,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: LinearGradient(
                          colors: [
                            colors.primary.withValues(alpha: isDark ? 0.3 : 0.18),
                            colors.primary.withValues(alpha: isDark ? 0.1 : 0.06),
                          ],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        border: Border.all(
                          color: colors.primary.withValues(alpha: isDark ? 0.5 : 0.3),
                          width: 1.5,
                        ),
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        match.teamA.isNotEmpty ? match.teamA[0].toUpperCase() : 'A',
                        style: TextStyle(
                          color: colors.primary,
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      match.teamA,
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: colors.textPrimary,
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
              // VS Badge
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                decoration: BoxDecoration(
                  color: colors.surfaceLight.withValues(alpha: isDark ? 0.6 : 0.8),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: colors.border),
                ),
                child: Text(
                  'VS',
                  style: TextStyle(
                    color: colors.secondary,
                    fontWeight: FontWeight.bold,
                    fontSize: 13,
                  ),
                ),
              ),
              // Team B
              Expanded(
                child: Column(
                  children: [
                    Container(
                      width: 56,
                      height: 56,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: LinearGradient(
                          colors: [
                            colors.secondary.withValues(alpha: isDark ? 0.3 : 0.18),
                            colors.secondary.withValues(alpha: isDark ? 0.1 : 0.06),
                          ],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        border: Border.all(
                          color: colors.secondary.withValues(alpha: isDark ? 0.5 : 0.3),
                          width: 1.5,
                        ),
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        match.teamB.isNotEmpty ? match.teamB[0].toUpperCase() : 'B',
                        style: TextStyle(
                          color: colors.secondary,
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      match.teamB,
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: colors.textPrimary,
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Divider(color: colors.border),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.schedule_rounded, size: 14, color: colors.primary),
              const SizedBox(width: 4),
              Flexible(
                child: Text(
                  match.formattedDateTimeIST,
                  style: TextStyle(color: colors.primary, fontSize: 12, fontWeight: FontWeight.w600),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              const SizedBox(width: 12),
              Icon(Icons.location_on_outlined, size: 14, color: colors.textSecondary),
              const SizedBox(width: 4),
              Flexible(
                child: Text(
                  match.venue.isNotEmpty ? match.venue : 'International Cricket Stadium',
                  style: TextStyle(color: colors.textSecondary, fontSize: 12),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildAwaitingInsightsCard(AppColorPalette colors) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: colors.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: colors.border),
        boxShadow: colors.cardShadow,
      ),
      child: Column(
        children: [
          Icon(Icons.hourglass_top_rounded, size: 48, color: colors.secondary),
          const SizedBox(height: 16),
          Text(
            'Astrological Analysis in Progress',
            style: TextStyle(
              color: colors.textPrimary,
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Our KP astrologers are currently analyzing planetary transits, dasha charts, and player lagnas. You will receive a notification once published!',
            textAlign: TextAlign.center,
            style: TextStyle(
              color: colors.textSecondary,
              fontSize: 13,
              height: 1.4,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLockedPaywall(BuildContext context, MatchModel match, AppColorPalette colors, bool isDark) {
    final paymentProvider = Provider.of<PaymentProvider>(context);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Preview Header
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFF2E1065), Color(0xFF1E1B4B)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: const Color(0xFF6366F1).withValues(alpha: 0.4)),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF6366F1).withValues(alpha: 0.15),
                blurRadius: 14,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Column(
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: colors.secondary.withValues(alpha: 0.2),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(Icons.lock_rounded, color: colors.secondary, size: 24),
                  ),
                  const SizedBox(width: 14),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Premium KP Astro Insights',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        Text(
                          'Unlock detailed winning edge & key player ratings',
                          style: TextStyle(color: Color(0xFFC7D2FE), fontSize: 12),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              const Divider(color: Color(0xFF4338CA)),
              const SizedBox(height: 12),
              _buildIncludedItem('⭐ Complete Astrological Winning Edge Analysis', colors),
              _buildIncludedItem('🏏 Top KP Impact Batsmen & Expected Score Index', colors),
              _buildIncludedItem('🎯 Top Wicket-Taking Bowlers Analysis', colors),
              _buildIncludedItem('🪐 Planetary Dasha & Pitch Lagna Breakdown', colors),
            ],
          ),
        ),
        const SizedBox(height: 20),

        // Pay & Unlock Action Card
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: colors.surface,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: colors.border),
            boxShadow: colors.cardShadow,
          ),
          child: Column(
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Instant Match Access',
                        style: TextStyle(
                          color: colors.textPrimary,
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        'One-time payment for full report',
                        style: TextStyle(color: colors.textSecondary, fontSize: 12),
                      ),
                    ],
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                    decoration: BoxDecoration(
                      gradient: colors.goldGradient,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      '₹${match.insight.price.toInt()}',
                      style: const TextStyle(
                        color: Colors.black,
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),

              if (paymentProvider.isProcessing) ...[
                CircularProgressIndicator(color: colors.primary),
                const SizedBox(height: 12),
                Text(
                  paymentProvider.statusMessage ?? 'Processing payment...',
                  style: TextStyle(color: colors.textSecondary, fontSize: 13),
                ),
              ] else ...[
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF5F259F), // PhonePe Purple
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      elevation: 3,
                    ),
                    icon: const Icon(Icons.payment, color: Colors.white),
                    label: Text(
                      'Unlock with PhonePe (₹${match.insight.price.toInt()})',
                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                    ),
                    onPressed: () async {
                      final matchProvider = Provider.of<MatchProvider>(context, listen: false);
                      final authProvider = Provider.of<AuthProvider>(context, listen: false);
                      final scaffoldMessenger = ScaffoldMessenger.of(context);
                      final success = await paymentProvider.processPhonePePayment(
                        context: context,
                        matchId: match.id,
                        amount: match.insight.price,
                        matchProvider: matchProvider,
                        userId: authProvider.currentUser?.id,
                      );
                      if (success) {
                        scaffoldMessenger.showSnackBar(
                          SnackBar(
                            backgroundColor: colors.accentGreen,
                            content: const Text('🎉 Insights successfully unlocked!'),
                          ),
                        );
                      }
                    },
                  ),
                ),
                const SizedBox(height: 10),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.shield_outlined, size: 14, color: colors.textMuted),
                    const SizedBox(width: 4),
                    Text(
                      '100% Safe & Secure via PhonePe UPI / Cards',
                      style: TextStyle(color: colors.textMuted, fontSize: 11),
                    ),
                  ],
                ),
              ],
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildIncludedItem(String text, AppColorPalette colors) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4.0),
      child: Row(
        children: [
          Icon(Icons.check_circle_rounded, size: 16, color: colors.accentGreen),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              text,
              style: const TextStyle(color: Colors.white, fontSize: 13),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildUnlockedAnalysis(BuildContext context, MatchModel match, AppColorPalette colors, bool isDark) {
    final advantage = match.insight.astrologicalAdvantage ?? 'Balanced Match';
    final batsmen = match.insight.keyBatsmen;
    final bowlers = match.insight.keyBowlers;
    final summary = match.insight.insightsSummary;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Astrological Advantage Badge Card
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFF065F46), Color(0xFF047857)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(20),
            boxShadow: [
              BoxShadow(
                color: colors.accentGreen.withValues(alpha: 0.25),
                blurRadius: 12,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Row(
                    children: [
                      Icon(Icons.verified, color: Colors.white, size: 20),
                      SizedBox(width: 6),
                      Text(
                        'Astrological Edge',
                        style: TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 14,
                        ),
                      ),
                    ],
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.black.withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: const Text(
                      'KP Verified',
                      style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Text(
                advantage,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 6),
              const Text(
                'Planetary positions and lagna sub-lords favor strong execution during critical overs.',
                style: TextStyle(color: Colors.white70, fontSize: 12),
              ),
            ],
          ),
        ),
        const SizedBox(height: 24),

        // Key Batsmen Section
        if (batsmen.isNotEmpty) ...[
          Row(
            children: [
              Icon(Icons.sports_cricket, color: colors.primary, size: 20),
              const SizedBox(width: 8),
              Text(
                'Key Impact Batsmen',
                style: TextStyle(
                  color: colors.textPrimary,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ...batsmen.map((player) => _buildPlayerCard(player, isBatsman: true, colors: colors)),
          const SizedBox(height: 20),
        ],

        // Key Bowlers Section
        if (bowlers.isNotEmpty) ...[
          Row(
            children: [
              Icon(Icons.sports_baseball, color: colors.secondary, size: 20),
              const SizedBox(width: 8),
              Text(
                'Key Impact Bowlers',
                style: TextStyle(
                  color: colors.textPrimary,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ...bowlers.map((player) => _buildPlayerCard(player, isBatsman: false, colors: colors)),
          const SizedBox(height: 20),
        ],

        // Detailed KP Summary
        if (summary != null && summary.isNotEmpty) ...[
          Text(
            'KP Astrological Match Summary',
            style: TextStyle(
              color: colors.textPrimary,
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: colors.surface,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: colors.border),
              boxShadow: colors.cardShadow,
            ),
            child: Text(
              summary,
              style: TextStyle(
                color: colors.textSecondary,
                fontSize: 14,
                height: 1.5,
              ),
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildPlayerCard(KeyPlayer player, {required bool isBatsman, required AppColorPalette colors}) {
    final playerColor = isBatsman ? colors.primary : colors.secondary;

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: colors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: colors.border),
        boxShadow: colors.cardShadow,
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: 20,
            backgroundColor: playerColor.withValues(alpha: colors.isDark ? 0.15 : 0.1),
            child: Icon(
              isBatsman ? Icons.sports_cricket : Icons.sports_baseball,
              color: playerColor,
              size: 20,
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  player.name,
                  style: TextStyle(
                    color: colors.textPrimary,
                    fontSize: 15,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Text(
                  isBatsman ? 'Top-Order / Key Run Scorer' : 'Prime Wicket Taker',
                  style: TextStyle(color: colors.textMuted, fontSize: 12),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: colors.surfaceLight.withValues(alpha: colors.isDark ? 0.5 : 0.8),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: colors.border, width: 0.8),
            ),
            child: Row(
              children: [
                Icon(Icons.star_rounded, size: 14, color: colors.secondary),
                const SizedBox(width: 4),
                Text(
                  '${player.rating}',
                  style: TextStyle(
                    color: colors.textPrimary,
                    fontWeight: FontWeight.bold,
                    fontSize: 13,
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
