import React, { createContext, useContext, useState, useEffect } from 'react';

// 1. Criar o Contexto
const ThemeContext = createContext();

// 2. Hook Customizado para usar o tema
export const useTheme = () => useContext(ThemeContext);

// 3. Provedor de Contexto
export const ThemeProvider = ({ children }) => {
    // 4. Inicializar o estado lendo a preferência do sistema ou localStorage
    const getInitialTheme = () => {
        if (typeof window !== 'undefined' && window.localStorage) {
            const storedPrefs = window.localStorage.getItem('theme');
            if (storedPrefs) {
                return storedPrefs;
            }
            // Detecta a preferência do sistema
            const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
            return mediaQuery.matches ? 'light' : 'dark';
        }
        return 'dark'; // Padrão se não for ambiente de navegador
    };

    const [theme, setTheme] = useState(getInitialTheme);

    // 5. Aplicar o tema ao <body> e salvar no localStorage
    useEffect(() => {
        const root = window.document.documentElement; // Isto é o <html>
        const oldTheme = theme === 'dark' ? 'light' : 'dark';

        root.classList.remove(oldTheme + '-mode'); // Remove 'dark-mode' ou 'light-mode'
        root.classList.add(theme + '-mode'); 

        localStorage.setItem('theme', theme);
    }, [theme]);

    // 6. Função para alternar entre os temas
    const toggleTheme = () => {
        setTheme(currentTheme => (currentTheme === 'light' ? 'dark' : 'light'));
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

// NOTA: Você precisará envolver o App.js com <ThemeProvider> para que funcione.