import React from 'react';

const PlanetaryTable = ({ planets, style = {} }) => {
    if (!planets || planets.length === 0) return <div>No planetary data available</div>;

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
                    {planets.map((p, index) => (
                        <tr key={index} style={index % 2 === 0 ? trEvenStyle : trOddStyle}>
                            <td style={tdStyle}>{p.planetTamil || p.planetName}</td>
                            <td style={tdStyle}>{p.signTamil || p.signName}</td>
                            <td style={tdStyle}>{p.lordTamil || p.lordName}</td>
                            <td style={tdStyle}>{p.nakshatraLordTamil || p.nakshatraLord}</td>
                            <td style={tdStyle}>{p.nakshatraTamil || p.nakshatraName}</td>
                            <td style={tdStyle}>{p.degreeFormatted}</td>
                            <td style={tdStyle}>{p.dignityTamil || p.dignityName}</td>
                            <td style={tdStyle}>{p.avasthaTamil || p.avasthaName}</td>
                            <td style={tdStyle}>{p.stateTamil || p.stateName}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default PlanetaryTable;
