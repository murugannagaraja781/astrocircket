import 'dart:convert';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'api_service.dart';

@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  if (kDebugMode) {
    print("🔔 [FCM Background Message]: ${message.messageId} | ${message.notification?.title}");
  }
}

class FCMService {
  static final FCMService _instance = FCMService._internal();
  factory FCMService() => _instance;
  FCMService._internal();

  final FirebaseMessaging _fcm = FirebaseMessaging.instance;
  final FlutterLocalNotificationsPlugin _localNotifications = FlutterLocalNotificationsPlugin();

  static const AndroidNotificationChannel _channel = AndroidNotificationChannel(
    'astrocricket_high_importance_channel',
    'AstroCricket Match & Prediction Alerts',
    description: 'Notifications for live match predictions, astrological advantages, and updates.',
    importance: Importance.max,
    playSound: true,
    enableVibration: true,
  );

  bool _isInitialized = false;

  Future<void> init() async {
    if (_isInitialized) return;

    try {
      // 1. Request User Notification Permissions
      NotificationSettings settings = await _fcm.requestPermission(
        alert: true,
        badge: true,
        sound: true,
        provisional: false,
      );

      if (kDebugMode) {
        print('🔔 [FCM] Notification Authorization Status: ${settings.authorizationStatus}');
      }

      // 2. Set Background message handler
      FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

      // 3. Initialize Local Notifications Plugin
      const AndroidInitializationSettings androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
      const InitializationSettings initSettings = InitializationSettings(android: androidSettings);

      await _localNotifications.initialize(
        initSettings,
        onDidReceiveNotificationResponse: (NotificationResponse response) {
          if (kDebugMode) {
            print('🔔 [FCM] Notification Clicked: ${response.payload}');
          }
        },
      );

      // Create Android Notification Channel
      await _localNotifications
          .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
          ?.createNotificationChannel(_channel);

      // 4. Foreground Message Handler
      FirebaseMessaging.onMessage.listen((RemoteMessage message) {
        if (kDebugMode) {
          print('🔔 [FCM Foreground Message]: ${message.notification?.title} - ${message.notification?.body}');
        }

        final RemoteNotification? notification = message.notification;
        final AndroidNotification? android = message.notification?.android;

        if (notification != null && !kIsWeb) {
          _localNotifications.show(
            notification.hashCode,
            notification.title,
            notification.body,
            NotificationDetails(
              android: AndroidNotificationDetails(
                _channel.id,
                _channel.name,
                channelDescription: _channel.description,
                icon: android?.smallIcon ?? '@mipmap/ic_launcher',
                importance: Importance.max,
                priority: Priority.high,
                playSound: true,
              ),
            ),
            payload: jsonEncode(message.data),
          );
        }
      });

      // 5. App Opened from Background notification click
      FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
        if (kDebugMode) {
          print('🔔 [FCM Opened App]: ${message.data}');
        }
      });

      // 6. Terminated State initial notification check
      RemoteMessage? initialMessage = await _fcm.getInitialMessage();
      if (initialMessage != null) {
        if (kDebugMode) {
          print('🔔 [FCM App Launch from Notification]: ${initialMessage.data}');
        }
      }

      // 7. Subscribe to default broadcast topics
      await _fcm.subscribeToTopic('match_insights');
      await _fcm.subscribeToTopic('all_matches');

      // 8. Retrieve and sync FCM Token with Backend
      final token = await _fcm.getToken();
      if (kDebugMode) {
        print('🚀 [FCM Device Token]: $token');
      }
      if (token != null) {
        await ApiService().saveFcmToken(token);
      }

      // Listen for token refreshes
      _fcm.onTokenRefresh.listen((newToken) async {
        if (kDebugMode) {
          print('🔄 [FCM Token Refreshed]: $newToken');
        }
        await ApiService().saveFcmToken(newToken);
      });

      _isInitialized = true;
    } catch (e) {
      if (kDebugMode) {
        print('❌ [FCM Init Error]: $e');
      }
    }
  }

  Future<String?> getDeviceToken() async {
    try {
      return await _fcm.getToken();
    } catch (e) {
      if (kDebugMode) {
        print('❌ [FCM GetToken Error]: $e');
      }
      return null;
    }
  }
}
