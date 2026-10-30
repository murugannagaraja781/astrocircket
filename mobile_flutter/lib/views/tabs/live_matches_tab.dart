import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../providers/match_provider.dart';
import '../widgets/match_card.dart';
import '../match_details/match_insights_screen.dart';

class LiveMatchesTab extends StatelessWidget {
  const LiveMatchesTab({super.key});

  @override
  Widget build(BuildContext context) {
    final matchProvider = Provider.of<MatchProvider>(context);
    final liveMatches = matchProvider.liveMatches;
    final colors = context.colors;

    return RefreshIndicator(
      onRefresh: () => matchProvider.fetchAllMatches(),
      color: colors.primary,
      backgroundColor: colors.surface,
      child: liveMatches.isEmpty
          ? Center(
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                child: Padding(
                  padding: const EdgeInsets.all(24.0),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(22),
                        decoration: BoxDecoration(
                          color: colors.surfaceLight.withValues(alpha: colors.isDark ? 0.35 : 0.6),
                          shape: BoxShape.circle,
                          border: Border.all(color: colors.border),
                        ),
                        child: Icon(
                          matchProvider.onlyPredicted ? Icons.auto_awesome : Icons.live_tv_rounded,
                          size: 48,
                          color: matchProvider.onlyPredicted ? Colors.amber : colors.textMuted,
                        ),
                      ),
                      const SizedBox(height: 18),
                      Text(
                        matchProvider.onlyPredicted
                            ? 'No Live Predicted Matches'
                            : 'No Live Matches Right Now',
                        style: TextStyle(
                          color: colors.textPrimary,
                          fontSize: 17,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        matchProvider.onlyPredicted
                            ? 'No active predictions for currently live matches. Check Upcoming or switch to All Matches.'
                            : 'Check the Upcoming tab for upcoming match insights',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: colors.textSecondary,
                          fontSize: 13,
                        ),
                      ),
                      if (matchProvider.onlyPredicted) ...[
                        const SizedBox(height: 14),
                        OutlinedButton.icon(
                          onPressed: () => matchProvider.setOnlyPredicted(false),
                          icon: const Icon(Icons.refresh_rounded, size: 16),
                          label: const Text('View All Live Matches'),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: colors.primary,
                            side: BorderSide(color: colors.primary.withValues(alpha: 0.5)),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            )
          : ListView.builder(
              padding: const EdgeInsets.symmetric(vertical: 8),
              itemCount: liveMatches.length,
              itemBuilder: (context, index) {
                final match = liveMatches[index];
                return MatchCard(
                  match: match,
                  onTap: () {
                    matchProvider.selectMatch(match);
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => MatchInsightsScreen(match: match),
                      ),
                    );
                  },
                );
              },
            ),
    );
  }
}
