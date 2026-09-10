import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/match_model.dart';
import '../services/api_service.dart';

class MatchProvider with ChangeNotifier {
  static const String _cacheKey = 'astro_cached_matches_v1';
  final ApiService _apiService = ApiService();

  List<MatchModel> _allMatches = [];
  List<MatchModel> _liveMatches = [];
  List<MatchModel> _upcomingMatches = [];
  List<MatchModel> _finishedMatches = [];
  MatchModel? _selectedMatch;
  bool _isLoading = false;
  String? _errorMessage;

  // Filter States
  String _selectedGender = 'all'; // 'all', 'men', 'women'
  String _selectedFormat = 'all'; // 'all', 't20', 'odi', 'test'

  String get selectedGender => _selectedGender;
  String get selectedFormat => _selectedFormat;

  void setGenderFilter(String gender) {
    if (_selectedGender != gender) {
      _selectedGender = gender;
      notifyListeners();
    }
  }

  void setFormatFilter(String format) {
    if (_selectedFormat != format) {
      _selectedFormat = format;
      notifyListeners();
    }
  }

  List<MatchModel> _filterList(List<MatchModel> list) {
    return list.where((m) {
      if (_selectedGender != 'all' && m.gender != _selectedGender) {
        return false;
      }
      if (_selectedFormat != 'all' && m.format.toLowerCase() != _selectedFormat.toLowerCase()) {
        return false;
      }
      return true;
    }).toList();
  }

  List<MatchModel> get liveMatches => _filterList(_liveMatches);
  List<MatchModel> get upcomingMatches => _filterList(_upcomingMatches);
  List<MatchModel> get finishedMatches => _filterList(_finishedMatches);
  MatchModel? get selectedMatch => _selectedMatch;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  /// Load cached matches instantly from local device storage (0ms offline startup)
  Future<void> loadCachedMatches() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final cachedJson = prefs.getString(_cacheKey);
      if (cachedJson != null && cachedJson.isNotEmpty) {
        final List decoded = jsonDecode(cachedJson);
        final list = decoded.map((m) => MatchModel.fromJson(m)).toList();
        if (list.isNotEmpty) {
          _allMatches = list;
          _partitionMatches(list);
          notifyListeners();
        }
      }
    } catch (e) {
      if (kDebugMode) {
        print('Error loading cached matches: $e');
      }
    }
  }

  /// Partition all matches into live, upcoming, and finished categories
  void _partitionMatches(List<MatchModel> all) {
    _liveMatches = all.where((m) => m.status.toLowerCase() == 'live').toList();
    _upcomingMatches = all.where((m) => m.status.toLowerCase() == 'upcoming').toList();
    _finishedMatches = all.where((m) => m.status.toLowerCase() == 'completed' || m.status.toLowerCase() == 'finished').toList();
  }

  /// Fetch latest matches from server and save to local storage
  Future<void> fetchAllMatches({bool silent = false}) async {
    if (!silent && _liveMatches.isEmpty && _upcomingMatches.isEmpty && _finishedMatches.isEmpty) {
      _isLoading = true;
      _errorMessage = null;
      notifyListeners();
    }

    try {
      final all = await _apiService.fetchMatches();

      if (all.isNotEmpty) {
        _allMatches = all;
        _partitionMatches(all);

        // Save to Local Device Storage
        final prefs = await SharedPreferences.getInstance();
        final jsonString = jsonEncode(all.map((m) => m.toJson()).toList());
        await prefs.setString(_cacheKey, jsonString);
      }
    } catch (e) {
      _errorMessage = 'Failed to load matches';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Update match when an FCM push notification arrives (with zero full-page reload)
  void updateMatchFromNotification(Map<String, dynamic> data) {
    try {
      final matchId = data['matchId']?.toString() ?? data['id']?.toString();
      if (matchId == null || matchId.isEmpty) return;

      int index = _allMatches.indexWhere((m) => m.id == matchId);
      if (index != -1) {
        final existing = _allMatches[index];
        final updatedInsight = InsightData(
          isPublished: true,
          isUnlocked: existing.insight.isUnlocked,
          price: (data['price'] != null) ? double.tryParse(data['price'].toString()) ?? 49.0 : existing.insight.price,
          astrologicalAdvantage: data['astrologicalAdvantage']?.toString() ?? existing.insight.astrologicalAdvantage,
          insightsSummary: data['insightsSummary']?.toString() ?? existing.insight.insightsSummary,
          publishedAt: DateTime.now(),
        );

        _allMatches[index] = MatchModel(
          id: existing.id,
          teamA: existing.teamA,
          teamB: existing.teamB,
          matchDate: existing.matchDate,
          matchTime: existing.matchTime,
          venue: existing.venue,
          status: existing.status,
          location: existing.location,
          result: existing.result,
          insight: updatedInsight,
          isUnlocked: existing.isUnlocked,
        );

        _partitionMatches(_allMatches);
        notifyListeners();

        // Save updated state to local cache
        SharedPreferences.getInstance().then((prefs) {
          prefs.setString(_cacheKey, jsonEncode(_allMatches.map((m) => m.toJson()).toList()));
        });
      }
    } catch (e) {
      if (kDebugMode) {
        print('Error updating match from notification: $e');
      }
    }
  }

  Future<void> fetchMatchDetails(String matchId) async {
    _isLoading = true;
    notifyListeners();

    final match = await _apiService.fetchMatchDetails(matchId);
    if (match != null) {
      _selectedMatch = match;
    }
    _isLoading = false;
    notifyListeners();
  }

  void selectMatch(MatchModel match) {
    _selectedMatch = match;
    notifyListeners();
  }

  void markMatchUnlocked(String matchId) {
    if (_selectedMatch != null && _selectedMatch!.id == matchId) {
      _selectedMatch = MatchModel(
        id: _selectedMatch!.id,
        teamA: _selectedMatch!.teamA,
        teamB: _selectedMatch!.teamB,
        matchDate: _selectedMatch!.matchDate,
        matchTime: _selectedMatch!.matchTime,
        venue: _selectedMatch!.venue,
        status: _selectedMatch!.status,
        location: _selectedMatch!.location,
        result: _selectedMatch!.result,
        insight: InsightData(
          isPublished: _selectedMatch!.insight.isPublished,
          isUnlocked: true,
          price: _selectedMatch!.insight.price,
          publishedAt: _selectedMatch!.insight.publishedAt,
          astrologicalAdvantage: _selectedMatch!.insight.astrologicalAdvantage ?? _selectedMatch!.teamA,
          keyBatsmen: _selectedMatch!.insight.keyBatsmen.isNotEmpty
              ? _selectedMatch!.insight.keyBatsmen
              : [
                  KeyPlayer(name: 'Top Batsman 1', role: 'Batsman', rating: 9.4, astroScore: 89),
                  KeyPlayer(name: 'Top Batsman 2', role: 'Batsman', rating: 8.8, astroScore: 82),
                ],
          keyBowlers: _selectedMatch!.insight.keyBowlers.isNotEmpty
              ? _selectedMatch!.insight.keyBowlers
              : [
                  KeyPlayer(name: 'Lead Bowler 1', role: 'Bowler', rating: 9.2, astroScore: 87),
                  KeyPlayer(name: 'Lead Bowler 2', role: 'Bowler', rating: 8.5, astroScore: 79),
                ],
          insightsSummary: _selectedMatch!.insight.insightsSummary ?? 'Planetary alignments strongly favor top-order batting and swing pacers in early overs.',
        ),
        isUnlocked: true,
      );
      notifyListeners();
    }
  }
}
