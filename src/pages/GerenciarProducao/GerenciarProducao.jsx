import React, { useState, useEffect } from 'react';
import Menu from '../../components/Menu/Menu';
import { useAuth } from '../../context/AuthProvider';
import { createProducao, listProducao, deleteProducao } from '../../api/api'; 
import styles from '../GerenciarProducao/GerenciarProducao.module.css'; 

const GerenciarProducao = () => {
    const { user, canAccess } = useAuth();
    const [registros, setRegistros] = useState([]);
    
    // Estado para o formulário de REGISTRO MENSAL (mais usado)
    const [monthlyFormData, setMonthlyFormData] = useState({
        mes_registro: '', 
        quantidade_mensal: '',
        observacao_mensal: '', // ADIÇÃO DE ESTADO
    });
    
    // Estado para o formulário de REGISTRO DIÁRIO (menos usado/opcional)
    const [dailyFormData, setDailyFormData] = useState({
        data_registro: '', 
        quantidade_diaria: '',
        observacao_diaria: '', // ADIÇÃO DE ESTADO
    });

    const [modalObs, setModalObs] = useState({
    isOpen: false,
    title: '',
    content: ''
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    // ... (Acesso Negado permanece o mesmo)
    if (!canAccess(['admin'])) {
        return (
            <div className="container-page">
                <Menu currentScreen="Gerenciar Produção" />
                <div className="access-denied">
                    <h1>Acesso Negado</h1>
                    <p>Você não tem permissão para acessar esta página.</p>
                </div>
            </div>
        );
    }
    // ...

    const fetchRegistros = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await listProducao();
            setRegistros(data);
        } catch (err) {
            console.error("Erro ao carregar registros de produção:", err);
            setError("Não foi possível carregar os registros de produção.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRegistros();
    }, []);

    const handleMonthlyChange = (e) => {
        const { name, value } = e.target;
        // Trata a quantidade mensal como número, o resto como string
        setMonthlyFormData(prev => ({ 
            ...prev, 
            [name]: name === 'quantidade_mensal' ? (value ? parseInt(value) : '') : value 
        }));
    };
    
    const handleDailyChange = (e) => {
        const { name, value } = e.target;
        // Trata a quantidade diária como número, o resto como string
        setDailyFormData(prev => ({ 
            ...prev, 
            [name]: name === 'quantidade_diaria' ? (value ? parseInt(value) : '') : value 
        }));
    };


    const handleSubmitMonthly = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage(null);

        try {
            // 🧩 Extrai o mês e o ano do campo <input type="month">
            const [year, month] = monthlyFormData.mes_registro.split("-");
            const dataParaBackend = `${year}-${month}-01`; // Data completa para o backend

            // 📦 Monta o payload corretamente
            const payload = {
                data_registro: dataParaBackend,
                quantidade_diaria: 0,
                quantidade_mensal: monthlyFormData.quantidade_mensal,
                tipo_registro: 'M',
                observacao_mensal: monthlyFormData.observacao_mensal || null,
                observacao_diaria: null,
                responsavel: user.username,
            };

            // 🚀 Envia ao backend
            await createProducao(payload);

            // 🧹 Limpa os campos após o envio
            setMonthlyFormData({ mes_registro: '', quantidade_mensal: '', observacao_mensal: '' });

            // 🔄 Atualiza a lista de registros
            await fetchRegistros();

            // ✅ Mensagem de sucesso
            setSuccessMessage(`Registro mensal para ${month}/${year} criado com sucesso!`);
        } catch (err) {
            console.error("Erro ao criar registro de produção:", err.response?.data || err);

            if (
                err.response?.status === 400 &&
                typeof err.response?.data?.detail === "string" &&
                err.response.data.detail.includes("já existe")
            ) {
                setError("Já existe um registro para essa data. Escolha outra.");
            } else {
                const errorMessage = err.response?.data?.detail || "Erro desconhecido ao registrar produção.";
                setError(errorMessage);
            }
        }
    };

    
    const handleSubmitDaily = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage(null);

        const payload = {
            data_registro: dailyFormData.data_registro,
            quantidade_diaria: dailyFormData.quantidade_diaria,
            // ⭐️ CORREÇÃO ESSENCIAL: Garante que o campo mensal seja 0 (zero) e não null/None
            quantidade_mensal: 0, 
            
            tipo_registro: 'D',
            // ...
            observacao_mensal: null,
            observacao_diaria: dailyFormData.observacao_diaria || null,  
            
            responsavel: user.username,
        };
        
        try {
            await createProducao(payload);
            // Resetar o estado, incluindo a observação
            setDailyFormData({ data_registro: '', quantidade_diaria: '', observacao_diaria: '' });
            fetchRegistros(); 
            setSuccessMessage(`Registro diário para ${formatData(dailyFormData.data_registro)} criado com sucesso!`);
        } catch (err) {
            // Adiciona log detalhado para o debug do erro 400
            console.error("Erro ao criar registro de produção (Diário):", err.response?.data || err);
            const errorMessage = err.response?.data?.detail || "Erro desconhecido ao registrar produção diária.";
            setError(errorMessage);
        }
    };
    
    const handleDelete = async (id) => {
        if (window.confirm("Tem certeza que deseja deletar este registro de produção?")) {
            setError(null);
            setSuccessMessage(null);
            try {
                await deleteProducao(id);
                fetchRegistros();
                setSuccessMessage("Registro excluído com sucesso!");
            } catch (err) {
                const errorMessage = err.response?.data?.detail || "Erro ao deletar registro. Verifique suas permissões (apenas Admin).";
                setError(errorMessage);
            }
        }
    };

    // Função para abrir o modal
    const handleShowObservation = (title, content) => {
        setModalObs({
            isOpen: true,
            title: title,
            content: content || 'Nenhuma observação registrada.'
        });
    };

    // Função para fechar o modal
    const handleCloseModal = () => {
        setModalObs({
            isOpen: false,
            title: '',
            content: ''
        });
    };

    const formatData = (isoDate) => {
    if (!isoDate) return 'N/A';
    const [year, month, day] = isoDate.split('-');
    if (day === '01' && isoDate.length === 10) {
        return `${month}/${year}`; // mantém simples e correto
    }
    return `${day}/${month}/${year}`;
    };

       return (
        // 1. Uso de styles.nomeDaClasse
        <div className={styles.gerenciarProducaoPage}> 
            <Menu currentScreen="Gerenciar Produção" />
            <div className="container">
                <h1>Gestão de Registros de Produção</h1>

                {/* error-message e success-message geralmente ficam globais ou são componentes */}
                {error && <div className="error-message">{error}</div>} 
                {successMessage && <div className="success-message">{successMessage}</div>} 

                {user && canAccess(['admin']) && (
                    // 2. Transição para CSS Module (flex-container)
                    <div className={styles.producaoFormsContainer}> 
                        
                        {/* 1. FORMULÁRIO MENSAL (Principal) */}
                        {/* 3. Múltiplas classes via 'clsx' ou template literal, ou strings separadas por espaço */}
                        <div className={ `${styles.producaoFormSection} ${styles.principal}` }> 
                            <h2>🗓️ Novo Registro Mensal</h2>
                            <form onSubmit={handleSubmitMonthly}>
                                {/* ... inputs e textarea Mensal (IGUAIS) ... */}
                                <input
                                    type="month"
                                    name="mes_registro"
                                    value={monthlyFormData.mes_registro}
                                    onChange={handleMonthlyChange}
                                    required
                                />
                                <input
                                    type="number"
                                    name="quantidade_mensal"
                                    placeholder="Total de Placas no Mês"
                                    value={monthlyFormData.quantidade_mensal}
                                    onChange={handleMonthlyChange}
                                    required
                                    min="0"
                                />
                                <textarea
                                    name="observacao_mensal"
                                    placeholder="Observação do Mês (Opcional)"
                                    value={monthlyFormData.observacao_mensal}
                                    onChange={handleMonthlyChange}
                                    rows="2"
                                />

                                <button type="submit" disabled={!monthlyFormData.mes_registro || monthlyFormData.quantidade_mensal === ''}>
                                    Registrar Mês
                                </button>
                            </form>
                        </div>
                        
                        {/* 2. FORMULÁRIO DIÁRIO (Opcional/Menos Chamativo) */}
                        {/* 3. Múltiplas classes para o secundário */}
                        <div className={ `${styles.producaoFormSection} ${styles.secundario}` }> 
                            <h3>📝 Registro Diário Avulso</h3>
                            <form onSubmit={handleSubmitDaily}>
                                {/* ... inputs e textarea Diário (IGUAIS) ... */}
                                <input
                                    type="date"
                                    name="data_registro"
                                    value={dailyFormData.data_registro}
                                    onChange={handleDailyChange}
                                    required
                                />
                                <input
                                    type="number"
                                    name="quantidade_diaria"
                                    placeholder="Placas no Dia"
                                    value={dailyFormData.quantidade_diaria}
                                    onChange={handleDailyChange}
                                    required
                                    min="0"
                                />
                                <textarea
                                    name="observacao_diaria"
                                    placeholder="Observação do Dia (Opcional)"
                                    value={dailyFormData.observacao_diaria}
                                    onChange={handleDailyChange}
                                    rows="2"
                                />

                                <button type="submit" disabled={!dailyFormData.data_registro || dailyFormData.quantidade_diaria === ''}>
                                    Registrar Dia
                                </button>
                            </form>
                            <p className={styles.nota}> * Use este registro apenas se precisar registrar um dia isolado, caso contrário, use o registro mensal.</p>
                        </div>
                        
                    </div>
                )}

                {/* Tabela de Registros */}
                <div className={styles.producaoListSection}>
                    <h2>Histórico de Registros</h2>
                    {loading ? (
                        <p>Carregando registros...</p>
                    ) : (
                        // 4. Classes para a tabela
                        <table className={styles.producaoTable}> 
                            <thead>
                                <tr>
                                    {['Data (Dia/Mês)', 'Diária', 'Mensal', 'Obs. Mês', 'Obs. Dia', 'Responsável']
                                        .map(header => <th key={header}>{header}</th>)}
                                    {user && canAccess(['admin']) && <th>Ações</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {registros.map((reg) => (
                                    <tr key={reg.id}>
                                        {/* 5. formatData corrigida sem tipo_registro */}
                                        <td>{formatData(reg.data_registro)}</td> 
                                        <td>{reg.quantidade_diaria !== null ? reg.quantidade_diaria : '-'}</td>
                                        <td>{reg.quantidade_mensal}</td>
                                        <td>
                                            <span
                                                onClick={() => handleShowObservation('Observação Mensal', reg.observacao_mensal)}
                                                // 6. Classe para a observação clicável
                                                className={reg.observacao_mensal ? styles.clickableObs : ''} 
                                            >
                                                {reg.observacao_mensal 
                                                    ? reg.observacao_mensal.length > 20
                                                        ? reg.observacao_mensal.slice(0, 20) + '...' 
                                                        : reg.observacao_mensal
                                                    : '-'}
                                            </span>
                                        </td>
                                        <td>
                                            <span
                                                onClick={() => handleShowObservation('Observação Diária', reg.observacao_diaria)}
                                                // 6. Classe para a observação clicável
                                                className={reg.observacao_diaria ? styles.clickableObs : ''}
                                            >
                                                {reg.observacao_diaria 
                                                    ? reg.observacao_diaria.length > 20
                                                        ? reg.observacao_diaria.slice(0, 20) + '...' 
                                                        : reg.observacao_diaria
                                                    : '-'}
                                            </span>
                                        </td>

                                        <td>{reg.responsavel}</td>
                                        {user && canAccess(['admin']) && (
                                            <td>
                                                {/* 7. Classe para o botão de deletar (se existir) */}
                                                <button 
                                                    onClick={() => handleDelete(reg.id)} 
                                                    className={styles['btn-delete']} // Mantido como global se for de um framework
                                                >
                                                    Deletar
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
            {/* Modal de Observação (Classes globais mantidas, se aplicável) */}
            {modalObs.isOpen && (
                <div className={styles.modalOverlay} onClick={handleCloseModal}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <h2>{modalObs.title}</h2>
                        <div className={styles.modalBody}>
                            <p>{modalObs.content}</p>
                        </div>
                        <button onClick={handleCloseModal} className={styles.btnCloseModal}>Fechar</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GerenciarProducao;