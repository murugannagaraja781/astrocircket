import React, { useState, useEffect, useContext, useMemo } from 'react';
import axios from 'axios';
import {
    Box, Typography, TextField, Button, Paper, CircularProgress,
    Dialog, DialogTitle, DialogContent, DialogActions, Grid, Chip, Divider,
    FormControl, InputLabel, Select, MenuItem, FormControlLabel, Checkbox,
    IconButton, Tooltip, Alert, Tabs, Tab, Stack, InputAdornment
} from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import SendIcon from '@mui/icons-material/Send';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import SportsCricketIcon from '@mui/icons-material/SportsCricket';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AuthContext from '../context/AuthContext';

// Isolated Dark Theme to guarantee 100% text contrast and override parent theme styles
const darkPredictionTheme = createTheme({
    palette: {
        mode: 'dark',
        background: {
            default: '#0B1120',
            paper: '#1E293B',
        },
        primary: {
            main: '#38BDF8',
            contrastText: '#0F172A',
        },
        secondary: {
            main: '#FB923C',
            contrastText: '#0F172A',
        },
        text: {
            primary: '#FFFFFF',
            secondary: '#94A3B8',
        },
    },
    components: {
        MuiDialog: {
            styleOverrides: {
                paper: {
                    backgroundColor: '#1E293B !important',
                    color: '#FFFFFF !important',
                    backgroundImage: 'none !important',
                    borderRadius: '20px !important',
                    border: '1px solid rgba(255, 255, 255, 0.12) !important',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7) !important'
                }
            }
        },
        MuiDialogTitle: {
            styleOverrides: {
                root: {
                    color: '#FFFFFF !important',
                }
            }
        },
        MuiTypography: {
            styleOverrides: {
                root: {
                    color: '#FFFFFF',
                }
            }
        },
        MuiFormLabel: {
            styleOverrides: {
                root: {
                    color: '#94A3B8 !important',
                    fontWeight: '600 !important',
                    '&.Mui-focused': {
                        color: '#38BDF8 !important'
                    }
                }
            }
        },
        MuiInputLabel: {
            styleOverrides: {
                root: {
                    color: '#94A3B8 !important',
                    fontWeight: '600 !important',
                    '&.Mui-focused': {
                        color: '#38BDF8 !important'
                    }
                }
            }
        },
        MuiOutlinedInput: {
            styleOverrides: {
                root: {
                    backgroundColor: '#0F172A !important',
                    color: '#FFFFFF !important',
                    borderRadius: '12px !important',
                    '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#334155 !important',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#64748B !important',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#38BDF8 !important',
                        borderWidth: '2px !important',
                    },
                    '& input': {
                        color: '#FFFFFF !important',
                        WebkitTextFillColor: '#FFFFFF !important',
                        fontWeight: 500,
                    },
                    '& textarea': {
                        color: '#FFFFFF !important',
                        WebkitTextFillColor: '#FFFFFF !important',
                        fontWeight: 500,
                    }
                }
            }
        },
        MuiSelect: {
            styleOverrides: {
                select: {
                    color: '#FFFFFF !important',
                    WebkitTextFillColor: '#FFFFFF !important',
                },
                icon: {
                    color: '#94A3B8 !important',
                }
            }
        },
        MuiChip: {
            styleOverrides: {
                root: {
                    color: '#FFFFFF',
                },
                label: {
                    color: 'inherit',
                }
            }
        }
    }
});

const AdminPredictionManager = () => {
    const { token, user } = useContext(AuthContext);
    const [matches, setMatches] = useState([]);
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [fetchingSquad, setFetchingSquad] = useState(false);

    // Active Tab & Filters
    const [activeTab, setActiveTab] = useState(0); // 0: Live, 1: Upcoming, 2: Finished
    const [selectedGender, setSelectedGender] = useState('all'); // 'all', 'men', 'women'
    const [selectedFormat, setSelectedFormat] = useState('all'); // 'all', 't20', 'odi', 'test'
    const [searchQuery, setSearchQuery] = useState('');

    // Dialog States
    const [openMatchDialog, setOpenMatchDialog] = useState(false);
    const [openInsightDialog, setOpenInsightDialog] = useState(false);
    const [selectedMatch, setSelectedMatch] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });

    // Form states for New Match
    const [matchForm, setMatchForm] = useState({
        teamA: '',
        teamB: '',
        matchDate: '',
        matchTime: '',
        venue: '',
        status: 'upcoming',
        gender: 'men',
        format: 'T20',
        location: { name: '', lat: 0, lng: 0 }
    });

    // Form states for Match Insights Publishing
    const [insightForm, setInsightForm] = useState({
        astrologicalAdvantage: '',
        keyBatsmen: '',
        keyBowlers: '',
        insightsSummary: '',
        price: 49,
        notifyUsers: true
    });

    const baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';

    const fetchMatches = async (silent = false) => {
        if (!silent) setLoading(true);
        else setRefreshing(true);

        try {
            const authToken = token || localStorage.getItem('token');
            const [matchesRes, groupsRes] = await Promise.allSettled([
                axios.get(`${baseUrl}/api/insights/matches?source=admin`, { headers: { 'x-auth-token': authToken } }),
                axios.get(`${baseUrl}/api/groups`, { headers: { 'x-auth-token': authToken } })
            ]);

            if (matchesRes.status === 'fulfilled') {
                const data = matchesRes.value.data;
                if (data?.success && Array.isArray(data.matches)) {
                    setMatches(data.matches);
                } else if (Array.isArray(data)) {
                    setMatches(data);
                }
            }

            if (groupsRes.status === 'fulfilled' && Array.isArray(groupsRes.value.data)) {
                setGroups(groupsRes.value.data);
            }
        } catch (err) {
            console.error("Error fetching insights matches & groups:", err);
            setStatusMsg({ type: 'error', text: 'Failed to fetch match insights feed' });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchMatches();
    }, []);

    // Helper to find players for a team name from groups
    const getTeamSquadPlayers = (teamName) => {
        if (!teamName || !groups.length) return [];
        const cleanName = teamName.toLowerCase().trim();
        const words = cleanName.split(/\s+/).filter(w => w.length > 2);

        const matchedGroup = groups.find(g => {
            const gName = (g.name || '').toLowerCase().trim();
            if (gName === cleanName || gName.includes(cleanName) || cleanName.includes(gName)) return true;
            return words.some(w => gName.includes(w));
        });

        return matchedGroup?.players || [];
    };

    // Partition Matches into Live, Upcoming, Finished
    const partitionedMatches = useMemo(() => {
        const live = [];
        const upcoming = [];
        const finished = [];

        matches.forEach(m => {
            const st = (m.status || '').toLowerCase();
            if (st === 'live') {
                live.push(m);
            } else if (st === 'completed' || st === 'finished') {
                finished.push(m);
            } else {
                upcoming.push(m);
            }
        });

        return { live, upcoming, finished };
    }, [matches]);

    const currentTabList = useMemo(() => {
        let list = [];
        if (activeTab === 0) list = partitionedMatches.live;
        else if (activeTab === 1) list = partitionedMatches.upcoming;
        else list = partitionedMatches.finished;

        return list.filter(m => {
            if (selectedGender !== 'all') {
                const g = (m.gender || 'men').toLowerCase();
                if (g !== selectedGender.toLowerCase()) return false;
            }
            if (selectedFormat !== 'all') {
                const f = (m.format || 't20').toLowerCase();
                if (!f.includes(selectedFormat.toLowerCase())) return false;
            }
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const title = `${m.teamA} ${m.teamB} ${m.venue || ''}`.toLowerCase();
                if (!title.includes(q)) return false;
            }
            return true;
        });
    }, [partitionedMatches, activeTab, selectedGender, selectedFormat, searchQuery]);

    const handleCreateMatch = async () => {
        setSubmitting(true);
        try {
            const authToken = token || localStorage.getItem('token');
            await axios.post(`${baseUrl}/api/matches`, matchForm, {
                headers: { 'x-auth-token': authToken }
            });
            await fetchMatches(true);
            setOpenMatchDialog(false);
            setMatchForm({ teamA: '', teamB: '', matchDate: '', matchTime: '', venue: '', status: 'upcoming', gender: 'men', format: 'T20', location: { name: '', lat: 0, lng: 0 } });
            setStatusMsg({ type: 'success', text: 'New Match added successfully!' });
        } catch (err) {
            console.error("Error creating match:", err);
            setStatusMsg({ type: 'error', text: 'Failed to create match' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleOpenInsightDialog = (match) => {
        setSelectedMatch(match);
        const existingInsights = match.insight || match.insightData || {};
        const legacyPrediction = match.expertPrediction || {};

        const keyBatsmenNames = Array.isArray(existingInsights.keyBatsmen)
            ? existingInsights.keyBatsmen.map(p => p.name || p).join(', ')
            : '';
        const keyBowlersNames = Array.isArray(existingInsights.keyBowlers)
            ? existingInsights.keyBowlers.map(p => p.name || p).join(', ')
            : '';
        const legacyPlayers = Array.isArray(legacyPrediction.keyPlayers)
            ? legacyPrediction.keyPlayers.join(', ')
            : '';

        const existingPrice = (existingInsights.price !== undefined && existingInsights.price !== null)
            ? existingInsights.price
            : 49;

        setInsightForm({
            astrologicalAdvantage: existingInsights.astrologicalAdvantage || legacyPrediction.predictedWinner || match.teamA || '',
            keyBatsmen: keyBatsmenNames || legacyPlayers,
            keyBowlers: keyBowlersNames,
            insightsSummary: existingInsights.insightsSummary || legacyPrediction.reasoning || '',
            price: existingPrice,
            notifyUsers: true
        });
        setOpenInsightDialog(true);
    };

    // Toggle player in comma-separated list
    const togglePlayerInField = (fieldName, playerName) => {
        if (!playerName) return;
        const currentList = (insightForm[fieldName] || '')
            .split(',')
            .map(p => p.trim())
            .filter(Boolean);

        let updatedList;
        if (currentList.includes(playerName)) {
            updatedList = currentList.filter(p => p !== playerName);
        } else {
            updatedList = [...currentList, playerName];
        }

        setInsightForm(prev => ({
            ...prev,
            [fieldName]: updatedList.join(', ')
        }));
    };

    // 1-Click Fetch Squad from Cricbuzz
    const handleFetchSquad = async () => {
        if (!selectedMatch) return;
        setFetchingSquad(true);
        try {
            const authToken = token || localStorage.getItem('token');
            const matchId = selectedMatch.id || selectedMatch._id;

            await axios.post(`${baseUrl}/api/players/sync-live-squad`, {
                matchId: matchId,
                title: `${selectedMatch.teamA} vs ${selectedMatch.teamB}`
            }, {
                headers: { 'x-auth-token': authToken }
            });

            // Re-fetch groups to update player lists
            const groupsRes = await axios.get(`${baseUrl}/api/groups`, {
                headers: { 'x-auth-token': authToken }
            });
            if (Array.isArray(groupsRes.data)) {
                setGroups(groupsRes.data);
            }

            setStatusMsg({ type: 'success', text: `Squad synchronized successfully from Cricbuzz!` });
        } catch (err) {
            console.error("Error fetching squad:", err);
            setStatusMsg({ type: 'warning', text: 'Could not automatically fetch squad from Cricbuzz. You can still type names manually.' });
        } finally {
            setFetchingSquad(false);
        }
    };

    const handlePublishInsights = async () => {
        if (!selectedMatch) return;
        setSubmitting(true);
        try {
            const authToken = token || localStorage.getItem('token');

            const parsePlayers = (str, role) => {
                return str.split(',')
                    .map(item => item.trim())
                    .filter(Boolean)
                    .map(name => ({
                        name,
                        role,
                        rating: 9.0,
                        astroScore: 85
                    }));
            };

            const payload = {
                teamA: selectedMatch.teamA,
                teamB: selectedMatch.teamB,
                matchDate: selectedMatch.matchDate,
                matchTime: selectedMatch.matchTime,
                venue: selectedMatch.venue,
                status: selectedMatch.status,
                gender: selectedMatch.gender,
                format: selectedMatch.format,
                astrologicalAdvantage: insightForm.astrologicalAdvantage,
                keyBatsmen: parsePlayers(insightForm.keyBatsmen, 'Batsman'),
                keyBowlers: parsePlayers(insightForm.keyBowlers, 'Bowler'),
                insightsSummary: insightForm.insightsSummary,
                price: (insightForm.price !== '' && insightForm.price !== null && insightForm.price !== undefined)
                    ? Math.max(0, Number(insightForm.price))
                    : 0,
                notifyUsers: insightForm.notifyUsers
            };

            const matchId = selectedMatch._id || selectedMatch.id;
            const res = await axios.post(`${baseUrl}/api/insights/publish/${matchId}`, payload, {
                headers: { 'x-auth-token': authToken }
            });

            if (res.data?.success) {
                await fetchMatches(true);
                setOpenInsightDialog(false);
                setStatusMsg({
                    type: 'success',
                    text: `Insights posted to Mobile App! ${insightForm.notifyUsers ? 'Push notifications sent to Flutter users.' : ''}`
                });
            }
        } catch (err) {
            console.error("Error publishing insights:", err);
            setStatusMsg({ type: 'error', text: 'Failed to post insights to mobile app' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteMatch = async (id) => {
        if (!window.confirm("Are you sure you want to delete this match?")) return;
        try {
            const authToken = token || localStorage.getItem('token');
            await axios.delete(`${baseUrl}/api/matches/${id}`, {
                headers: { 'x-auth-token': authToken }
            });
            setMatches(matches.filter(m => (m._id !== id && m.id !== id)));
            setStatusMsg({ type: 'info', text: 'Match removed' });
        } catch (err) {
            console.error("Error deleting match:", err);
            setStatusMsg({ type: 'error', text: 'Failed to delete match' });
        }
    };

    // Extract players for selected match dialog
    const teamAPlayers = useMemo(() => getTeamSquadPlayers(selectedMatch?.teamA), [selectedMatch, groups]);
    const teamBPlayers = useMemo(() => getTeamSquadPlayers(selectedMatch?.teamB), [selectedMatch, groups]);
    const hasSquadData = (teamAPlayers.length > 0 || teamBPlayers.length > 0);

    const selectedBatsmenList = useMemo(() => {
        return (insightForm.keyBatsmen || '').split(',').map(s => s.trim()).filter(Boolean);
    }, [insightForm.keyBatsmen]);

    const selectedBowlersList = useMemo(() => {
        return (insightForm.keyBowlers || '').split(',').map(s => s.trim()).filter(Boolean);
    }, [insightForm.keyBowlers]);

    if (user?.role !== 'superadmin') return null;

    return (
        <ThemeProvider theme={darkPredictionTheme}>
            <Box sx={{ p: { xs: 1.5, md: 3 }, maxWidth: '1400px', margin: '0 auto', bgcolor: '#0F172A', minHeight: '100vh', borderRadius: '16px' }}>
                {/* Header Area */}
                <Paper
                    elevation={0}
                    sx={{
                        p: 2.5,
                        mb: 3,
                        borderRadius: '20px',
                        background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
                        color: '#FFFFFF',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
                    }}
                >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box
                                sx={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: '14px',
                                    background: 'rgba(56, 189, 248, 0.15)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#38BDF8'
                                }}
                            >
                                <AutoAwesomeIcon fontSize="medium" />
                            </Box>
                            <Box>
                                <Typography variant="h6" fontWeight="bold" sx={{ color: '#FFFFFF !important', letterSpacing: '0.5px' }}>
                                    AstroCricket Insights & Match Manager
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#94A3B8 !important' }}>
                                    Real-time KP Match Analysis, Player Insights & Instant Sync to Flutter App
                                </Typography>
                            </Box>
                        </Box>

                        <Stack direction="row" spacing={1.5} alignItems="center">
                            <Button
                                variant="outlined"
                                startIcon={<RefreshIcon />}
                                onClick={() => fetchMatches(true)}
                                disabled={refreshing}
                                sx={{
                                    color: '#38BDF8',
                                    borderColor: 'rgba(56, 189, 248, 0.4)',
                                    borderRadius: '12px',
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    '&:hover': { borderColor: '#38BDF8', background: 'rgba(56, 189, 248, 0.1)' }
                                }}
                            >
                                {refreshing ? 'Syncing...' : 'Sync Live Matches'}
                            </Button>
                            <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={() => setOpenMatchDialog(true)}
                                sx={{
                                    background: 'linear-gradient(135deg, #0284C7 0%, #2563EB 100%)',
                                    borderRadius: '12px',
                                    textTransform: 'none',
                                    fontWeight: 'bold',
                                    px: 2.5,
                                    boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)'
                                }}
                            >
                                + Add Custom Match
                            </Button>
                        </Stack>
                    </Box>
                </Paper>

                {statusMsg.text && (
                    <Alert
                        severity={statusMsg.type}
                        sx={{ mb: 2.5, borderRadius: '12px' }}
                        onClose={() => setStatusMsg({ type: '', text: '' })}
                    >
                        {statusMsg.text}
                    </Alert>
                )}

                {/* Segmented Tabs (Live, Upcoming, Finished) */}
                <Paper
                    elevation={0}
                    sx={{
                        p: 0.8,
                        mb: 2.5,
                        borderRadius: '16px',
                        backgroundColor: '#1E293B',
                        border: '1px solid rgba(255, 255, 255, 0.08)'
                    }}
                >
                    <Tabs
                        value={activeTab}
                        onChange={(e, val) => setActiveTab(val)}
                        variant="fullWidth"
                        TabIndicatorProps={{ style: { display: 'none' } }}
                        sx={{
                            minHeight: 48,
                            '& .MuiTab-root': {
                                borderRadius: '12px',
                                minHeight: 44,
                                fontWeight: 700,
                                fontSize: '0.95rem',
                                textTransform: 'none',
                                color: '#94A3B8 !important',
                                transition: 'all 0.2s ease',
                                '&.Mui-selected': {
                                    backgroundColor: '#38BDF8 !important',
                                    color: '#0F172A !important',
                                    boxShadow: '0 4px 12px rgba(56, 189, 248, 0.3)'
                                }
                            }
                        }}
                    >
                        <Tab
                            label={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Box
                                        sx={{
                                            width: 8,
                                            height: 8,
                                            borderRadius: '50%',
                                            backgroundColor: '#EF4444',
                                            animation: 'pulse 1.5s infinite'
                                        }}
                                    />
                                    Live ({partitionedMatches.live.length})
                                </Box>
                            }
                        />
                        <Tab label={`Upcoming (${partitionedMatches.upcoming.length})`} />
                        <Tab label={`Finished (${partitionedMatches.finished.length})`} />
                    </Tabs>
                </Paper>

                {/* Filter Section (Category & Format) */}
                <Paper
                    elevation={0}
                    sx={{
                        p: 2,
                        mb: 3,
                        borderRadius: '16px',
                        backgroundColor: '#1E293B',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        color: '#FFFFFF'
                    }}
                >
                    <Grid container spacing={2} alignItems="center">
                        {/* Category Filter */}
                        <Grid item xs={12} sm={6} md={3.5}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body2" sx={{ color: '#94A3B8 !important', fontWeight: 600, minWidth: 65 }}>
                                    Category:
                                </Typography>
                                <Stack direction="row" spacing={1}>
                                    {['all', 'men', 'women'].map(cat => (
                                        <Chip
                                            key={cat}
                                            label={cat.charAt(0).toUpperCase() + cat.slice(1)}
                                            clickable
                                            onClick={() => setSelectedGender(cat)}
                                            sx={{
                                                fontWeight: 600,
                                                borderRadius: '20px',
                                                backgroundColor: selectedGender === cat ? '#38BDF8 !important' : 'rgba(255, 255, 255, 0.08) !important',
                                                color: selectedGender === cat ? '#0F172A !important' : '#CBD5E1 !important',
                                                border: '1px solid',
                                                borderColor: selectedGender === cat ? '#38BDF8' : 'rgba(255, 255, 255, 0.15)',
                                                '& .MuiChip-label': {
                                                    color: selectedGender === cat ? '#0F172A !important' : '#CBD5E1 !important',
                                                },
                                                '&:hover': {
                                                    backgroundColor: selectedGender === cat ? '#38BDF8 !important' : 'rgba(255, 255, 255, 0.16) !important'
                                                }
                                            }}
                                        />
                                    ))}
                                </Stack>
                            </Box>
                        </Grid>

                        {/* Format Filter */}
                        <Grid item xs={12} sm={6} md={4.5}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body2" sx={{ color: '#94A3B8 !important', fontWeight: 600, minWidth: 55 }}>
                                    Format:
                                </Typography>
                                <Stack direction="row" spacing={1}>
                                    {['all', 't20', 'odi', 'test'].map(fmt => (
                                        <Chip
                                            key={fmt}
                                            label={fmt.toUpperCase()}
                                            clickable
                                            onClick={() => setSelectedFormat(fmt)}
                                            sx={{
                                                fontWeight: 600,
                                                borderRadius: '20px',
                                                backgroundColor: selectedFormat === fmt ? '#38BDF8 !important' : 'rgba(255, 255, 255, 0.08) !important',
                                                color: selectedFormat === fmt ? '#0F172A !important' : '#CBD5E1 !important',
                                                border: '1px solid',
                                                borderColor: selectedFormat === fmt ? '#38BDF8' : 'rgba(255, 255, 255, 0.15)',
                                                '& .MuiChip-label': {
                                                    color: selectedFormat === fmt ? '#0F172A !important' : '#CBD5E1 !important',
                                                },
                                                '&:hover': {
                                                    backgroundColor: selectedFormat === fmt ? '#38BDF8 !important' : 'rgba(255, 255, 255, 0.16) !important'
                                                }
                                            }}
                                        />
                                    ))}
                                </Stack>
                            </Box>
                        </Grid>

                        {/* Search Field */}
                        <Grid item xs={12} md={4}>
                            <TextField
                                size="small"
                                placeholder="Search matches or teams..."
                                fullWidth
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon sx={{ color: '#94A3B8', fontSize: 20 }} />
                                        </InputAdornment>
                                    )
                                }}
                            />
                        </Grid>
                    </Grid>
                </Paper>

                {/* Match Cards List */}
                {loading ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8 }}>
                        <CircularProgress sx={{ color: '#38BDF8', mb: 2 }} />
                        <Typography sx={{ color: '#94A3B8 !important' }}>Loading matches from live feed...</Typography>
                    </Box>
                ) : currentTabList.length === 0 ? (
                    <Paper
                        sx={{
                            p: 6,
                            textAlign: 'center',
                            borderRadius: '20px',
                            backgroundColor: '#1E293B',
                            color: '#94A3B8',
                            border: '1px solid rgba(255, 255, 255, 0.06)'
                        }}
                    >
                        <SportsCricketIcon sx={{ fontSize: 48, color: '#475569', mb: 1.5 }} />
                        <Typography variant="h6" fontWeight="bold" sx={{ color: '#F1F5F9 !important' }}>
                            No Matches Found
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 0.5, color: '#64748B !important' }}>
                            No {activeTab === 0 ? 'Live' : activeTab === 1 ? 'Upcoming' : 'Finished'} matches available matching current filters.
                        </Typography>
                    </Paper>
                ) : (
                    <Grid container spacing={2.5}>
                        {currentTabList.map(match => {
                            const hasInsight = !!(match.insight?.isPublished || match.insightData?.isPublished || match.expertPrediction?.isPublished);
                            const advantage = match.insight?.astrologicalAdvantage || match.insightData?.astrologicalAdvantage || match.expertPrediction?.predictedWinner;
                            const price = (match.insight?.price !== undefined && match.insight?.price !== null)
                                ? Number(match.insight.price)
                                : ((match.insightData?.price !== undefined && match.insightData?.price !== null)
                                    ? Number(match.insightData.price)
                                    : 49);
                            const isLive = (match.status || '').toLowerCase() === 'live';
                            const isCompleted = (match.status || '').toLowerCase() === 'completed' || (match.status || '').toLowerCase() === 'finished';

                            return (
                                <Grid item xs={12} md={6} key={match._id || match.id}>
                                    <Paper
                                        elevation={0}
                                        sx={{
                                            p: 2.5,
                                            borderRadius: '20px',
                                            backgroundColor: '#1E293B',
                                            border: '1.5px solid',
                                            borderColor: isLive ? '#EF4444' : hasInsight ? 'rgba(56, 189, 248, 0.4)' : 'rgba(255, 255, 255, 0.08)',
                                            color: '#FFFFFF',
                                            boxShadow: isLive
                                                ? '0 4px 20px rgba(239, 68, 68, 0.15)'
                                                : '0 4px 20px rgba(0, 0, 0, 0.2)',
                                            transition: 'transform 0.2s, box-shadow 0.2s',
                                            '&:hover': {
                                                transform: 'translateY(-3px)',
                                                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.35)'
                                            }
                                        }}
                                    >
                                        {/* Top Status & Date Row */}
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Chip
                                                    size="small"
                                                    label={
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, fontWeight: 800 }}>
                                                            {isLive && (
                                                                <Box
                                                                    sx={{
                                                                        width: 6,
                                                                        height: 6,
                                                                        borderRadius: '50%',
                                                                        backgroundColor: '#EF4444',
                                                                        animation: 'pulse 1.5s infinite'
                                                                    }}
                                                                />
                                                            )}
                                                            {isLive ? 'LIVE' : isCompleted ? 'FINISHED' : 'UPCOMING'}
                                                        </Box>
                                                    }
                                                    sx={{
                                                        borderRadius: '20px',
                                                        fontSize: '0.75rem',
                                                        fontWeight: 800,
                                                        backgroundColor: isLive
                                                            ? 'rgba(239, 68, 68, 0.2) !important'
                                                            : isCompleted
                                                                ? 'rgba(255, 255, 255, 0.08) !important'
                                                                : 'rgba(56, 189, 248, 0.15) !important',
                                                        color: isLive ? '#EF4444 !important' : isCompleted ? '#94A3B8 !important' : '#38BDF8 !important',
                                                        border: '1px solid',
                                                        borderColor: isLive ? '#EF4444' : isCompleted ? 'rgba(255, 255, 255, 0.15)' : '#38BDF8',
                                                        '& .MuiChip-label': {
                                                            color: isLive ? '#EF4444 !important' : isCompleted ? '#94A3B8 !important' : '#38BDF8 !important',
                                                        }
                                                    }}
                                                />
                                                {match.format && (
                                                    <Chip
                                                        size="small"
                                                        label={match.format.toUpperCase()}
                                                        sx={{
                                                            backgroundColor: 'rgba(255, 255, 255, 0.05) !important',
                                                            color: '#CBD5E1 !important',
                                                            fontSize: '0.7rem',
                                                            fontWeight: 700,
                                                            '& .MuiChip-label': { color: '#CBD5E1 !important' }
                                                        }}
                                                    />
                                                )}
                                            </Box>

                                            <Typography variant="caption" sx={{ color: '#94A3B8 !important', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <AccessTimeIcon sx={{ fontSize: 13, color: '#38BDF8' }} />
                                                {match.matchDate} {match.matchTime ? `• ${match.matchTime}` : ''}
                                            </Typography>
                                        </Box>

                                        {/* Teams Row */}
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', my: 2 }}>
                                            {/* Team A */}
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1 }}>
                                                <Box
                                                    sx={{
                                                        width: 40,
                                                        height: 40,
                                                        borderRadius: '50%',
                                                        background: 'rgba(56, 189, 248, 0.2)',
                                                        color: '#38BDF8',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontWeight: 'bold',
                                                        fontSize: '1.1rem',
                                                        border: '1.5px solid rgba(56, 189, 248, 0.5)'
                                                    }}
                                                >
                                                    {match.teamA ? match.teamA[0] : 'A'}
                                                </Box>
                                                <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#F8FAFC !important', lineHeight: 1.2 }}>
                                                    {match.teamA}
                                                </Typography>
                                            </Box>

                                            {/* VS Badge */}
                                            <Box
                                                sx={{
                                                    px: 1.2,
                                                    py: 0.4,
                                                    borderRadius: '10px',
                                                    backgroundColor: 'rgba(255, 255, 255, 0.06)',
                                                    color: '#94A3B8',
                                                    fontWeight: 800,
                                                    fontSize: '0.75rem',
                                                    mx: 1
                                                }}
                                            >
                                                VS
                                            </Box>

                                            {/* Team B */}
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1.5, flex: 1, textAlign: 'right' }}>
                                                <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#F8FAFC !important', lineHeight: 1.2 }}>
                                                    {match.teamB}
                                                </Typography>
                                                <Box
                                                    sx={{
                                                        width: 40,
                                                        height: 40,
                                                        borderRadius: '50%',
                                                        background: 'rgba(251, 146, 60, 0.2)',
                                                        color: '#FB923C',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontWeight: 'bold',
                                                        fontSize: '1.1rem',
                                                        border: '1.5px solid rgba(251, 146, 60, 0.5)'
                                                    }}
                                                >
                                                    {match.teamB ? match.teamB[0] : 'B'}
                                                </Box>
                                            </Box>
                                        </Box>

                                        {/* Venue text */}
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 2 }}>
                                            <LocationOnIcon sx={{ fontSize: 14, color: '#64748B' }} />
                                            <Typography variant="caption" sx={{ color: '#94A3B8 !important' }} noWrap>
                                                {match.venue || 'International Cricket Stadium'}
                                            </Typography>
                                        </Box>

                                        <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.08)', my: 1.5 }} />

                                        {/* Astrological Insight Status Banner */}
                                        {hasInsight ? (
                                            <Box
                                                sx={{
                                                    p: 1.5,
                                                    borderRadius: '12px',
                                                    backgroundColor: 'rgba(56, 189, 248, 0.08)',
                                                    border: '1px solid rgba(56, 189, 248, 0.2)',
                                                    mb: 2
                                                }}
                                            >
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <Typography variant="body2" fontWeight="bold" sx={{ color: '#38BDF8 !important', display: 'flex', alignItems: 'center', gap: 0.6 }}>
                                                        <AutoAwesomeIcon sx={{ fontSize: 16 }} />
                                                        Advantage: {advantage || 'Calculated in App'}
                                                    </Typography>
                                                    <Chip
                                                        label={price === 0 ? '🎁 FREE Report' : `₹${price} / Report`}
                                                        size="small"
                                                        sx={{
                                                            height: 22,
                                                            fontSize: '0.7rem',
                                                            fontWeight: 700,
                                                            backgroundColor: price === 0 ? 'rgba(56, 189, 248, 0.2) !important' : 'rgba(34, 197, 94, 0.15) !important',
                                                            color: price === 0 ? '#38BDF8 !important' : '#4ADE80 !important',
                                                            border: '1px solid',
                                                            borderColor: price === 0 ? '#38BDF8' : 'rgba(34, 197, 94, 0.3)',
                                                            '& .MuiChip-label': { color: price === 0 ? '#38BDF8 !important' : '#4ADE80 !important' }
                                                        }}
                                                    />
                                                </Box>
                                                {(match.insight?.keyBatsmen?.length > 0 || match.insightData?.keyBatsmen?.length > 0) && (
                                                    <Typography variant="caption" sx={{ display: 'block', mt: 0.8, color: '#CBD5E1 !important' }} noWrap>
                                                        <strong>🏏 Key Batsmen:</strong> {(match.insight?.keyBatsmen || match.insightData?.keyBatsmen || []).map(p => p.name || p).join(', ')}
                                                    </Typography>
                                                )}
                                            </Box>
                                        ) : (
                                            <Box
                                                sx={{
                                                    p: 1.2,
                                                    borderRadius: '12px',
                                                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                                                    border: '1px dashed rgba(255, 255, 255, 0.15)',
                                                    mb: 2,
                                                    textAlign: 'center'
                                                }}
                                            >
                                                <Typography variant="caption" sx={{ color: '#94A3B8 !important' }}>
                                                    ⏳ Awaiting Astrological Prediction & Analysis Posting
                                                </Typography>
                                            </Box>
                                        )}

                                        {/* Action Buttons */}
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Button
                                                variant="contained"
                                                size="small"
                                                startIcon={hasInsight ? <EditIcon /> : <SendIcon />}
                                                onClick={() => handleOpenInsightDialog(match)}
                                                sx={{
                                                    flex: 1,
                                                    py: 1,
                                                    borderRadius: '12px',
                                                    textTransform: 'none',
                                                    fontWeight: 'bold',
                                                    background: hasInsight
                                                        ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                                                        : 'linear-gradient(135deg, #0284C7 0%, #2563EB 100%)',
                                                    boxShadow: hasInsight
                                                        ? '0 4px 14px rgba(16, 185, 129, 0.3)'
                                                        : '0 4px 14px rgba(37, 99, 235, 0.3)',
                                                    '&:hover': {
                                                        background: hasInsight
                                                            ? 'linear-gradient(135deg, #059669 0%, #047857 100%)'
                                                            : 'linear-gradient(135deg, #0369A1 0%, #1D4ED8 100%)'
                                                    }
                                                }}
                                            >
                                                {hasInsight ? 'Edit / Update Prediction' : 'Give Prediction & Post to App'}
                                            </Button>

                                            {match._id && (
                                                <Tooltip title="Delete Match">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleDeleteMatch(match._id)}
                                                        sx={{ ml: 1, color: '#EF4444', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '10px' }}
                                                    >
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                        </Box>
                                    </Paper>
                                </Grid>
                            );
                        })}
                    </Grid>
                )}

                {/* Match Creation Dialog */}
                <Dialog
                    open={openMatchDialog}
                    onClose={() => setOpenMatchDialog(false)}
                    fullWidth
                    maxWidth="sm"
                >
                    <DialogTitle sx={{ fontWeight: 'bold', color: '#FFFFFF !important' }}>Schedule New Custom Match</DialogTitle>
                    <DialogContent>
                        <Grid container spacing={2} sx={{ mt: 0.5 }}>
                            <Grid item xs={6}>
                                <TextField
                                    label="Team A"
                                    fullWidth
                                    value={matchForm.teamA}
                                    onChange={e => setMatchForm({ ...matchForm, teamA: e.target.value })}
                                    required
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField
                                    label="Team B"
                                    fullWidth
                                    value={matchForm.teamB}
                                    onChange={e => setMatchForm({ ...matchForm, teamB: e.target.value })}
                                    required
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField
                                    label="Date"
                                    type="date"
                                    fullWidth
                                    InputLabelProps={{ shrink: true }}
                                    value={matchForm.matchDate}
                                    onChange={e => setMatchForm({ ...matchForm, matchDate: e.target.value })}
                                    required
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField
                                    label="Time"
                                    type="time"
                                    fullWidth
                                    InputLabelProps={{ shrink: true }}
                                    value={matchForm.matchTime}
                                    onChange={e => setMatchForm({ ...matchForm, matchTime: e.target.value })}
                                    required
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <FormControl fullWidth>
                                    <InputLabel>Category</InputLabel>
                                    <Select
                                        value={matchForm.gender}
                                        label="Category"
                                        onChange={e => setMatchForm({ ...matchForm, gender: e.target.value })}
                                        MenuProps={{ PaperProps: { sx: { bgcolor: '#1E293B !important', color: '#FFF !important' } } }}
                                    >
                                        <MenuItem value="men">Men</MenuItem>
                                        <MenuItem value="women">Women</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={6}>
                                <FormControl fullWidth>
                                    <InputLabel>Format</InputLabel>
                                    <Select
                                        value={matchForm.format}
                                        label="Format"
                                        onChange={e => setMatchForm({ ...matchForm, format: e.target.value })}
                                        MenuProps={{ PaperProps: { sx: { bgcolor: '#1E293B !important', color: '#FFF !important' } } }}
                                    >
                                        <MenuItem value="T20">T20</MenuItem>
                                        <MenuItem value="ODI">ODI</MenuItem>
                                        <MenuItem value="Test">Test</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    label="Venue / Stadium"
                                    fullWidth
                                    value={matchForm.venue}
                                    onChange={e => setMatchForm({ ...matchForm, venue: e.target.value })}
                                />
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions sx={{ p: 2.5, backgroundColor: '#0F172A', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                        <Button onClick={() => setOpenMatchDialog(false)} sx={{ color: '#94A3B8' }}>Cancel</Button>
                        <Button
                            variant="contained"
                            onClick={handleCreateMatch}
                            disabled={submitting}
                            sx={{ background: '#2563EB', borderRadius: '10px', px: 3 }}
                        >
                            {submitting ? 'Adding...' : 'Add Match'}
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Post Insights & Prediction Dialog with Live Squad Player Picker */}
                <Dialog
                    open={openInsightDialog}
                    onClose={() => setOpenInsightDialog(false)}
                    fullWidth
                    maxWidth="md"
                >
                    <DialogTitle sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#FFFFFF !important', pb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <AutoAwesomeIcon sx={{ color: '#38BDF8' }} />
                            <Typography variant="h6" fontWeight="bold" sx={{ color: '#FFFFFF !important' }}>
                                Prediction: {selectedMatch?.teamA} vs {selectedMatch?.teamB}
                            </Typography>
                        </Box>

                        {/* Quick 1-Click Fetch Squad Button */}
                        <Button
                            size="small"
                            variant="outlined"
                            startIcon={<FlashOnIcon />}
                            onClick={handleFetchSquad}
                            disabled={fetchingSquad}
                            sx={{
                                color: '#F59E0B !important',
                                borderColor: 'rgba(245, 158, 11, 0.5) !important',
                                borderRadius: '10px',
                                textTransform: 'none',
                                fontWeight: 700,
                                fontSize: '0.8rem',
                                '&:hover': { borderColor: '#F59E0B !important', background: 'rgba(245, 158, 11, 0.15) !important' }
                            }}
                        >
                            {fetchingSquad ? 'Fetching Squad...' : '⚡ Fetch Squad from Cricbuzz'}
                        </Button>
                    </DialogTitle>

                    <DialogContent sx={{ pt: 2 }}>
                        <Box sx={{ mt: 1 }}>
                            <Alert
                                severity="info"
                                sx={{
                                    mb: 2.5,
                                    borderRadius: '12px',
                                    backgroundColor: 'rgba(56, 189, 248, 0.12)',
                                    color: '#38BDF8 !important',
                                    border: '1px solid rgba(56, 189, 248, 0.25)',
                                    '& .MuiAlert-message': { color: '#38BDF8 !important' }
                                }}
                            >
                                Publishing prediction updates this match instantly on the Flutter Mobile App. Flutter users will receive instant notifications and can unlock full details via PhonePe.
                            </Alert>

                            <Grid container spacing={2.5}>
                                {/* Astrological Advantage */}
                                <Grid item xs={12} sm={6}>
                                    <FormControl fullWidth>
                                        <InputLabel>Astrological Advantage (Winning Edge)</InputLabel>
                                        <Select
                                            value={insightForm.astrologicalAdvantage}
                                            label="Astrological Advantage (Winning Edge)"
                                            onChange={e => setInsightForm({ ...insightForm, astrologicalAdvantage: e.target.value })}
                                            MenuProps={{ PaperProps: { sx: { bgcolor: '#0F172A !important', color: '#FFF !important', border: '1px solid #334155' } } }}
                                        >
                                            <MenuItem value={selectedMatch?.teamA} sx={{ color: '#FFF !important' }}>{selectedMatch?.teamA} (Advantage)</MenuItem>
                                            <MenuItem value={selectedMatch?.teamB} sx={{ color: '#FFF !important' }}>{selectedMatch?.teamB} (Advantage)</MenuItem>
                                            <MenuItem value="Even / Neutral" sx={{ color: '#FFF !important' }}>Even / Highly Balanced Match</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>

                                {/* Unlock Price */}
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        label="Unlock Price (INR)"
                                        type="number"
                                        fullWidth
                                        value={insightForm.price}
                                        onChange={e => {
                                            const val = e.target.value;
                                            setInsightForm({ ...insightForm, price: val === '' ? '' : Number(val) });
                                        }}
                                        helperText={Number(insightForm.price) === 0 ? "🎁 ₹0 = FREE Report (Unlocked for all users)" : `Price charged on PhonePe: ₹${insightForm.price}`}
                                    />
                                </Grid>

                                {/* Top Key Batsmen Input & Quick Chips */}
                                <Grid item xs={12}>
                                    <TextField
                                        label="Top Key Batsmen (comma separated or click chips below)"
                                        placeholder="e.g. Virat Kohli, Rohit Sharma, Heinrich Klaasen"
                                        fullWidth
                                        value={insightForm.keyBatsmen}
                                        onChange={e => setInsightForm({ ...insightForm, keyBatsmen: e.target.value })}
                                        helperText="KP Astrology high-impact run scoring batsmen"
                                    />

                                    {/* Squad Player Chips for Batsmen */}
                                    <Box sx={{ mt: 1.5, p: 2, borderRadius: '14px', backgroundColor: '#0B1120', border: '1px solid #1E293B' }}>
                                        <Typography variant="body2" sx={{ color: '#38BDF8 !important', fontWeight: 700, display: 'block', mb: 1.2 }}>
                                            🏏 Select Batsmen from Squad:
                                        </Typography>
                                        {hasSquadData ? (
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                                {[...teamAPlayers, ...teamBPlayers]
                                                    .filter(p => !p.role || p.role.includes('BAT') || p.role.includes('WK') || p.role.includes('ALL') || p.role.includes('Bat'))
                                                    .map((p, idx) => {
                                                        const isSelected = selectedBatsmenList.includes(p.name);
                                                        return (
                                                            <Chip
                                                                key={`${p.name}-${p.id || idx}`}
                                                                label={`${p.name} (${p.role || 'BAT'})`}
                                                                size="small"
                                                                clickable
                                                                onClick={() => togglePlayerInField('keyBatsmen', p.name)}
                                                                icon={isSelected ? <CheckCircleIcon sx={{ fontSize: '15px !important', color: '#0F172A !important' }} /> : undefined}
                                                                sx={{
                                                                    fontWeight: 600,
                                                                    borderRadius: '8px',
                                                                    backgroundColor: isSelected ? '#38BDF8 !important' : '#1E293B !important',
                                                                    color: isSelected ? '#0F172A !important' : '#F8FAFC !important',
                                                                    border: '1px solid',
                                                                    borderColor: isSelected ? '#38BDF8 !important' : '#334155 !important',
                                                                    boxShadow: isSelected ? '0 2px 8px rgba(56, 189, 248, 0.4)' : 'none',
                                                                    '& .MuiChip-label': {
                                                                        color: isSelected ? '#0F172A !important' : '#F8FAFC !important',
                                                                        fontWeight: isSelected ? 700 : 500
                                                                    },
                                                                    '&:hover': {
                                                                        backgroundColor: isSelected ? '#0284C7 !important' : '#334155 !important'
                                                                    }
                                                                }}
                                                            />
                                                        );
                                                    })}
                                            </Box>
                                        ) : (
                                            <Typography variant="body2" sx={{ color: '#94A3B8 !important', fontStyle: 'italic' }}>
                                                ⚠️ Squad players not loaded yet. Click <strong>"⚡ Fetch Squad from Cricbuzz"</strong> button above to load playing squads or type names directly.
                                            </Typography>
                                        )}
                                    </Box>
                                </Grid>

                                {/* Top Key Bowlers Input & Quick Chips */}
                                <Grid item xs={12}>
                                    <TextField
                                        label="Top Key Bowlers (comma separated or click chips below)"
                                        placeholder="e.g. Jasprit Bumrah, Kuldeep Yadav, Mitchell Starc"
                                        fullWidth
                                        value={insightForm.keyBowlers}
                                        onChange={e => setInsightForm({ ...insightForm, keyBowlers: e.target.value })}
                                        helperText="KP Astrology high-impact wicket taking bowlers"
                                    />

                                    {/* Squad Player Chips for Bowlers */}
                                    <Box sx={{ mt: 1.5, p: 2, borderRadius: '14px', backgroundColor: '#0B1120', border: '1px solid #1E293B' }}>
                                        <Typography variant="body2" sx={{ color: '#FB923C !important', fontWeight: 700, display: 'block', mb: 1.2 }}>
                                            🎯 Select Bowlers from Squad:
                                        </Typography>
                                        {hasSquadData ? (
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                                {[...teamAPlayers, ...teamBPlayers]
                                                    .filter(p => !p.role || p.role.includes('BOWL') || p.role.includes('ALL') || p.role.includes('Bowl') || p.role.includes('Pace') || p.role.includes('Spin'))
                                                    .map((p, idx) => {
                                                        const isSelected = selectedBowlersList.includes(p.name);
                                                        return (
                                                            <Chip
                                                                key={`${p.name}-${p.id || idx}`}
                                                                label={`${p.name} (${p.role || 'BOWL'})`}
                                                                size="small"
                                                                clickable
                                                                onClick={() => togglePlayerInField('keyBowlers', p.name)}
                                                                icon={isSelected ? <CheckCircleIcon sx={{ fontSize: '15px !important', color: '#0F172A !important' }} /> : undefined}
                                                                sx={{
                                                                    fontWeight: 600,
                                                                    borderRadius: '8px',
                                                                    backgroundColor: isSelected ? '#FB923C !important' : '#1E293B !important',
                                                                    color: isSelected ? '#0F172A !important' : '#F8FAFC !important',
                                                                    border: '1px solid',
                                                                    borderColor: isSelected ? '#FB923C !important' : '#334155 !important',
                                                                    boxShadow: isSelected ? '0 2px 8px rgba(251, 146, 60, 0.4)' : 'none',
                                                                    '& .MuiChip-label': {
                                                                        color: isSelected ? '#0F172A !important' : '#F8FAFC !important',
                                                                        fontWeight: isSelected ? 700 : 500
                                                                    },
                                                                    '&:hover': {
                                                                        backgroundColor: isSelected ? '#EA580C !important' : '#334155 !important'
                                                                    }
                                                                }}
                                                            />
                                                        );
                                                    })}
                                            </Box>
                                        ) : (
                                            <Typography variant="body2" sx={{ color: '#94A3B8 !important', fontStyle: 'italic' }}>
                                                ⚠️ Squad players not loaded yet. Click <strong>"⚡ Fetch Squad from Cricbuzz"</strong> button above to load playing squads or type names directly.
                                            </Typography>
                                        )}
                                    </Box>
                                </Grid>

                                {/* Astrological Match Summary */}
                                <Grid item xs={12}>
                                    <TextField
                                        label="KP Astrological Match Analysis Summary"
                                        placeholder="Provide detailed KP planetary transit breakdown, sub-lord analysis, lagna strengths, and key turning sessions..."
                                        fullWidth
                                        multiline
                                        rows={4}
                                        value={insightForm.insightsSummary}
                                        onChange={e => setInsightForm({ ...insightForm, insightsSummary: e.target.value })}
                                    />
                                </Grid>

                                {/* Push Notification Toggle */}
                                <Grid item xs={12}>
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={insightForm.notifyUsers}
                                                onChange={e => setInsightForm({ ...insightForm, notifyUsers: e.target.checked })}
                                                sx={{ color: '#38BDF8', '&.Mui-checked': { color: '#38BDF8' } }}
                                            />
                                        }
                                        label={
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                                                <NotificationsActiveIcon sx={{ color: '#38BDF8', fontSize: 18 }} />
                                                <Typography variant="body2" fontWeight="600" sx={{ color: '#F1F5F9 !important' }}>
                                                    Send Push Notification to all Mobile App users via Firebase (FCM)
                                                </Typography>
                                            </Box>
                                        }
                                    />
                                </Grid>
                            </Grid>
                        </Box>
                    </DialogContent>
                    <DialogActions sx={{ p: 2.5, backgroundColor: '#0F172A', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                        <Button onClick={() => setOpenInsightDialog(false)} sx={{ color: '#94A3B8 !important', fontWeight: 600 }}>Cancel</Button>
                        <Button
                            variant="contained"
                            startIcon={<SendIcon />}
                            onClick={handlePublishInsights}
                            disabled={submitting}
                            sx={{
                                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                                borderRadius: '12px',
                                px: 3,
                                fontWeight: 'bold',
                                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
                                '&:hover': {
                                    background: 'linear-gradient(135deg, #059669 0%, #047857 100%)'
                                }
                            }}
                        >
                            {submitting ? 'Publishing & Syncing...' : 'Publish & Sync to Mobile App'}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </ThemeProvider>
    );
};

export default AdminPredictionManager;
