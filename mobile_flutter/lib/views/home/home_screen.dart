import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_constants.dart';
import '../../providers/match_provider.dart';
import '../../providers/theme_provider.dart';
import '../tabs/live_matches_tab.dart';
import '../tabs/upcoming_matches_tab.dart';
import '../tabs/finished_matches_tab.dart';
import '../profile/profile_screen.dart';
import '../../services/fcm_service.dart';

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
      provider.startAutoRefresh(intervalSeconds: 15);

      FCMService().onDataNotificationReceived = (data) {
        provider.updateMatchFromNotification(data);
        provider.fetchAllMatches(silent: true);
      };
    });
  }

  @override
  void dispose() {
    try {
      final provider = Provider.of<MatchProvider>(context, listen: false);
      provider.stopAutoRefresh();
    } catch (_) {}
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final matchProvider = Provider.of<MatchProvider>(context);
    final themeProvider = Provider.of<ThemeProvider>(context);
    final colors = context.colors;
    final isDark = context.isDarkMode;

    return Scaffold(
      appBar: _bottomNavIndex == 0
          ? AppBar(
              title: Row(
                children: [
                  Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: Colors.amber.withValues(alpha: 0.25),
                          blurRadius: 8,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: ClipOval(
                      child: Image.asset(
                        'assets/images/app_logo.png',
                        fit: BoxFit.cover,
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        AppConstants.appName,
                        style: TextStyle(
                          fontSize: 17,
                          fontWeight: FontWeight.bold,
                          color: colors.textPrimary,
                        ),
                      ),
                      Text(
                        'KP Match Analysis & Player Insights',
                        style: TextStyle(fontSize: 10, color: colors.textSecondary),
                      ),
                    ],
                  ),
                ],
              ),
              actions: [
                // Quick Theme Toggle (Sun / Moon)
                Tooltip(
                  message: isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode',
                  child: IconButton(
                    icon: AnimatedSwitcher(
                      duration: const Duration(milliseconds: 300),
                      transitionBuilder: (child, anim) => RotationTransition(
                        turns: anim,
                        child: ScaleTransition(scale: anim, child: child),
                      ),
                      child: Icon(
                        isDark ? Icons.light_mode_rounded : Icons.dark_mode_rounded,
                        key: ValueKey<bool>(isDark),
                        color: isDark ? Colors.amber : colors.textPrimary,
                        size: 22,
                      ),
                    ),
                    onPressed: () => themeProvider.toggleTheme(context),
                  ),
                ),
                IconButton(
                  icon: Icon(Icons.refresh_rounded, color: colors.textPrimary),
                  tooltip: 'Refresh matches',
                  onPressed: () => matchProvider.fetchAllMatches(),
                ),
                const SizedBox(width: 4),
              ],
              bottom: PreferredSize(
                preferredSize: const Size.fromHeight(56),
                child: Container(
                  margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                  padding: const EdgeInsets.all(4),
                  decoration: BoxDecoration(
                    color: colors.surface,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: colors.border),
                    boxShadow: [
                      BoxShadow(
                        color: isDark ? Colors.black.withValues(alpha: 0.2) : Colors.black.withValues(alpha: 0.04),
                        blurRadius: 8,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: TabBar(
                    controller: _tabController,
                    indicatorSize: TabBarIndicatorSize.tab,
                    dividerColor: Colors.transparent,
                    indicator: BoxDecoration(
                      color: colors.primary,
                      borderRadius: BorderRadius.circular(12),
                      boxShadow: [
                        BoxShadow(
                          color: colors.primary.withValues(alpha: 0.3),
                          blurRadius: 6,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    labelColor: isDark ? const Color(0xFF0F172A) : Colors.white,
                    unselectedLabelColor: colors.textSecondary,
                    labelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                    tabs: [
                      Tab(
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            if (matchProvider.liveMatches.isNotEmpty) ...[
                              Container(
                                width: 7,
                                height: 7,
                                decoration: BoxDecoration(
                                  color: colors.accentRed,
                                  shape: BoxShape.circle,
                                ),
                              ),
                              const SizedBox(width: 5),
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
              title: Text('My Account', style: TextStyle(color: colors.textPrimary)),
              actions: [
                IconButton(
                  icon: Icon(
                    isDark ? Icons.light_mode_rounded : Icons.dark_mode_rounded,
                    color: isDark ? Colors.amber : colors.textPrimary,
                    size: 22,
                  ),
                  tooltip: isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode',
                  onPressed: () => themeProvider.toggleTheme(context),
                ),
              ],
            ),
      body: IndexedStack(
        index: _bottomNavIndex,
        children: [
          Column(
            children: [
              _buildFilterSection(matchProvider, colors),
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
        decoration: BoxDecoration(
          color: colors.surface,
          border: Border(top: BorderSide(color: colors.border, width: 1)),
          boxShadow: [
            BoxShadow(
              color: isDark ? Colors.black.withValues(alpha: 0.25) : Colors.black.withValues(alpha: 0.05),
              blurRadius: 10,
              offset: const Offset(0, -2),
            ),
          ],
        ),
        child: BottomNavigationBar(
          currentIndex: _bottomNavIndex,
          onTap: (index) => setState(() => _bottomNavIndex = index),
          backgroundColor: colors.surface,
          selectedItemColor: colors.primary,
          unselectedItemColor: colors.textMuted,
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

  Widget _buildFilterSection(MatchProvider matchProvider, AppColorPalette colors) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: colors.surface.withValues(alpha: 0.5),
        border: Border(bottom: BorderSide(color: colors.border, width: 0.8)),
      ),
      child: Column(
        children: [
          // Row 1: Category (All, Men, Women)
          Row(
            children: [
              SizedBox(
                width: 62,
                child: Text(
                  'Category',
                  style: TextStyle(
                    color: colors.textMuted,
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
                      _buildChip('All', matchProvider.selectedGender == 'all', () => matchProvider.setGenderFilter('all'), colors),
                      const SizedBox(width: 6),
                      _buildChip('Men', matchProvider.selectedGender == 'men', () => matchProvider.setGenderFilter('men'), colors),
                      const SizedBox(width: 6),
                      _buildChip('Women', matchProvider.selectedGender == 'women', () => matchProvider.setGenderFilter('women'), colors),
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
              SizedBox(
                width: 62,
                child: Text(
                  'Format',
                  style: TextStyle(
                    color: colors.textMuted,
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
                      _buildChip('All', matchProvider.selectedFormat == 'all', () => matchProvider.setFormatFilter('all'), colors),
                      const SizedBox(width: 6),
                      _buildChip('T20', matchProvider.selectedFormat == 't20', () => matchProvider.setFormatFilter('t20'), colors),
                      const SizedBox(width: 6),
                      _buildChip('ODI', matchProvider.selectedFormat == 'odi', () => matchProvider.setFormatFilter('odi'), colors),
                      const SizedBox(width: 6),
                      _buildChip('Test', matchProvider.selectedFormat == 'test', () => matchProvider.setFormatFilter('test'), colors),
                    ],
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          // Row 3: Insights filter (All Matches, ✨ Astro Predicted)
          Row(
            children: [
              SizedBox(
                width: 62,
                child: Text(
                  'Insights',
                  style: TextStyle(
                    color: colors.textMuted,
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
                      _buildChip(
                        'All Matches',
                        !matchProvider.onlyPredicted,
                        () => matchProvider.setOnlyPredicted(false),
                        colors,
                      ),
                      const SizedBox(width: 6),
                      _buildAstroFilterChip(
                        '✨ Astro Predicted',
                        matchProvider.onlyPredicted,
                        () => matchProvider.setOnlyPredicted(!matchProvider.onlyPredicted),
                        colors,
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

  Widget _buildAstroFilterChip(String label, bool isSelected, VoidCallback onTap, AppColorPalette colors) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        curve: Curves.easeInOut,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
        decoration: BoxDecoration(
          color: isSelected
              ? const Color(0xFFF59E0B)
              : (colors.isDark ? const Color(0xFF78350F).withValues(alpha: 0.3) : const Color(0xFFFEF3C7)),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected
                ? const Color(0xFFD97706)
                : (colors.isDark ? const Color(0xFFF59E0B).withValues(alpha: 0.5) : const Color(0xFFFBBF24)),
            width: isSelected ? 1.5 : 1,
          ),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: const Color(0xFFF59E0B).withValues(alpha: 0.35),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ]
              : null,
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              label,
              style: TextStyle(
                color: isSelected
                    ? Colors.white
                    : (colors.isDark ? const Color(0xFFFBBF24) : const Color(0xFF92400E)),
                fontSize: 11,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildChip(String label, bool isSelected, VoidCallback onTap, AppColorPalette colors) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        curve: Curves.easeInOut,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
        decoration: BoxDecoration(
          color: isSelected
              ? colors.primary.withValues(alpha: colors.isDark ? 0.2 : 0.12)
              : colors.surfaceLight.withValues(alpha: colors.isDark ? 0.35 : 0.5),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? colors.primary : colors.border,
            width: isSelected ? 1.4 : 1,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isSelected ? colors.primary : colors.textSecondary,
            fontSize: 11,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
          ),
        ),
      ),
    );
  }
}
