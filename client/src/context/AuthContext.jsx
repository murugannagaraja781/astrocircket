import React, { createContext, useReducer, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

const initialState = {
    token: localStorage.getItem('token'),
    isAuthenticated: null,
    loading: true,
    user: null,
    error: null
};

const authReducer = (state, action) => {
    switch (action.type) {
        case 'USER_LOADED':
            return {
                ...state,
                isAuthenticated: true,
                loading: false,
                user: action.payload
            };
        case 'REGISTER_SUCCESS':
        case 'LOGIN_SUCCESS':
            localStorage.setItem('token', action.payload.token);
            return {
                ...state,
                ...action.payload,
                isAuthenticated: true,
                loading: false
            };
        case 'REGISTER_FAIL':
        case 'AUTH_ERROR':
        case 'LOGIN_FAIL':
        case 'LOGOUT':
            localStorage.removeItem('token');
            return {
                ...state,
                token: null,
                isAuthenticated: false,
                loading: false,
                user: null,
                error: action.payload
            };
        case 'CLEAR_ERRORS':
            return {
                ...state,
                error: null
            };
        default:
            return state;
    }
};

export const AuthProvider = ({ children }) => {
    const [state, dispatch] = useReducer(authReducer, initialState);

    // Load User
    const loadUser = async () => {
        if (localStorage.token) {
            setAuthToken(localStorage.token);
        }

        try {
            const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/auth/me`);
            dispatch({ type: 'USER_LOADED', payload: res.data });
        } catch (err) {
            dispatch({ type: 'AUTH_ERROR' });
        }
    };

    // Register User
    const register = async formData => {
        const config = {
            headers: {
                'Content-Type': 'application/json'
            }
        };

        try {
            const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/auth/register`, formData, config);
            return { success: true, msg: res.data.msg };
        } catch (err) {
            dispatch({
                type: 'REGISTER_FAIL',
                payload: err.response?.data?.msg || 'Registration Error'
            });
            return { success: false, msg: err.response?.data?.msg || 'Registration Error' };
        }
    };

    // Login User
    const login = async formData => {
        const config = {
            headers: {
                'Content-Type': 'application/json'
            }
        };

        try {
            const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/auth/login`, formData, config);

            // Allow token to be set
            dispatch({
                type: 'LOGIN_SUCCESS',
                payload: res.data
            });

            // Set default headers for subsequent requests
            setAuthToken(res.data.token);

            await loadUser();
        } catch (err) {
            dispatch({
                type: 'LOGIN_FAIL',
                payload: err.response?.data?.msg || 'Login Error'
            });
        }
    };

    // Logout
    const logout = () => {
        localStorage.removeItem('user');
        dispatch({ type: 'LOGOUT' });
    };

    // Clear Errors
    const clearErrors = () => dispatch({ type: 'CLEAR_ERRORS' });

    // Set global header
    const setAuthToken = token => {
        if (token) {
            axios.defaults.headers.common['x-auth-token'] = token;
        } else {
            delete axios.defaults.headers.common['x-auth-token'];
        }
    };

    useEffect(() => {
        if (localStorage.token) setAuthToken(localStorage.token);
        loadUser();

        // Setup Axios Interceptor for 401s
        const interceptor = axios.interceptors.response.use(
            response => response,
            error => {
                if (error.response && error.response.status === 401) {
                    // Token expired or invalid
                    localStorage.removeItem('user');
                    dispatch({ type: 'LOGOUT' });
                }
                return Promise.reject(error);
            }
        );

        return () => {
            axios.interceptors.response.eject(interceptor);
        };
    }, []);

    return (
        <AuthContext.Provider
            value={{
                token: state.token,
                isAuthenticated: state.isAuthenticated,
                loading: state.loading,
                user: state.user,
                error: state.error,
                register,
                login,
                logout,
                clearErrors
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
