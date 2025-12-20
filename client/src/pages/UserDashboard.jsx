import React, { useContext, useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import RasiChart from '../components/RasiChart';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, Typography, Box, TextField, InputAdornment, TablePagination,
    Select, MenuItem, FormControl, InputLabel, Collapse, IconButton,
    Container, AppBar, Toolbar, Avatar, Chip, Grid, Card, CardContent, Button,
    CircularProgress, Tabs, Tab, Divider, useMediaQuery, useTheme
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PublicIcon from '@mui/icons-material/Public';

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

// --- SUB-COMPONENTS ---

// 1. Planetary Details Table
const PlanetaryTable = ({ rawPlanets }) => {
    if (!rawPlanets) return <Typography color="text.secondary">No Planetary Data Available</Typography>;

    return (
        <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
            <Table size="small">
                <TableHead sx={{ backgroundColor: '#f0f9ff' }}>
                    <TableRow>
                        <TableCell><b>Planet</b></TableCell>
                        <TableCell><b>Sign</b></TableCell>
                        <TableCell><b>Lord</b></TableCell>
                        <TableCell><b>Nakshatra</b></TableCell>
                        <TableCell><b>Deg</b></TableCell>
                        <TableCell><b>Dignity</b></TableCell>
                        <TableCell><b>Status</b></TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {Object.values(rawPlanets).map((p) => (
                        <TableRow key={p.englishName} hover>
                            <TableCell>
                                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                    <span className="font-bold text-gray-800">{p.englishName}</span>
                                    <span className="text-xs text-blue-600">{p.tamilName}</span>
                                </Box>
                            </TableCell>
                            <TableCell>
                                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                    <span>{p.sign}</span>
                                    <span className="text-xs text-gray-500">{p.signTamil}</span>
                                </Box>
                            </TableCell>
                            <TableCell>
                                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                    <span className="font-medium text-gray-700">{p.lord}</span>
                                    <span className="text-xs text-gray-500">{p.lordTamil}</span>
                                </Box>
                            </TableCell>
                            <TableCell>
                                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                    <span>{p.nakshatra} ({p.pada})</span>
                                    <span className="text-xs text-gray-500">{p.nakshatraTamil}</span>
                                </Box>
                            </TableCell>
                            <TableCell>{parseFloat(p.degree).toFixed(2)}°</TableCell>
                            <TableCell>
                                <Chip
                                    label={p.dignity?.english || '-'}
                                    size="small"
                                    color={p.dignity?.english === 'Exalted' ? 'success' : p.dignity?.english === 'Debilitated' ? 'error' : 'default'}
                                    variant="outlined"
                                />
                            </TableCell>
                             <TableCell>
                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                    {p.isRetro && <Chip label="R" size="small" color="secondary" sx={{ height: 20 }} />}
                                    {p.isCombust && <Chip label="C" size="small" color="warning" sx={{ height: 20 }} />}
                                </Box>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

// 2. Panchangam Grid
const PanchangamGrid = ({ panchangam, birthData }) => {
    if (!panchangam) return null;

    const items = [
        { label: 'Tithi', value: panchangam.tithi?.name, sub: panchangam.tithi?.paksha },
        { label: 'Nakshatra', value: panchangam.nakshatra?.name, sub: `Pada ${panchangam.nakshatra?.pada}` },
        { label: 'Yoga', value: panchangam.yoga?.name, sub: '' },
        { label: 'Karana', value: panchangam.karana?.name, sub: '' },
        { label: 'Vara', value: panchangam.vara?.name, sub: '' },
        { label: 'Timezone', value: birthData?.timezone, sub: '' },
    ];

    return (
        <Grid container spacing={2} sx={{ mt: 1 }}>
            {items.map((item, idx) => (
                <Grid item xs={6} sm={4} md={2} key={idx}>
                    <Paper elevation={0} sx={{ p: 1.5, textAlign: 'center', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                        <Typography variant="caption" display="block" color="text.secondary" fontWeight="bold">
                            {item.label}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#0f172a', fontWeight: '500' }}>
                           {item.value}
                        </Typography>
                         {item.sub && <Typography variant="caption" color="text.secondary">{item.sub}</Typography>}
                    </Paper>
                </Grid>
            ))}
        </Grid>
    );
};

// Expanded View Component
const PlayerDetailPanel = ({ player }) => {
    const [tabValue, setTabValue] = useState(0);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const chartData = player.birthChart?.data || player.birthChart;
    const rawPlanets = chartData?.rawPlanets;
    const panchangam = chartData?.panchangam;
    const birthData = chartData?.birthData;

    if (!chartData) return <Box sx={{ p: 3 }}>No detailed astrological data available.</Box>;

    return (
        <Box sx={{ p: isMobile ? 1 : 3, backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
            <Tabs
                value={tabValue}
                onChange={(e, v) => setTabValue(v)}
                variant="scrollable"
                scrollButtons="auto"
                sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
            >
                <Tab label="🔮 Overview & Chart" />
                <Tab label="🪐 Planetary Status" />
                <Tab label="📅 Panchangam" />
            </Tabs>

            {tabValue === 0 && (
                <Grid container spacing={3}>
                    <Grid item xs={12} md={5}>
                         <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                            <RasiChart data={chartData} />
                        </Box>
                    </Grid>
                    <Grid item xs={12} md={7}>
                        <Typography variant="h6" gutterBottom color="primary">Birth Details</Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <Paper sx={{ p: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                        <AccessTimeIcon color="action" fontSize="small" />
                                        <Typography variant="subtitle2">Date & Time</Typography>
                                    </Box>
                                    <Typography variant="body1">{birthData?.date} at {birthData?.time}</Typography>
                                </Paper>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Paper sx={{ p: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                        <LocationOnIcon color="action" fontSize="small" />
                                        <Typography variant="subtitle2">Location</Typography>
                                    </Box>
                                     <Typography variant="body1">
                                        Lat: {birthData?.location?.latitude}, Long: {birthData?.location?.longitude}
                                    </Typography>
                                </Paper>
                            </Grid>
                            <Grid item xs={12}>
                                <Paper sx={{ p: 2, bgcolor: '#eff6ff' }}>
                                    <Typography variant="subtitle2" gutterBottom>Lagna (Ascendant)</Typography>
                                    <Typography variant="body1">
                                        <b>{chartData.lagna?.english} ({chartData.lagna?.tamil})</b> in {chartData.lagna?.lord} Sign
                                    </Typography>
                                </Paper>
                            </Grid>
                             <Grid item xs={12}>
                                <Paper sx={{ p: 2, bgcolor: '#fff7ed' }}>
                                    <Typography variant="subtitle2" gutterBottom>Rasi (Moon Sign)</Typography>
                                    <Typography variant="body1">
                                        <b>{chartData.moonSign?.english} ({chartData.moonSign?.tamil})</b> - {chartData.moonNakshatra?.name} Nakshatra
                                    </Typography>
                                </Paper>
                            </Grid>
                        </Grid>
                    </Grid>
                </Grid>
            )}

            {tabValue === 1 && <PlanetaryTable rawPlanets={rawPlanets} />}

            {tabValue === 2 && <PanchangamGrid panchangam={panchangam} birthData={birthData} />}
        </Box>
    );
};

const PlayerRow = ({ player }) => {
    const [open, setOpen] = useState(false);

    // Summary info for the row
    const chart = player.birthChart?.data || player.birthChart;
    const rasi = chart?.moonSign?.english || chart?.planets?.Moon?.sign || '-';
    // Use first letter of name for Avatar
    const avatarLetter = player.name ? player.name.charAt(0).toUpperCase() : '?';

    return (
        <>
            <TableRow sx={{ '& > *': { borderBottom: 'unset' }, cursor: 'pointer' }} hover onClick={() => setOpen(!open)}>
                <TableCell width="50">
                    <IconButton aria-label="expand row" size="small" onClick={(e) => { e.stopPropagation(); setOpen(!open); }}>
                        {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                    </IconButton>
                </TableCell>
                <TableCell component="th" scope="row">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar
                            src={player.profile}
                            alt={player.name}
                            sx={{ width: 44, height: 44, bgcolor: '#1e40af', fontSize: '1.2rem' }}
                        >
                            {avatarLetter}
                        </Avatar>
                        <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                {player.name} {getFlag(player)}
                            </Typography>
                             <Typography variant="caption" color="text.secondary">
                                ID: {player.id}
                            </Typography>
                        </Box>
                    </Box>
                </TableCell>
                <TableCell>
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <LocationOnIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                            <Typography variant="body2">{player.birthPlace || 'Unknown'}</Typography>
                        </Box>
                         <Typography variant="caption" color="text.secondary" sx={{ ml: 2.3 }}>
                            {player.dob}
                        </Typography>
                    </Box>
                </TableCell>
                <TableCell>
                     <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <PublicIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                        <Typography variant="body2">{player.timezone || '-'}</Typography>
                    </Box>
                </TableCell>
                 <TableCell>
                    <Chip
                        label={rasi !== '-' ? `Moon: ${rasi}` : 'No Data'}
                        size="small"
                        color={rasi !== '-' ? "primary" : "default"}
                        variant={rasi !== '-' ? "outlined" : "filled"}
                    />
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
    const { logout } = useContext(AuthContext);
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // Fetch Players
    useEffect(() => {
        const fetchPlayers = async () => {
            setLoading(true);
            try {
                // Simulate network delay to show spinner if local is too fast
                // await new Promise(resolve => setTimeout(resolve, 800));
                const baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';
                const res = await axios.get(`${baseUrl}/api/players`);
                setPlayers(res.data);
            } catch (err) {
                console.error("Error fetching players:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchPlayers();
    }, []);

    // Filter Logic
    const filteredPlayers = useMemo(() => {
        const lowerSearch = searchTerm.toLowerCase().trim();
        if (!lowerSearch) return players;

        return players.filter(p => {
            // Flatten generic data for search
            const basicMatch = (
                p.name?.toLowerCase().includes(lowerSearch) ||
                p.birthPlace?.toLowerCase().includes(lowerSearch) ||
                p.id?.toString().includes(lowerSearch)
            );

            // Deep search into chart data if exists
            let chartMatch = false;
            const chart = p.birthChart?.data || p.birthChart;
            if (chart) {
                const rasiEng = chart.moonSign?.english?.toLowerCase();
                const rasiTam = chart.moonSign?.tamil?.toLowerCase();
                const nak = chart.moonNakshatra?.name?.toLowerCase();

                if (rasiEng?.includes(lowerSearch) || rasiTam?.includes(lowerSearch) || nak?.includes(lowerSearch)) {
                    chartMatch = true;
                }
            }

            return basicMatch || chartMatch;
        });
    }, [searchTerm, players]);

    const paginatedPlayers = filteredPlayers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#f1f5f9' }}>
             {/* Header */}
            <AppBar position="sticky" sx={{ bgcolor: 'white', color: '#1e3a8a', boxShadow: 1 }}>
                <Toolbar>
                    <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 'bold', letterSpacing: -0.5, display: 'flex', alignItems: 'center' }}>
                         <span className="text-royal-blue mr-2 text-2xl">⚛️</span>
                         ASTRO CRICKET
                         <Chip label="ADMIN DASHBOARD" size="small" sx={{ ml: 2, height: 20, fontSize: '0.65rem' }} />
                    </Typography>
                    <Box>
                         <Typography variant="caption" display="block" align="right" color="text.secondary">
                            Total Players: {players.length}
                        </Typography>
                    </Box>
                    <Button color="inherit" onClick={logout} sx={{ ml: 2, fontSize: '0.8rem' }}>Logout</Button>
                </Toolbar>
            </AppBar>

            <Container maxWidth="xl" sx={{ mt: 4, pb: 8 }}>
                {/* Search Bar */}
                <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }} elevation={0}>
                    <TextField
                        fullWidth
                        variant="outlined"
                        placeholder="Search by Name, City, ID, Rasi, or Nakshatra..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon color="action" />
                                </InputAdornment>
                            ),
                        }}
                        sx={{ bgcolor: '#f8fafc' }}
                    />
                </Paper>

                {/* Content Area */}
                <Paper sx={{ borderRadius: 2, overflow: 'hidden', boxShadow: 2 }}>
                    {loading ? (
                        <Box sx={{ p: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                            <CircularProgress size={40} thickness={4} />
                            <Typography variant="body2" color="text.secondary">Loading Astronomy Data...</Typography>
                        </Box>
                    ) : (
                        <>
                            <TableContainer sx={{ maxHeight: '70vh' }}>
                                <Table stickyHeader>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell width="50" sx={{ bgcolor: '#1e40af', color: 'white' }} />
                                            <TableCell sx={{ bgcolor: '#1e40af', color: 'white', fontWeight: 'bold' }}>PLAYER PROFILE</TableCell>
                                            <TableCell sx={{ bgcolor: '#1e40af', color: 'white', fontWeight: 'bold' }}>BIRTH PLACE</TableCell>
                                            <TableCell sx={{ bgcolor: '#1e40af', color: 'white', fontWeight: 'bold' }}>TIMEZONE</TableCell>
                                            <TableCell sx={{ bgcolor: '#1e40af', color: 'white', fontWeight: 'bold' }}>CHART SUMMARY</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {paginatedPlayers.length > 0 ? (
                                            paginatedPlayers.map((player) => (
                                                <PlayerRow key={player._id || player.id} player={player} />
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                                                    <Typography color="text.secondary">No players found matching "{searchTerm}"</Typography>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                            <TablePagination
                                rowsPerPageOptions={[10, 25, 50]}
                                component="div"
                                count={filteredPlayers.length}
                                rowsPerPage={rowsPerPage}
                                page={page}
                                onPageChange={(e, newPage) => setPage(newPage)}
                                onRowsPerPageChange={(e) => {
                                    setRowsPerPage(parseInt(e.target.value, 10));
                                    setPage(0);
                                }}
                            />
                        </>
                    )}
                </Paper>
            </Container>
        </Box>
    );
};

export default UserDashboard;
