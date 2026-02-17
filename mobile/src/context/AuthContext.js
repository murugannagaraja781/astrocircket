import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import API_URL from '../utils/config';
import auth from '@react-native-firebase/auth';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [userToken, setUserToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // Start as true to check auth state
  const [userInfo, setUserInfo] = useState(null);

  // Handle user state changes
  function onAuthStateChanged(user) {
    console.log('AuthContext: onAuthStateChanged', user ? 'User logged in' : 'No user');
    if (user) {
      setUserInfo(user);
      // We can use the Firebase ID token as our userToken
      user.getIdToken().then(token => {
        setUserToken(token);
        setIsLoading(false);
      });
    } else {
      setUserInfo(null);
      setUserToken(null);
      setIsLoading(false);
    }
  }

  useEffect(() => {
    console.log('AuthContext: Initializing subscriber...');
    const subscriber = auth().onAuthStateChanged(onAuthStateChanged);
    return subscriber; // unsubscribe on unmount
  }, []);

  const register = async (email, password) => {
    setIsLoading(true);
    try {
      console.log(`Attempting Firebase register for ${email}`);
      await auth().createUserWithEmailAndPassword(email, password);
    } catch (e) {
      console.error("Firebase Registration Failed", e);
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email, password) => {
    setIsLoading(true);
    try {
      console.log(`Attempting Firebase login for ${email}`);
      await auth().signInWithEmailAndPassword(email, password);
    } catch (e) {
      console.error("Firebase Login Failed", e);
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await auth().signOut();
    } catch (e) {
      console.error("Logout Failed", e);
    }
  };

  return (
    <AuthContext.Provider value={{ login, register, logout, isLoading, userToken, userInfo }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
