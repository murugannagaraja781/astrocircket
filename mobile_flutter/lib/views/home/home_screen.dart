import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_constants.dart';
import '../../providers/match_provider.dart';
import '../tabs/live_matches_tab.dart';
import '../tabs/upcoming_matches_tab.dart';
import '../tabs/finished_matches_tab.dart';
import '../profile/profile_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  int _bottomNavIndex = 0;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      final provider = Provider.of<MatchProvider>(context, listen: false);
      await provider.loadCachedMatches();
      provider.fetchAllMatches(silent: provider.liveMatches.isNotEmpty || provider.upcomingMatches.isNotEmpty);
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final matchProvider = Provider.of<MatchProvider>(context);

    return Scaffold(
      appBar: _bottomNavIndex == 0
          ? AppBar(
              title: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(6),
                    decoration: BoxDecoration(
                      color: AppColors.primary.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(Icons.auto_awesome, color: AppColors.primary, size: 20),
                  ),
                  const SizedBox(width: 10),
                  const Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        AppConstants.appName,
                        style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold),
                      ),
                      Text(
                        'KP Match Analysis & Player Insights',
                        style: TextStyle(fontSize: 10, color: AppColors.textSecondary),
                      ),
                    ],
                  ),
                ],
              ),
              actions: [
                IconButton(
                  icon: const Icon(Icons.refresh),
                  onPressed: () => matchProvider.fetchAllMatches(),
                ),
              ],
              bottom: PreferredSize(
                preferredSize: const Size.fromHeight(56),
                child: Container(
                  margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                  padding: const EdgeInsets.all(4),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: TabBar(
                    controller: _tabController,
                    indicatorSize: TabBarIndicatorSize.tab,
                    dividerColor: Colors.transparent,
                    indicator: BoxDecoration(
                      color: AppColors.primary,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    labelColor: const Color(0xFF0F172A),
                    unselectedLabelColor: AppColors.textSecondary,
                    labelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                    tabs: [
                      Tab(
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            if (matchProvider.liveMatches.isNotEmpty) ...[
                              Container(
                                width: 6,
                                height: 6,
                                decoration: const BoxDecoration(
                                  color: AppColors.accentRed,
                                  shape: BoxShape.circle,
                                ),
                              ),
                              const SizedBox(width: 4),
                            ],
                            const Text('Live'),
                          ],
                        ),
                      ),
                      const Tab(text: 'Upcoming'),
                      const Tab(text: 'Finished'),
                    ],
                  ),
                ),
              ),
            )
          : AppBar(
              title: const Text('My Account'),
            ),
      body: IndexedStack(
        index: _bottomNavIndex,
        children: [
          Column(
            children: [
              _buildFilterSection(matchProvider),
              Expanded(
                child: TabBarView(
                  controller: _tabController,
                  children: const [
                    LiveMatchesTab(),
                    UpcomingMatchesTab(),
                    FinishedMatchesTab(),
                  ],
                ),
              ),
            ],
          ),
          const ProfileScreen(isEmbedded: true),
        ],
      ),
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          color: AppColors.surface,
          border: Border(top: BorderSide(color: AppColors.border, width: 1)),
        ),
        child: BottomNavigationBar(
          currentIndex: _bottomNavIndex,
          onTap: (index) => setState(() => _bottomNavIndex = index),
          backgroundColor: AppColors.surface,
          selectedItemColor: AppColors.primary,
          unselectedItemColor: AppColors.textMuted,
          elevation: 0,
          items: const [
            BottomNavigationBarItem(
              icon: Icon(Icons.sports_cricket),
              label: 'Match Insights',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.person_outline),
              label: 'Account',
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFilterSection(MatchProvider matchProvider) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: AppColors.surface.withValues(alpha: 0.4),
        border: const Border(bottom: BorderSide(color: AppColors.border, width: 0.8)),
      ),
      child: Column(
        children: [
          // Row 1: Category (All, Men, Women)
          Row(
            children: [
              const SizedBox(
                width: 62,
                child: Text(
                  'Category',
                  style: TextStyle(
                    color: AppColors.textMuted,
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              Expanded(
                child: SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      _buildChip('All', matchProvider.selectedGender == 'all', () => matchProvider.setGenderFilter('all')),
                      const SizedBox(width: 6),
                      _buildChip('Men', matchProvider.selectedGender == 'men', () => matchProvider.setGenderFilter('men')),
                      const SizedBox(width: 6),
                      _buildChip('Women', matchProvider.selectedGender == 'women', () => matchProvider.setGenderFilter('women')),
                    ],
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          // Row 2: Format (All, T20, ODI, Test)
          Row(
            children: [
              const SizedBox(
                width: 62,
                child: Text(
                  'Format',
                  style: TextStyle(
                    color: AppColors.textMuted,
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              Expanded(
                child: SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      _buildChip('All', matchProvider.selectedFormat == 'all', () => matchProvider.setFormatFilter('all')),
                      const SizedBox(width: 6),
                      _buildChip('T20', matchProvider.selectedFormat == 't20', () => matchProvider.setFormatFilter('t20')),
                      const SizedBox(width: 6),
                      _buildChip('ODI', matchProvider.selectedFormat == 'odi', () => matchProvider.setFormatFilter('odi')),
                      const SizedBox(width: 6),
                      _buildChip('Test', matchProvider.selectedFormat == 'test', () => matchProvider.setFormatFilter('test')),
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

  Widget _buildChip(String label, bool isSelected, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primary.withValues(alpha: 0.18) : AppColors.surface,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? AppColors.primary : AppColors.border,
            width: isSelected ? 1.4 : 1,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isSelected ? AppColors.primary : AppColors.textSecondary,
            fontSize: 11,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
          ),
        ),
      ),
    );
  }
}
