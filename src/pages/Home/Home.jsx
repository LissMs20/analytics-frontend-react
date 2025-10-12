import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import Menu from "../../components/Menu/Menu";
import { listChecklists } from "../../api/api";
import styles from "../Home/Home.module.css";
import { useAuth } from '../../context/AuthProvider';
import { useTheme } from '../../context/ThemeContext';
import {
    Chart,
    LineElement,
    CategoryScale,
    LinearScale,
    PointElement,
    ArcElement,
    Tooltip,
    Legend,
    BarElement
} from "chart.js";

Chart.register(LineElement, CategoryScale, LinearScale, PointElement, ArcElement, Tooltip, Legend, BarElement);

// --- Função utilitária para obter valor da variável CSS ---
const getCssVariable = (name) => {
    if (typeof window === 'undefined') return '#000'; 
    // Usamos esta função APENAS para ler as variáveis na inicialização do useMemo
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
};

const Home = () => {
    const { user } = useAuth();
    const { theme } = useTheme(); 
    const [checklistsHoje, setChecklistsHoje] = useState(0);
    const [producaoSemanalData, setProducaoSemanalData] = useState({ labels: ["Sem Dados"], data: [0] });
    const [defeitosComunsData, setDefeitosComunsData] = useState({ labels: ["Sem Dados"], data: [1], backgroundColor: ["#9ca3af"] });

    const chart1Ref = useRef(null);
    const chart2Ref = useRef(null);
    const chart1Instance = useRef(null);
    const chart2Instance = useRef(null);
    
    // ----------------------------------------------------------------------
    // ✅ 1. NOVO: useMemo para obter as cores do tema de forma controlada
    // ----------------------------------------------------------------------
    const themeColors = useMemo(() => {
        // Leitura das variáveis CSS no momento em que o tema muda
        const highlightBlue = getCssVariable('--highlight-blue');
        const highlightGreen = getCssVariable('--highlight-green');
        const textSecondary = getCssVariable('--text-secondary');
        
        return {
            highlightBlue,
            highlightGreen,
            textSecondary,
            // A cor de grade deve ser ajustada para garantir contraste
            gridColor: theme === 'light' 
                ? 'rgba(0, 0, 0, 0.1)'   // mais perceptível sobre fundo branco
                : 'rgba(232, 232, 232, 0.15)'
        };
    }, [theme]); // Recalcula SEMPRE que o tema muda

    
    // ----------------------------------------------------------------------
    // ✅ 2. MODIFICADO: processChecklistData agora recebe as cores como parâmetro
    // ----------------------------------------------------------------------
    const processChecklistData = useCallback((data, colors) => {
        const productionByDay = {};
        const today = new Date();
        const currentDay = today.getDay();
        const daysToMonday = currentDay === 0 ? 6 : currentDay - 1;
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - daysToMonday);
        startOfWeek.setHours(0, 0, 0, 0);
        const labels = ["Seg", "Ter", "Qua", "Qui", "Sex"];
        
        for (let i = 0; i < 5; i++) {
            const date = new Date(startOfWeek);
            date.setDate(startOfWeek.getDate() + i);
            const dateStr = date.toISOString().slice(0, 10);
            productionByDay[dateStr] = 0;
        }

        data.forEach(item => {
            const rawDate = item.data_registro || item.data || item.created_at || item.data_producao || item.data_criacao;
            if (!rawDate) return;
            const dateStr = rawDate.slice(0, 10);
            if (productionByDay.hasOwnProperty(dateStr)) {
                productionByDay[dateStr] += item.quantidade || 1;
            }
        });

        const weeklyData = labels.map((_, index) => {
            const date = new Date(startOfWeek);
            date.setDate(startOfWeek.getDate() + index);
            return productionByDay[date.toISOString().slice(0, 10)] || 0;
        });

        setProducaoSemanalData({ labels: labels, data: weeklyData });
        const defectCounts = {};

        data.forEach(item => {
            let falhas = [];
            // ... (Seu código de parsing de falhas) ...
            if (Array.isArray(item.falhas_json)) {
                falhas = item.falhas_json;
            } else if (typeof item.falhas_json === 'string' && item.falhas_json.trim()) {
                try {
                    falhas = JSON.parse(item.falhas_json);
                    if (!Array.isArray(falhas)) falhas = [];
                } catch (e) {
                    console.error("Erro ao parsear falhas_json:", e);
                    falhas = [];
                }
            } else if (item.falha) {
                falhas = [{ falha: item.falha }];
            }

            falhas.forEach(f => {
                const nomeFalha = f.falha || f.tipo || (typeof f === 'string' ? f : 'Não Especificado');
                if (nomeFalha && nomeFalha !== 'Não Especificado') {
                    defectCounts[nomeFalha] = (defectCounts[nomeFalha] || 0) + 1;
                } else if (!item.falhas_json && item.falha === null) {
                    defectCounts['Sem Falha'] = (defectCounts['Sem Falha'] || 0) + 1;
                }
            });
            
            if (falhas.length === 0 && item.falha === null) {
                defectCounts['Sem Falha'] = (defectCounts['Sem Falha'] || 0) + 1;
            }
        });

        const topDefects = Object.entries(defectCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 4);

        const defectLabels = topDefects.map(([falha]) => falha);
        const defectData = topDefects.map(([, count]) => count);

        // ✅ CORES DO GRÁFICO DE PIZZA USAM themeColors
        const backgroundColors = [
            colors.highlightBlue,
            colors.highlightGreen,
            '#ff8800',
            '#7c3aed' // ou outra cor forte
        ];

        setDefeitosComunsData({
            labels: defectLabels.length ? defectLabels : ["Sem Dados"],
            data: defectData.length ? defectData : [1],
            backgroundColor: backgroundColors.slice(0, defectLabels.length)
        });
    }, []); // Não depende de themeColors, é apenas uma função pura

    
    // ----------------------------------------------------------------------
    // ✅ 3. MODIFICADO: chartOptions agora usa themeColors
    // ----------------------------------------------------------------------
const chartOptions = useMemo(() => {
    // NOVO: Define a cor do texto do gráfico com base no tema, 
    // garantindo que não dependa apenas da leitura do DOM.
    const chartTextColor = theme === 'light' ? '#4b5563' : '#e8e8e8'; // Cor Escura ou Clara
    const chartGridColor = theme === 'light' ? 'rgba(0, 0, 0, 0.1)' : 'rgba(232, 232, 232, 0.15)';
    
        return {
            line: {
            responsive: true,
            plugins: {
                legend: {
                    labels: {
                        // USAR A COR CALCULADA EM VEZ DE themeColors.textSecondary
                        color: chartTextColor,
                        font: {
                            weight: 'bold',
                            size: 14
                        }
                    }
                }
            },
                scales: {
                x: {
                    ticks: {
                        // USAR A COR CALCULADA
                        color: chartTextColor, 
                        font: {
                            weight: 'bold'
                        }
                    },
                    grid: {
                        // USAR A COR CALCULADA
                        color: chartGridColor, 
                        lineWidth: 1
                    }
                },
                    y: {
                    ticks: {
                        // USAR A COR CALCULADA
                        color: chartTextColor, 
                        font: {
                            weight: 'bold'
                        }
                    },
                    grid: {
                        // USAR A COR CALCULADA
                        color: chartGridColor,
                        lineWidth: 1
                    },
                    beginAtZero: true
                }
            }
        },
            doughnut: {
            responsive: true,
            plugins: {
                legend: {
                    labels: {
                        color: chartTextColor, 
                        font: {
                            weight: 'bold',
                            size: 14
                        }
                    }
                },
                    tooltip: {
                    backgroundColor: theme === 'light' ? '#333' : '#fff',
                    titleColor: theme === 'light' ? '#fff' : '#000',
                    bodyColor: theme === 'light' ? '#fff' : '#000',
                    titleFont: { weight: 'bold' }
                }
            }
        }
    };
    }, [theme, themeColors]); // ✅ Depende de themeColors

    
    // ----------------------------------------------------------------------
    // ✅ 4. MODIFICADO: useEffect de busca chama processChecklistData com themeColors
    // ----------------------------------------------------------------------
    useEffect(() => {
        const fetchData = async () => {
            // ... (Seu código de busca de dados) ...
            try {
                let response = await listChecklists();
                let data = [];
                
                // ... (código de parsing de resposta) ...
                if (Array.isArray(response)) {
                    data = response;
                } else if (response && Array.isArray(response.items)) {
                    data = response.items;
                } else if (response && Array.isArray(response.data)) {
                    data = response.data;
                } else if (response && Array.isArray(response.checklists)) {
                    data = response.checklists;
                } else {
                    console.warn("Retorno da API não é um formato esperado. Usando array vazio.");
                    data = [];
                }
                if (!Array.isArray(data)) data = [];

                // Chama com themeColors. Isso garante que a primeira renderização após
                // a busca tenha as cores corretas, mesmo que o tema mude antes da resposta.
                processChecklistData(data, themeColors); 

                const hoje = new Date().toISOString().slice(0, 10);
                const filtrados = data.filter((item) => {
                    const rawDate = item.data_registro || item.data || item.created_at || item.data_producao || item.data_criacao;
                    return rawDate?.startsWith(hoje);
                });
                setChecklistsHoje(filtrados.length);

            } catch (err) {
                console.error("Erro ao carregar checklists:", err);
                processChecklistData([], themeColors); 
                setChecklistsHoje(0);
            }
        };
        fetchData();
    // ✅ É NECESSÁRIO adicionar themeColors aqui para garantir que o processamento
    // seja refeito com as cores corretas caso a mudança de tema ocorra antes da 
    // primeira busca, ou se o tema for alterado posteriormente (o que não deve
    // acontecer se a busca é somente na montagem, mas adicionamos por segurança).
    }, [processChecklistData, themeColors]); 

    // ----------------------------------------------------------------------
    // ✅ 5. MODIFICADO: useEffect de Gráfico 1 usa themeColors
    // ----------------------------------------------------------------------
    useEffect(() => {
        if (chart1Instance.current) {
            chart1Instance.current.destroy();
            chart1Instance.current = null;
        }

        if (chart1Ref.current) {
            const ctx = chart1Ref.current.getContext("2d");
            // Calcula o RGBA com base na cor Hext/RGB atual (themeColors.highlightBlue)
            const rgbaColor = themeColors.highlightBlue.startsWith('#') 
                ? `rgba(${parseInt(themeColors.highlightBlue.slice(1, 3), 16)}, ${parseInt(themeColors.highlightBlue.slice(3, 5), 16)}, ${parseInt(themeColors.highlightBlue.slice(5, 7), 16)}, 0.2)`
                : themeColors.highlightBlue.replace(')', ', 0.2)').replace('rgb', 'rgba');

            chart1Instance.current = new Chart(ctx, {
                type: "line",
                data: {
                    labels: producaoSemanalData.labels,
                    datasets: [
                        {
                            label: "Falhas Registradas",
                            // ✅ Cor da linha usando themeColors
                            borderColor: themeColors.highlightBlue, 
                            // ✅ Cor de fundo usando o RGBA calculado
                            backgroundColor: rgbaColor, 
                            data: producaoSemanalData.data,
                            tension: 0.3
                        }
                    ]
                },
                options: chartOptions.line
            });
        }

        return () => {
            if (chart1Instance.current) {
                chart1Instance.current.destroy();
                chart1Instance.current = null;
            }
        };
    // ✅ Depende de themeColors para recriar o gráfico com as cores corretas
    }, [producaoSemanalData, theme, chartOptions.line, themeColors]); 


    // ----------------------------------------------------------------------
    // ✅ 6. MODIFICADO: useEffect de Gráfico 2 depende de themeColors
    // ----------------------------------------------------------------------
    useEffect(() => {
        if (chart2Instance.current) {
            chart2Instance.current.destroy();
            chart2Instance.current = null;
        }

        if (chart2Ref.current) {
            const ctx = chart2Ref.current.getContext("2d");
            chart2Instance.current = new Chart(ctx, {
                type: "doughnut",
                data: {
                    labels: defeitosComunsData.labels,
                    datasets: [
                        {
                            data: defeitosComunsData.data,
                            backgroundColor: defeitosComunsData.backgroundColor
                        }
                    ]
                },
                options: chartOptions.doughnut
            });
        }
        
        return () => {
            if (chart2Instance.current) {
                chart2Instance.current.destroy();
                chart2Instance.current = null;
            }
        };
    // ✅ Depende de themeColors para recriar o gráfico com as cores corretas
    }, [defeitosComunsData, theme, chartOptions.doughnut, themeColors]);

    return (
        <div className={styles.dashboardcontainer}>
            <Menu currentScreen="Home" />
            <header className={styles.dashboardheader}>
                <h1>Olá, {user ? (user.name || user.username) : 'Visitante'}!</h1> 
                <p>Veja o status da produção hoje</p>
            </header>

            <div className={styles.dashboardcards}>
                <div className={`${styles.card} ${styles.kpi}`}>
                    <h2>{checklistsHoje}</h2>
                    <p>Checklists concluídos hoje</p>
                </div>

                <div className={`${styles.card} ${styles.chart}`}>
                    <h3>Falhas diárias na Semana</h3>
                    {/* A chave é o tema para forçar a renderização */}
                    <canvas ref={chart1Ref} key={`chart-1-${theme}`}></canvas> 
                </div>

                <div className={`${styles.card} ${styles.chart}`}>
                    <h3>Top 4 Defeitos Mais Comuns</h3>
                    <canvas ref={chart2Ref} key={`chart-2-${theme}`}></canvas>
                </div>
            </div>
        </div>
    );
};

export default Home;