import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Container, Typography, Box, Paper, Grid, Chip, CircularProgress,
    Card, CardContent, Divider, Avatar, Accordion, AccordionSummary,
    AccordionDetails, Button, Menu, MenuItem, IconButton, Select, FormControl, InputLabel
} from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import MoreVertIcon from '@mui/icons-material/MoreVert';

const MyPredictions = () => {
    const [predictions, setPredictions] = useState([]);
    const [leagues, setLeagues] = useState([]);
    const [selectedLeagueId, setSelectedLeagueId] = useState('all');
    const [loading, setLoading] = useState(true);
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedPred, setSelectedPred] = useState(null);

    const fetchPredictions = async () => {
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { 'x-auth-token': token } };
            const url = selectedLeagueId === 'all'
                ? `${import.meta.env.VITE_BACKEND_URL}/api/user-predictions/my`
                : `${import.meta.env.VITE_BACKEND_URL}/api/user-predictions/my?leagueId=${selectedLeagueId}`;

            const res = await axios.get(url, config);
            setPredictions(res.data);
        } catch (err) {
            console.error("Error fetching predictions:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchLeagues = async () => {
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { 'x-auth-token': token } };
            const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/leagues`, config);
            setLeagues(res.data);
        } catch (err) {
            console.error("Error fetching leagues:", err);
        }
    };

    useEffect(() => {
        fetchLeagues();
    }, []);

    useEffect(() => {
        fetchPredictions();
    }, [selectedLeagueId]);

    const handleMenuOpen = (event, pred) => {
        setAnchorEl(event.currentTarget);
        setSelectedPred(pred);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setSelectedPred(null);
    };

    const handleUpdateResult = async (winner) => {
        if (!selectedPred) return;
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { 'x-auth-token': token } };
            await axios.put(`${import.meta.env.VITE_BACKEND_URL}/api/user-predictions/${selectedPred._id}/result`, { actualWinner: winner }, config);
            handleMenuClose();
            fetchPredictions(); // Refresh the list
        } catch (err) {
            console.error("Error updating result:", err);
            alert("Failed to update result.");
        }
    };

    const cleanName = (name) => {
        if (!name) return "";
        // Remove ID patterns like _1770...
        return name.split('_')[0];
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
                <CircularProgress color="secondary" />
            </Box>
        );
    }

    return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#E65100', display: 'flex', alignItems: 'center', gap: 1, m: 0 }}>
                    <EmojiEventsIcon fontSize="large" /> My Predictions
                </Typography>

                <FormControl sx={{ minWidth: 200 }} size="small">
                    <InputLabel id="league-filter-label">Filter by League</InputLabel>
                    <Select
                        labelId="league-filter-label"
                        value={selectedLeagueId}
                        label="Filter by League"
                        onChange={(e) => setSelectedLeagueId(e.target.value)}
                        sx={{ borderRadius: '10px' }}
                    >
                        <MenuItem value="all">All Leagues</MenuItem>
                        <MenuItem value="null">Unassigned</MenuItem>
                        {leagues.map((league) => (
                            <MenuItem key={league._id} value={league._id}>
                                {league.name}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Box>

            {predictions.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: 'center', borderRadius: '16px', bgcolor: '#FFF3E0' }}>
                    <Typography variant="h6" color="text.secondary">
                        No predictions saved yet.
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Go to the Dashboard and make your first prediction!
                    </Typography>
                </Paper>
            ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {predictions.map((pred) => {
                        const isCorrect = pred.actualWinner && pred.predictedWinner === pred.actualWinner;
                        const isIncorrect = pred.actualWinner && pred.predictedWinner !== pred.actualWinner;
                        const hasResult = !!pred.actualWinner;

                        return (
                            <Accordion
                                key={pred._id}
                                sx={{
                                    borderRadius: '16px !important',
                                    overflow: 'hidden',
                                    border: hasResult
                                        ? (isCorrect ? '1.5px solid #22c55e' : '1.5px solid #ef4444')
                                        : '1px solid #e2e8f0',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                                    '&:before': { display: 'none' },
                                    '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }
                                }}
                            >
                                <AccordionSummary
                                    expandIcon={<ExpandMoreIcon />}
                                    sx={{
                                        px: 2,
                                        bgcolor: hasResult
                                            ? (isCorrect ? 'rgba(34, 197, 94, 0.04)' : 'rgba(239, 68, 68, 0.04)')
                                            : 'transparent'
                                    }}
                                >
                                    <Box sx={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between', pr: 2 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <Avatar sx={{
                                                bgcolor: hasResult
                                                    ? (isCorrect ? '#22c55e' : '#ef4444')
                                                    : '#e2e8f0',
                                                color: hasResult ? '#fff' : '#64748b',
                                                width: 40, height: 40, fontSize: '1rem'
                                            }}>
                                                {hasResult ? (isCorrect ? '✓' : '✗') : '📅'}
                                            </Avatar>
                                            <Box>
                                                <Typography variant="body2" color="text.secondary" fontWeight="600" sx={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>
                                                    {pred.matchDate}
                                                </Typography>
                                                <Typography variant="subtitle1" fontWeight="800" sx={{ color: '#1e293b' }}>
                                                    {pred.teamA} vs {pred.teamB}
                                                </Typography>
                                            </Box>
                                        </Box>

                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
                                                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 'bold', display: 'block', mb: -0.5 }}>
                                                    PREDICTED
                                                </Typography>
                                                <Typography variant="body2" fontWeight="800" sx={{ color: '#E65100' }}>
                                                    {pred.predictedWinner}
                                                </Typography>
                                            </Box>
                                            <IconButton
                                                size="small"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleMenuOpen(e, pred);
                                                }}
                                            >
                                                <MoreVertIcon />
                                            </IconButton>
                                        </Box>
                                    </Box>
                                </AccordionSummary>
                                <AccordionDetails sx={{ px: 3, pb: 3, pt: 1, bgcolor: '#fafafa' }}>
                                    <Divider sx={{ mb: 2 }} />

                                    <Grid container spacing={3}>
                                        <Grid item xs={12} md={6}>
                                            <Typography variant="subtitle2" gutterBottom fontWeight="800" sx={{ color: '#64748b', mb: 1.5 }}>
                                                📋 MATCH DETAILS
                                            </Typography>
                                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <Typography variant="body2" color="text.secondary">League</Typography>
                                                    <Typography variant="body2" fontWeight="bold">
                                                        {leagues.find(l => l._id === pred.leagueId)?.name || "Unassigned"}
                                                    </Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <Typography variant="body2" color="text.secondary">Predicted Winner</Typography>
                                                    <Chip
                                                        label={pred.predictedWinner}
                                                        size="small"
                                                        color="secondary"
                                                        sx={{ fontWeight: 'bold', height: 24 }}
                                                    />
                                                </Box>
                                                {hasResult && (
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1, pt: 1, borderTop: '1px dashed #e2e8f0' }}>
                                                        <Typography variant="body2" color="text.secondary">Actual Result</Typography>
                                                        <Typography variant="body2" fontWeight="bold" color={isCorrect ? 'success.main' : 'error.main'}>
                                                            {pred.actualWinner} {isCorrect ? '(Win)' : '(Loss)'}
                                                        </Typography>
                                                    </Box>
                                                )}
                                            </Box>
                                        </Grid>

                                        <Grid item xs={12} md={6}>
                                            <Typography variant="subtitle2" gutterBottom fontWeight="800" sx={{ color: '#64748b', mb: 1.5 }}>
                                                👤 MY STAR PLAYERS ({pred.starPlayers.length})
                                            </Typography>
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                                {pred.starPlayers.map((player, idx) => {
                                                    const name = cleanName(player);
                                                    return (
                                                        <Chip
                                                            key={idx}
                                                            label={name}
                                                            size="small"
                                                            variant="outlined"
                                                            avatar={<Avatar sx={{ bgcolor: '#FFE0B2', color: '#E65100', fontSize: '10px' }}>{name[0]}</Avatar>}
                                                            sx={{
                                                                borderColor: '#FFCC80',
                                                                color: '#E65100',
                                                                fontWeight: 'medium',
                                                                bgcolor: '#fff'
                                                            }}
                                                        />
                                                    );
                                                })}
                                                {pred.starPlayers.length === 0 && (
                                                    <Typography variant="caption" color="text.secondary">No star players selected</Typography>
                                                )}
                                            </Box>
                                        </Grid>
                                    </Grid>
                                </AccordionDetails>
                            </Accordion>
                        );
                    })}
                </Box>
            )}

            {/* Set Result Menu */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
            >
                <Typography sx={{ px: 2, py: 1, fontWeight: 'bold', fontSize: '0.8rem', color: 'text.secondary' }}>
                    SET ACTUAL WINNER
                </Typography>
                <Divider />
                {selectedPred && (
                    <>
                        <MenuItem onClick={() => handleUpdateResult(selectedPred.teamA)}>
                            {selectedPred.teamA}
                        </MenuItem>
                        <MenuItem onClick={() => handleUpdateResult(selectedPred.teamB)}>
                            {selectedPred.teamB}
                        </MenuItem>
                    </>
                )}
            </Menu>
        </Container>
    );
};

export default MyPredictions;
