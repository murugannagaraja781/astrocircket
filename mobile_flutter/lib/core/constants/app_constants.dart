class AppConstants {
  static const String appName = 'AstroCricket Insights';
  static const String appTagline = 'KP Astrological Match Analysis & Player Analytics';

  // Backend API Base URL (Railway Production)
  static const String defaultBaseUrl = 'https://mindful-enchantment-production.up.railway.app';
  static const String productionBaseUrl = 'https://mindful-enchantment-production.up.railway.app';

  // Website Payment Gateway (sbastro.com PhonePe Integration)
  static const String paymentSiteUrl = 'https://sbastro.com';
  static const String paymentApiUrl = 'https://sbastro.com/app/payment_api.php';
  static const String paymentVerifyUrl = 'https://sbastro.com/app/verify_payment.php';

  // SharedPreferences Keys
  static const String keyToken = 'auth_token';
  static const String keyUser = 'user_data';
  static const String keyBaseUrl = 'custom_base_url';

  // Safe Terminology for Google Play Compliance
  static const String termMatchAnalysis = 'Match Analysis';
  static const String termAstroInsights = 'Astrological Insights';
  static const String termAdvantage = 'Planetary Influences';
  static const String termKeyPlayers = 'Key Impact Players';
  static const String disclaimerText =
      'Astrological interpretations are for entertainment and informational purposes only and are not a guarantee of match outcomes. No real-money gambling or betting is provided.';
}
