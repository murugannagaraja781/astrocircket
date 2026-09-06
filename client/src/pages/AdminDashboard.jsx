
import React, { useState, useContext, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { Country, State, City } from 'country-state-city';
import ct from 'countries-and-timezones';
import {
    Box, CssBaseline, Drawer, AppBar, Toolbar, List, Typography, Divider, IconButton,
    ListItem, ListItemButton, ListItemIcon, ListItemText, Container, Grid, Paper, Button,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField, Autocomplete, CircularProgress,
    useTheme, useMediaQuery, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination,
    Snackbar, Alert, Checkbox, FormControlLabel, Chip, Avatar, Tooltip,
    Radio, RadioGroup, FormControl, FormLabel
} from '@mui/material';
import { CRICKET_TEAMS } from '../utils/teams';
import { createTheme, ThemeProvider } from '@mui/material/styles';

const visionTheme = createTheme({
    palette: {
        mode: 'light',
        background: {
            default: '#f4f6f9', // Soft gray background
            paper: '#ffffff',
        },
        primary: {
            main: '#2563eb', // Professional Blue
            light: '#3b82f6',
            dark: '#1d4ed8',
            contrastText: '#FFFFFF',
        },
        secondary: {
            main: '#0ea5e9', // Cyan accent
            light: '#38bdf8',
            dark: '#0284c7',
            contrastText: '#FFFFFF',
        },
        warning: {
            main: '#f59e0b',
            light: '#fbbf24',
            contrastText: '#000000',
        },
        success: {
            main: '#22c55e',
            contrastText: '#FFFFFF',
        },
        error: {
            main: '#ef4444',
            contrastText: '#FFFFFF',
        },
        text: {
            primary: '#111827',
            secondary: '#6b7280',
        },
    },
    shape: {
        borderRadius: 16, // App-like rounded corners
    },
    components: {
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                    backgroundColor: '#ffffff',
                    borderRadius: '16px',
                    border: '1px solid rgba(0, 0, 0, 0.08)',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                    transition: 'box-shadow 200ms ease-out, transform 200ms ease-out',
                    '&:hover': {
                        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
                    },
                },
            },
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: '50px',
                    textTransform: 'none',
                    fontWeight: 700,
                    padding: '8px 24px',
                    transition: 'all 150ms ease-out',
                },
                contained: {
                    boxShadow: '0 4px 14px rgba(99, 102, 241, 0.25)',
                    '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 6px 20px rgba(99, 102, 241, 0.35)',
                    },
                },
                containedPrimary: {
                    background: '#20293a',
                    '&:hover': {
                        background: '#3d4a5c',
                    },
                },
                outlined: {
                    borderWidth: '2px',
                    borderColor: 'rgba(32, 41, 58, 0.5)',
                    '&:hover': {
                        borderWidth: '2px',
                        backgroundColor: 'rgba(32, 41, 58, 0.08)',
                        borderColor: '#20293a',
                    },
                },
            },
        },
        MuiTableContainer: {
            styleOverrides: {
                root: {
                    borderRadius: '16px',
                    overflow: 'hidden',
                },
            },
        },
        MuiTableCell: {
            styleOverrides: {
                root: {
                    borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
                    color: '#1a202c',
                    padding: '14px 16px',
                },
                head: {
                    background: '#20293a',
                    color: '#FFFFFF',
                    textTransform: 'uppercase',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    letterSpacing: '0.05em',
                    position: 'sticky',
                    top: 0,
                    zIndex: 10,
                },
            },
        },
        MuiTableRow: {
            styleOverrides: {
                root: {
                    transition: 'background-color 150ms ease-out',
                    '&:nth-of-type(odd)': {
                        backgroundColor: 'rgba(0, 0, 0, 0.02)',
                    },
                    '&:hover': {
                        backgroundColor: 'rgba(32, 41, 58, 0.08) !important',
                    },
                },
            },
        },
        MuiChip: {
            styleOverrides: {
                root: {
                    fontWeight: 600,
                    borderRadius: '20px',
                },
                filled: {
                    '&.MuiChip-colorDefault': {
                        backgroundColor: 'rgba(0, 0, 0, 0.08)',
                        color: '#1a202c',
                    },
                },
                outlined: {
                    borderWidth: '1.5px',
                },
            },
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    '& .MuiFilledInput-root': {
                        backgroundColor: 'rgba(0, 0, 0, 0.04)',
                        borderRadius: '50px',
                        border: '1px solid rgba(0, 0, 0, 0.1)',
                        transition: 'all 200ms ease-out',
                        '&:hover': {
                            backgroundColor: 'rgba(0, 0, 0, 0.06)',
                            borderColor: 'rgba(0, 0, 0, 0.2)',
                        },
                        '&.Mui-focused': {
                            backgroundColor: 'rgba(32, 41, 58, 0.08)',
                            borderColor: '#20293a',
                            boxShadow: '0 0 0 3px rgba(32, 41, 58, 0.15)',
                        },
                        '&:before, &:after': {
                            display: 'none',
                        },
                    },
                    '& .MuiInputLabel-root': {
                        color: '#4a5568',
                        fontWeight: 500,
                        '&.Mui-focused': { color: '#20293a' }
                    },
                    '& .MuiInputBase-input': {
                        color: '#1a202c',
                    },
                    '& .MuiOutlinedInput-root': {
                        borderRadius: '50px',
                        '& fieldset': { borderColor: 'rgba(0, 0, 0, 0.15)' },
                        '&:hover fieldset': { borderColor: 'rgba(0, 0, 0, 0.3)' },
                        '&.Mui-focused fieldset': { borderColor: '#20293a', borderWidth: '2px' },
                    }
                }
            }
        },
        MuiDialog: {
            styleOverrides: {
                paper: {
                    backgroundColor: '#ffffff',
                    backgroundImage: 'none',
                    border: '1px solid rgba(0, 0, 0, 0.1)',
                    borderRadius: '20px',
                    boxShadow: '0 25px 50px rgba(0, 0, 0, 0.15)',
                }
            }
        },
        MuiDialogTitle: {
            styleOverrides: {
                root: {
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    color: '#1a202c',
                    borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
                    background: 'linear-gradient(180deg, rgba(32, 41, 58, 0.05) 0%, transparent 100%)',
                }
            }
        },
        MuiDialogContent: {
            styleOverrides: {
                root: {
                    padding: '24px !important',
                    backgroundColor: 'transparent',
                }
            }
        },
        MuiDialogActions: {
            styleOverrides: {
                root: {
                    padding: '16px 24px',
                    borderTop: '1px solid rgba(0, 0, 0, 0.1)',
                    backgroundColor: 'rgba(0, 0, 0, 0.02)',
                }
            }
        },
        MuiAppBar: {
            styleOverrides: {
                root: {
                    background: 'linear-gradient(90deg, #1e1b4b, #312e81)',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                    backdropFilter: 'blur(20px)',
                },
            },
        },
        MuiDrawer: {
            styleOverrides: {
                paper: {
                    background: 'linear-gradient(180deg, #1e1b4b, #0f172a)',
                    color: '#f1f5f9',
                    borderRight: '1px solid rgba(255, 255, 255, 0.08)',
                },
            },
        },
        MuiListItemButton: {
            styleOverrides: {
                root: {
                    borderRadius: '12px',
                    margin: '4px 8px',
                    transition: 'all 150ms ease-out',
                    '&:hover': {
                        backgroundColor: 'rgba(99, 102, 241, 0.15)',
                    },
                    '&.Mui-selected': {
                        backgroundColor: 'rgba(99, 102, 241, 0.25)',
                        borderLeft: '3px solid #6366f1',
                        '&:hover': {
                            backgroundColor: 'rgba(99, 102, 241, 0.3)',
                        },
                        '& .MuiListItemIcon-root': {
                            color: '#818cf8',
                        }
                    },
                },
            },
        },
        MuiListItemIcon: {
            styleOverrides: {
                root: {
                    color: '#94a3b8',
                    minWidth: '40px',
                },
            },
        },
        MuiListItemText: {
            styleOverrides: {
                primary: {
                    fontWeight: 600,
                },
            },
        },
        MuiAvatar: {
            styleOverrides: {
                root: {
                    backgroundColor: '#6366f1',
                    color: '#FFFFFF',
                    fontWeight: 700,
                },
            },
        },
        MuiTooltip: {
            styleOverrides: {
                tooltip: {
                    backgroundColor: '#1e293b',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    borderRadius: '8px',
                    padding: '8px 12px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                },
                arrow: {
                    color: '#1e293b',
                },
            },
        },
    },
    typography: {
        fontFamily: '"Inter", "Montserrat", "Roboto", "Helvetica", "Arial", sans-serif',
        h1: { fontWeight: 800, letterSpacing: '-0.02em', color: '#1a202c' },
        h2: { fontWeight: 800, letterSpacing: '-0.01em', color: '#1a202c' },
        h3: { fontWeight: 700, color: '#1a202c' },
        h4: { fontWeight: 700, color: '#2d3748' },
        h5: { fontWeight: 700, color: '#2d3748' },
        h6: { fontWeight: 700, color: '#1a202c' },
        subtitle1: { fontWeight: 600 },
        subtitle2: { fontWeight: 600 },
        body1: { fontWeight: 400 },
        body2: { fontWeight: 400 },
        button: { fontWeight: 700 },
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
import PrintIcon from '@mui/icons-material/Print';
import DescriptionIcon from '@mui/icons-material/Description'; // New Icon for View Chart
import GavelIcon from '@mui/icons-material/Gavel'; // Rules Icon
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'; // Chevron for Quick Actions
import StickyNote2Icon from '@mui/icons-material/StickyNote2'; // Notes Icon
import TimelineIcon from '@mui/icons-material/Timeline'; // KP Timeline Icon
import RasiChart, { tamilSigns, signLords, signLordsTamil, nakshatraTamilMap, getSignId, getNakshatraLordHelper } from '../components/RasiChart';
import PlanetaryTable from '../components/PlanetaryTable';
import AuthContext from '../context/AuthContext';
import UserDashboard from './UserDashboard';
import MyPredictions from './MyPredictions';
import NotesOverlay from '../components/NotesOverlay';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import BackupIcon from '@mui/icons-material/Backup';
import DownloadIcon from '@mui/icons-material/Download';
import SettingsBackupRestoreIcon from '@mui/icons-material/SettingsBackupRestore';


// Rules View Component (Tamil)
const RulesView = () => {
    const sectionStyle = {
        mb: 4,
        p: 3,
        borderRadius: '16px',
        bgcolor: '#fff',
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)'
    };

    const headerStyle = {
        color: '#1a202c',
        fontWeight: 700,
        mb: 2,
        pb: 1,
        borderBottom: '2px solid #e2e8f0'
    };

    const tableHeaderStyle = {
        bgcolor: '#1e293b',
        '& th': { color: '#fff', fontWeight: 700, fontSize: '0.85rem' }
    };

    const tableCellStyle = {
        color: '#1a202c',
        fontSize: '0.9rem'
    };

    return (
        <Box sx={{ p: 2 }}>
            <Typography variant="h4" gutterBottom sx={{ mb: 4, color: '#1a202c', fontWeight: 800 }}>
                🔮 Astrological Prediction Rules (கணிப்பு விதிமுறைகள்)
            </Typography>

            {/* Summary Section */}
            <Paper sx={sectionStyle}>
                <Typography variant="h6" sx={headerStyle}>
                    📊 மொத்த விதிகள் எண்ணிக்கை (Total Rules Summary)
                </Typography>
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={tableHeaderStyle}>
                                <TableCell>வகை (Category)</TableCell>
                                <TableCell align="center">எண்ணிக்கை (Count)</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            <TableRow>
                                <TableCell sx={tableCellStyle}>பேட்டிங் பொது விதிகள் (Batting Rules)</TableCell>
                                <TableCell align="center" sx={tableCellStyle}>9</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell sx={tableCellStyle}>பவுலிங் பொது விதிகள் (Bowling Rules)</TableCell>
                                <TableCell align="center" sx={tableCellStyle}>11</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell sx={tableCellStyle}>நட்சத்திர சிறப்பு விதிகள் (Nakshatra Rules)</TableCell>
                                <TableCell align="center" sx={tableCellStyle}>27 நட்சத்திரங்கள்</TableCell>
                            </TableRow>
                            <TableRow sx={{ bgcolor: '#f0fdf4' }}>
                                <TableCell sx={{ ...tableCellStyle, fontWeight: 700 }}>மொத்தம் (Total)</TableCell>
                                <TableCell align="center" sx={{ ...tableCellStyle, fontWeight: 700 }}>~45 விதிகள்</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            {/* Batting Rules */}
            <Paper sx={sectionStyle}>
                <Typography variant="h6" sx={headerStyle}>
                    🏏 பேட்டிங் விதிகள் (Batting Rules 1-9)
                </Typography>
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={tableHeaderStyle}>
                                <TableCell>விதி (Rule)</TableCell>
                                <TableCell>தமிழ் பெயர் (Tamil Name)</TableCell>
                                <TableCell align="center">புள்ளிகள் (Points)</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {[
                                { rule: 'BAT Rule 1', tamil: 'ஜிக்-ஜாக் விதி', points: '+12' },
                                { rule: 'BAT Rule 2', tamil: 'நேரடி விதி', points: '+6' },
                                { rule: 'BAT Rule 3', tamil: 'நட்சத்திர விதி', points: '+4' },
                                { rule: 'BAT Rule 4', tamil: 'சேர்க்கை விதி', points: '+4' },
                                { rule: 'BAT Rule 5', tamil: 'ஒரே ராசி விதி', points: '+4' },
                                { rule: 'BAT Rule 6', tamil: 'ராசி அதிபதி வீடு', points: '+6' },
                                { rule: 'BAT Rule 7', tamil: 'ராகு/கேது விதி', points: '+4' },
                                { rule: 'BAT Rule 8', tamil: 'லக்ன விதி', points: '+2' },
                                { rule: 'BAT Rule 9', tamil: 'ராசி & நட்சத்திர அதிபதி சேர்க்கை', points: '+12' },
                                { rule: 'BAT Rule 11', tamil: 'ராகு/கேது சிறப்பு நிலை', points: '+20' },
                            ].map((row, idx) => (
                                <TableRow key={idx} sx={{ '&:nth-of-type(odd)': { bgcolor: '#f8fafc' } }}>
                                    <TableCell sx={tableCellStyle}>{row.rule}</TableCell>
                                    <TableCell sx={tableCellStyle}>{row.tamil}</TableCell>
                                    <TableCell align="center" sx={{ ...tableCellStyle, color: '#16a34a', fontWeight: 600 }}>{row.points}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            {/* Bowling Rules */}
            <Paper sx={sectionStyle}>
                <Typography variant="h6" sx={headerStyle}>
                    🎳 பவுலிங் விதிகள் (Bowling Rules 1-9)
                </Typography>
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={tableHeaderStyle}>
                                <TableCell>விதி (Rule)</TableCell>
                                <TableCell>தமிழ் பெயர் (Tamil Name)</TableCell>
                                <TableCell align="center">புள்ளிகள் (Points)</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {[
                                { rule: 'BOWL Rule 1', tamil: 'ஜிக்-ஜாக் விதி', points: '+12' },
                                { rule: 'BOWL Rule 2', tamil: 'நேரடி விதி (எதிர்மறை)', points: 'SURE FLOP', negative: true },
                                { rule: 'BOWL Rule 3', tamil: 'நட்சத்திர விதி', points: '+3' },
                                { rule: 'BOWL Rule 4', tamil: 'சேர்க்கை விதி', points: '+4' },
                                { rule: 'BOWL Rule 5', tamil: 'ஒரே ராசி விதி', points: '+4' },
                                { rule: 'BOWL Rule 6', tamil: 'ராசி அதிபதி வீடு', points: '+4' },
                                { rule: 'BOWL Rule 7', tamil: 'ராகு/கேது விதி', points: '+4' },
                                { rule: 'BOWL Rule 8', tamil: 'லக்ன விதி', points: '+4' },
                                { rule: 'BOWL Rule 9', tamil: 'ராசி & நட்சத்திர அதிபதி சேர்க்கை', points: '+12' },
                                { rule: 'BOWL Rule 11', tamil: 'ராகு/கேது சிறப்பு நிலை', points: '+20' },
                            ].map((row, idx) => (
                                <TableRow key={idx} sx={{ '&:nth-of-type(odd)': { bgcolor: '#f8fafc' } }}>
                                    <TableCell sx={tableCellStyle}>{row.rule}</TableCell>
                                    <TableCell sx={tableCellStyle}>{row.tamil}</TableCell>
                                    <TableCell align="center" sx={{ ...tableCellStyle, color: row.negative ? '#dc2626' : '#16a34a', fontWeight: 600 }}>{row.points}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            {/* Nakshatra Specific Rules */}
            <Paper sx={sectionStyle}>
                <Typography variant="h6" sx={headerStyle}>
                    ⭐ நட்சத்திர சிறப்பு விதிகள் (Nakshatra Specific Rules - 18 Stars)
                </Typography>
                <TableContainer sx={{ maxHeight: 500 }}>
                    <Table size="small" stickyHeader>
                        <TableHead>
                            <TableRow sx={tableHeaderStyle}>
                                <TableCell sx={{ bgcolor: '#1e293b', color: '#fff' }}>#</TableCell>
                                <TableCell sx={{ bgcolor: '#1e293b', color: '#fff' }}>நட்சத்திரம் (Nakshatra)</TableCell>
                                <TableCell sx={{ bgcolor: '#1e293b', color: '#fff' }}>சிறப்பு நிபந்தனைகள் (Special Conditions)</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {[
                                { num: 1, star: 'அசுவினி (Ashwini)', condition: 'செவ்வாய் உச்சம் (+8), செவ்வாய்+சுக்கிரன் சேர்க்கை (+10)' },
                                { num: 2, star: 'பரணி (Bharani)', condition: 'சுக்கிரன்+புதன் சேர்க்கை = SURE FLOP (Bat) ❌ / +12 (Bowl)' },
                                { num: 3, star: 'கார்த்திகை (Krittika)', condition: '-' },
                                { num: 4, star: 'ரோகிணி (Rohini)', condition: 'சந்திரன் நீசம் (+8), சதயம்+சனி+ராகு (+12)' },
                                { num: 5, star: 'மிருகசீரிடம் (Mrigashira)', condition: 'செவ்வாய் ராசி/நட்சத்திர அதிபதி (+6), செவ்வாய் ஆட்சி/உச்சம் (+6)' },
                                { num: 6, star: 'திருவாதிரை (Ardra)', condition: 'செவ்வாய் ஆட்சி/உச்சம் (+10 Bowl), செவ்வாய் நீசம் = SURE FLOP ❌' },
                                { num: 7, star: 'புனர்பூசம் (Punarvasu)', condition: '-' },
                                { num: 8, star: 'பூசம் (Pushya)', condition: '-' },
                                { num: 9, star: 'ஆயில்யம் (Ashlesha)', condition: 'சுக்கிரன்+புதன் சேர்க்கை = SURE FLOP (Bat) ❌ / +12 (Bowl)' },
                                { num: 10, star: 'மகம் (Magha)', condition: 'புதன் ராசி + செவ்வாய் நட்சத்திரம் (+12) ⭐ சிறப்பு வீரர்' },
                                { num: 11, star: 'பூரம் (Purva Phalguni)', condition: 'சனி+செவ்வாய் (+12 Bat), குரு+புதன் (+12 Bowl), சூரியன்+சுக்கிரன் = SURE FLOP ❌' },
                                { num: 12, star: 'உத்திரம் (Uttara Phalguni)', condition: 'கன்னி ராசி + சனி+ராகு (+12) ⭐ சிறப்பு வீரர்' },
                                { num: 13, star: 'ஹஸ்தம் (Hasta)', condition: '-' },
                                { num: 14, star: 'சித்திரை (Chitra)', condition: 'கன்னி: புதன்+சூரியன் (+6-12), துலாம்: சந்திரன்+சனி (+12)' },
                                { num: 15, star: 'சுவாதி (Swati)', condition: 'புதன்/சூரியன்/குரு ராசி/நட்சத்திர அதிபதி & மூவர் சேர்க்கை (+20 பேட்டிங்) ⭐' },
                                { num: 16, star: 'விசாகம் (Vishakha)', condition: '-' },
                                { num: 17, star: 'அனுஷம் (Anuradha)', condition: 'குரு ராசி (+5), குரு ஆட்சி/உச்சம் (+10)' },
                                { num: 18, star: 'கேட்டை (Jyeshtha)', condition: 'புதன்+சுக்கிரன் சேர்க்கை = SURE FLOP (Bat) ❌ / +12 (Bowl)' },
                                { num: 19, star: 'மூலம் (Mula)', condition: 'சனி+செவ்வாய் (+12 பேட்டிங்), செவ்வாய்+சனி (+12 பவுலிங்)' },
                                { num: 20, star: 'பூராடம் (Purva Ashadha)', condition: 'சுக்கிரன்+புதன் சேர்க்கை = SURE FLOP (Bat) ❌ / +12 (Bowl)' },
                                { num: 21, star: 'உத்திராடம் (Uttara Ashadha)', condition: 'மகரம்: சந்திரன் ராசி (+12) ⭐ சிறப்பு வீரர்' },
                                { num: 22, star: 'திருவோணம் (Shravana)', condition: 'செவ்வாய் கடகத்தில் (+6), சனி+ராகு (+12)' },
                                { num: 23, star: 'அவிட்டம் (Dhanishta)', condition: 'மகரம்: சனி ராசி (+4)' },
                                { num: 24, star: 'சதயம் (Shatabhisha)', condition: 'சந்திரன் ராசி (+12) ⭐ GAME CHANGER 🏆' },
                                { num: 25, star: 'பூரட்டாதி (Purva Bhadrapada)', condition: '-' },
                                { num: 26, star: 'உத்திரட்டாதி (Uttara Bhadrapada)', condition: '-' },
                                { num: 27, star: 'ரேவதி (Revati)', condition: '-' }
                            ].map((row, idx) => (
                                <TableRow key={idx} sx={{ '&:nth-of-type(odd)': { bgcolor: '#f8fafc' } }}>
                                    <TableCell sx={tableCellStyle}>{row.num}</TableCell>
                                    <TableCell sx={{ ...tableCellStyle, fontWeight: 600 }}>{row.star}</TableCell>
                                    <TableCell sx={tableCellStyle}>{row.condition}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            {/* Verdict Section */}
            <Paper sx={sectionStyle}>
                <Typography variant="h6" sx={headerStyle}>
                    🎯 முடிவு மதிப்பீடு (Final Verdict)
                </Typography>
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={tableHeaderStyle}>
                                <TableCell>Score Range</TableCell>
                                <TableCell>Label</TableCell>
                                <TableCell>தமிழ் (Tamil)</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            <TableRow sx={{ bgcolor: '#fef2f2' }}>
                                <TableCell sx={tableCellStyle}>&lt; 4</TableCell>
                                <TableCell sx={{ ...tableCellStyle, color: '#dc2626', fontWeight: 700 }}>Flop</TableCell>
                                <TableCell sx={tableCellStyle}>தோல்வி</TableCell>
                            </TableRow>
                            <TableRow sx={{ bgcolor: '#fefce8' }}>
                                <TableCell sx={tableCellStyle}>4 - 7</TableCell>
                                <TableCell sx={{ ...tableCellStyle, color: '#ca8a04', fontWeight: 700 }}>Good</TableCell>
                                <TableCell sx={tableCellStyle}>நல்லது</TableCell>
                            </TableRow>
                            <TableRow sx={{ bgcolor: '#f0fdf4' }}>
                                <TableCell sx={tableCellStyle}>≥ 8</TableCell>
                                <TableCell sx={{ ...tableCellStyle, color: '#16a34a', fontWeight: 700 }}>Excellent</TableCell>
                                <TableCell sx={tableCellStyle}>சிறப்பு</TableCell>
                            </TableRow>
                            <TableRow sx={{ bgcolor: '#fef2f2' }}>
                                <TableCell sx={tableCellStyle}>SURE FLOP</TableCell>
                                <TableCell sx={{ ...tableCellStyle, color: '#dc2626', fontWeight: 700 }}>Score = 0</TableCell>
                                <TableCell sx={tableCellStyle}>நிச்சய தோல்வி</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            {/* Planetary Strength Section */}
            <Paper sx={sectionStyle}>
                <Typography variant="h6" sx={headerStyle}>
                    🌟 கிரக பலம் (Planetary Strength)
                </Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" sx={{ color: '#1a202c', fontWeight: 700, mb: 1 }}>
                            உச்சம் (Exalted - Strong)
                        </Typography>
                        <Box sx={{ fontSize: '0.85rem', color: '#1a202c' }}>
                            <div>☀️ சூரியன் → மேஷம் (Sun → Aries)</div>
                            <div>🌙 சந்திரன் → ரிஷபம் (Moon → Taurus)</div>
                            <div>♂️ செவ்வாய் → மகரம் (Mars → Capricorn)</div>
                            <div>☿ புதன் → கன்னி (Mercury → Virgo)</div>
                            <div>♃ குரு → கடகம் (Jupiter → Cancer)</div>
                            <div>♀ சுக்கிரன் → மீனம் (Venus → Pisces)</div>
                            <div>♄ சனி → துலாம் (Saturn → Libra)</div>
                        </Box>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" sx={{ color: '#1a202c', fontWeight: 700, mb: 1 }}>
                            நீசம் (Debilitated - Weak)
                        </Typography>
                        <Box sx={{ fontSize: '0.85rem', color: '#1a202c' }}>
                            <div>☀️ சூரியன் → துலாம் (Sun → Libra)</div>
                            <div>🌙 சந்திரன் → விருச்சிகம் (Moon → Scorpio)</div>
                            <div>♂️ செவ்வாய் → கடகம் (Mars → Cancer)</div>
                            <div>☿ புதன் → மீனம் (Mercury → Pisces)</div>
                            <div>♃ குரு → மகரம் (Jupiter → Capricorn)</div>
                            <div>♀ சுக்கிரன் → கன்னி (Venus → Virgo)</div>
                            <div>♄ சனி → மேஷம் (Saturn → Aries)</div>
                        </Box>
                    </Grid>
                </Grid>
            </Paper>
        </Box>
    );
};

// KP Sub Timeline View
const KPView = () => {
    const { token } = useContext(AuthContext);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [loading, setLoading] = useState(false);
    const [timeline, setTimeline] = useState([]);
    const [viewLevel, setViewLevel] = useState('Sub'); // 'Sign', 'Nakshatra', 'Sub'

    // Inputs
    const now = new Date();
    const [form, setForm] = useState({
        year: now.getFullYear(),
        month: now.getMonth() + 1,
        day: now.getDate(),
        hour: now.getHours(),
        minute: now.getMinutes(),
        lat: '13.0827',
        lon: '80.2707',
        tz: '5.5',
    });

    // Location Search State
    const [locationOptions, setLocationOptions] = useState([]);
    const [locationLoading, setLocationLoading] = useState(false);
    // Random ID for autofill prevention
    const [fieldId] = useState(Math.random().toString(36).substring(7));

    const calculateTimezone = (long) => {
        const lonNum = parseFloat(long);
        if (isNaN(lonNum)) return 5.5;
        let offset = lonNum / 15;
        offset = Math.round(offset * 2) / 2;
        if (offset > 14) offset = 14;
        if (offset < -12) offset = -12;
        return offset;
    };

    const handleLocationSearch = (event, newInputValue) => {
        if (!newInputValue || newInputValue.length < 3) return;
        setLocationLoading(true);
        setTimeout(() => {
            const q = newInputValue.toLowerCase();
            const all = City.getAllCities();
            const matches = [];
            for (let i = 0; i < all.length; i++) {
                if (all[i].name.toLowerCase().includes(q)) {
                    matches.push(all[i]);
                    if (matches.length >= 50) break;
                }
            }
            setLocationOptions(matches);
            setLocationLoading(false);
        }, 300);
    };

    const fetchTimeline = async () => {
        setLoading(true);
        try {
            const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/charts/kp-timeline`, {
                year: parseInt(form.year),
                month: parseInt(form.month),
                day: parseInt(form.day),
                hour: parseInt(form.hour),
                minute: parseInt(form.minute),
                latitude: parseFloat(form.lat),
                longitude: parseFloat(form.lon),
                timezone: parseFloat(form.tz),
                ayanamsa: form.ayanamsa
            }, { headers: { 'x-auth-token': token } });
            setTimeline(res.data.timeline.filter(row => row.durationSeconds >= 5));
        } catch (err) {
            console.error(err);
            alert('Failed to fetch KP timeline');
        } finally {
            setLoading(false);
        }
    };

    const getDisplayTimeline = () => {
        if (!timeline.length) return [];
        if (viewLevel === 'Sub') return timeline;

        const merged = [];
        let current = { ...timeline[0] };

        for (let i = 1; i < timeline.length; i++) {
            const next = timeline[i];
            let shouldMerge = false;
            if (viewLevel === 'Sign') {
                shouldMerge = next.sign === current.sign;
            } else if (viewLevel === 'Nakshatra') {
                shouldMerge = next.nakshatra === current.nakshatra;
            }

            if (shouldMerge) {
                current.to = next.to;
                current.durationSeconds += next.durationSeconds;
            } else {
                merged.push(current);
                current = { ...next };
            }
        }
        merged.push(current);
        return merged;
    };

    const displayTimeline = getDisplayTimeline();

    const SIGN_LORDS = {
        'Aries': 'Mars', 'Taurus': 'Venus', 'Gemini': 'Mercury', 'Cancer': 'Moon',
        'Leo': 'Sun', 'Virgo': 'Mercury', 'Libra': 'Venus', 'Scorpio': 'Mars',
        'Sagittarius': 'Jupiter', 'Capricorn': 'Saturn', 'Aquarius': 'Saturn', 'Pisces': 'Jupiter'
    };

    const NAK_LORDS = {
        'Ashwini': 'Ketu', 'Bharani': 'Venus', 'Krittika': 'Sun',
        'Rohini': 'Moon', 'Mrigashirsha': 'Mars', 'Ardra': 'Rahu',
        'Punarvasu': 'Jupiter', 'Pushya': 'Saturn', 'Ashlesha': 'Mercury',
        'Magha': 'Ketu', 'Purva Phalguni': 'Venus', 'Uttara Phalguni': 'Sun',
        'Hasta': 'Moon', 'Chitra': 'Mars', 'Swati': 'Rahu',
        'Vishakha': 'Jupiter', 'Anuradha': 'Saturn', 'Jyeshtha': 'Mercury',
        'Mula': 'Ketu', 'Purva Ashadha': 'Venus', 'Uttara Ashadha': 'Sun',
        'Shravana': 'Moon', 'Dhanishta': 'Mars', 'Shatabhisha': 'Rahu',
        'Purva Bhadrapada': 'Jupiter', 'Uttara Bhadrapada': 'Saturn', 'Revati': 'Mercury'
    };

    const TAMIL_MAPS = {
        Signs: {
            'Aries': 'மேஷம்', 'Taurus': 'ரிஷபம்', 'Gemini': 'மிதுனம்', 'Cancer': 'கடகம்',
            'Leo': 'சிம்மம்', 'Virgo': 'கன்னி', 'Libra': 'துலாம்', 'Scorpio': 'விருச்சிகம்',
            'Sagittarius': 'தனுசு', 'Capricorn': 'மகரம்', 'Aquarius': 'கும்பம்', 'Pisces': 'மீனம்'
        },
        Nakshatras: {
            'Ashwini': 'அஸ்வினி', 'Bharani': 'பரணி', 'Krittika': 'கார்த்திகை', 'Rohini': 'ரோகிணி',
            'Mrigashirsha': 'மிருகசீரிஷம்', 'Ardra': 'திருவாதிரை', 'Punarvasu': 'புனர்பூசம்', 'Pushya': 'பூசம்',
            'Ashlesha': 'ஆயில்யம்', 'Magha': 'மகம்', 'Purva Phalguni': 'பூரம்', 'Uttara Phalguni': 'உத்திரம்',
            'Hasta': 'ஹஸ்தம்', 'Chitra': 'சித்திரை', 'Swati': 'சுவாதி', 'Vishakha': 'விசாகம்',
            'Anuradha': 'அனுஷம்', 'Jyeshtha': 'கேட்டை', 'Mula': 'மூலம்', 'Purva Ashadha': 'பூராடம்',
            'Uttara Ashadha': 'உத்திராடம்', 'Shravana': 'திருவோணம்', 'Dhanishta': 'அவிட்டம்', 'Shatabhisha': 'சதயம்',
            'Purva Bhadrapada': 'பூரட்டாதி', 'Uttara Bhadrapada': 'உத்திரட்டாதி', 'Revati': 'ரேவதி'
        },
        Planets: {
            'Sun': 'சூரியன்', 'Moon': 'சந்திரன்', 'Mars': 'செவ்வாய்', 'Mercury': 'புதன்',
            'Jupiter': 'குரு', 'Venus': 'சுக்கிரன்', 'Saturn': 'சனி', 'Rahu': 'ராகு', 'Ketu': 'கேது'
        }
    };

    return (
        <Box sx={{ p: 2 }}>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h5" fontWeight="800" sx={{ color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                    🌌 KP Astrology (கே.பி ஜோதிடம்)
                </Typography>
            </Box>

            <Paper sx={{ p: 3, mb: 3, borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                <Grid container spacing={2}>
                    <Grid item xs={12} md={3}>
                        <TextField
                            fullWidth
                            label="Date"
                            type="date"
                            value={`${form.year}-${String(form.month).padStart(2, '0')}-${String(form.day).padStart(2, '0')}`}
                            onChange={(e) => {
                                const [y, m, d] = e.target.value.split('-');
                                setForm({ ...form, year: y, month: m, day: d });
                            }}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>
                    <Grid item xs={12} md={2}>
                        <TextField
                            fullWidth
                            label="Time"
                            type="time"
                            value={`${String(form.hour).padStart(2, '0')}:${String(form.minute).padStart(2, '0')}`}
                            onChange={(e) => {
                                const [h, min] = e.target.value.split(':');
                                setForm({ ...form, hour: h, minute: min });
                            }}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>
                    {/* Location Selection */}
                    {/* Single Line High Performance Location Search */}
                    <Grid item xs={12}>
                        <Box sx={{ width: '100%', mt: 0, p: 2, bgcolor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                            <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#64748b', mb: 1, display: 'block' }}>📍 Select Venue Location</Typography>

                            <Autocomplete
                                options={locationOptions}
                                loading={locationLoading}
                                getOptionLabel={(option) => `${option.name}, ${option.stateCode}, ${option.countryCode}`}
                                onInputChange={handleLocationSearch}
                                onChange={(event, val) => {
                                    if (val) {
                                        const country = Country.getCountryByCode(val.countryCode);
                                        const state = State.getStateByCodeAndCountry(val.stateCode, val.countryCode);

                                        const lat = parseFloat(val.latitude);
                                        const long = parseFloat(val.longitude);

                                        // Calculate Timezone
                                        let tz = 5.5;
                                        try {
                                            const timezones = ct.getTimezonesForCountry(val.countryCode);
                                            if (timezones && timezones.length > 0) {
                                                tz = timezones[0].utcOffset / 60;
                                            } else {
                                                tz = calculateTimezone(long);
                                            }
                                        } catch (e) {
                                            tz = calculateTimezone(long);
                                        }

                                        setForm(prev => ({
                                            ...prev,
                                            lat: lat,
                                            lon: long,
                                            tz: tz
                                        }));
                                    }
                                }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="🔍 Search City (Type 3+ letters)"
                                        size="small"
                                        fullWidth
                                        InputProps={{
                                            ...params.InputProps,
                                            endAdornment: (
                                                <React.Fragment>
                                                    {locationLoading ? <CircularProgress color="inherit" size={20} /> : null}
                                                    {params.InputProps.endAdornment}
                                                </React.Fragment>
                                            ),
                                        }}
                                    />
                                )}
                                renderOption={(props, option) => {
                                    const country = Country.getCountryByCode(option.countryCode);
                                    return (
                                        <li {...props} key={`${option.name}-${option.latitude}`}>
                                            <Box>
                                                <Typography variant="body2" fontWeight="bold">{option.name}</Typography>
                                                <Typography variant="caption" color="textSecondary">
                                                    {option.stateCode}, {country?.name}
                                                </Typography>
                                            </Box>
                                        </li>
                                    )
                                }}
                            />

                            <Box sx={{ mt: 2, p: 1, bgcolor: '#e0f2fe', borderRadius: '8px', display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                <Typography variant="caption">Selected: <b>{form.lat}, {form.lon}</b></Typography>
                                <Typography variant="caption">TZ: <b>{form.tz}</b></Typography>
                            </Box>
                        </Box>
                    </Grid>

                    <Grid item xs={12} md={3}>
                        <TextField
                            fullWidth
                            label="Lat"
                            value={form.lat}
                            onChange={(e) => setForm({ ...form, lat: e.target.value })}
                            placeholder="13.0827"
                        />
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <TextField
                            fullWidth
                            label="Lon"
                            value={form.lon}
                            onChange={(e) => setForm({ ...form, lon: e.target.value })}
                            placeholder="80.2707"
                        />
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <TextField
                            fullWidth
                            label="TZ"
                            value={form.tz}
                            onChange={(e) => setForm({ ...form, tz: e.target.value })}
                            placeholder="5.5"
                        />
                    </Grid>

                    <Grid item xs={12} md={3}>
                        <TextField
                            select
                            fullWidth
                            label="Ayanamsa"
                            value={form.ayanamsa}
                            onChange={(e) => setForm({ ...form, ayanamsa: e.target.value })}
                            SelectProps={{ native: true }}
                        >
                            <option value="Lahiri">Lahiri</option>
                            <option value="KP">KP</option>
                            <option value="KP Straight">KP Straight</option>
                        </TextField>
                    </Grid>
                    <Grid item xs={12}>
                        <Button
                            variant="contained"
                            fullWidth
                            size="large"
                            onClick={fetchTimeline}
                            disabled={loading}
                            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <TimelineIcon />}
                            sx={{ borderRadius: '12px', py: 1.5, fontWeight: 700 }}
                        >
                            {loading ? 'Calculating...' : 'Calculate 24h Timeline (கணக்கிடு)'}
                        </Button>
                    </Grid>
                </Grid>
            </Paper>

            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="subtitle2" fontWeight="700">Display Level (காண்பிக்கும் நிலை):</Typography>
                <RadioGroup row value={viewLevel} onChange={(e) => setViewLevel(e.target.value)}>
                    <FormControlLabel value="Sign" control={<Radio size="small" />} label="Sign (ராசி)" />
                    <FormControlLabel value="Nakshatra" control={<Radio size="small" />} label="Nakshatra (நட்சத்திரம்)" />
                    <FormControlLabel value="Sub" control={<Radio size="small" />} label="Sub Lord (உப அதிபதி)" />
                </RadioGroup>
            </Box>

            {
                displayTimeline.length > 0 && (
                    <TableContainer component={Paper} sx={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
                        <Table stickyHeader>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ bgcolor: '#1e293b', color: 'white', fontWeight: 700 }}>FROM TIME</TableCell>
                                    <TableCell sx={{ bgcolor: '#1e293b', color: 'white', fontWeight: 700 }}>TO TIME</TableCell>
                                    <TableCell sx={{ bgcolor: '#1e293b', color: 'white', fontWeight: 700 }}>SIGN (ராசி)</TableCell>
                                    <TableCell sx={{ bgcolor: '#1e293b', color: 'white', fontWeight: 700 }}>NAKSHATRA (நட்சத்திரம்)</TableCell>
                                    <TableCell sx={{ bgcolor: '#1e293b', color: 'white', fontWeight: 700 }}>LORD (நாதன்)</TableCell>
                                    <TableCell sx={{ bgcolor: '#1e293b', color: 'white', fontWeight: 700 }}>SUB LORD (உப அதிபதி)</TableCell>
                                    <TableCell sx={{ bgcolor: '#1e293b', color: 'white', fontWeight: 700 }}>DURATION</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {displayTimeline.map((row, idx) => (
                                    <TableRow key={idx} hover sx={{ '&:nth-of-type(even)': { bgcolor: '#f8fafc' } }}>
                                        <TableCell sx={{ fontWeight: 600 }}>{new Date(row.from).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</TableCell>
                                        <TableCell sx={{ color: 'text.secondary', fontSize: '13px' }}>{new Date(row.to).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</TableCell>
                                        <TableCell sx={{ fontWeight: viewLevel === 'Sign' ? 800 : 400, color: viewLevel === 'Sign' ? 'primary.main' : 'inherit' }}>
                                            {TAMIL_MAPS.Signs[row.sign] || row.sign}
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: viewLevel === 'Nakshatra' ? 800 : 400, color: viewLevel === 'Nakshatra' ? 'primary.main' : 'inherit' }}>
                                            {TAMIL_MAPS.Nakshatras[row.nakshatra] || row.nakshatra}
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: 'secondary.main' }}>
                                            {TAMIL_MAPS.Planets[SIGN_LORDS[row.sign]] || '-'}/{TAMIL_MAPS.Planets[NAK_LORDS[row.nakshatra]] || '-'}
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={TAMIL_MAPS.Planets[row.subLord] || row.subLord}
                                                size="small"
                                                color={viewLevel === 'Sub' ? 'primary' : 'default'}
                                                sx={{ fontWeight: 700, borderRadius: '8px' }}
                                            />
                                        </TableCell>
                                        <TableCell sx={{ color: 'info.main', fontWeight: 700, fontSize: '13px' }}>
                                            {Math.floor(row.durationSeconds / 60)}m {row.durationSeconds % 60}s
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )
            }
        </Box >
    );
};

// Mobile App Style Dashboard Home
const DashboardHome = ({ onNavigate }) => {
    const { token, user } = useContext(AuthContext);
    console.log('DashboardHome rendering. User:', user);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

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

    // Primary KPI Cards Data
    const primaryKPIs = [
        {
            label: 'Total Users',
            value: stats.totalUsers,
            icon: <PeopleIcon sx={{ fontSize: 28 }} />,
            gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            trend: '+12%'
        },
        {
            label: 'Total Players',
            value: stats.totalPlayers,
            icon: <SportsCricketIcon sx={{ fontSize: 28 }} />,
            gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
            trend: '+8%'
        },
    ];

    // Secondary Mini Cards Data
    const secondaryKPIs = [
        { label: 'Pending', value: stats.pendingUsers, icon: <GroupIcon sx={{ fontSize: 20 }} />, color: '#f59e0b' },
        { label: 'Groups', value: stats.totalGroups, icon: <DashboardIcon sx={{ fontSize: 20 }} />, color: '#ec4899' },
        { label: 'Views', value: stats.totalViews, icon: <DashboardIcon sx={{ fontSize: 20 }} />, color: '#3b82f6' },
    ];

    return (
        <Box sx={{ pb: 4, px: isMobile ? 1 : 0 }}>
            {/* Greeting Section */}
            <Box sx={{ mb: 3, pt: 1 }}>
                <Typography variant="h5" fontWeight="800" color="#1e293b" sx={{ mb: 0.5 }}>
                    Welcome back! 👋
                </Typography>
                <Typography variant="body2" color="#64748b">
                    Here's your dashboard overview
                </Typography>
            </Box>

            {/* Primary KPI Cards - Large Gradient Cards */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                {primaryKPIs.map((kpi, index) => (
                    <Grid item xs={6} key={index}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 2.5,
                                borderRadius: '20px',
                                background: kpi.gradient,
                                color: 'white',
                                position: 'relative',
                                overflow: 'hidden',
                                minHeight: 140,
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                                transition: 'transform 0.2s ease',
                                '&:active': {
                                    transform: 'scale(0.98)',
                                }
                            }}
                        >
                            {/* Icon Badge */}
                            <Box sx={{
                                position: 'absolute',
                                top: 12,
                                right: 12,
                                width: 40,
                                height: 40,
                                borderRadius: '12px',
                                bgcolor: 'rgba(255,255,255,0.2)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                {kpi.icon}
                            </Box>

                            {/* Value */}
                            <Typography variant="h3" fontWeight="800" sx={{ mt: 3 }}>
                                {kpi.value}
                            </Typography>

                            {/* Label & Trend */}
                            <Box>
                                <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 500 }}>
                                    {kpi.label}
                                </Typography>
                                <Typography variant="caption" sx={{
                                    bgcolor: 'rgba(255,255,255,0.25)',
                                    px: 1,
                                    py: 0.25,
                                    borderRadius: '8px',
                                    fontWeight: 600,
                                    fontSize: '0.7rem'
                                }}>
                                    {kpi.trend} ↑
                                </Typography>
                            </Box>
                        </Paper>
                    </Grid>
                ))}
            </Grid>

            {/* Secondary Metrics - Horizontal Scrollable Mini Cards */}
            <Typography variant="subtitle2" fontWeight="700" color="#1e293b" sx={{ mb: 1.5, px: 0.5 }}>
                Quick Stats
            </Typography>
            <Box sx={{
                display: 'flex',
                gap: 1.5,
                overflowX: 'auto',
                pb: 1,
                '&::-webkit-scrollbar': { display: 'none' },
                scrollbarWidth: 'none'
            }}>
                {secondaryKPIs.map((kpi, index) => (
                    <Paper
                        key={index}
                        elevation={0}
                        sx={{
                            p: 2,
                            borderRadius: '16px',
                            minWidth: 110,
                            bgcolor: 'white',
                            boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                            border: '1px solid rgba(0,0,0,0.04)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 0.5,
                            transition: 'transform 0.2s ease',
                            '&:active': {
                                transform: 'scale(0.96)',
                            }
                        }}
                    >
                        <Box sx={{
                            width: 36,
                            height: 36,
                            borderRadius: '10px',
                            bgcolor: `${kpi.color}15`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: kpi.color,
                            mb: 0.5
                        }}>
                            {kpi.icon}
                        </Box>
                        <Typography variant="h6" fontWeight="800" color="#1e293b">
                            {kpi.value}
                        </Typography>
                        <Typography variant="caption" color="#64748b" fontWeight={500}>
                            {kpi.label}
                        </Typography>
                    </Paper>
                ))}
            </Box>

            {/* Activity / Insight Section */}
            <Typography variant="subtitle2" fontWeight="700" color="#111827" sx={{ mt: 3, mb: 1.5, px: 0.5 }}>
                Quick Actions
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {[
                    { title: 'Active Teams', desc: 'Manage your cricket teams', icon: <GroupIcon />, color: '#2563eb', viewId: 'groups' },
                    { title: 'Manage Players', desc: 'Add, edit or remove players', icon: <SportsCricketIcon />, color: '#22c55e', viewId: 'players' },
                    { title: 'User Approvals', desc: `${stats.pendingUsers} pending requests`, icon: <PeopleIcon />, color: '#f59e0b', viewId: 'users' },
                ].map((action, index) => (
                    <Paper
                        key={index}
                        elevation={0}
                        onClick={() => onNavigate && onNavigate(action.viewId)}
                        sx={{
                            p: 2,
                            borderRadius: '16px',
                            bgcolor: 'white',
                            boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                            border: '1px solid rgba(0,0,0,0.04)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            '&:active': {
                                transform: 'scale(0.99)',
                                bgcolor: '#f8fafc'
                            }
                        }}
                    >
                        <Box sx={{
                            width: 44,
                            height: 44,
                            borderRadius: '12px',
                            bgcolor: `${action.color}15`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: action.color
                        }}>
                            {action.icon}
                        </Box>
                        <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="body2" fontWeight="700" color="#111827">
                                {action.title}
                            </Typography>
                            <Typography variant="caption" color="#6b7280">
                                {action.desc}
                            </Typography>
                        </Box>
                        <Box sx={{ color: '#cbd5e1' }}>
                            <KeyboardArrowDownIcon sx={{ transform: 'rotate(-90deg)' }} />
                        </Box>
                    </Paper>
                ))}
            </Box>

            {/* START PREDICTION - Floating Action Button Style */}
            <Box
                onClick={() => onNavigate && onNavigate('clientDashboard')}
                sx={{
                    position: 'fixed',
                    bottom: 24,
                    right: 24,
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #2563eb 0%, #0ea5e9 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    boxShadow: '0 8px 24px rgba(37, 99, 235, 0.4)',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    zIndex: 1000,
                    '&:hover': {
                        transform: 'scale(1.1)',
                        boxShadow: '0 12px 32px rgba(37, 99, 235, 0.5)',
                    },
                    '&:active': {
                        transform: 'scale(0.95)',
                    }
                }}
            >
                <SportsCricketIcon sx={{ fontSize: 28 }} />
            </Box>
        </Box>
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
    const [selectedItems, setSelectedItems] = useState([]);

    // Dialog States
    const [openEdit, setOpenEdit] = useState(false);
    const [openUpload, setOpenUpload] = useState(false);
    const [openGroupDialog, setOpenGroupDialog] = useState(false);
    // Random ID to prevent browser autofill
    const [fieldId] = useState(Math.random().toString(36).substring(7));
    const [selectedPlayer, setSelectedPlayer] = useState(null);
    const [playerForm, setPlayerForm] = useState({});

    // Group Selection State
    const [availableGroups, setAvailableGroups] = useState([]);
    const [selectedGroupToAdd, setSelectedGroupToAdd] = useState('');

    // Upload State
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadStatus, setUploadStatus] = useState('');
    const [profilePicFile, setProfilePicFile] = useState(null); // For single player add
    const [savingPlayer, setSavingPlayer] = useState(false); // Loading state for save button

    // Async Place Search
    const [placeInputValue, setPlaceInputValue] = useState('');
    const [placeOptions, setPlaceOptions] = useState([]);
    const [placeLoading, setPlaceLoading] = useState(false);
    const [timezoneLoading, setTimezoneLoading] = useState(false);
    const searchTimeout = React.useRef(null);

    // Location Search State
    const [locationOptions, setLocationOptions] = useState([]);
    const [locationLoading, setLocationLoading] = useState(false);
    const [allCities, setAllCities] = useState([]);

    // Load cities asynchronously to avoid blocking render
    useEffect(() => {
        setTimeout(() => {
            try {
                const cities = City.getAllCities();
                setAllCities(cities);
            } catch (e) {
                console.error("Failed to load cities", e);
            }
        }, 100);
    }, []);

    // Optimized City Search
    const searchLocations = useCallback((query) => {
        if (!query || query.length < 3) return [];
        const q = query.toLowerCase();
        const matches = [];

        if (!allCities || allCities.length === 0) return [];

        for (let i = 0; i < allCities.length; i++) {
            if (allCities[i].name.toLowerCase().includes(q)) {
                matches.push(allCities[i]);
                if (matches.length >= 50) break;
            }
        }
        return matches;
    }, [allCities]);

    const handleLocationSearch = (event, newInputValue) => {
        if (newInputValue.length >= 3) {
            setLocationLoading(true);
            const results = searchLocations(newInputValue);
            setLocationOptions(results);
            setLocationLoading(false);
        } else {
            setLocationOptions([]);
        }
    };

    // State for Viewing Chart & Table
    const [openChartDialog, setOpenChartDialog] = useState(false);
    const [selectedPlayerForChart, setSelectedPlayerForChart] = useState(null);

    // Quick Select Toggle
    const [showAllNations, setShowAllNations] = useState(false);

    // Chart Preview State for Add/Edit
    const [previewChart, setPreviewChart] = useState(null);
    const [generatingChart, setGeneratingChart] = useState(false);

    const handleViewChart = async (player) => {
        setSelectedPlayerForChart(player);
        setOpenChartDialog(true);
        if ((!player.birthChart || Object.keys(player.birthChart).length === 0) && (player.id || player._id)) {
            try {
                const pid = player.id || player._id;
                const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/players/${pid}`);
                if (res.data && res.data.birthChart) {
                    setSelectedPlayerForChart(res.data);
                }
            } catch (e) {
                console.error("Failed to load full player chart", e);
            }
        }
    };

    // Snackbar (Designed Alert)
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });
    const showSnackbar = (message, severity = 'success') => setSnackbar({ open: true, message, severity });

    // Role Filter State
    const [filterRole, setFilterRole] = useState('ALL_ROLES');

    const fetchPlayers = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/players`, {
                params: { 
                    page: page + 1, 
                    limit: rowsPerPage, 
                    search: searchTerm, 
                    place: filterPlace,
                    role: filterRole !== 'ALL_ROLES' ? filterRole : undefined
                },
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

    useEffect(() => { fetchPlayers(); }, [page, rowsPerPage, filterPlace, filterRole]);

    const handleSearch = () => { setPage(0); fetchPlayers(); };

    const handleAddClick = () => {
        setSelectedPlayer(null);
        setPlayerForm({
            role: 'BAT',
            gender: 'Male',
            birthTime: '12:00',
            isTobLocked: false,
            manualOverride: true
        });
        setProfilePicFile(null);
        setPreviewChart(null); // Reset preview
        setOpenEdit(true);
    };

    const handleEditClick = (player) => {
        setSelectedPlayer(player);
        setPlayerForm({
            name: player.name || '', profile: player.profile || '', dob: player.dob || '',
            birthTime: player.birthTime || '',
            birthPlace: player.birthPlace || '', timezone: player.timezone || '', id: player.id,
            latitude: player.latitude, longitude: player.longitude,
            role: player.role || 'BAT', gender: player.gender || '', league: player.league || '', manualStatus: player.manualStatus || '',
            isTobLocked: !!(player.isTobLocked || (player.birthTime && player.birthTime !== '12:00' && player.birthTime !== '09:00')),
            manualOverride: !!player.manualOverride
        });
        setOpenEdit(true);
        setPreviewChart(player.birthChart?.data || player.birthChart);
        setPreviewChart(null);
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

    const handleSelect = (player) => {
        const exists = selectedItems.find(item => item._id === player._id);
        if (exists) {
            setSelectedItems(selectedItems.filter(item => item._id !== player._id));
        } else {
            setSelectedItems([...selectedItems, { _id: player._id, id: player.id }]);
        }
    };

    // Generate Preview Logic
    const handleGeneratePreview = async () => {
        if (!playerForm.dob || !playerForm.birthTime || !playerForm.latitude || !playerForm.longitude) {
            showSnackbar("Please fill Date, Time, and Place/Coordinates", "error");
            return;
        }
        setGeneratingChart(true);
        try {
            const dobParts = playerForm.dob.split('-'); // YYYY-MM-DD
            const timeParts = playerForm.birthTime.split(':');
            const data = {
                year: dobParts[0], month: dobParts[1], day: dobParts[2],
                hour: timeParts[0], minute: timeParts[1],
                latitude: playerForm.latitude, longitude: playerForm.longitude,
                timezone: playerForm.timezone || 5.5
            };
            const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/charts/birth-chart`, data);
            setPreviewChart(res.data);
            showSnackbar("Chart Generated! Please Verify.", "success");
        } catch (err) {
            console.error(err);
            showSnackbar("Failed to Generate Chart", "error");
        } finally {
            setGeneratingChart(false);
        }
    };

    const handleSavePlayer = async () => {
        setSavingPlayer(true);
        try {
            if (!selectedPlayer) {
                // ADD PLAYER
                const formData = new FormData();
                Object.keys(playerForm).forEach(key => {
                    formData.append(key, playerForm[key]);
                });
                if (profilePicFile) {
                    formData.append('image', profilePicFile);
                }

                await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/players/add`, formData, {
                    headers: { 'x-auth-token': token }
                });
                showSnackbar('Player Added Successfully', 'success');
            } else {
                // EDIT PLAYER
                if (profilePicFile) {
                    // Use FormData if file exists
                    const formData = new FormData();
                    ['name', 'birthPlace', 'dob', 'birthTime', 'latitude', 'longitude', 'timezone', 'manualTimezone', 'role', 'gender', 'league', 'manualStatus', 'isTobLocked', 'manualOverride'].forEach(key => {
                        if (playerForm[key] !== undefined && playerForm[key] !== null) {
                            formData.append(key, playerForm[key]);
                        }
                    });

                    formData.append('image', profilePicFile);

                    await axios.put(`${import.meta.env.VITE_BACKEND_URL}/api/players/${selectedPlayer.id || selectedPlayer._id}`, formData, {
                        headers: { 'x-auth-token': token }
                    });
                } else {
                    await axios.put(`${import.meta.env.VITE_BACKEND_URL}/api/players/${selectedPlayer.id || selectedPlayer._id}`, playerForm, {
                        headers: { 'x-auth-token': token }
                    });
                }
                showSnackbar('Player Updated Successfully', 'success');
            }

            setOpenEdit(false);
            fetchPlayers();
        } catch (err) {
            console.error(err); showSnackbar(err.response?.data?.message || "Operation failed", 'error');
        } finally {
            setSavingPlayer(false);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) return;
        setUploadStatus('Uploading...');
        const formData = new FormData();
        formData.append('file', selectedFile);
        try {
            await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/players/upload`, formData, {
                headers: { 'x-auth-token': token }
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

    const fetchTimezone = (lat, long) => {
        console.log(`Calculating timezone for lat: ${lat}, long: ${long}`);

        const lonNum = parseFloat(long);
        if (isNaN(lonNum)) {
            console.error("Invalid longitude for calculation:", long);
            return null;
        }

        // Step 1: calculate raw offset
        let offset = lonNum / 15;

        // Step 2: round to nearest 0.5 (half hour) for accurate timezones like India 5.5
        offset = Math.round(offset * 2) / 2;

        // Step 3: clamp to valid timezone range
        if (offset > 14) offset = 14;
        if (offset < -12) offset = -12;

        console.log('Calculated Offset:', offset);
        return offset;
    };

    const handlePlaceInputChange = (e, val) => {
        setPlaceInputValue(val);
        setPlayerForm(prev => ({ ...prev, birthPlace: val }));
        if (searchTimeout.current) clearTimeout(searchTimeout.current);
        searchTimeout.current = setTimeout(() => fetchPlaces(val), 800);
    };

    const handlePlaceChange = async (e, val) => {
        console.log('Place Selected:', val);
        if (val && typeof val === 'object') {
            // Selected from list
            // Update place first
            setPlayerForm(prev => ({ ...prev, birthPlace: val.label, latitude: val.lat, longitude: val.long }));

            // Check for valid lat/long before fetching
            // Use explicit undefined check to allow 0 (Equator/Prime Meridian)
            if (val.lat !== undefined && val.long !== undefined) {
                setTimezoneLoading(true);
                try {
                    const tz = fetchTimezone(val.lat, val.long);
                    if (tz !== null) {
                        console.log('Setting Timezone:', tz);
                        setPlayerForm(prev => ({ ...prev, timezone: tz, manualTimezone: false }));
                    } else {
                        console.warn('Could not calculate timezone.');
                    }
                } catch (error) {
                    console.error("Error updating timezone:", error);
                } finally {
                    setTimezoneLoading(false);
                }
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
                    setPlayerForm(prev => ({
                        ...prev,
                        birthPlace: bestMatch.display_name,
                        latitude: lat,
                        longitude: long
                    }));

                    // 3. Fetch Timezone
                    setTimezoneLoading(true);
                    const tz = fetchTimezone(lat, long);

                    setPlayerForm(prev => ({
                        ...prev,
                        timezone: tz !== null ? tz : prev.timezone,
                        manualTimezone: tz !== null ? false : prev.manualTimezone
                    }));
                    setTimezoneLoading(false);

                } else {
                    console.warn('No match found for manual entry');
                    // Optional: Warning toast
                }
            } catch (err) {
                console.error('Auto-resolve error:', err);
            } finally {
                setPlaceLoading(false);
                // Ensure timezone loading is off if we missed the inner finally
                setTimezoneLoading(false);
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
                <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 1, width: isMobile ? '100%' : 'auto', flexWrap: 'wrap' }}>
                    <TextField size="small" label="Search" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} fullWidth={isMobile} />
                    <TextField size="small" label="Place" value={filterPlace} onChange={(e) => setFilterPlace(e.target.value)} fullWidth={isMobile} />
                    <TextField 
                        select 
                        size="small" 
                        label="Role" 
                        value={filterRole} 
                        onChange={(e) => { setFilterRole(e.target.value); setPage(0); }} 
                        fullWidth={isMobile}
                        sx={{ minWidth: 140 }}
                        SelectProps={{ native: true }}
                    >
                        <option value="ALL_ROLES">All Roles</option>
                        <option value="BAT">🏏 Batsman</option>
                        <option value="BOWL">🥎 Bowler</option>
                        <option value="ALL">⚔️ All-Rounder</option>
                    </TextField>
                    <Button variant="contained" onClick={handleSearch} fullWidth={isMobile}>Search</Button>
                </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                {selectedItems.length > 0 && <Button variant="contained" color="secondary" onClick={handleOpenGroupDialog} size="small">Add to Team ({selectedItems.length})</Button>}
                <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddClick} size="small">Add</Button>
                <Button variant="outlined" onClick={() => setOpenUpload(true)} size="small">Upload</Button>
            </Box>

            <TableContainer component={Paper} sx={{ maxHeight: '75vh', overflow: 'auto', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.08)' }}>
                <Table stickyHeader size={isMobile ? "small" : "medium"}>
                    <TableHead>
                        <TableRow>
                            <TableCell padding="checkbox">
                                <Typography variant="subtitle2">Chk</Typography>
                            </TableCell>
                            {/* ID Header Removed */}
                            <TableCell>Name</TableCell>
                            {!isMobile && <TableCell>Place</TableCell>}
                            <TableCell>Action</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {players.map((p) => (
                            <TableRow key={p._id} hover>
                                <TableCell padding="checkbox">
                                    <input type="checkbox" checked={selectedItems.some(item => item._id === p._id)} onChange={() => handleSelect(p)} style={{ width: 18, height: 18, cursor: 'pointer' }} />
                                </TableCell>
                                {/* ID Cell Removed */}
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
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, flexWrap: 'wrap' }}>
                                                <Typography variant="body2" fontWeight="bold" color="#08101cff">{p.name}</Typography>
                                                <Chip 
                                                    label={p.role || 'BAT'} 
                                                    size="small" 
                                                    sx={{ 
                                                        height: 18, fontSize: '0.62rem', fontWeight: 700,
                                                        bgcolor: p.role === 'BAT' ? '#e0f2fe' : p.role === 'BOWL' ? '#fce7f3' : '#fef3c7',
                                                        color: p.role === 'BAT' ? '#0369a1' : p.role === 'BOWL' ? '#be185d' : '#b45309'
                                                    }} 
                                                />
                                                {p.manualOverride && (
                                                    <Tooltip title="Reviewed & Locked in DB (Protected from Live Scrape overwrite)">
                                                        <Chip 
                                                            label="🛡️ DB Locked" 
                                                            size="small" 
                                                            sx={{ height: 18, fontSize: '0.62rem', fontWeight: 700, bgcolor: '#f3e8ff', color: '#7e22ce' }} 
                                                        />
                                                    </Tooltip>
                                                )}
                                                {(p.isTobLocked || (p.birthTime && p.birthTime !== '12:00' && p.birthTime !== '09:00')) && (
                                                    <Tooltip title={`Custom TOB: ${p.birthTime || '12:00'} (Locked & Protected)`}>
                                                        <Chip 
                                                            label={`🔒 ${p.birthTime || '12:00'}`} 
                                                            size="small" 
                                                            sx={{ height: 18, fontSize: '0.62rem', fontWeight: 700, bgcolor: '#e0f2fe', color: '#0369a1' }} 
                                                        />
                                                    </Tooltip>
                                                )}
                                            </Box>
                                            <Typography variant="caption" color="textSecondary">
                                                {p.dob || 'No DOB'} {p.birthTime ? `• 🕒 ${p.birthTime}` : ''} {isMobile && p.birthPlace ? `• 📍 ${p.birthPlace}` : ''}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </TableCell>
                                {!isMobile && <TableCell>{p.birthPlace}</TableCell>}
                                <TableCell>
                                    <IconButton size="small" onClick={() => handleViewChart(p)} color="info" title="View Chart">
                                        <DescriptionIcon />
                                    </IconButton>
                                    <IconButton size="small" onClick={() => handleEditClick(p)} color="primary"><EditIcon /></IconButton>
                                    <IconButton size="small" onClick={() => handleDeleteClick(p.id || p._id)} color="error"><DeleteIcon /></IconButton>
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
                <DialogTitle sx={{ color: '#1a202c' }}>{selectedPlayer ? 'Edit Player' : 'Add Player'}</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1, color: '#1a202c' }}>
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
                                    Profile Photo (Optional)
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

                        <TextField label="Name" value={playerForm.name || ''} onChange={(e) => setPlayerForm({ ...playerForm, name: e.target.value })} fullWidth size="small" />
                        {/* Optimized Information Note */}
                        <Typography variant="caption" sx={{ color: '#64748b', mb: 1 }}>
                            🚀 <b>Fast Search:</b> Type at least 3 letters to find any city instantly.
                        </Typography>

                        {/* Single Line Fast Location Search */}
                        <Autocomplete
                            options={locationOptions}
                            getOptionLabel={(option) => {
                                const country = Country.getCountryByCode(option.countryCode);
                                const state = State.getStateByCodeAndCountry(option.stateCode, option.countryCode);
                                return `${option.name}, ${state?.name || option.stateCode}, ${country?.name || option.countryCode}`;
                            }}
                            filterOptions={(x) => x} // Disable built-in filtering, we do it manually
                            loading={locationLoading}
                            onInputChange={handleLocationSearch}
                            onChange={(event, val) => {
                                if (val) {
                                    const country = Country.getCountryByCode(val.countryCode);
                                    const state = State.getStateByCodeAndCountry(val.stateCode, val.countryCode);
                                    const birthPlace = `${val.name}, ${state?.name || val.stateCode}, ${country?.name || val.countryCode}`;

                                    const lat = parseFloat(val.latitude);
                                    const long = parseFloat(val.longitude);

                                    // Calculate Timezone
                                    let tzOffset = '';
                                    try {
                                        // 1. Try strict lookup by country
                                        const timezones = ct.getTimezonesForCountry(val.countryCode);
                                        if (timezones && timezones.length > 0) {
                                            // Simple logic: grab first. For large countries like USA/Russia this is inaccurate, 
                                            // but 'ct' doesn't map cities to TZs directly without lat/long lookup.
                                            // Better: Use Lat/Long lookup if available
                                            if (lat && long) {
                                                const tz = fetchTimezone(lat, long);
                                                if (tz !== null) tzOffset = tz;
                                                else tzOffset = timezones[0].utcOffset / 60;
                                            } else {
                                                tzOffset = timezones[0].utcOffset / 60;
                                            }
                                        }
                                    } catch (e) {
                                        console.error("TZ Error", e);
                                    }

                                    setPlayerForm(prev => ({
                                        ...prev,
                                        birthPlace: birthPlace,
                                        latitude: lat,
                                        longitude: long,
                                        timezone: tzOffset,
                                        manualTimezone: false
                                    }));
                                }
                            }}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="📍 Search City (Type 3+ letters)"
                                    fullWidth
                                    size="small"
                                    name={`add_player_location_search_${fieldId}`}
                                    id={`add_player_location_search_${fieldId}`}
                                    inputProps={{
                                        ...params.inputProps,
                                        autoComplete: 'new-password', // Force disable autofill
                                    }}
                                    helperText="Global City Search (High Speed Index)"
                                />
                            )}
                            renderOption={(props, option) => {
                                const country = Country.getCountryByCode(option.countryCode);
                                const state = State.getStateByCodeAndCountry(option.stateCode, option.countryCode);
                                return (
                                    <li {...props} key={`${option.name}-${option.countryCode}-${option.stateCode}`}>
                                        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                            <Typography variant="body2" fontWeight="bold">{option.name}</Typography>
                                            <Typography variant="caption" color="textSecondary">
                                                {state?.name}, {country?.name}
                                            </Typography>
                                        </Box>
                                    </li>
                                );
                            }}
                        />




                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <TextField
                                label="Timezone (Auto)"
                                value={playerForm.timezone || ''}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setPlayerForm(prev => ({ ...prev, timezone: val }));
                                }}
                                InputProps={{
                                    readOnly: !playerForm.manualTimezone,
                                    endAdornment: (
                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                            {timezoneLoading ? (
                                                <CircularProgress size={20} />
                                            ) : (
                                                <IconButton
                                                    size="small"
                                                    onClick={async (e) => {
                                                        e.stopPropagation(); // Prevent bubbling issues
                                                        if (playerForm.latitude && playerForm.longitude) {
                                                            console.log('Manual refresh clicked');
                                                            setTimezoneLoading(true);
                                                            try {
                                                                const tz = await fetchTimezone(playerForm.latitude, playerForm.longitude);
                                                                if (tz !== null) {
                                                                    setPlayerForm(prev => ({ ...prev, timezone: tz, manualTimezone: false }));
                                                                }
                                                            } finally {
                                                                setTimezoneLoading(false);
                                                            }
                                                        } else {
                                                            alert("Please select a valid place first");
                                                        }
                                                    }}
                                                    title="Refresh Timezone"
                                                    disabled={!playerForm.latitude}
                                                    sx={{
                                                        ml: 1,
                                                        zIndex: 10,
                                                        color: '#2563eb', // Explicit primary color
                                                        visibility: 'visible !important', // Force show
                                                        opacity: 1
                                                    }}
                                                >
                                                    <Box component="span" sx={{ fontSize: '1.2rem', cursor: 'pointer', lineHeight: 1 }}>↻</Box>
                                                </IconButton>
                                            )}
                                        </div>
                                    )
                                }}
                                fullWidth
                                size="small"
                                variant={playerForm.manualTimezone ? "outlined" : "filled"}
                                type="number"
                            />
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={!!playerForm.manualTimezone}
                                        onChange={(e) => setPlayerForm({ ...playerForm, manualTimezone: e.target.checked })}
                                        size="small"
                                    />
                                }
                                label={<Typography variant="caption">Manual</Typography>}
                            />
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <TextField
                                label="Latitude"
                                value={playerForm.latitude || ''}
                                onChange={(e) => setPlayerForm({ ...playerForm, latitude: e.target.value })}
                                fullWidth
                                size="small"
                                type="number"
                                inputProps={{ step: "0.0001" }}
                                placeholder="e.g. 13.0827"
                            />
                            <TextField
                                label="Longitude"
                                value={playerForm.longitude || ''}
                                onChange={(e) => setPlayerForm({ ...playerForm, longitude: e.target.value })}
                                fullWidth
                                size="small"
                                type="number"
                                inputProps={{ step: "0.0001" }}
                                placeholder="e.g. 80.2707"
                            />
                        </Box>
                        <TextField
                            label="Date of Birth"
                            type="date"
                            value={playerForm.dob || ''}
                            onChange={(e) => setPlayerForm({ ...playerForm, dob: e.target.value })}
                            fullWidth
                            size="small"
                            InputLabelProps={{ shrink: true }}
                        />
                        <TextField
                            label="Birth Time"
                            type="time"
                            value={playerForm.birthTime || ''}
                            onChange={(e) => setPlayerForm({ ...playerForm, birthTime: e.target.value, isTobLocked: true })}
                            fullWidth
                            size="small"
                            InputLabelProps={{ shrink: true }}
                        />

                        {/* Lock & Protection Controls */}
                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', p: 1.5, bgcolor: '#f8fafc', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.06)' }}>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={!!playerForm.isTobLocked}
                                        onChange={(e) => setPlayerForm({ ...playerForm, isTobLocked: e.target.checked })}
                                        size="small"
                                        color="primary"
                                    />
                                }
                                label={<Typography variant="body2" fontWeight="600" color="#0369a1">🔒 Lock Custom TOB</Typography>}
                            />
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={!!playerForm.manualOverride}
                                        onChange={(e) => setPlayerForm({ ...playerForm, manualOverride: e.target.checked })}
                                        size="small"
                                        color="secondary"
                                    />
                                }
                                label={<Typography variant="body2" fontWeight="600" color="#7e22ce">🛡️ Manual DB Locked</Typography>}
                            />
                        </Box>

                        {/* ROLE SELECTION */}
                        <Box sx={{ mt: 1 }}>
                            <Typography variant="caption" sx={{ mb: 0.5, display: 'block', color: '#A0AEC0' }}>Role</Typography>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                {['BAT', 'BOWL', 'ALL'].map((role) => (
                                    <Button
                                        key={role}
                                        variant={playerForm.role === role ? 'contained' : 'outlined'}
                                        color={playerForm.role === role ? 'primary' : 'inherit'}
                                        onClick={() => setPlayerForm({ ...playerForm, role: role })}
                                        fullWidth
                                        size="small"
                                        sx={{ borderRadius: '8px' }}
                                    >
                                        {role}
                                    </Button>
                                ))}
                            </Box>
                        </Box>

                        {/* GENDER SELECTION */}
                        <Box sx={{ mt: 1 }}>
                            <Typography variant="caption" sx={{ mb: 0.5, display: 'block', color: '#A0AEC0' }}>Gender</Typography>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                {["Male", "Female", ""].map((g) => (
                                    <Button
                                        key={g || 'none'}
                                        variant={playerForm.gender === g ? "contained" : "outlined"}
                                        color={playerForm.gender === g ? "secondary" : "inherit"}
                                        onClick={() => setPlayerForm({ ...playerForm, gender: g })}
                                        fullWidth
                                        size="small"
                                        sx={{ borderRadius: "8px" }}
                                    >
                                        {g || "Not Set"}
                                    </Button>
                                ))}
                            </Box>
                        </Box>

                        {/* LEAGUE ENTRY */}
                        <Box sx={{ mt: 1 }}>
                            <Typography variant="caption" sx={{ mb: 0.5, display: 'block', color: '#A0AEC0' }}>League</Typography>
                        <TextField
                        placeholder="e.g. IPL, BBL, PSL, SAT20, MLC, Hundred, BPL, CPL"
                        value={playerForm.league || ""}
                        onChange={(e) => setPlayerForm({ ...playerForm, league: e.target.value })}
                        fullWidth
                        size="small"
                        />
                        </Box>

                        {/* MANUAL STATUS ENTRY */}
                        <Box sx={{ mt: 1 }}>
                            <Typography variant="caption" sx={{ mb: 0.5, display: 'block', color: '#A0AEC0' }}>Manual Status (e.g. Good, Avg)</Typography>
                            <TextField
                                placeholder="Good, Avg, Flop..."
                                value={playerForm.manualStatus || ''}
                                onChange={(e) => setPlayerForm({ ...playerForm, manualStatus: e.target.value })}
                                fullWidth
                                size="small"
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        '& fieldset': {
                                            borderColor: (() => {
                                                const status = (playerForm.manualStatus || '').toLowerCase();
                                                if (status.includes('good')) return '#4caf50'; // Green
                                                if (status.includes('ok')) return '#8bc34a'; // Light Green
                                                if (status.includes('avg')) return '#2196f3'; // Blue
                                                if (status.includes('flop')) return '#f44336'; // Red
                                                return 'rgba(255, 255, 255, 0.2)';
                                            })(),
                                            borderWidth: playerForm.manualStatus ? '2px' : '1px'
                                        },
                                        backgroundColor: (() => {
                                            const status = (playerForm.manualStatus || '').toLowerCase();
                                            // Slight bg tint
                                            if (status.includes('good')) return 'rgba(76, 175, 80, 0.1)';
                                            if (status.includes('flop')) return 'rgba(244, 67, 54, 0.1)';
                                            return 'transparent';
                                        })()
                                    }
                                }}
                            />
                        </Box>



                        {/* CHART PREVIEW SECTION */}
                        {previewChart && (
                            <Box sx={{ mt: 3, p: 2, border: '1px solid rgba(0,0,0,0.1)', borderRadius: 2, bgcolor: '#fff' }}>
                                <Typography variant="subtitle2" gutterBottom>Rasi Chart Verification</Typography>
                                <Box sx={{ height: 300, width: '100%', display: 'flex', justifyContent: 'center' }}>
                                    <RasiChart data={previewChart} style={{ width: '100%', height: '100%' }} />
                                </Box>
                                {previewChart.nakshatra && (
                                    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'center' }}>
                                        {previewChart.moonSign && (
                                            <Typography variant="body1" align="center" sx={{ fontWeight: 'bold', color: 'secondary.main' }}>
                                                Rasi: {previewChart.moonSign.name} ({previewChart.moonSign.tamil})
                                                {previewChart.moonSign.lord && ` - Rasi Athipathi (ராசி அதிபதி): ${previewChart.moonSign.lord} (${{
                                                    'Sun': 'சூரியன்', 'Moon': 'சந்திரன்', 'Mars': 'செவ்வாய்', 'Mercury': 'புதன்',
                                                    'Jupiter': 'குரு', 'Venus': 'சுக்கிரன்', 'Saturn': 'சனி', 'Rahu': 'ராகு', 'Ketu': 'கேது'
                                                }[previewChart.moonSign.lord] || previewChart.moonSign.lordTamil || '-'})`}
                                            </Typography>
                                        )}
                                        <Typography variant="body1" align="center" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                                            Star: {previewChart.nakshatra.name} ({previewChart.nakshatra.tamil})
                                            {previewChart.nakshatra.lord && ` - Star Athipathi (நட்சத்திர அதிபதி): ${previewChart.nakshatra.lord} (${{
                                                'Sun': 'சூரியன்', 'Moon': 'சந்திரன்', 'Mars': 'செவ்வாய்', 'Mercury': 'புதன்',
                                                'Jupiter': 'குரு', 'Venus': 'சுக்கிரன்', 'Saturn': 'சனி', 'Rahu': 'ராகு', 'Ketu': 'கேது'
                                            }[previewChart.nakshatra.lord] || '-'})`}
                                        </Typography>
                                    </Box>
                                )}
                                <Typography variant="caption" color="textSecondary" align="center" display="block" sx={{ mt: 1 }}>
                                    Check if planets are in correct signs.
                                </Typography>
                            </Box>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenEdit(false)} disabled={savingPlayer}>Cancel</Button>

                    {!previewChart ? (
                        <Button
                            onClick={handleGeneratePreview}
                            variant="contained"
                            color="warning"
                            disabled={generatingChart}
                            startIcon={generatingChart ? <CircularProgress size={16} /> : <DescriptionIcon />}
                        >
                            {generatingChart ? "Generating..." : "Generate Rasi Chart"}
                        </Button>
                    ) : (
                        <>
                            <Button onClick={() => setPreviewChart(null)} color="secondary">
                                Edit Details
                            </Button>
                            <Button
                                onClick={handleSavePlayer}
                                variant="contained"
                                color="success"
                                disabled={savingPlayer}
                                startIcon={savingPlayer ? <CircularProgress size={16} color="inherit" /> : null}
                            >
                                {savingPlayer ? 'Saving...' : 'Save Player'}
                            </Button>
                        </>
                    )}
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
                        <Button variant="text" onClick={downloadSampleTemplate} sx={{ mt: 1 }} startIcon={<span style={{ fontSize: '1.2rem' }}>📥</span>}>
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
                                                playerIds: selectedItems.map(item => item.id).filter(Boolean)
                                            }, { headers: { 'x-auth-token': token } });
                                            showSnackbar(`Added to ${g.name}`, 'success');
                                            setOpenGroupDialog(false);
                                            setSelectedItems([]);
                                        } catch (e) { console.error(e); }
                                    }}
                                >
                                    {g.name}
                                </Button>
                            ))
                        ) : (
                            <Typography>No active teams found. Create one in Groups tab.</Typography>
                        )}

                        <Divider sx={{ my: 1 }}>OR</Divider>

                        <Autocomplete
                            freeSolo
                            options={CRICKET_TEAMS}
                            value={selectedGroupToAdd}
                            onChange={(event, newValue) => setSelectedGroupToAdd(newValue)}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Select/Type Team Name"
                                    fullWidth
                                    variant="outlined"
                                    helperText="Type to search existing cricket teams"
                                />
                            )}
                        />
                        <Button
                            variant="contained"
                            disabled={!selectedGroupToAdd}
                            onClick={async () => {
                                try {
                                    // First check if group exists, if not create it on the fly?
                                    // For now, let's assume 'add to team' implies adding to an existing group or creating if logic supports.
                                    // The current backend 'api/groups/add' likely expects an existing group name or creates it?
                                    // Let's use the same endpoint. If backend supports creation by name, this works.
                                    await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/groups/add`, {
                                        groupName: selectedGroupToAdd,
                                        playerIds: selectedItems.map(item => item.id).filter(Boolean)
                                    }, { headers: { 'x-auth-token': token } });
                                    showSnackbar(`Added to ${selectedGroupToAdd}`, 'success');
                                    setOpenGroupDialog(false);
                                    setSelectedItems([]);
                                    setSelectedGroupToAdd('');
                                } catch (e) {
                                    console.error(e);
                                    showSnackbar('Failed to add to team. Ensure team exists.', 'error');
                                }
                            }}
                        >
                            Add to "{selectedGroupToAdd}"
                        </Button>

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
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                        <Typography variant="h6" fontWeight="bold" sx={{ color: '#1a202c' }}>
                            {selectedPlayerForChart?.name}'s Horoscope ({selectedPlayerForChart?.dob} {selectedPlayerForChart?.birthTime ? `| 🕒 ${selectedPlayerForChart.birthTime}` : ''})
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            {selectedPlayerForChart?.manualOverride && (
                                <Chip label="🛡️ DB Locked" size="small" sx={{ bgcolor: '#f3e8ff', color: '#7e22ce', fontWeight: 700, fontSize: '0.72rem' }} />
                            )}
                            {(selectedPlayerForChart?.isTobLocked || (selectedPlayerForChart?.birthTime && selectedPlayerForChart?.birthTime !== '12:00' && selectedPlayerForChart?.birthTime !== '09:00')) && (
                                <Chip label={`🔒 TOB Locked: ${selectedPlayerForChart?.birthTime || '12:00'}`} size="small" sx={{ bgcolor: '#e0f2fe', color: '#0369a1', fontWeight: 700, fontSize: '0.72rem' }} />
                            )}
                        </Box>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    {selectedPlayerForChart && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, mt: 1 }}>
                            {/* Rasi Chart */}
                            <Box sx={{ p: 1, backgroundColor: '#fff', borderRadius: 2, boxShadow: 1 }}>
                                {selectedPlayerForChart.birthChart ? (
                                    <RasiChart data={selectedPlayerForChart.birthChart} style={{ width: '100%' }} />
                                ) : (
                                    <Typography color="error">Birth Chart Data Not Available</Typography>
                                )}
                            </Box>

                            {/* Rasi Athipathi & Nakshatra Athipathi Summary */}
                            {(() => {
                                const chart = selectedPlayerForChart.birthChart?.data || selectedPlayerForChart.birthChart;
                                if (!chart) return null;

                                // Moon Sign & Rasi Athipathi
                                const moonObj = chart.moonSign || chart.planets?.Moon || {};
                                const sId = getSignId(moonObj.name || moonObj.sign || moonObj.signTamil || moonObj.longitude);
                                const rasiName = moonObj.tamil || moonObj.signTamil || (sId ? tamilSigns[sId] : (moonObj.name || moonObj.sign || '-'));
                                const rasiLordRaw = moonObj.lord || moonObj.signLord || (sId ? signLords[sId] : null);
                                const rasiLord = moonObj.lordTamil || moonObj.signLordTamil || (rasiLordRaw ? (signLordsTamil[rasiLordRaw] || rasiLordRaw) : '-');

                                // Nakshatra & Nakshatra Athipathi
                                const nakObj = chart.nakshatra || chart.moonNakshatra || chart.planets?.Moon?.nakshatra || {};
                                const nakNameRaw = typeof nakObj === 'string' ? nakObj : (nakObj.name || nakObj.tamil || chart.planets?.Moon?.nakshatraTamil || '');
                                const nakName = nakshatraTamilMap[nakNameRaw] || nakNameRaw || '-';
                                const nakLordRaw = typeof nakObj === 'object' ? (nakObj.lord || nakObj.nakshatraLord || chart.planets?.Moon?.nakshatraLord) : null;
                                const resolvedNakLord = nakLordRaw || (nakNameRaw ? getNakshatraLordHelper(nakNameRaw) : null);
                                const nakLord = nakObj.lordTamil || chart.planets?.Moon?.nakshatraLordTamil || (resolvedNakLord ? (signLordsTamil[resolvedNakLord] || resolvedNakLord) : '-');

                                return (
                                    <Box sx={{
                                        width: '100%',
                                        maxWidth: 340,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 1.2,
                                        p: 2,
                                        bgcolor: '#f8fafc',
                                        borderRadius: '12px',
                                        border: '1px solid #e2e8f0',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                                    }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1.2, bgcolor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                            <Typography variant="body2" color="text.secondary" fontWeight="500">
                                                ராசி: <strong style={{ color: '#1e293b' }}>{rasiName}</strong>
                                            </Typography>
                                            <Typography variant="body2" fontWeight="700" sx={{ color: '#047857' }}>
                                                ராசி அதிபதி: {rasiLord}
                                            </Typography>
                                        </Box>

                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1.2, bgcolor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                            <Typography variant="body2" color="text.secondary" fontWeight="500">
                                                நட்சத்திரம்: <strong style={{ color: '#1e293b' }}>{nakName}</strong>
                                            </Typography>
                                            <Typography variant="body2" fontWeight="700" sx={{ color: '#1d4ed8' }}>
                                                நட்சத்திர அதிபதி: {nakLord}
                                            </Typography>
                                        </Box>
                                    </Box>
                                );
                            })()}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenChartDialog(false)}>Close</Button>
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
    const [newLeagueType, setNewLeagueType] = useState('General'); // Default to General or T20?
    const [creatingGroup, setCreatingGroup] = useState(false);

    // Add Player to Group State
    const [playerSearchTerm, setPlayerSearchTerm] = useState('');
    const [allPlayersList, setAllPlayersList] = useState([]);
    const [searchingPlayers, setSearchingPlayers] = useState(false);
    const [selectedExistingPlayer, setSelectedExistingPlayer] = useState(null);
    const [savingPlayer, setSavingPlayer] = useState(false);

    // Collapsible Sections State
    const [expandedSections, setExpandedSections] = useState(new Set(['T20'])); // T20 open by default
    const toggleSection = (title) => {
        const newSet = new Set(expandedSections);
        if (newSet.has(title)) newSet.delete(title);
        else newSet.add(title);
        setExpandedSections(newSet);
    };

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

            const roleOrder = { 'BAT': 1, 'WK': 1.5, 'ALL': 2, 'BOWL': 3 };
            const sortedData = res.data.map(group => {
                if (group.players && group.players.length > 0) {
                    group.players.sort((a, b) => {
                        const roleA = roleOrder[a.role?.toUpperCase()] || 99;
                        const roleB = roleOrder[b.role?.toUpperCase()] || 99;
                        if (roleA !== roleB) return roleA - roleB;
                        return (a.name || '').localeCompare(b.name || '');
                    });
                }
                return group;
            });

            setGroups(sortedData);

            // Update selected group if open (to reflect removals)
            if (selectedGroup) {
                const updated = sortedData.find(g => g._id === selectedGroup._id);
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
        setCreatingGroup(true);
        try {
            await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/groups/create`,
                { name: newGroupName, leagueType: newLeagueType },
                { headers: { 'x-auth-token': token } }
            );
            showSnackbar('Group created successfully', 'success');
            setNewGroupName('');
            setOpenCreate(false);
            fetchGroups();
        } catch (err) {
            showSnackbar(err.response?.data?.msg || 'Failed to create group', 'error');
        } finally {
            setCreatingGroup(false);
        }
    };

    const handleDeleteGroup = async (id) => {
        try {
            await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/api/groups/${id}`, {
                headers: { 'x-auth-token': token }
            });
            fetchGroups();
        } catch (err) {
            console.error(err);
        }
    };

    const handleMoveGroup = async (id, leagueType) => {
        try {
            await axios.put(`${import.meta.env.VITE_BACKEND_URL}/api/groups/update-type/${id}`,
                { leagueType },
                { headers: { 'x-auth-token': token } }
            );
            showSnackbar(`Moved to ${leagueType}`, 'success');
            fetchGroups();
        } catch (err) {
            console.error(err);
            showSnackbar('Failed to move group', 'error');
        }
    };

    const handleClearGroup = async (id) => {
        try {
            await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/groups/clear`, { id }, {
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
        try {
            await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/groups/remove`, {
                groupName,
                playerId
            }, { headers: { 'x-auth-token': token } });
            fetchGroups();
        } catch (err) {
            console.error(err);
            showSnackbar('Failed to remove player', 'error');
        }
    };

    const openManageDialog = (group) => {
        setSelectedGroup(group);
        setOpenManage(true);
    };

    const [openEdit, setOpenEdit] = useState(false);
    const [editingPlayer, setEditingPlayer] = useState(null);

    const parseDobToIso = (dobStr) => {
        if (!dobStr) return '';
        const str = String(dobStr).trim();
        if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.slice(0, 10);
        const m = str.match(/([a-zA-Z]+)\s+(\d{1,2}),?\s+(\d{4})/);
        if (m) {
            const monthMap = { jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06', jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12' };
            const mm = monthMap[m[1].toLowerCase().slice(0, 3)] || '01';
            const dd = String(m[2]).padStart(2, '0');
            return `${m[3]}-${mm}-${dd}`;
        }
        return '';
    };

    const handleEditClick = (player) => {
        setEditingPlayer({
            ...player,
            dob: parseDobToIso(player.dob),
            birthTime: player.birthTime || '12:00',
            birthPlace: player.birthPlace || '',
            latitude: player.latitude || 13.0827,
            longitude: player.longitude || 80.2707,
            timezone: player.timezone || 5.5,
            role: player.role || 'BAT'
        });
        setOpenEdit(true);
    };

    const handleSaveEdit = async () => {
        if (!editingPlayer) return;
        setSavingPlayer(true);
        try {
            if (editingPlayer._id) {
                // UPDATE
                await axios.put(`${import.meta.env.VITE_BACKEND_URL}/api/players/${editingPlayer._id}`, editingPlayer, {
                    headers: { 'x-auth-token': token }
                });
                showSnackbar('Player updated successfully', 'success');
            } else {
                // CREATE AND ADD TO GROUP
                const newPlayerData = {
                    ...editingPlayer,
                    role: editingPlayer.role || 'BAT',
                    profile: 'default.png',
                    latitude: editingPlayer.latitude || 13.0827,
                    longitude: editingPlayer.longitude || 80.2707,
                    timezone: editingPlayer.timezone || 5.5
                };

                const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/players/add`, newPlayerData, {
                    headers: { 'x-auth-token': token }
                });

                const newPlayer = res.data;

                // Add to current group
                await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/groups/add`, {
                    groupName: selectedGroup.name,
                    playerIds: [newPlayer.id]
                }, { headers: { 'x-auth-token': token } });

                showSnackbar(`Created and added ${newPlayer.name}`, 'success');
            }
            setOpenEdit(false);
            fetchGroups();
        } catch (err) {
            console.error(err);
            showSnackbar(err.response?.data?.message || 'Failed to save player', 'error');
        } finally {
            setSavingPlayer(false);
        }
    };

    const searchAllPlayers = async (query) => {
        if (!query || query.length < 2) return;
        setSearchingPlayers(true);
        try {
            const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/players`, {
                params: { search: query, limit: 10 },
                headers: { 'x-auth-token': token }
            });
            const roleOrder = { 'BAT': 1, 'WK': 1.5, 'ALL': 2, 'BOWL': 3 };
            const players = res.data.players || [];
            players.sort((a, b) => {
                const roleA = roleOrder[a.role?.toUpperCase()] || 99;
                const roleB = roleOrder[b.role?.toUpperCase()] || 99;
                if (roleA !== roleB) return roleA - roleB;
                return (a.name || '').localeCompare(b.name || '');
            });
            setAllPlayersList(players);
        } catch (err) {
            console.error(err);
        } finally {
            setSearchingPlayers(false);
        }
    };

    const handleAddExistingToGroup = async () => {
        if (!selectedExistingPlayer || !selectedGroup) return;
        try {
            await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/groups/add`, {
                groupName: selectedGroup.name,
                playerIds: [selectedExistingPlayer.id]
            }, { headers: { 'x-auth-token': token } });

            showSnackbar(`Added ${selectedExistingPlayer.name} to ${selectedGroup.name}`, 'success');
            setSelectedExistingPlayer(null);
            setPlayerSearchTerm('');
            fetchGroups();
        } catch (err) {
            console.error(err);
            showSnackbar('Failed to add player', 'error');
        }
    };

    const handlePrintTeam = (group) => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert('Please allow popups to print teams.');
            return;
        }

        const TAMIL_PLANETS = {
            'Sun': 'சூரி', 'Moon': 'சந்', 'Mars': 'செவ்', 'Mercury': 'புத',
            'Jupiter': 'குரு', 'Venus': 'சுக்', 'Saturn': 'சனி', 'Rahu': 'ராகு', 'Ketu': 'கேது'
        };

        let html = `
            <html>
            <head>
                <title>Print - ${group.name}</title>
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; }
                    h2 { color: #1e3a8a; text-align: center; margin-bottom: 20px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.05); }
                    th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                    th { background-color: #f4f6f9; font-weight: bold; color: #333; }
                    tr:nth-child(even) { background-color: #f9fafb; }
                    .index-col { width: 40px; text-align: center; }
                    .tick-col { width: 40px; }
                </style>
            </head>
            <body>
                <h2>${group.name}</h2>
                <table>
                    <thead>
                        <tr>
                            <th class="index-col">#</th>
                            <th>Player Name (வீரர்)</th>
                            <th>Rasi Athipathi (ராசி அதிபதி)</th>
                            <th>Natchathira Athipathi (நட்சத்திர அதிபதி)</th>
                            <th class="tick-col"></th>
                            <th class="tick-col"></th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        if (group.players && group.players.length > 0) {
            const roleOrder = { 'BAT': 1, 'WK': 1.5, 'ALL': 2, 'BOWL': 3 };
            const sortedPlayers = [...group.players].sort((a, b) => {
                const roleA = roleOrder[a.role?.toUpperCase()] || 99;
                const roleB = roleOrder[b.role?.toUpperCase()] || 99;
                if (roleA !== roleB) return roleA - roleB;
                return (a.name || '').localeCompare(b.name || '');
            });

            sortedPlayers.forEach((p, idx) => {
                const engNakLord = p.birthChart?.planets?.Moon?.nakshatraLord || '-';
                const engRasiLord = p.birthChart?.planets?.Moon?.signLord || '-';
                const nakLord = TAMIL_PLANETS[engNakLord] || engNakLord;
                const rasiLord = TAMIL_PLANETS[engRasiLord] || engRasiLord;

                html += `
                    <tr>
                        <td class="index-col">${idx + 1}</td>
                        <td style="font-weight: 600;">${p.name || '-'} <span style="font-size: 0.8em; color: #666;">(${p.role || 'BAT'})</span></td>
                        <td>${rasiLord}</td>
                        <td>${nakLord}</td>
                        <td></td>
                        <td></td>
                    </tr>
                `;
            });
        } else {
            html += `<tr><td colspan="6" style="text-align: center; color: #666;">No players found</td></tr>`;
        }

        html += `
                    </tbody>
                </table>
                <script>
                    window.onload = function() {
                        setTimeout(function() {
                            window.print();
                        }, 500);
                    }
                </script>
            </body>
            </html>
        `;

        printWindow.document.write(html);
        printWindow.document.close();
    };

    const renderGroupList = (title, list) => {
        const isExpanded = expandedSections.has(title);
        return (
            <Box sx={{ mb: 4 }}>
                <Paper
                    elevation={0}
                    onClick={() => toggleSection(title)}
                    sx={{
                        p: 2,
                        mb: isExpanded ? 2 : 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        borderRadius: '12px',
                        border: '1px solid rgba(0,0,0,0.06)',
                        bgcolor: isExpanded ? 'rgba(37, 99, 235, 0.04)' : 'white',
                        transition: 'all 0.2s ease',
                        '&:hover': { bgcolor: 'rgba(37, 99, 235, 0.08)' }
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Typography variant="h6" fontWeight="700" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {title === 'T20' ? '🏏' : title === 'ODI' ? '🏆' : '📁'} {title} Teams
                        </Typography>
                        <Chip
                            label={`${list.length} Teams`}
                            size="small"
                            variant="outlined"
                            sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                        />
                    </Box>
                    <IconButton size="small">
                        {isExpanded ? <KeyboardArrowDownIcon /> : <KeyboardArrowDownIcon sx={{ transform: 'rotate(-90deg)' }} />}
                    </IconButton>
                </Paper>

                {isExpanded && (
                    <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid rgba(0,0,0,0.06)', borderRadius: '16px', overflow: 'hidden' }}>
                        <Table size="small">
                            <TableHead>
                                <TableRow sx={{ bgcolor: 'rgba(32, 41, 58, 0.02)' }}>
                                    <TableCell sx={{ fontWeight: 'bold', py: 2 }}>Team Name</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>Players</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>Squad Preview</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 'bold', pr: 2 }}>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {list.map(g => (
                                    <TableRow key={g._id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <Box sx={{
                                                    width: 6, height: 32, borderRadius: '4px',
                                                    background: g.leagueType === 'T20' ? 'linear-gradient(to bottom, #1e3a8a, #3b82f6)' :
                                                        g.leagueType === 'ODI' ? 'linear-gradient(to bottom, #166534, #22c55e)' : '#2563eb'
                                                }} />
                                                <Typography variant="subtitle1" fontWeight="700" color="text.primary">{g.name}</Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Chip
                                                label={`${g.players.length} Players`}
                                                size="small"
                                                sx={{
                                                    bgcolor: g.players.length > 0 ? 'rgba(37, 99, 235, 0.08)' : 'rgba(0,0,0,0.04)',
                                                    color: g.players.length > 0 ? '#1e40af' : 'text.disabled',
                                                    fontWeight: 700,
                                                    fontSize: '0.75rem',
                                                    border: '1px solid rgba(0,0,0,0.05)'
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell align="center">
                                            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                                                {g.players.slice(0, 5).map((p, idx) => (
                                                    <Avatar
                                                        key={p.id || idx}
                                                        src={p.profile?.startsWith('http') ? p.profile : `${import.meta.env.VITE_BACKEND_URL}/uploads/${p.profile}`}
                                                        sx={{
                                                            width: 28, height: 28, ml: idx > 0 ? -1 : 0,
                                                            border: '2px solid white', fontSize: 10, bgcolor: 'primary.light',
                                                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                                        }}
                                                    >
                                                        {p.name?.[0]}
                                                    </Avatar>
                                                ))}
                                                {g.players.length > 5 && (
                                                    <Avatar sx={{
                                                        width: 28, height: 28, ml: -1, border: '2px solid white',
                                                        bgcolor: '#f1f5f9', color: '#475569', fontSize: 10, fontWeight: 700
                                                    }}>
                                                        +{g.players.length - 5}
                                                    </Avatar>
                                                )}
                                                {g.players.length === 0 && (
                                                    <Typography variant="caption" color="text.disabled" sx={{ fontStyle: 'italic' }}>No players</Typography>
                                                )}
                                            </Box>
                                        </TableCell>
                                        <TableCell align="right" sx={{ pr: 2 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                                <Button
                                                    variant="contained"
                                                    size="small"
                                                    onClick={() => openManageDialog(g)}
                                                    startIcon={<PeopleIcon sx={{ fontSize: '1rem !important' }} />}
                                                    sx={{
                                                        borderRadius: '10px', textTransform: 'none', fontWeight: 700,
                                                        px: 2, height: 32, fontSize: '0.8rem',
                                                        background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                                                        '&:hover': { transform: 'translateY(-1px)', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }
                                                    }}
                                                >
                                                    Manage
                                                </Button>

                                                <Tooltip title="Print Players">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handlePrintTeam(g)}
                                                        sx={{ color: '#0ea5e9', bgcolor: 'rgba(14, 165, 233, 0.08)', '&:hover': { bgcolor: 'rgba(14, 165, 233, 0.15)' } }}
                                                    >
                                                        <PrintIcon sx={{ fontSize: 18 }} />
                                                    </IconButton>
                                                </Tooltip>

                                                <Tooltip title={g.leagueType === 'T20' ? "Move to ODI" : "Move to T20"}>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleMoveGroup(g._id, g.leagueType === 'T20' ? 'ODI' : 'T20')}
                                                        sx={{ color: '#6366f1', bgcolor: 'rgba(99, 102, 241, 0.08)', '&:hover': { bgcolor: 'rgba(99, 102, 241, 0.15)' } }}
                                                    >
                                                        <AddIcon sx={{ transform: 'rotate(45deg)', fontSize: 18 }} />
                                                    </IconButton>
                                                </Tooltip>

                                                <Tooltip title="Clear Group">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => convertConfirmAction('Clear Group', `Clear all players from ${g.name}?`, () => handleClearGroup(g._id))}
                                                        sx={{ color: '#f59e0b', bgcolor: 'rgba(245, 158, 11, 0.08)', '&:hover': { bgcolor: 'rgba(245, 158, 11, 0.15)' } }}
                                                    >
                                                        <DeleteIcon sx={{ fontSize: 18, color: '#f59e0b' }} />
                                                    </IconButton>
                                                </Tooltip>

                                                <Tooltip title="Delete Group">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => convertConfirmAction('Delete Group', 'Are you sure you want to delete this group?', () => handleDeleteGroup(g._id))}
                                                        sx={{ color: '#ef4444', bgcolor: 'rgba(239, 68, 68, 0.08)', '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.15)' } }}
                                                    >
                                                        <DeleteIcon sx={{ fontSize: 18 }} />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Box>
        );
    };

    const t20Groups = groups.filter(g => g.leagueType === 'T20');
    const odiGroups = groups.filter(g => g.leagueType === 'ODI');
    const generalGroups = groups.filter(g => g.leagueType !== 'T20' && g.leagueType !== 'ODI');

    return (
        <Box sx={{ pb: 4 }}>
            <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 3
            }}>
                <Box>
                    <Typography variant="h5" fontWeight="800" color="#111827">Manage Leagues</Typography>
                    <Typography variant="body2" color="#6b7280">{groups.length} total teams</Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => {
                        setNewLeagueType('T20');
                        setOpenCreate(true);
                    }}
                    sx={{
                        background: 'linear-gradient(135deg, #2563eb 0%, #0ea5e9 100%)',
                        borderRadius: '12px',
                        px: 3,
                        py: 1,
                        boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
                        '&:hover': {
                            boxShadow: '0 6px 20px rgba(37, 99, 235, 0.35)',
                        }
                    }}
                >
                    Create Team
                </Button>
            </Box>

            {/* Categorized Lists */}
            {renderGroupList('T20', t20Groups)}
            {renderGroupList('ODI', odiGroups)}
            {generalGroups.length > 0 && renderGroupList('General', generalGroups)}

            {groups.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                    <Typography color="textSecondary">No active groups found. Create a new league team.</Typography>
                </Box>
            )}

            {/* Create Group Dialog */}
            <Dialog open={openCreate} onClose={() => setOpenCreate(false)}>
                <DialogTitle>Create New League Team</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                        <TextField
                            select
                            label="League Type"
                            value={newLeagueType}
                            onChange={(e) => setNewLeagueType(e.target.value)}
                            fullWidth
                            SelectProps={{ native: true }}
                        >
                            <option value="T20">T20 League</option>
                            <option value="ODI">ODI League</option>
                            <option value="General">General</option>
                        </TextField>

                        <Autocomplete
                            freeSolo
                            options={CRICKET_TEAMS}
                            value={newGroupName}
                            onInputChange={(event, newInputValue) => setNewGroupName(newInputValue)}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    autoFocus
                                    label="Group/Team Name"
                                    fullWidth
                                    variant="outlined"
                                    helperText="Select a standard team or type a custom name"
                                />
                            )}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenCreate(false)} disabled={creatingGroup}>Cancel</Button>
                    <Button
                        onClick={handleCreateGroup}
                        variant="contained"
                        disabled={creatingGroup || !newGroupName.trim()}
                        startIcon={creatingGroup ? <CircularProgress size={16} color="inherit" /> : null}
                    >
                        {creatingGroup ? 'Creating...' : 'Create'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Manage Players Dialog */}
            <Dialog open={openManage} onClose={() => setOpenManage(false)} fullWidth maxWidth="lg">
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>Manage Team: {selectedGroup?.name} <Chip label={selectedGroup?.leagueType} size="small" sx={{ ml: 1 }} /></Box>
                    <Button
                        variant="contained"
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() => {
                            setEditingPlayer({
                                name: '',
                                birthPlace: 'Chennai, India',
                                dob: '',
                                birthTime: '',
                                latitude: 13.0827,
                                longitude: 80.2707,
                                timezone: 5.5,
                                role: 'BAT'
                            });
                            setOpenEdit(true);
                        }}
                    >
                        Create New Player
                    </Button>
                </DialogTitle>
                <DialogContent dividers>
                    {/* Add Existing Player Section */}
                    <Box sx={{ mb: 3, p: 2, bgcolor: 'rgba(0,0,0,0.02)', borderRadius: 2, display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                        <Autocomplete
                            fullWidth
                            size="small"
                            options={allPlayersList}
                            getOptionLabel={(option) => `${option.name} (${option.id})`}
                            onInputChange={(e, val) => searchAllPlayers(val)}
                            onChange={(e, val) => setSelectedExistingPlayer(val)}
                            loading={searchingPlayers}
                            renderOption={(props, option) => {
                                const { key, ...restProps } = props;
                                return (
                                    <li key={key || option._id} {...restProps}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                            <Typography variant="body2">{option.name} ({option.id})</Typography>
                                            <Chip 
                                                label={option.role || 'BAT'} 
                                                size="small" 
                                                sx={{ 
                                                    height: 18, fontSize: '0.65rem', fontWeight: 'bold',
                                                    bgcolor: option.role === 'BAT' ? '#e0f2fe' : option.role === 'BOWL' ? '#fce7f3' : '#fef3c7',
                                                    color: option.role === 'BAT' ? '#0369a1' : option.role === 'BOWL' ? '#be185d' : '#b45309'
                                                }} 
                                            />
                                        </Box>
                                    </li>
                                );
                            }}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Search system players to add..."
                                    variant="outlined"
                                    InputProps={{
                                        ...params.InputProps,
                                        endAdornment: (
                                            <React.Fragment>
                                                {searchingPlayers ? <CircularProgress color="inherit" size={20} /> : null}
                                                {params.InputProps.endAdornment}
                                            </React.Fragment>
                                        ),
                                    }}
                                />
                            )}
                        />
                        <Button
                            variant="contained"
                            disabled={!selectedExistingPlayer}
                            onClick={handleAddExistingToGroup}
                            sx={{ whiteSpace: 'nowrap' }}
                        >
                            Add to Team
                        </Button>
                    </Box>

                    {selectedGroup && selectedGroup.players.length > 0 ? (
                        <TableContainer component={Paper} elevation={0} variant="outlined" sx={{ maxHeight: '450px', overflow: 'auto' }}>
                            <Table size="small">
                                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 700 }}>NAME & ROLE</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>DOB</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>TIME</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>PLACE</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>ASTRO STATUS</TableCell>
                                        <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>ACTIONS</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {selectedGroup.players.map((player) => (
                                        <TableRow key={player._id} hover>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, flexWrap: 'wrap' }}>
                                                    <Typography variant="subtitle2" fontWeight="600">{player.name}</Typography>
                                                    <Chip 
                                                        label={player.role || 'BAT'} 
                                                        size="small" 
                                                        sx={{ 
                                                            height: 18, fontSize: '0.65rem', fontWeight: 'bold',
                                                            bgcolor: player.role === 'BAT' ? '#e0f2fe' : player.role === 'BOWL' ? '#fce7f3' : '#fef3c7',
                                                            color: player.role === 'BAT' ? '#0369a1' : player.role === 'BOWL' ? '#be185d' : '#b45309'
                                                        }} 
                                                    />
                                                    {player.manualOverride && (
                                                        <Tooltip title="Reviewed / Locked in DB">
                                                            <Chip label="🛡️ Locked" size="small" sx={{ height: 18, fontSize: '0.62rem', fontWeight: 700, bgcolor: '#f3e8ff', color: '#7e22ce' }} />
                                                        </Tooltip>
                                                    )}
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                {player.dob ? (
                                                    <Typography variant="body2" sx={{ fontWeight: 500, color: '#1f2937' }}>
                                                        {player.dob}
                                                    </Typography>
                                                ) : (
                                                    <Chip label="Missing DOB" size="small" sx={{ bgcolor: '#fee2e2', color: '#dc2626', fontSize: '0.68rem', height: 20, fontWeight: 600 }} />
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {player.birthTime ? (
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600, color: '#4b5563' }}>
                                                            {player.birthTime}
                                                        </Typography>
                                                        {(player.isTobLocked || (player.birthTime !== '12:00' && player.birthTime !== '09:00')) && (
                                                            <Tooltip title="Custom TOB Locked">
                                                                <Typography variant="caption" sx={{ color: '#0369a1', cursor: 'help' }}>🔒</Typography>
                                                            </Tooltip>
                                                        )}
                                                    </Box>
                                                ) : (
                                                    <Typography variant="caption" color="text.secondary">-</Typography>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" color="text.secondary" sx={{ maxWidth: '180px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {player.birthPlace || '-'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                {player.birthChart ? (
                                                    <Chip 
                                                        label="✓ Chart Ready" 
                                                        size="small" 
                                                        sx={{ bgcolor: '#dcfce7', color: '#15803d', fontSize: '0.68rem', height: 20, fontWeight: 600 }} 
                                                    />
                                                ) : (
                                                    <Chip 
                                                        label="No Chart" 
                                                        size="small" 
                                                        sx={{ bgcolor: '#fef3c7', color: '#b45309', fontSize: '0.68rem', height: 20, fontWeight: 600 }} 
                                                    />
                                                )}
                                            </TableCell>
                                            <TableCell sx={{ textAlign: 'center' }}>
                                                <IconButton size="small" color="primary" onClick={() => handleEditClick(player)} title="Edit details">
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                                <IconButton size="small" color="error" onClick={() => convertConfirmAction('Remove Player', 'Remove this player from the group?', () => handleRemovePlayer(selectedGroup.name, player.id))} title="Remove from group">
                                                    <DeleteIcon fontSize="small" />
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

            {/* Edit/Create Player Dialog */}
            <Dialog open={openEdit} onClose={() => setOpenEdit(false)} fullWidth maxWidth="sm">
                <DialogTitle>{editingPlayer?._id ? 'Edit Player' : 'Create New Player'}</DialogTitle>
                <DialogContent>
                    {editingPlayer && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                            <TextField
                                label="Name"
                                value={editingPlayer.name}
                                onChange={(e) => setEditingPlayer({ ...editingPlayer, name: e.target.value })}
                                fullWidth
                                size="small"
                            />
                            <TextField
                                label="Birth Place"
                                value={editingPlayer.birthPlace}
                                onChange={(e) => setEditingPlayer({ ...editingPlayer, birthPlace: e.target.value })}
                                fullWidth
                                size="small"
                            />
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <TextField
                                    label="Latitude"
                                    type="number"
                                    value={editingPlayer.latitude || ''}
                                    onChange={(e) => setEditingPlayer({ ...editingPlayer, latitude: e.target.value })}
                                    fullWidth
                                    size="small"
                                />
                                <TextField
                                    label="Longitude"
                                    type="number"
                                    value={editingPlayer.longitude || ''}
                                    onChange={(e) => setEditingPlayer({ ...editingPlayer, longitude: e.target.value })}
                                    fullWidth
                                    size="small"
                                />
                            </Box>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <TextField
                                    label="Date of Birth"
                                    type="date"
                                    value={editingPlayer.dob ? parseDobToIso(editingPlayer.dob) : ''}
                                    onChange={(e) => setEditingPlayer({ ...editingPlayer, dob: e.target.value })}
                                    fullWidth
                                    size="small"
                                    InputLabelProps={{ shrink: true }}
                                />
                                <TextField
                                    label="Birth Time"
                                    type="time"
                                    value={editingPlayer.birthTime || ''}
                                    onChange={(e) => setEditingPlayer({ ...editingPlayer, birthTime: e.target.value })}
                                    fullWidth
                                    size="small"
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Box>
                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                <TextField
                                    label="Timezone"
                                    type="number"
                                    value={editingPlayer.timezone || ''}
                                    onChange={(e) => setEditingPlayer({ ...editingPlayer, timezone: e.target.value })}
                                    fullWidth
                                    size="small"
                                />
                                <TextField
                                    select
                                    label="Role"
                                    value={editingPlayer.role || 'BAT'}
                                    onChange={(e) => setEditingPlayer({ ...editingPlayer, role: e.target.value })}
                                    fullWidth
                                    size="small"
                                    SelectProps={{ native: true }}
                                >
                                    <option value="BAT">BAT</option>
                                    <option value="BOWL">BOWL</option>
                                    <option value="ALL">ALL</option>
                                </TextField>
                            </Box>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenEdit(false)} disabled={savingPlayer}>Cancel</Button>
                    <Button
                        onClick={handleSaveEdit}
                        variant="contained"
                        color="primary"
                        disabled={savingPlayer || !editingPlayer?.name}
                    >
                        {savingPlayer ? 'Saving...' : editingPlayer?._id ? 'Save Changes' : 'Create & Add'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }} variant="filled">
                    {snackbar.message}
                </Alert>
            </Snackbar>

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

const BackupsManager = () => {
    const { token } = useContext(AuthContext);
    const [backups, setBackups] = useState([]);
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    
    // Dialogs
    const [confirmRestoreOpen, setConfirmRestoreOpen] = useState(false);
    const [selectedBackupForRestore, setSelectedBackupForRestore] = useState(null);
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const [selectedBackupForDelete, setSelectedBackupForDelete] = useState(null);

    // Snackbar
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const showSnackbar = (message, severity = 'success') => {
        setSnackbar({ open: true, message, severity });
    };
    const handleCloseSnackbar = () => setSnackbar(prev => ({ ...prev, open: false }));

    const fetchBackups = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/backups`, {
                headers: { 'x-auth-token': token }
            });
            setBackups(res.data);
        } catch (err) {
            console.error(err);
            showSnackbar(err.response?.data?.msg || 'Failed to fetch backups', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBackups();
    }, []);

    const handleCreateBackup = async () => {
        setCreating(true);
        try {
            const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/backups/create`, {}, {
                headers: { 'x-auth-token': token }
            });
            showSnackbar(res.data.msg || 'Backup created successfully!', 'success');
            fetchBackups();
        } catch (err) {
            console.error(err);
            showSnackbar(err.response?.data?.msg || 'Failed to create backup', 'error');
        } finally {
            setCreating(false);
        }
    };

    const handleDownloadBackup = async (filename) => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/backups/download/${filename}`, {
                headers: { 'x-auth-token': token },
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            showSnackbar('Download started', 'success');
        } catch (err) {
            console.error(err);
            showSnackbar('Failed to download backup file', 'error');
        }
    };

    const handleRestoreBackup = async () => {
        if (!selectedBackupForRestore) return;
        setActionLoading(true);
        try {
            const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/backups/restore/${selectedBackupForRestore}`, {}, {
                headers: { 'x-auth-token': token }
            });
            showSnackbar(res.data.msg || 'Database successfully restored!', 'success');
            setConfirmRestoreOpen(false);
            setSelectedBackupForRestore(null);
            fetchBackups();
        } catch (err) {
            console.error(err);
            showSnackbar(err.response?.data?.msg || 'Failed to restore database', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteBackup = async () => {
        if (!selectedBackupForDelete) return;
        setActionLoading(true);
        try {
            const res = await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/api/backups/${selectedBackupForDelete}`, {
                headers: { 'x-auth-token': token }
            });
            showSnackbar(res.data.msg || 'Backup deleted successfully!', 'success');
            setConfirmDeleteOpen(false);
            setSelectedBackupForDelete(null);
            fetchBackups();
        } catch (err) {
            console.error(err);
            showSnackbar(err.response?.data?.msg || 'Failed to delete backup', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const formatBytes = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = 2;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    };

    const formatTrigger = (trigger) => {
        switch (trigger) {
            case 'manual':
                return <Chip label="Manual" size="small" sx={{ bgcolor: 'rgba(37, 99, 235, 0.1)', color: '#2563eb', fontWeight: 'bold' }} />;
            case 'auto_add':
                return <Chip label="Auto (Add)" size="small" sx={{ bgcolor: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', fontWeight: 'bold' }} />;
            case 'auto_update':
                return <Chip label="Auto (Update)" size="small" sx={{ bgcolor: 'rgba(14, 165, 233, 0.1)', color: '#0ea5e9', fontWeight: 'bold' }} />;
            case 'auto_delete':
                return <Chip label="Auto (Delete)" size="small" sx={{ bgcolor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', fontWeight: 'bold' }} />;
            case 'auto_delete_all':
                return <Chip label="Auto (Clear All)" size="small" sx={{ bgcolor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontWeight: 'bold' }} />;
            case 'auto_upload':
                return <Chip label="Auto (Upload)" size="small" sx={{ bgcolor: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', fontWeight: 'bold' }} />;
            case 'auto_sync':
                return <Chip label="Auto (Sync)" size="small" sx={{ bgcolor: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', fontWeight: 'bold' }} />;
            default:
                return <Chip label={trigger} size="small" />;
        }
    };

    return (
        <Box sx={{ pb: 4 }}>
            <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 3
            }}>
                <Box>
                    <Typography variant="h5" fontWeight="800" color="#111827">Database Backups</Typography>
                    <Typography variant="body2" color="#6b7280">Manage database backup copies & restore operations</Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<BackupIcon />}
                    onClick={handleCreateBackup}
                    disabled={creating}
                    sx={{
                        background: 'linear-gradient(135deg, #2563eb 0%, #0ea5e9 100%)',
                        borderRadius: '12px',
                        px: 3,
                        py: 1,
                        boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
                        '&:hover': {
                            boxShadow: '0 6px 20px rgba(37, 99, 235, 0.35)',
                        }
                    }}
                >
                    {creating ? 'Backing Up...' : 'Create Backup'}
                </Button>
            </Box>

            <Paper sx={{ p: 0, borderRadius: '16px', overflow: 'hidden' }}>
                <TableContainer sx={{ maxHeight: '70vh' }}>
                    <Table stickyHeader>
                        <TableHead>
                            <TableRow>
                                <TableCell>Backup File Name</TableCell>
                                <TableCell>Date & Time</TableCell>
                                <TableCell>Trigger Source</TableCell>
                                <TableCell>Size</TableCell>
                                <TableCell align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                                        <CircularProgress size={30} />
                                        <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>Loading backups...</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : backups.length > 0 ? (
                                backups.map((b) => (
                                    <TableRow key={b.filename} hover>
                                        <TableCell sx={{ fontWeight: '600', color: '#1f2937' }}>
                                            {b.filename}
                                        </TableCell>
                                        <TableCell>
                                            {new Date(b.createdAt).toLocaleString()}
                                        </TableCell>
                                        <TableCell>
                                            {formatTrigger(b.trigger)}
                                        </TableCell>
                                        <TableCell>
                                            {formatBytes(b.sizeBytes)}
                                        </TableCell>
                                        <TableCell align="right">
                                            <Tooltip title="Restore Data">
                                                <IconButton
                                                    color="primary"
                                                    onClick={() => {
                                                        setSelectedBackupForRestore(b.filename);
                                                        setConfirmRestoreOpen(true);
                                                    }}
                                                    size="small"
                                                >
                                                    <SettingsBackupRestoreIcon />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Download File">
                                                <IconButton
                                                    color="secondary"
                                                    onClick={() => handleDownloadBackup(b.filename)}
                                                    size="small"
                                                >
                                                    <DownloadIcon />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Delete Backup">
                                                <IconButton
                                                    color="error"
                                                    onClick={() => {
                                                        setSelectedBackupForDelete(b.filename);
                                                        setConfirmDeleteOpen(true);
                                                    }}
                                                    size="small"
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                                        <Typography color="textSecondary">No backups found. Click "Create Backup" to generate one.</Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            <Box sx={{ mt: 3, p: 2, bgcolor: 'rgba(37, 99, 235, 0.05)', borderRadius: '12px', border: '1px dashed rgba(37, 99, 235, 0.2)' }}>
                <Typography variant="caption" color="primary" sx={{ fontWeight: '600', display: 'block', mb: 0.5 }}>
                    💡 Auto-Backup System Active
                </Typography>
                <Typography variant="caption" color="textSecondary" display="block">
                    The database is backed up automatically on every action (adding, updating, deleting, or uploading player data).
                    To maintain storage efficiency, only the 15 most recent backups are preserved.
                </Typography>
            </Box>

            {/* Restore Confirmation Dialog */}
            <Dialog open={confirmRestoreOpen} onClose={() => !actionLoading && setConfirmRestoreOpen(false)}>
                <DialogTitle sx={{ bgcolor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SettingsBackupRestoreIcon /> Restore Database
                </DialogTitle>
                <DialogContent sx={{ mt: 2 }}>
                    <Typography color="error" fontWeight="bold" gutterBottom>
                        ⚠️ WARNING: Restoring will overwrite all current players!
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Are you sure you want to restore the player database from the file: <br />
                        <strong>{selectedBackupForRestore}</strong>?
                        This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmRestoreOpen(false)} disabled={actionLoading}>Cancel</Button>
                    <Button onClick={handleRestoreBackup} color="error" variant="contained" disabled={actionLoading}>
                        {actionLoading ? 'Restoring...' : 'Confirm Restore'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={confirmDeleteOpen} onClose={() => !actionLoading && setConfirmDeleteOpen(false)}>
                <DialogTitle sx={{ bgcolor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                    Delete Backup File
                </DialogTitle>
                <DialogContent sx={{ mt: 2 }}>
                    <Typography variant="body2">
                        Are you sure you want to permanently delete the backup file: <br />
                        <strong>{selectedBackupForDelete}</strong>?
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmDeleteOpen(false)} disabled={actionLoading}>Cancel</Button>
                    <Button onClick={handleDeleteBackup} color="error" variant="contained" disabled={actionLoading}>
                        {actionLoading ? 'Deleting...' : 'Delete'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Local Snackbar */}
            <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }} variant="filled">
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

const LiveSyncManager = () => {
    const { token } = useContext(AuthContext);
    const [matches, setMatches] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(false);
    const [syncingMatchId, setSyncingMatchId] = useState(null);
    const [actionLoadingId, setActionLoadingId] = useState(null);

    // Snackbar State
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const showSnackbar = (message, severity = 'success') => {
        setSnackbar({ open: true, message, severity });
    };

    const fetchMatches = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/players/live-matches`, {
                headers: { 'x-auth-token': token }
            });
            setMatches(res.data.matches || []);
        } catch (err) {
            console.error(err);
            showSnackbar('Failed to load active matches. Please check network connection.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchReviews = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/players/review-list`, {
                headers: { 'x-auth-token': token }
            });
            setReviews(res.data.players || []);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchMatches();
        fetchReviews();
    }, []);

    const handleSyncSquad = async (matchId, matchTitle) => {
        setSyncingMatchId(matchId);
        try {
            const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/players/sync-live-squad`, 
                { matchId, matchTitle },
                { headers: { 'x-auth-token': token } }
            );
            const { stats, syncedGroups } = res.data;
            const groupsText = syncedGroups && syncedGroups.length > 0 
                ? ` | 🏏 Teams added to Groups: ${syncedGroups.map(g => `${g.name} (${g.count} players)`).join(' & ')}`
                : '';
            showSnackbar(
                `Squad & Playing XI Synced! Added: ${stats.newPlayersAdded}, Updated: ${stats.autoUpdated}${groupsText}`,
                'success'
            );
            fetchReviews();
            if (typeof fetchGroups === 'function') fetchGroups();
        } catch (err) {
            console.error(err);
            showSnackbar(err.response?.data?.msg || 'Failed to sync squad', 'error');
        } finally {
            setSyncingMatchId(null);
        }
    };

    const handleResolve = async (playerId, action) => {
        setActionLoadingId(playerId);
        try {
            await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/players/resolve-review/${playerId}`, 
                { action },
                { headers: { 'x-auth-token': token } }
            );
            showSnackbar('Review resolved successfully', 'success');
            fetchReviews();
        } catch (err) {
            console.error(err);
            showSnackbar('Failed to resolve review', 'error');
        } finally {
            setActionLoadingId(null);
        }
    };

    const liveMatches = matches.filter(m => m.status === 'live');
    const upcomingMatches = matches.filter(m => m.status === 'upcoming');
    const completedMatches = matches.filter(m => m.status === 'completed');

    const renderMatchGroup = (title, list, color) => {
        if (list.length === 0) return null;
        return (
            <Box sx={{ mb: 4 }}>
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: color }} />
                    {title} Matches ({list.length})
                </Typography>
                <Grid container spacing={3}>
                    {list.map(match => (
                        <Grid item xs={12} sm={6} md={4} key={match.match_id}>
                            <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100%', gap: 1.5 }}>
                                <Typography variant="caption" sx={{ textTransform: 'uppercase', fontWeight: 'bold', color }}>
                                    {match.status}
                                </Typography>
                                <Typography variant="subtitle1" fontWeight="bold" color="text.primary" sx={{ flexGrow: 1 }}>
                                    {match.title}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    ID: {match.match_id}
                                </Typography>
                                <Button
                                    variant="contained"
                                    size="small"
                                    onClick={() => handleSyncSquad(match.match_id, match.title)}
                                    disabled={syncingMatchId !== null}
                                    sx={{ 
                                        borderRadius: '8px', 
                                        bgcolor: color,
                                        '&:hover': { bgcolor: color, opacity: 0.9 }
                                    }}
                                >
                                    {syncingMatchId === match.match_id ? 'Syncing...' : '⚡ Sync Squad & 11s to Groups'}
                                </Button>
                            </Paper>
                        </Grid>
                    ))}
                </Grid>
            </Box>
        );
    };

    return (
        <Box sx={{ pb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Typography variant="h5" fontWeight="800" color="#111827">Live Score Match & Squad Sync</Typography>
                    <Typography variant="body2" color="#6b7280">Fetch live rosters and player profiles from Cricbuzz</Typography>
                </Box>
                <Button variant="outlined" startIcon={<SettingsBackupRestoreIcon />} onClick={fetchMatches} disabled={loading}>
                    Refresh Matches
                </Button>
            </Box>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <Box>
                    {renderMatchGroup('Live', liveMatches, '#ef4444')}
                    {renderMatchGroup('Upcoming', upcomingMatches, '#3b82f6')}
                    {renderMatchGroup('Completed', completedMatches, '#22c55e')}
                    {matches.length === 0 && (
                        <Typography sx={{ py: 4, textAlign: 'center' }} color="textSecondary">
                            No active matches found. Please refresh or check connection.
                        </Typography>
                    )}
                </Box>
            )}

            {/* Mismatches Review Section */}
            <Typography variant="h5" fontWeight="800" color="#111827" sx={{ mt: 5, mb: 2 }}>
                ⚠️ Flags Awaiting Review ({reviews.length})
            </Typography>
            <Paper sx={{ borderRadius: '16px', overflow: 'hidden' }}>
                <TableContainer>
                    <Table>
                        <TableHead sx={{ bgcolor: '#1e293b' }}>
                            <TableRow>
                                <TableCell sx={{ color: 'white' }}>Player</TableCell>
                                <TableCell sx={{ color: 'white' }}>DB Details</TableCell>
                                <TableCell sx={{ color: 'white' }}>Scraped Live Details</TableCell>
                                <TableCell sx={{ color: 'white' }} align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {reviews.length > 0 ? (
                                reviews.map(p => (
                                    <TableRow key={p.id} hover>
                                        <TableCell sx={{ fontWeight: 'bold' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, flexWrap: 'wrap' }}>
                                                <span>{p.name}</span>
                                                {p.manualOverride && (
                                                    <Tooltip title="Manually Reviewed & Locked in DB">
                                                        <Chip label="🛡️ DB Locked" size="small" sx={{ height: 18, fontSize: '0.62rem', fontWeight: 700, bgcolor: '#f3e8ff', color: '#7e22ce' }} />
                                                    </Tooltip>
                                                )}
                                                {(p.isTobLocked || (p.birthTime && p.birthTime !== '12:00' && p.birthTime !== '09:00')) && (
                                                    <Tooltip title={`Custom TOB Locked: ${p.birthTime || '12:00'} (Will not be overwritten)`}>
                                                        <Chip label={`🔒 TOB: ${p.birthTime || '12:00'}`} size="small" sx={{ height: 18, fontSize: '0.62rem', fontWeight: 700, bgcolor: '#e0f2fe', color: '#0369a1' }} />
                                                    </Tooltip>
                                                )}
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="caption" display="block">🎂 DOB: {p.dob || 'N/A'}</Typography>
                                            <Typography variant="caption" display="block" sx={{ fontWeight: (p.isTobLocked || (p.birthTime && p.birthTime !== '12:00')) ? 'bold' : 'normal', color: (p.isTobLocked || (p.birthTime && p.birthTime !== '12:00')) ? '#0369a1' : 'inherit' }}>
                                                🕒 Time: {p.birthTime || '12:00'} {(p.isTobLocked || (p.birthTime && p.birthTime !== '12:00' && p.birthTime !== '09:00')) ? '🔒 (Locked)' : ''}
                                            </Typography>
                                            <Typography variant="caption" display="block">📍 Place: {p.birthPlace || 'N/A'}</Typography>
                                        </TableCell>
                                        <TableCell sx={{ bgcolor: 'rgba(245, 158, 11, 0.05)' }}>
                                            <Typography variant="caption" display="block" fontWeight="bold">🎂 DOB: {p.lastScrapedData?.dob || 'N/A'}</Typography>
                                            <Typography variant="caption" display="block" color="text.secondary">🕒 Time: (Not in Cricbuzz)</Typography>
                                            <Typography variant="caption" display="block" fontWeight="bold">📍 Place: {p.lastScrapedData?.birthPlace || 'N/A'}</Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                                <Button 
                                                    variant="contained" 
                                                    color="success" 
                                                    size="small"
                                                    onClick={() => handleResolve(p.id, 'accept_live')}
                                                    disabled={actionLoadingId !== null}
                                                >
                                                    Accept Live
                                                </Button>
                                                <Button 
                                                    variant="outlined" 
                                                    color="warning" 
                                                    size="small"
                                                    onClick={() => handleResolve(p.id, 'keep_existing')}
                                                    disabled={actionLoadingId !== null}
                                                >
                                                    Keep DB
                                                </Button>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                                        <Typography color="textSecondary">No mismatches flagged. Database is perfectly in sync.</Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} variant="filled">
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

const drawerWidth = 240;

const AdminDashboard = () => {
    const { logout, token } = useContext(AuthContext);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [currentView, setCurrentView] = useState('dashboard');

    const [currentTime, setCurrentTime] = useState(new Date());

    // Notes Overlay State
    const [notesOpen, setNotesOpen] = useState(false);

    // Delete All Players State
    const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);
    const [deletePassword, setDeletePassword] = useState('');
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteSnackbar, setDeleteSnackbar] = useState({ open: false, message: '', severity: 'success' });

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    // Delete All Players Handler
    const handleDeleteAllPlayers = async () => {
        if (!deletePassword) {
            setDeleteSnackbar({ open: true, message: 'Please enter password', severity: 'warning' });
            return;
        }

        setDeleteLoading(true);
        try {
            const authToken = token || localStorage.getItem('token');
            const response = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/players/delete-all`,
                { password: deletePassword },
                { headers: { 'x-auth-token': authToken } }
            );
            setDeleteSnackbar({ open: true, message: response.data.msg, severity: 'success' });
            setDeleteAllDialogOpen(false);
            setDeletePassword('');
            // Refresh the page to update player list
            window.location.reload();
        } catch (err) {
            const errorMsg = err.response?.data?.msg || 'Failed to delete players';
            setDeleteSnackbar({ open: true, message: errorMsg, severity: 'error' });
        } finally {
            setDeleteLoading(false);
        }
    };

    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
        { id: 'users', label: 'Users', icon: <PeopleIcon /> },
        { id: 'players', label: 'Players', icon: <SportsCricketIcon /> },
        { id: 'groups', label: 'Groups', icon: <GroupIcon /> },
        { id: 'liveSync', label: 'Live Match Sync', icon: <SportsCricketIcon /> },
        { id: 'clientDashboard', label: 'Client Dashboard', icon: <DashboardIcon /> },
        { id: 'kpAstrology', label: 'KP Astrology', icon: <TimelineIcon /> },
        { id: 'myPredictions', label: 'My Predictions', icon: <EmojiEventsIcon /> },
        { id: 'backups', label: 'Backups', icon: <BackupIcon /> },
    ];

    const drawer = (
        <Box sx={{
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            overflow: 'hidden'
        }}>
            <Box
                onClick={() => { setCurrentView('dashboard'); setMobileOpen(false); }}
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 3,
                    gap: 1,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                        transform: 'scale(1.05)',
                        opacity: 0.9
                    }
                }}
            >
                <img
                    src="/sb_astro_logo.jpg"
                    alt="S&B Astro"
                    style={{
                        height: '50px',
                        maxWidth: '100%',
                        objectFit: 'contain',
                        borderRadius: '8px'
                    }}
                />
            </Box>
            <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', mb: 2 }} />

            {/* Scrollable menu items */}
            <Box sx={{
                flexGrow: 1,
                overflowY: 'auto',
                pr: 0.5,
                '&::-webkit-scrollbar': {
                    width: '6px',
                },
                '&::-webkit-scrollbar-track': {
                    background: 'transparent',
                },
                '&::-webkit-scrollbar-thumb': {
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '10px',
                },
                '&::-webkit-scrollbar-thumb:hover': {
                    background: 'rgba(255, 255, 255, 0.2)',
                },
            }}>
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
                                        color: active ? 'white' : '#2CD9FF',
                                        bgcolor: active ? 'rgba(255,255,255,0.2)' : 'rgba(26,31,63,0.5)',
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
            </Box>

            <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', my: 2 }} />

            <Box>
                <List sx={{ pb: 0 }}>
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
            case 'dashboard': return <DashboardHome onNavigate={setCurrentView} />;
            case 'users': return <UsersManager />;
            case 'players': return <PlayersManager />;
            case 'groups': return <GroupsManager />;
            case 'liveSync': return <LiveSyncManager />;
            case 'clientDashboard': return <UserDashboard hideHeader={true} />;
            case 'kpAstrology': return <KPView />;
            case 'myPredictions': return <MyPredictions />;
            case 'backups': return <BackupsManager />;
            default: return <DashboardHome onNavigate={setCurrentView} />;
        }
    };

    return (
        <ThemeProvider theme={visionTheme}>
            <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f5f7fa', color: '#1a202c', overflow: 'hidden' }}>
                <CssBaseline />
                {/* Background Decor */}
                <Box sx={{
                    position: 'absolute',
                    top: 0, left: 0, width: '100%', height: '300px',
                    background: 'linear-gradient(180deg, rgba(32, 41, 58, 0.05) 0%, rgba(245, 247, 250, 0) 100%)',
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

                        {/* Delete All Players Button */}


                        {currentView === 'clientDashboard' && (
                            <Typography variant="h6" sx={{ color: '#2CD9FF', fontWeight: 'bold', mr: 2, display: { xs: 'none', md: 'block' } }}>
                                {currentTime.toLocaleTimeString()}
                            </Typography>
                        )}

                        <Tooltip title="Open Notes">
                            <IconButton onClick={() => setNotesOpen(true)} sx={{ color: '#fcd34d' }}>
                                <StickyNote2Icon />
                            </IconButton>
                        </Tooltip>
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
                                bgcolor: '#20293a',
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

            {/* Delete All Players Dialog */}
            <Dialog open={deleteAllDialogOpen} onClose={() => setDeleteAllDialogOpen(false)}>
                <DialogTitle sx={{ bgcolor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <DeleteIcon /> Delete All Players
                </DialogTitle>
                <DialogContent sx={{ mt: 2 }}>
                    <Typography color="error" fontWeight="bold" gutterBottom>
                        ⚠️ WARNING: This will delete ALL players permanently!
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Enter the admin password to confirm this action.
                    </Typography>
                    <TextField
                        autoFocus
                        fullWidth
                        type="password"
                        label="Admin Password"
                        variant="outlined"
                        value={deletePassword}
                        onChange={(e) => setDeletePassword(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleDeleteAllPlayers()}
                        sx={{ mt: 1 }}
                    />
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => { setDeleteAllDialogOpen(false); setDeletePassword(''); }}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={handleDeleteAllPlayers}
                        disabled={deleteLoading}
                        startIcon={deleteLoading ? <CircularProgress size={20} color="inherit" /> : <DeleteIcon />}
                    >
                        {deleteLoading ? 'Deleting...' : 'Delete All'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Snackbar */}
            <Snackbar
                open={deleteSnackbar.open}
                autoHideDuration={6000}
                onClose={() => setDeleteSnackbar({ ...deleteSnackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={() => setDeleteSnackbar({ ...deleteSnackbar, open: false })}
                    severity={deleteSnackbar.severity}
                    variant="filled"
                >
                    {deleteSnackbar.message}
                </Alert>
            </Snackbar>

            {/* Floating Notes Button Removed - Moved to Header */}
            <NotesOverlay isOpen={notesOpen} onClose={() => setNotesOpen(false)} />
        </ThemeProvider>
    );
};

export default AdminDashboard;
