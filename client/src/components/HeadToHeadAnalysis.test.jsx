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
            name: 'Sophia Dunkley',
            role: 'BAT',
            birthChart: {
                planets: {
                    Sun: 89.71,
                    Moon: 354.89, // Pisces (Lord: Jupiter/குரு), Revati (Lord: Mercury/புதன்)
                    Mars: 72.83
                }
            }
        },
        {
            id: 'p3',
            name: 'Glenn Maxwell',
            role: 'ALL',
            birthChart: {
                moonSign: { name: 'Taurus', tamil: 'ரிஷபம்', lord: 'Venus', lordTamil: 'சுக்கிரன்' },
                nakshatra: { name: 'Rohini', tamil: 'ரோகிணி', lord: 'Moon', lordTamil: 'சந்திரன்' }
            }
        }
    ];

    const mockTeamBPlayers = [
        {
            id: 'p4',
            name: 'Louise Little',
            role: 'BOWL',
            birthChart: {
                planets: {
                    Moon: 82.09 // Gemini (Lord: Mercury/புதன்), Punarvasu (Lord: Jupiter/குரு)
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
                }
            ],
            planets: {
                Sun: { longitude: 120, sign: 'Leo', nakshatra: 'Magha' },
                Moon: { longitude: 160, sign: 'Virgo', nakshatra: 'Hasta' }
            }
        }
    };

    it('should render HeadToHeadAnalysis and show only Tamil Lords (ராசி அதிபதி and நட்சத்திர அதிபதி)', () => {
        render(
            <HeadToHeadAnalysis
                teamAPlayers={mockTeamAPlayers}
                teamBPlayers={mockTeamBPlayers}
                teamAName="ENGW"
                teamBName="IREW"
                matchChart={mockMatchChart}
                batFirstTeam="teamA"
                matchStartTime="19:30"
            />
        );

        // Header check
        expect(screen.getByText(/Head to Head/i)).toBeDefined();

        // Check card headers
        expect(screen.getByText(/ஸ்ட்ரைக்கர் \(Striker\)/i)).toBeDefined();
        expect(screen.getByText(/நான்-ஸ்ட்ரைக்கர் \(Non-Striker\)/i)).toBeDefined();
        expect(screen.getByText(/பந்துவீச்சாளர் \(Active Bowler\)/i)).toBeDefined();

        // Check player details rendered
        expect(screen.getByText('Virat Kohli')).toBeDefined();
        expect(screen.getByText('Sophia Dunkley')).toBeDefined();
        expect(screen.getByText('Louise Little')).toBeDefined();

        // Check Lord Labels rendered (only Lords in Tamil)
        const rasiLordLabels = screen.getAllByText(/ராசி அதிபதி:/i);
        expect(rasiLordLabels.length).toBeGreaterThanOrEqual(3);

        const nakLordLabels = screen.getAllByText(/நட்சத்திர அதிபதி:/i);
        expect(nakLordLabels.length).toBeGreaterThanOrEqual(3);
    });

    it('should handle phase quick button clicks', () => {
        render(
            <HeadToHeadAnalysis
                teamAPlayers={mockTeamAPlayers}
                teamBPlayers={mockTeamBPlayers}
                teamAName="ENGW"
                teamBName="IREW"
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
