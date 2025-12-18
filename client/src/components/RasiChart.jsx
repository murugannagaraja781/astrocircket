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

        let planets = [];

        if (Array.isArray(data.planets)) {
             planets = data.planets.filter(p => p.sign === signId || p.signId === signId);
        } else if (typeof data.planets === 'object') {
            Object.keys(data.planets).forEach(key => {
                const p = data.planets[key];
                 if (p.current_sign === signId || p.sign === signId) {
                     planets.push({ ...p, name: key });
                 }
            });
        }

        if (data.ascendant && (data.ascendant.sign === signId || data.ascendant.current_sign === signId)) {
            planets.push({ name: 'Asc', isAsc: true });
        }

        return planets;
    };

    return (
        <div className="w-full max-w-md mx-auto aspect-square bg-white border-4 border-gray-800 shadow-md relative">
            <div className="absolute top-0 left-0 w-full h-full grid grid-cols-4 grid-rows-4 gap-0 bg-gray-800 border-2 border-gray-800">
                {gridMap.map((signId, index) => {
                    if (signId === null) {
                         // Center box (merged)
                         if (index === 5) {
                            return (
                                <div key="center" className="col-span-2 row-span-2 bg-white flex flex-col items-center justify-center p-2 text-center border-2 border-gray-800 m-0.5">
                                    <h3 className="text-2xl font-serif font-black text-gray-800 uppercase tracking-widest border-b-2 border-orange-500 mb-2 pb-1">RASI CHART</h3>
                                    <p className="text-xs text-gray-500 font-sans tracking-wider uppercase">D1 • South Indian Style</p>
                                    <div className="mt-4 text-5xl text-orange-600 opacity-80">🕉️</div>
                                </div>
                            );
                         }
                         return null; // Skip occupied cells
                    }

                    const planets = getPlanetsInSign(signId);

                    return (
                        <div key={signId} className="bg-white relative p-1 flex flex-col hover:bg-yellow-50 transition-colors border-0 m-0.5">
                            {/* Sign Number / Label could go here but standard South Indian charts rely on position. We adding a small number for reference. */}
                            <span className="absolute top-0 right-1 text-[9px] text-gray-400 font-mono">{signId}</span>

                            <div className="flex-1 flex flex-wrap content-center justify-center gap-1.5 overflow-hidden p-1">
                                {planets.map((p, idx) => (
                                    <span
                                        key={idx}
                                        className={`text-[11px] font-bold px-1.5 py-0.5 rounded-sm border shadow-sm items-center justify-center flex uppercase tracking-tight ${
                                            p.isAsc
                                            ? 'bg-red-600 text-white border-red-700'
                                            : 'bg-indigo-50 text-indigo-900 border-indigo-200'
                                        }`}
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
