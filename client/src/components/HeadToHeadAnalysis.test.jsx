import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import HeadToHeadAnalysis from './HeadToHeadAnalysis';

describe('HeadToHeadAnalysis Component', () => {
    const mockTeamAPlayers = [
        {
            id: 'p1',
            name: 'Virat Kohli',
            role: 'BAT',
            birthChart: {
                moonSign: { name: 'Virgo', tamil: 'கன்னி', lord: 'Mercury', lordTamil: 'புதன்' },
                nakshatra: { name: 'Hasta', tamil: 'அஸ்தம்', lord: 'Moon', lordTamil: 'சந்திரன்' },
                planets: {
                    Moon: { sign: 'Virgo', signTamil: 'கன்னி', nakshatra: 'Hasta', nakshatraTamil: 'அஸ்தம்' }
                }
            }
        },
        {
            id: 'p2',
            name: 'Faf du Plessis',
            role: 'BAT',
            birthChart: {
                moonSign: { name: 'Aries', tamil: 'மேஷம்', lord: 'Mars', lordTamil: 'செவ்வாய்' },
                nakshatra: { name: 'Ashwini', tamil: 'அஸ்வினி', lord: 'Ketu', lordTamil: 'கேது' },
                planets: {
                    Moon: { sign: 'Aries', signTamil: 'மேஷம்', nakshatra: 'Ashwini', nakshatraTamil: 'அஸ்வினி' }
                }
            }
        },
        {
            id: 'p3',
            name: 'Glenn Maxwell',
            role: 'ALL',
            birthChart: {
                moonSign: { name: 'Taurus', tamil: 'ரிஷபம்', lord: 'Venus', lordTamil: 'சுக்கிரன்' },
                nakshatra: { name: 'Rohini', tamil: 'ரோகிணி', lord: 'Moon', lordTamil: 'சந்திரன்' },
                planets: {
                    Moon: { sign: 'Taurus', signTamil: 'ரிஷபம்', nakshatra: 'Rohini', nakshatraTamil: 'ரோகிணி' }
                }
            }
        }
    ];

    const mockTeamBPlayers = [
        {
            id: 'p4',
            name: 'Jasprit Bumrah',
            role: 'BOWL',
            birthChart: {
                moonSign: { name: 'Leo', tamil: 'சிம்மம்', lord: 'Sun', lordTamil: 'சூரியன்' },
                nakshatra: { name: 'Magha', tamil: 'மகம்', lord: 'Ketu', lordTamil: 'கேது' },
                planets: {
                    Moon: { sign: 'Leo', signTamil: 'சிம்மம்', nakshatra: 'Magha', nakshatraTamil: 'மகம்' }
                }
            }
        },
        {
            id: 'p5',
            name: 'Hardik Pandya',
            role: 'ALL',
            birthChart: {
                moonSign: { name: 'Gemini', tamil: 'மிதுனம்', lord: 'Mercury', lordTamil: 'புதன்' },
                nakshatra: { name: 'Ardra', tamil: 'திருவாதிரை', lord: 'Rahu', lordTamil: 'ராகு' },
                planets: {
                    Moon: { sign: 'Gemini', signTamil: 'மிதுனம்', nakshatra: 'Ardra', nakshatraTamil: 'திருவாதிரை' }
                }
            }
        }
    ];

    const mockMatchChart = {
        data: {
            ascendant: {
                sign: { name: 'Virgo', lord: 'Mercury' },
                nakshatra: { name: 'Hasta', lord: 'Moon' }
            },
            ascendantSign: 'Virgo',
            ascendantLord: 'Mercury',
            lagnaTimeline: [
                {
                    startOffsetMinutes: 0,
                    endOffsetMinutes: 60,
                    lagna: 'Virgo',
                    lord: 'Mercury',
                    nakshatra: 'Hasta',
                    nakshatraLord: 'Moon'
                },
                {
                    startOffsetMinutes: 60,
                    endOffsetMinutes: 120,
                    lagna: 'Libra',
                    lord: 'Venus',
                    nakshatra: 'Chitra',
                    nakshatraLord: 'Mars'
                }
            ],
            planets: {
                Sun: { longitude: 120, sign: 'Leo', nakshatra: 'Magha' },
                Moon: { longitude: 160, sign: 'Virgo', nakshatra: 'Hasta' },
                Mars: { longitude: 40, sign: 'Taurus', nakshatra: 'Rohini' },
                Mercury: { longitude: 155, sign: 'Virgo', nakshatra: 'Hasta' },
                Jupiter: { longitude: 50, sign: 'Taurus', nakshatra: 'Rohini' },
                Venus: { longitude: 170, sign: 'Virgo', nakshatra: 'Hasta' },
                Saturn: { longitude: 320, sign: 'Aquarius', nakshatra: 'Shatabhisha' },
                Rahu: { longitude: 350, sign: 'Pisces', nakshatra: 'Revati' },
                Ketu: { longitude: 170, sign: 'Virgo', nakshatra: 'Hasta' }
            }
        }
    };

    it('should render HeadToHeadAnalysis with Striker, Non-Striker, and Bowler cards', () => {
        render(
            <HeadToHeadAnalysis
                teamAPlayers={mockTeamAPlayers}
                teamBPlayers={mockTeamBPlayers}
                teamAName="RCB"
                teamBName="MI"
                matchChart={mockMatchChart}
                batFirstTeam="teamA"
                matchStartTime="19:30"
            />
        );

        // Header check
        expect(screen.getByText(/Head to Head/i)).toBeDefined();
        expect(screen.getByText(/RCB \(Batting\) vs MI \(Bowling\)/i)).toBeDefined();

        // Check card headers
        expect(screen.getByText(/ஸ்ட்ரைக்கர் \(Striker\)/i)).toBeDefined();
        expect(screen.getByText(/நான்-ஸ்ட்ரைக்கர் \(Non-Striker\)/i)).toBeDefined();
        expect(screen.getByText(/பந்துவீச்சாளர் \(Active Bowler\)/i)).toBeDefined();

        // Check player details rendered
        expect(screen.getByText('Virat Kohli')).toBeDefined();
        expect(screen.getByText('Faf du Plessis')).toBeDefined();
        expect(screen.getByText('Jasprit Bumrah')).toBeDefined();
    });

    it('should handle phase quick button clicks', () => {
        render(
            <HeadToHeadAnalysis
                teamAPlayers={mockTeamAPlayers}
                teamBPlayers={mockTeamBPlayers}
                teamAName="RCB"
                teamBName="MI"
                matchChart={mockMatchChart}
                batFirstTeam="teamA"
                matchStartTime="19:30"
            />
        );

        const powerplayBtn = screen.getByText(/பவர்பிளே ஓவர் 6/i);
        expect(powerplayBtn).toBeDefined();
        fireEvent.click(powerplayBtn);

        expect(screen.getByText(/25 நிமிடம்/i)).toBeDefined();
    });
});
