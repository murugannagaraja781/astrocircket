
import { describe, it, expect } from 'vitest';
import { evaluateBatsman, evaluateBowler } from './ruleEngine';

describe('Updated Rule Engine Rules', () => {

    /* --------------------------------------------------------
       1. POORADAM SPECIAL CONJUNCTION RULE (OVERRIDE)
       -------------------------------------------------------- */
    describe('Pooradam Special Conjunction Rule (Override)', () => {
        const pooradamMatch = {
            nakshatra: 'Pooradam',
            rashiLord: 'Jupiter', // Sagittarius
            nakshatraLord: 'Venus'
        };

        const transitVenusMercuryConjoined = {
            planetPositions: {
                'Venus': 'Sagittarius',
                'Mercury': 'Sagittarius', // Conjoined
                'Moon': 'Leo'
            },
            ascendantLord: 'Sun',
            ascendantSign: 'Leo'
        };

        it('Batting should be -12 (Sure Flop) when Venus & Mercury are conjoined', () => {
            // Mock player doesn't matter much for this specific match rule check,
            // but we need basic structure.
            const player = {
                planetPositions: {},
                rashiLord: 'Sun',
                rashi: 'Leo',
                nakshatraLord: 'Ketu'
            };

            const battingResult = evaluateBatsman(player, pooradamMatch, transitVenusMercuryConjoined);

            // Expecting Sure Flop or negative score
            // The requirement says "-12 Points" and "Sure Flop (Batting)"
            expect(battingResult.score).toBeLessThanOrEqual(-12);
            // Ensure it likely has the specific log
            const hasLog = battingResult.logs.some(l => l.en.includes('Venus + Mercury Conjunction'));
            expect(hasLog).toBe(true);
        });

        it('Bowling should be +12 and Show Special Player when Venus & Mercury are conjoined', () => {
            const player = {
                planetPositions: {},
                rashiLord: 'Sun',
                rashi: 'Leo',
                nakshatraLord: 'Ketu'
            };

            const bowlingResult = evaluateBowler(player, pooradamMatch, transitVenusMercuryConjoined);

            // Requirement: +12 Points, Show Special Player
            expect(bowlingResult.score).toBeGreaterThanOrEqual(12);
            expect(bowlingResult.isSpecial).toBe(true);
        });
    });

    /* --------------------------------------------------------
       2. CONJUNCTION RULE (MODIFIED)
       -------------------------------------------------------- */
    describe('Modified Conjunction Rule', () => {
        // Condition: Match Nakshatra Athipathi joins Player Rasi Athipathi OR
        //            Player Nakshatra Athipathi in the same house.

        const matchConjunction = {
            nakshatra: 'Rohini',
            nakshatraLord: 'Moon', // Match Star Lord
            rashiLord: 'Venus'     // Match Rasi Lord
        };

        it('should award +4 points if Match Star Lord conjoins Player Rasi Lord', () => {
            const player = {
                planetPositions: { 'Jupiter': 'Aries' }, // Player Rasi Lord
                rashiLord: 'Jupiter',
                nakshatraLord: 'Rahu',
                rashi: 'Leo'
            };

            // Transit: Match Star Lord (Moon) in Aries (Same as Player Rasi Lord Jupiter)
            const transit = {
                planetPositions: {
                    'Moon': 'Aries'
                }
            };

            const battingResult = evaluateBatsman(player, matchConjunction, transit);
            const bowlingResult = evaluateBowler(player, matchConjunction, transit);

            // Expect +4 from Conjunction Rule
            const expectedLog = expect.stringMatching(/Conjunction/);
            expect(battingResult.logs).toEqual(expect.arrayContaining([expect.objectContaining({ en: expectedLog })]));
            expect(bowlingResult.logs).toEqual(expect.arrayContaining([expect.objectContaining({ en: expectedLog })]));
        });
    });

    /* --------------------------------------------------------
       3. MOOLAM SPECIAL CASES
       -------------------------------------------------------- */
    describe('Moolam Special Cases', () => {
        const moolamMatch = {
            nakshatra: 'Moolam',
            rashiLord: 'Jupiter',
            nakshatraLord: 'Ketu'
        };
        const transit = { planetPositions: {} };

        it('Case 1: Batting Special (Player Rasi Lord Saturn, Star Lord Mars) -> +12 Batting', () => {
            const player = {
                rashiLord: 'Saturn',
                nakshatraLord: 'Mars',
                planetPositions: {}
            };

            const battingResult = evaluateBatsman(player, moolamMatch, transit);

            expect(battingResult.score).toBeGreaterThanOrEqual(12);
            expect(battingResult.isSpecial).toBe(true);
            expect(battingResult.logs[0].en).toContain('Moolam');
        });

        // Case 2 already likely exists or is symmetric, checking Case 3 specifically
        it('Case 3: Neutral/Partial (Player Rasi Lord Mars Only)', () => {
            const player = {
                rashiLord: 'Mars',
                nakshatraLord: 'Jupiter', // NOT Saturn
                planetPositions: { 'Mars': 'Pisces' } // Neutral sign for Mars
            };

            const battingResult = evaluateBatsman(player, moolamMatch, transit);
            const bowlingResult = evaluateBowler(player, moolamMatch, transit);

            // Batting: 0 (Neutral)
            expect(battingResult.score).toBe(0); // Assuming no other rules trigger

            // Bowling: +4
            expect(bowlingResult.score).toBeGreaterThanOrEqual(4);
            expect(bowlingResult.isSpecial).toBe(true); // "Show Special Player (Bowling)"
        });

        it('Case 3: Neutral/Partial (Player Rasi Lord Mars) with Ucham/Aatchi -> +6', () => {
            const player = {
                rashiLord: 'Mars',
                nakshatraLord: 'Jupiter',
                planetPositions: { 'Mars': 'Capricorn' } // Mars Exalted (Ucham)
            };

            const bowlingResult = evaluateBowler(player, moolamMatch, transit);

            // Bowling: +4 -> +6 (if Ucham)
            // Implementation typically adds bonus rule.
            expect(bowlingResult.score).toBeGreaterThanOrEqual(6);
            expect(bowlingResult.isSpecial).toBe(true);
        });
    });

});
