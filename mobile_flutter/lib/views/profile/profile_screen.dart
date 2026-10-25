import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../providers/auth_provider.dart';
import '../../providers/theme_provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../auth/login_screen.dart';

class ProfileScreen extends StatefulWidget {
  final bool isEmbedded;
  const ProfileScreen({super.key, this.isEmbedded = false});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final themeProvider = Provider.of<ThemeProvider>(context);
    final colors = context.colors;
    final user = authProvider.currentUser;

    final content = SingleChildScrollView(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // User Card
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: colors.surface,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: colors.border),
              boxShadow: colors.cardShadow,
            ),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 32,
                  backgroundColor: colors.primary.withValues(alpha: colors.isDark ? 0.2 : 0.12),
                  child: Text(
                    (user?.username.isNotEmpty == true) ? user!.username[0].toUpperCase() : 'U',
                    style: TextStyle(
                      fontSize: 26,
                      color: colors.primary,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        user?.username ?? 'Guest User',
                        style: TextStyle(
                          color: colors.textPrimary,
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        user != null ? 'Role: ${user.role.toUpperCase()}' : 'Sign in to unlock & sync insights',
                        style: TextStyle(color: colors.textSecondary, fontSize: 12),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Appearance / Theme Card
          Text(
            'APPEARANCE',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.bold,
              letterSpacing: 0.8,
              color: colors.textMuted,
            ),
          ),
          const SizedBox(height: 8),
          Container(
            decoration: BoxDecoration(
              color: colors.surface,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: colors.border),
              boxShadow: colors.cardShadow,
            ),
            child: Column(
              children: [
                _buildThemeTile(
                  title: 'Light Mode',
                  subtitle: 'Crisp, clean & bright design',
                  icon: Icons.light_mode_rounded,
                  iconColor: Colors.orange,
                  isSelected: themeProvider.themeMode == ThemeMode.light,
                  onTap: () => themeProvider.setThemeMode(ThemeMode.light),
                  colors: colors,
                ),
                Divider(color: colors.border, height: 1),
                _buildThemeTile(
                  title: 'Dark Mode',
                  subtitle: 'High contrast slate & glowing accents',
                  icon: Icons.dark_mode_rounded,
                  iconColor: Colors.amber,
                  isSelected: themeProvider.themeMode == ThemeMode.dark,
                  onTap: () => themeProvider.setThemeMode(ThemeMode.dark),
                  colors: colors,
                ),
                Divider(color: colors.border, height: 1),
                _buildThemeTile(
                  title: 'System Default',
                  subtitle: 'Matches your phone system theme',
                  icon: Icons.brightness_auto_rounded,
                  iconColor: colors.primary,
                  isSelected: themeProvider.themeMode == ThemeMode.system,
                  onTap: () => themeProvider.setThemeMode(ThemeMode.system),
                  colors: colors,
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // App Info Card
          Text(
            'ABOUT APP',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.bold,
              letterSpacing: 0.8,
              color: colors.textMuted,
            ),
          ),
          const SizedBox(height: 8),
          Container(
            decoration: BoxDecoration(
              color: colors.surface,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: colors.border),
              boxShadow: colors.cardShadow,
            ),
            child: Column(
              children: [
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('App Version', style: TextStyle(color: colors.textSecondary)),
                      Text(
                        '1.0.0',
                        style: TextStyle(color: colors.textPrimary, fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                ),
                Divider(color: colors.border, height: 1),
                ListTile(
                  leading: Icon(Icons.privacy_tip_outlined, color: colors.primary, size: 20),
                  title: Text(
                    'Privacy Policy',
                    style: TextStyle(color: colors.textPrimary, fontSize: 14, fontWeight: FontWeight.w600),
                  ),
                  trailing: Icon(Icons.arrow_forward_ios_rounded, size: 14, color: colors.textMuted),
                  onTap: () async {
                    final uri = Uri.parse('https://sbastro.com/privacy-policy');
                    if (await canLaunchUrl(uri)) {
                      await launchUrl(uri, mode: LaunchMode.externalApplication);
                    }
                  },
                ),
                if (user != null) ...[
                  Divider(color: colors.border, height: 1),
                  ListTile(
                    leading: Icon(Icons.delete_forever_outlined, color: colors.accentRed, size: 20),
                    title: Text(
                      'Delete Account & Data',
                      style: TextStyle(color: colors.accentRed, fontSize: 14, fontWeight: FontWeight.w600),
                    ),
                    trailing: Icon(Icons.arrow_forward_ios_rounded, size: 14, color: colors.textMuted),
                    onTap: () => _showDeleteAccountDialog(context, colors),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(height: 32),

          // Logout / Login Action Button
          SizedBox(
            width: double.infinity,
            child: user != null
                ? OutlinedButton.icon(
                    style: OutlinedButton.styleFrom(
                      foregroundColor: colors.accentRed,
                      side: BorderSide(color: colors.accentRed),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    icon: const Icon(Icons.logout),
                    label: const Text('Logout', style: TextStyle(fontWeight: FontWeight.bold)),
                    onPressed: () async {
                      final navigator = Navigator.of(context);
                      await authProvider.logout();
                      navigator.pushReplacement(
                        MaterialPageRoute(builder: (_) => const LoginScreen()),
                      );
                    },
                  )
                : ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: colors.primary,
                      foregroundColor: colors.isDark ? const Color(0xFF0F172A) : Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => const LoginScreen()),
                      );
                    },
                    child: const Text('Login / Sign In', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                  ),
          ),
        ],
      ),
    );

    if (widget.isEmbedded) {
      return content;
    }

    return Scaffold(
      appBar: AppBar(title: const Text('My Account')),
      body: content,
    );
  }

  Widget _buildThemeTile({
    required String title,
    required String subtitle,
    required IconData icon,
    required Color iconColor,
    required bool isSelected,
    required VoidCallback onTap,
    required AppColorPalette colors,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: iconColor.withValues(alpha: colors.isDark ? 0.2 : 0.12),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon, color: iconColor, size: 20),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      color: colors.textPrimary,
                      fontWeight: FontWeight.w600,
                      fontSize: 14,
                    ),
                  ),
                  Text(
                    subtitle,
                    style: TextStyle(
                      color: colors.textMuted,
                      fontSize: 11,
                    ),
                  ),
                ],
              ),
            ),
            if (isSelected)
              Icon(Icons.check_circle_rounded, color: colors.primary, size: 20)
            else
              Container(
                width: 18,
                height: 18,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(color: colors.border, width: 1.5),
                ),
              ),
          ],
        ),
      ),
    );
  }

  void _showDeleteAccountDialog(BuildContext context, AppColorPalette colors) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: colors.surface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Row(
          children: [
            Icon(Icons.warning_amber_rounded, color: colors.accentRed, size: 24),
            const SizedBox(width: 8),
            Text(
              'Delete Account & Data',
              style: TextStyle(color: colors.textPrimary, fontSize: 18, fontWeight: FontWeight.bold),
            ),
          ],
        ),
        content: Text(
          'In accordance with our Data Retention Policy, requesting account deletion will permanently remove your login credentials, email address, push notification tokens, and all personal preferences within 15 to 30 days.\n\nTo proceed, tap "Email Support" to send an Account Deletion Request from your registered email address.',
          style: TextStyle(color: colors.textSecondary, fontSize: 13, height: 1.45),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text('Cancel', style: TextStyle(color: colors.textMuted)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: colors.accentRed,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            onPressed: () async {
              Navigator.pop(ctx);
              final emailUri = Uri.parse(
                'mailto:support@sbastro.com?subject=Account%20Deletion%20Request&body=Please%20permanently%20delete%20my%20account%20and%20all%20associated%20personal%20data.',
              );
              if (await canLaunchUrl(emailUri)) {
                await launchUrl(emailUri);
              }
            },
            child: const Text('Email Support', style: TextStyle(fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }
}
