import React from 'react';
import { tamilSigns, signLords, signLordsTamil, nakshatraTamilMap, planetFullTamilMap, getSignId } from './RasiChart';

const PlanetaryTable = ({ planets, style = {} }) => {
    let pList = [];
    if (Array.isArray(planets)) {
        pList = planets;
    } else if (planets && typeof planets === 'object') {
        pList = Object.entries(planets).map(([k, v]) => ({
            name: k,
            planetName: k,
            ...(typeof v === 'object' ? v : { longitude: v })
        }));
    }

    if (!pList || pList.length === 0) return <div>No planetary data available</div>;

    // Inline Styles for Portability
    const tableStyle = {
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '12px',
        fontFamily: 'Arial, sans-serif',
        marginTop: '10px',
        ...style
    };

    const thStyle = {
        backgroundColor: '#D1FAE5', // Light Milk Green
        color: '#064E3B', // Deep Green
        padding: '8px',
        border: '1px solid #A7F3D0',
        textAlign: 'left',
        fontWeight: 'bold'
    };

    const tdStyle = {
        padding: '6px 8px',
        border: '1px solid #A7F3D0',
        color: '#000', // Black as requested
        textAlign: 'left'
    };

    const trOddStyle = {
        backgroundColor: 'rgba(16, 185, 129, 0.05)'
    };

    const trEvenStyle = {
        backgroundColor: 'transparent'
    };

    return (
        <div style={{ overflowX: 'auto', width: '100%' }}>
            <table style={tableStyle}>
                <thead>
                    <tr>
                        <th style={thStyle}>கிரகம்</th>
                        <th style={thStyle}>ராசி</th>
                        <th style={thStyle}>ராசி நாதன்</th>
                        <th style={thStyle}>நட்சத்திர நாதன்</th>
                        <th style={thStyle}>நட்சத்திரம்</th>
                        <th style={thStyle}>பாகை</th>
                        <th style={thStyle}>அந்தஸ்து</th>
                        <th style={thStyle}>நிலை</th>
                        <th style={thStyle}>தன்மை</th>
                    </tr>
                </thead>
                <tbody>
                    {pList.map((p, index) => {
                        const pName = p.name || p.planetName || p.planet;
                        const pTamil = p.planetTamil || p.tamilName || planetFullTamilMap[pName] || pName;
                        const sId = getSignId(p.signId || p.signNumber || p.sign || p.signTamil || p.longitude);
                        const sTamil = p.signTamil || (sId ? tamilSigns[sId] : (p.sign || p.signName || '-'));
                        const lordTamil = p.lordTamil || p.signLordTamil || (sId ? signLordsTamil[signLords[sId]] : (p.signLord || p.lordName || '-'));
                        const rawNak = p.nakshatraTamil || p.nakshatra || p.nakshatraName;
                        const nakTamil = nakshatraTamilMap[rawNak] || rawNak || '-';
                        const nakLordTamil = p.nakshatraLordTamil || p.nakshatraLord || '-';
                        const degree = p.degreeFormatted || p.formattedDegree || (typeof p.degreesInSign === 'number' ? `${p.degreesInSign.toFixed(2)}°` : (typeof p.longitude === 'number' ? `${(p.longitude % 30).toFixed(2)}°` : '-'));
                        const dignity = p.dignityTamil || p.dignityName || p.dignity || '-';

                        return (
                            <tr key={index} style={index % 2 === 0 ? trEvenStyle : trOddStyle}>
                                <td style={tdStyle}>{pTamil}</td>
                                <td style={tdStyle}>{sTamil}</td>
                                <td style={tdStyle}>{lordTamil}</td>
                                <td style={tdStyle}>{nakLordTamil}</td>
                                <td style={tdStyle}>{nakTamil}</td>
                                <td style={tdStyle}>{degree}</td>
                                <td style={tdStyle}>{dignity}</td>
                                <td style={tdStyle}>{p.avasthaTamil || p.avasthaName || '-'}</td>
                                <td style={tdStyle}>{p.stateTamil || p.stateName || '-'}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

export default PlanetaryTable;
