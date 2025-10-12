import React from 'react';
import styles from '../Historico/Historico.module.css'; 
const getObservationText = (obs) => {
    return obs && String(obs).trim() 
        ? obs 
        : <span className={styles.infoPlaceholder}>Sem informações adicionais</span>;
};

const formatDate = (isoString) => {
    if (!isoString) return 'N/A';
    const date = new Date(isoString.endsWith('Z') ? isoString : isoString + 'Z');
    if (isNaN(date.getTime())) {
        return new Date(isoString).toLocaleString('pt-BR');
    }
    return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR');
};

const DetalhesChecklistModal = ({ selectedChecklist, onClose }) => {
    if (!selectedChecklist) return null;
    
    const observacaoDaAssistencia = selectedChecklist.observacao_assistencia;

    let falhasLista = [];
    let isMultiFalha = false;
    const falhasData = selectedChecklist.falhas_json; 

    if (falhasData) {
        try {
            const parsedFalhas = typeof falhasData === 'string' ? JSON.parse(falhasData) : falhasData;
            if (Array.isArray(parsedFalhas) && parsedFalhas.length > 0) {
                falhasLista = parsedFalhas;
                isMultiFalha = true;
            }
        } catch (error) {
            console.error("Erro ao interpretar falhas_json:", error);
        }
    }

    if (falhasLista.length === 0 && selectedChecklist.falha) {
        falhasLista = [{
            falha: selectedChecklist.falha,
            setor: selectedChecklist.setor,
            localizacao_componente: selectedChecklist.localizacao_componente || selectedChecklist.localizacao || null,
            lado_placa: selectedChecklist.lado_placa || selectedChecklist.lado || null,
            observacao_producao: selectedChecklist.observacao_producao || selectedChecklist.observacao || null
        }];
        isMultiFalha = false;
    }

    return (
        <div className={styles.modalBackdrop}>
            <div className={styles.modalContent}>
                <h2>Detalhes do Checklist #{selectedChecklist.documento_id}</h2>
                
                <div className={styles.detailsSection}>
                    <p><strong>Status:</strong> <span style={{ color: selectedChecklist.status === 'PENDENTE' ? 'orange' : 'green', fontWeight: 'bold' }}>{selectedChecklist.status}</span></p>
                    <p><strong>Produto:</strong> {selectedChecklist.produto}</p>
                    <p><strong>Quantidade:</strong> {selectedChecklist.quantidade}</p>
                    
                    <p>
                        <strong>Registrado por (Produção):</strong> {selectedChecklist.responsavel} em {formatDate(selectedChecklist.data_criacao || selectedChecklist.data_registro)}
                    </p>
                    
                    {selectedChecklist.data_finalizacao && selectedChecklist.responsavel_assistencia && (
                        <p>
                            <strong>Finalizado por (Assistência):</strong> {selectedChecklist.responsavel_assistencia} em {formatDate(selectedChecklist.data_finalizacao)}
                        </p>
                    )}
                </div>
                
                <hr style={{borderColor: 'rgba(0,198,255,0.2)'}}/>

                <div className={styles.detailsSection}>
                    <h3>Detalhes do(s) Defeito(s)</h3>

                    {falhasLista.length > 0 ? (
                        falhasLista.map((falha, index) => (
                            <div key={index} className={styles.falhaItemModal}>
                                {isMultiFalha && <h4>Falha #{index + 1}</h4>}
                                
                                <p><strong>Falha:</strong> {falha.falha || 'Não especificada'}</p>
                                <p><strong>Setor Responsável:</strong> {falha.setor || 'N/A'}</p>
                                <p><strong>Localização:</strong> {falha.localizacao_componente || falha.localizacao || 'N/A'}</p>
                                <p><strong>Lado da Placa:</strong> {falha.lado_placa || 'N/A'}</p>

                                {(falha.observacao_producao || falha.observacao) && (
                                    <>
                                        <h5 style={{marginTop: '10px', color: '#ccc'}}>Observação Específica da Falha:</h5>
                                        <p style={{whiteSpace: 'pre-wrap', lineHeight: '1.5', fontSize: '0.9em'}}>
                                            {getObservationText(falha.observacao_producao || falha.observacao)}
                                        </p>
                                    </>
                                )}
                            </div>
                        ))
                    ) : (
                        <p className={styles.infoPlaceholder}>Nenhuma falha registrada para este checklist.</p>
                    )}
                </div>

                <hr style={{borderColor: 'rgba(0,198,255,0.2)'}}/>

                <div className={styles.detailsSection}>
                    <h3>Observações da Assistência (Conclusão)</h3>
                    <p style={{whiteSpace: 'pre-wrap', lineHeight: '1.5'}}>
                        {getObservationText(observacaoDaAssistencia)}
                    </p>
                </div>
                
                <button className={styles.btnCloseModal} onClick={onClose}>
                    Fechar Detalhes
                </button>
            </div>
        </div>
    );
};

export default DetalhesChecklistModal;