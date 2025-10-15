import React, { useState, useRef, useEffect } from 'react'; // Importamos useRef e useEffect
import Menu from '../../components/Menu/Menu';
import { createChecklist } from '../../api/api';
import { useAuth } from '../../context/AuthProvider';
import { PLACAS_PTH_SMD } from '../../data/PlacasPTH-SMD';
import { OPCOES_FALHA_PRODUCAO, OPCOES_SETOR_PRODUCAO } from '../../data/opcoes';
import styles from '../Checklist/Checklist.module.css';

// Estado inicial para os dados do FORMULÁRIO (inclui a falha temporária)
const initialFormData = {
    produto: '',
    falha: '',
    localizacao_componente: '',
    lado_placa: '',
    setor: '',
    quantidade: 1,
    observacao_producao: '',
};

// Estrutura de Falha a ser adicionada ao array
const initialFalha = {
    falha: '',
    localizacao_componente: '',
    lado_placa: '',
    setor: '',
    observacao_producao: '',
};

const Checklist = () => {
    const { user } = useAuth();
    const [formData, setFormData] = useState(initialFormData);
    const [falhasAdicionadas, setFalhasAdicionadas] = useState([]); // NOVO ESTADO: Array de falhas
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [vaiParaAssistencia, setVaiParaAssistencia] = useState(false);

    // Estado: Termo de pesquisa para a placa
    const [searchQuery, setSearchQuery] = useState('');
    // NOVO ESTADO: Controla a visibilidade da lista de sugestões
    const [showSuggestions, setShowSuggestions] = useState(false);
    
    // Referência para o contêiner de pesquisa, para detectar cliques externos
    const searchRef = useRef(null); 

    // FUNÇÃO DE FILTRAGEM: Otimizada para o array de strings
    const filteredProducts = PLACAS_PTH_SMD.filter(produto =>
        // Converte tudo para minúsculas e verifica se o termo de busca está incluído
        produto.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 10); // Limita a 10 resultados

    // Hook para fechar a lista de sugestões ao clicar fora
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };
        // Adiciona o listener
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            // Remove o listener
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [searchRef]);

    // --- Handlers ---

    const handleChange = (e) => {
        const { name, value, checked } = e.target;

        if (name === 'vaiParaAssistencia') {
            setVaiParaAssistencia(checked);
            if (checked) {
                // Limpa campos de detalhe de defeito e as falhas adicionadas se for para Assistência Técnica
                setFormData(prev => ({
                    ...prev,
                    ...initialFalha,
                    localizacao_componente: '',
                    setor: '',
                    lado_placa: '',
                    observacao_producao: ''
                }));
                setFalhasAdicionadas([]); // Limpa as falhas se mudar para Assistência
            }
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    // HANDLER MODIFICADO: Atualiza o campo produto, o termo de busca e mostra a lista
    const handleProductChange = (e) => {
        const value = e.target.value;
        setFormData(prev => ({ ...prev, produto: value }));
        setSearchQuery(value); // Sincroniza o termo de busca
        setShowSuggestions(value.length > 0 && !isProductDisabled); // Mostra a lista se houver texto e não estiver desabilitado
    };

    // NOVO HANDLER: Seleciona um produto da lista
    const handleSelectProduct = (product) => {
        setFormData(prev => ({ ...prev, produto: product }));
        setSearchQuery(product); // Mantém o termo de busca igual ao produto selecionado
        setShowSuggestions(false); // Esconde a lista
    };

    // NOVO HANDLER: Adiciona a falha atual ao array de falhas
    const handleAddFalha = (e) => {
        e.preventDefault();
        setMessage('');

        // 1. Validação de campos obrigatórios da falha
        if (!formData.falha || !formData.setor) {
            setMessage("Para adicionar uma Falha, os campos 'Falha' e 'Setor Responsável' são obrigatórios.");
            return;
        }
        
        // 2. Cria o objeto de falha a partir do formData
        const novaFalha = {
            falha: formData.falha,
            localizacao_componente: formData.localizacao_componente || null,
            lado_placa: formData.lado_placa || null,
            setor: formData.setor,
            observacao_producao: formData.observacao_producao || null,
        };

        // 3. Adiciona ao array e limpa os campos de defeito
        setFalhasAdicionadas(prev => [...prev, novaFalha]);

        setFormData(prev => ({
            ...prev,
            ...initialFalha, // Limpa apenas os campos de falha
            // Mantém produto e quantidade, que são comuns
        }));
    };

    // NOVO HANDLER: Remove uma falha pelo índice
    const handleRemoveFalha = (index) => {
        setFalhasAdicionadas(prev => prev.filter((_, i) => i !== index));
        setMessage('');
    };

    // --- Lógica de Validação e Desabilitação ---

    const isDefeitoDisabled = vaiParaAssistencia;

    // Habilita/desabilita o campo produto
    const isProductDisabled = falhasAdicionadas.length >= 1;


    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        if (!user || !user.username) {
            setMessage('Erro de autenticação: Usuário não identificado.');
            setLoading(false);
            return;
        }

        // Base de dados a ser enviada
        const dataToSend = {
            produto: formData.produto,
            quantidade: parseInt(formData.quantidade, 10),
            vai_para_assistencia: vaiParaAssistencia,
            responsavel: user.username,
        };

        // 1. Validação de campos obrigatórios (Produto e Quantidade)
        if (!dataToSend.produto || dataToSend.quantidade <= 0) {
            setMessage("Produto e Quantidade são campos obrigatórios.");
            setLoading(false);
            return;
        }

        // 2. Estrutura dos dados de falha
        let falhasParaEnvio = [];
        
        if (vaiParaAssistencia) {
            // Caso Assistência: Não há falhas detalhadas na produção
            falhasParaEnvio = [];
        } else {
            // Caso Produção:
            if (falhasAdicionadas.length > 0) {
                // Múltiplas falhas
                falhasParaEnvio = falhasAdicionadas;
            } else {
                // Uma única falha (Lê os dados do formulário temporário)
                // Validação de Fluxo: Verifica se Falha E Setor estão preenchidos, se for COMPLETO
                if (!formData.falha || !formData.setor) {
                    setMessage("Para criar um Checklist Completo, Falha e Setor são obrigatórios, ou adicione pelo menos uma falha.");
                    setLoading(false);
                    return;
                }
                
                falhasParaEnvio.push({
                    falha: formData.falha,
                    localizacao_componente: formData.localizacao_componente || null,
                    lado_placa: formData.lado_placa || null,
                    setor: formData.setor,
                    observacao_producao: formData.observacao_producao || null,
                });
            }
        }
        
        // Adiciona as falhas no objeto de envio
        dataToSend.falhas = falhasParaEnvio;
        
        // Limpa campos temporários do formData para evitar conflito com a API se 'falhas' for usado
        if (dataToSend.falhas.length > 0) {
             delete dataToSend.falha; 
             delete dataToSend.localizacao_componente;
             delete dataToSend.lado_placa;
             delete dataToSend.setor;
             delete dataToSend.observacao_producao;
        }


        try {
            // Supondo que a API está pronta para receber o array 'falhas'
            const response = await createChecklist(dataToSend); 
            
            // Limpeza e Sucesso
            setMessage(`Checklist criado com sucesso! Documento ID: ${response.documento_id}. Status: ${response.status}.`);
            setFormData(initialFormData);
            setFalhasAdicionadas([]); // Limpa as falhas
            setVaiParaAssistencia(false);
            setSearchQuery('');
            setShowSuggestions(false); // Garante que a lista feche

        } catch (error) {
            console.error("Erro ao salvar:", error);
            // Melhorar a mensagem de erro se o erro for do servidor
            const errorMessage = error.response?.data?.message || "Erro ao salvar: Falha na comunicação com o servidor.";
            setMessage(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleClearProduct = () => {
        setFormData(prev => ({ ...prev, produto: '' }));
        setSearchQuery('');
        setShowSuggestions(false);
    };

    const messageClass = message.startsWith('Erro') || message.includes('obrigatórios') ? 'message-error' : 'message-success';

    return (
        <div className={styles['checklist-container']}>
            <Menu currentScreen="Checklist" />
            
            <form onSubmit={handleSubmit} className={styles['checklist-form']}>
                <h1>Registro de Defeito (Checklist)</h1>
                
                {message && (
                    <p className={`${styles['message-status']} ${messageClass}`}>
                        {message}
                    </p>
                )}

                {/* --- 1. FLUXO DE ASSISTÊNCIA (Cartão Roxo) --- */}
                {/* ... (código do card 1 permanece o mesmo) ... */}
                <div className={`${styles['checklist-form-card']} ${styles['assistance-flow-box']}`}>
                    <h2>Fluxo de Destino</h2>
                    <label className={styles['toggle-label-container']}>
                        <input
                            type="checkbox"
                            name="vaiParaAssistencia"
                            checked={vaiParaAssistencia}
                            onChange={handleChange}
                            className={styles['toggle-checkbox']}
                            id="assistencia-toggle"
                            // Desabilita o toggle se já houver falhas adicionadas
                            disabled={falhasAdicionadas.length > 0} 
                        />
                        <div className={styles['toggle-switch']}>
                            <span className={styles['toggle-slider']}></span>
                        </div>
                        <span className={styles['toggle-text']}>
                            Marcar para Assistência Técnica (Salvar como PENDENTE)
                        </span>
                    </label>
                    <p className={styles['assistance-info']}>
                        Se marcado, os detalhes do defeito serão preenchidos pela Assistência depois.
                        {falhasAdicionadas.length > 0 && 
                            <span className={styles['warning-text']}> (Desabilitado pois já há falhas adicionadas)</span>
                        }
                    </p>
                </div>

                {/* --- 2. INFORMAÇÕES DA PLACA (Cartão Principal) --- */}
                <div className={`${styles['checklist-form-card']} ${showSuggestions && searchQuery.length > 0 && !isProductDisabled ? styles['z-index-raised'] : ''}`}> {/* <- MUDANÇA AQUI */}
                    <h2>Informações da Placa</h2>
                    
                    <div className={styles['form-grid-2']}>
                        {/* CAMPO PRODUTO (Pesquisa/Lista Estilizada) */}
                        <div ref={searchRef} className={styles['product-search-container']}>
                            <label className={isProductDisabled ? styles['field-disabled'] : ''}>
                                Produto (Pesquisar/Selecionar):
                                <input
                                    type="text"
                                    name="produto"
                                    placeholder='Procure pelo código reduzido ou nome da placa'
                                    value={formData.produto}
                                    onChange={handleProductChange}
                                    onFocus={() => { if (searchQuery.length > 0) setShowSuggestions(true); }} // Mostra ao focar se já houver texto
                                    required
                                    disabled={isProductDisabled}
                                />

                                {searchQuery.length > 0 && !isProductDisabled && (
                                    <button
                                        type="button"
                                        onClick={handleClearProduct}
                                        className={styles['clear-button']}
                                        aria-label="Limpar campo de produto"
                                    >
                                        &times; {/* Caractere HTML para 'x' */}
                                    </button>
                                )}
                                
                                {showSuggestions && searchQuery.length > 0 && !isProductDisabled && filteredProducts.length > 0 && (
                                    <ul className={styles['suggestions-list']}>
                                        {filteredProducts.map((produto) => (
                                            <li 
                                                key={produto} 
                                                className={styles['suggestion-item']}
                                                onClick={() => handleSelectProduct(produto)}
                                            >
                                                {produto}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                {/* FIM DA NOVA LISTA */}
                            </label>
                            {isProductDisabled && (
                                <p className={styles['no-product-found']}>
                                    Produto desabilitado ao adicionar falhas. Remova as falhas para alterar.
                                </p>
                            )}
                        </div>
                        
                        {/* CAMPO QUANTIDADE */}
                        <label>
                            Quantidade:
                           <input
                                type="number"
                                name="quantidade"
                                value={formData.quantidade}
                                onChange={handleChange}
                                min="1"
                                required
                                className={styles['input-align-right']}
                            />
                        </label>
                    </div>
                </div>

                {/* --- 3. DETALHES DO DEFEITO (Cartão com Desabilitação) --- */}
                {/* ... (restante do código do formulário permanece o mesmo) ... */}
                <div className={`${styles['checklist-form-card']} ${isDefeitoDisabled ? styles['card-disabled'] : ''}`}>
                    <h2>Detalhes do Defeito</h2>
                    
                     {/* Linha 1: Falha e Setor (Obrigatórios) */}
                    <div className={styles['form-grid-2']}>
                        {/* CAMPO FALHA (SELECT) */}
                        <label className={isDefeitoDisabled ? styles['field-disabled'] : ''}>
                            Falha (Defeito Encontrado):
                            <select
                                name="falha"
                                value={formData.falha}
                                onChange={handleChange}
                                disabled={isDefeitoDisabled}
                                required={!isDefeitoDisabled && falhasAdicionadas.length === 0}
                            >
                                <option value="" disabled>Selecione o Tipo de Falha</option>
                                {OPCOES_FALHA_PRODUCAO.map(opcao => (
                                    <option key={opcao} value={opcao}>{opcao}</option>
                                ))}
                            </select>
                        </label>
                        
                        {/* CAMPO SETOR RESPONSÁVEL (SELECT) */}
                        <label className={isDefeitoDisabled ? styles['field-disabled'] : ''}>
                            Setor Responsável:
                            <select
                                name="setor"
                                value={formData.setor}
                                onChange={handleChange}
                                disabled={isDefeitoDisabled}
                                required={!isDefeitoDisabled && falhasAdicionadas.length === 0}
                            >
                                <option value="" disabled> Selecione o Setor </option>
                                {OPCOES_SETOR_PRODUCAO.map(opcao => (
                                    <option key={opcao} value={opcao}>{opcao}</option>
                                ))}
                            </select>
                        </label>
                    </div>

                    {/* Linha 2: Localização e Lado da Placa (Opcionais) */}
                    <div className={styles['form-grid-3']}>
                        {/* CAMPO LOCALIZAÇÃO (TEXTO) - Ocupa 2/3 */}
                        <label className={isDefeitoDisabled ? `${styles['field-disabled']} ${styles['grid-span-2']}` : styles['grid-span-2']}>
                            Localização do Componente:
                            <input
                                type="text"
                                name="localizacao_componente"
                                placeholder="Ex.: D10"
                                value={formData.localizacao_componente}
                                onChange={handleChange}
                                disabled={isDefeitoDisabled}
                            />
                        </label>
                        
                        {/* CAMPO LADO DA PLACA (SELECT) - Ocupa 1/3 */}
                        <label className={isDefeitoDisabled ? styles['field-disabled'] : ''}>
                            Lado da Placa:
                            <select name="lado_placa" value={formData.lado_placa} onChange={handleChange} disabled={isDefeitoDisabled}>
                                <option value="" disabled>Selecione o lado</option>
                                <option value="bot">BOT</option>
                                <option value="top">TOP</option>
                            </select>
                        </label>
                    </div>

                    {/* Campo Observação */}
                    <label className={isDefeitoDisabled ? styles['field-disabled'] : ''}>
                        Observação (Detalhes Adicionais):
                        <textarea
                            name="observacao_producao"
                            value={formData.observacao_producao}
                            onChange={handleChange}
                            disabled={isDefeitoDisabled}
                            rows="3"
                            className={styles['form-textarea']}
                        />
                    </label>

                    {/* BOTÃO DE ADICIONAR FALHA */}
                    {!isDefeitoDisabled && (
                        <button 
                            type="button" 
                            onClick={handleAddFalha} 
                            className={styles['add-falha-button']}
                            disabled={!formData.falha || !formData.setor}
                        >
                            Adicionar Falha à Lista ({falhasAdicionadas.length})
                        </button>
                    )}

                </div> {/* Fim do Cartão de Detalhes do Defeito */}
                
                {/* --- 4. LISTA DE FALHAS ADICIONADAS --- */}
                {/* ... (código do card 4 permanece o mesmo) ... */}
                {falhasAdicionadas.length > 0 && (
                    <div className={`${styles['checklist-form-card']} ${styles['added-falhas-card']}`}>
                        <h2>Falhas Adicionadas: {falhasAdicionadas.length}</h2>
                        <ul className={styles['falhas-list']}>
                            {falhasAdicionadas.map((falha, index) => (
                                <li key={index} className={styles['falha-item']}>
                                    <div className={styles['falha-details']}>
                                        <p><strong>Falha:</strong> {falha.falha}</p>
                                        <p><strong>Setor:</strong> {falha.setor}</p>
                                        {falha.localizacao_componente && <p><strong>Localização:</strong> {falha.localizacao_componente}</p>}
                                        {falha.lado_placa && <p><strong>Lado:</strong> {falha.lado_placa}</p>}
                                    </div>
                                    <button 
                                        type="button" 
                                        onClick={() => handleRemoveFalha(index)}
                                        className={styles['remove-falha-button']}
                                    >
                                        Remover
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                
                {/* --- BOTÃO DE SUBMISSÃO FINAL --- */}
                <button type="submit" disabled={loading} className={styles['submit-button']}>
                    {loading ? 'Salvando...' : 'Salvar Checklist'}
                </button>
            </form>

        </div>
    );
};

export default Checklist;