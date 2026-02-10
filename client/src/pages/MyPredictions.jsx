import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Container, Typography, Box, Paper, Grid, Chip, CircularProgress,
    Card, CardContent, Divider, Avatar, Accordion, AccordionSummary,
    AccordionDetails, Button, Menu, MenuItem, IconButton
} from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import MoreVertIcon from '@mui/icons-material/MoreVert';

const MyPredictions = () => {
    const [predictions, setPredictions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedPred, setSelectedPred] = useState(null);

    const fetchPredictions = async () => {
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { 'x-auth-token': token } };
            const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/user-predictions/my`, config);
            setPredictions(res.data);
        } catch (err) {
            console.error("Error fetching predictions:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPredictions();
    }, []);

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
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#E65100', mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                <EmojiEventsIcon fontSize="large" /> My Predictions
            </Typography>

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
                <Grid container spacing={3}>
                    {predictions.map((pred) => {
                        const isCorrect = pred.actualWinner && pred.predictedWinner === pred.actualWinner;
                        const isIncorrect = pred.actualWinner && pred.predictedWinner !== pred.actualWinner;

                        return (
                            <Grid item xs={12} key={pred._id}>
                                <Card sx={{
                                    borderRadius: '16px',
                                    border: isCorrect ? '2px solid #22c55e' : isIncorrect ? '2px solid #ef4444' : '1px solid #FFCC80',
                                    transition: 'transform 0.2s',
                                    '&:hover': { transform: 'translateY(-2px)', boxShadow: 2 }
                                }}>
                                    <CardContent>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                            <Box>
                                                <Typography variant="caption" color="text.secondary" fontWeight="bold">
                                                    MATCH DATE: {pred.matchDate}
                                                </Typography>
                                                <Typography variant="h6" fontWeight="bold" sx={{ mt: 0.5 }}>
                                                    {pred.teamA} <span style={{ color: '#aaa', fontSize: '0.8em' }}>vs</span> {pred.teamB}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Chip
                                                    label={`Predicted: ${pred.predictedWinner}`}
                                                    color="secondary"
                                                    icon={<EmojiEventsIcon />}
                                                    sx={{ fontWeight: 'bold' }}
                                                />
                                                <IconButton onClick={(e) => handleMenuOpen(e, pred)} size="small">
                                                    <MoreVertIcon />
                                                </IconButton>
                                            </Box>
                                        </Box>

                                        {pred.actualWinner && (
                                            <Box sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 1,
                                                mb: 2,
                                                p: 1.5,
                                                borderRadius: '8px',
                                                bgcolor: isCorrect ? '#f0fdf4' : '#fef2f2',
                                                border: `1px solid ${isCorrect ? '#bbf7d0' : '#fecaca'}`
                                            }}>
                                                {isCorrect ? <CheckCircleIcon color="success" /> : <CancelIcon color="error" />}
                                                <Typography variant="body2" fontWeight="bold" color={isCorrect ? 'success.main' : 'error.main'}>
                                                    Actual Result: {pred.actualWinner} {isCorrect ? '(Correct!)' : '(Incorrect)'}
                                                </Typography>
                                            </Box>
                                        )}

                                        <Accordion elevation={0} sx={{
                                            '&:before': { display: 'none' },
                                            bgcolor: 'transparent',
                                            border: '1px solid #eee',
                                            borderRadius: '12px !important'
                                        }}>
                                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                                                    👤 My Star Players ({pred.starPlayers.length})
                                                </Typography>
                                            </AccordionSummary>
                                            <AccordionDetails>
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
                                                                sx={{ borderColor: '#FFCC80', color: '#E65100', fontWeight: 'medium' }}
                                                            />
                                                        );
                                                    })}
                                                </Box>
                                            </AccordionDetails>
                                        </Accordion>
                                    </CardContent>
                                </Card>
                            </Grid>
                        );
                    })}
                </Grid>
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
