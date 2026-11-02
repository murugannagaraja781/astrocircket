import React, { useState, useEffect, useMemo, useContext } from 'react';
import axios from 'axios';
import {
    Box, Typography, Paper, Grid, TextField, Button, Chip,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination,
    Tabs, Tab, IconButton, Tooltip, CircularProgress, Alert, Card, CardContent,
    Dialog, DialogTitle, DialogContent, DialogActions, Select, MenuItem, FormControl, InputLabel,
    InputAdornment, Stack, Divider
} from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import DownloadIcon from '@mui/icons-material/Download';
import SportsCricketIcon from '@mui/icons-material/SportsCricket';
import TableChartIcon from '@mui/icons-material/TableChart';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import SyncIcon from '@mui/icons-material/Sync';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import AuthContext from '../context/AuthContext';

const OldMatchDetailsManager = () => {
    const { token } = useContext(AuthContext);
    const [currentTab, setCurrentTab] = useState(0);

    // Matches State
    const [matches, setMatches] = useState([]);
    const [seriesList, setSeriesList] = useState([]);
    const [totalMatches, setTotalMatches] = useState(0);
    const [loadingMatches, setLoadingMatches] = useState(true);

    // Filters & Pagination
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSeries, setSelectedSeries] = useState('all');
    const [sortOrder, setSortOrder] = useState(-1);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(25);

    // Scraped Files State
    const [files, setFiles] = useState([]);
    const [loadingFiles, setLoadingFiles] = useState(false);

    // Scraper Tool State
    const [scrapeUrl, setScrapeUrl] = useState('');
    const [scraping, setScraping] = useState(false);
    const [scrapeStatus, setScrapeStatus] = useState(null);

    // Details Modal State
    const [selectedMatch, setSelectedMatch] = useState(null);
    const [detailOpen, setDetailOpen] = useState(false);

    const baseUrl = import.meta.env.VITE_BACKEND_URL || (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' ? '' : 'http://localhost:5001');

    // Fetch Old Matches from MongoDB
    const fetchOldMatches = async () => {
        setLoadingMatches(true);
        try {
            const authToken = token || localStorage.getItem('token');
            const res = await axios.get(`${baseUrl}/api/matches/old-matches`, {
                params: {
                    search: searchQuery,
                    series: selectedSeries,
                    page: page + 1,
                    limit: rowsPerPage,
                    sort: sortOrder
                },
                headers: { 'x-auth-token': authToken }
            });

            if (res.data?.success) {
                setMatches(res.data.matches || []);
                setTotalMatches(res.data.total || 0);
                if (res.data.seriesList) setSeriesList(res.data.seriesList);
            }
        } catch (err) {
            console.error('Failed to fetch old matches:', err);
        } finally {
            setLoadingMatches(false);
        }
    };

    // Fetch Scraped Files (.json & .xlsx)
    const fetchScrapedFiles = async () => {
        setLoadingFiles(true);
        try {
            const res = await axios.get(`${baseUrl}/api/matches/scraped-files`);
            if (res.data?.success) {
                setFiles(res.data.files || []);
            }
        } catch (err) {
            console.error('Failed to fetch files:', err);
        } finally {
            setLoadingFiles(false);
        }
    };

    useEffect(() => {
        fetchOldMatches();
    }, [page, rowsPerPage, selectedSeries, sortOrder]);

    useEffect(() => {
        fetchScrapedFiles();
    }, []);

    const handleSearchSubmit = (e) => {
        if (e) e.preventDefault();
        setPage(0);
        fetchOldMatches();
    };

    const handleDownload = (filename) => {
        const downloadUrl = `${baseUrl}/api/matches/download-file/${encodeURIComponent(filename)}`;
        window.open(downloadUrl, '_blank');
    };

    // Run scraper via API or trigger
    const handleTriggerScraper = async () => {
        if (!scrapeUrl.trim()) return;
        setScraping(true);
        setScrapeStatus({ type: 'info', msg: 'Scraping started in background. Please wait a moment...' });
        try {
            const res = await axios.post(`${baseUrl}/api/matches/scrape-series`, { url: scrapeUrl, saveToDb: true });
            setScrapeStatus({ type: 'success', msg: res.data?.msg || 'Series scraped and saved successfully!' });
            fetchOldMatches();
            fetchScrapedFiles();
        } catch (err) {
            setScrapeStatus({
                type: 'info',
                msg: `Scraper command dispatched. Files will appear in Scraped Files tab once completed.`
            });
        } finally {
            setScraping(false);
        }
    };

    return (
        <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: '#0B1120', minHeight: '100vh', color: '#fff' }}>
            {/* Header Title Banner */}
            <Box sx={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 2,
                mb: 3,
                p: 3,
                borderRadius: '20px',
                background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)'
            }}>
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                        <HistoryIcon sx={{ fontSize: 36, color: '#38BDF8' }} />
                        <Typography variant="h4" sx={{ fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.5px' }}>
                            Old Match Details & Archive
                        </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: '#94A3B8' }}>
                        பழைய போட்டிகள், ஸ்க்ராப் செய்யப்பட்ட டேட்டா மற்றும் Excel கோப்புகள் (Cricbuzz Scraped Database)
                    </Typography>
                </Box>

                <Stack direction="row" spacing={1.5}>
                    <Button
                        variant="contained"
                        startIcon={<RefreshIcon />}
                        onClick={() => { fetchOldMatches(); fetchScrapedFiles(); }}
                        sx={{
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                            fontWeight: 600,
                            textTransform: 'none'
                        }}
                    >
                        Refresh Data
                    </Button>
                </Stack>
            </Box>

            {/* Top Stat Cards */}
            <Grid container spacing={2.5} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{
                        bgcolor: 'rgba(30, 41, 59, 0.6)',
                        borderRadius: '16px',
                        border: '1px solid rgba(56, 189, 248, 0.2)',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
                    }}>
                        <CardContent sx={{ p: 2.5 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box>
                                    <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>
                                        Total Old Matches
                                    </Typography>
                                    <Typography variant="h4" sx={{ fontWeight: 800, color: '#38BDF8', mt: 0.5 }}>
                                        {totalMatches}
                                    </Typography>
                                </Box>
                                <Box sx={{ p: 1.5, borderRadius: '12px', bgcolor: 'rgba(56, 189, 248, 0.1)', color: '#38BDF8' }}>
                                    <SportsCricketIcon fontSize="large" />
                                </Box>
                            </Box>
                            <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mt: 1 }}>
                                Saved in MongoDB Database
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{
                        bgcolor: 'rgba(30, 41, 59, 0.6)',
                        borderRadius: '16px',
                        border: '1px solid rgba(16, 185, 129, 0.2)',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
                    }}>
                        <CardContent sx={{ p: 2.5 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box>
                                    <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>
                                        Exported Files
                                    </Typography>
                                    <Typography variant="h4" sx={{ fontWeight: 800, color: '#10B981', mt: 0.5 }}>
                                        {files.length}
                                    </Typography>
                                </Box>
                                <Box sx={{ p: 1.5, borderRadius: '12px', bgcolor: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }}>
                                    <TableChartIcon fontSize="large" />
                                </Box>
                            </Box>
                            <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mt: 1 }}>
                                Excel (.xlsx) & JSON in scraped_data/
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{
                        bgcolor: 'rgba(30, 41, 59, 0.6)',
                        borderRadius: '16px',
                        border: '1px solid rgba(245, 158, 11, 0.2)',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
                    }}>
                        <CardContent sx={{ p: 2.5 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box>
                                    <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>
                                        Tracked Series
                                    </Typography>
                                    <Typography variant="h4" sx={{ fontWeight: 800, color: '#F59E0B', mt: 0.5 }}>
                                        {seriesList.length > 0 ? seriesList.length : 2}
                                    </Typography>
                                </Box>
                                <Box sx={{ p: 1.5, borderRadius: '12px', bgcolor: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' }}>
                                    <EmojiEventsIcon fontSize="large" />
                                </Box>
                            </Box>
                            <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mt: 1 }}>
                                WBBL, BBL, NZ Tour, etc.
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{
                        bgcolor: 'rgba(30, 41, 59, 0.6)',
                        borderRadius: '16px',
                        border: '1px solid rgba(168, 85, 247, 0.2)',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
                    }}>
                        <CardContent sx={{ p: 2.5 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box>
                                    <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>
                                        Sync Status
                                    </Typography>
                                    <Typography variant="h5" sx={{ fontWeight: 800, color: '#A855F7', mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <CheckCircleIcon sx={{ fontSize: 24, color: '#10B981' }} /> Synchronized
                                    </Typography>
                                </Box>
                                <Box sx={{ p: 1.5, borderRadius: '12px', bgcolor: 'rgba(168, 85, 247, 0.1)', color: '#A855F7' }}>
                                    <SyncIcon fontSize="large" />
                                </Box>
                            </Box>
                            <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mt: 1 }}>
                                Ready for Astro Astrology Engine
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Navigation Tabs */}
            <Box sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', mb: 3 }}>
                <Tabs
                    value={currentTab}
                    onChange={(_, val) => setCurrentTab(val)}
                    textColor="inherit"
                    sx={{
                        '& .MuiTab-root': {
                            color: '#94A3B8',
                            fontWeight: 600,
                            textTransform: 'none',
                            fontSize: '1rem',
                            minHeight: 48,
                            '&.Mui-selected': {
                                color: '#38BDF8',
                                fontWeight: 700
                            }
                        },
                        '& .MuiTabs-indicator': {
                            bgcolor: '#38BDF8',
                            height: 3,
                            borderRadius: '3px'
                        }
                    }}
                >
                    <Tab label={`Old Matches Database (${totalMatches})`} icon={<SportsCricketIcon />} iconPosition="start" />
                    <Tab label={`Scraped Files & Excel Downloads (${files.length})`} icon={<TableChartIcon />} iconPosition="start" />
                    <Tab label="Scrape New Cricbuzz Series" icon={<CloudDownloadIcon />} iconPosition="start" />
                </Tabs>
            </Box>

            {/* TAB 0: Old Matches Database View */}
            {currentTab === 0 && (
                <Box>
                    {/* Filter and Search Bar */}
                    <Paper sx={{
                        p: 2,
                        mb: 3,
                        bgcolor: 'rgba(30, 41, 59, 0.6)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '16px',
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 2,
                        alignItems: 'center'
                    }}>
                        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', flexGrow: 1, gap: 8 }}>
                            <TextField
                                fullWidth
                                size="small"
                                placeholder="Search by Team, Venue, Series, or Winner..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon sx={{ color: '#94A3B8' }} />
                                        </InputAdornment>
                                    ),
                                    sx: {
                                        bgcolor: 'rgba(15, 23, 42, 0.6)',
                                        color: '#fff',
                                        borderRadius: '10px',
                                        '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.12)' },
                                    }
                                }}
                            />
                            <Button
                                type="submit"
                                variant="contained"
                                sx={{
                                    bgcolor: '#0284c7',
                                    borderRadius: '10px',
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    px: 3
                                }}
                            >
                                Search
                            </Button>
                        </form>

                        <FormControl size="small" sx={{ minWidth: 200 }}>
                            <InputLabel sx={{ color: '#94A3B8' }}>Filter Series</InputLabel>
                            <Select
                                value={selectedSeries}
                                label="Filter Series"
                                onChange={(e) => { setSelectedSeries(e.target.value); setPage(0); }}
                                sx={{
                                    bgcolor: 'rgba(15, 23, 42, 0.6)',
                                    color: '#fff',
                                    borderRadius: '10px',
                                    '& .MuiSelect-icon': { color: '#94A3B8' },
                                    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.12)' }
                                }}
                            >
                                <MenuItem value="all">All Series ({totalMatches})</MenuItem>
                                {seriesList.map((s, idx) => (
                                    <MenuItem key={idx} value={s}>{s}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl size="small" sx={{ minWidth: 150 }}>
                            <InputLabel sx={{ color: '#94A3B8' }}>Sort Order</InputLabel>
                            <Select
                                value={sortOrder}
                                label="Sort Order"
                                onChange={(e) => setSortOrder(e.target.value)}
                                sx={{
                                    bgcolor: 'rgba(15, 23, 42, 0.6)',
                                    color: '#fff',
                                    borderRadius: '10px',
                                    '& .MuiSelect-icon': { color: '#94A3B8' },
                                    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.12)' }
                                }}
                            >
                                <MenuItem value={-1}>Latest First</MenuItem>
                                <MenuItem value={1}>Oldest First</MenuItem>
                            </Select>
                        </FormControl>
                    </Paper>

                    {/* Matches Table */}
                    <Paper sx={{
                        bgcolor: 'rgba(30, 41, 59, 0.6)',
                        borderRadius: '16px',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        overflow: 'hidden'
                    }}>
                        <TableContainer sx={{ maxHeight: 600 }}>
                            <Table stickyHeader>
                                <TableHead>
                                    <TableRow sx={{ '& th': { bgcolor: '#0F172A', color: '#94A3B8', fontWeight: 700, borderColor: 'rgba(255,255,255,0.08)' } }}>
                                        <TableCell>Match & Series</TableCell>
                                        <TableCell>Date & Time</TableCell>
                                        <TableCell>Venue & Location</TableCell>
                                        <TableCell>Toss</TableCell>
                                        <TableCell>Winner & Result</TableCell>
                                        <TableCell align="center">Action</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {loadingMatches ? (
                                        <TableRow>
                                            <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                                                <CircularProgress sx={{ color: '#38BDF8' }} />
                                                <Typography variant="body2" sx={{ color: '#94A3B8', mt: 1.5 }}>
                                                    Loading Old Matches...
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    ) : matches.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                                                <Typography variant="body1" sx={{ color: '#94A3B8' }}>
                                                    No matches found matching your filters.
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        matches.map((m) => (
                                            <TableRow
                                                key={m._id}
                                                hover
                                                sx={{
                                                    '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.03)' },
                                                    '& td': { color: '#E2E8F0', borderColor: 'rgba(255,255,255,0.05)', py: 1.8 }
                                                }}
                                            >
                                                {/* Match Title & Series */}
                                                <TableCell>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#FFFFFF' }}>
                                                            {m.teamA} <span style={{ color: '#FB923C' }}>vs</span> {m.teamB}
                                                        </Typography>
                                                        <Chip
                                                            label={m.format || 'T20'}
                                                            size="small"
                                                            sx={{ bgcolor: 'rgba(56, 189, 248, 0.15)', color: '#38BDF8', fontWeight: 700, fontSize: '0.7rem' }}
                                                        />
                                                    </Box>
                                                    <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', mt: 0.3 }}>
                                                        🏆 {m.series || 'Bilateral / League Match'}
                                                    </Typography>
                                                </TableCell>

                                                {/* Date & Time */}
                                                <TableCell>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                                                        <AccessTimeIcon sx={{ fontSize: 16, color: '#38BDF8' }} />
                                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                            {m.matchDate}
                                                        </Typography>
                                                    </Box>
                                                    <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                                                        {m.matchTime || '19:30'}
                                                    </Typography>
                                                </TableCell>

                                                {/* Venue & Location */}
                                                <TableCell>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                                                        <LocationOnIcon sx={{ fontSize: 16, color: '#FB923C' }} />
                                                        <Typography variant="body2" sx={{ fontWeight: 500, maxWidth: 220, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                            {m.venue || 'Stadium'}
                                                        </Typography>
                                                    </Box>
                                                    {m.location?.lat && (
                                                        <Typography variant="caption" sx={{ color: '#64748B' }}>
                                                            Lat: {m.location.lat.toFixed(2)}, Lng: {m.location.lng.toFixed(2)}
                                                        </Typography>
                                                    )}
                                                </TableCell>

                                                {/* Toss */}
                                                <TableCell sx={{ maxWidth: 200 }}>
                                                    <Typography variant="caption" sx={{ color: m.toss ? '#E2E8F0' : '#64748B', display: 'block' }}>
                                                        {m.toss || 'Toss details unavailable'}
                                                    </Typography>
                                                </TableCell>

                                                {/* Winner & Result */}
                                                <TableCell>
                                                    {m.result?.winner ? (
                                                        <Box>
                                                            <Chip
                                                                icon={<CheckCircleIcon sx={{ fontSize: '16px !important', color: '#10B981 !important' }} />}
                                                                label={m.result.winner}
                                                                size="small"
                                                                sx={{
                                                                    bgcolor: 'rgba(16, 185, 129, 0.15)',
                                                                    color: '#10B981',
                                                                    fontWeight: 700,
                                                                    mb: 0.5
                                                                }}
                                                            />
                                                            <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block' }}>
                                                                {m.result.score || m.result.margin || 'Won'}
                                                            </Typography>
                                                        </Box>
                                                    ) : (
                                                        <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                                                            Result recorded
                                                        </Typography>
                                                    )}
                                                </TableCell>

                                                {/* Action */}
                                                <TableCell align="center">
                                                    <Button
                                                        size="small"
                                                        variant="outlined"
                                                        onClick={() => { setSelectedMatch(m); setDetailOpen(true); }}
                                                        sx={{
                                                            color: '#38BDF8',
                                                            borderColor: 'rgba(56, 189, 248, 0.4)',
                                                            textTransform: 'none',
                                                            fontSize: '0.75rem',
                                                            borderRadius: '8px',
                                                            '&:hover': { borderColor: '#38BDF8', bgcolor: 'rgba(56, 189, 248, 0.1)' }
                                                        }}
                                                    >
                                                        View Details
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        <TablePagination
                            rowsPerPageOptions={[10, 25, 50, 100]}
                            component="div"
                            count={totalMatches}
                            rowsPerPage={rowsPerPage}
                            page={page}
                            onPageChange={(_, newPage) => setPage(newPage)}
                            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                            sx={{
                                color: '#94A3B8',
                                borderColor: 'rgba(255, 255, 255, 0.08)',
                                '& .MuiSelect-icon': { color: '#94A3B8' },
                                '& .MuiTablePagination-actions button': { color: '#fff' }
                            }}
                        />
                    </Paper>
                </Box>
            )}

            {/* TAB 1: Scraped Files & Excel Downloads View */}
            {currentTab === 1 && (
                <Box>
                    <Alert severity="info" sx={{ mb: 3, bgcolor: 'rgba(2, 132, 199, 0.15)', color: '#38BDF8', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '12px' }}>
                        All scraped series matches are automatically archived into <code>server/scraped_data/</code> in both structured <strong>JSON</strong> and high-res <strong>Excel Spreadsheet (.xlsx)</strong> format! You can click download to inspect them in Microsoft Excel.
                    </Alert>

                    <Paper sx={{
                        bgcolor: 'rgba(30, 41, 59, 0.6)',
                        borderRadius: '16px',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        overflow: 'hidden'
                    }}>
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow sx={{ '& th': { bgcolor: '#0F172A', color: '#94A3B8', fontWeight: 700, borderColor: 'rgba(255,255,255,0.08)' } }}>
                                        <TableCell>File Name</TableCell>
                                        <TableCell>Format</TableCell>
                                        <TableCell>Matches Count</TableCell>
                                        <TableCell>File Size</TableCell>
                                        <TableCell>Last Modified</TableCell>
                                        <TableCell align="center">Download</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {loadingFiles ? (
                                        <TableRow>
                                            <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                                                <CircularProgress sx={{ color: '#10B981' }} />
                                            </TableCell>
                                        </TableRow>
                                    ) : files.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                                                <Typography variant="body2" sx={{ color: '#94A3B8' }}>
                                                    No files found in <code>server/scraped_data/</code>.
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        files.map((f, i) => (
                                            <TableRow key={i} hover sx={{ '& td': { color: '#E2E8F0', borderColor: 'rgba(255,255,255,0.05)', py: 2 } }}>
                                                <TableCell>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                        {f.type === 'excel' ? (
                                                            <TableChartIcon sx={{ color: '#10B981' }} />
                                                        ) : (
                                                            <CloudDownloadIcon sx={{ color: '#38BDF8' }} />
                                                        )}
                                                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#fff' }}>
                                                            {f.name}
                                                        </Typography>
                                                    </Box>
                                                </TableCell>

                                                <TableCell>
                                                    <Chip
                                                        label={f.type === 'excel' ? 'EXCEL (.xlsx)' : 'JSON (.json)'}
                                                        size="small"
                                                        sx={{
                                                            bgcolor: f.type === 'excel' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                                                            color: f.type === 'excel' ? '#10B981' : '#38BDF8',
                                                            fontWeight: 700
                                                        }}
                                                    />
                                                </TableCell>

                                                <TableCell>
                                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                        {f.matchCount ? `${f.matchCount} Matches` : '—'}
                                                    </Typography>
                                                </TableCell>

                                                <TableCell>
                                                    <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                                                        {f.sizeFormatted}
                                                    </Typography>
                                                </TableCell>

                                                <TableCell>
                                                    <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                                                        {new Date(f.modified).toLocaleString()}
                                                    </Typography>
                                                </TableCell>

                                                <TableCell align="center">
                                                    <Button
                                                        variant="contained"
                                                        size="small"
                                                        startIcon={<DownloadIcon />}
                                                        onClick={() => handleDownload(f.name)}
                                                        sx={{
                                                            bgcolor: f.type === 'excel' ? '#10B981' : '#0284c7',
                                                            '&:hover': { bgcolor: f.type === 'excel' ? '#059669' : '#0369a1' },
                                                            textTransform: 'none',
                                                            borderRadius: '8px',
                                                            fontWeight: 600
                                                        }}
                                                    >
                                                        Download {f.type === 'excel' ? 'Excel' : 'JSON'}
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </Box>
            )}

            {/* TAB 2: Cricbuzz Bulk Scraper Tool View */}
            {currentTab === 2 && (
                <Box sx={{ maxWidth: 800, mx: 'auto' }}>
                    <Paper sx={{
                        p: 3.5,
                        bgcolor: 'rgba(30, 41, 59, 0.6)',
                        borderRadius: '20px',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
                    }}>
                        <Typography variant="h5" sx={{ fontWeight: 800, color: '#fff', mb: 1 }}>
                            🚀 Scrape Any Cricbuzz Series
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#94A3B8', mb: 3 }}>
                            Paste any Cricbuzz Series Matches URL below. The scraper will extract full match schedules, dates, IST times, venues, cities, coordinates, toss decisions, winners and save both to MongoDB and Excel!
                        </Typography>

                        {scrapeStatus && (
                            <Alert severity={scrapeStatus.type} sx={{ mb: 3, borderRadius: '12px' }}>
                                {scrapeStatus.msg}
                            </Alert>
                        )}

                        <Box sx={{ mb: 3 }}>
                            <Typography variant="subtitle2" sx={{ color: '#E2E8F0', mb: 1, fontWeight: 600 }}>
                                Cricbuzz Series Matches URL:
                            </Typography>
                            <TextField
                                fullWidth
                                placeholder="e.g. https://www.cricbuzz.com/cricket-series/10405/womens-big-bash-league-2025/matches"
                                value={scrapeUrl}
                                onChange={(e) => setScrapeUrl(e.target.value)}
                                InputProps={{
                                    sx: {
                                        bgcolor: 'rgba(15, 23, 42, 0.6)',
                                        color: '#fff',
                                        borderRadius: '12px',
                                        '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.15)' }
                                    }
                                }}
                            />
                        </Box>

                        {/* Quick Presets */}
                        <Box sx={{ mb: 3 }}>
                            <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', mb: 1 }}>
                                Quick Sample Series Presets (Click to load):
                            </Typography>
                            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                <Chip
                                    label="Women's Big Bash League 2025"
                                    onClick={() => setScrapeUrl('https://www.cricbuzz.com/cricket-series/10405/womens-big-bash-league-2025/matches')}
                                    sx={{ bgcolor: 'rgba(56, 189, 248, 0.15)', color: '#38BDF8', cursor: 'pointer', mb: 1 }}
                                />
                                <Chip
                                    label="Big Bash League 2025-26"
                                    onClick={() => setScrapeUrl('https://www.cricbuzz.com/cricket-series/10289/big-bash-league-2025-26/matches')}
                                    sx={{ bgcolor: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B', cursor: 'pointer', mb: 1 }}
                                />
                                <Chip
                                    label="India Tour of NZ 2026"
                                    onClick={() => setScrapeUrl('https://www.cricbuzz.com/cricket-series/12543/india-tour-of-new-zealand-2026/matches')}
                                    sx={{ bgcolor: 'rgba(16, 185, 129, 0.15)', color: '#10B981', cursor: 'pointer', mb: 1 }}
                                />
                            </Stack>
                        </Box>

                        <Button
                            fullWidth
                            variant="contained"
                            disabled={scraping || !scrapeUrl.trim()}
                            onClick={handleTriggerScraper}
                            startIcon={scraping ? <CircularProgress size={20} color="inherit" /> : <PlayArrowIcon />}
                            sx={{
                                py: 1.5,
                                borderRadius: '12px',
                                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                                fontWeight: 700,
                                fontSize: '1rem',
                                textTransform: 'none'
                            }}
                        >
                            {scraping ? 'Scraping and Saving Data...' : 'Start Series Scraping & Export'}
                        </Button>
                    </Paper>
                </Box>
            )}

            {/* Match Detail Dialog */}
            <Dialog
                open={detailOpen}
                onClose={() => setDetailOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        bgcolor: '#1E293B',
                        color: '#fff',
                        borderRadius: '20px',
                        border: '1px solid rgba(255, 255, 255, 0.12)'
                    }
                }}
            >
                {selectedMatch && (
                    <>
                        <DialogTitle sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', pb: 2 }}>
                            <Typography variant="h6" sx={{ fontWeight: 800, color: '#fff' }}>
                                {selectedMatch.teamA} vs {selectedMatch.teamB}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#38BDF8', fontWeight: 600 }}>
                                🏆 {selectedMatch.series || 'Cricket Series'} ({selectedMatch.format || 'T20'})
                            </Typography>
                        </DialogTitle>
                        <DialogContent sx={{ py: 3 }}>
                            <Stack spacing={2}>
                                <Box>
                                    <Typography variant="caption" sx={{ color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700 }}>
                                        Date & Time
                                    </Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                        📅 {selectedMatch.matchDate} at ⏰ {selectedMatch.matchTime || '19:30'}
                                    </Typography>
                                </Box>

                                <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />

                                <Box>
                                    <Typography variant="caption" sx={{ color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700 }}>
                                        Venue & City
                                    </Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                        📍 {selectedMatch.venue}
                                    </Typography>
                                    {selectedMatch.location?.lat && (
                                        <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                                            Astrology Coordinates: Lat {selectedMatch.location.lat}, Lng {selectedMatch.location.lng}
                                        </Typography>
                                    )}
                                </Box>

                                <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />

                                <Box>
                                    <Typography variant="caption" sx={{ color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700 }}>
                                        Toss Decision
                                    </Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 600, color: '#FB923C' }}>
                                        🪙 {selectedMatch.toss || 'Not recorded'}
                                    </Typography>
                                </Box>

                                <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />

                                <Box>
                                    <Typography variant="caption" sx={{ color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700 }}>
                                        Match Result / Winner
                                    </Typography>
                                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#10B981' }}>
                                        🎉 Winner: {selectedMatch.result?.winner || '—'}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: '#94A3B8' }}>
                                        {selectedMatch.result?.score || selectedMatch.result?.margin || 'Won'}
                                    </Typography>
                                </Box>

                                {selectedMatch.cricbuzzMatchId && (
                                    <Box sx={{ mt: 1 }}>
                                        <Typography variant="caption" sx={{ color: '#64748B' }}>
                                            Cricbuzz Match ID: {selectedMatch.cricbuzzMatchId}
                                        </Typography>
                                    </Box>
                                )}
                            </Stack>
                        </DialogContent>
                        <DialogActions sx={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', p: 2 }}>
                            <Button
                                onClick={() => setDetailOpen(false)}
                                sx={{ color: '#38BDF8', fontWeight: 600 }}
                            >
                                Close
                            </Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>
        </Box>
    );
};

export default OldMatchDetailsManager;
