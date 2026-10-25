# Match Sync & Serving Architecture: Admin-Only Scraping & MongoDB Storage

## 1. Background & Why This Architecture?
- **Server Load & Rate Limiting**: If 1,000+ app users scrape Cricbuzz simultaneously, Cricbuzz will IP-block our server, and Node.js will experience severe load.
- **Architectural Principle**:
  - **Admin is the sole scraper**: Only Admin triggers Cricbuzz scraping (via Admin Panel or "Sync Live Matches").
  - **Automatic Database Upsert**: As soon as the Admin syncs, all scraped matches (Live, Upcoming, Finished) are automatically saved / updated directly in MongoDB.
  - **Existing Predictions Preserved**: Any predictions already posted by the Admin are strictly preserved during upsert.
  - **Users Only Read from MongoDB**: Mobile app users and client website users **ONLY** read from MongoDB (`Match.find()`).
  - **Zero Cricbuzz Calls on User Requests**: User response time is instantaneous (<10ms), server load is negligible, and there is 0% risk of Cricbuzz IP blocking.

---

## 2. Architecture Diagram

```
+-------------------------------------------------------------------------+
|                              ADMIN PANEL                                |
|        Admin opens Dashboard or clicks "⚡ Sync Live Matches"           |
+------------------------------------+------------------------------------+
                                     |
                      Calls: GET /api/insights/matches?source=admin
                                     |
                                     v
+------------------------------------+------------------------------------+
|                            BACKEND SERVER                               |
| 1. Scrapes Cricbuzz via liveScoreService.fetchMatches()                 |
| 2. Automatically UPSERTS each match into MongoDB:                       |
|    - Query: { cricbuzzMatchId } or { teamA, teamB }                     |
|    - Update: status, matchDate, 3-timezone matchTime, venue             |
|    - $setOnInsert: default empty insightData (keeps admin predictions)  |
+------------------------------------+------------------------------------+
                                     |
                                     v
+------------------------------------+------------------------------------+
|                           MONGODB DATABASE                              |
|   Stores: matches (Live, Upcoming, Finished) + Published Insights       |
+------------------------------------+------------------------------------+
                                     ^
                                     |
                        Reads: GET /api/insights/matches
                        (100% from MongoDB, Zero Cricbuzz hits)
                                     |
+------------------------------------+------------------------------------+
|                         FLUTTER MOBILE APP                              |
|           All users read fast from MongoDB (0ms Cricbuzz latency)       |
+-------------------------------------------------------------------------+
```

---

## 3. Maintenance & Retention
- Matches can be retained for 30 days and automatically pruned or archived.
