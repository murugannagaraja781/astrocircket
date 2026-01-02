import React, { useState, useContext, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { TextField, Button, Box, Typography, InputAdornment } from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import LockIcon from '@mui/icons-material/Lock';
import EmailIcon from '@mui/icons-material/Email';

const Register = () => {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        confirmPassword: ''
    });

    const { register, error, clearErrors } = useContext(AuthContext);
    const [msg, setMsg] = useState('');

    const { username, password, confirmPassword } = formData;

    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => clearErrors(), 3000);
            return () => clearTimeout(timer);
        }
    }, [error, clearErrors]);

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async e => {
        e.preventDefault();
        if (password !== confirmPassword) {
            alert('Passwords do not match');
            return;
        }
        try {
            await register({ username, password });
            setMsg('Registration Successful! Waiting for Umpire (Admin) Approval.');
            setFormData({ username: '', password: '', confirmPassword: '' });
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-pitch-sky relative overflow-hidden">
             {/* Background Effect */}
             <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_white_1px,_transparent_1px)] bg-[length:20px_20px]"></div>

            <div className="bg-white p-8 rounded-2xl w-full max-w-md relative z-10" style={{ boxShadow: '0 25px 50px rgba(0, 77, 64, 0.15)', border: '1px solid rgba(0, 77, 64, 0.1)' }}>
                <div className="text-center mb-8">
                    <div className="inline-block px-4 py-1 rounded-full text-sm font-bold uppercase tracking-wider mb-2" style={{ background: 'linear-gradient(90deg, #F9CD05, #F97316)', color: '#004D40' }}>
                        New Talent Hunt
                    </div>
                    <h2 className="text-3xl font-heading font-extrabold uppercase" style={{ color: '#004D40' }}>
                        Join the Squad
                    </h2>
                    <p className="font-semibold mt-2" style={{ color: '#00695C' }}>Register for the upcoming season</p>
                </div>

                {error && (
                    <div className="px-4 py-3 rounded-xl mb-6" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', borderLeft: '4px solid #EF4444', color: '#EF4444' }}>
                        {error}
                    </div>
                )}
                {msg && (
                    <div className="px-4 py-3 rounded-xl mb-6 font-bold" style={{ backgroundColor: 'rgba(249, 115, 22, 0.1)', borderLeft: '4px solid #F97316', color: '#EA580C' }}>
                        {msg}
                    </div>
                )}

                <form onSubmit={onSubmit} className="space-y-6">
                    <TextField
                        fullWidth
                        label="PLAYER EMAIL"
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
                            style: { fontFamily: 'Inter', fontWeight: '500' }
                        }}
                        sx={{
                            '& .MuiFilledInput-root': {
                                backgroundColor: 'rgba(0, 77, 64, 0.04)',
                                borderRadius: '50px',
                                border: '1px solid rgba(0, 77, 64, 0.1)',
                                transition: 'all 200ms ease-out',
                                '&:hover': { backgroundColor: 'rgba(0, 77, 64, 0.08)', borderColor: 'rgba(0, 77, 64, 0.2)' },
                                '&.Mui-focused': { backgroundColor: '#FFFFFF', borderColor: '#F9CD05', boxShadow: '0 4px 20px rgba(0, 77, 64, 0.15), 0 0 0 3px rgba(249, 205, 5, 0.2)' },
                                '&:before, &:after': { display: 'none' }
                            },
                            '& .MuiInputLabel-root': { color: '#00695C', fontWeight: '600' },
                            '& .MuiInputBase-input': { color: '#004D40' }
                        }}
                    />

                    <TextField
                        fullWidth
                        label="PASSWORD"
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
                            style: { fontFamily: 'Inter', fontWeight: '500' }
                        }}
                        sx={{
                            '& .MuiFilledInput-root': {
                                backgroundColor: 'rgba(0, 77, 64, 0.04)',
                                borderRadius: '50px',
                                border: '1px solid rgba(0, 77, 64, 0.1)',
                                transition: 'all 200ms ease-out',
                                '&:hover': { backgroundColor: 'rgba(0, 77, 64, 0.08)', borderColor: 'rgba(0, 77, 64, 0.2)' },
                                '&.Mui-focused': { backgroundColor: '#FFFFFF', borderColor: '#F9CD05', boxShadow: '0 4px 20px rgba(0, 77, 64, 0.15), 0 0 0 3px rgba(249, 205, 5, 0.2)' },
                                '&:before, &:after': { display: 'none' }
                            },
                            '& .MuiInputLabel-root': { color: '#00695C', fontWeight: '600' },
                            '& .MuiInputBase-input': { color: '#004D40' }
                        }}
                    />

                    <TextField
                        fullWidth
                        label="CONFIRM PASSWORD"
                        name="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={onChange}
                        variant="filled"
                         InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <LockIcon sx={{ color: '#F97316' }} />
                                </InputAdornment>
                            ),
                            style: { fontFamily: 'Inter', fontWeight: '500' }
                        }}
                        sx={{
                            '& .MuiFilledInput-root': {
                                backgroundColor: 'rgba(0, 77, 64, 0.04)',
                                borderRadius: '50px',
                                border: '1px solid rgba(0, 77, 64, 0.1)',
                                transition: 'all 200ms ease-out',
                                '&:hover': { backgroundColor: 'rgba(0, 77, 64, 0.08)', borderColor: 'rgba(0, 77, 64, 0.2)' },
                                '&.Mui-focused': { backgroundColor: '#FFFFFF', borderColor: '#F9CD05', boxShadow: '0 4px 20px rgba(0, 77, 64, 0.15), 0 0 0 3px rgba(249, 205, 5, 0.2)' },
                                '&:before, &:after': { display: 'none' }
                            },
                            '& .MuiInputLabel-root': { color: '#00695C', fontWeight: '600' },
                            '& .MuiInputBase-input': { color: '#004D40' }
                        }}
                    />

                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        size="large"
                        startIcon={<PersonAddIcon />}
                        sx={{
                            background: 'linear-gradient(90deg, #F9CD05, #F97316)',
                            color: '#FFFFFF',
                            fontFamily: 'Montserrat',
                            fontWeight: '700',
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
                        Submit Application
                    </Button>
                </form>

                <div className="mt-8 text-center border-t border-gray-200 pt-4">
                    <p className="font-sans text-gray-600 text-sm">
                        Already in the team? <Link to="/login" className="font-bold hover:underline uppercase" style={{ color: '#F97316' }}>Login to Pavilion</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;
