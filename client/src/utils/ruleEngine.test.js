
import { describe, it, expect } from 'vitest';
import { evaluateBatsman, evaluateBowler } from './ruleEngine';

describe('ruleEngine', () => {
    it('should evaluate batsman correctly with dummy data', () => {
        const player = {
            planetPositions: { Mars: 'Aries', Venus: 'Taurus' }, // Strong Mars, Own Sign Venus
            rashiLord: 'Mars',
            nakshatraLord: 'Ketu',
            nakshatra: 'Ashwini'
        };
        const match = {
            nakshatra: 'Ashwini',
            planetPositions: {}
        };
        const transit = {
            planetPositions: {}
        };

        const result = evaluateBatsman(player, match, transit);
        expect(result).toHaveProperty('score');
        expect(result).toHaveProperty('logs');
        // Mars Exalted in Aries (rule) if Ashwini match star
        // Rule: Ashwini: Mars Exalted (+8)
        // Rule: Ashwini: Mars & Venus Conjoined depends on signs. Mars Aries, Venus Taurus -> Not Same Sign.

        // Wait, ruleEngine logic:
        // if (isExalted('Mars', P['Mars'])) addRule('Ashwini: Mars Exalted', 8);
        // Exalted Signs: Mars -> Capricorn.
        // Wait, in my test data Mars is in Aries (Own Sign).

        // Let's test specific rule: Ashwini
        // case 'Ashwini':
        //    if (isExalted('Mars', P['Mars'])) ...

        // Let's create a case where Mars is Exalted (Capricorn)
        const playerExalted = {
            planetPositions: { Mars: 'Capricorn' },
            rashiLord: 'Mars',
            nakshatraLord: 'Ketu',
            nakshatra: 'Ashwini'
        };

        const resultExalted = evaluateBatsman(playerExalted, match, transit);
        // Expect score to include +8
        expect(resultExalted.logs).toEqual(expect.arrayContaining([
            expect.objectContaining({ en: expect.stringMatching(/As[hw]ini: Mars Exalted/) })
        ]));
    });

    it('should trigger Zig-Zag rule for matching rasi and star lords', () => {
        const playerZigZag = {
            planetPositions: {
                'Moon': 'Gemini', // Rasi Mithuna (Lord Mercury)
                'Mercury': 'Gemini',
                'Jupiter': 'Gemini'
            },
            rashiLord: 'Mercury',
            nakshatraLord: 'Jupiter',
            nakshatra: 'Punarvasu',
            rashi: 'Gemini'
        };
        const matchZigZag = {
            nakshatra: 'Revati',
            rashiLord: 'Jupiter',
            nakshatraLord: 'Mercury'
        };
        const transitZigZag = {
            planetPositions: { 'Moon': 'Pisces' },
            ascendantLord: 'Jupiter',
            ascendantSign: 'Pisces'
        };

        const result = evaluateBatsman(playerZigZag, matchZigZag, transitZigZag);
        expect(result.score).toBeGreaterThanOrEqual(12);
        expect(result.logs).toEqual(expect.arrayContaining([
            expect.objectContaining({ en: expect.stringContaining('Zig-Zag') })
        ]));
    });

    it('should not crash with null inputs', () => {
        const result = evaluateBatsman(null, null);
        expect(result.score).toBe(0);
        expect(result.logs).toEqual([]);
    });
});
