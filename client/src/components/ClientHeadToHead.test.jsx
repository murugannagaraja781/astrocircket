import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { store } from '../redux/store';
import ClientHeadToHead from './ClientHeadToHead';

describe('ClientHeadToHead Component', () => {
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
                    Moon: 354.89,
                    Mars: 72.83
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
                planets: {
                    Moon: 82.09
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

    it('should render ClientHeadToHead with cricket metrics and without astrology rule details', () => {
        render(
            <Provider store={store}>
                <ClientHeadToHead
                    teamAPlayers={mockTeamAPlayers}
                    teamBPlayers={mockTeamBPlayers}
                    teamAName="IND"
                    teamBName="AUS"
                    matchChart={mockMatchChart}
                    batFirstTeam="teamA"
                    matchStartTime="19:30"
                />
            </Provider>
        );

        // Check headers
        expect(screen.getByText(/Head-to-Head மேட்ச்அப் கணிப்பு/i)).toBeDefined();
        expect(screen.getByText(/ஸ்ட்ரைக்கர் \(Striker\)/i)).toBeDefined();
        expect(screen.getByText(/பந்துவீச்சாளர் \(Active Bowler\)/i)).toBeDefined();

        // Check cricket outcomes and power percentages
        expect(screen.getByText(/பேட்டிங் பலம்/i)).toBeDefined();
        expect(screen.getByText(/பவுலிங் பலம்/i)).toBeDefined();

        // Ensure internal astrology rules (like Lord rule, Rasi Lord labels) are NOT shown
        expect(screen.queryByText(/ராசி அதிபதி:/i)).toBeNull();
        expect(screen.queryByText(/நட்சத்திர அதிபதி:/i)).toBeNull();
    });

    it('should handle phase buttons and toggle mode', () => {
        render(
            <Provider store={store}>
                <ClientHeadToHead
                    teamAPlayers={mockTeamAPlayers}
                    teamBPlayers={mockTeamBPlayers}
                    teamAName="IND"
                    teamBName="AUS"
                    matchChart={mockMatchChart}
                    batFirstTeam="teamA"
                    matchStartTime="19:30"
                />
            </Provider>
        );

        const powerplayBtn = screen.getByText(/பவர்பிளே 6/i);
        expect(powerplayBtn).toBeDefined();
        fireEvent.click(powerplayBtn);

        expect(screen.getByText(/நிமிடம்: 25/i)).toBeDefined();
    });
});
