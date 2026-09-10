import 'package:intl/intl.dart';

class KeyPlayer {
  final String name;
  final String team;
  final String role; // 'Batsman' or 'Bowler'
  final double rating;
  final int astroScore;
  final String? rationale;

  KeyPlayer({
    required this.name,
    this.team = '',
    this.role = '',
    this.rating = 8.5,
    this.astroScore = 80,
    this.rationale,
  });

  factory KeyPlayer.fromJson(Map<String, dynamic> json) {
    return KeyPlayer(
      name: json['name'] ?? '',
      team: json['team'] ?? '',
      role: json['role'] ?? '',
      rating: (json['rating'] is num) ? (json['rating'] as num).toDouble() : 8.5,
      astroScore: (json['astroScore'] is num) ? (json['astroScore'] as num).toInt() : 80,
      rationale: json['rationale'],
    );
  }

  Map<String, dynamic> toJson() => {
    'name': name,
    'team': team,
    'role': role,
    'rating': rating,
    'astroScore': astroScore,
    'rationale': rationale,
  };
}

class InsightData {
  final bool isPublished;
  final bool isUnlocked;
  final double price;
  final DateTime? publishedAt;
  final String? astrologicalAdvantage;
  final List<KeyPlayer> keyBatsmen;
  final List<KeyPlayer> keyBowlers;
  final String? insightsSummary;
  final String? previewText;

  InsightData({
    this.isPublished = false,
    this.isUnlocked = false,
    this.price = 49.0,
    this.publishedAt,
    this.astrologicalAdvantage,
    this.keyBatsmen = const [],
    this.keyBowlers = const [],
    this.insightsSummary,
    this.previewText,
  });

  factory InsightData.fromJson(Map<String, dynamic> json) {
    var batsmenList = <KeyPlayer>[];
    if (json['keyBatsmen'] != null && json['keyBatsmen'] is List) {
      batsmenList = (json['keyBatsmen'] as List)
          .map((i) => (i is Map<String, dynamic>)
              ? KeyPlayer.fromJson(i)
              : KeyPlayer(name: i.toString(), role: 'Batsman'))
          .toList();
    }

    var bowlersList = <KeyPlayer>[];
    if (json['keyBowlers'] != null && json['keyBowlers'] is List) {
      bowlersList = (json['keyBowlers'] as List)
          .map((i) => (i is Map<String, dynamic>)
              ? KeyPlayer.fromJson(i)
              : KeyPlayer(name: i.toString(), role: 'Bowler'))
          .toList();
    }

    return InsightData(
      isPublished: json['isPublished'] ?? false,
      isUnlocked: json['isUnlocked'] ?? false,
      price: (json['price'] is num) ? (json['price'] as num).toDouble() : 49.0,
      publishedAt: json['publishedAt'] != null ? DateTime.tryParse(json['publishedAt'].toString()) : null,
      astrologicalAdvantage: json['astrologicalAdvantage'],
      keyBatsmen: batsmenList,
      keyBowlers: bowlersList,
      insightsSummary: json['insightsSummary'],
      previewText: json['previewText'],
    );
  }

  Map<String, dynamic> toJson() => {
    'isPublished': isPublished,
    'isUnlocked': isUnlocked,
    'price': price,
    'publishedAt': publishedAt?.toIso8601String(),
    'astrologicalAdvantage': astrologicalAdvantage,
    'keyBatsmen': keyBatsmen.map((k) => k.toJson()).toList(),
    'keyBowlers': keyBowlers.map((k) => k.toJson()).toList(),
    'insightsSummary': insightsSummary,
    'previewText': previewText,
  };
}

class MatchModel {
  final String id;
  final String teamA;
  final String teamB;
  final String matchDate;
  final String matchTime;
  final String venue;
  final String status; // 'live', 'upcoming', 'completed', 'finished'
  final String gender; // 'men', 'women'
  final String format; // 'T20', 'ODI', 'Test'
  final String? subStatus;
  final Map<String, dynamic>? location;
  final Map<String, dynamic>? result;
  final InsightData insight;
  final bool isUnlocked;

  MatchModel({
    required this.id,
    required this.teamA,
    required this.teamB,
    required this.matchDate,
    required this.matchTime,
    this.venue = '',
    this.status = 'upcoming',
    this.gender = 'men',
    this.format = 'T20',
    this.subStatus,
    this.location,
    this.result,
    required this.insight,
    this.isUnlocked = false,
  });

  /// Formats Date and Time to Indian Standard Time (IST) in DD-MM-YYYY • hh:mm a IST format
  String get formattedDateTimeIST {
    try {
      final isLive = status.toLowerCase() == 'live';
      final isCompleted = status.toLowerCase() == 'completed' || status.toLowerCase() == 'finished';

      if (isLive) {
        if (matchTime.isNotEmpty && !matchTime.contains(':')) {
          return matchTime; // e.g. "Live In Progress", "Ings Break", "Toss"
        }
        return 'In Progress';
      }

      if (isCompleted) {
        if (matchTime.isNotEmpty && !matchTime.contains(':')) {
          return matchTime; // e.g. "GAW Won", "Complete"
        }
        return 'Finished';
      }

      // Upcoming match: format date and time
      String datePart = matchDate.trim();
      if (datePart.isNotEmpty) {
        final parsedDate = DateTime.tryParse(datePart);
        if (parsedDate != null) {
          datePart = DateFormat('dd-MM-yyyy').format(parsedDate);
        }
      } else {
        datePart = DateFormat('dd-MM-yyyy').format(DateTime.now());
      }

      String timePart = matchTime.trim();
      if (timePart.isNotEmpty && timePart.contains(':')) {
        int hour = 0;
        int minute = 0;
        final upperTime = timePart.toUpperCase();
        final isPM = upperTime.contains('PM');
        final isAM = upperTime.contains('AM');

        final timeClean = timePart.replaceAll(RegExp(r'[^\d:]'), '');
        final parts = timeClean.split(':');
        if (parts.length >= 2) {
          hour = int.tryParse(parts[0]) ?? 0;
          minute = int.tryParse(parts[1]) ?? 0;

          if (isPM && hour < 12) {
            hour += 12;
          } else if (isAM && hour == 12) {
            hour = 0;
          }
          final timeObj = DateTime(2026, 1, 1, hour, minute);
          timePart = DateFormat('hh:mm a').format(timeObj);
        }
        return '$datePart • $timePart IST';
      }

      if (timePart.isNotEmpty) {
        return '$datePart • $timePart IST';
      }

      return '$datePart • 07:30 PM IST';
    } catch (e) {
      if (matchDate.isNotEmpty) {
        return '$matchDate • $matchTime IST';
      }
      return venue.isNotEmpty ? venue : 'IST Scheduled Match';
    }
  }

  factory MatchModel.fromJson(Map<String, dynamic> json) {
    return MatchModel(
      id: json['id'] ?? json['_id'] ?? '',
      teamA: json['teamA'] ?? 'Team A',
      teamB: json['teamB'] ?? 'Team B',
      matchDate: json['matchDate'] ?? '',
      matchTime: json['matchTime'] ?? '',
      venue: json['venue'] ?? '',
      status: json['status'] ?? 'upcoming',
      gender: (json['gender'] ?? 'men').toString().toLowerCase(),
      format: (json['format'] ?? 'T20').toString().toUpperCase(),
      subStatus: json['subStatus'],
      location: json['location'],
      result: json['result'],
      insight: json['insight'] != null
          ? InsightData.fromJson(json['insight'])
          : InsightData(),
      isUnlocked: json['isUnlocked'] ?? false,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    '_id': id,
    'teamA': teamA,
    'teamB': teamB,
    'matchDate': matchDate,
    'matchTime': matchTime,
    'venue': venue,
    'status': status,
    'gender': gender,
    'format': format,
    'subStatus': subStatus,
    'location': location,
    'result': result,
    'insight': insight.toJson(),
    'isUnlocked': isUnlocked,
  };
}
