import React from 'react';
import RasiChart from '../components/RasiChart';

const TestChart = () => {
    const dummyData = {
        planets: {
            Sun: { name: 'Sun', current_sign: 1, fullDegree: '10.5°' },
            Moon: { name: 'Moon', current_sign: 2, fullDegree: '15.2°' },
            Mars: { name: 'Mars', current_sign: 3, fullDegree: '20.1°' },
            Jupiter: { name: 'Jupiter', current_sign: 4, fullDegree: '05.3°' },
            Venus: { name: 'Venus', current_sign: 5, fullDegree: '29.9°' },
            Saturn: { name: 'Saturn', current_sign: 6, fullDegree: '12.0°' },
            Rahu: { name: 'Rahu', current_sign: 7, fullDegree: '18.5°' },
            Ketu: { name: 'Ketu', current_sign: 1, fullDegree: '18.5°' }
        },
        ascendant: { sign: 1 }
    };

    return (
        <div className="p-10 bg-gray-100 min-h-screen flex flex-col items-center">
            <h1 className="text-2xl mb-4">Rasi Chart Test</h1>
            <RasiChart data={dummyData} />
        </div>
    );
};

export default TestChart;
