// src/components/PrivateRoute.jsx

import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom'; // 💡 Importar useNavigate
import { useAuth } from '../context/AuthProvider';
import Menu from '../components/Menu/Menu'; 

const PrivateRoute = ({ children, requiredRoles = [] }) => {
  const { user, canAccess } = useAuth();
  const navigate = useNavigate(); // 💡 Inicializar useNavigate

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRoles.length > 0 && !canAccess(requiredRoles)) {
    return (
      <>
        <Menu currentScreen="Erro" />
        <div style={{ padding: '20px', color: 'var(--red-error)' }}> {/* Usando uma variável CSS, se existir */}
          <h1>Acesso Proibido (403)</h1>
          <p>Você ({user.role}) não tem permissão para visualizar esta página.</p>
          <button onClick={() => navigate("/checklist")} className="btn-primary"> {/* 💡 CORREÇÃO */}
            Voltar para o Checklist
          </button>
        </div>
      </>
    );
  }

  // 3. Se estiver logado E tiver permissão, renderiza o componente filho
  return children;
};

export default PrivateRoute;