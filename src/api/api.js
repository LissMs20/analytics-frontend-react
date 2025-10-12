import axios from 'axios';

const API_BASE_ROOT_URL = import.meta.env.VITE_API_URL; 

const BASE_URL = API_BASE_ROOT_URL ? `${API_BASE_ROOT_URL}/api` : 'http://localhost:8000/api';

const API = axios.create({
  baseURL: BASE_URL, 
  timeout: 15000, 
  headers: {
    'Content-Type': 'application/json',
  },
});

// 💡 Interceptor: Adiciona o token de autenticação (JWT) a cada requisição
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

        // 💡 MODIFICAÇÃO: Captura 'access_token', 'role' E 'name' do retorno da API
        const { access_token, role, name } = response.data; 

        // Salva os dados essenciais no localStorage
        localStorage.setItem('accessToken', access_token);
        localStorage.setItem('userRole', role);
        
        // Decodifica o payload para pegar o username (sub) do token
        const payload = JSON.parse(atob(access_token.split('.')[1]));
        localStorage.setItem('username', payload.sub);

        // 💡 NOVO: Salva o nome no localStorage, se estiver disponível
        if (name) {
            localStorage.setItem('userName', name);
        } else {
            // Garante que o item seja removido se o nome não for retornado (evita lixo)
            localStorage.removeItem('userName'); 
        }

        // 💡 RETORNO ATUALIZADO: Retorna o 'name' junto
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
// Função de Logout
// ----------------------------------------------------
export const logoutUser = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('username');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
};

// ----------------------------------------------------
// FUNÇÕES DE CHECKLIST
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
    
    // 💡 CORREÇÃO AQUI: Garante que PAGE e LIMIT sejam enviados JUNTOS se existirem.
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
// FUNÇÃO DE ANÁLISE DE DADOS DA IA (CORRIGIDA)
// ----------------------------------------------------
/**
 * Envia uma query em linguagem natural para a IA analisar os dados consolidados 
 * pelo backend e retornar um resumo e dados de visualização.
 * Rota: POST /api/analyze
 */
export const analyzeData = async (query) => {
    try {
        // O backend (routers/analysis.py) é quem busca, consolida e analisa os dados.
        // O frontend envia apenas a query.
        const response = await API.post('/analyze', {
            query: query 
        });

        // Retorna o objeto AnalysisResponse (com summary, tips e visualization_data)
        return response.data;
        
    } catch (error) {
        console.error("Erro na análise da IA:", error.response ? error.response.data : error.message);
        throw new Error(error.response?.data?.detail || 'Falha na análise avançada da IA.');
    }
};

// As funções fetchChecklistsForAnalysis e o uso de fetch nativo foram removidos.
// ----------------------------------------------------

// ----------------------------------------------------
// FUNÇÕES DE USUÁRIO
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
// FUNÇÕES DE PRODUÇÃO
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