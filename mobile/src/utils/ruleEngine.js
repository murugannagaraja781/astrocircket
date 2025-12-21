// ruleEngine.js

export function evaluateBatsman(player, match, transit) {
    let score = 0;
    let logs = [];

    // RULE 1
    if (
        player.rashi === match.rashi &&
        player.nakshatra === match.nakshatra
    ) {
        score += 2;
        logs.push("Rule 1: Rasi & Nakshatra match → GOOD");
    }

    if (
        player.rashiLord === match.rashiLord &&
        player.rashiLord === match.nakshatraLord
    ) {
        score += 3;
        logs.push("Rule 1: Parivarthanai → EXCELLENT");
    }

    // RULE 2
    if (transit.moonNakshatraLord === player.rashiLord) {
        score += 2;
        logs.push("Rule 2: Moon star lord matches player rasi lord → GOOD");
    }

    // RULE 3
    // Check if player's Rasi Lord OR Nakshatra Lord is in the SAME HOUSE as Match Nakshatra Lord (in Transit)
    // transit.planetPositions is a Map: PlanetName -> SignName
    const matchStarLordPos = transit.planetPositions[match.nakshatraLord];
    const playerRasiLordPos = transit.planetPositions[player.rashiLord];
    const playerStarLordPos = transit.planetPositions[player.nakshatraLord];

    if (matchStarLordPos && (playerRasiLordPos === matchStarLordPos || playerStarLordPos === matchStarLordPos)) {
        score += 2;
        logs.push("Rule 3: Lords in match star lord house → GOOD");
    }

    // RULE 4 (Fallback)
    if (score === 0) {
        const matchRasiLordPos = transit.planetPositions[match.rashiLord];
        // Logic from prompt: "transit.planetPositions[match.rashiLord] === transit.planetPositions[player.rashiLord]"
        if (matchRasiLordPos && playerRasiLordPos && matchRasiLordPos === playerRasiLordPos) {
            score += 2;
            logs.push("Rule 4: Fallback matched (Rasi Lords Conjunct) → GOOD");
        } else if (matchStarLordPos && playerStarLordPos && matchStarLordPos === playerStarLordPos) {
            // Prompt: "transit.planetPositions[match.nakshatraLord] === transit.planetPositions[player.nakshatraLord]"
            score += 2;
            logs.push("Rule 4: Fallback matched (Star Lords Conjunct) → GOOD");
        }
    }

    // RULE 6
    // transit.planetPositions[player.rashiLord] === transit.planetPositions[match.nakshatraLord]
    // This is actually covered in Rule 3 partially, but checking Conjunction specifically
    if (playerRasiLordPos && matchStarLordPos && playerRasiLordPos === matchStarLordPos) {
        score += 2;
        logs.push("Rule 6: Rasi lord + Match star lord conjunction → GOOD");
    }

    // RULE 7 (Rahu / Ketu)
    if (
        player.nakshatraLord === "Rahu" ||
        player.nakshatraLord === "Ketu"
    ) {
        if (
            playerRasiLordPos && matchStarLordPos && playerRasiLordPos === matchStarLordPos
        ) {
            score += 2;
            logs.push("Rule 7: Rahu/Ketu condition satisfied → GOOD");
        } else {
            score -= 2;
            logs.push("Rule 7: Rahu/Ketu condition failed → FLOP");
        }
    }

    return { score, logs };
}

// Implement Bowler Logic following same pattern
export function evaluateBowler(player, match, transit) {
    let score = 0;
    let logs = [];

    // Using previously defined Logic but adapting to this engine structure
    // RULE 1: Conjunction (Same as Batsman)
    if (player.rashi === match.rashi && player.nakshatra === match.nakshatra) {
        score += 2;
        logs.push("Rule 1: Rasi & Nakshatra match → GOOD");
    }

    // RULE 2: Match Rasi Lord matches Player Rasi Lord / Star Lord
    if (match.rashiLord === player.rashiLord) {
        score += 1;
        logs.push("Rule 2: Match Rasi Lord matches Player Rasi Lord → GOOD");
    }
    if (match.rashiLord === player.nakshatraLord) {
        score += 1;
        logs.push("Rule 2: Match Rasi Lord matches Player Star Lord → GOOD");
    }

    // RULE 4: Player Rasi Lord is in Match Lagna (Ascendant)
    const matchLagnaParams = transit.planetPositions["Asc"]; // Assuming 'Asc' key
    const playerRasiLordPos = transit.planetPositions[player.rashiLord];

    if (matchLagnaParams && playerRasiLordPos && matchLagnaParams === playerRasiLordPos) {
        score += 1;
        logs.push("Rule 4: Player Rasi Lord in Match Lagna → GOOD");
    }

    return { score, logs };
}
