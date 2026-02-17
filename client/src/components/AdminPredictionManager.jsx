import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import {
    Box, Typography, TextField, Button, Paper, List, ListItem,
    ListItemText, ListItemSecondaryAction, IconButton, CircularProgress,
    Dialog, DialogTitle, DialogContent, DialogActions, Grid, Chip, Divider,
    FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import SendIcon from '@mui/icons-material/Send';
import AuthContext from '../context/AuthContext';

const AdminPredictionManager = () => {
    const { token, user } = useContext(AuthContext);
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openMatchDialog, setOpenMatchDialog] = useState(false);
    const [openPredictionDialog, setOpenPredictionDialog] = useState(false);
    const [selectedMatch, setSelectedMatch] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // Form states for New Match
    const [matchForm, setMatchForm] = useState({
        teamA: '',
        teamB: '',
        matchDate: '',
        matchTime: '',
        venue: '',
        location: { name: '', lat: 0, lng: 0 }
    });

    // Form states for Expert Prediction
    const [predictionForm, setPredictionForm] = useState({
        predictedWinner: '',
        keyPlayers: '',
        reasoning: '',
        isPublished: true
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
            setMatchForm({ teamA: '', teamB: '', matchDate: '', matchTime: '', venue: '', location: { name: '', lat: 0, lng: 0 } });
        } catch (err) {
            console.error("Error creating match:", err);
            alert("Failed to create match");
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdatePrediction = async () => {
        setSubmitting(true);
        try {
            const authToken = token || localStorage.getItem('token');
            const payload = {
                ...predictionForm,
                keyPlayers: predictionForm.keyPlayers.split(',').map(p => p.trim())
            };
            const res = await axios.put(`${baseUrl}/api/matches/${selectedMatch._id}/prediction`, payload, {
                headers: { 'x-auth-token': authToken }
            });

            setMatches(matches.map(m => m._id === selectedMatch._id ? res.data : m));
            setOpenPredictionDialog(false);
        } catch (err) {
            console.error("Error updating prediction:", err);
            alert("Failed to update prediction");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteMatch = async (id) => {
        if (!window.confirm("Are you sure?")) return;
        try {
            const authToken = token || localStorage.getItem('token');
            await axios.delete(`${baseUrl}/api/matches/${id}`, {
                headers: { 'x-auth-token': authToken }
            });
            setMatches(matches.filter(m => m._id !== id));
        } catch (err) {
            console.error("Error deleting match:", err);
        }
    };

    if (user?.role !== 'superadmin') return null;

    return (
        <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" fontWeight="bold" color="secondary">
                    Expert Prediction Admin
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setOpenMatchDialog(true)}
                    sx={{ borderRadius: '10px' }}
                >
                    Add New Match
                </Button>
            </Box>

            {loading ? (
                <CircularProgress />
            ) : (
                <Grid container spacing={2}>
                    {matches.map(match => (
                        <Grid item xs={12} key={match._id}>
                            <Paper sx={{ p: 2, borderRadius: '12px', border: '1px solid #eee' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Box>
                                        <Typography variant="subtitle1" fontWeight="bold">
                                            {match.teamA} vs {match.teamB}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {match.matchDate} at {match.matchTime} | {match.venue}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            startIcon={<EditIcon />}
                                            onClick={() => {
                                                setSelectedMatch(match);
                                                setPredictionForm({
                                                    predictedWinner: match.expertPrediction?.predictedWinner || '',
                                                    keyPlayers: match.expertPrediction?.keyPlayers?.join(', ') || '',
                                                    reasoning: match.expertPrediction?.reasoning || '',
                                                    isPublished: match.expertPrediction?.isPublished ?? true
                                                });
                                                setOpenPredictionDialog(true);
                                            }}
                                            sx={{ mr: 1 }}
                                        >
                                            Update Prediction
                                        </Button>
                                        <IconButton color="error" onClick={() => handleDeleteMatch(match._id)}>
                                            <DeleteIcon />
                                        </IconButton>
                                    </Box>
                                </Box>

                                {match.expertPrediction?.predictedWinner && (
                                    <Box sx={{ mt: 1, p: 1, bgcolor: '#f0f4f8', borderRadius: 1 }}>
                                        <Typography variant="body2">
                                            <strong>Winner:</strong> {match.expertPrediction.predictedWinner}
                                        </Typography>
                                        <Typography variant="body2">
                                            <strong>Players:</strong> {match.expertPrediction.keyPlayers.join(', ')}
                                        </Typography>
                                        <Chip
                                            label={match.expertPrediction.isPublished ? "Published" : "Draft"}
                                            size="small"
                                            color={match.expertPrediction.isPublished ? "success" : "default"}
                                            sx={{ mt: 1 }}
                                        />
                                    </Box>
                                )}
                            </Paper>
                        </Grid>
                    ))}
                </Grid>
            )}

            {/* Match Creation Dialog */}
            <Dialog open={openMatchDialog} onClose={() => setOpenMatchDialog(false)} fullWidth maxWidth="sm">
                <DialogTitle>Add Upcoming Match</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={6}>
                            <TextField label="Team A" fullWidth value={matchForm.teamA} onChange={e => setMatchForm({ ...matchForm, teamA: e.target.value })} />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField label="Team B" fullWidth value={matchForm.teamB} onChange={e => setMatchForm({ ...matchForm, teamB: e.target.value })} />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField label="Date" type="date" fullWidth InputLabelProps={{ shrink: true }} value={matchForm.matchDate} onChange={e => setMatchForm({ ...matchForm, matchDate: e.target.value })} />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField label="Time" type="time" fullWidth InputLabelProps={{ shrink: true }} value={matchForm.matchTime} onChange={e => setMatchForm({ ...matchForm, matchTime: e.target.value })} />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField label="Venue" fullWidth value={matchForm.venue} onChange={e => setMatchForm({ ...matchForm, venue: e.target.value })} />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenMatchDialog(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleCreateMatch} disabled={submitting}>Submit</Button>
                </DialogActions>
            </Dialog>

            {/* Prediction Dialog */}
            <Dialog open={openPredictionDialog} onClose={() => setOpenPredictionDialog(false)} fullWidth maxWidth="sm">
                <DialogTitle>Update Expert Prediction</DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 1 }}>
                        <FormControl fullWidth sx={{ mb: 2 }}>
                            <InputLabel>Predicted Winner</InputLabel>
                            <Select
                                value={predictionForm.predictedWinner}
                                label="Predicted Winner"
                                onChange={e => setPredictionForm({ ...predictionForm, predictedWinner: e.target.value })}
                            >
                                <MenuItem value={selectedMatch?.teamA}>{selectedMatch?.teamA}</MenuItem>
                                <MenuItem value={selectedMatch?.teamB}>{selectedMatch?.teamB}</MenuItem>
                            </Select>
                        </FormControl>
                        <TextField
                            label="Key Players (comma separated)"
                            fullWidth
                            sx={{ mb: 2 }}
                            value={predictionForm.keyPlayers}
                            onChange={e => setPredictionForm({ ...predictionForm, keyPlayers: e.target.value })}
                        />
                        <TextField
                            label="Astrological Reasoning / Expert Notes"
                            fullWidth
                            multiline
                            rows={4}
                            value={predictionForm.reasoning}
                            onChange={e => setPredictionForm({ ...predictionForm, reasoning: e.target.value })}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenPredictionDialog(false)}>Cancel</Button>
                    <Button
                        variant="contained"
                        startIcon={<SendIcon />}
                        onClick={handleUpdatePrediction}
                        disabled={submitting}
                        color="success"
                    >
                        Save & Publish
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default AdminPredictionManager;
