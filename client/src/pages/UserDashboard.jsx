import React, { useContext, useState } from 'react';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import RasiChart from '../components/RasiChart';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Typography, Box } from '@mui/material';

// Player Roles & Stats Mock
const signs = [
    { id: 1, name: 'Aries' }, { id: 2, name: 'Taurus' }, { id: 3, name: 'Gemini' }, { id: 4, name: 'Cancer' },
    { id: 5, name: 'Leo' }, { id: 6, name: 'Virgo' }, { id: 7, name: 'Libra' }, { id: 8, name: 'Scorpio' },
    { id: 9, name: 'Sagittarius' }, { id: 10, name: 'Capricorn' }, { id: 11, name: 'Aquarius' }, { id: 12, name: 'Pisces' }
];

const UserDashboard = () => {
    const { logout, user } = useContext(AuthContext);

    // Enhanced Mock Data with "Cricket Stats"
    const [players] = useState([
        { id: 1, name: "Sachin Tendulkar", dob: "24-04-1973", time: "12:00", lat: 18.9750, lng: 72.8258, country: "India", role: "Master Blaster", rating: 5, online: true },
        { id: 2, name: "Virat Kohli", dob: "05-11-1988", time: "10:30", lat: 28.6139, lng: 77.2090, country: "India", role: "Chase Master", rating: 5, online: false },
        { id: 3, name: "MS Dhoni", dob: "07-07-1981", time: "11:15", lat: 23.3441, lng: 85.3096, country: "India", role: "Captain Cool", rating: 4, online: true },
        { id: 4, name: "Rohit Sharma", dob: "30-04-1987", time: "09:45", lat: 21.1458, lng: 79.0882, country: "India", role: "Hitman", rating: 4, online: true },
    ]);

    const [selectedPlayer, setSelectedPlayer] = useState(null);
    const [chartData, setChartData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [format, setFormat] = useState('T20'); // Filter state

    const handlePlayerClick = async (player) => {
        setSelectedPlayer(player);
        setLoading(true);
        setChartData(null);

        const [day, month, year] = player.dob.split('-').map(Number);
        const [hour, minute] = player.time.split(':').map(Number);

        const payload = {
            day, month, year, hour, minute,
            latitude: player.lat, longitude: player.lng, timezone: 5.5
        };

        try {
            const token = localStorage.getItem('token');
            const res = await axios.post('/api/charts/birth-chart', payload, {
                headers: { 'x-auth-token': token }
            });
            setChartData(res.data);
        } catch (err) {
            console.error("Error fetching chart:", err);
            alert("Umpire Signal: Dead Ball (API Error)");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex h-screen bg-pitch-sky overflow-hidden font-sans">
            {/* Left Sidebar: Pavilion (Player List) */}
            <div className="w-1/4 md:w-80 bg-white/90 backdrop-blur-md flex flex-col shadow-2xl z-20 border-r-4 border-cricketGold">
                {/* Header Profile */}
                <div className="p-4 bg-cricketGreen text-white border-b-4 border-pitchBrown shadow-sm relative overflow-hidden">
                    <div className="relative z-10 flex justify-between items-start">
                        <div>
                            <h2 className="text-xl font-heading font-black italic uppercase tracking-tighter">Fan Pavilion</h2>
                            <p className="text-xs text-cricketGold mt-1 font-score tracking-widest uppercase">ID: {user?.username?.split('@')[0]}</p>
                        </div>
                        <div className="flex flex-col items-end">
                             <div className="bg-black/40 rounded px-2 py-1 text-cricketGold font-score text-xl border border-cricketGold/30">
                                🏆 1,450
                             </div>
                             <span className="text-[10px] uppercase text-green-200 mt-1">Wallet Warning</span>
                        </div>
                    </div>
                </div>

                {/* Filter Tabs (Format) */}
                <div className="flex bg-green-800 p-1 space-x-1">
                    {['T20', 'ODI', 'TEST'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFormat(f)}
                            className={`flex-1 py-2 text-xs font-bold uppercase transition-all ${format === f ? 'bg-cricketGold text-black shadow-inner' : 'bg-transparent text-green-200 hover:bg-green-700'}`}
                        >
                            {f}
                        </button>
                    ))}
                </div>

                {/* Player List (MUI Table) */}
                <div className="flex-1 overflow-y-auto p-3 bg-gray-50">
                    <TableContainer component={Paper} elevation={3} sx={{ borderRadius: 2 }}>
                        <Table sx={{ minWidth: 300 }} aria-label="player table">
                            <TableHead sx={{ backgroundColor: '#0A5B1D' }}>
                                <TableRow>
                                    <TableCell sx={{ color: 'white', fontWeight: 'bold', fontFamily: 'Montserrat' }}>PLAYER</TableCell>
                                    <TableCell sx={{ color: 'white', fontWeight: 'bold', fontFamily: 'Montserrat' }}>DOB</TableCell>
                                    <TableCell sx={{ color: 'white', fontWeight: 'bold', fontFamily: 'Montserrat' }}>PLACE</TableCell>
                                    <TableCell sx={{ color: 'white', fontWeight: 'bold', fontFamily: 'Montserrat' }}>ACTION</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {players.map((player) => (
                                    <TableRow
                                        key={player.id}
                                        hover
                                        selected={selectedPlayer?.id === player.id}
                                        sx={{
                                            '&.Mui-selected': { backgroundColor: 'rgba(10, 91, 29, 0.08) !important' },
                                            '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' }
                                         }}
                                    >
                                        <TableCell component="th" scope="row">
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-cricketGreen flex items-center justify-center mr-2 relative">
                                                    🏏
                                                    {player.online && (
                                                         <span className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 border-2 border-white rounded-full"></span>
                                                     )}
                                                </div>
                                                <div>
                                                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', fontFamily: 'Montserrat' }}>{player.name}</Typography>
                                                    <Typography variant="caption" sx={{ color: 'gray' }}>{player.role}</Typography>
                                                </div>
                                            </Box>
                                        </TableCell>
                                        <TableCell sx={{ fontFamily: 'Open Sans' }}>{player.dob}</TableCell>
                                        <TableCell>
                                            <Typography variant="caption" display="block">{player.lat.toFixed(2)}, {player.lng.toFixed(2)}</Typography>
                                            <Typography variant="caption" color="textSecondary">{player.country}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="contained"
                                                size="small"
                                                onClick={() => handlePlayerClick(player)}
                                                sx={{
                                                    backgroundColor: '#FFD700',
                                                    color: 'black',
                                                    fontWeight: 'bold',
                                                    fontSize: '0.7rem',
                                                    '&:hover': { backgroundColor: '#e6c200' }
                                                }}
                                            >
                                                View Chart
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </div>

                {/* Footer Actions */}
                <div className="p-4 bg-gray-100 border-t border-gray-300">
                    <button onClick={logout} className="w-full bg-cricketRed hover:bg-red-700 text-white font-heading uppercase font-bold py-3 rounded shadow-lg transition-transform active:scale-95 flex items-center justify-center">
                        <span className="mr-2">☝️</span> Retire Hurt (Logout)
                    </button>
                </div>
            </div>

            {/* Right Main Area: The Pitch */}
            <div className="flex-1 overflow-y-auto relative bg-[url('https://www.transparenttextures.com/patterns/grass.png')] bg-fixed" style={{backgroundColor: '#0A5B1D'}}>
                {/* Overlay gradient for depth */}
                <div className="absolute inset-0 bg-gradient-to-br from-black/20 to-transparent pointer-events-none"></div>

                {/* Top Bar / Commentary Box Header */}
                <div className="sticky top-0 z-10 bg-white/10 backdrop-blur-md border-b border-white/20 p-4 flex justify-between items-center text-white px-8">
                     <div className="flex items-center space-x-3">
                         <span className="text-3xl">🎙️</span>
                         <div>
                             <h1 className="font-heading font-black uppercase text-shadow-sm tracking-wide">Commentary Box</h1>
                             <p className="text-xs text-green-200 uppercase font-score">Live from Wankhede Stadium</p>
                         </div>
                     </div>
                     <div className="hidden md:flex items-center space-x-6 text-sm font-semibold font-score tracking-widest">
                         <div className="flex flex-col items-center">
                             <span className="text-cricketGold text-xl">00:45:00</span>
                             <span className="text-[10px] text-green-300 uppercase">Session Time</span>
                         </div>
                         <div className="w-px h-8 bg-white/20"></div>
                         <div className="text-center">
                            <span className="block text-xl">24°C</span>
                            <span className="text-[10px] text-green-300 uppercase">Weather</span>
                         </div>
                     </div>
                </div>

                <div className="p-8 relative z-0">
                    {!selectedPlayer ? (
                        <div className="h-[70vh] flex flex-col items-center justify-center text-white/60 animate-in fade-in zoom-in duration-500">
                             <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm mb-6 border-4 border-white/20">
                                 <span className="text-6xl animate-bounce">🏏</span>
                             </div>
                            <h2 className="text-3xl font-heading font-bold uppercase tracking-widest text-white drop-shadow-lg">Pitch is Ready</h2>
                            <p className="font-sans text-lg mt-2 text-center max-w-md">Select a player from the Pavilion to start the <span className="text-cricketGold font-bold">Pitch Report</span> (Astrology Analysis)</p>
                        </div>
                    ) : (
                        <div className="max-w-6xl mx-auto space-y-6">
                            {/* Summary Card */}
                            <div className="bg-white rounded-xl shadow-2xl overflow-hidden border-t-8 border-cricketGold transform transition-all duration-500 hover:shadow-cricketGold/20">
                                <div className="p-6 flex flex-col md:flex-row justify-between items-center bg-gray-50 border-b border-gray-100">
                                    <div>
                                        <h1 className="text-4xl font-heading font-black text-cricketGreen uppercase tracking-tight">{selectedPlayer.name}</h1>
                                        <div className="flex space-x-4 mt-2 text-sm font-heading font-semibold text-gray-500 uppercase tracking-wide">
                                            <span className="flex items-center"><span className="mr-1 text-pitchBrown">📅</span> {selectedPlayer.dob}</span>
                                            <span className="flex items-center"><span className="mr-1 text-pitchBrown">⏰</span> {selectedPlayer.time}</span>
                                            <span className="flex items-center"><span className="mr-1 text-pitchBrown">📍</span> {selectedPlayer.lat}, {selectedPlayer.lng}</span>
                                        </div>
                                    </div>
                                    <div className="mt-4 md:mt-0">
                                        <button className="bg-cricketGreen text-white px-6 py-2 rounded-full font-bold uppercase text-xs tracking-widest hover:bg-green-900 transition shadow-lg flex items-center">
                                            <span className="mr-2 text-lg">📹</span> Request DRS (Video Call)
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Main Analysis Section */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Left Column: Pitch Report (Chart) */}
                                <div className="lg:col-span-1">
                                    <div className="bg-white rounded-xl shadow-xl overflow-hidden h-full border border-gray-200">
                                        <div className="bg-cricketGreen p-3 text-center border-b border-green-800">
                                            <h2 className="text-white font-heading font-bold uppercase tracking-widest text-sm">Pitch Report (Rasi Chart)</h2>
                                        </div>
                                        <div className="p-6 bg-[#ffebcd]/30 flex items-center justify-center min-h-[300px]">
                                            {loading ? (
                                                <div className="flex flex-col items-center">
                                                    <div className="w-12 h-12 border-4 border-cricketGreen border-t-cricketGold rounded-full animate-spin"></div>
                                                    <p className="mt-4 font-score font-bold text-cricketGreen animate-pulse uppercase tracking-widest">Reviewing Decision...</p>
                                                </div>
                                            ) : chartData ? (
                                                <div className="transform scale-[0.85] origin-top">
                                                     <RasiChart data={chartData} />
                                                </div>
                                            ) : (
                                                <p className="text-gray-400 font-bold uppercase">No Data</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Match Stats (Table) */}
                                <div className="lg:col-span-2">
                                     <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200 h-full flex flex-col">
                                         <div className="bg-pitchBrown p-3 flex justify-between items-center text-white border-b border-yellow-700">
                                             <h2 className="font-heading font-bold uppercase tracking-widest text-sm">Field Placements (Planetary Positions)</h2>
                                             <div className="text-[10px] font-score bg-black/30 px-2 py-1 rounded border border-white/20">LIVE DATA</div>
                                         </div>

                                         <div className="flex-1 overflow-x-auto p-0">
                                             {loading ? (
                                                 <div className="h-full w-full bg-gray-50 animate-pulse"></div>
                                             ) : chartData ? (
                                                <table className="w-full text-left border-collapse">
                                                    <thead className="bg-gray-100 text-gray-600 font-heading text-xs uppercase tracking-wider">
                                                        <tr>
                                                            <th className="p-4 border-b">Player (Planet)</th>
                                                            <th className="p-4 border-b">Position (Sign)</th>
                                                            <th className="p-4 border-b">Form (Nakshatra)</th>
                                                            <th className="p-4 border-b text-right">Deg</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="font-sans text-sm text-gray-700 divide-y divide-gray-100">
                                                        {chartData.planets && Object.entries(chartData.planets).map(([key, planet], idx) => (
                                                            <tr key={key} className="hover:bg-green-50 transition-colors group">
                                                                <td className="p-4 font-bold text-cricketGreen group-hover:text-green-800 flex items-center">
                                                                    <span className="w-6 h-6 rounded bg-gray-200 mr-3 flex items-center justify-center text-[10px] font-bold text-gray-500 shadow-inner">{idx + 1}</span>
                                                                    {key}
                                                                </td>
                                                                <td className="p-4">
                                                                    <span className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-bold uppercase">
                                                                        {planet.current_sign ? signs.find(s => s.id === planet.current_sign)?.name : planet.sign}
                                                                    </span>
                                                                </td>
                                                                <td className="p-4 text-gray-500 font-semibold">{planet.nakshatra || '-'}</td>
                                                                <td className="p-4 text-right font-score font-bold tracking-widest text-gray-800">{planet.normDegree ? planet.normDegree.toFixed(2)+"°" : '-'}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                             ) : (
                                                 <div className="p-8 text-center text-gray-400">Waiting for data...</div>
                                             )}
                                         </div>
                                     </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserDashboard;
