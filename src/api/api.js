import axios from 'axios';

const API_BASE_ROOT_URL = import.meta.env.VITE_API_URL; 

const BASE_URL = API_BASE_ROOT_URL ? `${API_BASE_ROOT_URL}/api` : 'http://localhost:8000/api';

const API = axios.create({
  baseURL: BASE_URL, 
  timeout: 60000, 
  headers: {
    'Content-Type': 'application/json',
  },
});

// ----------------------------------------------------
// 💡 LÓGICA DE TRATAMENTO DE EXPIRAÇÃO
// ----------------------------------------------------

// Variável para armazenar a função de logout/redirecionamento que vem do AuthProvider.
// A função deve aceitar uma mensagem de erro opcional.
let onTokenExpiredHandler = (message = null) => {
    // console.log("Handler de expiração de token chamado, mas não configurado.");
};

/**
 * Função pública para o AuthProvider injetar a função de redirecionamento/logout.
 * @param {Function} handler - A função que limpa o estado e redireciona para /login.
 */
export const setTokenExpiredHandler = (handler) => {
    onTokenExpiredHandler = handler;
};

// ----------------------------------------------------
// Interceptor de Requisição: Adiciona o token (Permanece igual)
// ----------------------------------------------------
API.interceptors.request.use(
  (config) => {
    // Tenta obter o token do armazenamento local (se existir)
    const token = localStorage.getItem('accessToken'); 
    if (token) {
      // O cabeçalho Authorization será incluído automaticamente
      config.headers.Authorization = `Bearer ${token}`; 
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ----------------------------------------------------
// 💡 Interceptor de Resposta: Captura o 401 (Chave para o retorno automático)
// ----------------------------------------------------
API.interceptors.response.use(
    (response) => {
        // Resposta OK. Apenas retorna.
        return response;
    },
    (error) => {
        // Verifica se há uma resposta e se o status é 401 (Unauthorized/Token Expirado)
        if (error.response && error.response.status === 401) {
            console.warn('Sessão expirada (401). Forçando logout e redirecionamento.');
            
            // 🚨 Chama o handler injetado, passando a mensagem de erro
            onTokenExpiredHandler("Sua sessão expirou. Por favor, faça login novamente.");
            
            // Rejeita a Promise para evitar que o código que chamou a API continue processando
            return Promise.reject(error);
        }

        // Para outros erros (400, 500, etc.), apenas repassa.
        return Promise.reject(error);
    }
);

// ----------------------------------------------------
// Função de Login
// ----------------------------------------------------
export const loginUser = async (username, password) => {
    try {
        const form = new URLSearchParams();
        form.append('username', username);
        form.append('password', password);

        // Rota /api/token
        const response = await API.post('/token', form, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });

        // Captura 'access_token', 'role' E 'name' do retorno da API
        const { access_token, role, name } = response.data; 

        // Salva os dados essenciais no localStorage
        localStorage.setItem('accessToken', access_token);
        localStorage.setItem('userRole', role);
        
        // Decodifica o payload para pegar o username (sub) do token
        const payload = JSON.parse(atob(access_token.split('.')[1]));
        localStorage.setItem('username', payload.sub);

        // Salva o nome no localStorage, se estiver disponível
        if (name) {
            localStorage.setItem('userName', name);
        } else {
            localStorage.removeItem('userName'); 
        }

        // Retorna o objeto de usuário
        return { 
            username: payload.sub, 
            role: role,
            name: name 
        };
        
    } catch (error) {
        console.error("Erro ao fazer login:", error.response ? error.response.data : error.message);
        throw error;
    }
};

// ----------------------------------------------------
// Função de Logout (Permanece igual)
// ----------------------------------------------------
export const logoutUser = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('username');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
};

// ----------------------------------------------------
// FUNÇÕES DE CHECKLIST (Permanece igual)
// ----------------------------------------------------

export const createChecklist = async (data) => {
  try {
    const response = await API.post('/checklists/', data);
    return response.data; 
  } catch (error) {
    console.error("Erro ao criar checklist:", error.response ? error.response.data : error.message);
    throw error;
  }
};

export const listChecklists = async (status = null, page = null, limit = null, search = null) => {  
  try {
    let url = '/checklists/';
    
    const params = new URLSearchParams();
    if (status) {
      params.append('status', status);
    }
    if (search) {
      params.append('search', search);
    }
    
    if (page !== null) {
      params.append('page', page);
    } 
    if (limit !== null) {
      params.append('limit', limit);
    }

    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    const response = await API.get(url); 
    return response.data; 
  } catch (error) {
    console.error("Erro ao listar checklists:", error.response ? error.response.data : error.message);
    throw error;
  }
};

export const getChecklistById = async (documentoId) => {
  try {
    const response = await API.get(`/checklists/${documentoId}`);
    return response.data;
  } catch (error) {
    console.error(`Erro ao buscar checklist ${documentoId}:`, error.response ? error.response.data : error.message);
    throw error;
  }
};

export const updateChecklist = async (documentoId, data) => {
  try {
    const response = await API.patch(`/checklists/${documentoId}`, data);
    return response.data;
  } catch (error) {
    console.error(`Erro ao atualizar checklist ${documentoId}:`, error.response ? error.response.data : error.message);
    throw error;
  }
};

// ----------------------------------------------------
// FUNÇÃO DE ANÁLISE DE DADOS DA IA (Permanece igual)
// ----------------------------------------------------
export const analyzeData = async (query) => {
    try {
        const response = await API.post('/analyze', {
            query: query 
        });

        return response.data;
        
    } catch (error) {
        console.error("Erro na análise da IA:", error.response ? error.response.data : error.message);
        
        // 💡 VERIFICA SE O ERRO É DE TIMEOUT DO AXIOS (e.g., "timeout of 30000ms exceeded")
        if (axios.isCancel(error) || error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
            throw new Error('Tempo limite da análise excedido (30s). Tente novamente ou simplifique a consulta.');
        }

        // Trata erros do servidor (4xx, 5xx)
        throw new Error(error.response?.data?.detail || 'Falha na análise avançada da IA.');
    }
};

// ----------------------------------------------------
// FUNÇÕES DE USUÁRIO (Permanece igual)
// ----------------------------------------------------
export const listUsers = async () => {
    try {
        const response = await API.get('/users/');
        return response.data; 
    } catch (error) {
        console.error("Erro ao listar usuários:", error.response ? error.response.data : error.message);
        throw new Error(error.response?.data?.detail || 'Falha ao listar usuários.');
    }
};

export const createUser = async (data) => {
    try {
        const response = await API.post('/users/', data);
        return response.data;
    } catch (error) {
        console.error("Erro ao criar usuário:", error.response ? error.response.data : error.message);
        throw new Error(error.response?.data?.detail || 'Falha ao criar usuário.');
    }
};

export const updateUser = async (userId, data) => {
    try {
        const response = await API.patch(`/users/${userId}`, data);
        return response.data;
    } catch (error) {
        console.error(`Erro ao atualizar usuário ${userId}:`, error.response ? error.response.data : error.message);
        throw new Error(error.response?.data?.detail || 'Falha ao atualizar usuário.');
    }
};

export const deleteUser = async (userId) => {
    try {
        const response = await API.delete(`/users/${userId}`);
        return response.data;
    } catch (error) {
        console.error(`Erro ao excluir usuário ${userId}:`, error.response ? error.response.data : error.message);
        throw new Error(error.response?.data?.detail || 'Falha ao excluir usuário.');
    }
};

// ----------------------------------------------------
// FUNÇÕES DE PRODUÇÃO (Permanece igual)
// ----------------------------------------------------
export const createProducao = async (data) => {
    try {
        const response = await API.post('/producao/', data);
        return response.data;
    } catch (error) {
        console.error("Erro ao criar registro de produção:", error.response ? error.response.data : error.message);
        throw new Error(error.response?.data?.detail || 'Falha ao registrar produção.');
    }
};

export const listProducao = async () => {
    try {
        const response = await API.get('/producao/');
        return response.data;
    } catch (error) {
        console.error("Erro ao listar registros de produção:", error.response ? error.response.data : error.message);
        throw new Error(error.response?.data?.detail || 'Falha ao carregar registros de produção.');
    }
};

export const deleteProducao = async (id) => {
    try {
        const response = await API.delete(`/producao/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Erro ao deletar registro de produção ${id}:`, error.response ? error.response.data : error.message);
        throw new Error(error.response?.data?.detail || 'Falha ao deletar registro de produção.');
    }
};