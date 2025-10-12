import React, { useState, useEffect } from 'react';
import Menu from '../../components/Menu/Menu';
import { listChecklists } from '../../api/api';
import AssistenciaEditor from './AssistenciaEditor'; 
import styles from '../Assistencia/Assistencia.module.css'; 

const Assistencia = () => {
    const [pendentes, setPendentes] = useState([]);
    const [loadingList, setLoadingList] = useState(true);
    const [errorList, setErrorList] = useState(null);
    const [editingDocumentId, setEditingDocumentId] = useState(null); 

    // --- LÓGICA DE BUSCA (LISTAGEM) ---
    const fetchPendentes = async () => {
        setLoadingList(true);
        try {
            // Buscando documentos 'PENDENTE'
            const response = await listChecklists('PENDENTE', 1, 100); 
            
            setPendentes(response.items);
            setErrorList(null);
        } catch (err) {
            console.error("Erro ao carregar pendências:", err);
            setPendentes([]); 
            setErrorList("Não foi possível carregar os documentos pendentes.");
        } finally {
            setLoadingList(false);
        }
    };

    useEffect(() => {
        if (!editingDocumentId) {
            fetchPendentes();
        }
    }, [editingDocumentId]); 

    // LÓGICA DE EDIÇÃO (Abre o formulário na mesma tela)
    const handleEdit = (documentoId) => {
        setEditingDocumentId(documentoId);
    };
    
    // Função de callback para o editor (volta para a lista)
    const handleEditorExit = () => {
        setEditingDocumentId(null);
        // A lista será recarregada automaticamente via useEffect
    };
    
    // Auxiliar para formatar data
    const formatTableDate = (isoString) => {
        if (!isoString) return 'N/A';
        const date = new Date(isoString.endsWith('Z') ? isoString : isoString + 'Z');
        if (isNaN(date.getTime())) {
            return new Date(isoString).toLocaleDateString('pt-BR');
        }
        return date.toLocaleDateString('pt-BR');
    };

    // --- RENDERIZAÇÃO CONDICIONAL ---
    if (editingDocumentId) {
        // Usa o wrapper para manter o layout da página
        return (
            <div className={styles.container}> 
                <Menu currentScreen="Assistência" />
                <AssistenciaEditor 
                    documentoId={editingDocumentId} 
                    onEditorExit={handleEditorExit} 
                />
            </div>
        );
    }
    
    // --- RENDERIZAÇÃO DA LISTA (Padrão) ---
    return (
        <div className={styles.container}>
            <Menu currentScreen="Assistência" />
            
            {/* Aplica a classe h1 do módulo, se existir, ou use o h1 puro se estiver no global */}
            <h1 className={styles.title || ''}>Documentos Pendentes</h1> 

            {loadingList && <p className={styles.loadingText}>Carregando documentos...</p>}
            {errorList && <p className={styles.messageError}>{errorList}</p>}
            
            {!loadingList && !errorList && (
                <>
                    <p className={styles.infoText}>Total de documentos para revisão: <strong>{pendentes.length}</strong></p>
                    
                    {pendentes.length === 0 ? (
                        <p className={styles.messageSuccess}>Nenhum documento pendente no momento.</p>
                    ) : (
                        // Adiciona o wrapper para responsividade de tabela
                        <div className={styles['table-responsive-wrapper']}> 
                            <table className={styles.checklistTable}>
                                <thead>
                                    <tr>
                                        <th>Documento ID</th>
                                        <th>Data Criação</th>
                                        <th>Produto</th>
                                        <th>Qtd</th>
                                        <th>Ação</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pendentes.map((item) => ( 
                                        <tr key={item.documento_id}>
                                            <td>{item.documento_id}</td>
                                            <td>{formatTableDate(item.data_registro || item.data_criacao)}</td>
                                            <td>{item.produto}</td>
                                            <td>{item.quantidade}</td>
                                            <td>
                                                <button 
                                                    onClick={() => handleEdit(item.documento_id)} 
                                                    className={styles.actionButton}
                                                >
                                                    Completar Revisão
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default Assistencia;