import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../core/constants/app_constants.dart';
import '../models/match_model.dart';
import '../models/user_model.dart';

class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal();

  String _baseUrl = AppConstants.defaultBaseUrl;
  String? _token;

  String get baseUrl => _baseUrl;
  String? get token => _token;

  Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString(AppConstants.keyToken);
    final savedBaseUrl = prefs.getString(AppConstants.keyBaseUrl);
    if (savedBaseUrl != null &&
        savedBaseUrl.isNotEmpty &&
        !savedBaseUrl.contains('10.0.2.2') &&
        !savedBaseUrl.contains('192.168.') &&
        !savedBaseUrl.contains('localhost') &&
        !savedBaseUrl.contains('astrocircket-production')) {
      _baseUrl = savedBaseUrl;
    } else {
      _baseUrl = AppConstants.defaultBaseUrl;
    }
  }

  void setBaseUrl(String url) async {
    _baseUrl = url;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(AppConstants.keyBaseUrl, url);
  }

  void setToken(String? token) async {
    _token = token;
    final prefs = await SharedPreferences.getInstance();
    if (token != null) {
      await prefs.setString(AppConstants.keyToken, token);
    } else {
      await prefs.remove(AppConstants.keyToken);
    }
  }

  Map<String, String> _getHeaders() {
    final headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (_token != null && _token!.isNotEmpty) {
      headers['x-auth-token'] = _token!;
      headers['Authorization'] = 'Bearer $_token';
    }
    return headers;
  }

  // --- Matches & Insights API ---

  Future<List<MatchModel>> fetchMatches({String? status}) async {
    try {
      String endpoint = '$_baseUrl/api/insights/matches';
      if (status != null && status.isNotEmpty) {
        endpoint += '?status=$status';
      }

      final response = await http.get(
        Uri.parse(endpoint),
        headers: _getHeaders(),
      ).timeout(const Duration(seconds: 12));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['success'] == true && data['matches'] != null) {
          final List list = data['matches'];
          return list.map((m) => MatchModel.fromJson(m)).toList();
        }
      }
      return [];
    } catch (e) {
      // Return empty list on failure gracefully
      return [];
    }
  }

  Future<MatchModel?> fetchMatchDetails(String matchId) async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/api/insights/match/$matchId'),
        headers: _getHeaders(),
      ).timeout(const Duration(seconds: 12));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['success'] == true && data['match'] != null) {
          return MatchModel.fromJson(data['match']);
        }
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  // --- PhonePe Payment Gateway API (via sbastro.com In-App Browser) ---

  Future<Map<String, dynamic>> initiateWebsitePayment({
    required String matchId,
    required double amount,
    String? userId,
  }) async {
    try {
      final amountPaisa = (amount * 100).toInt();
      final response = await http.post(
        Uri.parse(AppConstants.paymentApiUrl),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'amount': amountPaisa,
          'userId': userId ?? 'app_user',
          'matchId': matchId,
          'planType': 'match_prediction',
        }),
      ).timeout(const Duration(seconds: 15));

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        return {'success': false, 'error': 'Failed to connect to payment gateway'};
      }
    } catch (e) {
      return {'success': false, 'error': 'Network error: $e'};
    }
  }

  Future<Map<String, dynamic>> verifyWebsitePayment({required String orderId}) async {
    try {
      final response = await http.post(
        Uri.parse(AppConstants.paymentVerifyUrl),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'orderId': orderId,
        }),
      ).timeout(const Duration(seconds: 15));

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      return {'success': false, 'error': 'Verification failed'};
    } catch (e) {
      return {'success': false, 'error': 'Network error: $e'};
    }
  }

  Future<Map<String, dynamic>> recordCompletedPurchase({
    required String matchId,
    required String orderId,
    required double amount,
    String? userId,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/api/insights/purchase/record-completed'),
        headers: _getHeaders(),
        body: jsonEncode({
          'matchId': matchId,
          'orderId': orderId,
          'amount': amount,
          'userId': userId,
        }),
      ).timeout(const Duration(seconds: 12));

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      return {'success': false, 'msg': 'Could not record purchase in database'};
    } catch (e) {
      return {'success': false, 'msg': 'Network error recording purchase'};
    }
  }

  Future<Map<String, dynamic>> initiatePayment(String matchId, {String mobileNumber = '9999999999'}) async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/api/insights/payment/initiate'),
        headers: _getHeaders(),
        body: jsonEncode({
          'matchId': matchId,
          'mobileNumber': mobileNumber,
        }),
      ).timeout(const Duration(seconds: 15));

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        final error = jsonDecode(response.body);
        return {'success': false, 'msg': error['msg'] ?? 'Payment initiation failed'};
      }
    } catch (e) {
      return {'success': false, 'msg': 'Network error initiating payment'};
    }
  }

  Future<Map<String, dynamic>> verifyPayment(String merchantTransactionId) async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/api/insights/payment/verify'),
        headers: _getHeaders(),
        body: jsonEncode({
          'merchantTransactionId': merchantTransactionId,
        }),
      ).timeout(const Duration(seconds: 15));

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      return {'success': false, 'msg': 'Payment verification failed'};
    } catch (e) {
      return {'success': false, 'msg': 'Network error verifying payment'};
    }
  }

  // --- Auth API ---

  Future<Map<String, dynamic>> login(String username, String password) async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/api/auth/login'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'username': username,
          'password': password,
        }),
      ).timeout(const Duration(seconds: 12));

      final data = jsonDecode(response.body);
      if (response.statusCode == 200 && data['token'] != null) {
        setToken(data['token']);
        return {'success': true, 'token': data['token'], 'role': data['role']};
      } else {
        return {'success': false, 'msg': data['msg'] ?? 'Invalid credentials'};
      }
    } catch (e) {
      return {'success': false, 'msg': 'Network error during login'};
    }
  }

  Future<Map<String, dynamic>> register(String username, String password) async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/api/auth/register'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'username': username,
          'password': password,
        }),
      ).timeout(const Duration(seconds: 12));

      final data = jsonDecode(response.body);
      if (response.statusCode == 201 || response.statusCode == 200) {
        return {'success': true, 'msg': data['msg']};
      } else {
        return {'success': false, 'msg': data['msg'] ?? 'Registration failed'};
      }
    } catch (e) {
      return {'success': false, 'msg': 'Network error during registration'};
    }
  }

  Future<Map<String, dynamic>> loginWithGoogle({
    required String idToken,
    String? email,
    String? displayName,
    String? photoUrl,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/api/auth/google'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'idToken': idToken,
          'email': email,
          'displayName': displayName,
          'photoUrl': photoUrl,
        }),
      ).timeout(const Duration(seconds: 15));

      final data = jsonDecode(response.body);
      if (response.statusCode == 200 && data['token'] != null) {
        setToken(data['token']);
        return {'success': true, 'token': data['token'], 'role': data['role']};
      } else {
        return {'success': false, 'msg': data['msg'] ?? 'Google authentication failed'};
      }
    } catch (e) {
      return {'success': false, 'msg': 'Network error during Google login'};
    }
  }

  Future<bool> saveFcmToken(String fcmToken) async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/api/auth/save-fcm-token'),
        headers: _getHeaders(),
        body: jsonEncode({
          'fcmToken': fcmToken,
          'platform': 'android',
        }),
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['success'] == true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  Future<UserModel?> getMe() async {
    try {
      if (_token == null) return null;
      final response = await http.get(
        Uri.parse('$_baseUrl/api/auth/me'),
        headers: _getHeaders(),
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return UserModel.fromJson(data);
      }
      return null;
    } catch (e) {
      return null;
    }
  }
}

