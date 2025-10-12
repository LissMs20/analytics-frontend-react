// src/pages/AssistenciaEditor.jsx

import React, { useState, useEffect } from 'react';
import { getChecklistById, updateChecklist } from '../../api/api';
import { useAuth } from '../../context/AuthProvider'; 
import { OPCOES_FALHA_ASSISTENCIA, OPCOES_SETOR_ASSISTENCIA } from '../../data/opcoes'; 
// AQUI: Importa o módulo CSS para o objeto 'styles'
import styles from '../Assistencia/AssistenciaEditor.module.css'; // Supondo que o módulo CSS se chama AssistenciaEditor.module.css

// ---------------------------------

// Estrutura de Falha para limpar o formulário após a adição (partial state)
const initialFalha = {
    falha: '',
    localizacao_componente: '',
    lado_placa: 'bot', 
    setor: '',
    observacao_assistencia_defeito: '', // Usado apenas como campo temporário para a falha
};

// Estado inicial COMPLETO do formulário.
const initialFormState = {
    ...initialFalha, // Inclui os campos temporários para a falha única/adição
    status: 'COMPLETO', 
    quantidade: 0,      
    observacao_assistencia: '', // Observação GERAL da Assistência
};

// Auxiliar para formatar data e hora
const formatDateTime = (isoString) => {
    if (!isoString) return 'N/A';
    
    const date = new Date(isoString.endsWith('Z') ? isoString : isoString + 'Z'); 
    
    if (isNaN(date)) {
        return new Date(isoString).toLocaleString('pt-BR');
    }

    return date.toLocaleString('pt-BR');
};

const AssistenciaEditor = ({ documentoId, onEditorExit }) => { 
    const { user } = useAuth(); 
    
    const [formData, setFormData] = useState(initialFormState);
    const [falhasAdicionadas, setFalhasAdicionadas] = useState([]); // Array de Falhas
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [initialData, setInitialData] = useState(null);  

    // 1. Carrega os dados existentes e as falhas
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setMessage('');
            try {
                const data = await getChecklistById(documentoId);
                setInitialData(data);
                
                // --- LÓGICA DE CARREGAMENTO DAS FALHAS ---
                let falhasIniciais = [];
                if (data.falhas_json) {
                    try {
                        const parsed = JSON.parse(data.falhas_json);
                        if (Array.isArray(parsed) && parsed.length > 0) {
                            falhasIniciais = parsed;
                        }
                    } catch (e) {
                        console.error("Erro ao fazer parse de falhas_json:", e);
                    }
                }
                setFalhasAdicionadas(falhasIniciais); // CARREGA AS FALHAS

                // Pré-popula o formulário.
                if (falhasIniciais.length === 0) {
                    // Caso sem lista de falhas, usa os campos de falha única para edição/submissão
                    setFormData({
                        falha: data.falha || '',
                        localizacao_componente: data.localizacao_componente || data.localizacao || '', 
                        lado_placa: data.lado_placa || data.lado || 'bot', 
                        setor: data.setor || '',
                        quantidade: data.quantidade || 0, 
                        status: data.status === 'COMPLETO' ? 'COMPLETO' : 'COMPLETO', 
                        observacao_assistencia: data.observacao_assistencia || '', 
                        observacao_assistencia_defeito: '',
                    });
                } else {
                    // Caso com lista de falhas, limpa o form de falha única
                    setFormData(prev => ({ 
                        ...initialFormState, 
                        quantidade: data.quantidade || 0,
                        observacao_assistencia: data.observacao_assistencia || '', 
                    }));
                }
                
            } catch (err) {
                console.error("Erro ao carregar documento:", err);
                setMessage(`Erro ao carregar documento: ${err.message}`);
                setInitialData(null);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [documentoId]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ 
            ...prev, 
            [name]: name === 'quantidade' ? Number(value) : value 
        }));
    };

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
            observacao_producao: formData.observacao_assistencia_defeito || null, 
        };

        // 3. Adiciona ao array e limpa os campos de defeito
        setFalhasAdicionadas(prev => [...prev, novaFalha]);

        setFormData(prev => ({
            ...prev,
            ...initialFalha, // Limpa apenas os campos de falha
            // Mantém quantidade e observacao_assistencia geral
            quantidade: prev.quantidade, 
            observacao_assistencia: prev.observacao_assistencia,
        }));
    };

    const handleRemoveFalha = (index) => {
        setFalhasAdicionadas(prev => prev.filter((_, i) => i !== index));
        setMessage('');
    };


    // 2. Envia os dados atualizados (PATCH)
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        const isSingleFalhaValid = formData.falha && formData.setor;

        // Validação: Deve haver falhas na lista OU a falha única deve ser válida
        if (falhasAdicionadas.length === 0 && !isSingleFalhaValid) {
            setMessage('Erro: Adicione pelo menos uma Falha ou preencha a Falha e o Setor no formulário abaixo para o defeito único.');
            setLoading(false);
            return;
        }
        
        if (!user || !user.username) {
            setMessage('Erro: Necessário estar logado para finalizar a assistência.');
            setLoading(false);
            return;
        }

        let falhasParaEnvio = [];
        
        if (falhasAdicionadas.length > 0) {
            falhasParaEnvio = falhasAdicionadas;
        } else if (isSingleFalhaValid) {
            // Se não houver falhas adicionadas, usa o que está no form como falha única.
            falhasParaEnvio.push({
                falha: formData.falha,
                localizacao_componente: formData.localizacao_componente || null,
                lado_placa: formData.lado_placa || null,
                setor: formData.setor,
                observacao_producao: formData.observacao_assistencia_defeito || null,
            });
        }
        
        try {
            // Inicializa o payload
            const updatePayload = {
                quantidade: formData.quantidade,
                status: formData.status,
                observacao_assistencia: formData.observacao_assistencia || '',
                responsavel_assistencia: user.username, 
                // Serializa o array de falhas para JSON string 
                falhas_json: JSON.stringify(falhasParaEnvio), 
            };
            
            // Lógica de compatibilidade para observação de Produção antiga
            if (initialData.observacao && !initialData.observacao_producao) {
                updatePayload.observacao_producao = initialData.observacao;
            }
            
            const response = await updateChecklist(documentoId, updatePayload);
            
            setMessage(`✅ Documento ${response.documento_id} atualizado e ${response.status}! Voltando para a lista...`);
            
            setTimeout(() => onEditorExit(), 2000); 
            
        } catch (error) {
            setMessage(`Erro ao salvar: ${error.message || "Verifique o console."}`);
        } finally {
            setLoading(false);
        }
    };

    if (loading && !initialData) {
        // Aplica a classe do módulo
        return <p className={styles.loadingMessage}>Carregando dados do documento...</p>;
    }
    
    if (!initialData && !loading) {
        // Aplica a classe do módulo
        return (
            <div className={styles.checklistContainer}> 
                <p className={styles.messageError}>{message}</p>
                {/* Aplica a classe do módulo */}
                <button 
                    onClick={onEditorExit}
                    className={styles.addFalhaButton} // Reutiliza um estilo de botão
                >
                    Voltar para a Lista
                </button>
            </div>
        );
    }
    
    const observacaoProducao = initialData.observacao_producao || initialData.observacao;

    let iaResultParsed = null;
    if (initialData.resultado_ia) {
        try {
            iaResultParsed = JSON.parse(initialData.resultado_ia);
        } catch (e) {
            iaResultParsed = { error: "Formato de JSON inválido no resultado da IA." };
        }
    }
    
    return (
        // Aplica a classe do módulo (O container principal)
        <div className={styles.checklistContainer}>
            <div class="formGroupVertical"> 
                <div class="formGroupVertical1"> 
            {/* ------------------ CABEÇALHO E DETALHES ------------------ */}
            <div className={styles.editorHeader}>
                {/* Usa a classe H1 global que está no CSS */}
                <h1 className={styles.checklistFormH1}>Edição do Documento: {documentoId}</h1>
                <button 
                    onClick={onEditorExit} 
                    disabled={loading} 
                    // Aplica a classe do módulo (Botão secundário)
                    className={styles.addFalhaButton} // Usando o botão de adição como secundário/voltar
                >
                    Voltar para Pendentes
                </button>
                </div>
            </div>

            {/* Aplica a classe do módulo de Card Interno */}
            <div className={styles.checklistFormCard}>
                <h2>Detalhes do Documento</h2>
                <p>Produto: <strong>{initialData.produto}</strong></p>
                
                <p>
                    <label className={styles.formLabel} style={{marginBottom: '0'}}>
                        Quantidade: 
                        <input 
                            type="number" 
                            name="quantidade" 
                            value={formData.quantidade} 
                            onChange={handleChange} 
                            // Aplica classes do módulo
                            className={`${styles.formInput} ${styles.inputAlignRight}`} 
                            style={{width: '100px', display: 'inline-block', marginLeft: '10px'}}
                        />
                    </label>
                </p>
                
                <p>Responsável (Criação): <strong>{initialData.responsavel}</strong></p>
                <p>Data Criação: <strong>{formatDateTime(initialData.data_criacao)}</strong></p>
                <p>
                    Status Atual: 
                    <strong style={{color: initialData.status === 'PENDENTE' ? 'orange' : 'green'}}>
                        {initialData.status}
                    </strong>
                </p>

                {initialData.responsavel_assistencia && (
                    <>
                        <hr style={{borderColor: 'rgba(0,198,255,0.1)'}}/>
                        <p>Finalizado por: <strong>{initialData.responsavel_assistencia}</strong></p>
                        <p>Data Finalização: <strong>{formatDateTime(initialData.data_finalizacao)}</strong></p>
                    </>
                )}

                {observacaoProducao && (
                    <div className={styles.assistanceObservation}>
                        <h4>Observação da Produção:</h4>
                        <p><strong>{observacaoProducao}</strong></p>
                    </div>
                )}
                
                {initialData.observacao_assistencia && (
                    <div className={styles.assistanceObservation}>
                        <h4>Observação Prévia da Assistência:</h4>
                        <p><strong>{initialData.observacao_assistencia}</strong></p>
                    </div>
                )}
            </div>
            
            {message && (
                // Aplica classes do módulo condicionalmente
                <p className={message.startsWith('✅') ? styles.messageSuccess : styles.messageError}>
                    {message}
                </p>
            )}
            
            {/* O FORMULÁRIO COMPLETO RECEBE A CLASSE DE CARD PRINCIPAL */}
            <form onSubmit={handleSubmit} className={styles.checklistForm}> 
                
                {/* 💡 LISTA DE FALHAS ADICIONADAS */}
                {falhasAdicionadas.length > 0 && (
                    // Aplica a classe do módulo (added-falhas-card tem um design especial no CSS)
                    <div className={styles.addedFalhasCard}>
                        <h2>Falhas/Defeitos Registrados: {falhasAdicionadas.length}</h2>
                        <p className={styles.infoText}>Estes defeitos serão enviados com o documento. Você pode adicionar mais ou removê-los.</p>
                        <ul className={styles.falhasList}>
                            {falhasAdicionadas.map((falha, index) => (
                                <li key={index} className={styles.falhaItem}>
                                    <div className={styles.falhaDetails}>
                                        <p><strong>Falha:</strong> {falha.falha}</p>
                                        <p><strong>Setor:</strong> {falha.setor}</p>
                                        {falha.localizacao_componente && <p><strong>Localização:</strong> {falha.localizacao_componente}</p>}
                                        {falha.lado_placa && <p><strong>Lado:</strong> {falha.lado_placa}</p>}
                                        {falha.observacao_producao && <p className={styles.falhaObs}>Obs: {falha.observacao_producao}</p>}
                                    </div>
                                    <button 
                                        type="button" 
                                        onClick={() => handleRemoveFalha(index)}
                                        className={styles.removeFalhaButton}
                                    >
                                        Remover
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}


                {/* Campos de Defeito (Formulário Temporário) */}
                {/* Usa a classe H2 global do CSS que tem a borda azul neon */}
                <h2>Adicionar Novo Defeito / Defeito Único</h2>
                <p className={styles.infoText}>Preencha abaixo para adicionar um novo defeito à lista, ou finalize usando apenas estes campos (como defeito único).</p>
                
                {/* Aplica a classe do módulo de grid */}
                <div className={styles.formGrid2}>
                    {/* Aplica a classe do módulo */}
                    <label className={styles.formLabel}>
                        Falha (Defeito Encontrado):
                        <select 
                            name="falha" 
                            value={formData.falha} 
                            onChange={handleChange} 
                            className={styles.formInput} // Usando formInput para campos de texto/select
                        >
                            <option value="" disabled>Selecione o Tipo de Falha</option>
                            {OPCOES_FALHA_ASSISTENCIA.map(opcao => ( 
                                <option key={opcao} value={opcao}>{opcao}</option>
                            ))}
                        </select>
                    </label>
                    
                    {/* Aplica a classe do módulo */}
                    <label className={styles.formLabel}>
                        Setor Responsável:
                        <select 
                            name="setor" 
                            value={formData.setor} 
                            onChange={handleChange} 
                            className={styles.formInput} // Usando formInput para campos de texto/select
                        >
                            <option value="" disabled>Selecione o Setor</option>
                            {OPCOES_SETOR_ASSISTENCIA.map(opcao => ( 
                                <option key={opcao} value={opcao}>{opcao}</option>
                            ))}
                        </select>
                    </label>
                </div>

                {/* Aplica a classe do módulo de grid */}
                <div className={styles.formGrid3}>
                    {/* Aplica a classe do módulo */}
                    <label className={styles.formLabel}>
                        Localização do Componente:
                        <input 
                            type="text" 
                            name="localizacao_componente" 
                            placeholder='Ex.: D12'
                            value={formData.localizacao_componente} 
                            onChange={handleChange} 
                            className={styles.formInput} 
                        />
                    </label>
                    
                    {/* Aplica a classe do módulo */}
                    <label className={styles.formLabel}>
                        Lado da Placa:
                        <select 
                            name="lado_placa" 
                            value={formData.lado_placa} 
                            onChange={handleChange} 
                            className={styles.formInput} // Usando formInput para campos de texto/select
                        >
                            <option value="bot">BOT</option>
                            <option value="top">TOP</option>
                        </select>
                    </label>
                </div>
                
                {/* Campo de Observação do DEFEITO (usado para o array de falhas) */}
                <label className={styles.formLabel}>
                    Observação do Defeito (Opcional, anexa a esta falha):
                    <textarea
                        name="observacao_assistencia_defeito" 
                        value={formData.observacao_assistencia_defeito} 
                        onChange={handleChange} 
                        rows="3"
                        className={styles.formInput} // Usando formInput para campos de texto/select
                    />
                </label>
                
                {/* BOTÃO DE ADICIONAR FALHA */}
                <button 
                    type="button" 
                    onClick={handleAddFalha} 
                    // Aplica a classe do módulo
                    className={styles.addFalhaButton}
                    disabled={!formData.falha || !formData.setor}
                >
                    Adicionar Defeito à Lista ({falhasAdicionadas.length})
                </button>
                
                <hr style={{borderColor: 'rgba(0,198,255,0.1)'}}/>


                {/* O campo de observação da Assistência GERAL (final) */}
                <label className={styles.formLabel}>
                    Observação Final da Assistência Técnica (Geral, sobre todo o reparo):
                    <textarea
                        name="observacao_assistencia" 
                        value={formData.observacao_assistencia} 
                        onChange={handleChange} 
                        rows="3"
                        className={styles.formInput} // Usando formInput para campos de texto/select
                    />
                </label>
                
                {/* Status (Para garantir a finalização) */}
                <label className={styles.formLabel}>
                    Status da Revisão:
                    <select 
                        name="status" 
                        value={formData.status} 
                        onChange={handleChange} 
                        className={styles.formInput} // Usando formInput para campos de texto/select
                    >
                        <option value="COMPLETO">COMPLETO (Finalizar)</option>
                        <option value="PENDENTE">PENDENTE (Manter)</option>
                    </select>
                </label>
                
                {/* BOTÃO DE SUBMIT (FINALIZAR) */}
                <button 
                    type="submit" 
                    disabled={loading || (falhasAdicionadas.length === 0 && (!formData.falha || !formData.setor))}
                    // Aplica a classe do módulo
                    className={styles.submitButton}
                >
                    {loading ? 'Salvando...' : 'Atualizar e Finalizar'}
                </button>
            </form>
            
            {/* Exibe o Resultado da IA */}
            {iaResultParsed && (
                // Aplica a classe do módulo (Usando o card interno, mas o nome é iaResultSection)
                <div className={styles.checklistFormCard}>
                    <h2>Resultado da Análise da IA (Somente Leitura)</h2>
                    {iaResultParsed.error ? (
                        <p className={styles.messageError}>{iaResultParsed.error}</p>
                    ) : (
                        <>
                            <p>Status: <strong>{iaResultParsed.status}</strong></p>
                            <p>Recomendação: <strong>{iaResultParsed.recomendacao || iaResultParsed.mensagem}</strong></p>
                            <p style={{fontSize: 'small', opacity: 0.7}}>Analisado em: {formatDateTime(iaResultParsed.timestamp_analise)}</p>
                        </>
                    )}
                </div>
            )}
        </div>
        </div>
    );

};

export default AssistenciaEditor;