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
            // We can add a specialized endpoint to get current user data or decode token if needed
            // For now, assuming we might need to decode or just store user data from login
            // But usually a /me endpoint is best. Let's assume we use the token data or add a /me endpoint if needed.
            // For simplicity in this stack, let's trust the token or add a /me route.
            // I'll keep it simple: If we have a token, we are "authenticated" but we ideally verify it.
            // Let's decode the token for role if we don't have a /me endpoint or just use the login response.
            // Since I didn't make a /me endpoint, I'll rely on the login response storing user data or decode JWT.
            // Actually, best practice is to have a loadUser.
            // I won't overcomplicate. I'll stick to basic state from Login.
            // However, on refresh, we lose state.
            // I'll add a simple decoding or just assume valid if token exists for this prototype,
            // but for roles, we need to know the role.
            // Let's decode the token client side or make a fast /me endpoint.
            // I will implement a quick /me endpoint in the backend for robustness if I can, or just decode.
            // I'll decoding for now using a helper or just persist user in localStorage too (less secure but faster for prototype).
            const user = JSON.parse(localStorage.getItem('user'));
            if(user) {
                 dispatch({ type: 'USER_LOADED', payload: user });
            }
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
            // Also store user role/info for persistence
            // The backend returns { token, role }.
            // We construct a user object.
            const userPayload = { role: res.data.role, username: formData.username }; // simple user obj
            localStorage.setItem('user', JSON.stringify(userPayload));

            loadUser();
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
        if(localStorage.token) setAuthToken(localStorage.token);
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
