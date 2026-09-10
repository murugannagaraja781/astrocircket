# 🏏 AstroCricket Insights - Flutter Mobile Application Documentation

A comprehensive documentation of the **AstroCricket Mobile Application**, built with **Flutter**, designed to provide cricket enthusiasts and astrologers with real-time match scores, Krishnamurti Padhdhati (KP) astrological match predictions, key player insights, and monetized match unlocking.

---

## 📑 Table of Contents
1. [App Overview & Purpose](#-app-overview--purpose)
2. [Tech Stack & Dependencies](#-tech-stack--dependencies)
3. [Architecture & Folder Structure](#-architecture--folder-structure)
4. [Key Features & Implemented Modules](#-key-features--implemented-modules)
   - [1. Real-Time Scores & Live Match Aggregation](#1-real-time-scores--live-match-aggregation)
   - [2. Multi-Filter System (Category & Format)](#2-multi-filter-system-category--format)
   - [3. IST Time & Date Parsing Engine](#3-ist-time--date-parsing-engine)
   - [4. Zero-Latency Local Caching (0ms Startup)](#4-zero-latency-local-caching-0ms-startup)
   - [5. Astrological Insights & Star Player Breakdown](#5-astrological-insights--star-player-breakdown)
   - [6. Monetization & Paywall Integration (PhonePe)](#6-monetization--paywall-integration-phonepe)
   - [7. Push Notification System (Firebase FCM)](#7-push-notification-system-firebase-fcm)
   - [8. Persistent Navigation & Responsive Dark UI](#8-persistent-navigation--responsive-dark-ui)
   - [9. Android 16 & Modern SDK Diagnostics](#9-android-16--modern-sdk-diagnostics)
5. [Backend API Endpoints (Server Routes)](#-backend-api-endpoints-server-routes)
6. [State Management (Provider Architecture)](#-state-management-provider-architecture)
7. [Admin Panel Integration](#-admin-panel-integration)
8. [How to Run & Develop](#-how-to-run--develop)

---

## 🌟 App Overview & Purpose

**AstroCricket Insights** bridges modern cricket data with advanced Vedic & KP astrological analysis. 
- **Users** can view live scores, upcoming schedules, and completed results, while purchasing astrological predictions containing winning advantage, key batsmen, and key bowlers.
- **Admins** can perform KP chart computations on the Web Admin Dashboard, save predictions, publish astrological insights, set unlock fees (e.g., ₹49), and broadcast real-time Firebase Push Notifications to mobile users.

---

## 🛠 Tech Stack & Dependencies

### Mobile App (Flutter)
- **Framework**: Flutter 3.x (Dart 3.x)
- **State Management**: `provider: ^6.1.2`
- **Networking**: `dio: ^5.7.0` & `http: ^1.2.2`
- **Security & Storage**: `flutter_secure_storage: ^9.2.2` & `shared_preferences: ^2.3.2`
- **Push Notifications**: `firebase_core: ^3.6.0` & `firebase_messaging: ^15.1.3` & `flutter_local_notifications: ^17.2.3`
- **Date Formatting**: `intl: ^0.19.0`
- **UI Components**: `google_fonts`, `shimmer`, `cached_network_image`, `flutter_svg`, `lucide_icons`

### Backend Server (Node.js / Express)
- **Database**: MongoDB with Mongoose
- **Live Scraper**: Cheerio & Axios with Cricbuzz live-score feeds
- **Push Notifications**: Firebase Admin SDK (FCM)
- **Payments**: PhonePe PG SDK integration (SHA256 checksums)

---

## 📁 Architecture & Folder Structure

```
mobile_flutter/
├── android/
│   ├── app/
│   │   ├── build.gradle.kts           # minSdk=23, multiDexEnabled=true, package=com.spastro.app
│   │   └── src/main/
│   │       ├── AndroidManifest.xml    # Cleartext HTTP enabled, FCM permissions
│   │       └── kotlin/com/spastro/app/MainActivity.kt
├── lib/
│   ├── core/
│   │   ├── constants/
│   │   │   └── app_constants.dart     # API URLs, shared pref keys, default configurations
│   │   ├── network/
│   │   │   └── api_client.dart        # Dio interceptor, JWT attachment, token refresh
│   │   └── theme/
│   │       └── app_theme.dart         # Dark glassmorphism palette, custom typography
│   ├── models/
│   │   ├── match_model.dart           # MatchModel, InsightData, KeyPlayer (IST formatting)
│   │   └── user_model.dart            # UserModel (id, username, email, role, phone)
│   ├── providers/
│   │   ├── auth_provider.dart         # Authentication, secure token storage, user roles
│   │   ├── match_provider.dart        # Match list, tab filters, category & format chips, caching
│   │   └── payment_provider.dart      # PhonePe checkout, payment verification
│   ├── services/
│   │   ├── api_service.dart           # API bridge for match insights and user profiles
│   │   ├── fcm_service.dart           # FCM token registration, foreground/background notification handlers
│   │   └── storage_service.dart       # Secure token & preferences wrapper
│   └── views/
│       ├── auth/
│       │   ├── login_screen.dart      # Mobile & username sign-in
│       │   └── register_screen.dart   # Registration form
│       ├── home/
│       │   └── home_screen.dart       # Main view with IndexedStack persistent bottom bar
│       ├── match_details/
│       │   └── match_insights_screen.dart # Astrological edge, key players, unlock paywall
│       ├── profile/
│       │   └── profile_screen.dart    # User profile, wallet/history, logout
│       ├── tabs/
│       │   ├── live_tab.dart          # Active live matches
│       │   ├── upcoming_tab.dart      # Scheduled upcoming fixtures
│       │   └── finished_tab.dart      # Completed match results
│       └── widgets/
│           ├── match_card.dart        # Rich card with badges, teams, scores & IST timing
│           └── filter_chip_bar.dart   # Category (Men/Women) and Format (T20/ODI/Test) filters
```

---

## 🚀 Key Features & Implemented Modules

### 1. Real-Time Scores & Live Match Aggregation
- Combines custom MongoDB matches with live-scraped Cricbuzz matches in real time.
- Matches are classified into 3 primary tabs:
  - 🔴 **Live**: In-progress matches, innings breaks, and toss updates.
  - 🔵 **Upcoming**: Future fixtures waiting for match start.
  - 🟢 **Finished**: Completed match results with winning summaries.

### 2. Multi-Filter System (Category & Format)
- Interactive horizontal filter chips on the Home screen:
  - **Category**: `All`, `Men`, `Women` (detects international, franchise, and women's tournaments).
  - **Format**: `All`, `T20`, `ODI`, `Test` (detects league T20s, One-Dayers, multi-day trophies).
- Filters work seamlessly across all tabs (Live, Upcoming, Finished).

### 3. IST Time & Date Parsing Engine
- Custom-built IST normalizer in `MatchModel.formattedDateTimeIST`:
  - Accurately converts 24-hour (`19:30`) and 12-hour (`07:30 PM`) strings into standard Indian Standard Time:  
    **`DD-MM-YYYY • hh:mm a IST`** (e.g., `10-09-2026 • 07:30 PM IST`).
  - Preserves AM/PM markers and avoids morning/evening mix-ups.

### 4. Zero-Latency Local Caching (0ms Startup)
- Implemented in `MatchProvider` using `SharedPreferences`.
- When the app is launched, cached match data from previous sessions is loaded into UI in **0ms**, followed by a seamless background API sync.

### 5. Astrological Insights & Star Player Breakdown
- Matches published by Admin display:
  - **Astrological Edge / Advantage**: Expected winning momentum and planetary favor.
  - **Key Batsmen**: Name, role, rating, and astrological score.
  - **Key Bowlers**: Name, role, rating, and astrological score.
  - **KP Astrological Summary**: Deep breakdown of planetary transits and match timing sub-lords.

### 6. Monetization & Paywall Integration (PhonePe)
- Locked matches display a preview card with player counts and an **Unlock Insights for ₹49** action.
- Integrated PhonePe payment gateway:
  - Direct checkout flow.
  - Backend payment validation (`/api/insights/payment/callback`).
  - Superadmin role automatically bypasses the paywall for instant verification.

### 7. Push Notification System (Firebase FCM)
- Integrated Firebase Cloud Messaging (FCM):
  - Automatically captures user FCM tokens and uploads to `/api/auth/fcm-token`.
  - When Admin clicks **"Publish to App"** on the Web Admin Dashboard, push notifications are dispatched to all active mobile users.
  - Handles foreground banners with `flutter_local_notifications` and background notifications.

### 8. Persistent Navigation & Responsive Dark UI
- Root screen uses `IndexedStack` to persist the state of **Match Insights** and **Account** tabs without rebuilding when switching.
- **Aesthetic**: Deep navy dark theme (`#0d1117`, `#161b22`, `#21262d`), cyan & indigo accents, glassmorphic containers, smooth ripple feedback.
- Server connection configuration box is hidden safely from user-facing screens.

### 9. Android 16 & Modern SDK Diagnostics
- Migrated Kotlin package to `com.spastro.app`.
- Configured `minSdk = 23`, `multiDexEnabled = true`, and enabled cleartext HTTP traffic in `AndroidManifest.xml` for seamless local LAN development.

---

## 🔌 Backend API Endpoints (Server Routes)

| Endpoint | Method | Access | Description |
|---|---|---|---|
| `/api/insights/matches` | `GET` | Public / Token | Returns all live, upcoming, and finished matches with insight metadata. |
| `/api/insights/match/:id` | `GET` | Public / Token | Returns full match details; unmasks astrological insight if unlocked. |
| `/api/insights/publish/:id` | `POST` | Admin Only | Publishes astrologer insights, price, key players, and triggers FCM push. |
| `/api/insights/payment/initiate` | `POST` | Authenticated | Creates a PhonePe payment transaction. |
| `/api/insights/payment/callback` | `POST` | Public / PG | Handles PhonePe server-to-server payment verification. |
| `/api/auth/mobile/login` | `POST` | Public | Mobile login returning JWT auth token. |
| `/api/auth/mobile/register` | `POST` | Public | Mobile registration. |
| `/api/auth/fcm-token` | `POST` | Authenticated | Stores user's FCM push notification device token. |

---

## ⚡ State Management (Provider Architecture)

1. **`AuthProvider`**:
   - Manages user login, registration, JWT caching in `FlutterSecureStorage`, and admin privileges.
2. **`MatchProvider`**:
   - Manages match list, active tab (`live`, `upcoming`, `finished`), category & format filter states, pull-to-refresh, and local storage cache.
3. **`PaymentProvider`**:
   - Manages checkout initiation, loading states, and post-payment insight unlocking.

---

## 🖥 Admin Panel Integration

The Web Admin Dashboard (`AdminDashboard.jsx`) includes:
- 🚀 **`Post Match Insights`** tab:
  - Add new matches.
  - Edit astrological advantage, key batsmen, key bowlers, insight notes, and price.
  - One-click **"Publish to App"** with automatic FCM user push notification.
- 🔮 **`KP Astrology` & `Client Dashboard`**:
  - Compute KP sub-lord timelines, analyze 24h planetary strength, and save star players predictions.

---

## 📦 How to Run & Develop

### Prerequisites
- Flutter SDK 3.x+
- Android Studio / VS Code with Flutter extension
- Android Device or Emulator (API 23+)
- Node.js backend running on port `5001`

### Running the App locally
```bash
# 1. Navigate to Flutter directory
cd mobile_flutter

# 2. Get dependencies
flutter pub get

# 3. Run on connected Android device
flutter run
```

---
*Documentation maintained for AstroCricket project.*
