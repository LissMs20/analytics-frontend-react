import React, { useState } from 'react';
import { useAuth } from '../../context/AuthProvider';
import { useNavigate } from 'react-router-dom';
import styles from '../Login/Login.module.css';
// IMPORTAR ÍCONES: Adicione estas duas linhas
import { FaEye, FaEyeSlash } from 'react-icons/fa'; 

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false); 
    
    const { login, loading, error, user } = useAuth();
    const navigate = useNavigate();

    if (user) {
        navigate('/');
        return null;
    }

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await login(username, password);
            navigate('/');
        } catch (e) {
            // A exceção é capturada, mas o erro será exibido pelo 'error' do useAuth
        }
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
            <label className={styles.loginLabel}>
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

            <label className={styles.loginLabel}>
                <span>Senha:</span>
                <div className={styles.passwordInputContainer}>
                    <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    className={styles.loginInput}
                    />
                    <button
                        type="button"
                        onClick={togglePasswordVisibility}
                        className={styles.togglePasswordButton}
                        disabled={loading}
                        aria-label={showPassword ? 'Esconder Senha' : 'Mostrar Senha'}
                    >
                        {/* ALTERADO: Usando componentes de ícone */}
                        {showPassword ? <FaEyeSlash /> : <FaEye />} 
                    </button>
                </div>
            </label>

            <button
                type="submit"
                disabled={loading}
                className={styles.loginButton}
            >
                {loading ? 'ENTRANDO...' : 'ENTRAR'} 
            </button>
            </form>
        </div>
        </div>
    );
};

export default Login;