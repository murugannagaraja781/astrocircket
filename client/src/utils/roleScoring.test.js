import { describe, it, expect } from 'vitest';
import { isBatEligible, isBowlEligible, getPlayerCategory, generateMatchTimelineData } from './timelineEngine';
import predictionReducer, { calculatePredictions } from '../redux/slices/predictionSlice';

describe('Role Scoring & Eligibility Rules', () => {
    describe('Role Eligibility Helper Functions', () => {
        it('should correctly classify Batters (BAT, Batter, WK)', () => {
            expect(isBatEligible('BAT')).toBe(true);
            expect(isBowlEligible('BAT')).toBe(false);

            expect(isBatEligible('Batsman')).toBe(true);
            expect(isBowlEligible('Batsman')).toBe(false);

            expect(isBatEligible('WK')).toBe(true);
            expect(isBowlEligible('WK')).toBe(false);

            expect(isBatEligible('WK-Batsman')).toBe(true);
            expect(isBowlEligible('WK-Batsman')).toBe(false);

            expect(getPlayerCategory('BAT')).toBe('BATSMAN');
            expect(getPlayerCategory('WK')).toBe('BATSMAN');
        });

        it('should correctly classify Bowlers (BOWL, Bowler)', () => {
            expect(isBatEligible('BOWL')).toBe(false);
            expect(isBowlEligible('BOWL')).toBe(true);

            expect(isBatEligible('Bowler')).toBe(false);
            expect(isBowlEligible('Bowler')).toBe(true);

            expect(getPlayerCategory('BOWL')).toBe('BOWLER');
        });

        it('should correctly classify All-Rounders (ALL, All Rounder, Batting Allrounder, Bowling Allrounder)', () => {
            expect(isBatEligible('ALL')).toBe(true);
            expect(isBowlEligible('ALL')).toBe(true);

            expect(isBatEligible('All Rounder')).toBe(true);
            expect(isBowlEligible('All Rounder')).toBe(true);

            expect(isBatEligible('Batting Allrounder')).toBe(true);
            expect(isBowlEligible('Batting Allrounder')).toBe(true);

            expect(isBatEligible('Bowling Allrounder')).toBe(true);
            expect(isBowlEligible('Bowling Allrounder')).toBe(true);

            expect(getPlayerCategory('ALL')).toBe('ALL_ROUNDER');
            expect(getPlayerCategory('Batting Allrounder')).toBe('ALL_ROUNDER');
        });
    });

    describe('calculatePredictions role summation', () => {
        it('should calculate Batters + All-Rounders for batting and Bowlers + All-Rounders for bowling', () => {
            const mockMatchChart = {
                data: {
                    battingLagnaSign: 'Aries',
                    battingLagnaLord: 'Mars',
                    bowlingLagnaSign: 'Libra',
                    bowlingLagnaLord: 'Venus',
                    lagnaTimeline: []
                }
            };

            const player1 = {
                id: 'p1',
                name: 'Batter 1',
                role: 'BAT',
                birthChart: { data: { rasiSign: 'Aries', rasiLord: 'Mars', moonNakshatra: 'Ashwini' } }
            };
            const player2 = {
                id: 'p2',
                name: 'Bowler 1',
                role: 'BOWL',
                birthChart: { data: { rasiSign: 'Libra', rasiLord: 'Venus', moonNakshatra: 'Bharani' } }
            };
            const player3 = {
                id: 'p3',
                name: 'All-Rounder 1',
                role: 'ALL',
                birthChart: { data: { rasiSign: 'Aries', rasiLord: 'Mars', moonNakshatra: 'Ashwini' } }
            };

            const initialState = {
                matchChart: null,
                playerPredictions: {},
                teamB_Ids: [],
                batFirstTeam: 'teamA',
                timelineData: null,
                matchResults: null,
                loading: false
            };

            const nextState = predictionReducer(
                initialState,
                calculatePredictions({
                    players: [player1, player2, player3],
                    matchChart: mockMatchChart,
                    teamB_Ids: [],
                    teamAPlayers: [player1, player2, player3],
                    teamBPlayers: [],
                    batFirstTeam: 'teamA',
                    matchStartTime: '19:30'
                })
            );

            expect(nextState.matchResults).toBeDefined();
            expect(nextState.playerPredictions['p1']).toBeDefined();
            expect(nextState.playerPredictions['p2']).toBeDefined();
            expect(nextState.playerPredictions['p3']).toBeDefined();

            // P1 (BAT) bowl score should be 0 (cannot bowl)
            expect(nextState.playerPredictions['p1'].bowl.score).toBe(0);

            // P2 (BOWL) bat score should be 0 (cannot bat)
            expect(nextState.playerPredictions['p2'].bat.score).toBe(0);

            // Batting total only has p1 and p3 (p2 bowler excluded)
            expect(nextState.matchResults.batA).toBe(
                nextState.playerPredictions['p1'].bat.score + nextState.playerPredictions['p3'].bat.score
            );

            // Bowling total only has p2 and p3 (p1 batter excluded)
            expect(nextState.matchResults.bowlA).toBe(
                nextState.playerPredictions['p2'].bowl.score + nextState.playerPredictions['p3'].bowl.score
            );
        });
    });
});
