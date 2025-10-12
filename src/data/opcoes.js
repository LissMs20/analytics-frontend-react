// Arquivo: src/data/opcoes.js

// --- Opções usadas no registro inicial (Produção/Checklist.jsx) ---
export const OPCOES_FALHA_PRODUCAO = [
    'Curto de solda',
    'Solda fria',
    'Falha de solda',
    'Componente incorreto',
    'Componente faltando',
    'Trilha rompida',
    'Outros',
];

// Se o setor for o mesmo em Produção e Assistência, você pode manter uma única lista (OPCOES_SETOR),
// mas para clareza e segurança, vou duplicar a definição e dar um nome específico.
export const OPCOES_SETOR_PRODUCAO = [
    'SMT',
    'Revisão - Sylmara',
    'Revisão - Cryslainy',
    'Revisão - Venâncio',
    'Revisão - Evilla',
    'Revisão - Outros',
    'Proteção 1',
    'Proteção 2',
    'Tempo',
    'Nível',
    'Assistência',
];

// --- Opções usadas na conclusão (Assistência/AssistenciaEditor.jsx) ---
export const OPCOES_FALHA_ASSISTENCIA = [
    'Curto de solda',
    'Solda fria',
    'Falha de solda',
    'Defeito no componente',
    'Componente incorreto',
    'Componente faltando',
    'Trilha rompida',
    'Falha de gravação',
    'Sem defeito',
    'Outros',
];

export const OPCOES_SETOR_ASSISTENCIA = [
    'SMT',
    'Revisão - Sylmara',
    'Revisão - Cryslainy',
    'Revisão - Venâncio',
    'Revisão - Evilla',
    'Revisão - Outros',
    'Proteção 1',
    'Proteção 2',
    'Tempo',
    'Nível',
];

// Para setores, se eles forem IGUAIS, você pode exportar apenas 'OPCOES_SETOR' e usá-la nos dois.
// Mas se houver qualquer chance de divergência, mantenha os nomes separados.