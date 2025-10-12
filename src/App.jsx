// src/App.jsx (VERSÃO CORRIGIDA)

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthProvider'; 
import Home from './pages/Home/Home';
import Login from './pages/Login/Login'; 
import Checklist from './pages/Checklist/Checklist';
import Assistencia from './pages/Assistencia/Assistencia';
import Historico from './pages/Historico/Historico';
import AnaliseIA from './pages/AnaliseIA/AnaliseIA'; 
// 💡 CERTIFIQUE-SE DE QUE ESTA IMPORTAÇÃO ESTÁ CORRETA
import GerenciarUsuarios from './pages/GerenciarUsuarios/GerenciarUsuarios';
import GerenciarProducao from './pages/GerenciarProducao/GerenciarProducao';  
import PrivateRoute from './components/PrivateRoute';

// Componente para evitar que usuários logados voltem para a tela de Login
const PublicOnlyRoute = ({ children }) => {
    const { user } = useAuth();
    // Se o usuário já está logado, redireciona para o Checklist
    return user ? <Navigate to="/" replace /> : children;
}

function App() {
  // Define o conjunto de roles que qualquer usuário logado pode acessar
  const ALL_ROLES = ['producao', 'assistencia', 'admin'];

  return (
    <Router>
      <AuthProvider> 
        <div className="App">
          <Routes>
            
            {/* 1. Rota de Login */}
            <Route path="/login" element={
                <PublicOnlyRoute><Login /></PublicOnlyRoute>
            } />
            
            {/* ----------------------------------------------------------------- */}
            {/* 2. ROTAS PROTEGIDAS */}
            {/* ----------------------------------------------------------------- */}
            
            {/* Home */}
            <Route path="/" element={
                <PrivateRoute requiredRoles={ALL_ROLES}>
                    <Home /> 
                </PrivateRoute>
            } />
            
            {/* Checklist */}
            <Route path="/checklist" element={
                <PrivateRoute requiredRoles={ALL_ROLES}>
                    <Checklist />
                </PrivateRoute>
            } />
            
            {/* Assistência */}
            <Route path="/assistencia" element={
                <PrivateRoute requiredRoles={['assistencia', 'admin']}>
                    <Assistencia />
                </PrivateRoute>
            } />
            
            {/* Histórico */}
            <Route path="/historico" element={
                <PrivateRoute requiredRoles={ALL_ROLES}>
                    <Historico />
                </PrivateRoute>
            } />
            
            {/* Análise IA */}
            <Route path="/analise-ia" element={
                <PrivateRoute requiredRoles={['assistencia', 'admin']}>
                    <AnaliseIA />
                </PrivateRoute>
            } />

            {/* 💡 NOVA ROTA: Gerenciar Produção - Requer APENAS Admin */}
                        <Route path="/gerenciar-producao" element={
                            <PrivateRoute requiredRoles={['admin']}>
                                <GerenciarProducao />
                            </PrivateRoute>
                        } />

            {/* 💡 ROTA DE GERENCIAR USUÁRIOS: path deve ser exato! */}
            <Route path="/gerenciar-usuarios" element={
                <PrivateRoute requiredRoles={['admin']}>
                    <GerenciarUsuarios />
                </PrivateRoute>
            } />
            
             {/* 3. Rota de 404/Fallback: Redireciona para o login */}
             <Route path="*" element={<Navigate to="/login" replace />} />

          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;