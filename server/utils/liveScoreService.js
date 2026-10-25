const axios = require('axios');
const cheerio = require('cheerio');

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Referer': 'https://www.cricbuzz.com/',
    'Origin': 'https://www.cricbuzz.com',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache'
};

const playerCache = new Map(); // profileUrl -> { name, role, date_of_birth, birth_place, lastUpdated }
const squadCache = new Map();  // matchId -> { data, lastUpdated }
const matchFactsCache = new Map(); // matchId -> { data, lastUpdated }
let matchesCache = { data: null, lastUpdated: 0 };

const clean = (text) => {
    if (!text) return '';
    return text.replace(/\s+/g, ' ').trim();
};

/**
 * Helper to execute async tasks in batches
 */
const runInBatches = async (items, batchSize, fn) => {
    const results = [];
    for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        const batchResults = await Promise.all(batch.map(fn));
        results.push(...batchResults);
    }
    return results;
};

/**
 * Fetch match facts (Date, Start Time in IST, Venue) for a specific match from Cricbuzz
 */
const fetchMatchFacts = async (matchId) => {
    if (!matchId) return null;
    const cached = matchFactsCache.get(matchId);
    if (cached && (Date.now() - cached.lastUpdated < 3600000 * 2)) {
        return cached.data;
    }

    try {
        const url = `https://www.cricbuzz.com/cricket-match-facts/${matchId}`;
        const res = await axios.get(url, { headers: HEADERS, timeout: 6000 });
        const $ = cheerio.load(res.data);

        let matchDate = null;
        let matchTime = null;
        let venue = null;
        let city = null;

        // 1. First attempt: Match facts table for full multi-timezone Time row (LOCAL, GMT, IST)
        $('.facts-row-grid').each((_, el) => {
            const label = clean($(el).find('div').first().text());
            const val = clean($(el).find('div').last().text());

            if (label === 'Time') {
                // e.g. "1:00 PM LOCAL, 8:00 AM GMT, 1:30 PM IST"
                matchTime = val;
            }
            if (label === 'Venue' && !venue) {
                venue = val;
            }
            if (label === 'City' && !city) {
                city = val;
            }
        });

        // 2. Parse SportsEvent JSON-LD for exact matchDate and fallback matchTime
        $('script[type="application/ld+json"]').each((_, el) => {
            try {
                const json = JSON.parse($(el).html());
                if (json['@type'] === 'SportsEvent' && json.startDate) {
                    const d = new Date(json.startDate);
                    if (!isNaN(d.getTime())) {
                        const istOffset = 5.5 * 60 * 60 * 1000;
                        const istDate = new Date(d.getTime() + istOffset);
                        if (!matchDate) {
                            matchDate = istDate.toISOString().split('T')[0];
                        }
                        if (!matchTime) {
                            const gmtH = d.getUTCHours();
                            const gmtM = String(d.getUTCMinutes()).padStart(2, '0');
                            const gmtAmpm = gmtH >= 12 ? 'PM' : 'AM';
                            const gmtH12 = gmtH % 12 || 12;

                            const istH = istDate.getUTCHours();
                            const istM = String(istDate.getUTCMinutes()).padStart(2, '0');
                            const istAmpm = istH >= 12 ? 'PM' : 'AM';
                            const istH12 = istH % 12 || 12;

                            matchTime = `${gmtH12}:${gmtM} ${gmtAmpm} GMT, ${istH12}:${istM} ${istAmpm} IST`;
                        }
                    }
                    if (!venue && json.location?.name) {
                        venue = json.location.name;
                    }
                    if (!city && json.location?.address?.addressLocality) {
                        city = json.location.address.addressLocality;
                    }
                }
            } catch (e) {}
        });

        const fullVenue = venue && city && !venue.toLowerCase().includes(city.toLowerCase())
            ? `${venue}, ${city}`
            : (venue || city || null);

        const data = {
            matchDate,
            matchTime,
            venue: fullVenue
        };
        matchFactsCache.set(matchId, { data, lastUpdated: Date.now() });
        return data;
    } catch (e) {
        return null;
    }
};

/**
 * Fetch all live, upcoming, and completed cricket matches from Cricbuzz
 */
const fetchMatches = async (forceRefresh = false) => {
    // 60-second cache to prevent spamming Cricbuzz
    if (!forceRefresh && matchesCache.data && (Date.now() - matchesCache.lastUpdated < 60000)) {
        return matchesCache.data;
    }

    try {
        const url = 'https://www.cricbuzz.com/cricket-match/live-scores';
        const response = await axios.get(url, { headers: HEADERS, timeout: 12000 });
        const $ = cheerio.load(response.data);
        const matches = {};

        $('a[href*="/live-cricket-scores/"]').each((_, el) => {
            const href = $(el).attr('href') || '';
            const title = $(el).attr('title') || clean($(el).text());
            const matchIdMatch = href.match(/\/live-cricket-scores\/(\d+)\//);
            if (!matchIdMatch) return;

            const matchId = matchIdMatch[1];
            if (matches[matchId]) {
                if (title.length > matches[matchId].title.length) {
                    matches[matchId].title = clean(title);
                }
                return;
            }

            const statusText = title.toLowerCase();
            let matchStatus = 'live';
            if (statusText.includes('upcoming') || statusText.includes('preview')) {
                matchStatus = 'upcoming';
            } else if (['won', 'lost', 'complete', 'abandon', 'stump'].some(x => statusText.includes(x))) {
                matchStatus = 'completed';
            }

            matches[matchId] = {
                match_id: matchId,
                title: clean(title),
                status: matchStatus,
                url: href.startsWith('http') ? href : `https://www.cricbuzz.com${href}`
            };
        });

        const rawMatches = Object.values(matches);

        // Enrich matches with real matchDate, matchTime (IST), and venue in parallel batches
        await runInBatches(rawMatches, 6, async (m) => {
            try {
                const facts = await fetchMatchFacts(m.match_id);
                if (facts) {
                    if (facts.matchDate) m.matchDate = facts.matchDate;
                    if (facts.matchTime) m.matchTime = facts.matchTime;
                    if (facts.venue) m.venue = facts.venue;
                }
            } catch (e) {}
        });

        const result = {
            status: 'success',
            matches: rawMatches
        };
        matchesCache = { data: result, lastUpdated: Date.now() };

        return result;
    } catch (err) {
        console.error('Error in fetchMatches:', err.message);
        throw err;
    }
};

/**
 * Fetch player profile details (Date of Birth, Birth Place) from profile page
 */
const fetchPlayerDetails = async (player) => {
    if (!player.profile_url) return { date_of_birth: null, birth_place: null };
    
    // 7-day cache
    const cached = playerCache.get(player.profile_url);
    if (cached && (Date.now() - cached.lastUpdated < 86400000 * 7)) {
        return { date_of_birth: cached.date_of_birth, birth_place: cached.birth_place };
    }

    try {
        const response = await axios.get(player.profile_url, { headers: HEADERS, timeout: 10000 });
        const $ = cheerio.load(response.data);
        let dob = null;
        let birth_place = null;
        let role = player.role || null;

        $('div').each((_, el) => {
            const className = $(el).attr('class') || '';
            if (className.includes('flex')) {
                const cols = $(el).children('div');
                if (cols.length >= 2) {
                    const label = clean($(cols[0]).text()).toLowerCase();
                    const val = clean($(cols[1]).text());
                    if (label === 'born') dob = val;
                    if (label === 'birth place') birth_place = val;
                    if (label === 'role') role = val;
                }
            }
        });

        playerCache.set(player.profile_url, {
            name: player.name,
            role: role,
            date_of_birth: dob,
            birth_place: birth_place,
            lastUpdated: Date.now()
        });

        return { role: role, date_of_birth: dob, birth_place: birth_place };
    } catch (err) {
        return { role: player.role || null, date_of_birth: null, birth_place: null };
    }
};



/**
 * Fetch squad details for a specific match from Cricbuzz
 */
const fetchSquads = async (matchId, includeDetails = false) => {
    // Check squad cache (valid for 1 day)
    const cachedSquad = squadCache.get(matchId);
    if (cachedSquad && (Date.now() - cachedSquad.lastUpdated < 86400000)) {
        const firstP = cachedSquad.data?.teams?.team1?.playing_xi?.[0];
        const hasDetails = Boolean(firstP && (firstP.date_of_birth !== null || firstP.birth_place !== null));
        if (!includeDetails || (includeDetails && hasDetails)) {
            return cachedSquad.data;
        }
    }

    try {
        const url = `https://www.cricbuzz.com/cricket-match-squads/${matchId}`;
        const response = await axios.get(url, { headers: HEADERS, timeout: 12000 });
        const $ = cheerio.load(response.data);

        const teams = [];
        $('h1').each((_, el) => {
            const className = $(el).attr('class') || '';
            if (className.includes('font-bold')) {
                const text = clean($(el).text());
                if (text && text.length <= 10 && text !== 'APPS') {
                    teams.push(text);
                }
            }
        });

        const team1_name = teams[0] || 'Team A';
        const team2_name = teams[1] || 'Team B';

        const flexRows = [];
        $('div').each((_, el) => {
            const className = $(el).attr('class') || '';
            if (className.includes('w-full') && className.includes('flex')) {
                const cols = $(el).children('div').filter((_, col) => {
                    const cClass = $(col).attr('class') || '';
                    return cClass.includes('w-1/2');
                });
                if (cols.length === 2) {
                    flexRows.push([$(cols[0]), $(cols[1])]);
                }
            }
        });

        const getPeople = ($col) => {
            const people = [];
            $col.find('a[href*="/profiles/"]').each((_, a) => {
                const fullText = clean($(a).text());
                let role = 'Player';
                let name = fullText;

                const roleRegex = /(Batter|Bowler|WK-Batter|Batting Allrounder|Bowling Allrounder|Allrounder|Head Coach|Interim Test Head Coach|Assistant Coach|Spin Bowling Coach|Fast Bowling Coach|Batting Coach|Bowling Coach|Fielding Coach|Coach)$/i;
                const match = fullText.match(roleRegex);
                if (match) {
                    role = match[1];
                    name = clean(fullText.substring(0, match.index));
                }

                const href = $(a).attr('href') || '';
                people.push({
                    name,
                    role,
                    profile_url: href.startsWith('http') ? href : `https://www.cricbuzz.com${href}`,
                    date_of_birth: null,
                    birth_place: null
                });
            });
            return people;
        };

        const playing_xi_1 = flexRows[0] ? getPeople(flexRows[0][0]) : [];
        const playing_xi_2 = flexRows[0] ? getPeople(flexRows[0][1]) : [];
        const bench_1 = flexRows[1] ? getPeople(flexRows[1][0]) : [];
        const bench_2 = flexRows[1] ? getPeople(flexRows[1][1]) : [];
        const support_1 = flexRows[2] ? getPeople(flexRows[2][0]) : [];
        const support_2 = flexRows[2] ? getPeople(flexRows[2][1]) : [];

        if (includeDetails) {
            const allPlayers = [
                ...playing_xi_1,
                ...playing_xi_2,
                ...bench_1,
                ...bench_2,
                ...support_1,
                ...support_2
            ];

            const detailsList = await runInBatches(allPlayers, 5, fetchPlayerDetails);
            allPlayers.forEach((p, idx) => {
                p.date_of_birth = detailsList[idx]?.date_of_birth || null;
                p.birth_place = detailsList[idx]?.birth_place || null;
            });
        }

        const result = {
            status: 'success',
            match_id: String(matchId),
            teams: {
                team1: {
                    name: team1_name,
                    playing_xi: playing_xi_1,
                    bench: bench_1,
                    support_staff: support_1
                },
                team2: {
                    name: team2_name,
                    playing_xi: playing_xi_2,
                    bench: bench_2,
                    support_staff: support_2
                }
            }
        };

        squadCache.set(String(matchId), { data: result, lastUpdated: Date.now() });
        return result;
    } catch (err) {
        console.error(`Error in fetchSquads for match ${matchId}:`, err.message);
        throw err;
    }
};

/**
 * Fetch live match score and commentary
 */
const fetchScore = async (matchId) => {
    try {
        const url = `https://www.cricbuzz.com/live-cricket-scores/${matchId}?_=${Date.now()}`;
        const response = await axios.get(url, { headers: HEADERS, timeout: 10000 });
        const $ = cheerio.load(response.data);

        let title = clean($('title').text()).replace(/^Cricket commentary\s*\|\s*/i, '');
        const ogTitle = $('meta[property="og:title"]').attr('content') || '';

        let score = 'score not found';
        const scoreMatch = ogTitle.match(/([A-Z]{2,4})\s+(\d+)\/(\d+)\s*\(([\d.]+)\)/);
        if (scoreMatch) {
            score = `${scoreMatch[1]} ${scoreMatch[2]}/${scoreMatch[3]} (${scoreMatch[4]})`;
        }

        const batsmen = [];
        const batsmanMatch = ogTitle.match(/\((.*?)\)\s*\|/);
        if (batsmanMatch) {
            const regex = /([A-Za-z\s.'-]+)\s+(\d+\(\d+\))/g;
            let m;
            while ((m = regex.exec(batsmanMatch[1])) !== null) {
                batsmen.push({
                    name: clean(m[1]),
                    score: clean(m[2])
                });
            }
        }

        const pageText = clean($.text());
        const bowlerMatch = pageText.match(/Bowler.*?([A-Za-z.'\- ]+?)\s+\d+\s+\d+/i);
        const bowlerName = bowlerMatch ? clean(bowlerMatch[1]) : 'score not found';

        return {
            status: 'success',
            title,
            score,
            current_batsmen: batsmen.length > 0 ? batsmen : [
                { name: 'score not found', score: 'score not found' },
                { name: 'score not found', score: 'score not found' }
            ],
            current_bowler: { name: bowlerName }
        };
    } catch (err) {
        console.error(`Error in fetchScore for match ${matchId}:`, err.message);
        throw err;
    }
};

module.exports = {
    fetchMatches,
    fetchMatchFacts,
    fetchSquads,
    fetchScore,
    fetchPlayerDetails
};
