import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import {
    Box, Typography, TextField, Button, Paper, List, ListItem,
    ListItemText, ListItemSecondaryAction, IconButton, CircularProgress,
    Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';

import AuthContext from '../context/AuthContext';

const LeagueManager = ({ onLeagueCreated }) => {
    const { token } = useContext(AuthContext);
    const [leagues, setLeagues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newLeagueName, setNewLeagueName] = useState('');
    const [newLeagueDesc, setNewLeagueDesc] = useState('');
    const [openDialog, setOpenDialog] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';

    const fetchLeagues = async () => {
        try {
            const authToken = token || localStorage.getItem('token');
            const res = await axios.get(`${baseUrl}/api/leagues`, {
                headers: { 'x-auth-token': authToken }
            });
            setLeagues(res.data);
        } catch (err) {
            console.error("Error fetching leagues:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeagues();
    }, []);

    const handleCreateLeague = async () => {
        if (!newLeagueName) return;
        setSubmitting(true);
        try {
            const authToken = token || localStorage.getItem('token');
            const res = await axios.post(`${baseUrl}/api/leagues`,
                { name: newLeagueName, description: newLeagueDesc },
                { headers: { 'x-auth-token': authToken } }
            );
            setLeagues([res.data, ...leagues]);
            setNewLeagueName('');
            setNewLeagueDesc('');
            setOpenDialog(false);
            if (onLeagueCreated) onLeagueCreated(res.data);
        } catch (err) {
            console.error("Error creating league:", err);
            alert("Failed to create league");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteLeague = async (id) => {
        if (!window.confirm("Are you sure you want to delete this league? Predictions assigned to it will become unassigned.")) return;
        try {
            const authToken = token || localStorage.getItem('token');
            await axios.delete(`${baseUrl}/api/leagues/${id}`, {
                headers: { 'x-auth-token': authToken }
            });
            setLeagues(leagues.filter(l => l._id !== id));
        } catch (err) {
            console.error("Error deleting league:", err);
            alert("Failed to delete league");
        }
    };

    return (
        <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight="bold" sx={{ color: '#FF6F00', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EmojiEventsIcon /> My Leagues
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setOpenDialog(true)}
                    sx={{ bgcolor: '#FF6F00', '&:hover': { bgcolor: '#E65100' }, borderRadius: '10px' }}
                >
                    New League
                </Button>
            </Box>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <CircularProgress size={24} color="secondary" />
                </Box>
            ) : leagues.length === 0 ? (
                <Paper sx={{ p: 3, textAlign: 'center', bgcolor: '#FFF3E0', borderRadius: '12px' }}>
                    <Typography variant="body2" color="text.secondary">No leagues created yet.</Typography>
                </Paper>
            ) : (
                <List sx={{ bgcolor: 'background.paper', borderRadius: '12px', border: '1px solid #eee' }}>
                    {leagues.map((league) => (
                        <ListItem key={league._id} divider>
                            <ListItemText
                                primary={league.name}
                                secondary={league.description || "No description"}
                                primaryTypographyProps={{ fontWeight: 'bold' }}
                            />
                            <ListItemSecondaryAction>
                                <IconButton edge="end" onClick={() => handleDeleteLeague(league._id)} color="error">
                                    <DeleteIcon />
                                </IconButton>
                            </ListItemSecondaryAction>
                        </ListItem>
                    ))}
                </List>
            )}

            <Dialog open={openDialog} onClose={() => setOpenDialog(false)} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: '16px' } }}>
                <DialogTitle sx={{ fontWeight: 'bold' }}>Create New League</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="League Name (e.g., IPL 2024)"
                        fullWidth
                        variant="outlined"
                        value={newLeagueName}
                        onChange={(e) => setNewLeagueName(e.target.value)}
                        sx={{ mt: 1 }}
                    />
                    <TextField
                        margin="dense"
                        label="Description (Optional)"
                        fullWidth
                        variant="outlined"
                        multiline
                        rows={2}
                        value={newLeagueDesc}
                        onChange={(e) => setNewLeagueDesc(e.target.value)}
                    />
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
                    <Button
                        onClick={handleCreateLeague}
                        variant="contained"
                        disabled={!newLeagueName || submitting}
                        sx={{ bgcolor: '#FF6F00', '&:hover': { bgcolor: '#E65100' } }}
                    >
                        {submitting ? <CircularProgress size={24} color="inherit" /> : "Create"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default LeagueManager;
