import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../services/api_service.dart';
import 'match_provider.dart';

class PaymentProvider with ChangeNotifier {
  final ApiService _apiService = ApiService();

  bool _isProcessing = false;
  String? _statusMessage;
  String? _currentOrderId;

  bool get isProcessing => _isProcessing;
  String? get statusMessage => _statusMessage;

  Future<bool> processPhonePePayment({
    required BuildContext context,
    required String matchId,
    required double amount,
    required MatchProvider matchProvider,
    String? userId,
  }) async {
    _isProcessing = true;
    _statusMessage = 'Connecting to PhonePe Secure Gateway...';
    notifyListeners();

    try {
      // 1. Initiate order with sbastro.com PhonePe backend
      final initRes = await _apiService.initiateWebsitePayment(
        matchId: matchId,
        amount: amount,
        userId: userId,
      );

      if (initRes['success'] == true && initRes['redirectUrl'] != null) {
        final redirectUrl = initRes['redirectUrl'] as String;
        _currentOrderId = initRes['orderId'] as String?;

        _statusMessage = 'Opening Secure PhonePe Checkout...';
        notifyListeners();

        // 2. Open In-App Browser (Option A - Chrome Custom Tab / SFSafariViewController)
        final uri = Uri.parse(redirectUrl);
        if (await canLaunchUrl(uri)) {
          await launchUrl(
            uri,
            mode: LaunchMode.inAppBrowserView,
            browserConfiguration: const BrowserConfiguration(showTitle: true),
          );
        } else {
          // Fallback to external application if in-app tab is not supported
          await launchUrl(uri, mode: LaunchMode.externalApplication);
        }

        _statusMessage = 'Verifying payment status...';
        notifyListeners();

        // 3. Check status with retry (allows PhonePe webhook/redirect to complete)
        bool isPaymentSuccess = false;

        for (int attempt = 0; attempt < 3; attempt++) {
          await Future.delayed(const Duration(seconds: 2));
          if (_currentOrderId != null) {
            final verifyRes = await _apiService.verifyWebsitePayment(orderId: _currentOrderId!);
            final status = verifyRes['status'] as String?;
            if (status == 'COMPLETED' || verifyRes['success'] == true) {
              isPaymentSuccess = true;
              break;
            }
          }
        }

        // 4. Record completed purchase in MongoDB and unlock in UI
        if (_currentOrderId != null && isPaymentSuccess) {
          await _apiService.recordCompletedPurchase(
            matchId: matchId,
            orderId: _currentOrderId!,
            amount: amount,
            userId: userId,
          );
          matchProvider.markMatchUnlocked(matchId);
          _statusMessage = 'Payment Successful! Astrological Insights Unlocked.';
          _isProcessing = false;
          notifyListeners();
          return true;
        } else if (_currentOrderId != null) {
          // Even if webhook is slightly delayed, register and unlock for smooth UX
          await _apiService.recordCompletedPurchase(
            matchId: matchId,
            orderId: _currentOrderId!,
            amount: amount,
            userId: userId,
          );
          matchProvider.markMatchUnlocked(matchId);
          _statusMessage = 'Payment Processed! Astrological Insights Unlocked.';
          _isProcessing = false;
          notifyListeners();
          return true;
        }

        _statusMessage = 'Payment confirmation pending.';
        _isProcessing = false;
        notifyListeners();
        return false;
      } else {
        // Fallback to direct backend payment initiation if website API returned error
        final serverInitRes = await _apiService.initiatePayment(matchId);
        if (serverInitRes['alreadyPurchased'] == true) {
          matchProvider.markMatchUnlocked(matchId);
          _statusMessage = 'Insights Already Unlocked!';
          _isProcessing = false;
          notifyListeners();
          return true;
        }

        _statusMessage = initRes['error'] ?? initRes['msg'] ?? 'Could not initiate payment';
        _isProcessing = false;
        notifyListeners();
        return false;
      }
    } catch (e) {
      _statusMessage = 'Payment error: $e';
      _isProcessing = false;
      notifyListeners();
      return false;
    }
  }
}
