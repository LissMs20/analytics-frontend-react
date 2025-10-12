import React, { useState } from 'react';
import Menu from '../../components/Menu/Menu';
import { analyzeData } from '../../api/api'; 
// 💡 Importar Line e Pie (Pizza) além de Bar
import { Bar, Line, Pie } from 'react-chartjs-2'; 
import 'chart.js/auto'; 
import styles from './AnaliseIA.module.css'; // MANTÉM IMPORTAÇÃO CORRETA

// CORREÇÃO 1: Mudar visualization_data para um array vazio no estado inicial
const initialAnalysis = {
    query: '',
    summary: '',
    visualization_data: [], // Deve ser uma LISTA vazia por padrão
    tips: [], 
};

const AnaliseIA = () => {
    const [query, setQuery] = useState('');
    const [analysisResult, setAnalysisResult] = useState(initialAnalysis);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleAnalyze = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        setAnalysisResult(initialAnalysis);

        if (!query.trim()) {
            setMessage('Por favor, insira uma solicitação de análise.');
            setLoading(false);
            return;
        }

        try {
            const response = await analyzeData(query);
            
            // Certifique-se de que visualization_data é uma lista (mesmo que vazia)
            if (!response.visualization_data) {
                response.visualization_data = [];
            }
            
            setAnalysisResult(response);
            setMessage('Análise concluída com sucesso.');

        } catch (error) {
            console.error("Erro na análise da IA:", error);
            setMessage(`Erro ao processar a análise: ${error.message || "Falha na comunicação com o servidor da IA."}`);
        } finally {
            setLoading(false);
        }
    };

    // CORREÇÃO 2: Função de renderização de gráfico mais flexível e genérica
    const ChartRenderer = ({ data }) => {
        // Recebe UM objeto ChartData (que inclui chart_type)
        if (!data || !data.labels || !data.datasets) return null;

        const chartType = data.chart_type ? data.chart_type.toLowerCase() : 'bar';

        // Cores da paleta para gráficos (Verde Esmeralda e Azul Brilhante)
        const defaultChartColors = [
            'rgba(0, 179, 124, 0.8)', // #00b37c (Verde Esmeralda com transparência)
            'rgba(36, 164, 255, 0.8)', // #24a4ff (Azul Brilhante com transparência)
            'rgba(255, 99, 132, 0.8)', // Vermelho Padrão (Fallback)
            'rgba(255, 159, 64, 0.8)', // Laranja Padrão (Fallback)
            'rgba(153, 102, 255, 0.8)', // Roxo Padrão (Fallback)
            'rgba(255, 206, 86, 0.8)', // Amarelo Padrão (Fallback)
        ];

        const chartData = {
            labels: data.labels,
            datasets: data.datasets.map(ds => ({
                ...ds,
                // Garantir cores padrão se não vierem do backend (boa prática)
                // Se for Pie/Doughnut, o primeiro dataset precisa de um array de cores
                backgroundColor: ds.backgroundColor || (chartType === 'pie' ? defaultChartColors : defaultChartColors[0]),
                borderColor: ds.borderColor || (chartType === 'pie' ? defaultChartColors.map(c => c.replace('0.8', '1')) : defaultChartColors[0].replace('0.8', '1')),
                borderWidth: 1,
            }))
        };
        
        const options = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                // Usar o título do ChartData para o gráfico, não a query original
                legend: { position: 'top', labels: { color: '#e8e8e8' } }, // Cinza Suave
                title: { display: true, text: data.title || analysisResult.query, color: '#ffffff' }, // Branco Limpo
            },
            // As escalas X e Y só fazem sentido para Bar/Line
            scales: (chartType === 'bar' || chartType === 'line') ? {
                x: { 
                    ticks: { color: '#e8e8e8' }, // Cinza Suave
                    grid: { color: 'rgba(36, 164, 255, 0.2)' } // Linhas da grid do Azul Brilhante sutil
                }, 
                y: { 
                    ticks: { color: '#e8e8e8' }, // Cinza Suave
                    grid: { color: 'rgba(36, 164, 255, 0.2)' } // Linhas da grid do Azul Brilhante sutil
                }
            } : {},
        };

        switch (chartType) {
            case 'line':
                // Adiciona tensão na linha e fill para visualização de linha
                chartData.datasets = chartData.datasets.map(ds => ({
                    ...ds,
                    tension: 0.4,
                    fill: true,
                }));
                return <Line data={chartData} options={options} />;
            case 'pie':
                // Gráficos de Pizza/Torta geralmente não usam escalas X/Y
                return <Pie data={chartData} options={{ ...options, scales: {} }} />;
            case 'bar':
            default:
                return <Bar data={chartData} options={options} />;
        }
    };

    return (
        <div className={styles['ia-page-container']}>
            <Menu currentScreen="AnaliseIA" />
            <div className={styles['title-group']}>
                <h1 className={styles['main-title']}>Cortex</h1>
                <p className={styles['subtitle-text']}>Análise Preditiva e Dashboard Inteligente</p>
            </div>
            
            <form onSubmit={handleAnalyze} className={styles['analysis-form']}>
                <label className={styles['analysis-label']}>
                    Solicitação de Análise:
                    <p className={styles['analysis-tip-text']}>
                        *Ex: "Quais setores geraram mais falhas de solda no último mês?"*
                    </p>
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Insira sua consulta aqui..."
                        required
                        className={styles['analysis-input']}
                    />
                </label>
                <button 
                    type="submit" 
                    disabled={loading}
                    className={styles['analysis-button']}
                >
                    {loading ? 'Analisando...' : 'Gerar Análise'}
                </button>
                {message && (
                    <p className={message.startsWith('Erro') ? styles['analysis-message-error'] : styles['analysis-message-success']}>
                        {message}
                    </p>
                )}
            </form>

            {/* --- RESULTADOS DA ANÁLISE --- */}
            {analysisResult.summary && (
                <div className={styles['analysis-result-container']}>
                    
                    {/* 1. Dashboard/Visualização */}
                    {/* CORREÇÃO 3: Itera sobre a lista visualization_data */}
                    {analysisResult.visualization_data.length > 0 && (
                        <div className={styles['result-section']}>
                            <h2>Visualização Solicitada</h2>
                            <div className={styles['charts-grid']}> 
                                {/* Itera sobre a lista de objetos de gráfico */}
                                {analysisResult.visualization_data.map((chartData, index) => (
                                    <div key={index} className={styles['chart-container']}>
                                        <ChartRenderer data={chartData} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 2. Resumo da Análise */}
                    <div className={styles['result-section']}>
                        <h2>Resumo da Análise</h2>
                        <p 
                            className={styles['summary-text']}
                            dangerouslySetInnerHTML={{ 
                                __html: analysisResult.summary.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                            }}
                        />
                    </div>

                    {/* 3. Dicas e Recomendações */}
                    {analysisResult.tips.length > 0 && (
                        <div className={styles['result-section']}>
                            <h2>Dicas de Produção/Administração</h2>
                            <ul className={styles['tips-list']}>
                                {analysisResult.tips.map((tip, index) => (
                                    <li key={index} className={styles['tip-item']}>
                                        <span className={styles['tip-title']}>{tip.title}:</span> {tip.detail}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AnaliseIA;