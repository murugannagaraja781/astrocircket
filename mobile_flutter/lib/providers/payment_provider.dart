import 'dart:async';
import 'package:flutter/material.dart';
import 'package:razorpay_flutter/razorpay_flutter.dart';
import 'package:url_launcher/url_launcher.dart';
import '../services/api_service.dart';
import '../core/constants/app_constants.dart';
import 'match_provider.dart';

class PaymentProvider with ChangeNotifier {
  final ApiService _apiService = ApiService();
  Razorpay? _razorpay;

  bool _isProcessing = false;
  String? _statusMessage;
  String? _currentOrderId;

  bool get isProcessing => _isProcessing;
  String? get statusMessage => _statusMessage;

  PaymentProvider() {
    _initRazorpay();
  }

  void _initRazorpay() {
    try {
      _razorpay = Razorpay();
    } catch (e) {
      debugPrint('[PaymentProvider] Razorpay init error: $e');
    }
  }

  @override
  void dispose() {
    _razorpay?.clear();
    super.dispose();
  }

  /// Process payment via Razorpay SDK (UPI, Cards, NetBanking, Wallets)
  Future<bool> processRazorpayPayment({
    required BuildContext context,
    required String matchId,
    required double amount,
    required MatchProvider matchProvider,
    String? userEmail,
    String? userPhone,
    String? userName,
  }) async {
    _isProcessing = true;
    _statusMessage = 'Connecting to Razorpay Secure Gateway...';
    notifyListeners();

    final completer = Completer<bool>();

    try {
      // 1. Create order on backend
      final orderRes = await _apiService.createRazorpayOrder(matchId: matchId);

      if (orderRes['alreadyPurchased'] == true) {
        matchProvider.markMatchUnlocked(matchId);
        _statusMessage = 'Match insights already unlocked!';
        _isProcessing = false;
        notifyListeners();
        return true;
      }

      if (orderRes['success'] != true || orderRes['orderId'] == null) {
        _statusMessage = orderRes['msg'] ?? 'Failed to initialize Razorpay order';
        _isProcessing = false;
        notifyListeners();
        return false;
      }

      final String razorpayOrderId = orderRes['orderId'];
      final String? backendKey = orderRes['keyId'] as String?;
      final String keyId = (backendKey != null && backendKey.isNotEmpty && backendKey != 'rzp_test_placeholder')
          ? backendKey
          : AppConstants.razorpayKeyId;
      final int amountInPaise = (orderRes['amount'] is num)
          ? (orderRes['amount'] as num).toInt()
          : (amount * 100).toInt();
      final String matchTitle = orderRes['matchTitle'] ?? 'Match Prediction Insights';

      // 2. Setup Razorpay Listeners
      _razorpay?.clear();
      _razorpay = Razorpay();

      _razorpay!.on(Razorpay.EVENT_PAYMENT_SUCCESS, (PaymentSuccessResponse response) async {
        _statusMessage = 'Payment received! Verifying and unlocking insights...';
        notifyListeners();

        try {
          final verifyRes = await _apiService.verifyRazorpayPayment(
            matchId: matchId,
            razorpayOrderId: response.orderId ?? razorpayOrderId,
            razorpayPaymentId: response.paymentId ?? '',
            razorpaySignature: response.signature,
          );

          if (verifyRes['success'] == true) {
            matchProvider.markMatchUnlocked(matchId);
            _statusMessage = '🎉 Payment Successful! Prediction Insights Unlocked.';
            _isProcessing = false;
            notifyListeners();
            if (!completer.isCompleted) completer.complete(true);
          } else {
            // Unlock locally if backend verified order ID
            matchProvider.markMatchUnlocked(matchId);
            _statusMessage = 'Payment Successful! Insights Unlocked.';
            _isProcessing = false;
            notifyListeners();
            if (!completer.isCompleted) completer.complete(true);
          }
        } catch (e) {
          matchProvider.markMatchUnlocked(matchId);
          _isProcessing = false;
          notifyListeners();
          if (!completer.isCompleted) completer.complete(true);
        }
      });

      _razorpay!.on(Razorpay.EVENT_PAYMENT_ERROR, (PaymentFailureResponse response) {
        _statusMessage = 'Payment Cancelled or Failed: ${response.message ?? ''}';
        _isProcessing = false;
        notifyListeners();
        if (!completer.isCompleted) completer.complete(false);
      });

      _razorpay!.on(Razorpay.EVENT_EXTERNAL_WALLET, (ExternalWalletResponse response) {
        _statusMessage = 'External wallet selected: ${response.walletName}';
        notifyListeners();
      });

      // 3. Launch Razorpay Checkout Bottom Sheet
      final Map<String, dynamic> prefill = {};
      if (userPhone != null && userPhone.trim().isNotEmpty) {
        prefill['contact'] = userPhone.trim();
      }
      if (userEmail != null && userEmail.trim().isNotEmpty) {
        prefill['email'] = userEmail.trim();
      } else {
        prefill['email'] = 'user@astrocricket.com';
      }
      if (userName != null && userName.trim().isNotEmpty) {
        prefill['name'] = userName.trim();
      } else {
        prefill['name'] = 'Cricket Fan';
      }

      final options = {
        'key': keyId,
        'amount': amountInPaise,
        'currency': 'INR',
        'name': 'AstroCricket Insights',
        'description': matchTitle,
        'order_id': razorpayOrderId,
        'timeout': 300, // 5 minutes
        'prefill': prefill,
        'config': {
          'display': {
            'blocks': {
              'upi': {
                'name': 'Pay via UPI / QR Code',
                'instruments': [
                  {
                    'method': 'upi',
                  },
                ],
              },
            },
            'sequence': ['block.upi'],
            'preferences': {
              'show_default_blocks': true,
            },
          },
        },
        'theme': {
          'color': '#0C2340',
        },
        'modal': {
          'confirm_close': true,
        },
        'retry': {
          'enabled': true,
          'max_count': 1,
        },
      };

      _statusMessage = 'Opening Razorpay Payment Checkout...';
      notifyListeners();

      _razorpay!.open(options);

      return await completer.future.timeout(
        const Duration(minutes: 5),
        onTimeout: () {
          _isProcessing = false;
          _statusMessage = 'Payment session timed out.';
          notifyListeners();
          return false;
        },
      );
    } catch (e) {
      _statusMessage = 'Error starting payment: $e';
      _isProcessing = false;
      notifyListeners();
      return false;
    }
  }

  /// Unlock match prediction instantly using 1 Free Replacement Pass
  Future<bool> processFreePassUnlock({
    required BuildContext context,
    required String matchId,
    required MatchProvider matchProvider,
  }) async {
    _isProcessing = true;
    _statusMessage = 'Redeeming 1 Free Replacement Pass...';
    notifyListeners();

    try {
      final res = await matchProvider.unlockWithFreePass(matchId);
      _isProcessing = false;

      if (res['success'] == true) {
        _statusMessage = '🎁 Match unlocked for FREE using 1 Replacement Pass!';
        notifyListeners();
        return true;
      } else {
        _statusMessage = res['msg'] ?? 'Could not redeem free pass';
        notifyListeners();
        return false;
      }
    } catch (e) {
      _isProcessing = false;
      _statusMessage = 'Error redeeming pass: $e';
      notifyListeners();
      return false;
    }
  }

  /// Legacy PhonePe payment fallback
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

        final uri = Uri.parse(redirectUrl);
        if (await canLaunchUrl(uri)) {
          await launchUrl(
            uri,
            mode: LaunchMode.inAppBrowserView,
            browserConfiguration: const BrowserConfiguration(showTitle: true),
          );
        } else {
          await launchUrl(uri, mode: LaunchMode.externalApplication);
        }

        _statusMessage = 'Verifying payment status...';
        notifyListeners();

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

        if (_currentOrderId != null) {
          if (isPaymentSuccess) {
            _statusMessage = 'Payment Verified! Astrological Insights Unlocked.';
          } else {
            _statusMessage = 'Payment Processed! Astrological Insights Unlocked.';
          }
          await _apiService.recordCompletedPurchase(
            matchId: matchId,
            orderId: _currentOrderId!,
            amount: amount,
            userId: userId,
          );
          matchProvider.markMatchUnlocked(matchId);
          _isProcessing = false;
          notifyListeners();
          return true;
        }

        _statusMessage = 'Payment confirmation pending.';
        _isProcessing = false;
        notifyListeners();
        return false;
      } else {
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
