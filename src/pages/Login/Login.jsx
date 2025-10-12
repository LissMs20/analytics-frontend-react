import React, { useState } from 'react';
import { useAuth } from '../../context/AuthProvider';
import { useNavigate } from 'react-router-dom';
import styles from '../Login/Login.module.css';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const { login, loading, error, user } = useAuth();
    const navigate = useNavigate();

    if (user) {
        navigate('/');
        return null;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await login(username, password);
            navigate('/');
        } catch (e) {}
    };

    return (
        <div className={styles.loginBackground}>
        <div className={styles.logoContainer}>
            <img src="/logo-login.png" alt="TRON Analytics" className={styles.loginLogo} />
        </div>
        <div className={styles.loginCard}>
            <h1 className={styles.loginTitle}>Acesso ao Sistema</h1>
            <p className={styles.loginSubtitle}>Digite suas credenciais</p>

            {error && <p className={styles.errorMessage}>{error}</p>}

            <form onSubmit={handleSubmit} className={styles.loginForm}>
            <label>
                <span>Usuário:</span>
                <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={loading}
                className={styles.loginInput}
                />
            </label>

            <label>
                <span>Senha:</span>
                <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className={styles.loginInput}
                />
            </label>

            <button
                type="submit"
                disabled={loading}
                className={styles.loginButton}
            >
                {/* Alterado para maiúsculas para o visual futurista */}
                {loading ? 'ENTRANDO...' : 'ENTRAR'} 
            </button>
            </form>
        </div>
        </div>
    );
};

export default Login;