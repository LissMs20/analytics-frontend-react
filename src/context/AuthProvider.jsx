// /src/context/AuthProvider.jsx

import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser, logoutUser, setTokenExpiredHandler } from '../api/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const navigate = useNavigate();

    const [user, setUser] = useState(() => {
        const username = localStorage.getItem('username');
        const role = localStorage.getItem('userRole');
        const name = localStorage.getItem('userName'); 
        const token = localStorage.getItem('accessToken'); 

        return username && role && token ? { username, role, name } : null;
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleLogoutAndRedirect = useCallback((message = null) => {
        logoutUser();
        setUser(null); 

        if (message) {
            setError(message);
        } else {
            setError(null);
        }

        navigate('/login'); 
        
    }, [navigate]);

    const login = async (username, password) => {
        setLoading(true);
        setError(null);
        try {
            const userData = await loginUser(username, password);
            setUser(userData);
            return userData;
        } catch (err) {
            setError("Falha no login. Verifique o usuário e a senha.");
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        handleLogoutAndRedirect();
    };

    useEffect(() => {
        setTokenExpiredHandler(handleLogoutAndRedirect);

        return () => {
            setTokenExpiredHandler(() => {}); 
        };
    }, [handleLogoutAndRedirect]);

    const canAccess = (requiredRoles) => {
        if (!user) return false;
        if (requiredRoles.length === 0) return true; 

        return requiredRoles.includes(user.role);
    };

    const contextValue = {
        user,
        loading,
        error,
        login,
        logout,
        canAccess,
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};