// /src/context/AuthProvider.jsx

import React, { createContext, useState, useContext, useEffect } from 'react';
import { loginUser, logoutUser } from '../api/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    // Inicializa o estado com dados do localStorage, se houver
    const [user, setUser] = useState(() => {
        const username = localStorage.getItem('username');
        const role = localStorage.getItem('userRole');
        // 💡 ADIÇÃO: Carrega o 'name' do localStorage
        const name = localStorage.getItem('userName'); 
        
        // 💡 ATUALIZAÇÃO: Inclui 'name' no objeto de usuário
        return username && role ? { username, role, name } : null;
    });
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Função para logar o usuário
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

    // Função para deslogar o usuário
    const logout = () => {
        logoutUser();
        setUser(null);
        // 💡 ADIÇÃO: Remove o nome do localStorage
        localStorage.removeItem('userName'); 
    };
    
    // Função de Autorização (RBAC)
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