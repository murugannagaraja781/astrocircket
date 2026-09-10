import 'package:flutter/foundation.dart';
import 'package:google_sign_in/google_sign_in.dart';

class GoogleAuthService {
  static final GoogleAuthService _instance = GoogleAuthService._internal();
  factory GoogleAuthService() => _instance;
  GoogleAuthService._internal();

  // Web Client ID from Firebase google-services.json for verifying ID tokens on backend
  static const String _serverClientId = '722820496843-i1vha1di714tnd5t7bu51ikdf10iuk1b.apps.googleusercontent.com';

  final GoogleSignIn _googleSignIn = GoogleSignIn(
    serverClientId: _serverClientId,
    scopes: ['email', 'profile'],
  );

  Future<GoogleSignInAccount?> signIn() async {
    try {
      final account = await _googleSignIn.signIn();
      return account;
    } catch (e) {
      if (kDebugMode) {
        print('❌ [GoogleSignIn Error]: $e');
      }
      return null;
    }
  }

  Future<GoogleSignInAuthentication?> getAuthDetails(GoogleSignInAccount account) async {
    try {
      return await account.authentication;
    } catch (e) {
      if (kDebugMode) {
        print('❌ [GoogleSignIn Auth Error]: $e');
      }
      return null;
    }
  }

  Future<void> signOut() async {
    try {
      await _googleSignIn.signOut();
    } catch (e) {
      if (kDebugMode) {
        print('❌ [GoogleSignOut Error]: $e');
      }
    }
  }
}
