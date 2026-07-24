// resultEngine.js

export function getFinalResult(score) {
    if (score >= 6) {
        return {
            verdict: "EXCELLENT",
            message: "Very strong performance expected",
            confidence: "HIGH"
        };
    }

    if (score >= 4) {
        return {
            verdict: "GOOD",
            message: "Above average performance likely",
            confidence: "MEDIUM"
        };
    }

    if (score >= 2) {
        return {
            verdict: "OK",
            message: "Average performance",
            confidence: "LOW"
        };
    }

    return {
        verdict: "FLOP",
        message: "Poor performance indicated",
        confidence: "VERY LOW"
    };
}
