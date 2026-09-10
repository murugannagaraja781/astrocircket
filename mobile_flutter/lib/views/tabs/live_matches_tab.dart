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

    return RefreshIndicator(
      onRefresh: () => matchProvider.fetchAllMatches(),
      color: AppColors.primary,
      backgroundColor: AppColors.surface,
      child: liveMatches.isEmpty
          ? Center(
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: AppColors.surfaceLight.withValues(alpha: 0.3),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.live_tv_rounded,
                        size: 48,
                        color: AppColors.textMuted,
                      ),
                    ),
                    const SizedBox(height: 16),
                    const Text(
                      'No Live Matches Right Now',
                      style: TextStyle(
                        color: AppColors.textPrimary,
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Check the Upcoming tab for upcoming match insights',
                      style: TextStyle(
                        color: AppColors.textSecondary,
                        fontSize: 13,
                      ),
                    ),
                  ],
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
