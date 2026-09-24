import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
    Box,
    Typography,
    Paper,
    Grid,
    Button,
    Chip,
    Avatar,
    TextField,
    Autocomplete,
    Tabs,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Tooltip,
    CircularProgress,
    Alert,
    Snackbar,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    LinearProgress,
    Divider,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from '@mui/material';
import SportsCricketIcon from '@mui/icons-material/SportsCricket';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import HistoryEduIcon from '@mui/icons-material/HistoryEdu';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import RefreshIcon from '@mui/icons-material/Refresh';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import SearchIcon from '@mui/icons-material/Search';
import PublicIcon from '@mui/icons-material/Public';
import PersonIcon from '@mui/icons-material/Person';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PlaceIcon from '@mui/icons-material/Place';
import EditIcon from '@mui/icons-material/Edit';

const NAKSHATRAS_27 = [
    { name: 'Ashwini', no: 1, tamil: 'அஸ்வினி', lord: 'Ketu' },
    { name: 'Bharani', no: 2, tamil: 'பரணி', lord: 'Venus' },
    { name: 'Krittika', no: 3, tamil: 'கார்த்திகை', lord: 'Sun' },
    { name: 'Rohini', no: 4, tamil: 'ரோகிணி', lord: 'Moon' },
    { name: 'Mrigashirsha', no: 5, tamil: 'மிருகசீரிஷம்', lord: 'Mars' },
    { name: 'Ardra', no: 6, tamil: 'திருவாதிரை', lord: 'Rahu' },
    { name: 'Punarvasu', no: 7, tamil: 'புனர்பூசம்', lord: 'Jupiter' },
    { name: 'Pushya', no: 8, tamil: 'பூசம்', lord: 'Saturn' },
    { name: 'Ashlesha', no: 9, tamil: 'ஆயில்யம்', lord: 'Mercury' },
    { name: 'Magha', no: 10, tamil: 'மகம்', lord: 'Ketu' },
    { name: 'Purva Phalguni', no: 11, tamil: 'பூரம்', lord: 'Venus' },
    { name: 'Uttara Phalguni', no: 12, tamil: 'உத்திரம்', lord: 'Sun' },
    { name: 'Hasta', no: 13, tamil: 'ஹஸ்தம்', lord: 'Moon' },
    { name: 'Chitra', no: 14, tamil: 'சித்திரை', lord: 'Mars' },
    { name: 'Swati', no: 15, tamil: 'சுவாதி', lord: 'Rahu' },
    { name: 'Vishakha', no: 16, tamil: 'விசாகம்', lord: 'Jupiter' },
    { name: 'Anuradha', no: 17, tamil: 'அனுஷம்', lord: 'Saturn' },
    { name: 'Jyeshtha', no: 18, tamil: 'கேட்டை', lord: 'Mercury' },
    { name: 'Mula', no: 19, tamil: 'மூலம்', lord: 'Ketu' },
    { name: 'Purva Ashadha', no: 20, tamil: 'பூராடம்', lord: 'Venus' },
    { name: 'Uttara Ashadha', no: 21, tamil: 'உத்திராடம்', lord: 'Sun' },
    { name: 'Shravana', no: 22, tamil: 'திருவோணம்', lord: 'Moon' },
    { name: 'Dhanishta', no: 23, tamil: 'அவிட்டம்', lord: 'Mars' },
    { name: 'Shatabhisha', no: 24, tamil: 'சதயம்', lord: 'Rahu' },
    { name: 'Purva Bhadrapada', no: 25, tamil: 'பூரட்டாதி', lord: 'Jupiter' },
    { name: 'Uttara Bhadrapada', no: 26, tamil: 'உத்திரட்டாதி', lord: 'Saturn' },
    { name: 'Revati', no: 27, tamil: 'ரேவதி', lord: 'Mercury' }
];

const TARA_COLORS = {
    'Sadhana': { bg: 'rgba(16, 185, 129, 0.15)', text: '#10B981', border: '#10B981', label: 'Supreme' },
    'Sampat': { bg: 'rgba(59, 130, 246, 0.15)', text: '#3B82F6', border: '#3B82F6', label: 'High Auspicious' },
    'Parama Mitra': { bg: 'rgba(139, 92, 246, 0.15)', text: '#8B5CF6', border: '#8B5CF6', label: 'Supreme Friend' },
    'Mitra': { bg: 'rgba(14, 165, 233, 0.15)', text: '#0EA5E9', border: '#0EA5E9', label: 'Good' },
    'Kshema': { bg: 'rgba(20, 184, 166, 0.15)', text: '#14B8A6', border: '#14B8A6', label: 'Favorable' },
    'Janma': { bg: 'rgba(245, 158, 11, 0.15)', text: '#F59E0B', border: '#F59E0B', label: 'Caution' },
    'Pratyak': { bg: 'rgba(239, 68, 68, 0.12)', text: '#EF4444', border: '#EF4444', label: 'Opposition' },
    'Vipat': { bg: 'rgba(239, 68, 68, 0.18)', text: '#DC2626', border: '#DC2626', label: 'Danger' },
    'Naidhana': { bg: 'rgba(153, 27, 27, 0.25)', text: '#991B1B', border: '#991B1B', label: 'Loss' }
};

const CaptainMatchAstro = () => {
    const [currentTab, setCurrentTab] = useState(0); // 0: Calculator, 1: History, 2: Analytics
    
    // Players and Venues from Database
    const [playersList, setPlayersList] = useState([]);
    const [venuesList, setVenuesList] = useState([]);
    const [metaLoading, setMetaLoading] = useState(true);

    // Live Predictor Form State (Starts fresh and empty)
    const [matchDate, setMatchDate] = useState(() => new Date().toISOString().slice(0, 10));
    const [matchTime, setMatchTime] = useState('19:30');
    const [venueInput, setVenueInput] = useState('');
    const [team1Name, setTeam1Name] = useState('');
    const [team1CaptainObj, setTeam1CaptainObj] = useState(null);
    const [team2Name, setTeam2Name] = useState('');
    const [team2CaptainObj, setTeam2CaptainObj] = useState(null);
    
    // Calculation Result
    const [calcLoading, setCalcLoading] = useState(false);
    const [calcResult, setCalcResult] = useState(null);
    const [saveLoading, setSaveLoading] = useState(false);
    const [winnerInput, setWinnerInput] = useState('');
    const [resultNotes, setResultNotes] = useState('');

    // History & Edit Winner Dialog State
    const [history, setHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [selectedNakshatra, setSelectedNakshatra] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTara, setSelectedTara] = useState('');
    const [editWinnerDialogOpen, setEditWinnerDialogOpen] = useState(false);
    const [editingMatch, setEditingMatch] = useState(null);
    const [editWinnerVal, setEditWinnerVal] = useState('');
    const [editNotesVal, setEditNotesVal] = useState('');
    const [editLoading, setEditLoading] = useState(false);

    // Snackbar
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [seedLoading, setSeedLoading] = useState(false);

    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';

    // Load Metadata & All Players
    useEffect(() => {
        const loadInitialData = async () => {
            setMetaLoading(true);
            try {
                // Fetch all players list without pagination limit
                const pRes = await axios.get(`${backendUrl}/api/players`, { params: { all: 'true' } });
                const players = Array.isArray(pRes.data) ? pRes.data : (pRes.data?.players || []);
                setPlayersList(players);

                // Fetch global venues
                const mRes = await axios.get(`${backendUrl}/api/captain-astro/metadata`);
                if (mRes.data?.venues) {
                    setVenuesList(mRes.data.venues.map(v => v.name));
                }
            } catch (err) {
                console.error('Error loading players/venues:', err);
            } finally {
                setMetaLoading(false);
            }
        };

        loadInitialData();
        fetchHistory('all', '', '');
    }, []);

    // Calculate match astrology
    const triggerCalculation = async (d = matchDate, t = matchTime, v = venueInput, t1 = team1Name, c1 = team1CaptainObj, t2 = team2Name, c2 = team2CaptainObj) => {
        if (!c1 || !c2) return;
        setCalcLoading(true);
        try {
            const res = await axios.post(`${backendUrl}/api/captain-astro/calculate`, {
                date: d,
                time: t,
                venue: v,
                team1: t1,
                team1Captain: c1,
                team2: t2,
                team2Captain: c2
            });
            if (res.data.success) {
                setCalcResult(res.data.data);
                if (!winnerInput || winnerInput === 'Pending') {
                    setWinnerInput(res.data.data.favoredTeam || res.data.data.team1.name);
                }
            }
        } catch (err) {
            console.error('Error calculating:', err);
            setSnackbar({ open: true, message: 'Calculation failed: ' + (err.response?.data?.msg || err.message), severity: 'error' });
        } finally {
            setCalcLoading(false);
        }
    };

    const handleCalculate = () => {
        if (!team1CaptainObj || !team2CaptainObj) {
            setSnackbar({ open: true, message: 'Please select both Team 1 Captain and Team 2 Captain before calculating', severity: 'warning' });
            return;
        }
        triggerCalculation(matchDate, matchTime, venueInput, team1Name, team1CaptainObj, team2Name, team2CaptainObj);
    };

    const handleClearForm = () => {
        setTeam1Name('');
        setTeam1CaptainObj(null);
        setTeam2Name('');
        setTeam2CaptainObj(null);
        setVenueInput('');
        setCalcResult(null);
        setWinnerInput('');
        setResultNotes('');
    };

    // Load History
    const fetchHistory = async (nak = selectedNakshatra, q = searchQuery, tara = selectedTara) => {
        setHistoryLoading(true);
        try {
            const params = {};
            if (nak && nak !== 'all') params.nakshatra = nak;
            if (q) params.search = q;
            if (tara) params.tara = tara;

            const res = await axios.get(`${backendUrl}/api/captain-astro/history`, { params });
            if (res.data.success) {
                setHistory(res.data.matches || []);
            }
        } catch (err) {
            console.error('Error fetching history:', err);
        } finally {
            setHistoryLoading(false);
        }
    };

    const handleSaveMatch = async () => {
        if (!calcResult) return;
        setSaveLoading(true);
        try {
            const payload = {
                matchTitle: `${calcResult.team1.name} vs ${calcResult.team2.name}`,
                date: calcResult.date,
                time: calcResult.time,
                venue: calcResult.venue,
                matchMoon: calcResult.matchMoon,
                team1: calcResult.team1,
                team2: calcResult.team2,
                astroAdvantage: calcResult.advantage,
                predictedWinner: calcResult.favoredTeam || '',
                winner: winnerInput || (calcResult.favoredTeam || 'Pending'),
                notes: resultNotes,
                isCompleted: !!winnerInput && winnerInput !== 'Pending'
            };
            const res = await axios.post(`${backendUrl}/api/captain-astro/save`, payload);
            if (res.data.success) {
                setSnackbar({ open: true, message: `Match record saved! Winner: ${payload.winner}`, severity: 'success' });
                fetchHistory();
            }
        } catch (err) {
            setSnackbar({ open: true, message: 'Failed to save: ' + (err.response?.data?.msg || err.message), severity: 'error' });
        } finally {
            setSaveLoading(false);
        }
    };

    const handleOpenEditWinner = (match) => {
        setEditingMatch(match);
        setEditWinnerVal(match.winner || match.predictedWinner || match.team1?.name || '');
        setEditNotesVal(match.notes || '');
        setEditWinnerDialogOpen(true);
    };

    const handleSaveEditedWinner = async () => {
        if (!editingMatch) return;
        setEditLoading(true);
        try {
            const payload = {
                _id: editingMatch._id,
                winner: editWinnerVal,
                notes: editNotesVal,
                isCompleted: !!editWinnerVal && editWinnerVal !== 'Pending'
            };
            const res = await axios.post(`${backendUrl}/api/captain-astro/save`, payload);
            if (res.data.success) {
                setSnackbar({ open: true, message: 'Match winner updated successfully!', severity: 'success' });
                setEditWinnerDialogOpen(false);
                fetchHistory();
            }
        } catch (err) {
            setSnackbar({ open: true, message: 'Failed to update winner: ' + (err.response?.data?.msg || err.message), severity: 'error' });
        } finally {
            setEditLoading(false);
        }
    };

    const handleSeedIPL = async () => {
        setSeedLoading(true);
        try {
            const res = await axios.post(`${backendUrl}/api/captain-astro/seed-ipl`);
            if (res.data.success) {
                setSnackbar({ open: true, message: res.data.msg, severity: 'success' });
                fetchHistory('all', '', '');
            }
        } catch (err) {
            setSnackbar({ open: true, message: 'Seed failed: ' + (err.response?.data?.msg || err.message), severity: 'error' });
        } finally {
            setSeedLoading(false);
        }
    };

    // Calculate Analytics summary
    const analytics = useMemo(() => {
        if (!history.length) return null;
        const taraStats = {};
        const nakStats = {};

        history.forEach(m => {
            const nak = m.matchMoon?.nakshatra || 'Unknown';
            nakStats[nak] = (nakStats[nak] || 0) + 1;

            // Check Captain 1
            if (m.team1?.captain?.taraName) {
                const t1 = m.team1.captain.taraName;
                if (!taraStats[t1]) taraStats[t1] = { total: 0, won: 0 };
                taraStats[t1].total++;
                if (m.winner && m.winner.toLowerCase().includes(m.team1.name.toLowerCase())) {
                    taraStats[t1].won++;
                }
            }

            // Check Captain 2
            if (m.team2?.captain?.taraName) {
                const t2 = m.team2.captain.taraName;
                if (!taraStats[t2]) taraStats[t2] = { total: 0, won: 0 };
                taraStats[t2].total++;
                if (m.winner && m.winner.toLowerCase().includes(m.team2.name.toLowerCase())) {
                    taraStats[t2].won++;
                }
            }
        });

        return { taraStats, nakStats, totalMatches: history.length };
    }, [history]);

    return (
        <Box sx={{ p: { xs: 1.5, md: 3 }, maxWidth: 1400, margin: '0 auto' }}>
            {/* Top Banner */}
            <Paper sx={{
                p: 3,
                mb: 3,
                borderRadius: '20px',
                background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #4338CA 100%)',
                color: 'white',
                boxShadow: '0 10px 30px rgba(49, 46, 129, 0.3)',
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                alignItems: { xs: 'flex-start', md: 'center' },
                justifyContent: 'space-between',
                gap: 2
            }}>
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                        <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 44, height: 44 }}>
                            <AutoAwesomeIcon sx={{ color: '#FCD34D' }} />
                        </Avatar>
                        <Typography variant="h5" fontWeight="900" sx={{ letterSpacing: '-0.5px' }}>
                            👑 Captain Match Astrology (கேப்டன் ஜாதகம்)
                        </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', ml: { md: 7 }, fontWeight: 500 }}>
                        Search All {playersList.length ? `${playersList.length}+` : '1100+'} Players & 70+ Global Stadiums | Head-to-Head Tara Bala & Historical Pattern Database
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                    <Button
                        variant="contained"
                        startIcon={seedLoading ? <CircularProgress size={16} color="inherit" /> : <CloudUploadIcon />}
                        onClick={handleSeedIPL}
                        disabled={seedLoading}
                        sx={{
                            bgcolor: 'rgba(255,255,255,0.15)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255,255,255,0.25)',
                            textTransform: 'none',
                            fontWeight: 'bold',
                            borderRadius: '12px',
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' }
                        }}
                    >
                        Sync 74 IPL Matches
                    </Button>
                </Box>
            </Paper>

            {/* Navigation Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs
                    value={currentTab}
                    onChange={(e, v) => setCurrentTab(v)}
                    sx={{
                        '& .MuiTab-root': {
                            textTransform: 'none',
                            fontWeight: '700',
                            fontSize: '0.95rem',
                            minHeight: 48
                        }
                    }}
                >
                    <Tab icon={<AutoAwesomeIcon />} iconPosition="start" label="Live Match Predictor (மேட்ச் கணிப்பான்)" />
                    <Tab icon={<HistoryEduIcon />} iconPosition="start" label={`History Explorer (${history.length} Matches)`} />
                    <Tab icon={<LeaderboardIcon />} iconPosition="start" label="Pattern Analytics (தாரை புள்ளியியல்)" />
                </Tabs>
            </Box>

            {/* TAB 0: LIVE PREDICTOR */}
            {currentTab === 0 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {/* Top Input Panel - Match & Teams Setup */}
                    <Paper sx={{
                        p: { xs: 2.5, sm: 3.5 },
                        borderRadius: '24px',
                        border: '1px solid rgba(0,0,0,0.08)',
                        bgcolor: 'background.paper',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.04)'
                    }}>
                        <Typography variant="h6" fontWeight="900" sx={{ mb: 2.5, display: 'flex', alignItems: 'center', gap: 1, color: 'text.primary' }}>
                            <SportsCricketIcon sx={{ color: '#FF6F00' }} /> Match & Captain Configuration
                        </Typography>

                        {/* Row 1: Match Schedule (Date & Time) */}
                        <Grid container spacing={2.5} sx={{ mb: 3 }}>
                            <Grid item xs={12} sm={6} md={6}>
                                <Box sx={{ p: 2, bgcolor: 'rgba(0,0,0,0.02)', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.06)' }}>
                                    <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        📅 MATCH DATE (போட்டி தேதி)
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        type="date"
                                        value={matchDate}
                                        onChange={(e) => setMatchDate(e.target.value)}
                                        InputLabelProps={{ shrink: true }}
                                        sx={{ bgcolor: '#FFFFFF', borderRadius: '10px' }}
                                    />
                                </Box>
                            </Grid>
                            <Grid item xs={12} sm={6} md={6}>
                                <Box sx={{ p: 2, bgcolor: 'rgba(0,0,0,0.02)', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.06)' }}>
                                    <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        ⏰ START TIME IST (ஆரம்ப நேரம்)
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        type="time"
                                        value={matchTime}
                                        onChange={(e) => setMatchTime(e.target.value)}
                                        InputLabelProps={{ shrink: true }}
                                        sx={{ bgcolor: '#FFFFFF', borderRadius: '10px' }}
                                    />
                                </Box>
                            </Grid>
                        </Grid>

                        {/* Dedicated Full-Width Global Venue / Stadium Selector */}
                        <Box sx={{
                            mb: 3,
                            p: 2.5,
                            bgcolor: 'rgba(239, 68, 68, 0.03)',
                            borderRadius: '18px',
                            border: '1.5px solid rgba(239, 68, 68, 0.2)'
                        }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#DC2626', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <PlaceIcon sx={{ fontSize: 20 }} /> MATCH PITCH & STADIUM (மேட்ச் நடக்கும் களம் / மைதானம் - 70+ International Venues)
                            </Typography>
                            <Autocomplete
                                freeSolo
                                fullWidth
                                options={venuesList}
                                value={venueInput}
                                onChange={(e, newValue) => setVenueInput(newValue || '')}
                                onInputChange={(e, newInputValue) => setVenueInput(newInputValue)}
                                componentsProps={{
                                    popper: {
                                        sx: {
                                            minWidth: { xs: '300px', sm: '550px', md: '750px' },
                                            '& .MuiAutocomplete-paper': {
                                                borderRadius: '16px',
                                                boxShadow: '0 16px 40px rgba(0,0,0,0.18)',
                                                border: '1px solid rgba(0,0,0,0.1)',
                                                p: 1
                                            }
                                        }
                                    }
                                }}
                                renderOption={(props, option) => (
                                    <Box
                                        component="li"
                                        {...props}
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 1.5,
                                            py: 1.2,
                                            px: 1.5,
                                            borderRadius: '10px',
                                            '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.08)' }
                                        }}
                                    >
                                        <PlaceIcon sx={{ color: '#EF4444', fontSize: 22, flexShrink: 0 }} />
                                        <Typography variant="body1" fontWeight="700" sx={{ color: '#1E293B', whiteSpace: 'normal', wordBreak: 'break-word' }}>
                                            {option}
                                        </Typography>
                                    </Box>
                                )}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        fullWidth
                                        placeholder="Type or select cricket stadium (e.g. M. A. Chidambaram Stadium, Chepauk, Chennai / Wankhede Stadium / Narendra Modi Stadium)..."
                                        InputProps={{
                                            ...params.InputProps,
                                            startAdornment: (
                                                <>
                                                    <PlaceIcon sx={{ color: '#EF4444', mr: 1, fontSize: 26 }} />
                                                    {params.InputProps.startAdornment}
                                                </>
                                            )
                                        }}
                                        sx={{
                                            bgcolor: '#FFFFFF',
                                            borderRadius: '12px',
                                            '& .MuiOutlinedInput-root': {
                                                fontSize: '1.05rem',
                                                fontWeight: 600,
                                                py: 0.5
                                            }
                                        }}
                                    />
                                )}
                            />
                        </Box>

                        {/* Row 2: Team 1 & Team 2 Selection Cards */}
                        <Grid container spacing={3} sx={{ mb: 3 }}>
                            {/* Team 1 Setup Card */}
                            <Grid item xs={12} md={6}>
                                <Paper sx={{
                                    p: 2.5,
                                    borderRadius: '18px',
                                    border: '2px solid rgba(37, 99, 235, 0.2)',
                                    bgcolor: 'rgba(37, 99, 235, 0.02)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 2
                                }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Chip label="TEAM 1" size="small" sx={{ bgcolor: '#2563EB', color: 'white', fontWeight: '900' }} />
                                        <Typography variant="subtitle2" fontWeight="800" color="primary.main">
                                            Team 1 & Captain Selection
                                        </Typography>
                                    </Box>

                                    <TextField
                                        fullWidth
                                        label="Team 1 Name"
                                        value={team1Name}
                                        onChange={(e) => setTeam1Name(e.target.value)}
                                        placeholder="e.g. Royal Challengers Bangalore"
                                    />

                                    <Autocomplete
                                        options={playersList}
                                        getOptionLabel={(option) => {
                                            if (!option) return '';
                                            if (typeof option === 'string') return option;
                                            return `${option.name || ''} (${option.dob || 'DOB N/A'})`;
                                        }}
                                        filterOptions={(options, state) => {
                                            const input = (state.inputValue || '').toLowerCase().trim();
                                            if (!input) return options;
                                            const words = input.split(/\s+/).filter(Boolean);
                                            return options.filter(opt => {
                                                const name = (opt.name || '').toLowerCase();
                                                const dob = (opt.dob || '').toLowerCase();
                                                const place = (opt.birthPlace || '').toLowerCase();
                                                const role = (opt.role || '').toLowerCase();
                                                const target = `${name} ${dob} ${place} ${role}`;
                                                return words.every(w => target.includes(w));
                                            });
                                        }}
                                        value={team1CaptainObj}
                                        onChange={(e, newValue) => setTeam1CaptainObj(newValue)}
                                        isOptionEqualToValue={(option, value) => option._id === value?._id || option.name === value?.name}
                                        componentsProps={{
                                            popper: {
                                                sx: {
                                                    minWidth: { xs: '300px', sm: '480px' },
                                                    '& .MuiAutocomplete-paper': {
                                                        borderRadius: '16px',
                                                        boxShadow: '0 16px 40px rgba(0,0,0,0.18)',
                                                        p: 1
                                                    }
                                                }
                                            }
                                        }}
                                        renderOption={(props, option) => (
                                            <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.2, px: 1.5, borderRadius: '8px' }}>
                                                <Avatar
                                                    src={option.profile ? `${backendUrl}/uploads/${option.profile}` : undefined}
                                                    sx={{ width: 38, height: 38, bgcolor: '#2563EB', fontSize: '0.9rem', fontWeight: 800 }}
                                                >
                                                    {option.name?.charAt(0)}
                                                </Avatar>
                                                <Box sx={{ flexGrow: 1 }}>
                                                    <Typography variant="body2" fontWeight="bold">
                                                        {option.name}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        DOB: {option.dob || 'N/A'} {option.birthPlace ? `| ${option.birthPlace.split(',')[0]}` : ''}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        )}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                label="Team 1 Captain (Search from 1100+ Players)"
                                                placeholder="Type captain name..."
                                            />
                                        )}
                                    />
                                </Paper>
                            </Grid>

                            {/* Team 2 Setup Card */}
                            <Grid item xs={12} md={6}>
                                <Paper sx={{
                                    p: 2.5,
                                    borderRadius: '18px',
                                    border: '2px solid rgba(124, 58, 237, 0.2)',
                                    bgcolor: 'rgba(124, 58, 237, 0.02)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 2
                                }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Chip label="TEAM 2" size="small" sx={{ bgcolor: '#7C3AED', color: 'white', fontWeight: '900' }} />
                                        <Typography variant="subtitle2" fontWeight="800" sx={{ color: '#7C3AED' }}>
                                            Team 2 & Captain Selection
                                        </Typography>
                                    </Box>

                                    <TextField
                                        fullWidth
                                        label="Team 2 Name"
                                        value={team2Name}
                                        onChange={(e) => setTeam2Name(e.target.value)}
                                        placeholder="e.g. Sunrisers Hyderabad"
                                    />

                                    <Autocomplete
                                        options={playersList}
                                        getOptionLabel={(option) => {
                                            if (!option) return '';
                                            if (typeof option === 'string') return option;
                                            return `${option.name || ''} (${option.dob || 'DOB N/A'})`;
                                        }}
                                        filterOptions={(options, state) => {
                                            const input = (state.inputValue || '').toLowerCase().trim();
                                            if (!input) return options;
                                            const words = input.split(/\s+/).filter(Boolean);
                                            return options.filter(opt => {
                                                const name = (opt.name || '').toLowerCase();
                                                const dob = (opt.dob || '').toLowerCase();
                                                const place = (opt.birthPlace || '').toLowerCase();
                                                const role = (opt.role || '').toLowerCase();
                                                const target = `${name} ${dob} ${place} ${role}`;
                                                return words.every(w => target.includes(w));
                                            });
                                        }}
                                        value={team2CaptainObj}
                                        onChange={(e, newValue) => setTeam2CaptainObj(newValue)}
                                        isOptionEqualToValue={(option, value) => option._id === value?._id || option.name === value?.name}
                                        componentsProps={{
                                            popper: {
                                                sx: {
                                                    minWidth: { xs: '300px', sm: '480px' },
                                                    '& .MuiAutocomplete-paper': {
                                                        borderRadius: '16px',
                                                        boxShadow: '0 16px 40px rgba(0,0,0,0.18)',
                                                        p: 1
                                                    }
                                                }
                                            }
                                        }}
                                        renderOption={(props, option) => (
                                            <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.2, px: 1.5, borderRadius: '8px' }}>
                                                <Avatar
                                                    src={option.profile ? `${backendUrl}/uploads/${option.profile}` : undefined}
                                                    sx={{ width: 38, height: 38, bgcolor: '#7C3AED', fontSize: '0.9rem', fontWeight: 800 }}
                                                >
                                                    {option.name?.charAt(0)}
                                                </Avatar>
                                                <Box sx={{ flexGrow: 1 }}>
                                                    <Typography variant="body2" fontWeight="bold">
                                                        {option.name}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        DOB: {option.dob || 'N/A'} {option.birthPlace ? `| ${option.birthPlace.split(',')[0]}` : ''}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        )}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                label="Team 2 Captain (Search from 1100+ Players)"
                                                placeholder="Type captain name..."
                                            />
                                        )}
                                    />
                                </Paper>
                            </Grid>
                        </Grid>

                        {/* Action Buttons: Calculate & Clear */}
                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                            <Button
                                fullWidth
                                variant="contained"
                                onClick={handleCalculate}
                                disabled={calcLoading || !team1CaptainObj || !team2CaptainObj}
                                startIcon={calcLoading ? <CircularProgress size={20} color="inherit" /> : <AutoAwesomeIcon />}
                                sx={{
                                    flex: { sm: 1 },
                                    py: 1.5,
                                    borderRadius: '14px',
                                    fontSize: '1rem',
                                    fontWeight: '800',
                                    background: 'linear-gradient(135deg, #FF6F00 0%, #FF8F00 100%)',
                                    boxShadow: '0 6px 20px rgba(255, 111, 0, 0.35)',
                                    '&:hover': { background: 'linear-gradient(135deg, #E65100 0%, #FF6F00 100%)' }
                                }}
                            >
                                Calculate Captain Tara Balam (கணக்கிடு)
                            </Button>

                            <Button
                                variant="outlined"
                                onClick={handleClearForm}
                                startIcon={<RefreshIcon />}
                                sx={{
                                    py: 1.5,
                                    px: 3,
                                    borderRadius: '14px',
                                    fontWeight: 'bold',
                                    textTransform: 'none',
                                    borderColor: 'rgba(0,0,0,0.2)',
                                    color: 'text.secondary',
                                    '&:hover': { borderColor: 'error.main', color: 'error.main', bgcolor: 'rgba(239,68,68,0.05)' }
                                }}
                            >
                                Clear Form (அழிக்க)
                            </Button>
                        </Box>
                    </Paper>

                    {/* Results Section */}
                    {calcResult && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            {/* Match Cosmic Banner */}
                            <Paper sx={{
                                p: 3,
                                borderRadius: '20px',
                                background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
                                color: 'white',
                                border: '1px solid rgba(255,255,255,0.1)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 2,
                                boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
                            }}>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                                    <Box>
                                        <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 'bold', letterSpacing: '0.5px' }}>
                                            MATCH COSMIC CONFIGURATION (போட்டி நட்சத்திர & ராசி அமைப்பு)
                                        </Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5, mt: 0.5, flexWrap: 'wrap' }}>
                                            <Typography variant="h4" fontWeight="900" sx={{ color: '#38BDF8', letterSpacing: '-0.5px' }}>
                                                {calcResult.matchMoon.nakshatraTamil} ({calcResult.matchMoon.nakshatra})
                                            </Typography>
                                            <Chip
                                                label={`Pada ${calcResult.matchMoon.pada}`}
                                                sx={{ bgcolor: 'rgba(56, 189, 248, 0.2)', color: '#38BDF8', fontWeight: 'bold', fontSize: '0.85rem' }}
                                            />
                                            <Chip
                                                label={`Star #${calcResult.matchMoon.starNo} / 27`}
                                                sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'white', fontWeight: 'bold' }}
                                            />
                                        </Box>
                                    </Box>
                                    <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                                        <Typography variant="subtitle1" sx={{ color: '#FCD34D', fontWeight: 'bold' }}>
                                            📅 {calcResult.date} | ⏰ {calcResult.time} (IST)
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: '#94A3B8', mt: 0.5 }}>
                                            🏟️ Venue: <strong style={{ color: 'white' }}>{calcResult.venue.split(',')[0]}</strong>
                                        </Typography>
                                    </Box>
                                </Box>

                                {/* Planetary Lords and Rasi Strip */}
                                <Box sx={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: 1.5,
                                    pt: 1.5,
                                    borderTop: '1px solid rgba(255,255,255,0.1)'
                                }}>
                                    <Chip
                                        icon={<AutoAwesomeIcon sx={{ color: '#FCD34D !important', fontSize: 18 }} />}
                                        label={`ராசி: ${calcResult.matchMoon.rasiTamil || 'கடகம்'} (${calcResult.matchMoon.rasi || calcResult.matchMoon.sign || 'Cancer'})`}
                                        sx={{ bgcolor: 'rgba(255,255,255,0.12)', color: 'white', fontWeight: 'bold' }}
                                    />
                                    <Chip
                                        label={`ராசி அதிபதி: ${calcResult.matchMoon.rasiLordTamil || 'சந்திரன்'} (${calcResult.matchMoon.rasiLord || 'Moon'})`}
                                        sx={{ bgcolor: 'rgba(59, 130, 246, 0.25)', color: '#93C5FD', fontWeight: 'bold' }}
                                    />
                                    <Chip
                                        label={`நட்சத்திர அதிபதி: ${calcResult.matchMoon.starLordTamil || calcResult.matchMoon.lord} (${calcResult.matchMoon.starLord || calcResult.matchMoon.lord})`}
                                        sx={{ bgcolor: 'rgba(168, 85, 247, 0.25)', color: '#D8B4FE', fontWeight: 'bold' }}
                                    />
                                </Box>
                            </Paper>

                            {/* Head-to-Head Comparison Cards */}
                            <Grid container spacing={3}>
                                {/* Team 1 Captain Card */}
                                <Grid item xs={12} md={6}>
                                    <Paper sx={{
                                        p: 3,
                                        borderRadius: '20px',
                                        border: '2px solid',
                                        borderColor: (TARA_COLORS[calcResult.team1.captain.taraName]?.border || '#E2E8F0'),
                                        bgcolor: 'background.paper',
                                        boxShadow: '0 6px 24px rgba(0,0,0,0.06)',
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'space-between'
                                    }}>
                                        <Box>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                                <Chip
                                                    label={calcResult.team1.name}
                                                    sx={{ bgcolor: '#2563EB', color: 'white', fontWeight: 'bold', fontSize: '0.85rem', px: 1 }}
                                                />
                                                <Typography variant="caption" fontWeight="900" color="text.secondary">
                                                    TEAM 1 CAPTAIN
                                                </Typography>
                                            </Box>

                                            <Typography variant="h5" fontWeight="900" color="primary.main" sx={{ mb: 1.5 }}>
                                                {calcResult.team1.captain.name}
                                            </Typography>

                                            <Box sx={{ my: 2, p: 2, bgcolor: 'rgba(0,0,0,0.03)', borderRadius: '14px', display: 'flex', flexDirection: 'column', gap: 1 }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <Typography variant="body2" color="text.secondary">
                                                        🌟 பிறந்த நட்சத்திரம் (Birth Star):
                                                    </Typography>
                                                    <Typography variant="body2" fontWeight="bold">
                                                        {calcResult.team1.captain.nakshatraTamil} ({calcResult.team1.captain.nakshatra}) #{calcResult.team1.captain.starNo}
                                                    </Typography>
                                                </Box>

                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <Typography variant="body2" color="text.secondary">
                                                        ⭐ நட்சத்திர அதிபதி (Star Lord):
                                                    </Typography>
                                                    <Typography variant="body2" fontWeight="bold" sx={{ color: '#7C3AED' }}>
                                                        {calcResult.team1.captain.starLordTamil || 'புதன்'} ({calcResult.team1.captain.starLord || 'Mercury'})
                                                    </Typography>
                                                </Box>

                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <Typography variant="body2" color="text.secondary">
                                                        🪐 பிறந்த ராசி (Birth Rasi):
                                                    </Typography>
                                                    <Typography variant="body2" fontWeight="bold">
                                                        {calcResult.team1.captain.rasiTamil || 'விருச்சிகம்'} ({calcResult.team1.captain.rasi || 'Scorpio'})
                                                    </Typography>
                                                </Box>

                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <Typography variant="body2" color="text.secondary">
                                                        👑 ராசி அதிபதி (Rasi Lord):
                                                    </Typography>
                                                    <Typography variant="body2" fontWeight="bold" sx={{ color: '#DC2626' }}>
                                                        {calcResult.team1.captain.rasiLordTamil || 'செவ்வாய்'} ({calcResult.team1.captain.rasiLord || 'Mars'})
                                                    </Typography>
                                                </Box>

                                                <Divider sx={{ my: 0.5 }} />

                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <Typography variant="body2" fontWeight="bold" color="text.primary">
                                                        🎯 தாரை இடைவெளி (Distance):
                                                    </Typography>
                                                    <Typography variant="h6" fontWeight="900" sx={{ color: '#2563EB' }}>
                                                        {calcResult.team1.captain.distance} / 27
                                                    </Typography>
                                                </Box>
                                            </Box>

                                            <Box sx={{
                                                p: 2,
                                                borderRadius: '14px',
                                                bgcolor: TARA_COLORS[calcResult.team1.captain.taraName]?.bg || 'rgba(0,0,0,0.05)',
                                                border: '1.5px solid',
                                                borderColor: TARA_COLORS[calcResult.team1.captain.taraName]?.border || 'transparent',
                                                mb: 2
                                            }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <Typography variant="h6" fontWeight="900" sx={{ color: TARA_COLORS[calcResult.team1.captain.taraName]?.text || 'inherit' }}>
                                                        {calcResult.team1.captain.taraTamil} ({calcResult.team1.captain.taraName})
                                                    </Typography>
                                                    <Chip
                                                        label={TARA_COLORS[calcResult.team1.captain.taraName]?.label || 'Score'}
                                                        sx={{
                                                            bgcolor: TARA_COLORS[calcResult.team1.captain.taraName]?.text || '#333',
                                                            color: 'white',
                                                            fontWeight: 'bold',
                                                            fontSize: '0.75rem'
                                                        }}
                                                    />
                                                </Box>
                                                <Typography variant="body2" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                                                    {calcResult.team1.captain.nature}
                                                </Typography>
                                            </Box>
                                        </Box>

                                        <Box sx={{ mt: 1 }}>
                                            <Typography variant="caption" sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5, fontWeight: 'bold' }}>
                                                <span>Tara Strength (தாரை பலம்)</span>
                                                <span>{calcResult.team1.captain.score} / 10</span>
                                            </Typography>
                                            <LinearProgress
                                                variant="determinate"
                                                value={calcResult.team1.captain.score * 10}
                                                sx={{
                                                    height: 10,
                                                    borderRadius: 5,
                                                    bgcolor: 'rgba(0,0,0,0.05)',
                                                    '& .MuiLinearProgress-bar': {
                                                        bgcolor: TARA_COLORS[calcResult.team1.captain.taraName]?.text || '#FF6F00',
                                                        borderRadius: 5
                                                    }
                                                }}
                                            />
                                        </Box>
                                    </Paper>
                                </Grid>

                                {/* Team 2 Captain Card */}
                                <Grid item xs={12} md={6}>
                                    <Paper sx={{
                                        p: 3,
                                        borderRadius: '20px',
                                        border: '2px solid',
                                        borderColor: (TARA_COLORS[calcResult.team2.captain.taraName]?.border || '#E2E8F0'),
                                        bgcolor: 'background.paper',
                                        boxShadow: '0 6px 24px rgba(0,0,0,0.06)',
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'space-between'
                                    }}>
                                        <Box>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                                <Chip
                                                    label={calcResult.team2.name}
                                                    sx={{ bgcolor: '#7C3AED', color: 'white', fontWeight: 'bold', fontSize: '0.85rem', px: 1 }}
                                                />
                                                <Typography variant="caption" fontWeight="900" color="text.secondary">
                                                    TEAM 2 CAPTAIN
                                                </Typography>
                                            </Box>

                                            <Typography variant="h5" fontWeight="900" color="secondary.main" sx={{ mb: 1.5 }}>
                                                {calcResult.team2.captain.name}
                                            </Typography>

                                            <Box sx={{ my: 2, p: 2, bgcolor: 'rgba(0,0,0,0.03)', borderRadius: '14px', display: 'flex', flexDirection: 'column', gap: 1 }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <Typography variant="body2" color="text.secondary">
                                                        🌟 பிறந்த நட்சத்திரம் (Birth Star):
                                                    </Typography>
                                                    <Typography variant="body2" fontWeight="bold">
                                                        {calcResult.team2.captain.nakshatraTamil} ({calcResult.team2.captain.nakshatra}) #{calcResult.team2.captain.starNo}
                                                    </Typography>
                                                </Box>

                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <Typography variant="body2" color="text.secondary">
                                                        ⭐ நட்சத்திர அதிபதி (Star Lord):
                                                    </Typography>
                                                    <Typography variant="body2" fontWeight="bold" sx={{ color: '#7C3AED' }}>
                                                        {calcResult.team2.captain.starLordTamil || 'சனி'} ({calcResult.team2.captain.starLord || 'Saturn'})
                                                    </Typography>
                                                </Box>

                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <Typography variant="body2" color="text.secondary">
                                                        🪐 பிறந்த ராசி (Birth Rasi):
                                                    </Typography>
                                                    <Typography variant="body2" fontWeight="bold">
                                                        {calcResult.team2.captain.rasiTamil || 'விருச்சிகம்'} ({calcResult.team2.captain.rasi || 'Scorpio'})
                                                    </Typography>
                                                </Box>

                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <Typography variant="body2" color="text.secondary">
                                                        👑 ராசி அதிபதி (Rasi Lord):
                                                    </Typography>
                                                    <Typography variant="body2" fontWeight="bold" sx={{ color: '#DC2626' }}>
                                                        {calcResult.team2.captain.rasiLordTamil || 'செவ்வாய்'} ({calcResult.team2.captain.rasiLord || 'Mars'})
                                                    </Typography>
                                                </Box>

                                                <Divider sx={{ my: 0.5 }} />

                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <Typography variant="body2" fontWeight="bold" color="text.primary">
                                                        🎯 தாரை இடைவெளி (Distance):
                                                    </Typography>
                                                    <Typography variant="h6" fontWeight="900" sx={{ color: '#7C3AED' }}>
                                                        {calcResult.team2.captain.distance} / 27
                                                    </Typography>
                                                </Box>
                                            </Box>

                                            <Box sx={{
                                                p: 2,
                                                borderRadius: '14px',
                                                bgcolor: TARA_COLORS[calcResult.team2.captain.taraName]?.bg || 'rgba(0,0,0,0.05)',
                                                border: '1.5px solid',
                                                borderColor: TARA_COLORS[calcResult.team2.captain.taraName]?.border || 'transparent',
                                                mb: 2
                                            }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <Typography variant="h6" fontWeight="900" sx={{ color: TARA_COLORS[calcResult.team2.captain.taraName]?.text || 'inherit' }}>
                                                        {calcResult.team2.captain.taraTamil} ({calcResult.team2.captain.taraName})
                                                    </Typography>
                                                    <Chip
                                                        label={TARA_COLORS[calcResult.team2.captain.taraName]?.label || 'Score'}
                                                        sx={{
                                                            bgcolor: TARA_COLORS[calcResult.team2.captain.taraName]?.text || '#333',
                                                            color: 'white',
                                                            fontWeight: 'bold',
                                                            fontSize: '0.75rem'
                                                        }}
                                                    />
                                                </Box>
                                                <Typography variant="body2" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                                                    {calcResult.team2.captain.nature}
                                                </Typography>
                                            </Box>
                                        </Box>

                                        <Box sx={{ mt: 1 }}>
                                            <Typography variant="caption" sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5, fontWeight: 'bold' }}>
                                                <span>Tara Strength (தாரை பலம்)</span>
                                                <span>{calcResult.team2.captain.score} / 10</span>
                                            </Typography>
                                            <LinearProgress
                                                variant="determinate"
                                                value={calcResult.team2.captain.score * 10}
                                                sx={{
                                                    height: 10,
                                                    borderRadius: 5,
                                                    bgcolor: 'rgba(0,0,0,0.05)',
                                                    '& .MuiLinearProgress-bar': {
                                                        bgcolor: TARA_COLORS[calcResult.team2.captain.taraName]?.text || '#7C3AED',
                                                        borderRadius: 5
                                                    }
                                                }}
                                            />
                                        </Box>
                                    </Paper>
                                </Grid>
                            </Grid>

                            {/* Astro Advantage, Winner Selection & Save Strip */}
                            <Paper sx={{
                                p: { xs: 2.5, sm: 3.5 },
                                borderRadius: '22px',
                                bgcolor: 'background.paper',
                                border: '1.5px solid rgba(5, 150, 105, 0.25)',
                                boxShadow: '0 8px 30px rgba(5, 150, 105, 0.08)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 2.5
                            }}>
                                {/* Verdict Header */}
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1.5 }}>
                                    <Box>
                                        <Typography variant="caption" fontWeight="800" sx={{ color: '#059669', letterSpacing: '0.5px' }}>
                                            ASTROLOGICAL VERDICT & ADVANTAGE (ஜோதிட கணிப்பு முடிவு)
                                        </Typography>
                                        <Typography variant="h6" fontWeight="900" sx={{ color: '#065F46', mt: 0.5 }}>
                                            ✨ {calcResult.advantage}
                                        </Typography>
                                    </Box>
                                    <Chip
                                        icon={<AutoAwesomeIcon sx={{ fontSize: 16 }} />}
                                        label={`கணிப்பு: ${calcResult.favoredTeam || 'சமபலம் / Balanced'}`}
                                        sx={{ bgcolor: 'rgba(5, 150, 105, 0.12)', color: '#059669', fontWeight: 'bold' }}
                                    />
                                </Box>

                                <Divider />

                                {/* Interactive Winner Selection Section */}
                                <Box sx={{ bgcolor: 'rgba(0,0,0,0.02)', p: 2.5, borderRadius: '16px', border: '1px solid rgba(0,0,0,0.06)' }}>
                                    <Typography variant="subtitle2" fontWeight="900" sx={{ color: '#1E293B', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <EmojiEventsIcon sx={{ color: '#F59E0B' }} /> ACTUAL MATCH WINNER (போட்டியில் வெற்றி பெற்ற அணி யார்?):
                                    </Typography>

                                    <Grid container spacing={2} alignItems="center">
                                        <Grid item xs={12} md={7}>
                                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                                <Button
                                                    variant={winnerInput === calcResult.team1.name ? 'contained' : 'outlined'}
                                                    onClick={() => setWinnerInput(calcResult.team1.name)}
                                                    sx={{
                                                        borderRadius: '12px',
                                                        fontWeight: 'bold',
                                                        textTransform: 'none',
                                                        bgcolor: winnerInput === calcResult.team1.name ? '#2563EB' : 'transparent',
                                                        borderColor: '#2563EB',
                                                        color: winnerInput === calcResult.team1.name ? 'white' : '#2563EB',
                                                        '&:hover': { bgcolor: winnerInput === calcResult.team1.name ? '#1D4ED8' : 'rgba(37,99,235,0.08)' }
                                                    }}
                                                >
                                                    🏆 {calcResult.team1.name} (வெற்றி)
                                                </Button>

                                                <Button
                                                    variant={winnerInput === calcResult.team2.name ? 'contained' : 'outlined'}
                                                    onClick={() => setWinnerInput(calcResult.team2.name)}
                                                    sx={{
                                                        borderRadius: '12px',
                                                        fontWeight: 'bold',
                                                        textTransform: 'none',
                                                        bgcolor: winnerInput === calcResult.team2.name ? '#7C3AED' : 'transparent',
                                                        borderColor: '#7C3AED',
                                                        color: winnerInput === calcResult.team2.name ? 'white' : '#7C3AED',
                                                        '&:hover': { bgcolor: winnerInput === calcResult.team2.name ? '#6D28D9' : 'rgba(124,58,237,0.08)' }
                                                    }}
                                                >
                                                    🏆 {calcResult.team2.name} (வெற்றி)
                                                </Button>

                                                <Button
                                                    variant={winnerInput === 'Pending' ? 'contained' : 'outlined'}
                                                    onClick={() => setWinnerInput('Pending')}
                                                    sx={{
                                                        borderRadius: '12px',
                                                        fontWeight: 'bold',
                                                        textTransform: 'none',
                                                        bgcolor: winnerInput === 'Pending' ? '#64748B' : 'transparent',
                                                        borderColor: '#94A3B8',
                                                        color: winnerInput === 'Pending' ? 'white' : '#64748B'
                                                    }}
                                                >
                                                    ⏳ இன்னும் முடியவில்லை
                                                </Button>

                                                <Button
                                                    variant={winnerInput === 'Tie / No Result' ? 'contained' : 'outlined'}
                                                    onClick={() => setWinnerInput('Tie / No Result')}
                                                    sx={{
                                                        borderRadius: '12px',
                                                        fontWeight: 'bold',
                                                        textTransform: 'none',
                                                        bgcolor: winnerInput === 'Tie / No Result' ? '#D97706' : 'transparent',
                                                        borderColor: '#D97706',
                                                        color: winnerInput === 'Tie / No Result' ? 'white' : '#D97706'
                                                    }}
                                                >
                                                    🤝 சமன் / No Result
                                                </Button>
                                            </Box>
                                        </Grid>

                                        <Grid item xs={12} md={5}>
                                            <TextField
                                                fullWidth
                                                size="small"
                                                placeholder="Result Notes (e.g. Won by 24 runs / 6 wkts)..."
                                                value={resultNotes}
                                                onChange={(e) => setResultNotes(e.target.value)}
                                                sx={{ bgcolor: 'white', borderRadius: '10px' }}
                                            />
                                        </Grid>
                                    </Grid>
                                </Box>

                                {/* Action Buttons */}
                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, flexWrap: 'wrap' }}>
                                    <Button
                                        variant="outlined"
                                        onClick={() => {
                                            setSelectedNakshatra(calcResult.matchMoon.nakshatra);
                                            setCurrentTab(1);
                                            fetchHistory(calcResult.matchMoon.nakshatra, '', '');
                                        }}
                                        sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 'bold', px: 2.5 }}
                                    >
                                        View Historical Matches under {calcResult.matchMoon.nakshatra}
                                    </Button>
                                    <Button
                                        variant="contained"
                                        startIcon={saveLoading ? <CircularProgress size={16} color="inherit" /> : <CheckCircleIcon />}
                                        onClick={handleSaveMatch}
                                        disabled={saveLoading}
                                        sx={{
                                            borderRadius: '12px',
                                            textTransform: 'none',
                                            fontWeight: '900',
                                            fontSize: '0.95rem',
                                            bgcolor: '#059669',
                                            px: 3,
                                            py: 1,
                                            boxShadow: '0 4px 14px rgba(5, 150, 105, 0.3)',
                                            '&:hover': { bgcolor: '#047857' }
                                        }}
                                    >
                                        Save to Match History (வரலாற்றில் சேமி)
                                    </Button>
                                </Box>
                            </Paper>
                        </Box>
                    )}
                </Box>
            )}

            {/* TAB 1: HISTORY EXPLORER */}
            {currentTab === 1 && (
                <Box>
                    {/* Nakshatra Filter Pills (27 Stars) */}
                    <Paper sx={{ p: 2, mb: 3, borderRadius: '18px', bgcolor: 'background.paper', border: '1px solid rgba(0,0,0,0.08)' }}>
                        <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                            FILTER MATCHES BY NAKSHATRA (27 நட்சத்திரங்கள்):
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 1, '&::-webkit-scrollbar': { height: 6 } }}>
                            <Chip
                                label={`All Stars (${history.length})`}
                                clickable
                                color={selectedNakshatra === 'all' ? 'primary' : 'default'}
                                variant={selectedNakshatra === 'all' ? 'filled' : 'outlined'}
                                onClick={() => {
                                    setSelectedNakshatra('all');
                                    fetchHistory('all', searchQuery, selectedTara);
                                }}
                                sx={{ fontWeight: 'bold' }}
                            />
                            {NAKSHATRAS_27.map(n => (
                                <Chip
                                    key={n.name}
                                    label={`${n.name} (${n.tamil})`}
                                    clickable
                                    color={selectedNakshatra === n.name ? 'primary' : 'default'}
                                    variant={selectedNakshatra === n.name ? 'filled' : 'outlined'}
                                    onClick={() => {
                                        setSelectedNakshatra(n.name);
                                        fetchHistory(n.name, searchQuery, selectedTara);
                                    }}
                                    sx={{ fontWeight: 'bold' }}
                                />
                            ))}
                        </Box>
                    </Paper>

                    {/* Search & Filters */}
                    <Box sx={{ display: 'flex', gap: 2, mb: 2.5, flexWrap: 'wrap' }}>
                        <TextField
                            size="small"
                            placeholder="Search captain, team, venue, or winner..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && fetchHistory(selectedNakshatra, searchQuery, selectedTara)}
                            InputProps={{
                                startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
                            }}
                            sx={{ flexGrow: 1, minWidth: 250 }}
                        />
                        <FormControl size="small" sx={{ minWidth: 160 }}>
                            <InputLabel>Tara Filter</InputLabel>
                            <Select
                                value={selectedTara}
                                label="Tara Filter"
                                onChange={(e) => {
                                    setSelectedTara(e.target.value);
                                    fetchHistory(selectedNakshatra, searchQuery, e.target.value);
                                }}
                            >
                                <MenuItem value="">All Taras</MenuItem>
                                {Object.keys(TARA_COLORS).map(t => (
                                    <MenuItem key={t} value={t}>{t}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <Button
                            variant="outlined"
                            startIcon={<RefreshIcon />}
                            onClick={() => fetchHistory(selectedNakshatra, searchQuery, selectedTara)}
                            sx={{ borderRadius: '10px' }}
                        >
                            Refresh
                        </Button>
                    </Box>

                    {/* Matches Table */}
                    <TableContainer component={Paper} sx={{ borderRadius: '18px', border: '1px solid rgba(0,0,0,0.08)', overflow: 'hidden' }}>
                        <Table size="small">
                            <TableHead sx={{ bgcolor: 'rgba(0,0,0,0.04)' }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 'bold' }}>#</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Match & Date</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Venue</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Match Moon Star</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Team 1 Captain & Tara</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Team 2 Captain & Tara</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Actual Winner (வெற்றியாளர்)</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Action</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {historyLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                                            <CircularProgress size={32} />
                                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Loading match history...</Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : history.length > 0 ? (
                                    history.map((m, idx) => {
                                        const isWinnerKnown = m.winner && !m.winner.includes('TBD') && m.winner !== 'Pending';
                                        const isPredictedCorrect = isWinnerKnown && (m.winner === m.predictedWinner || (m.astroAdvantage && m.astroAdvantage.includes(m.winner)));

                                        return (
                                            <TableRow key={m._id || idx} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                                <TableCell sx={{ fontWeight: 'bold' }}>{m.matchNo || idx + 1}</TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight="bold">
                                                        {m.team1?.name} vs {m.team2?.name}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        📅 {m.date} | ⏰ {m.time}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {m.venue?.split(',')[0]}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={`${m.matchMoon?.nakshatra} (${m.matchMoon?.nakshatraTamil || ''})`}
                                                        size="small"
                                                        sx={{ fontWeight: 'bold', bgcolor: 'rgba(56, 189, 248, 0.15)', color: '#0284C7' }}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight="bold">
                                                        {m.team1?.captain?.name}
                                                    </Typography>
                                                    <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', mt: 0.3 }}>
                                                        <Typography variant="caption" color="text.secondary">
                                                            #{m.team1?.captain?.starNo} (Dist: {m.team1?.captain?.distance})
                                                        </Typography>
                                                        <Chip
                                                            label={m.team1?.captain?.taraName}
                                                            size="small"
                                                            sx={{
                                                                fontSize: '0.65rem',
                                                                height: 20,
                                                                bgcolor: TARA_COLORS[m.team1?.captain?.taraName]?.bg || '#f1f5f9',
                                                                color: TARA_COLORS[m.team1?.captain?.taraName]?.text || '#334155',
                                                                fontWeight: 'bold'
                                                            }}
                                                        />
                                                    </Box>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight="bold">
                                                        {m.team2?.captain?.name}
                                                    </Typography>
                                                    <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', mt: 0.3 }}>
                                                        <Typography variant="caption" color="text.secondary">
                                                            #{m.team2?.captain?.starNo} (Dist: {m.team2?.captain?.distance})
                                                        </Typography>
                                                        <Chip
                                                            label={m.team2?.captain?.taraName}
                                                            size="small"
                                                            sx={{
                                                                fontSize: '0.65rem',
                                                                height: 20,
                                                                bgcolor: TARA_COLORS[m.team2?.captain?.taraName]?.bg || '#f1f5f9',
                                                                color: TARA_COLORS[m.team2?.captain?.taraName]?.text || '#334155',
                                                                fontWeight: 'bold'
                                                            }}
                                                        />
                                                    </Box>
                                                </TableCell>
                                                <TableCell>
                                                    {isWinnerKnown ? (
                                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                                            <Chip
                                                                icon={<EmojiEventsIcon sx={{ fontSize: '1rem !important' }} />}
                                                                label={m.winner}
                                                                size="small"
                                                                color="success"
                                                                sx={{ fontWeight: 'bold' }}
                                                            />
                                                            {m.notes && (
                                                                <Typography variant="caption" color="text.secondary">
                                                                    {m.notes}
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                    ) : (
                                                        <Chip
                                                            label={m.winner || '⏳ Pending'}
                                                            size="small"
                                                            variant="outlined"
                                                            sx={{ color: '#64748B', borderColor: '#CBD5E1', fontWeight: 600 }}
                                                        />
                                                    )}
                                                </TableCell>
                                                <TableCell align="center">
                                                    <Tooltip title="Edit / Set Winner (வெற்றியாளரை மாற்று)">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleOpenEditWinner(m)}
                                                            sx={{ color: '#2563EB', bgcolor: 'rgba(37,99,235,0.06)', '&:hover': { bgcolor: 'rgba(37,99,235,0.15)' } }}
                                                        >
                                                            <EditIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                                            <Typography color="text.secondary">No historical matches found for this filter.</Typography>
                                            <Button variant="outlined" size="small" onClick={handleSeedIPL} sx={{ mt: 1 }}>
                                                Sync 74 IPL Matches
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            )}

            {/* TAB 2: PATTERN ANALYTICS */}
            {currentTab === 2 && analytics && (
                <Grid container spacing={3}>
                    <Grid item xs={12} md={7}>
                        <Paper sx={{ p: 3, borderRadius: '20px', border: '1px solid rgba(0,0,0,0.08)' }}>
                            <Typography variant="subtitle1" fontWeight="800" sx={{ mb: 2 }}>
                                📊 Tara Bala Win Rates Across Historical Matches
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                Percentage of wins when a captain enters the match under each specific Tara configuration:
                            </Typography>

                            <Grid container spacing={2}>
                                {Object.entries(analytics.taraStats).map(([taraName, stats]) => {
                                    const winRate = stats.total > 0 ? Math.round((stats.won / stats.total) * 100) : 0;
                                    const taraColor = TARA_COLORS[taraName] || { text: '#4B5563', bg: '#F3F4F6' };
                                    return (
                                        <Grid item xs={12} sm={6} key={taraName}>
                                            <Box sx={{ p: 2, borderRadius: '14px', bgcolor: taraColor.bg, border: '1px solid', borderColor: taraColor.text + '33' }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                                    <Typography variant="subtitle2" fontWeight="900" sx={{ color: taraColor.text }}>
                                                        {taraName}
                                                    </Typography>
                                                    <Chip
                                                        label={`${winRate}% Win`}
                                                        size="small"
                                                        sx={{ bgcolor: taraColor.text, color: 'white', fontWeight: 'bold', fontSize: '0.75rem' }}
                                                    />
                                                </Box>
                                                <Typography variant="caption" color="text.secondary">
                                                    Matches Played: <strong>{stats.total}</strong> | Won: <strong>{stats.won}</strong>
                                                </Typography>
                                                <LinearProgress
                                                    variant="determinate"
                                                    value={winRate}
                                                    sx={{
                                                        height: 6,
                                                        borderRadius: 3,
                                                        mt: 1,
                                                        bgcolor: 'rgba(0,0,0,0.05)',
                                                        '& .MuiLinearProgress-bar': { bgcolor: taraColor.text, borderRadius: 3 }
                                                    }}
                                                />
                                            </Box>
                                        </Grid>
                                    );
                                })}
                            </Grid>
                        </Paper>
                    </Grid>

                    <Grid item xs={12} md={5}>
                        <Paper sx={{ p: 3, borderRadius: '20px', border: '1px solid rgba(0,0,0,0.08)', height: '100%' }}>
                            <Typography variant="subtitle1" fontWeight="800" sx={{ mb: 2 }}>
                                🌟 Most Frequent Match Nakshatras
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                {Object.entries(analytics.nakStats)
                                    .sort((a, b) => b[1] - a[1])
                                    .slice(0, 8)
                                    .map(([nak, count]) => (
                                        <Box key={nak} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.5, bgcolor: 'rgba(0,0,0,0.02)', borderRadius: '10px' }}>
                                            <Typography variant="body2" fontWeight="bold">
                                                {nak}
                                            </Typography>
                                            <Chip label={`${count} Matches`} size="small" sx={{ fontWeight: 'bold' }} />
                                        </Box>
                                    ))}
                            </Box>
                        </Paper>
                    </Grid>
                </Grid>
            )}

            {/* Edit Match Winner Dialog Modal */}
            <Dialog
                open={editWinnerDialogOpen}
                onClose={() => setEditWinnerDialogOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: '20px',
                        p: 1
                    }
                }}
            >
                <DialogTitle sx={{ fontWeight: 900, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EmojiEventsIcon sx={{ color: '#F59E0B' }} />
                    Update Match Winner & Result (வெற்றியாளர் பதிவு)
                </DialogTitle>
                <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, py: 2.5 }}>
                    {editingMatch && (
                        <Box sx={{ p: 2, bgcolor: 'rgba(0,0,0,0.03)', borderRadius: '14px' }}>
                            <Typography variant="subtitle1" fontWeight="bold">
                                {editingMatch.team1?.name} vs {editingMatch.team2?.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                📅 {editingMatch.date} | 🏟️ {editingMatch.venue?.split(',')[0]}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#059669', fontWeight: 'bold', display: 'block', mt: 0.5 }}>
                                ⭐ Astro Advantage: {editingMatch.astroAdvantage}
                            </Typography>
                        </Box>
                    )}

                    <Box>
                        <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1.5 }}>
                            Select Winner Team (வெற்றி பெற்ற அணி):
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {editingMatch && (
                                <>
                                    <Button
                                        variant={editWinnerVal === editingMatch.team1?.name ? 'contained' : 'outlined'}
                                        onClick={() => setEditWinnerVal(editingMatch.team1?.name)}
                                        sx={{
                                            borderRadius: '12px',
                                            fontWeight: 'bold',
                                            textTransform: 'none',
                                            bgcolor: editWinnerVal === editingMatch.team1?.name ? '#2563EB' : 'transparent',
                                            borderColor: '#2563EB',
                                            color: editWinnerVal === editingMatch.team1?.name ? 'white' : '#2563EB'
                                        }}
                                    >
                                        🏆 {editingMatch.team1?.name}
                                    </Button>

                                    <Button
                                        variant={editWinnerVal === editingMatch.team2?.name ? 'contained' : 'outlined'}
                                        onClick={() => setEditWinnerVal(editingMatch.team2?.name)}
                                        sx={{
                                            borderRadius: '12px',
                                            fontWeight: 'bold',
                                            textTransform: 'none',
                                            bgcolor: editWinnerVal === editingMatch.team2?.name ? '#7C3AED' : 'transparent',
                                            borderColor: '#7C3AED',
                                            color: editWinnerVal === editingMatch.team2?.name ? 'white' : '#7C3AED'
                                        }}
                                    >
                                        🏆 {editingMatch.team2?.name}
                                    </Button>

                                    <Button
                                        variant={editWinnerVal === 'Pending' ? 'contained' : 'outlined'}
                                        onClick={() => setEditWinnerVal('Pending')}
                                        sx={{
                                            borderRadius: '12px',
                                            fontWeight: 'bold',
                                            textTransform: 'none',
                                            bgcolor: editWinnerVal === 'Pending' ? '#64748B' : 'transparent',
                                            borderColor: '#94A3B8',
                                            color: editWinnerVal === 'Pending' ? 'white' : '#64748B'
                                        }}
                                    >
                                        ⏳ Pending / TBD
                                    </Button>

                                    <Button
                                        variant={editWinnerVal === 'Tie / No Result' ? 'contained' : 'outlined'}
                                        onClick={() => setEditWinnerVal('Tie / No Result')}
                                        sx={{
                                            borderRadius: '12px',
                                            fontWeight: 'bold',
                                            textTransform: 'none',
                                            bgcolor: editWinnerVal === 'Tie / No Result' ? '#D97706' : 'transparent',
                                            borderColor: '#D97706',
                                            color: editWinnerVal === 'Tie / No Result' ? 'white' : '#D97706'
                                        }}
                                    >
                                        🤝 Tie / No Result
                                    </Button>
                                </>
                            )}
                        </Box>
                    </Box>

                    <TextField
                        fullWidth
                        label="Result Margin / Match Notes (முடிவு விவரம்)"
                        placeholder="e.g. Won by 5 wickets / 18 runs / DLS method..."
                        value={editNotesVal}
                        onChange={(e) => setEditNotesVal(e.target.value)}
                        variant="outlined"
                    />
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setEditWinnerDialogOpen(false)} sx={{ borderRadius: '10px' }}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleSaveEditedWinner}
                        disabled={editLoading}
                        startIcon={editLoading ? <CircularProgress size={16} color="inherit" /> : <CheckCircleIcon />}
                        sx={{
                            borderRadius: '12px',
                            fontWeight: 'bold',
                            bgcolor: '#059669',
                            px: 3,
                            '&:hover': { bgcolor: '#047857' }
                        }}
                    >
                        Save Winner (சேமி)
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} variant="filled">
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default CaptainMatchAstro;
