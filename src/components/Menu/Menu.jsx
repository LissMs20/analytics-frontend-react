// src/components/Menu/Menu.jsx

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthProvider'; 
import { useTheme } from '../../context/ThemeContext'; 
import styles from'./Menu.module.css'; 
import LogoImage from '../../assets/logo-login.png'; 

const Menu = ({ currentScreen }) => {
    // A propriedade 'name' é acessada via 'user' do useAuth()
    const { user, logout, canAccess } = useAuth(); 
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false); 

    const handleLogout = () => {
        logout();
        navigate('/login');
    };
    
    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const getLinkClass = (screenName) => 
        screenName === currentScreen ? styles['active-screen'] : '';

    // 💡 ATUALIZAÇÃO AQUI: Exibir o nome completo em vez do username
    const UserInfoCompact = () => (
        <span className={styles.userinfo}>
            {/* Exibe o Nome completo (user.name) se existir, senão usa o username */}
            <strong>{user.name || user.username}</strong> 
            (<span className={styles[`role-${user.role}`]}>{user.role.toUpperCase()}</span>)
        </span>
    );
    
    // ... (LogoutButton e ThemeToggleButton permanecem inalterados)
    const LogoutButton = () => (
        <button onClick={handleLogout} className={styles.logoutbutton}>
            Sair
        </button>
    );

    const ThemeToggleButton = () => (
        <button 
            onClick={toggleTheme} 
            className={styles.themeToggle}
            aria-label={`Alternar para modo ${theme === 'light' ? 'escuro' : 'claro'}`}
        >
            {theme === 'light' ? '🌙' : '☀️'}
        </button>
    );

    return (
        <header className={styles.headermenu}>
            
            <div className={styles.topbar}> 
                
                {/* 1. Logo (Esquerda) */}
                <Link to="/" className={styles.logolink}>
                    <img src={LogoImage} alt="Tron Analytics Logo" className={styles.logoimage} />
                </Link>

                {/* 2. Seção do Usuário/Role: SÓ FICA AQUI PARA MOBILE */}
                <div className={styles.usersection}>
                    {user ? (
                        <UserInfoCompact /> 
                    ) : (
                        <Link to="/login" className={styles.loginlink}>Login</Link>
                    )}
                </div>

                {/* 3. Botão Hamburguer */}
                <button 
                    className={styles.menutoggle} 
                    onClick={toggleMenu}
                    aria-expanded={isMenuOpen}
                    aria-controls="nav-links-menu"
                >
                    <div className={`${styles.iconline} ${isMenuOpen ? styles.open : ''}`}></div>
                    <div className={`${styles.iconline} ${isMenuOpen ? styles.open : ''}`}></div>
                    <div className={`${styles.iconline} ${isMenuOpen ? styles.open : ''}`}></div>
                </button>
            </div>
            
            {/* LINKS DE NAVEGAÇÃO / SIDE MENU */}
            <nav 
                id="nav-links-menu"
                className={`${styles.navlinks} ${isMenuOpen ? styles.open : ''}`}
            >
                
                {user && (
                    <>
                        {/* ... Links de Navegação (inalterados) ... */}
                        <Link to="/" className={`${styles.navlink} ${getLinkClass('Home')}`} onClick={toggleMenu}>Home</Link>
                        <Link to="/checklist" className={`${styles.navlink} ${getLinkClass('Checklist')}`} onClick={toggleMenu}>Checklist</Link>
                        
                        {canAccess(['admin', 'assistencia']) && (
                            <Link to="/assistencia" className={`${styles.navlink} ${getLinkClass('Assistência')}`} onClick={toggleMenu}>Assistência</Link>
                        )}
                        
                        <Link to="/historico" className={`${styles.navlink} ${getLinkClass('Historico')}`} onClick={toggleMenu}>Histórico</Link>
                        
                        {canAccess(['admin', 'assistencia']) && (
                            <Link to="/analise-ia" className={`${styles.navlink} ${getLinkClass('AnaliseIA')}`} onClick={toggleMenu}>Cortex IA</Link>
                        )}

                        {canAccess(['admin']) && (
                            <Link to="/gerenciar-producao" className={`${styles.navlink} ${getLinkClass('Gerenciar Produção')}`} onClick={toggleMenu}>
                                Gerenciar Produção 
                            </Link>
                        )}
                        
                        {canAccess(['admin']) && (
                            <Link to="/gerenciar-usuarios" className={`${styles.navlink} ${getLinkClass('Gerenciar Usuários')}`} onClick={toggleMenu}>
                                Gerenciar Usuários
                            </Link>
                        )}
                        
                        {/* 4. Botão Sair DENTRO DO MENU LATERAL (APENAS MOBILE) */}
                        <div className={styles.menubottomsection}>
                            <ThemeToggleButton />
                            <LogoutButton />
                        </div>
                    </>
                )}
            </nav>
            
            {/* 5. NOVO BLOCO - Botão Sair na BARRA SUPERIOR (APENAS DESKTOP) */}
            {user && (
                <div className={`${styles.usersectionDesktop}`}>
                    <UserInfoCompact />
                    <ThemeToggleButton />
                    <LogoutButton />
                </div>
            )}
            
            {/* O overlay deve continuar aqui, fora da nav e da topbar */}
            {isMenuOpen && <div className={styles.menuoverlay} onClick={toggleMenu}></div>}
        </header>
    );
};

export default Menu;