import React, { useContext, useState, useEffect } from 'react';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import RasiChart from '../components/RasiChart';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, Typography, Box, TextField, InputAdornment, TablePagination,
    Select, MenuItem, FormControl, InputLabel, Collapse, IconButton,
    Container, AppBar, Toolbar, Avatar, Chip, Grid, Card, CardContent, Button
} from '@mui/material';

// --- DATA CONSTANTS ---
const signs = [
    { id: 1, name: 'Aries' }, { id: 2, name: 'Taurus' }, { id: 3, name: 'Gemini' }, { id: 4, name: 'Cancer' },
    { id: 5, name: 'Leo' }, { id: 6, name: 'Virgo' }, { id: 7, name: 'Libra' }, { id: 8, name: 'Scorpio' },
    { id: 9, name: 'Sagittarius' }, { id: 10, name: 'Capricorn' }, { id: 11, name: 'Aquarius' }, { id: 12, name: 'Pisces' }
];

const nakshatras = [
    "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashirsha", "Ardra", "Punarvasu", "Pushya", "Ashlesha",
    "Magha", "Purva Phalguni", "Uttara Phalguni", "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha",
    "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha", "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"
];

// --- HELPERS ---
const getFlag = (player) => {
    const tz = player.timezone || '';
    const place = player.birthPlace || '';
    if (tz.includes('Kolkata') || place.includes('India') || place.includes('Mumbai') || place.includes('Pune')) return '🇮🇳';
    if (tz.includes('Australia') || place.includes('Australia')) return '🇦🇺';
    if (tz.includes('London') || place.includes('UK') || place.includes('England')) return '🇬🇧';
    if (tz.includes('Johannesburg') || place.includes('South Africa')) return '🇿🇦';
    if (tz.includes('Auckland') || place.includes('New Zealand')) return '🇳🇿';
    if (tz.includes('Colombo') || place.includes('Sri Lanka')) return '🇱🇰';
    if (tz.includes('Karachi') || place.includes('Pakistan')) return '🇵🇰';
    if (tz.includes('Dhaka') || place.includes('Bangladesh')) return '🇧🇩';
    if (tz.includes('USA') || place.includes('New_York')) return '🇺🇸';
    if (place.includes('West Indies')) return '🌴';
    if (place.includes('Afghanistan')) return '🇦🇫';
    return '🏳️';
};

// --- COMPONENTS ---

// Expanded Detail View inside the Row
const PlayerDetailPanel = ({ player }) => {
    const chart = player.birthChart?.data || player.birthChart;
    const planets = chart?.planets;

    return (
        <Box sx={{ p: 3, backgroundColor: '#f8fafc' }}>
            <Grid container spacing={3}>
                {/* Left: Rasi Chart */}
                <Grid item xs={12} md={4}>
                    <Paper elevation={2} sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Typography variant="subtitle2" color="primary" gutterBottom sx={{ fontWeight: 'bold', letterSpacing: 1 }}>RASI CHART (D1)</Typography>
                        {player.birthChart ? (
                            <RasiChart data={chart} />
                        ) : (
                            <Box sx={{ p: 4, color: 'text.secondary' }}>No Chart Data</Box>
                        )}
                    </Paper>
                </Grid>

                {/* Right: Planetary Scoreboard */}
                <Grid item xs={12} md={8}>
                     <Paper elevation={2} sx={{ p: 2 }}>
                        <Typography variant="subtitle2" color="primary" gutterBottom sx={{ fontWeight: 'bold', letterSpacing: 1 }}>PLANETARY POSITIONS</Typography>
                        <Table size="small">
                            <TableHead>
                                <TableRow sx={{ backgroundColor: '#e2e8f0' }}>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Planet</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Sign</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Nakshatra</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Degree</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {planets ? Object.entries(planets).map(([key, p]) => {
                                    const signName = p.current_sign ? signs.find(s => s.id == p.current_sign)?.name : p.sign;
                                    return (
                                        <TableRow key={key} hover>
                                            <TableCell>
                                                <b>{key}</b>
                                            </TableCell>
                                            <TableCell>{signName}</TableCell>
                                            <TableCell>{p.nakshatra}</TableCell>
                                            <TableCell>{p.normDegree?.toFixed(2)}°</TableCell>
                                            <TableCell>
                                                {p.isRetro && <Chip label="R" color="error" size="small" sx={{ height: 20, fontSize: '0.65rem' }} />}
                                                {key === 'Jupiter' || key === 'Venus' ? <span className="ml-1 text-yellow-600">✨</span> : null}
                                            </TableCell>
                                        </TableRow>
                                    );
                                }) : (
                                    <TableRow><TableCell colSpan={5}>No planetary data</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                     </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

const PlayerRow = ({ player, isSelected, onClick }) => {
    const [open, setOpen] = useState(false);

    // Get basic stats
    const chart = player.birthChart?.data || player.birthChart;
    const moon = chart?.planets?.Moon;
    const rasiName = moon ? signs.find(s => s.id == (moon.current_sign || moon.sign))?.name : '-';
    const starName = moon?.nakshatra || '-';

    const handleExpandIds = (e) => {
        e.stopPropagation();
        setOpen(!open);
        onClick(player); // Also select contextually if needed
    };

    return (
        <>
            <TableRow
                hover
                onClick={handleExpandIds}
                selected={open}
                sx={{
                    cursor: 'pointer',
                    '&.Mui-selected': { backgroundColor: 'rgba(37, 99, 235, 0.08) !important' },
                    '&:hover': { backgroundColor: 'rgba(0,0,0,0.02)' }
                }}
            >
                <TableCell width="50">
                    <IconButton size="small" onClick={handleExpandIds}>
                        {open ? '▲' : '▼'}
                    </IconButton>
                </TableCell>
                <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar
                            src={player.profile}
                            alt={player.name}
                            sx={{ width: 40, height: 40, border: '2px solid white', boxShadow: 1 }}
                        >
                            {player.name?.[0]}
                        </Avatar>
                        <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#0f172a' }}>
                                {player.name} {getFlag(player)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                ID: {player.id?.substring(0,6)}
                            </Typography>
                        </Box>
                    </Box>
                </TableCell>
                <TableCell>
                    <Typography variant="body2">{player.birthPlace || 'Unknown'}</Typography>
                    <Typography variant="caption" color="text.secondary">{player.dob}</Typography>
                </TableCell>
                <TableCell>
                    <Chip
                        label={`Moon: ${rasiName}`}
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{ mr: 1, borderColor: '#cad5e1', color: '#475569' }}
                    />
                </TableCell>
                <TableCell align="right">
                    <Typography variant="caption" sx={{ color: player.birthChart ? 'green' : 'gray', fontWeight: 'bold' }}>
                        {player.birthChart ? '● Analysis Ready' : '○ Pending'}
                    </Typography>
                </TableCell>
            </TableRow>
            <TableRow>
                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <PlayerDetailPanel player={player} />
                    </Collapse>
                </TableCell>
            </TableRow>
        </>
    );
};

const UserDashboard = () => {
    const { logout, user } = useContext(AuthContext);

    const [players, setPlayers] = useState([]);
    const [filteredPlayers, setFilteredPlayers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [rasiFilter, setRasiFilter] = useState('');
    const [nakshatraFilter, setNakshatraFilter] = useState('');

    useEffect(() => {
        const fetchPlayers = async () => {
            try {
                const baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';
                const res = await axios.get(`${baseUrl}/api/players`);
                setPlayers(res.data);
                setFilteredPlayers(res.data);
            } catch (err) {
                console.error("Error fetching players:", err);
            }
        };
        fetchPlayers();
    }, []);

    useEffect(() => {
        const lowerSearch = searchTerm.toLowerCase();
        const filtered = players.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(lowerSearch) ||
                                (p.birthPlace && p.birthPlace.toLowerCase().includes(lowerSearch));

            let matchesRasi = true;
            if (rasiFilter) {
                const chart = p.birthChart?.data || p.birthChart;
                const moonSign = chart?.planets?.Moon?.current_sign || chart?.planets?.Moon?.sign;
                matchesRasi = moonSign == rasiFilter;
            }

            let matchesNakshatra = true;
            if (nakshatraFilter) {
                const chart = p.birthChart?.data || p.birthChart;
                const moonNak = chart?.planets?.Moon?.nakshatra;
                matchesNakshatra = moonNak && moonNak.includes(nakshatraFilter);
            }

            return matchesSearch && matchesRasi && matchesNakshatra;
        });
        setFilteredPlayers(filtered);
        setPage(0);
    }, [searchTerm, players, rasiFilter, nakshatraFilter]);

    // Handle dummy click for row context
    const handlePlayerClick = (p) => {
        // Logic to update global state if needed in future
    };

    return (
        <Box sx={{ minHeight: '100vh', backgroundColor: 'transparent', pb: 4 }}>
            {/* AppBar */}
            <AppBar position="static" sx={{ backgroundColor: 'white', color: '#1e3a8a', boxShadow: 1 }}>
                <Toolbar>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: '900', letterSpacing: -1, display: 'flex', alignItems: 'center' }}>
                         <span className="text-royal-blue mr-2">⚛️</span> ASTRO CRICKET <span className="ml-2 text-xs opacity-50 font-mono tracking-widest border px-1 rounded">ADMIN DATA GRID</span>
                    </Typography>
                    <Button color="inherit" onClick={logout} sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Logout</Button>
                </Toolbar>
            </AppBar>

            <Container maxWidth="xl" sx={{ mt: 4 }}>

                {/* Filters */}
                <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }} elevation={0}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={4}>
                            <TextField
                                fullWidth
                                variant="outlined"
                                size="small"
                                placeholder="Search Players, Cities..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                InputProps={{
                                    startAdornment: <InputAdornment position="start">🔍</InputAdornment>,
                                }}
                                sx={{ backgroundColor: '#f8fafc' }}
                            />
                        </Grid>
                        <Grid item xs={6} md={3}>
                            <FormControl size="small" fullWidth>
                                <Select
                                    value={rasiFilter}
                                    onChange={(e) => setRasiFilter(e.target.value)}
                                    displayEmpty
                                    sx={{ backgroundColor: '#f8fafc' }}
                                >
                                    <MenuItem value=""><em>All Rasi</em></MenuItem>
                                    {signs.map((s) => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={6} md={3}>
                             <FormControl size="small" fullWidth>
                                <Select
                                    value={nakshatraFilter}
                                    onChange={(e) => setNakshatraFilter(e.target.value)}
                                    displayEmpty
                                    sx={{ backgroundColor: '#f8fafc' }}
                                >
                                    <MenuItem value=""><em>All Nakshatras</em></MenuItem>
                                    {nakshatras.map((n) => <MenuItem key={n} value={n}>{n}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={2} textAlign="right">
                             <Typography variant="caption" color="text.secondary">
                                 Total: {filteredPlayers.length}
                             </Typography>
                        </Grid>
                    </Grid>
                </Paper>

                {/* Main Table */}
                <Paper sx={{ width: '100%', overflow: 'hidden', borderRadius: 3, boxShadow: 3 }}>
                    <TableContainer sx={{ maxHeight: '75vh' }}>
                        <Table stickyHeader aria-label="sticky table">
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ backgroundColor: '#2563eb', color: 'white', width: 50 }} />
                                    <TableCell sx={{ backgroundColor: '#2563eb', color: 'white', fontWeight: 'bold' }}>PLAYER PROFILE</TableCell>
                                    <TableCell sx={{ backgroundColor: '#2563eb', color: 'white', fontWeight: 'bold' }}>ORIGIN</TableCell>
                                    <TableCell sx={{ backgroundColor: '#2563eb', color: 'white', fontWeight: 'bold' }}>KEY STATS</TableCell>
                                    <TableCell align="right" sx={{ backgroundColor: '#2563eb', color: 'white', fontWeight: 'bold' }}>STATUS</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredPlayers
                                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                    .map((player) => (
                                        <PlayerRow
                                            key={player.id}
                                            player={player}
                                            onClick={handlePlayerClick}
                                        />
                                    ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <TablePagination
                        rowsPerPageOptions={[10, 25, 100]}
                        component="div"
                        count={filteredPlayers.length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={(e, newPage) => setPage(newPage)}
                        onRowsPerPageChange={(e) => {
                            setRowsPerPage(+e.target.value);
                            setPage(0);
                        }}
                    />
                </Paper>

            </Container>
        </Box>
    );
};

export default UserDashboard;
