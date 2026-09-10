class AppConstants {
  static const String appName = 'AstroCricket Insights';
  static const String appTagline = 'KP Astrological Match Analysis & Player Analytics';

  // Backend API Base URL
  // Real device connects via PC Wi-Fi IP (192.168.1.3:5001)
  static const String defaultBaseUrl = 'http://192.168.1.3:5001';
  static const String productionBaseUrl = 'https://astrocircket-production.up.railway.app';

  // SharedPreferences Keys
  static const String keyToken = 'auth_token';
  static const String keyUser = 'user_data';
  static const String keyBaseUrl = 'custom_base_url';

  // Safe Terminology for Google Play Compliance
  static const String termMatchAnalysis = 'Match Analysis';
  static const String termAstroInsights = 'Astrological Insights';
  static const String termAdvantage = 'Astrological Edge';
  static const String termKeyPlayers = 'Key Impact Players';
}
