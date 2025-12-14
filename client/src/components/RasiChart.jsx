import React from 'react';

// South Indian Chart Layout
// The signs are fixed in position:
// 12 (Pisces) | 1 (Aries)   | 2 (Taurus) | 3 (Gemini)
// 11 (Aquar)  |             |            | 4 (Cancer)
// 10 (Capri)  |             |            | 5 (Leo)
// 9  (Sagit)  | 8 (Scorpio) | 7 (Libra)  | 6 (Virgo)

const signs = [
    { id: 12, name: 'Pisces', label: 'Pisces' },
    { id: 1, name: 'Aries', label: 'Aries' },
    { id: 2, name: 'Taurus', label: 'Taurus' },
    { id: 3, name: 'Gemini', label: 'Gemini' },
    { id: 11, name: 'Aquarius', label: 'Aquarius' },
    { id: 4, name: 'Cancer', label: 'Cancer' },
    { id: 10, name: 'Capricorn', label: 'Capricorn' },
    { id: 5, name: 'Leo', label: 'Leo' },
    { id: 9, name: 'Sagittarius', label: 'Sagittarius' },
    { id: 8, name: 'Scorpio', label: 'Scorpio' },
    { id: 7, name: 'Libra', label: 'Libra' },
    { id: 6, name: 'Virgo', label: 'Virgo' }
];

// Map grid position to Sign ID for the render loop
// We render a 4x4 grid.
// Row 1: 12, 1, 2, 3
// Row 2: 11, null, null, 4
// Row 3: 10, null, null, 5
// Row 4: 9, 8, 7, 6

const gridMap = [
    12, 1, 2, 3,
    11, null, null, 4,
    10, null, null, 5,
    9, 8, 7, 6
];

const RasiChart = ({ data }) => {
    // Helper to find planets in a sign
    const getPlanetsInSign = (signId) => {
        if (!data || !data.planets) return [];
        // Assuming data.planets is an array or object.
        // Based on typical API: { planets: [ { name: 'Sun', sign: 5, ... }, ... ] }
        // Or sometimes the API returns keys like "Sun": { ... sign: 5 }
        // I'll handle both array and object.

        let planets = [];

        if (Array.isArray(data.planets)) {
             planets = data.planets.filter(p => p.sign === signId || p.signId === signId); // Adjust based on actual API
        } else if (typeof data.planets === 'object') {
            // Iterate keys
            Object.keys(data.planets).forEach(key => {
                const p = data.planets[key];
                 // Check if p has sign property.
                 // Sometimes the key is the planet name
                 if (p.current_sign === signId || p.sign === signId) {
                     planets.push({ ...p, name: key });
                 }
            });
        }

        // Also check for Ascendant (Lagna)
        if (data.ascendant && (data.ascendant.sign === signId || data.ascendant.current_sign === signId)) {
            planets.push({ name: 'Asc', isAsc: true });
        }

        return planets;
    };

    return (
        <div className="w-full max-w-md mx-auto aspect-square bg-[#ffebcd] border-4 border-orange-800 shadow-2xl relative">
            <div className="absolute top-0 left-0 w-full h-full grid grid-cols-4 grid-rows-4 gap-0.5 bg-orange-900">
                {gridMap.map((signId, index) => {
                    if (signId === null) {
                         // Center box (merged)
                         if (index === 5) {
                            return (
                                <div key="center" className="col-span-2 row-span-2 bg-white flex flex-col items-center justify-center p-2 text-center">
                                    <h3 className="text-xl font-bold text-orange-800">Rasi Chart</h3>
                                    <p className="text-xs text-gray-500">D1</p>
                                    <div className="mt-2 text-4xl text-orange-600 opacity-20">🕉️</div>
                                </div>
                            );
                         }
                         return null; // Skip occupied cells
                    }

                    const planets = getPlanetsInSign(signId);

                    return (
                        <div key={signId} className="bg-[#ffebcd] relative p-1 flex flex-col hover:bg-orange-100 transition-colors">
                            <span className="absolute top-0 right-1 text-[10px] text-gray-400 font-bold">{signId}</span>
                            <div className="flex-1 flex flex-wrap content-center justify-center gap-1 overflow-hidden">
                                {planets.map((p, idx) => (
                                    <span
                                        key={idx}
                                        className={`text-xs font-bold px-1 rounded ${p.isAsc ? 'bg-red-500 text-white' : 'text-purple-900'}`}
                                        title={p.fullDegree ? `${p.name}: ${p.fullDegree}` : p.name}
                                    >
                                        {p.name.substring(0, 2)}
                                    </span>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default RasiChart;
