import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import API_URL from '../utils/config';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [userToken, setUserToken] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userInfo, setUserInfo] = useState(null);

  const login = async (email, password) => {
    setIsLoading(true);
    try {
        console.log(`Attempting login to ${API_URL}/api/auth/login`);
        const response = await axios.post(`${API_URL}/api/auth/login`, {
            email,
            password
        });
        
        console.log('Login Response:', response.data);

        // Assuming backend returns { token: "...", user: { ... } }
        // Adjust based on actual dashboard response structure
        // Dashboard uses 'token' from response.
        const token = response.data.token;
        
        if (token) {
            setUserToken(token);
            // Optionally store user info if returned, or decode token
            if (response.data.user) {
              setUserInfo(response.data.user);
            }
        }
    } catch (e) {
        console.error("Login Failed", e);
        throw e; // Rethrow for screen to handle (show alert)
    } finally {
        setIsLoading(false);
    }
  };

  const logout = () => {
    setUserToken(null);
    setUserInfo(null);
  };

  return (
    <AuthContext.Provider value={{ login, logout, isLoading, userToken, userInfo }}>
      {children}
    </AuthContext.Provider>
  );
};
