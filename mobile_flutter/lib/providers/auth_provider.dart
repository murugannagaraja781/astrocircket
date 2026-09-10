import 'package:flutter/foundation.dart';
import '../models/user_model.dart';
import '../services/api_service.dart';
import '../services/google_auth_service.dart';
import '../services/fcm_service.dart';

class AuthProvider with ChangeNotifier {
  final ApiService _apiService = ApiService();
  final GoogleAuthService _googleAuthService = GoogleAuthService();
  UserModel? _currentUser;
  bool _isLoading = false;
  String? _errorMessage;

  UserModel? get currentUser => _currentUser;
  bool get isAuthenticated => _currentUser != null || _apiService.token != null;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  Future<void> checkAuthStatus() async {
    _isLoading = true;
    notifyListeners();

    await _apiService.init();
    if (_apiService.token != null) {
      _currentUser = await _apiService.getMe();
      _syncFcmToken();
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<bool> login(String username, String password) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    final result = await _apiService.login(username, password);
    if (result['success']) {
      _currentUser = await _apiService.getMe();
      _syncFcmToken();
      _isLoading = false;
      notifyListeners();
      return true;
    } else {
      _errorMessage = result['msg'];
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> loginWithGoogle() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final googleAccount = await _googleAuthService.signIn();
      if (googleAccount == null) {
        _isLoading = false;
        notifyListeners();
        return false;
      }

      final googleAuth = await _googleAuthService.getAuthDetails(googleAccount);
      final idToken = googleAuth?.idToken;

      if (idToken == null) {
        _errorMessage = 'Could not obtain Google authentication token';
        _isLoading = false;
        notifyListeners();
        return false;
      }

      final result = await _apiService.loginWithGoogle(
        idToken: idToken,
        email: googleAccount.email,
        displayName: googleAccount.displayName,
        photoUrl: googleAccount.photoUrl,
      );

      if (result['success']) {
        _currentUser = await _apiService.getMe();
        _syncFcmToken();
        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        _errorMessage = result['msg'];
        _isLoading = false;
        notifyListeners();
        return false;
      }
    } catch (e) {
      _errorMessage = 'Google Sign-In failed: $e';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> register(String username, String password) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    final result = await _apiService.register(username, password);
    _isLoading = false;
    if (result['success']) {
      notifyListeners();
      return true;
    } else {
      _errorMessage = result['msg'];
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    _currentUser = null;
    _apiService.setToken(null);
    await _googleAuthService.signOut();
    notifyListeners();
  }

  void _syncFcmToken() async {
    try {
      final fcmToken = await FCMService().getDeviceToken();
      if (fcmToken != null) {
        await _apiService.saveFcmToken(fcmToken);
      }
    } catch (_) {}
  }
}

