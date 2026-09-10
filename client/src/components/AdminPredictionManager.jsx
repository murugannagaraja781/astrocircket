import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import {
    Box, Typography, TextField, Button, Paper, CircularProgress,
    Dialog, DialogTitle, DialogContent, DialogActions, Grid, Chip, Divider,
    FormControl, InputLabel, Select, MenuItem, FormControlLabel, Checkbox,
    IconButton, Card, CardContent, Tooltip, Alert
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import SendIcon from '@mui/icons-material/Send';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid';
import AuthContext from '../context/AuthContext';

const AdminPredictionManager = () => {
    const { token, user } = useContext(AuthContext);
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
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

    const fetchMatches = async () => {
        try {
            const authToken = token || localStorage.getItem('token');
            const res = await axios.get(`${baseUrl}/api/matches`, {
                headers: { 'x-auth-token': authToken }
            });
            setMatches(res.data);
        } catch (err) {
            console.error("Error fetching matches:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMatches();
    }, []);

    const handleCreateMatch = async () => {
        setSubmitting(true);
        try {
            const authToken = token || localStorage.getItem('token');
            const res = await axios.post(`${baseUrl}/api/matches`, matchForm, {
                headers: { 'x-auth-token': authToken }
            });
            setMatches([res.data, ...matches]);
            setOpenMatchDialog(false);
            setMatchForm({ teamA: '', teamB: '', matchDate: '', matchTime: '', venue: '', status: 'upcoming', location: { name: '', lat: 0, lng: 0 } });
            setStatusMsg({ type: 'success', text: 'Match added successfully!' });
        } catch (err) {
            console.error("Error creating match:", err);
            setStatusMsg({ type: 'error', text: 'Failed to create match' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleOpenInsightDialog = (match) => {
        setSelectedMatch(match);
        const existingInsights = match.insightData || {};
        const legacyPrediction = match.expertPrediction || {};

        const keyBatsmenNames = existingInsights.keyBatsmen?.map(p => p.name || p).join(', ') || '';
        const keyBowlersNames = existingInsights.keyBowlers?.map(p => p.name || p).join(', ') || '';
        const legacyPlayers = legacyPrediction.keyPlayers?.join(', ') || '';

        setInsightForm({
            astrologicalAdvantage: existingInsights.astrologicalAdvantage || legacyPrediction.predictedWinner || match.teamA,
            keyBatsmen: keyBatsmenNames || legacyPlayers,
            keyBowlers: keyBowlersNames,
            insightsSummary: existingInsights.insightsSummary || legacyPrediction.reasoning || '',
            price: existingInsights.price || 49,
            notifyUsers: true
        });
        setOpenInsightDialog(true);
    };

    const handlePublishInsights = async () => {
        if (!selectedMatch) return;
        setSubmitting(true);
        try {
            const authToken = token || localStorage.getItem('token');
            
            // Format batsmen & bowlers arrays
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
                astrologicalAdvantage: insightForm.astrologicalAdvantage,
                keyBatsmen: parsePlayers(insightForm.keyBatsmen, 'Batsman'),
                keyBowlers: parsePlayers(insightForm.keyBowlers, 'Bowler'),
                insightsSummary: insightForm.insightsSummary,
                price: Number(insightForm.price) || 49,
                notifyUsers: insightForm.notifyUsers
            };

            const res = await axios.post(`${baseUrl}/api/insights/publish/${selectedMatch._id}`, payload, {
                headers: { 'x-auth-token': authToken }
            });

            if (res.data.success) {
                setMatches(matches.map(m => m._id === selectedMatch._id ? res.data.match : m));
                setOpenInsightDialog(false);
                setStatusMsg({
                    type: 'success',
                    text: `Insights posted to Mobile App! ${insightForm.notifyUsers ? 'Push notifications sent to users.' : ''}`
                });
            }
        } catch (err) {
            console.error("Error publishing insights:", err);
            setStatusMsg({ type: 'error', text: 'Failed to post insights to app' });
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
            setMatches(matches.filter(m => m._id !== id));
            setStatusMsg({ type: 'info', text: 'Match removed' });
        } catch (err) {
            console.error("Error deleting match:", err);
        }
    };

    if (user?.role !== 'superadmin') return null;

    return (
        <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Typography variant="h5" fontWeight="bold" sx={{ color: '#1e293b', display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PhoneAndroidIcon color="primary" /> Mobile App Insights & Match Manager
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        Post match analysis, set key players, and dispatch push notifications to Flutter mobile users.
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setOpenMatchDialog(true)}
                    sx={{ borderRadius: '10px', textTransform: 'none', background: '#2563eb' }}
                >
                    Add New Match
                </Button>
            </Box>

            {statusMsg.text && (
                <Alert severity={statusMsg.type} sx={{ mb: 2 }} onClose={() => setStatusMsg({ type: '', text: '' })}>
                    {statusMsg.text}
                </Alert>
            )}

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
            ) : (
                <Grid container spacing={2}>
                    {matches.map(match => {
                        const hasInsight = match.insightData?.isPublished || match.expertPrediction?.isPublished;
                        const advantage = match.insightData?.astrologicalAdvantage || match.expertPrediction?.predictedWinner;
                        const price = match.insightData?.price || 49;

                        return (
                            <Grid item xs={12} md={6} key={match._id}>
                                <Paper sx={{ p: 2.5, borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <Box>
                                            <Chip
                                                label={match.status ? match.status.toUpperCase() : 'UPCOMING'}
                                                size="small"
                                                color={match.status === 'live' ? 'error' : match.status === 'completed' ? 'default' : 'primary'}
                                                sx={{ mb: 1, fontWeight: 'bold' }}
                                            />
                                            <Typography variant="h6" fontWeight="bold" sx={{ color: '#0f172a' }}>
                                                {match.teamA} <span style={{ color: '#94a3b8', fontSize: '0.85em' }}>vs</span> {match.teamB}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                📅 {match.matchDate} &nbsp;|&nbsp; ⏰ {match.matchTime} &nbsp;|&nbsp; 📍 {match.venue || 'Stadium'}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            <Button
                                                size="small"
                                                variant="contained"
                                                color={hasInsight ? "success" : "primary"}
                                                startIcon={<SendIcon />}
                                                onClick={() => handleOpenInsightDialog(match)}
                                                sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}
                                            >
                                                {hasInsight ? 'Update & Post' : 'Post to App'}
                                            </Button>
                                            <IconButton size="small" color="error" onClick={() => handleDeleteMatch(match._id)}>
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </Box>
                                    </Box>

                                    {hasInsight && (
                                        <Box sx={{ mt: 2, p: 1.5, bgcolor: '#f8fafc', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Typography variant="body2" fontWeight="bold" color="primary">
                                                    🌟 Advantage: {advantage || 'Calculated in App'}
                                                </Typography>
                                                <Chip label={`₹${price} / Report`} size="small" color="secondary" variant="outlined" />
                                            </Box>
                                            {match.insightData?.keyBatsmen?.length > 0 && (
                                                <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                                                    <strong>🏏 Key Batsmen:</strong> {match.insightData.keyBatsmen.map(p => p.name).join(', ')}
                                                </Typography>
                                            )}
                                            {match.insightData?.keyBowlers?.length > 0 && (
                                                <Typography variant="caption" display="block">
                                                    <strong>🎯 Key Bowlers:</strong> {match.insightData.keyBowlers.map(p => p.name).join(', ')}
                                                </Typography>
                                            )}
                                        </Box>
                                    )}
                                </Paper>
                            </Grid>
                        );
                    })}
                </Grid>
            )}

            {/* Match Creation Dialog */}
            <Dialog open={openMatchDialog} onClose={() => setOpenMatchDialog(false)} fullWidth maxWidth="sm">
                <DialogTitle sx={{ fontWeight: 'bold' }}>Schedule New Match</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 0.5 }}>
                        <Grid item xs={6}>
                            <TextField label="Team A" fullWidth value={matchForm.teamA} onChange={e => setMatchForm({ ...matchForm, teamA: e.target.value })} required />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField label="Team B" fullWidth value={matchForm.teamB} onChange={e => setMatchForm({ ...matchForm, teamB: e.target.value })} required />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField label="Date" type="date" fullWidth InputLabelProps={{ shrink: true }} value={matchForm.matchDate} onChange={e => setMatchForm({ ...matchForm, matchDate: e.target.value })} required />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField label="Time" type="time" fullWidth InputLabelProps={{ shrink: true }} value={matchForm.matchTime} onChange={e => setMatchForm({ ...matchForm, matchTime: e.target.value })} required />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField label="Venue / Stadium" fullWidth value={matchForm.venue} onChange={e => setMatchForm({ ...matchForm, venue: e.target.value })} />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setOpenMatchDialog(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleCreateMatch} disabled={submitting}>Add Match</Button>
                </DialogActions>
            </Dialog>

            {/* Post Insights Dialog */}
            <Dialog open={openInsightDialog} onClose={() => setOpenInsightDialog(false)} fullWidth maxWidth="md">
                <DialogTitle sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PhoneAndroidIcon color="primary" /> Post Astrological Insights to Mobile App
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 1 }}>
                        <Alert severity="info" sx={{ mb: 2 }}>
                            Posting insights will make this match's Astrological Advantage and Key Players available on the Flutter App. Unpaid users will see a preview and can unlock via PhonePe.
                        </Alert>

                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth>
                                    <InputLabel>Astrological Advantage (Winning Edge)</InputLabel>
                                    <Select
                                        value={insightForm.astrologicalAdvantage}
                                        label="Astrological Advantage (Winning Edge)"
                                        onChange={e => setInsightForm({ ...insightForm, astrologicalAdvantage: e.target.value })}
                                    >
                                        <MenuItem value={selectedMatch?.teamA}>{selectedMatch?.teamA} (Advantage)</MenuItem>
                                        <MenuItem value={selectedMatch?.teamB}>{selectedMatch?.teamB} (Advantage)</MenuItem>
                                        <MenuItem value="Even / Neutral">Even / Highly Balanced Match</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="Unlock Price (INR)"
                                    type="number"
                                    fullWidth
                                    value={insightForm.price}
                                    onChange={e => setInsightForm({ ...insightForm, price: e.target.value })}
                                    helperText="Price charged to user on PhonePe (default ₹49)"
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <TextField
                                    label="Top Key Batsmen (comma separated)"
                                    placeholder="e.g. Virat Kohli, Rohit Sharma, David Warner"
                                    fullWidth
                                    value={insightForm.keyBatsmen}
                                    onChange={e => setInsightForm({ ...insightForm, keyBatsmen: e.target.value })}
                                    helperText="KP Astrology high-scoring batsmen for this match"
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <TextField
                                    label="Top Key Bowlers (comma separated)"
                                    placeholder="e.g. Jasprit Bumrah, Mitchell Starc, Adam Zampa"
                                    fullWidth
                                    value={insightForm.keyBowlers}
                                    onChange={e => setInsightForm({ ...insightForm, keyBowlers: e.target.value })}
                                    helperText="KP Astrology high-impact wicket-taking bowlers"
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <TextField
                                    label="Astrological Match Analysis Summary"
                                    placeholder="Provide detailed KP planetary overview, lagna impact, and session insights..."
                                    fullWidth
                                    multiline
                                    rows={4}
                                    value={insightForm.insightsSummary}
                                    onChange={e => setInsightForm({ ...insightForm, insightsSummary: e.target.value })}
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={insightForm.notifyUsers}
                                            onChange={e => setInsightForm({ ...insightForm, notifyUsers: e.target.checked })}
                                            color="primary"
                                        />
                                    }
                                    label={
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <NotificationsActiveIcon color="action" fontSize="small" />
                                            <Typography variant="body2" fontWeight="500">
                                                Send Push Notification to all Mobile App users via Firebase Cloud Messaging
                                            </Typography>
                                        </Box>
                                    }
                                />
                            </Grid>
                        </Grid>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2.5, bgcolor: '#f8fafc' }}>
                    <Button onClick={() => setOpenInsightDialog(false)}>Cancel</Button>
                    <Button
                        variant="contained"
                        startIcon={<SendIcon />}
                        onClick={handlePublishInsights}
                        disabled={submitting}
                        sx={{ background: '#16a34a', '&:hover': { background: '#15803d' }, px: 3 }}
                    >
                        {submitting ? 'Posting...' : 'Post Insights to Mobile App'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default AdminPredictionManager;

