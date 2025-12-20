
// Prediction Logic Helper

const signs = [
    { id: 1, name: 'Aries', lord: 'Mars' },
    { id: 2, name: 'Taurus', lord: 'Venus' },
    { id: 3, name: 'Gemini', lord: 'Mercury' },
    { id: 4, name: 'Cancer', lord: 'Moon' },
    { id: 5, name: 'Leo', lord: 'Sun' },
    { id: 6, name: 'Virgo', lord: 'Mercury' },
    { id: 7, name: 'Libra', lord: 'Venus' },
    { id: 8, name: 'Scorpio', lord: 'Mars' },
    { id: 9, name: 'Sagittarius', lord: 'Jupiter' },
    { id: 10, name: 'Capricorn', lord: 'Saturn' },
    { id: 11, name: 'Aquarius', lord: 'Saturn' },
    { id: 12, name: 'Pisces', lord: 'Jupiter' }
];

const getSignLord = (signName) => {
    if (!signName) return null;
    const sign = signs.find(s => s.name.toLowerCase() === signName.toLowerCase());
    return sign ? sign.lord : null;
};

const getSignId = (signName) => {
    if (!signName) return null;
    const sign = signs.find(s => s.name.toLowerCase() === signName.toLowerCase());
    return sign ? sign.id : null;
};

// Check if a planet is in a specific sign in a chart
const getPlanetSign = (chart, planetName) => {
    // chart.rawPlanets[planetName].sign
    if (chart?.rawPlanets?.[planetName]) return chart.rawPlanets[planetName].sign;
    return null;
};

// Check if two planets are conjunct (same sign) in a chart
// Note: Usually we check if PlayerPlanet is conjunct MatchPlanet?
// Or if PlayerPlanet is conjunct AnotherPlayerPlanet?
// The rules usually imply: "In Today's chart, are these two conjunct?"
// So we check positions in the MATCH CHART mainly for conjunctions of lords.
const arePlanetsConjunctInMatch = (matchChart, planet1, planet2) => {
    const s1 = getPlanetSign(matchChart, planet1);
    const s2 = getPlanetSign(matchChart, planet2);
    return s1 && s2 && s1 === s2;
};

// Get Star Lord (Nakshatra Lord) of a planet
const getStarLord = (chart, planetName) => {
    // specific to structure: chart.rawPlanets[planetName].nakshatraLord
    return chart?.rawPlanets?.[planetName]?.nakshatraLord;
};

// --- BATSMAN RULES ---
export const evaluateBatsman = (playerChart, matchChart) => {
    const report = [];
    let score = 0;

    // Data Extraction
    const pMoonSign = playerChart?.moonSign?.english; // "Aries"
    const pMoonStarLord = playerChart?.moonNakshatra?.lord; // "Ketu"
    const pRasiLord = getSignLord(pMoonSign); // "Mars" if Aries

    const matchMoonSign = matchChart?.moonSign?.english;
    const matchStarLord = matchChart?.moonNakshatra?.lord; // Today's Star Lord

    // 1. Rasi/Star Match or Exchange (Parivarthanai)
    // Rule: Player Rasi/Star joined with Match Rasi/Star OR Exchange
    // Setup: Check if Player Moon Sign == Match Moon Sign
    if (pMoonSign === matchMoonSign) {
        score += 2;
        report.push("Excellent: Player Rasi matches Match Rasi (Chandrashtama/Janma Rasi match).");
    } else {
        // Exchange Check: Player Rasi Lord is in Match Rasi House AND Match Rasi Lord is in Player Rasi House?
        // Let's use Match Chart positions for "Current" state.
        // Is PlayerDistLord in MatchSign AND MatchSignLord in PlayerSign?
        const mRasiLord = getSignLord(matchMoonSign);

        // Where is Player Rasi Lord in Match Chart?
        const pLordInMatchSign = getPlanetSign(matchChart, pRasiLord);
        // Where is Match Rasi Lord in Match Chart?
        const mLordInMatchSign = getPlanetSign(matchChart, mRasiLord);

        if (pLordInMatchSign === matchMoonSign && mLordInMatchSign === pMoonSign) {
            score += 2;
            report.push("Excellent: Parivarthana Yoga between Player Rasi Lord and Match Rasi.");
        }
    }

    // 2. Moon's Star Lord is Rasi Lord for whom? -> Good
    // Interpretation: Is Player Moon Star Lord (e.g. Ketu) the Lord of Match Moon Sign?
    const matchRasiLord = getSignLord(matchMoonSign);
    if (pMoonStarLord === matchRasiLord) {
        score += 1;
        report.push("Good: Player Star Lord is today's Rasi Lord.");
    }

    // 3. Rasi Lord AND Star Lord both in Match Star Lord's house -> Good
    // "Two different houses also good"
    if (pRasiLord && pMoonStarLord && matchStarLord) {
        // Where are they in the SKY NOW (Match Chart)?
        const pRasiLordSign = getPlanetSign(matchChart, pRasiLord);
        const pMoonStarLordSign = getPlanetSign(matchChart, pMoonStarLord);

        const ownerOfPRLPos = getSignLord(pRasiLordSign);
        const ownerOfPStarLordPos = getSignLord(pMoonStarLordSign);

        if (ownerOfPRLPos === matchStarLord && ownerOfPStarLordPos === matchStarLord) {
            score += 1;
            report.push("Good: Player Rasi Lord & Star Lord are residing in Match Star Lord's houses.");
        }
    }

    // 5. (Fallback Rule) If others fail...
    // If Player Star Lord's House contains Match Star Lord?
    // "Playerin rasi nakshatra athipathi veetil matchin rasi nakshatra athipathigal inainthu irunthal nandru"
    // Match Star Lord is in a house owned by Player Star Lord.
    if (matchStarLord && pMoonStarLord) {
        const matchStarLordSign = getPlanetSign(matchChart, matchStarLord); // Sign where Match Star Lord is
        const owner = getSignLord(matchStarLordSign);
        if (owner === pMoonStarLord) {
            score += 1;
            report.push("Good: Match Star Lord is in Player Star Lord's house.");
        }
    }

    // 6. Rasi Lord with Match Star Lord joined
    if (pRasiLord && matchStarLord) {
        if (arePlanetsConjunctInMatch(matchChart, pRasiLord, matchStarLord)) {
            score += 1;
            report.push("Good: Player Rasi Lord is conjunct Match Star Lord.");
        }
    }

    // 7. Special Rule for Rahu/Ketu Star Lord
    // If Player Star Lord is Rahu/Ketu, then check Dispositor
    if (pMoonStarLord === 'Rahu' || pMoonStarLord === 'Ketu') {
        // Find Dispositor in BIRTH CHART or MATCH CHART? Usually "Player's Star Lord" implies purely Player attributes.
        // If Player's Star Lord is Rahu, who is its dispositor?
        // Need to look at PLAYER CHART where Rahu is.
        const rahuSign = getPlanetSign(playerChart, pMoonStarLord); // Sign of Rahu in birth chart
        const dispositor = getSignLord(rahuSign); // Lord of that sign (e.g. Venus)

        // "That Rasi Athipathi (Dispositor) in Match Star Lord house?"
        // Check Dispositor position in MATCH CHART
        const dispSignInMatch = getPlanetSign(matchChart, dispositor);
        const dispOwner = getSignLord(dispSignInMatch);

        if (dispOwner === matchStarLord) {
            score += 1;
            report.push(`Good: Player Star Lord (${pMoonStarLord}) Dispositor (${dispositor}) is in Match Star Lord's house.`);
        }
    }

    return {
        score,
        isGood: score > 0,
        report
    };
};

// --- BOWLER RULES ---
export const evaluateBowler = (playerChart, matchChart) => {
    const report = [];
    let score = 0;

    // Data Extraction
    const pMoonSign = playerChart?.moonSign?.english;
    const pMoonStarLord = playerChart?.moonNakshatra?.lord;
    const pRasiLord = getSignLord(pMoonSign);

    const matchMoonSign = matchChart?.moonSign?.english;
    const matchRasiLord = getSignLord(matchMoonSign);
    const matchLagnaSign = matchChart?.lagna?.english;
    const matchLagnaLord = matchChart?.lagna?.lord;

    // Match Rasi Lord's Star Lord (Complex rule 3)
    const mRasiLordObj = matchChart?.rawPlanets?.[matchRasiLord];
    const matchRasiLordStarLord = mRasiLordObj?.nakshatraLord;


    // 1. Same as Batsman Rule 1 (Moon/Conjunction/Exchange)
    if (pMoonSign === matchMoonSign) {
        score += 2;
        report.push("Excellent: Moon Sign Match.");
    }

    // 2. Match Rasi Lord IS Player Rasi Lord OR Player Star Lord -> Special
    if (pRasiLord === matchMoonSign || pMoonStarLord === matchMoonSign) {
        // Wait, text says: "Matching Rasi Lord is Lagna Lord...?"
        // "Matching Rasi Lord Lagnathipathiyaga Player Rasi Lord allathu Nakshatra athipathi irunthal sirappu"
        // Interpret: If (Match Rasi Lord == Player Rasi Lord) OR (Match Rasi Lord == Player Star Lord) -> Good?
        // OR: If Match Lagna Lord == Player Rasi Lord?

        // Let's go with: Match Rasi Lord == Player Rasi Lord OR Match Rasi Lord == Player Star Lord
        if (matchRasiLord === pRasiLord) {
            score += 1;
            report.push("Good: Match Rasi Lord matches Player Rasi Lord.");
        }
        if (matchRasiLord === pMoonStarLord) {
            score += 1;
            report.push("Good: Match Rasi Lord matches Player Star Lord.");
        }
    }

    // Alternative Reading for Rule 2 part 2: "Matching Rasi Athipathi Lagnathipathiyaga..."
    // If Match Rasi Lord is the Match Lagna Lord? (e.g. Cancer Lagna, Moon Rasi).
    // AND that planet is Player Rasi Lord...
    if (matchRasiLord === matchLagnaLord) {
        if (matchRasiLord === pRasiLord) {
            score += 2;
            report.push("Excellent: Match Rasi Lord is Lagna Lord AND matches Player Rasi Lord.");
        }
    }


    // 3. Player Rasi Star in Match Rasi Lord Star Lord house?
    // "Player Rasi Nakshataram ... Match Rasi Athipathi Nakshatra Athipathi veetil irunthal"
    // Player Moon is residing in a sign OWNED BY (Match Rasi Lord's Star Lord).
    // Uses MATCH CHART position or PLAYER CHART? Usually "Player Rasi Nakshatra" refers to Birth Moon.
    // "Irunthal" implies "Is placed in". Usually checking against Match Chart transits?
    // Let's assume: Check where Player Moon is in BIRTH CHART (since it's fixed).
    // Is Birth Moon Sign Lord == Match Rasi Lord's Star Lord?
    if (matchRasiLordStarLord) {
        const ownerOfPlayerMoon = getSignLord(pMoonSign);
        if (ownerOfPlayerMoon === matchRasiLordStarLord) {
            score += 1;
            report.push(`Good: Player Moon is in house of Match Rasi Lord's Star Lord (${matchRasiLordStarLord}).`);
        }
    }


    // 4. Player Rasi Lord in Match Lagna -> Good
    // (Transit Check: Where is Player Rasi Lord TODAY?)
    const pRasiLordInMatch = getPlanetSign(matchChart, pRasiLord);
    if (pRasiLordInMatch === matchLagnaSign) {
        score += 2;
        report.push("Excellent: Player Rasi Lord is currently in Match Lagna.");
    }

    // 5. Rasi Lord with Match Lagna Lord joined -> Good
    if (arePlanetsConjunctInMatch(matchChart, pRasiLord, matchLagnaLord)) {
        score += 1;
        report.push("Good: Player Rasi Lord is conjunct Match Lagna Lord.");
    }

    return {
        score,
        isGood: score > 0,
        report
    };
};
