import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import PlanetaryTable from '../components/PlanetaryTable';

describe('PlanetaryTable Component', () => {
    it('should render table when passed birthChart object with planets and ascendant', () => {
        const mockBirthChart = {
            planets: {
                Sun: {
                    longitude: 240.2,
                    sign: "Sagittarius",
                    signTamil: "தனுசு",
                    signLord: "Jupiter",
                    nakshatra: "Mula",
                    nakshatraTamil: "மூலம்",
                    nakshatraLord: "Ketu",
                    dignity: "Neutral",
                    dignityTamil: "சமம்"
                },
                Moon: {
                    longitude: 200.5,
                    sign: "Libra",
                    signTamil: "துலாம்",
                    signLord: "Venus",
                    nakshatra: "Swati",
                    nakshatraTamil: "சுவாதி",
                    nakshatraLord: "Rahu",
                    dignity: "Friendly",
                    dignityTamil: "நட்பு"
                }
            },
            ascendant: {
                longitude: 357.39,
                sign: {
                    name: "Pisces",
                    tamil: "மீனம்",
                    lord: "Jupiter",
                    lordTamil: "குரு"
                }
            }
        };

        render(<PlanetaryTable planets={mockBirthChart} />);

        // Headers check
        expect(screen.getByText('கிரகம்')).toBeDefined();
        expect(screen.getByText('ராசி')).toBeDefined();
        expect(screen.getByText('ராசி அதிபதி')).toBeDefined();
        expect(screen.getByText('நட்சத்திர அதிபதி')).toBeDefined();

        // Check Tamil values rendered
        expect(screen.getByText('சூரியன்')).toBeDefined();
        expect(screen.getByText('சந்திரன்')).toBeDefined();
        expect(screen.getByText('லக்னம்')).toBeDefined();
        expect(screen.getByText('தனுசு')).toBeDefined();
        expect(screen.getByText('துலாம்')).toBeDefined();
        expect(screen.getByText('மீனம்')).toBeDefined();

        // Rasi Lords in Tamil
        expect(screen.getAllByText('குரு').length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText('சுக்கிரன்')).toBeDefined();

        // Nakshatra Lords in Tamil
        expect(screen.getByText('கேது')).toBeDefined();
        expect(screen.getByText('ராகு')).toBeDefined();
    });

    it('should render table when passed birthChart wrapped in data property', () => {
        const mockNestedChart = {
            data: {
                planets: {
                    Mars: {
                        longitude: 10.5,
                        sign: "Aries",
                        signTamil: "மேஷம்",
                        signLord: "Mars",
                        nakshatra: "Ashwini",
                        nakshatraLord: "Ketu",
                        dignity: "Own House"
                    }
                }
            }
        };

        render(<PlanetaryTable planets={mockNestedChart} />);
        expect(screen.getAllByText('செவ்வாய்').length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText('மேஷம்')).toBeDefined();
        expect(screen.getByText('அசுவினி')).toBeDefined();
        expect(screen.getByText('கேது')).toBeDefined();
    });

    it('should render table when passed formattedPlanets array', () => {
        const mockFormattedPlanets = [
            {
                planetName: "Sun",
                planetTamil: "சூரியன்",
                signName: "Aries",
                signTamil: "மேஷம்",
                lordName: "Mars",
                lordTamil: "செவ்வாய்",
                nakshatraName: "Ashwini",
                nakshatraTamil: "அசுவினி",
                nakshatraLord: "Ketu",
                nakshatraLordTamil: "கேது",
                dignity: "Exalted",
                dignityTamil: "உச்சம்"
            }
        ];

        render(<PlanetaryTable planets={mockFormattedPlanets} />);
        expect(screen.getByText('சூரியன்')).toBeDefined();
        expect(screen.getByText('மேஷம்')).toBeDefined();
        expect(screen.getByText('செவ்வாய்')).toBeDefined();
        expect(screen.getByText('கேது')).toBeDefined();
        expect(screen.getByText('அசுவினி')).toBeDefined();
    });

    it('should render fallback message when planets is null or empty', () => {
        render(<PlanetaryTable planets={null} />);
        expect(screen.getByText(/No planetary data available/i)).toBeDefined();
    });

    it('should prepend Ascendant when formattedPlanets and ascendant are provided in object', () => {
        const payload = {
            formattedPlanets: [
                {
                    planetName: "Sun",
                    planetTamil: "சூரியன்",
                    signName: "Leo",
                    signTamil: "சிம்மம்",
                    lordName: "Sun",
                    lordTamil: "சூரியன்",
                    nakshatraName: "Magha",
                    nakshatraTamil: "மகம்",
                    nakshatraLord: "Ketu",
                    nakshatraLordTamil: "கேது"
                }
            ],
            ascendant: {
                longitude: 125.5,
                sign: {
                    name: "Leo",
                    tamil: "சிம்மம்",
                    lord: "Sun",
                    lordTamil: "சூரியன்",
                    degreesInSign: 5.5
                }
            }
        };

        render(<PlanetaryTable planets={payload} />);
        expect(screen.getByText('லக்னம்')).toBeDefined();
        expect(screen.getAllByText('சூரியன்').length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText('சிம்மம்').length).toBeGreaterThanOrEqual(2);
    });
});
