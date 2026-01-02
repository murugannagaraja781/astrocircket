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

            <div className="bg-white p-8 rounded-2xl w-full max-w-md relative z-10 transform transition-all hover:scale-[1.01]" style={{ boxShadow: '0 25px 50px rgba(0, 77, 64, 0.15)', border: '1px solid rgba(0, 77, 64, 0.1)' }}>
                {/* Header Section */}
                <div className="text-center mb-8">

                    <p className="font-semibold mt-2" style={{ color: '#00695C' }}>Enter credentials to start the innings</p>
                </div>

                {error && (
                    <div className="px-4 py-3 rounded-xl mb-6 font-bold flex items-center" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', borderLeft: '4px solid #EF4444', color: '#EF4444' }}>
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
                                    <EmailIcon sx={{ color: '#F97316' }} />
                                </InputAdornment>
                            ),
                            style: { fontFamily: 'Inter', fontSize: '1rem', fontWeight: '500' }
                        }}
                        sx={{
                            '& .MuiFilledInput-root': {
                                backgroundColor: 'rgba(0, 77, 64, 0.04)',
                                borderRadius: '50px',
                                border: '1px solid rgba(0, 77, 64, 0.1)',
                                transition: 'all 200ms ease-out',
                                '&:hover': {
                                    backgroundColor: 'rgba(0, 77, 64, 0.08)',
                                    borderColor: 'rgba(0, 77, 64, 0.2)'
                                },
                                '&.Mui-focused': {
                                    backgroundColor: '#FFFFFF',
                                    borderColor: '#F9CD05',
                                    boxShadow: '0 4px 20px rgba(0, 77, 64, 0.15), 0 0 0 3px rgba(249, 205, 5, 0.2)'
                                },
                                '&:before, &:after': { display: 'none' }
                            },
                            '& .MuiInputLabel-root': { color: '#00695C', fontWeight: '600' },
                            '& .MuiInputBase-input': { color: '#004D40' }
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
                                    <LockIcon sx={{ color: '#F97316' }} />
                                </InputAdornment>
                            ),
                            style: { fontFamily: 'Inter', fontSize: '1rem', fontWeight: '500' }
                        }}
                        sx={{
                            '& .MuiFilledInput-root': {
                                backgroundColor: 'rgba(0, 77, 64, 0.04)',
                                borderRadius: '50px',
                                border: '1px solid rgba(0, 77, 64, 0.1)',
                                transition: 'all 200ms ease-out',
                                '&:hover': {
                                    backgroundColor: 'rgba(0, 77, 64, 0.08)',
                                    borderColor: 'rgba(0, 77, 64, 0.2)'
                                },
                                '&.Mui-focused': {
                                    backgroundColor: '#FFFFFF',
                                    borderColor: '#F9CD05',
                                    boxShadow: '0 4px 20px rgba(0, 77, 64, 0.15), 0 0 0 3px rgba(249, 205, 5, 0.2)'
                                },
                                '&:before, &:after': { display: 'none' }
                            },
                            '& .MuiInputLabel-root': { color: '#00695C', fontWeight: '600' },
                            '& .MuiInputBase-input': { color: '#004D40' }
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
                            background: 'linear-gradient(90deg, #F9CD05, #F97316)',
                            color: '#FFFFFF',
                            fontFamily: 'Montserrat',
                            fontWeight: '700',
                            fontSize: '1.1rem',
                            padding: '14px 28px',
                            borderRadius: '50px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            boxShadow: '0 4px 14px rgba(249, 115, 22, 0.25)',
                            transition: 'all 150ms ease-out',
                            '&:hover': {
                                background: 'linear-gradient(90deg, #F59E0B, #EA580C)',
                                transform: 'translateY(-2px)',
                                boxShadow: '0 6px 20px rgba(249, 115, 22, 0.35)'
                            }
                        }}
                    >
                        Play (Login)
                    </Button>
                </form>

                <div className="mt-8 text-center border-t border-gray-200 pt-4">
                    <p className="font-sans text-gray-600 text-sm">
                        New contender? <Link to="/register" className="font-bold transition-colors uppercase" style={{ color: '#F97316' }} onMouseOver={(e) => e.target.style.color = '#EA580C'} onMouseOut={(e) => e.target.style.color = '#F97316'}>Register for Selection</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
