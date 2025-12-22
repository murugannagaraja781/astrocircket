
import React, { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import {
    Box, CssBaseline, Drawer, AppBar, Toolbar, List, Typography, Divider, IconButton,
    ListItem, ListItemButton, ListItemIcon, ListItemText, Container, Grid, Paper, Button,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField, Autocomplete, CircularProgress,
    useTheme, useMediaQuery, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination,
    Snackbar, Alert, Checkbox, FormControlLabel, Chip, Avatar
} from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';

const visionTheme = createTheme({
    palette: {
        mode: 'dark',
        background: {
            default: '#0F1535',
            paper: '#111C44', // Fallback for non-glass
        },
        primary: {
            main: '#0075FF', // Electric Blue
        },
        secondary: {
            main: '#2CD9FF', // Cyan
        },
        text: {
            primary: '#FFFFFF',
            secondary: '#A0AEC0',
        },
    },
    components: {
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)', // Glass
                    backdropFilter: 'blur(10px)',
                    borderRadius: '20px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
                },
            },
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: '12px',
                    textTransform: 'none',
                    fontWeight: 'bold',
                },
                contained: {
                    boxShadow: '0 4px 7px -1px rgba(0,0,0,0.11), 0 2px 4px -1px rgba(0,0,0,0.07)',
                },
            },
        },
        MuiTableCell: {
            styleOverrides: {
                root: {
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#fff',
                },
                head: {
                    color: '#A0AEC0',
                    backgroundColor: '#111C44', // Dark sticky header
                    textTransform: 'uppercase',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                },
            },
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    '& .MuiFilledInput-root': {
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '12px',
                        '&:hover': {
                            backgroundColor: 'rgba(255, 255, 255, 0.1)', // Slightly lighter on hover
                        },
                        '&.Mui-focused': {
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            boxShadow: '0 0 0 2px #0075FF', // Focus ring
                        },
                    },
                    '& .MuiInputLabel-root': {
                        color: '#A0AEC0',
                        '&.Mui-focused': { color: '#0075FF' }
                    },
                    '& .MuiInputBase-input': {
                        color: '#fff',
                    },
                    '& .MuiOutlinedInput-root': {
                        // For manual override case
                        '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                        '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.4)' },
                        '&.Mui-focused fieldset': { borderColor: '#0075FF' },
                    }
                }
            }
        },
        MuiDialog: {
            styleOverrides: {
                paper: {
                    backgroundColor: '#111C44',
                    backgroundImage: 'none',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '20px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
                }
            }
        },
        MuiDialogTitle: {
            styleOverrides: {
                root: {
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    color: '#fff',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                }
            }
        },
        MuiDialogContent: {
            styleOverrides: {
                root: {
                    padding: '24px !important',
                }
            }
        },
        MuiDialogActions: {
            styleOverrides: {
                root: {
                    padding: '16px 24px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                }
            }
        }
    },
    typography: {
        fontFamily: '"Plus Jakarta Sans", "Roboto", "Helvetica", "Arial", sans-serif',
        h4: { fontWeight: 700 },
        h5: { fontWeight: 700 },
        h6: { fontWeight: 700 },
    },
});
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import SportsCricketIcon from '@mui/icons-material/SportsCricket';
import GroupIcon from '@mui/icons-material/Group';
import LogoutIcon from '@mui/icons-material/Logout';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import DescriptionIcon from '@mui/icons-material/Description'; // New Icon for View Chart
import GavelIcon from '@mui/icons-material/Gavel'; // Rules Icon
import RasiChart from '../components/RasiChart';
import PlanetaryTable from '../components/PlanetaryTable';
import AuthContext from '../context/AuthContext';
import UserDashboard from './UserDashboard';


// Rules View Component (Tamil)
const RulesView = () => {
    return (
        <Box sx={{ p: 2 }}>
            <Typography variant="h4" gutterBottom sx={{ mb: 4, color: '#fff' }}>
                Astrological Prediction Rules (கணிப்பு விதிமுறைகள்)
            </Typography>

            <Grid container spacing={4}>
                {/* BATSMAN RULES */}
                <Grid item xs={12} lg={6}>
                    <Paper sx={{ p: 4, height: '100%', bgcolor: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <SportsCricketIcon sx={{ mr: 1, color: '#4caf50' }} />
                            <Typography variant="h5" color="primary" fontWeight="bold">
                                Rules for Batsman
                            </Typography>
                        </Box>
                        <Divider sx={{ mb: 3, borderColor: 'rgba(255,255,255,0.2)' }} />

                        <List sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <ListItem alignItems="flex-start" disablePadding>
                                <ListItemText
                                    primary="Pre-requisites:"
                                    secondary={<span style={{ color: '#ccc' }}>1) Need to take match location date time place.<br/>2) Need to find Moon Rasi and Star Lord.</span>}
                                    primaryTypographyProps={{ fontWeight: 'bold', color: '#ff9800' }}
                                />
                            </ListItem>

                            <ListItem alignItems="flex-start" disablePadding>
                                <ListItemText
                                    primary="First Rule:"
                                    secondary={<span style={{ color: '#fff' }}>பிளேயர் உடைய ராசி நட்சத்திரம் மேட்ச் ராசி நட்சத்திரத்துடன் இணைந்து இருந்தால் <b>Good</b> அல்லது பரிவர்த்தனை பெற்றிருந்தால் <b>Excellent (நன்று)</b>.</span>}
                                    primaryTypographyProps={{ fontWeight: 'bold', color: '#4caf50' }}
                                />
                            </ListItem>

                            <ListItem alignItems="flex-start" disablePadding>
                                <ListItemText
                                    primary="3rd Rule:"
                                    secondary={<span style={{ color: '#fff' }}>சந்திரனின் நட்சத்திர அதிபதி யாருக்கெல்லாம் ராசி அதிபதியாகவோ வருகிறது என்று பார்க்க வேண்டும். இது <b>Good</b>.</span>}
                                    primaryTypographyProps={{ fontWeight: 'bold', color: '#4caf50' }}
                                />
                            </ListItem>

                            <ListItem alignItems="flex-start" disablePadding>
                                <ListItemText
                                    primary="4th Rule:"
                                    secondary={<span style={{ color: '#fff' }}>ராசி அதிபதி மற்றும் நட்சத்திராதிபதி இரண்டும் இணைந்து இன்று நடக்கும் மேச்சின் நட்சத்திராதிபதி வீட்டில் இருந்தால் <b>Good</b>.<br/>இரண்டு வேறு வேறு வீட்டில் இருந்தாலும் <b>Good</b> (உதாரணத்திற்கு இன்று சுக்கிரனின் நட்சத்திரம் என்றால் செவ்வாய் துலாத்திலும் சனி ரிஷபத்திலும் இருந்தால் ஓகே அல்லது இரண்டு கிரகங்களும் துலாம் ரிஷபத்தில் இருந்தால் ஓகே குட்).</span>}
                                    primaryTypographyProps={{ fontWeight: 'bold', color: '#4caf50' }}
                                />
                            </ListItem>

                            <ListItem alignItems="flex-start" disablePadding>
                                <ListItemText
                                    primary="5th Rule:"
                                    secondary={<span style={{ color: '#fff' }}>நான்கு ரூல்ஸ்ளையும் அடைபடவில்லை என்றால் பிளேயரின் ராசி நட்சத்திர அதிபதி வீட்டில் மேட்ச்சின் ராசி நட்சத்திர அதிபதிகள் இணைந்து இருந்தால் <b>நன்று</b>.</span>}
                                    primaryTypographyProps={{ fontWeight: 'bold', color: '#4caf50' }}
                                />
                            </ListItem>

                             <ListItem alignItems="flex-start" disablePadding>
                                <ListItemText
                                    primary="Result:"
                                    secondary={<span style={{ color: '#f44336' }}>இதில் எந்த ரூல்சிலும் வரவில்லை என்றால் <b>Flop</b>.</span>}
                                    primaryTypographyProps={{ fontWeight: 'bold', color: '#f44336' }}
                                />
                            </ListItem>

                             <ListItem alignItems="flex-start" disablePadding>
                                <ListItemText
                                    primary="6th Rule:"
                                    secondary={<span style={{ color: '#fff' }}>ராசி அதிபதியுடன் இன்றைய மேட்சிங் நட்சத்திர அதிபதி இணைந்திருந்தால் <b>நன்று</b>.</span>}
                                    primaryTypographyProps={{ fontWeight: 'bold', color: '#4caf50' }}
                                />
                            </ListItem>

                            <ListItem alignItems="flex-start" disablePadding>
                                <ListItemText
                                    primary="7th Rule:"
                                    secondary={<span style={{ color: '#fff' }}>ஒரு பிளேயருடைய நட்சத்திராதிபதி ராகு கேதுவாக வந்தால் அந்த ராசியாதிபதி அன்றைய மேட்சிங் நட்சத்திர அதிபதி வீட்டில் இருந்தால் <b>நலம்</b>, மற்றபடி <b>பிளாப்</b>.</span>}
                                    primaryTypographyProps={{ fontWeight: 'bold', color: '#4caf50' }}
                                />
                            </ListItem>
                        </List>
                    </Paper>
                </Grid>

                {/* BOWLER RULES */}
                <Grid item xs={12} lg={6}>
                     <Paper sx={{ p: 4, height: '100%', bgcolor: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <GavelIcon sx={{ mr: 1, color: '#f44336' }} />
                            <Typography variant="h5" color="secondary" fontWeight="bold">
                                Bowler Rule
                            </Typography>
                        </Box>
                        <Divider sx={{ mb: 3, borderColor: 'rgba(255,255,255,0.2)' }} />

                        <List sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <ListItem alignItems="flex-start" disablePadding>
                                <ListItemText
                                    primary="First Rule:"
                                    secondary={<span style={{ color: '#fff' }}>பிளேயர் உடைய ராசி நட்சத்திரம் மேட்ச் ராசி நட்சத்திரத்துடன் இணைந்து இருந்தால் <b>Good</b> அல்லது பரிவர்த்தனை பெற்றிருந்தால் <b>Excellent (நன்று)</b>.</span>}
                                    primaryTypographyProps={{ fontWeight: 'bold', color: '#f44336' }}
                                />
                            </ListItem>

                            <ListItem alignItems="flex-start" disablePadding>
                                <ListItemText
                                    primary="Second:"
                                    secondary={<span style={{ color: '#fff' }}>சந்திரனின் நட்சத்திர அதிபதி யாருக்கெல்லாம் ராசி அதிபதியாகவோ வருகிறது என்று பார்க்க வேண்டும். இது <b>Good</b>.</span>}
                                    primaryTypographyProps={{ fontWeight: 'bold', color: '#f44336' }}
                                />
                            </ListItem>

                            <ListItem alignItems="flex-start" disablePadding>
                                <ListItemText
                                    primary="Lagna Rule:"
                                    secondary={<span style={{ color: '#fff' }}>மேட்சிங் ராசி அதிபதி லக்னாதிபதியாக பிளேருடைய ராசி அதிபதி அல்லது நட்சத்திராதிபதி இருந்தால் <b>சிறப்பு</b>.</span>}
                                    primaryTypographyProps={{ fontWeight: 'bold', color: '#ff9800' }}
                                />
                            </ListItem>

                            <ListItem alignItems="flex-start" disablePadding>
                                <ListItemText
                                    primary="3rd Rule:"
                                    secondary={<span style={{ color: '#fff' }}>பிளேருடைய ராசி நட்சத்திரம் மேட்சிங் ராசி அதிபதி நட்சத்திராதிபதி வீட்டில் இருந்தால் <b>ஓகே</b> இல்லையென்றால் <b>பிளாப்</b>.</span>}
                                    primaryTypographyProps={{ fontWeight: 'bold', color: '#f44336' }}
                                />
                            </ListItem>

                            <ListItem alignItems="flex-start" disablePadding>
                                <ListItemText
                                    primary="4th Rule:"
                                    secondary={<span style={{ color: '#fff' }}>பிளேருடைய ராசி அதிபதி மேட்ச் நடக்கும் லக்னத்தில் இருந்தால் <b>சிறப்பு</b>.</span>}
                                    primaryTypographyProps={{ fontWeight: 'bold', color: '#f44336' }}
                                />
                            </ListItem>
                             <ListItem alignItems="flex-start" disablePadding>
                                <ListItemText
                                    primary="5th Rule:"
                                    secondary={<span style={{ color: '#fff' }}>ராசி அதிபதியுடன் மேட்ச் நடக்கும் லக்னாதிபதி இணைந்திருந்தாள் <b>சிறப்பு</b>.</span>}
                                    primaryTypographyProps={{ fontWeight: 'bold', color: '#f44336' }}
                                />
                            </ListItem>
                        </List>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

// Placeholder Components for Sections
const DashboardHome = () => {
    const { token } = useContext(AuthContext);
    const [stats, setStats] = useState({
        totalUsers: 0,
        pendingUsers: 0,
        totalPlayers: 0,
        totalGroups: 0,
        totalViews: 0
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/auth/stats`, {
                    headers: { 'x-auth-token': token }
                });
                setStats(res.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchStats();
    }, []);

    return (
        <Grid container spacing={3}>
            {[
                { label: 'Total Users', value: stats.totalUsers, icon: <PeopleIcon />, color: 'linear-gradient(135deg, #0075FF 0%, #2CD9FF 100%)' },
                { label: 'Pending Users', value: stats.pendingUsers, icon: <GroupIcon />, color: 'linear-gradient(135deg, #FF0080 0%, #7928CA 100%)' },
                { label: 'Total Players', value: stats.totalPlayers, icon: <SportsCricketIcon />, color: 'linear-gradient(135deg, #429321 0%, #B4EC51 100%)' },
                { label: 'Total Groups', value: stats.totalGroups, icon: <DashboardIcon />, color: 'linear-gradient(135deg, #FF512F 0%, #DD2476 100%)' },
                { label: 'Total Views', value: stats.totalViews, icon: <DashboardIcon />, color: 'linear-gradient(135deg, #00B4D8 0%, #0077B6 100%)' }
            ].map((item, index) => (
                <Grid item xs={12} sm={6} md={3} key={index}>
                    <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box>
                            <Typography variant="body2" color="text.secondary" fontWeight="bold">{item.label}</Typography>
                            <Typography variant="h5" color="white" fontWeight="bold">{item.value}</Typography>
                        </Box>
                        <Box sx={{
                            width: 45, height: 45, borderRadius: '12px',
                            background: item.color,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'white', boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
                        }}>
                            {item.icon}
                        </Box>
                    </Paper>
                </Grid>
            ))}
        </Grid>
    );
};

// ... UsersManager ... (unchanged, handled in previous blocks or can leave if not updating)
// Actually I need to be careful with replace range.
// `DashboardHome` is at top. `GroupsManager` is at bottom.
// I will splitting this into two Replace calls for safety if they are far apart.
// Assuming users wants `GroupsManager` implemented, I will do it in next tool or separate chunk.
// I'll do DashboardHome first.

/*
   Wait, I can do GroupsManager here if I replace the placeholder at the bottom.
   But current `DashboardHome` is at lines 15-44.
   `GroupsManager` is a one-liner at line ~300 (before AdminDashboard main component?).
   Wait, where was GroupsManager defined?
   Line 42: const UsersManager = ...
   Line ~300: const GroupsManager = ... (Placeholder)

   I will replace `DashboardHome` first.
*/

const UsersManager = () => {
    const { token } = useContext(AuthContext);
    const [users, setUsers] = useState([]);
    const [filter, setFilter] = useState('pending'); // 'pending' or 'all'

    // Feedback State
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const showSnackbar = (message, severity = 'success') => { setSnackbar({ open: true, message, severity }); };
    const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });

    // Confirm Dialog State
    const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', action: null });
    const convertConfirmAction = (title, message, action) => {
         setConfirmDialog({ open: true, title, message, action: () => action() });
    };
    const handleConfirmClose = () => setConfirmDialog({ ...confirmDialog, open: false });
    const handleConfirmExecute = async () => {
        if (confirmDialog.action) await confirmDialog.action();
        handleConfirmClose();
    };


    const fetchUsers = async () => {
        try {
            const url = filter === 'pending'
                ? `${import.meta.env.VITE_BACKEND_URL}/api/auth/pending`
                : `${import.meta.env.VITE_BACKEND_URL}/api/auth/users`;

            const res = await axios.get(url, {
                headers: { 'x-auth-token': token }
            });
            setUsers(res.data);
        } catch (err) {
            console.error(err);
            showSnackbar('Failed to fetch users', 'error');
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [filter]);

    const approveUser = async (id) => {
        try {
            await axios.put(`${import.meta.env.VITE_BACKEND_URL}/api/auth/approve/${id}`, {}, {
                headers: { 'x-auth-token': token }
            });
            fetchUsers();
            showSnackbar('User Approved', 'success');
        } catch (err) {
            console.error(err);
            showSnackbar('Failed to approve user', 'error');
        }
    };

    const deleteUser = async (id) => {
        try {
             await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/api/auth/users/${id}`, {
                headers: { 'x-auth-token': token }
            });
            fetchUsers();
            showSnackbar('User Deleted', 'success');
        } catch (err) {
            console.error(err);
            showSnackbar('Failed to delete user', 'error');
        }
    };

    const blockUser = async (id) => {
        try {
            await axios.put(`${import.meta.env.VITE_BACKEND_URL}/api/auth/block/${id}`, {}, {
                headers: { 'x-auth-token': token }
            });
            fetchUsers();
            showSnackbar('User Status Updated', 'success');
        } catch (err) {
             console.error(err);
             showSnackbar('Failed to update user status', 'error');
        }
    };

    return (
        <Box>
            <Typography variant="h5" gutterBottom>User Management</Typography>
            <Box sx={{ mb: 2 }}>
                <Button variant={filter === 'pending' ? "contained" : "outlined"} onClick={() => setFilter('pending')} sx={{ mr: 1 }}>
                    Pending Approvals
                </Button>
                <Button variant={filter === 'all' ? "contained" : "outlined"} onClick={() => setFilter('all')}>
                    All Users
                </Button>
            </Box>
            <Paper>
                <List>
                     <ListItem sx={{ bgcolor: 'rgba(255, 255, 255, 0.05)', fontWeight: 'bold' }}>
                        <Grid container>
                            <Grid item xs={3}>Username</Grid>
                            <Grid item xs={2}>Role</Grid>
                            <Grid item xs={2}>Status</Grid>
                            <Grid item xs={5}>Action</Grid>
                        </Grid>
                    </ListItem>
                    {users.length === 0 ? (
                        <ListItem><Typography sx={{ p: 2 }}>No users found.</Typography></ListItem>
                    ) : (
                        users.map(u => (
                            <ListItem key={u._id} divider>
                                <Grid container alignItems="center">
                                    <Grid item xs={3}>{u.username}</Grid>
                                    <Grid item xs={2}>{u.role}</Grid>
                                    <Grid item xs={2}>
                                        {u.isBlocked ? <Chip label="Blocked" color="error" size="small" /> : <Chip label="Active" color="success" size="small" />}
                                        {!u.isApproved && <Chip label="Pending" color="warning" size="small" sx={{ ml: 1 }} />}
                                    </Grid>
                                    <Grid item xs={5} sx={{ display: 'flex', gap: 1 }}>
                                        {filter === 'pending' && !u.isApproved && (
                                            <Button variant="contained" color="success" size="small" onClick={() => approveUser(u._id)}>
                                                Approve
                                            </Button>
                                        )}
                                        {u.role !== 'superadmin' && (
                                            <>
                                                <Button variant="outlined" color={u.isBlocked ? "success" : "warning"} size="small" onClick={() => blockUser(u._id)}>
                                                    {u.isBlocked ? "Unblock" : "Block"}
                                                </Button>
                                                <Button variant="outlined" color="error" size="small" onClick={() => convertConfirmAction('Delete User', `Delete user ${u.username}?`, () => deleteUser(u._id))}>
                                                    Delete
                                                </Button>
                                            </>
                                        )}
                                    </Grid>
                                </Grid>
                            </ListItem>
                        ))
                    )}
                </List>
            </Paper>

             <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }} variant="filled">
                    {snackbar.message}
                </Alert>
            </Snackbar>

            {/* Confirmation Dialog */}
            <Dialog open={confirmDialog.open} onClose={handleConfirmClose}>
                <DialogTitle>{confirmDialog.title}</DialogTitle>
                <DialogContent>
                    <Typography>{confirmDialog.message}</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleConfirmClose}>Cancel</Button>
                    <Button onClick={handleConfirmExecute} color="error" variant="contained">Confirm</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};
// --- COMPONENTS ---
const PlayersManager = () => {
    const { token } = useContext(AuthContext);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const [players, setPlayers] = useState([]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalPlayers, setTotalPlayers] = useState(0);
    const [loading, setLoading] = useState(false);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [filterPlace, setFilterPlace] = useState('');

    // Selection
    const [selectedIds, setSelectedIds] = useState([]);

    // Dialog States
    const [openEdit, setOpenEdit] = useState(false);
    const [openUpload, setOpenUpload] = useState(false);
    const [openGroupDialog, setOpenGroupDialog] = useState(false);
    const [selectedPlayer, setSelectedPlayer] = useState(null);
    const [playerForm, setPlayerForm] = useState({});

    // Group Selection State
    const [availableGroups, setAvailableGroups] = useState([]);
    const [selectedGroupToAdd, setSelectedGroupToAdd] = useState('');

    // Upload State
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadStatus, setUploadStatus] = useState('');
    const [profilePicFile, setProfilePicFile] = useState(null); // For single player add

    // Async Place Search
    const [placeInputValue, setPlaceInputValue] = useState('');
    const [placeOptions, setPlaceOptions] = useState([]);
    const [placeLoading, setPlaceLoading] = useState(false);
    const searchTimeout = React.useRef(null);

    // State for Viewing Chart & Table
    const [openChartDialog, setOpenChartDialog] = useState(false);
    const [selectedPlayerForChart, setSelectedPlayerForChart] = useState(null);

    const handleViewChart = (player) => {
        setSelectedPlayerForChart(player);
        setOpenChartDialog(true);
    };

    // Snackbar (Designed Alert)
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });
    const showSnackbar = (message, severity = 'success') => setSnackbar({ open: true, message, severity });

    const fetchPlayers = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/players`, {
                params: { page: page + 1, limit: rowsPerPage, search: searchTerm, place: filterPlace },
                headers: { 'x-auth-token': token }
            });
            setPlayers(res.data.players);
            setTotalPlayers(res.data.totalPlayers);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchGroupsForDialog = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/groups`, {
                headers: { 'x-auth-token': token }
            });
            setAvailableGroups(res.data);
        } catch (err) { console.error(err); }
    };

    useEffect(() => { fetchPlayers(); }, [page, rowsPerPage, filterPlace]);

    const handleSearch = () => { setPage(0); fetchPlayers(); };

    const handleAddClick = () => {
        setSelectedPlayer(null);
        setPlayerForm({});
        setProfilePicFile(null);
        setOpenEdit(true);
    };

    const handleEditClick = (player) => {
        setSelectedPlayer(player);
        setPlayerForm({
            name: player.name || '', profile: player.profile || '', dob: player.dob || '',
            birthTime: player.birthTime || '',
            birthPlace: player.birthPlace || '', timezone: player.timezone || '', id: player.id,
            latitude: player.latitude, longitude: player.longitude
        });
        setOpenEdit(true);
    };

    const handleDeleteClick = async (id) => {
        if (!confirm('Are you sure you want to delete this player?')) return;
        try {
            await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/api/players/${id}`, {
                 headers: { 'x-auth-token': token }
            });
            showSnackbar('Player deleted successfully', 'success');
            fetchPlayers();
        } catch (err) {
            console.error(err); showSnackbar('Failed to delete player', 'error');
        }
    };

    const handleSelect = (id) => {
        if (selectedIds.includes(id)) setSelectedIds(selectedIds.filter(sid => sid !== id));
        else setSelectedIds([...selectedIds, id]);
    };

    const handleSavePlayer = async () => {
        try {
             // For Add (POST), we might use FormData if there's a file.
             // For Edit (PUT), currently backend only supports JSON updates without file for now (based on analysis).
             // We will handle FormData for Add.

             if (!selectedPlayer) {
                // ADD PLAYER
                const formData = new FormData();
                Object.keys(playerForm).forEach(key => {
                    // Exclude complex objects if any, though usually for Add it's fine
                    formData.append(key, playerForm[key]);
                });
                if (profilePicFile) {
                    formData.append('image', profilePicFile);
                }

                await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/players/add`, formData, {
                    headers: { 'x-auth-token': token, 'Content-Type': 'multipart/form-data' }
                });
                showSnackbar('Player Added Successfully', 'success');
            } else {
                // EDIT PLAYER
                if (profilePicFile) {
                    // Use FormData if file exists
                    const formData = new FormData();
                    // Explicitly append only relevant fields to avoid object stringification issues
                    ['name', 'birthPlace', 'dob', 'birthTime', 'latitude', 'longitude', 'timezone', 'manualTimezone'].forEach(key => {
                        if (playerForm[key] !== undefined && playerForm[key] !== null) {
                            formData.append(key, playerForm[key]);
                        }
                    });

                    formData.append('image', profilePicFile);

                    await axios.put(`${import.meta.env.VITE_BACKEND_URL}/api/players/${selectedPlayer.id}`, formData, {
                        headers: { 'x-auth-token': token, 'Content-Type': 'multipart/form-data' }
                    });
                } else {
                    // Use JSON if no file (legacy/safe way)
                    // We should remove birthChart from updates to be safe, though existing code sent it all.
                    // If existing code worked, it means backend either handled it or it wasn't an issue.
                    // But to be cleaner, let's just send everything as before to minimize regression risk for non-file edits.
                    // Actually, let's be safer and strip birthChart if possible, but let's stick to existing behavior for consistency.
                    // Wait, existing behavior sent `playerForm` which is `player`.
                    // Backend `updatePlayer` uses `req.body` as `updates`.
                    // If `playerForm` has `birthChart` (object), it is sent as JSON.
                    // Backend `req.body` parses JSON. `updates.birthChart` is an object.
                    // `findOneAndUpdate` with `$set: updates` SAVES IT AS IS.
                    // So sending JSON is fine for objects. sending FormData is NOT.
                    // So my bifurcation is correct.
                    await axios.put(`${import.meta.env.VITE_BACKEND_URL}/api/players/${selectedPlayer.id}`, playerForm, {
                        headers: { 'x-auth-token': token }
                    });
                }
                showSnackbar('Player Updated Successfully', 'success');
            }

             setOpenEdit(false);
             fetchPlayers();
        } catch (err) {
            console.error(err); showSnackbar(err.response?.data?.message || "Operation failed", 'error');
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) return;
        setUploadStatus('Uploading...');
        const formData = new FormData();
        formData.append('file', selectedFile);
        try {
             await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/players/upload`, formData, {
                headers: { 'x-auth-token': token, 'Content-Type': 'multipart/form-data' }
            });
            setUploadStatus('Success!'); setOpenUpload(false); fetchPlayers();
        } catch (err) { setUploadStatus('Error uploading.'); }
    };

    const downloadSampleTemplate = () => {
        const headers = ["id", "name", "dob", "birthTime", "birthPlace", "latitude", "longitude", "timezone"];
        const row1 = ["P001", "Sample Player", "1990-01-01", "14:30", "Mumbai", "19.0760", "72.8777", "5.5"];
        const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + row1.join(",");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "player_upload_template.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Async Places
    const fetchPlaces = async (query) => {
        if (!query || query.length < 3) return;
        setPlaceLoading(true);
        try {
            const res = await axios.get(`https://nominatim.openstreetmap.org/search`, { params: { q: query, format: 'json', limit: 5, addressdetails: 1 } });
            setPlaceOptions(res.data.map(p => ({ label: p.display_name, lat: parseFloat(p.lat), long: parseFloat(p.lon) })));
        } catch (err) { console.error(err); } finally { setPlaceLoading(false); }
    };

    const fetchTimezone = async (lat, long) => {
        try {
            console.log(`Fetching timezone for lat: ${lat}, long: ${long}`);
            const res = await axios.get(`https://api.open-meteo.com/v1/forecast`, { params: { latitude: lat, longitude: long, current_weather: true, timezone: 'auto' } });
            console.log('Timezone Fetch Result:', res.data.utc_offset_seconds / 3600);
            return res.data.utc_offset_seconds / 3600;
        } catch (err) {
            console.error('Timezone Fetch Error:', err);
            return null;
        }
    };

    const handlePlaceInputChange = (e, val) => {
        setPlaceInputValue(val); setPlayerForm({...playerForm, birthPlace: val});
        if (searchTimeout.current) clearTimeout(searchTimeout.current);
        searchTimeout.current = setTimeout(() => fetchPlaces(val), 800);
    };

    const handlePlaceChange = async (e, val) => {
        console.log('Place Selected:', val);
        if (val && typeof val === 'object') {
            // Selected from list
            setPlayerForm({ ...playerForm, birthPlace: val.label, latitude: val.lat, longitude: val.long });
            const tz = await fetchTimezone(val.lat, val.long);
            if (tz !== null) {
                console.log('Setting Timezone:', tz);
                setPlayerForm(prev => ({ ...prev, timezone: tz }));
            }
        } else if (typeof val === 'string' && val.trim().length > 0) {
            // Free typed string - Auto-resolve best match
            console.log('Manual text entry, attempting auto-resolve for:', val);
            setPlaceLoading(true);
            try {
                // 1. Find place coordinates
                const searchRes = await axios.get(`https://nominatim.openstreetmap.org/search`, {
                    params: { q: val, format: 'json', limit: 1, addressdetails: 1 }
                });

                if (searchRes.data && searchRes.data.length > 0) {
                    const bestMatch = searchRes.data[0];
                    const lat = parseFloat(bestMatch.lat);
                    const long = parseFloat(bestMatch.lon);

                    console.log('Auto-resolved to:', bestMatch.display_name);

                    // 2. Update form with resolved place
                    // We preserve the user's typed name or use the formal one?
                    // Usually safer to use the formal one so they know it was detected,
                    // BUT user might prefer their short name. Let's keep formal for clarity
                    // or just update lat/long hiddenly. Let's update birthPlace to formal to confirm detection.

                    const tz = await fetchTimezone(lat, long);

                    setPlayerForm(prev => ({
                        ...prev,
                        birthPlace: bestMatch.display_name, // Update to full name to show we found it
                        latitude: lat,
                        longitude: long,
                        timezone: tz !== null ? tz : prev.timezone
                    }));

                } else {
                    console.warn('No match found for manual entry');
                    // Optional: Warning toast
                }
            } catch (err) {
                console.error('Auto-resolve error:', err);
            } finally {
                setPlaceLoading(false);
            }
        }
    };

    const handleOpenGroupDialog = () => {
        fetchGroupsForDialog();
        setOpenGroupDialog(true);
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', mb: 2, alignItems: 'center', gap: 2 }}>
                <Typography variant="h5">Player Management</Typography>

                {/* Search & Actions */}
                <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 1, width: isMobile ? '100%' : 'auto' }}>
                     <TextField size="small" label="Search" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} fullWidth={isMobile} />
                     <TextField size="small" label="Place" value={filterPlace} onChange={(e) => setFilterPlace(e.target.value)} fullWidth={isMobile} />
                     <Button variant="contained" onClick={handleSearch} fullWidth={isMobile}>Search</Button>
                </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                 {selectedIds.length > 0 && <Button variant="contained" color="secondary" onClick={handleOpenGroupDialog} size="small">Add to Team ({selectedIds.length})</Button>}
                 <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddClick} size="small">Add</Button>
                 <Button variant="outlined" onClick={() => setOpenUpload(true)} size="small">Upload</Button>
            </Box>

            <TableContainer component={Paper} sx={{ maxHeight: '60vh' }}>
                <Table stickyHeader size={isMobile ? "small" : "medium"}>
                    <TableHead>
                        <TableRow>
                            <TableCell padding="checkbox">
                                <Typography variant="subtitle2">Chk</Typography>
                            </TableCell>
                            {!isMobile && <TableCell>ID</TableCell>}
                            <TableCell>Name</TableCell>
                            {!isMobile && <TableCell>Place</TableCell>}
                            <TableCell>Action</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {players.map((p) => (
                            <TableRow key={p._id} hover>
                                <TableCell padding="checkbox">
                                    <input type="checkbox" checked={selectedIds.includes(p.id)} onChange={() => handleSelect(p.id)} style={{ width: 18, height: 18, cursor: 'pointer' }} />
                                </TableCell>
                                {!isMobile && <TableCell>{p.id}</TableCell>}
                                <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Avatar
                                            src={(() => {
                                                if (!p.profile) return '';
                                                if (p.profile.startsWith('http')) return p.profile;
                                                return `${import.meta.env.VITE_BACKEND_URL}/uploads/${p.profile}`;
                                            })()}
                                            alt={p.name}
                                            sx={{ width: 40, height: 40, border: '2px solid rgba(255,255,255,0.2)' }}
                                        />
                                        <Box>
                                            <Typography variant="body2" fontWeight="bold" color="white">{p.name}</Typography>
                                            {isMobile && <Typography variant="caption" color="textSecondary">{p.birthPlace}</Typography>}
                                        </Box>
                                    </Box>
                                </TableCell>
                                {!isMobile && <TableCell>{p.birthPlace}</TableCell>}
                                <TableCell>
                                    <IconButton size="small" onClick={() => handleViewChart(p)} color="info" title="View Chart">
                                        <DescriptionIcon />
                                    </IconButton>
                                    <IconButton size="small" onClick={() => handleEditClick(p)} color="primary"><EditIcon /></IconButton>
                                    <IconButton size="small" onClick={() => handleDeleteClick(p.id)} color="error"><DeleteIcon /></IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            <TablePagination
                rowsPerPageOptions={[10, 25, 50]}
                component="div"
                count={totalPlayers}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={(e, newPage) => setPage(newPage)}
                onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
            />

            {/* Dialogs Responsive */}
            <Dialog open={openEdit} onClose={() => setOpenEdit(false)} fullWidth maxWidth="sm" fullScreen={isMobile}>
                <DialogTitle>{selectedPlayer ? 'Edit Player' : 'Add Player'}</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                        {selectedPlayer && <TextField label="ID" value={playerForm.id} disabled fullWidth size="small" />}

                        {/* Profile Picture Preview & Input */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                            <Avatar
                                src={
                                    profilePicFile
                                        ? URL.createObjectURL(profilePicFile)
                                        : (playerForm.profile ? `${import.meta.env.VITE_BACKEND_URL}${playerForm.profile}` : '')
                                }
                                sx={{ width: 70, height: 70, border: '2px solid rgba(255,255,255,0.2)' }}
                            />
                            <Box>
                                <Typography variant="caption" color="textSecondary" sx={{ mb: 0.5, display: 'block' }}>
                                    Profile Photo
                                </Typography>
                                <Button variant="outlined" size="small" component="label" sx={{ textTransform: 'none' }}>
                                    Choose File
                                    <input
                                        type="file"
                                        hidden
                                        accept="image/*"
                                        onChange={(e) => {
                                            if (e.target.files && e.target.files[0]) {
                                                setProfilePicFile(e.target.files[0]);
                                            }
                                        }}
                                    />
                                </Button>
                                {profilePicFile && <Typography variant="caption" sx={{ ml: 1, color: 'success.main' }}>Selected</Typography>}
                            </Box>
                        </Box>

                        <TextField label="Name" value={playerForm.name || ''} onChange={(e) => setPlayerForm({...playerForm, name: e.target.value})} fullWidth size="small" />
                        <Autocomplete
                            freeSolo
                            options={placeOptions}
                            getOptionLabel={(option) => typeof option === 'string' ? option : option.label}
                            value={playerForm.birthPlace || ''}
                            onChange={handlePlaceChange}
                            onInputChange={handlePlaceInputChange}
                            loading={placeLoading}
                            renderInput={(params) => (
                                <TextField
                                    {...params} label="Place (World)" size="small" fullWidth
                                    InputProps={{ ...params.InputProps, endAdornment: (<>{placeLoading && <CircularProgress size={20} />}{params.InputProps.endAdornment}</>) }}
                                />
                            )}
                        />

                        {/* Cricket Nations Timezone Helper */}
                        <Box sx={{ mb: 1 }}>
                            <Typography variant="caption" color="textSecondary">Quick Select (Cricket Nations)</Typography>
                            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                                {[
                                    { l: '🇮🇳 India', v: 5.5 },
                                    { l: '🇵🇰 Pak', v: 5 },
                                    { l: '🇱🇰 SL', v: 5.5 },
                                    { l: '🇧🇩 Ban', v: 6 },
                                    { l: '🇬🇧 UK', v: 0 },
                                    { l: '🇦🇺 Aus (Syd)', v: 10 },
                                    { l: '🇦🇺 Aus (Per)', v: 8 },
                                    { l: '🇿🇦 SA', v: 2 },
                                    { l: '🇳🇿 NZ', v: 12 },
                                    { l: '🏝️ WI (East)', v: -4 }
                                ].map((tz) => (
                                    <Chip
                                        key={tz.l}
                                        label={tz.l}
                                        size="small"
                                        onClick={() => setPlayerForm(prev => ({ ...prev, timezone: tz.v, manualTimezone: true }))}
                                        clickable
                                        variant="outlined"
                                        color={playerForm.timezone == tz.v ? "primary" : "default"}
                                    />
                                ))}
                            </Box>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <TextField
                                label="Timezone (Auto)"
                                value={playerForm.timezone || ''}
                                onChange={(e) => setPlayerForm({...playerForm, timezone: e.target.value})}
                                InputProps={{ readOnly: !playerForm.manualTimezone }}
                                fullWidth
                                size="small"
                                variant={playerForm.manualTimezone ? "outlined" : "filled"}
                                type="number"
                            />
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={!!playerForm.manualTimezone}
                                        onChange={(e) => setPlayerForm({...playerForm, manualTimezone: e.target.checked})}
                                        size="small"
                                    />
                                }
                                label={<Typography variant="caption">Manual</Typography>}
                            />
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <TextField
                                label="Lat"
                                value={playerForm.latitude || ''}
                                InputProps={{ readOnly: true }}
                                fullWidth
                                size="small"
                                variant="filled"
                            />
                            <TextField
                                label="Long"
                                value={playerForm.longitude || ''}
                                InputProps={{ readOnly: true }}
                                fullWidth
                                size="small"
                                variant="filled"
                            />
                        </Box>
                        <TextField
                            label="Date of Birth"
                            type="date"
                            value={playerForm.dob || ''}
                            onChange={(e) => setPlayerForm({...playerForm, dob: e.target.value})}
                            fullWidth
                            size="small"
                            InputLabelProps={{ shrink: true }}
                        />
                        <TextField
                            label="Birth Time"
                            type="time"
                            value={playerForm.birthTime || ''}
                            onChange={(e) => setPlayerForm({...playerForm, birthTime: e.target.value})}
                            fullWidth
                            size="small"
                            InputLabelProps={{ shrink: true }}
                        />


                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenEdit(false)}>Cancel</Button>
                    <Button onClick={handleSavePlayer} variant="contained">Save</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={openUpload} onClose={() => setOpenUpload(false)} fullWidth maxWidth="sm" fullScreen={isMobile}>
                <DialogTitle>Upload Players</DialogTitle>
                <DialogContent>
                    <Grid container direction="column" alignItems="center" spacing={2} sx={{ mt: 1 }}>
                        <Button variant="contained" component="label">
                            Select File (JSON/Excel)
                            <input type="file" hidden accept=".json,.xlsx,.xls,.csv" onChange={(e) => setSelectedFile(e.target.files[0])} />
                        </Button>
                        <Button variant="text" onClick={downloadSampleTemplate} sx={{ mt: 1 }} startIcon={<span style={{fontSize: '1.2rem'}}>📥</span>}>
                            Download Sample (CSV/Excel)
                        </Button>
                        {selectedFile && <Typography>{selectedFile.name}</Typography>}
                        {uploadStatus && <Typography color="primary">{uploadStatus}</Typography>}
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenUpload(false)}>Close</Button>
                    <Button onClick={handleUpload} variant="contained" disabled={!selectedFile}>Upload</Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar Alert */}
            <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }} variant="filled">
                    {snackbar.message}
                </Alert>
            </Snackbar>

             {/* Group Dialog (Minimal for now) */}
            <Dialog open={openGroupDialog} onClose={() => setOpenGroupDialog(false)} fullWidth maxWidth="xs">
                <DialogTitle>Add to Team</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                        {availableGroups.length > 0 ? (
                            availableGroups.map(g => (
                                <Button
                                    key={g._id}
                                    variant="outlined"
                                    onClick={async () => {
                                        try {
                                            await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/groups/add`, {
                                                groupName: g.name,
                                                playerIds: selectedIds
                                            }, { headers: { 'x-auth-token': token } });
                                            showSnackbar(`Added to ${g.name}`, 'success');
                                            setOpenGroupDialog(false);
                                            setSelectedIds([]);
                                        } catch (e) { console.error(e); }
                                    }}
                                >
                                    {g.name}
                                </Button>
                            ))
                        ) : (
                            <Typography>No teams found. Create one in Groups tab.</Typography>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions>
                     <Button onClick={() => setOpenGroupDialog(false)}>Cancel</Button>
                </DialogActions>
            </Dialog>

            {/* View Chart & Planetary Details Dialog */}
            <Dialog
                open={openChartDialog}
                onClose={() => setOpenChartDialog(false)}
                fullWidth
                maxWidth="md"
                fullScreen={isMobile}
            >
                <DialogTitle sx={{ backgroundColor: '#0F1535', color: '#fff' }}>
                    {selectedPlayerForChart?.name}'s Horoscope ({selectedPlayerForChart?.dob} {selectedPlayerForChart?.birthTime ? `| ${selectedPlayerForChart.birthTime}` : ''})
                </DialogTitle>
                <DialogContent sx={{ backgroundColor: '#0F1535', color: '#fff' }}>
                    {selectedPlayerForChart && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, mt: 2 }}>
                            {/* Rasi Chart */}
                            <Box sx={{ p: 1, backgroundColor: '#fff', borderRadius: 2 }}>
                                {selectedPlayerForChart.birthChart ? (
                                     <RasiChart data={selectedPlayerForChart.birthChart} style={{ width: '100%' }} />
                                ) : (
                                    <Typography color="error">Birth Chart Data Not Available</Typography>
                                )}
                            </Box>

                            {/* Planetary Table */}
                            <Box sx={{ width: '100%', mt: 2 }}>
                                <Typography variant="h6" gutterBottom sx={{ color: '#fff' }}>Planetary Positions</Typography>
                                <PlanetaryTable planets={selectedPlayerForChart.birthChart?.formattedPlanets || []} />
                            </Box>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ backgroundColor: '#0F1535' }}>
                    <Button onClick={() => setOpenChartDialog(false)} sx={{ color: '#fff' }}>Close</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};
const GroupsManager = () => {
    const { token } = useContext(AuthContext);
    const [groups, setGroups] = useState([]);

    // Create State
    const [openCreate, setOpenCreate] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');

    // State for managing players in a group
    const [openManage, setOpenManage] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState(null);

    // Snackbar State
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const showSnackbar = (message, severity = 'success') => { setSnackbar({ open: true, message, severity }); };
    const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });

    // Confirmation Dialog State
    const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', action: null });
    const convertConfirmAction = (title, message, action) => {
         setConfirmDialog({ open: true, title, message, action: () => action() });
    };
    const handleConfirmClose = () => setConfirmDialog({ ...confirmDialog, open: false });
    const handleConfirmExecute = async () => {
        if (confirmDialog.action) await confirmDialog.action();
        handleConfirmClose();
    };

    const fetchGroups = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/groups`, {
                headers: { 'x-auth-token': token }
            });
            setGroups(res.data);

            // Update selected group if open (to reflect removals)
            if (selectedGroup) {
                const updated = res.data.find(g => g._id === selectedGroup._id);
                if (updated) setSelectedGroup(updated);
            }
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchGroups();
    }, []);

    const handleCreateGroup = async () => {
        if (!newGroupName) return;
        try {
            await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/groups/create`,
                { name: newGroupName },
                { headers: { 'x-auth-token': token } }
            );
            setNewGroupName('');
            setOpenCreate(false);
            fetchGroups();
            showSnackbar('Group created successfully', 'success');
        } catch (err) {
            showSnackbar(err.response?.data?.msg || 'Failed to create group', 'error');
        }
    };

    const handleDeleteGroup = async (id) => {
        // Confirm handled by UI Dialog
        try {
            await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/api/groups/${id}`, {
                 headers: { 'x-auth-token': token }
            });
            fetchGroups();
        } catch (err) {
            console.error(err);
        }
    };

    const handleClearGroup = async (groupName) => {
        // Confirm handled by UI Dialog
        try {
            await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/groups/clear`, { groupName }, {
                 headers: { 'x-auth-token': token }
            });
            fetchGroups();
            showSnackbar('Group cleared', 'success');
        } catch (err) {
            console.error(err);
            showSnackbar('Failed to clear group', 'error');
        }
    };

    const handleRemovePlayer = async (groupName, playerId) => {
         // Confirm handled by UI Dialog
         try {
             await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/groups/remove`, {
                 groupName,
                 playerId
             }, { headers: { 'x-auth-token': token } });
             fetchGroups();
             // selectedGroup will update via fetchGroups logic or we can locally update for speed,
             // but fetchGroups is safer for sync.
         } catch (err) {
             console.error(err);
             showSnackbar('Failed to remove player', 'error');
         }
    };

    const openManageDialog = (group) => {
        setSelectedGroup(group);
        setOpenManage(true);
    };

    // Edit Player State (Duplicated from PlayersManager for isolation)
    const [openEdit, setOpenEdit] = useState(false);
    const [editingPlayer, setEditingPlayer] = useState(null);
    const [playerConfig, setPlayerConfig] = useState(null); // Reuse if possible or mock

    const handleEditClick = (player) => {
        setEditingPlayer(player);
        setOpenEdit(true);
    };

    const handleSaveEdit = async () => {
        if (!editingPlayer) return;
        try {
            // Basic update - for full update we need the full form logic or a shared component
             await axios.put(`${import.meta.env.VITE_BACKEND_URL}/api/players/${editingPlayer._id}`, editingPlayer, {
                headers: { 'x-auth-token': token }
            });
            setOpenEdit(false);
            fetchGroups(); // Refresh groups to show updated details
            showSnackbar('Player updated successfully', 'success');
        } catch (err) {
            console.error(err);
            showSnackbar('Failed to update player', 'error');
        }
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h5" gutterBottom>Group Management</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenCreate(true)}>Create Group</Button>
            </Box>

            <Grid container spacing={3}>
                {groups.map(g => (
                    <Grid item xs={12} sm={6} md={4} key={g._id}>
                        <Paper sx={{ p: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                <Typography variant="h6">{g.name}</Typography>
                                <Typography variant="caption" color="text.secondary">{g.players.length} Players</Typography>
                            </Box>
                            <Divider sx={{ mb: 2 }} />
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                <Button variant="contained" size="small" onClick={() => openManageDialog(g)}>
                                    Manage Players
                                </Button>
                                <Button variant="outlined" color="warning" size="small" onClick={() => convertConfirmAction('Clear Group', `Clear all players from ${g.name}?`, () => handleClearGroup(g.name))}>
                                    Clear
                                </Button>
                                <Button variant="outlined" color="error" size="small" onClick={() => convertConfirmAction('Delete Group', 'Are you sure you want to delete this group?', () => handleDeleteGroup(g._id))}>
                                    Delete
                                </Button>
                            </Box>
                        </Paper>
                    </Grid>
                ))}
                {groups.length === 0 && (
                    <Grid item xs={12}>
                        <Typography>No active groups found. Create a new group.</Typography>
                    </Grid>
                )}
            </Grid>

            {/* Create Group Dialog */}
            <Dialog open={openCreate} onClose={() => setOpenCreate(false)}>
                <DialogTitle>Create New Group</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Group Name"
                        fullWidth
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenCreate(false)}>Cancel</Button>
                    <Button onClick={handleCreateGroup} variant="contained">Create</Button>
                </DialogActions>
            </Dialog>

            {/* Manage Players Dialog */}
            <Dialog open={openManage} onClose={() => setOpenManage(false)} fullWidth maxWidth="md">
                <DialogTitle>Manage Group: {selectedGroup?.name}</DialogTitle>
                <DialogContent dividers>
                    {selectedGroup && selectedGroup.players.length > 0 ? (
                        <TableContainer component={Paper} elevation={0} variant="outlined">
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Name</TableCell>
                                        <TableCell>Place</TableCell>
                                        <TableCell>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {selectedGroup.players.map((player) => (
                                        <TableRow key={player._id}>
                                            <TableCell>
                                                <Typography variant="subtitle2">{player.name}</Typography>
                                            </TableCell>
                                            <TableCell>{player.birthPlace || '-'}</TableCell>
                                            <TableCell>
                                                <IconButton size="small" color="primary" onClick={() => handleEditClick(player)}>
                                                    <EditIcon />
                                                </IconButton>
                                                <IconButton size="small" color="error" onClick={() => convertConfirmAction('Remove Player', 'Remove this player from the group?', () => handleRemovePlayer(selectedGroup.name, player.id))}>
                                                    <DeleteIcon />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    ) : (
                        <Typography sx={{ p: 2, textAlign: 'center' }}>No players in this group.</Typography>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenManage(false)}>Close</Button>
                </DialogActions>
            </Dialog>

             {/* Edit Player Dialog (Simplified for Group Actions) */}
            <Dialog open={openEdit} onClose={() => setOpenEdit(false)} fullWidth maxWidth="sm">
                <DialogTitle>Edit Player Details</DialogTitle>
                <DialogContent>
                    {editingPlayer && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                            <TextField
                                label="Name"
                                value={editingPlayer.name}
                                onChange={(e) => setEditingPlayer({ ...editingPlayer, name: e.target.value })}
                                fullWidth
                            />
                            <TextField
                                label="Birth Place"
                                value={editingPlayer.birthPlace}
                                onChange={(e) => setEditingPlayer({ ...editingPlayer, birthPlace: e.target.value })}
                                fullWidth
                            />
                            {/* Add Date/Time fields if needed, kept simple for now as requested */}
                             <TextField
                                label="Date of Birth"
                                type="date"
                                value={editingPlayer.dob ? editingPlayer.dob.split('T')[0] : ''}
                                onChange={(e) => setEditingPlayer({ ...editingPlayer, dob: e.target.value })}
                                fullWidth
                                InputLabelProps={{ shrink: true }}
                            />
                             <TextField
                                label="Birth Time"
                                type="time"
                                value={editingPlayer.birthTime || ''}
                                onChange={(e) => setEditingPlayer({ ...editingPlayer, birthTime: e.target.value })}
                                fullWidth
                                InputLabelProps={{ shrink: true }}
                            />
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenEdit(false)}>Cancel</Button>
                    <Button onClick={handleSaveEdit} variant="contained" color="primary">Save Changes</Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }} variant="filled">
                    {snackbar.message}
                </Alert>
            </Snackbar>

            {/* Confirmation Dialog */}
            <Dialog open={confirmDialog.open} onClose={handleConfirmClose}>
                <DialogTitle>{confirmDialog.title}</DialogTitle>
                <DialogContent>
                    <Typography>{confirmDialog.message}</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleConfirmClose}>Cancel</Button>
                    <Button onClick={handleConfirmExecute} color="error" variant="contained">Confirm</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

const drawerWidth = 240;

const AdminDashboard = () => {
    const { logout } = useContext(AuthContext);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [currentView, setCurrentView] = useState('dashboard');

    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
        { id: 'users', label: 'Users', icon: <PeopleIcon /> },
        { id: 'players', label: 'Players', icon: <SportsCricketIcon /> },
        { id: 'groups', label: 'Groups', icon: <GroupIcon /> },
        { id: 'clientDashboard', label: 'Client Dashboard', icon: <DashboardIcon /> },
        { id: 'rules', label: 'Rules', icon: <GavelIcon /> },
    ];

    const drawer = (
        <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3, gap: 1 }}>
                <DashboardIcon sx={{ color: 'white' }} />
                <Typography variant="h6" fontWeight="bold" color="white" sx={{ letterSpacing: '2px' }}>
                    ASTRO ADMIN
                </Typography>
            </Box>
            <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', mb: 2 }} />
            <List>
                {menuItems.map((item) => {
                    const active = currentView === item.id;
                    return (
                        <ListItem key={item.id} disablePadding sx={{ mb: 1 }}>
                            <ListItemButton
                                onClick={() => { setCurrentView(item.id); setMobileOpen(false); }}
                                sx={{
                                    borderRadius: '15px',
                                    background: active ? 'linear-gradient(135deg, #0075FF 0%, #2CD9FF 100%)' : 'transparent',
                                    boxShadow: active ? '0 4px 6px rgba(0,0,0,0.2)' : 'none',
                                    transition: 'all 0.3s ease',
                                    px: 2,
                                    '&:hover': {
                                        bgcolor: active ? 'rgba(0,117,255,0.8)' : 'rgba(255,255,255,0.05)',
                                        transform: 'translateX(5px)'
                                    }
                                }}
                            >
                                <ListItemIcon sx={{
                                    minWidth: 40,
                                    color: active ? 'white' : '#2CD9FF', // Cyan Icon for inactive
                                    bgcolor: active ? 'rgba(255,255,255,0.2)' : 'rgba(26,31,63,0.5)', // Darker box for inactive
                                    borderRadius: '10px',
                                    width: 32, height: 32,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    mr: 1.5
                                }}>
                                    {item.icon}
                                </ListItemIcon>
                                <ListItemText
                                    primary={item.label}
                                    primaryTypographyProps={{
                                        fontSize: '0.875rem',
                                        fontWeight: active ? 'bold' : '500',
                                        color: active ? 'white' : '#A0AEC0'
                                    }}
                                />
                            </ListItemButton>
                        </ListItem>
                    );
                })}
            </List>
            <Box sx={{ mt: 'auto' }}>
                 <List>
                    <ListItem disablePadding>
                        <ListItemButton onClick={logout} sx={{ borderRadius: '15px', '&:hover': { bgcolor: 'rgba(255,0,0,0.1)' } }}>
                            <ListItemIcon sx={{
                                     minWidth: 40, color: '#F56565',
                                     bgcolor: 'rgba(245, 101, 101, 0.1)', borderRadius: '10px',
                                     width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', mr: 1.5
                                 }}>
                                <LogoutIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText primary="Logout" primaryTypographyProps={{ color: '#F56565', fontWeight: 'bold', fontSize: '0.875rem' }} />
                        </ListItemButton>
                    </ListItem>
                </List>
            </Box>
        </Box>
    );

    const renderContent = () => {
        switch (currentView) {
            case 'dashboard': return <DashboardHome />;
            case 'users': return <UsersManager />;
            case 'players': return <PlayersManager />;
            case 'groups': return <GroupsManager />;
            case 'clientDashboard': return <UserDashboard hideHeader={true} />;
            case 'rules': return <RulesView />;
            default: return <DashboardHome />;
        }
    };

    return (
        <ThemeProvider theme={visionTheme}>
            <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#0F1535', color: 'white', overflow: 'hidden' }}>
                <CssBaseline />
                {/* Background Decor */}
                <Box sx={{
                    position: 'absolute',
                    top: 0, left: 0, width: '100%', height: '300px',
                    background: 'linear-gradient(180deg, rgba(0, 117, 255, 0.2) 0%, rgba(15, 21, 53, 0) 100%)',
                    zIndex: 0, pointerEvents: 'none'
                }} />

                <AppBar
                    position="fixed"
                    sx={{
                        width: { sm: `calc(100% - ${drawerWidth}px)` },
                        ml: { sm: `${drawerWidth}px` },
                        bgcolor: 'transparent',
                        boxShadow: 'none',
                        backdropFilter: 'blur(10px)',
                        borderBottom: '1px solid rgba(255,255,255,0.05)'
                    }}
                >
                    <Toolbar>
                        <IconButton
                            color="inherit"
                            aria-label="open drawer"
                            edge="start"
                            onClick={handleDrawerToggle}
                            sx={{ mr: 2, display: { sm: 'none' } }}
                        >
                            <MenuIcon />
                        </IconButton>
                        <Typography variant="h6" noWrap component="div" sx={{ color: 'white', flexGrow: 1 }}>
                            {menuItems.find(i => i.id === currentView)?.label}
                        </Typography>
                        {currentView === 'clientDashboard' && (
                            <Typography variant="h6" sx={{ color: '#2CD9FF', fontWeight: 'bold' }}>
                                {currentTime.toLocaleTimeString()}
                            </Typography>
                        )}
                    </Toolbar>
                </AppBar>

                <Box
                    component="nav"
                    sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 }, zIndex: 1200 }}
                    aria-label="mailbox folders"
                >
                    <Drawer
                        variant="temporary"
                        open={mobileOpen}
                        onClose={handleDrawerToggle}
                        ModalProps={{ keepMounted: true }}
                        sx={{
                            display: { xs: 'block', sm: 'none' },
                            '& .MuiDrawer-paper': {
                                boxSizing: 'border-box',
                                width: drawerWidth,
                                bgcolor: '#0F1535',
                                color: 'white',
                                borderRight: '1px solid rgba(255,255,255,0.1)'
                            },
                        }}
                    >
                        {drawer}
                    </Drawer>
                    <Drawer
                        variant="permanent"
                        sx={{
                            display: { xs: 'none', sm: 'block' },
                            '& .MuiDrawer-paper': {
                                boxSizing: 'border-box',
                                width: drawerWidth,
                                bgcolor: 'transparent', // Glass sidebar
                                borderRight: 'none',
                                p: 2
                            },
                        }}
                        open
                    >
                        {/* Wrapper for Glass effect on sidebar */}
                        <Box sx={{
                            height: 'calc(100vh - 32px)',
                            background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.05) 100%)',
                            backdropFilter: 'blur(20px)',
                            borderRadius: '20px',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            overflow: 'hidden'
                         }}>
                            {drawer}
                        </Box>
                    </Drawer>
                </Box>

                <Box
                    component="main"
                    sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` }, position: 'relative', zIndex: 1 }}
                >
                    <Toolbar />
                    {renderContent()}
                </Box>
            </Box>
        </ThemeProvider>
    );
};

export default AdminDashboard;
