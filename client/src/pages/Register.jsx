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

            <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md border-4 border-pitchBrown relative z-10">
                <div className="text-center mb-8">
                    <div className="inline-block bg-cricketRed text-white px-4 py-1 rounded-full text-sm font-bold uppercase tracking-wider mb-2">
                        New Talent Hunt
                    </div>
                    <h2 className="text-3xl font-heading font-extrabold text-pitchBrown uppercase">
                        Join the Squad
                    </h2>
                    <p className="text-gray-600 font-semibold mt-2">Register for the upcoming season</p>
                </div>

                {error && (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded mb-6">
                        {error}
                    </div>
                )}
                {msg && (
                    <div className="bg-green-100 border-l-4 border-green-500 text-green-700 px-4 py-3 rounded mb-6 font-bold">
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
                                    <EmailIcon sx={{ color: '#8B4513' }} />
                                </InputAdornment>
                            ),
                            style: { fontFamily: 'Rajdhani', fontWeight: 'bold' }
                        }}
                        sx={{
                            '& .MuiInputLabel-root': { color: '#8B4513', fontWeight: 'bold' }
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
                                    <LockIcon sx={{ color: '#8B4513' }} />
                                </InputAdornment>
                            ),
                            style: { fontFamily: 'Rajdhani', fontWeight: 'bold' }
                        }}
                        sx={{
                            '& .MuiInputLabel-root': { color: '#8B4513', fontWeight: 'bold' }
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
                                    <LockIcon sx={{ color: '#8B4513' }} />
                                </InputAdornment>
                            ),
                            style: { fontFamily: 'Rajdhani', fontWeight: 'bold' }
                        }}
                        sx={{
                            '& .MuiInputLabel-root': { color: '#8B4513', fontWeight: 'bold' }
                        }}
                    />

                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        size="large"
                        startIcon={<PersonAddIcon />}
                        sx={{
                            backgroundColor: '#8B4513', // Pitch Brown
                            color: '#FFFFFF',
                            fontFamily: 'Montserrat',
                            fontWeight: 'bold',
                            padding: '12px',
                            '&:hover': {
                                backgroundColor: '#5d2e0c',
                            }
                        }}
                    >
                        Submit Application
                    </Button>
                </form>

                <div className="mt-8 text-center border-t border-gray-200 pt-4">
                    <p className="font-sans text-gray-600 text-sm">
                        Already in the team? <Link to="/login" className="text-cricketGreen font-bold hover:underline uppercase">Login to Pavilion</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;
