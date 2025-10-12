import React, { useState, useEffect, useMemo } from 'react';
import Menu from '../../components/Menu/Menu';
import { listChecklists } from '../../api/api'; 
import styles from '../Historico/Historico.module.css'; 
import DetalhesChecklistModal from './DetalhesChecklistModal'; 

// 💡 Removido: A função useDebounce não é mais necessária para a pesquisa manual

const Historico = () => {
    const [checklists, setChecklists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedChecklist, setSelectedChecklist] = useState(null); 
    
    // --- Estados de Paginação/Filtro ---
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalCount, setTotalCount] = useState(0);
    
    const [inputSearchTerm, setInputSearchTerm] = useState(''); 
    const [apiSearchTerm, setApiSearchTerm] = useState(''); 
    const [searchTrigger, setSearchTrigger] = useState(0);

    const status = 'COMPLETO';

    useEffect(() => {
        const loadChecklists = async () => {
            setLoading(true);
            try {
                const response = await listChecklists(
                    status, 
                    currentPage, 
                    itemsPerPage, 
                    apiSearchTerm
                );
                setChecklists(response.items);
                setTotalCount(response.total_count);
            } catch (err) {
                console.error("Erro ao buscar histórico:", err);
                setError('Falha ao carregar o histórico de checklists completos.');
            } finally {
                setLoading(false);
            }
        };
        loadChecklists(); 
    }, [currentPage, itemsPerPage, apiSearchTerm, searchTrigger]);

    const formatDate = (isoString) => {
        if (!isoString) return 'N/A';
        const date = new Date(isoString.endsWith('Z') ? isoString : isoString + 'Z');
        if (isNaN(date.getTime())) {
            return new Date(isoString).toLocaleString('pt-BR');
        }
        return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR');
    };

    const handleViewDetails = (item) => setSelectedChecklist(item);
    const handleCloseDetails = () => setSelectedChecklist(null);
    
    const handleSearchChange = (e) => setInputSearchTerm(e.target.value);

    const handleSearchClick = () => {
        setApiSearchTerm(inputSearchTerm);
        setCurrentPage(1); 
        setSearchTrigger(prev => prev + 1); 
    }
    
    const handleClearSearch = () => {
        setInputSearchTerm('');
        setApiSearchTerm('');
        setCurrentPage(1);
        setSearchTrigger(prev => prev + 1);
    }

    const totalPages = Math.ceil(totalCount / itemsPerPage);

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };
    
    if (loading) {
        return (
            <div className={styles.container} style={{ textAlign: 'center' }}>
                <Menu currentScreen="Historico" />
                <h2>Carregando Histórico...</h2>
            </div>
        );
    }

    if (error) {
        return (
            <>
                <Menu currentScreen="Historico" />
                <div className={styles.container} style={{ color: 'red' }}><h1>Erro: {error}</h1></div>
            </>
        );
    }

    return (
        <>
            <Menu currentScreen="Historico" />
            <div className={styles.container}>
                <h1>Histórico de Checklists Concluídos</h1>

                {/* --- CAMPO DE PESQUISA MANUAL COM BOTÃO --- */}
                <div className={styles.searchContainer}>
                    <input
                        type="text"
                        placeholder="Pesquisar por ID de Documento (ex: NC0001 ou 1)"
                        value={inputSearchTerm} 
                        onChange={handleSearchChange}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearchClick()}
                        className={styles.searchInput}
                    />
                    
                    <button 
                        onClick={handleSearchClick} 
                        disabled={!inputSearchTerm && !apiSearchTerm} 
                        className={styles.searchButton}
                    >
                        Pesquisar
                    </button>
                    
                    {apiSearchTerm && (
                        <button 
                            onClick={handleClearSearch} 
                            className={styles.clearButton}
                        >
                            Limpar Pesquisa
                        </button>
                    )}
                </div>

                <h2>Total de Documentos Concluídos: ({totalCount})</h2> 

                {checklists.length === 0 && apiSearchTerm ? (
                    <p>Nenhum resultado encontrado para a pesquisa "{apiSearchTerm}".</p>
                ) : checklists.length === 0 ? (
                    <p>Nenhum checklist concluído encontrado.</p>
                ) : (
                    <>
                        <div className={styles.cardGrid}>
                            {checklists.map((item) => (
                                <div key={item.documento_id} className={styles.checklistCard}>
                                    <h3>Documento: {item.documento_id}</h3>
                                    <p><strong>Produto:</strong> {item.produto}</p>
                                    <p>
                                        <strong>{item.data_finalizacao ? 'Finalizado em:' : 'Data de Registro:'}</strong> 
                                        {formatDate(item.data_finalizacao || item.data_criacao || item.data_registro)}
                                    </p>
                                    <p>
                                        <strong>{item.responsavel_assistencia ? 'Finalizado por:' : 'Registrado por:'}</strong>
                                        {item.responsavel_assistencia || item.responsavel}
                                    </p>
                                    <hr style={{borderColor: 'rgba(0,198,255,0.2)'}}/>
                                    <button onClick={() => handleViewDetails(item)} className={styles.btnDetails}>
                                        Ver Detalhes
                                    </button>
                                </div>
                            ))}
                        </div>
                        
                        <div className={styles.paginationControls}>
                            <button 
    onClick={() => handlePageChange(currentPage - 1)} 
    disabled={currentPage === 1} 
    className={styles.btnPage} // Adicionado aqui
>
    Anterior
</button>
<span>
    Página {currentPage} de {totalPages} ({totalCount} itens)
</span>
<button 
    onClick={() => handlePageChange(currentPage + 1)} 
    disabled={currentPage === totalPages || totalPages === 0} 
    className={styles.btnPage} // Adicionado aqui
>
    Próxima
</button>
                            
                            <select 
                                value={itemsPerPage} 
                                onChange={(e) => {
                                    setItemsPerPage(Number(e.target.value));
                                    setCurrentPage(1);
                                }}
                            >
                                <option value={5}>5 por página</option>
                                <option value={10}>10 por página</option>
                                <option value={20}>20 por página</option>
                            </select>
                        </div>
                    </>
                )}
            </div>

            <DetalhesChecklistModal 
                selectedChecklist={selectedChecklist}
                onClose={handleCloseDetails}
            />
        </>
    );
};

export default Historico;