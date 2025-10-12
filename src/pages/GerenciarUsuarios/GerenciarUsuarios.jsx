// src/pages/GerenciarUsuarios.jsx

import React, { useState, useEffect } from 'react';
import Menu from '../../components/Menu/Menu';
// Mantemos a importação da API
import { listUsers, createUser, updateUser, deleteUser } from '../../api/api';
import styles from '../GerenciarUsuarios/GerenciarUsuarios.module.css'; 

const ROLES_DISPONIVEIS = ['producao', 'assistencia', 'admin'];

const GerenciarUsuarios = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    // 💡 ATUALIZAÇÃO 1: Adicionar 'name' ao estado inicial do formulário
    const [newUserForm, setNewUserForm] = useState({ name: '', username: '', password: '', role: 'producao' });
    const [isCreating, setIsCreating] = useState(false);
    
    // 💡 NOVO ESTADO: Armazena o ID do usuário em edição para o campo de nome
    const [editingNameId, setEditingNameId] = useState(null);
    const [editingNameValue, setEditingNameValue] = useState('');


    const fetchUsers = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await listUsers();
            setUsers(data);
        } catch (err) {
            setError(err.message || "Erro ao carregar lista de usuários.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    // --- Lógica de Criação ---
    const handleNewUserChange = (e) => {
        setNewUserForm({ ...newUserForm, [e.target.name]: e.target.value });
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        setIsCreating(true);
        setError(null);
        try {
            // A função createUser enviará o objeto completo, incluindo 'name'
            await createUser(newUserForm); 
            // Limpa o formulário, incluindo o novo campo 'name'
            setNewUserForm({ name: '', username: '', password: '', role: 'producao' }); 
            await fetchUsers(); // Recarrega a lista
        } catch (err) {
            setError(err.message);
        } finally {
            setIsCreating(false);
        }
    };

    // --- Lógica de Atualização (Role) ---
    const handleRoleChange = async (userId, newRole) => {
        setError(null);
        // Otimista: atualiza localmente primeiro
        setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
        
        try {
            await updateUser(userId, { role: newRole });
        } catch (err) {
            setError(err.message);
            // Reverte o estado em caso de falha
            fetchUsers(); 
        }
    };
    
    // 💡 NOVO: Lógica de Atualização (Nome)
    const handleNameUpdate = async (userId, newName) => {
        setEditingNameId(null); // Sai do modo de edição
        setEditingNameValue('');
        
        // Verifica se o nome mudou e não está vazio
        const currentUser = users.find(u => u.id === userId);
        if (!newName || newName === currentUser.name) return;

        setError(null);
        // Otimista: atualiza localmente primeiro
        setUsers(users.map(u => u.id === userId ? { ...u, name: newName } : u));
        
        try {
            await updateUser(userId, { name: newName });
        } catch (err) {
            setError(err.message);
            // Reverte o estado em caso de falha
            fetchUsers(); 
        }
    };

    // --- Lógica de Exclusão ---
    const handleDeleteUser = async (userId, username) => {
        if (!window.confirm(`Tem certeza que deseja excluir o usuário ${username}?`)) {
            return;
        }
        setError(null);
        try {
            await deleteUser(userId);
            await fetchUsers(); // Recarrega a lista
        } catch (err) {
            setError(err.message);
        }
    };

    if (loading) return <div className="container"><Menu currentScreen="Gerenciar Usuários" /><p>Carregando usuários...</p></div>;

    return (
        <div className={`container ${styles.gerenciarUsuariosContainer}`}>
            <Menu currentScreen="Gerenciar Usuários" />
            <h1>Gerenciamento de Usuários (Admin)</h1>
            
            {error && <p className={styles.errorMessage}>Erro: {error}</p>}

            {/* Formulário de Criação */}
            <div className={`${styles.card} ${styles.userCreationForm}`}>
                <h2>Criar Novo Usuário</h2>
                <form onSubmit={handleCreateUser}>
                    {/* 💡 ATUALIZAÇÃO 2: Novo campo de Nome */}
                    <input
                        type="text"
                        name="name"
                        placeholder="Nome e sobrenome"
                        value={newUserForm.name}
                        onChange={handleNewUserChange}
                        required
                    />
                    <input
                        type="text"
                        name="username"
                        placeholder="Nome de Usuário"
                        value={newUserForm.username}
                        onChange={handleNewUserChange}
                        required
                    />
                    <input
                        type="password"
                        name="password"
                        placeholder="Senha (Mín. 6 caracteres)"
                        value={newUserForm.password}
                        onChange={handleNewUserChange}
                        required
                    />
                    <select name="role" value={newUserForm.role} onChange={handleNewUserChange} required>
                        {ROLES_DISPONIVEIS.map(role => (
                            <option key={role} value={role}>{role.toUpperCase()}</option>
                        ))}
                    </select>
                    <button type="submit" disabled={isCreating}>
                        {isCreating ? 'Criando...' : 'Criar Usuário'}
                    </button>
                </form>
            </div>
            
            <hr />

            {/* Tabela de Usuários */}
            <h2>Lista de Usuários ({users.length})</h2>
            <table className={styles.userManagementTable}>
                <thead>
                    <tr>
                        <th>ID</th>
                        {/* 💡 ATUALIZAÇÃO 3: Nova coluna para o Nome */}
                        <th>Nome</th> 
                        <th>Username</th>
                        <th>Role</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map((user) => (
                        <tr key={user.id}>
                            <td>{user.id}</td>
                            
                            {/* 💡 ATUALIZAÇÃO 4: Renderiza o Nome com modo de edição inline */}
                            <td 
                                onDoubleClick={() => { // Inicia a edição com duplo clique
                                    setEditingNameId(user.id);
                                    setEditingNameValue(user.name);
                                }}
                            >
                                {editingNameId === user.id ? (
                                    <input
                                        type="text"
                                        value={editingNameValue}
                                        onChange={(e) => setEditingNameValue(e.target.value)}
                                        onBlur={(e) => handleNameUpdate(user.id, e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                handleNameUpdate(user.id, e.target.value);
                                            }
                                            if (e.key === 'Escape') {
                                                setEditingNameId(null);
                                            }
                                        }}
                                        autoFocus
                                        className={styles.nameInputInline}
                                    />
                                ) : (
                                    <span title="Dê um duplo clique para editar">{user.name}</span>
                                )}
                            </td>
                            
                            <td>{user.username}</td>
                            <td>
                                {/* Dropdown para mudar a Role */}
                                <select 
                                    value={user.role} 
                                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                    // Impede de alterar a própria role de admin (Opcional)
                                    // Poderia usar user.id === logged_user.id para ser mais seguro
                                    disabled={user.role === 'admin'} 
                                >
                                    {ROLES_DISPONIVEIS.map(role => (
                                        <option key={role} value={role}>{role.toUpperCase()}</option>
                                    ))}
                                </select>
                            </td>
                            <td>
                                <button 
                                    onClick={() => handleDeleteUser(user.id, user.username)} 
                                    className={styles.btnDelete}
                                    // Impede de excluir o próprio admin logado (Garantia)
                                    disabled={user.role === 'admin'} 
                                >
                                    Excluir
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default GerenciarUsuarios;