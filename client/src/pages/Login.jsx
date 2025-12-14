import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { TextField, Button, Box, Typography, InputAdornment } from '@mui/material';
import SportsCricketIcon from '@mui/icons-material/SportsCricket';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';

const Login = () => {
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });

    const { login, error, clearErrors, isAuthenticated, user } = useContext(AuthContext);
    const navigate = useNavigate();

    const { username, password } = formData;

    useEffect(() => {
        if (isAuthenticated && user) {
            if (user.role === 'superadmin') {
                navigate('/admin-dashboard');
            } else {
                navigate('/dashboard');
            }
        }

        // The error handling in the original useEffect was commented out,
        // but the new onChange handler clears errors on input change.
        // If specific error display logic is needed here, it should be re-added.
    }, [error, isAuthenticated, user, navigate]);

    const onChange = e => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (error) clearErrors(); // Clear errors on input change
    };

    const onSubmit = async e => {
        e.preventDefault();
        try {
            await login(formData);
            // Redirect handled in context/component based on role (via useEffect)
        } catch (err) {
            console.error(err); // Log any unexpected errors during login attempt
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-pitch-sky relative overflow-hidden">
            {/* Animated Pitch Lines Background Effect */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_white_1px,_transparent_1px)] bg-[length:20px_20px]"></div>

            <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md border-4 border-cricketGold relative z-10 transform transition-all hover:scale-[1.01]">
                {/* Header Section */}
                <div className="text-center mb-8">
                    <div className="inline-block bg-cricketGreen text-cricketGold px-4 py-1 rounded-full text-sm font-bold uppercase tracking-wider mb-2 animate-bounce">
                        Match Day 1
                    </div>
                    <h2 className="text-4xl font-heading font-extrabold text-cricketGreen uppercase drop-shadow-sm">
                        The Toss
                    </h2>
                    <p className="text-pitchBrown font-semibold mt-2">Enter credentials to start the innings</p>
                </div>

                {error && (
                    <div className="bg-red-100 border-l-4 border-cricketRed text-cricketRed px-4 py-3 rounded mb-6 font-bold flex items-center">
                        <span className="mr-2">❌</span> {error}
                    </div>
                )}

                <form onSubmit={onSubmit} className="space-y-6">
                    {/* MUI Inputs with Custom Cricket Styling */}
                    <TextField
                        fullWidth
                        label="PLAYER ID / EMAIL"
                        name="username"
                        value={username}
                        onChange={onChange}
                        variant="filled"
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <EmailIcon sx={{ color: '#0A5B1D' }} />
                                </InputAdornment>
                            ),
                            style: { fontFamily: 'Rajdhani', fontSize: '1.2rem', fontWeight: 'bold' }
                        }}
                        sx={{
                            background: '#f0fdf4',
                            '& .MuiFilledInput-root': {
                                backgroundColor: 'rgba(0, 0, 0, 0.05)',
                                '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.08)' },
                                '&.Mui-focused': { backgroundColor: 'rgba(0, 0, 0, 0.08)' }
                            },
                            '& .MuiInputLabel-root': { color: '#0A5B1D', fontWeight: 'bold' },
                            '& .MuiWrapped-root': { borderBottom: '2px solid #FFD700' }
                        }}
                    />

                    <TextField
                        fullWidth
                        label="SECRET SIGNAL (PASSWORD)"
                        name="password"
                        type="password"
                        value={password}
                        onChange={onChange}
                        variant="filled"
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <LockIcon sx={{ color: '#0A5B1D' }} />
                                </InputAdornment>
                            ),
                            style: { fontFamily: 'Rajdhani', fontSize: '1.2rem', fontWeight: 'bold' }
                        }}
                        sx={{
                            background: '#f0fdf4',
                            '& .MuiFilledInput-root': {
                                backgroundColor: 'rgba(0, 0, 0, 0.05)',
                                '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.08)' },
                                '&.Mui-focused': { backgroundColor: 'rgba(0, 0, 0, 0.08)' }
                            },
                            '& .MuiInputLabel-root': { color: '#0A5B1D', fontWeight: 'bold' }
                        }}
                    />

                    {/* MUI Button Styled as Bat/Action Button */}
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        size="large"
                        endIcon={<SportsCricketIcon />}
                        sx={{
                            backgroundColor: '#0A5B1D',
                            color: '#FFFFFF',
                            fontFamily: 'Montserrat',
                            fontWeight: '900',
                            fontSize: '1.2rem',
                            padding: '12px',
                            borderRadius: '0 0 16px 16px', // Slight bat shape hint
                            textTransform: 'uppercase',
                            '&:hover': {
                                backgroundColor: '#0d7a26',
                                boxShadow: '0 4px 20px rgba(10, 91, 29, 0.4)'
                            }
                        }}
                    >
                        Play (Login)
                    </Button>
                </form>

                <div className="mt-8 text-center border-t border-gray-200 pt-4">
                    <p className="font-sans text-gray-600 text-sm">
                        New contenter? <Link to="/register" className="text-cricketRed font-bold hover:text-cricketGreen transition-colors uppercase">Register for Selection</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
