// resultEngine.js
// முடிவு இயந்திரம் - Final Verdict Calculator

/**
 * Get final result verdict based on score
 * Score thresholds:
 *   >= 4  → EXCELLENT (உயர்ச்சி)
 *   >= 2  → GOOD (நல்ல)
 *   >= 0  → NEUTRAL (சமநிலை)
 *   < 0   → FLOP (தோல்வி)
 *   <= -5 → SURE FLOP (உறுதியான தோல்வி)
 */
export function getFinalResult(score, isBowling = false) {
    // SURE FLOP case (for bowling when Rule 2 applies)
    if (score <= -5) {
        return {
            verdict: "SURE FLOP",
            verdictTamil: "உறுதியான தோல்வி",
            message: "மிக மோசமான செயல்திறன் எதிர்பார்க்கப்படுகிறது",
            confidence: "VERY HIGH",
            color: "error"
        };
    }

    if (score >= 4) {
        return {
            verdict: "EXCELLENT",
            verdictTamil: "சிறந்த",
            message: "உயர்ச்சி நிலை - மிகச்சிறந்த செயல்திறன் எதிர்பார்க்கப்படுகிறது",
            confidence: "HIGH",
            color: "success"
        };
    }

    if (score >= 2) {
        return {
            verdict: "GOOD",
            verdictTamil: "நல்ல",
            message: "நல்ல செயல்திறன் எதிர்பார்க்கப்படுகிறது",
            confidence: "MEDIUM",
            color: "primary"
        };
    }

    if (score >= 0) {
        return {
            verdict: "NEUTRAL",
            verdictTamil: "சமநிலை",
            message: "சராசரி செயல்திறன்",
            confidence: "LOW",
            color: "default"
        };
    }

    return {
        verdict: "FLOP",
        verdictTamil: "தோல்வி",
        message: "மோசமான செயல்திறன் சாத்தியம்",
        confidence: "MEDIUM",
        color: "error"
    };
}

/**
 * Get combined match verdict based on batting and bowling scores
 */
export function getMatchVerdict(batScore, bowlScore) {
    const total = batScore + bowlScore;
    const batVerdict = getFinalResult(batScore);
    const bowlVerdict = getFinalResult(bowlScore, true);

    return {
        batting: batVerdict,
        bowling: bowlVerdict,
        overall: getFinalResult(total),
        recommendation: getRecommendation(batScore, bowlScore)
    };
}

/**
 * Get playing recommendation based on scores
 */
function getRecommendation(batScore, bowlScore) {
    if (batScore >= 4 && bowlScore >= 2) {
        return { text: "All-rounder pick - மிகச்சிறந்த தேர்வு", priority: 1 };
    }
    if (batScore >= 4) {
        return { text: "Strong batsman pick - சிறந்த பேட்ஸ்மென்", priority: 2 };
    }
    if (bowlScore >= 4) {
        return { text: "Strong bowler pick - சிறந்த பவுலர்", priority: 2 };
    }
    if (batScore >= 2 && bowlScore >= 2) {
        return { text: "Balanced pick - சமநிலை தேர்வு", priority: 3 };
    }
    if (batScore >= 2) {
        return { text: "Batting option - பேட்டிங் தேர்வு", priority: 4 };
    }
    if (bowlScore >= 2) {
        return { text: "Bowling option - பவுலிங் தேர்வு", priority: 4 };
    }
    if (bowlScore <= -5) {
        return { text: "Avoid for bowling - பவுலிங் தவிர்க்கவும்", priority: 5 };
    }
    return { text: "Risky pick - ஆபத்தான தேர்வு", priority: 5 };
}
