import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../config/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Instead of using useNavigate here directly if not wrapped in Router, we usually export functions.
  // But App.js wraps everything in BrowserRouter. So we can't easily use useNavigate inside AuthProvider if AuthProvider is outside Router.
  // We'll handle navigation in the component calling login/logout.

  useEffect(() => {
    // Hydrate state from localStorage on mount
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      // Set default header
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const { data } = await axios.post(`${API_BASE}/api/auth/login`, { email, password });
      
      setToken(data.token);
      setUser(data.user); // Keep data.user for user state
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user)); // Keep data.user for local storage
      axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
      
      toast.success("Signed in");
      return true;
    } catch (error) {
      console.error("Login failed:", error);
      const apiMsg = error.response?.data?.message;
      const apiErr = error.response?.data?.error;
      const display = apiErr ? `${apiMsg}: ${apiErr}` : (apiMsg || 'Those details didn’t match');
      toast.error(display, { id: 'login-error' });
      return false;
    }
  };

  const signup = async (name, email, password) => {
    try {
      await axios.post(`${API_BASE}/api/auth/signup`, { name, email, password });
      toast.success("Account created. Sign in to continue.");
      return true;
    } catch (error) {
      console.error("Signup failed:", error);
      toast.error(error.response?.data?.message || "We couldn’t create that account");
      return false;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    toast.success('Signed out');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
