
import React, { useState, useEffect, useCallback } from "react";
import { subDays, startOfDay, endOfDay } from "date-fns";
import { MessageCircle, FileText, Edit, Download, RefreshCw } from "lucide-react";
import { base44 } from "@/api/base44Client"; // New import for base44
// Removed: import { User } from "@/api/entities";
// Removed: import { Feedback } from "@/api/entities";

import DashboardFilters from "@/components/dashboard/DashboardFilters";
import StatCard from "@/components/dashboard/StatCard";
import ClassificationDistributionChart from "@/components/dashboard/ClassificationDistributionChart";
import NotesDistributionChart from "@/components/dashboard/NotesDistributionChart";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { isAdminGlobal, isAdminSetorial, isAdminMultiSetor, filterUsersByPermission, filterFeedbacksByPermission, getAdminSetores } from "@/components/utils/permissoes";

// ===========================================================
// PROMPT para Base44 (também exportado como BASE44_PROMPT abaixo)
//
// Cole este texto no Base44 para solicitar o front+backend com
// as regras de cálculo e filtros descritos.
// ===========================================================
/*
TÍTULO:
Dashboard de Avaliações e Feedbacks – Contagem por Tipo, Título e Setor

DESCRIÇÃO:
Desenvolva um Dashboard React (Vite) com conexão a backend (Supabase ou API Base44)
que consolide avaliações/feedbacks e apresente métricas, filtros e gráficos.

REGRAS PRINCIPAIS:
- Contar apenas avaliações finalizadas (status_avaliacao !== 'Rascunho') nas métricas principais.
- Filtros de Data (dataInicio/dataFim), Tipo de Avaliação, Título, Setor e Usuário aplicam-se a TODOS os gráficos.
- Mapear classificações antigas: 'ruim' -> 'Não atende', 'media' -> 'Atende', 'boa' -> 'Supera'.
- Exibir contagens por:
  1) Tipo de Avaliação (feedback, avaliacao_pontual, avaliacao_periodica, aic)
  2) Título (Desenvolvimento, Recuperação, etc.)
  3) Setor (RH, ControlDesk, Contencioso, Tecnologia, etc.)
- CSV deve exportar dados já filtrados (incluindo rascunhos se o filtro permitir).

SAÍDA ESPERADA:
- Front-end com gráficos e filtros.
- Backend (supabase/rest) com endpoints para Usuários e Feedbacks.
- Código documentado e pronto para rodar em localhost.

ESTRUTURA DADOS Exemplo (Feedback):
{
  id, titulo, descricao, tipo_avaliacao,
  destinatario_email, remetente_email, classificacao,
  nota, data_ocorrido, status_avaliacao
}
*/

// Exporta prompt para uso direto (string)
export const BASE44_PROMPT = `TÍTULO: Dashboard de Avaliações e Feedbacks – Contagem por Tipo, Título e Setor

DESCRIÇÃO:
Desenvolva um Dashboard React (Vite) com conexão a backend (Supabase ou API Base44)
que consolide avaliações/feedbacks e apresente métricas, filtros e gráficos.

REGRAS PRINCIPAIS:
- Contar apenas avaliações finalizadas (status_avaliacao !== 'Rascunho') nas métricas principais.
- Filtros de Data (dataInicio/dataFim), Tipo de Avaliação, Título, Setor e Usuário aplicam-se a TODOS os gráficos.
- Mapear classificações antigas: 'ruim' -> 'Não atende', 'media' -> 'Atende', 'boa' -> 'Supera'.
- Exibir contagens por:
  1) Tipo de Avaliação (feedback, avaliacao_pontual, avaliacao_periodica, aic)
  2) Título (Desenvolvimento, Recuperação, etc.)
  3) Setor (RH, ControlDesk, Contencioso, Tecnologia, etc.)
- CSV deve exportar dados já filtrados (incluindo rascunhos se o filtro permitir).

ESTRUTURA DADOS Exemplo (Feedback):
{
  id, titulo, descricao, tipo_avaliacao,
  destinatario_email, remetente_email, classificacao,
  nota, data_ocorrido, status_avaliacao
}
`;

// ===========================================================
// Utils & Defaults
// ===========================================================
const thirtyDaysAgo = subDays(new Date(), 29).toISOString().split('T')[0];
const today = new Date().toISOString().split('T')[0];

const defaultFilters = {
    dataInicio: "",
    dataFim: "",
    tipo: [],
    tipo_avaliacao: [],
    setor: [],
    usuario: [],
};

const mapOldClassification = (classification) => {
    switch (classification) {
        case 'ruim': return 'Não atende';
        case 'media': return 'Atende';
        case 'boa': return 'Supera';
        default: return classification; // Return as is if already new classification or unknown
    }
};

// Helper to apply UI filters
const applyAllFilters = (feedbacks, currentUser, allUsers, filters) => {
    const userMap = new Map(allUsers.map(u => [u.email, u]));

    return feedbacks.filter(f => {
        const recipient = userMap.get(f.destinatario_email);
        const feedbackDate = new Date(f.data_ocorrido);

        if (filters.dataInicio && startOfDay(new Date(filters.dataInicio)) > feedbackDate) return false;
        if (filters.dataFim && endOfDay(new Date(filters.dataFim)) < feedbackDate) return false;

        if (filters.tipo_avaliacao && filters.tipo_avaliacao.length > 0) {
            if (!filters.tipo_avaliacao.includes(f.tipo_avaliacao || 'feedback')) return false;
        }

        if (filters.tipo && filters.tipo.length > 0) {
            if (!filters.tipo.includes(f.titulo)) return false;
        }

        if (filters.setor && filters.setor.length > 0) {
            if (!filters.setor.includes(recipient?.setor)) return false;
        }

        if (filters.usuario && filters.usuario.length > 0) {
            if (!filters.usuario.includes(f.destinatario_email)) return false;
        }

        return true;
    });
};

// ===========================================================
// Small, dependency-free bar chart used for Tipo/Título/Setor
// ===========================================================
function SimpleBarChart({ title, data = {}, isLoading }) {
    // data: { label1: count, label2: count, ... }
    const entries = Object.entries(data || {});
    const max = entries.reduce((m, [, v]) => Math.max(m, v), 0) || 1;

    return (
        <Card className="p-4 rounded-xl shadow-sm">
            <CardContent className="p-0">
                <h4 className="text-sm font-medium mb-3">{title}</h4>
                {isLoading ? (
                    <div className="space-y-2">
                        <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                ) : entries.length === 0 ? (
                    <div className="text-sm text-gray-500">Sem dados</div>
                ) : (
                    <div className="space-y-2">
                        {entries.map(([label, value]) => {
                            const pct = Math.round((value / max) * 100);
                            return (
                                <div key={label} className="flex items-center gap-3">
                                    <div className="w-32 text-sm text-gray-700 truncate">{label}</div>
                                    <div className="flex-1 bg-gray-100 rounded h-6 overflow-hidden">
                                        <div style={{ width: `${pct}%` }} className="h-6 flex items-center px-2 text-sm font-medium">
                                            <span className="truncate">{value}</span>
                                        </div>
                                    </div>
                                    <div className="w-12 text-right text-sm text-gray-600">{value}</div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

// ===========================================================
// Dashboard Component (atualizado)
// ===========================================================
export default function Dashboard() {
    const [currentUser, setCurrentUser] = useState(null);
    const [allFeedbacks, setAllFeedbacks] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [stats, setStats] = useState({});
    const [chartData, setChartData] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [filters, setFilters] = useState(defaultFilters);

    const loadInitialData = useCallback(async () => {
        setIsLoading(true);
        try {
            const user = await base44.auth.me(); // Changed to use base44.auth
            setCurrentUser(user);

            let usersPromise;
            let feedbacksPromise;

            // Admin Global: acesso total
            if (isAdminGlobal(user)) {
                usersPromise = base44.entities.User.list(); // Changed to use base44.entities
                feedbacksPromise = base44.entities.Feedback.list("-updated_date", 5000); // Changed to use base44.entities
            }
            // Admin Multi-Setorial: acesso aos setores permitidos
            else if (isAdminMultiSetor(user)) {
                usersPromise = base44.entities.User.list(); // Changed to use base44.entities
                feedbacksPromise = base44.entities.Feedback.list("-updated_date", 5000); // Changed to use base44.entities
            }
            // Admin Setorial: apenas do seu setor
            else if (isAdminSetorial(user)) {
                usersPromise = base44.entities.User.list(); // Changed to use base44.entities (following outline)
                feedbacksPromise = base44.entities.Feedback.list("-updated_date", 5000); // Changed to use base44.entities
            }
            // Gestor: sua equipe (usando apenas feedbacks, não precisa listar todos os usuários)
            else if (user.cargo === 'gestor') {
                // Buscar apenas feedbacks recebidos/enviados pela equipe do gestor
                const feedbacksRecebidosPromise = base44.entities.Feedback.list("-updated_date", 2500); // Changed to use base44.entities
                const feedbacksEnviadosPromise = base44.entities.Feedback.list("-updated_date", 2500); // Changed to use base44.entities
                
                feedbacksPromise = Promise.all([feedbacksRecebidosPromise, feedbacksEnviadosPromise])
                    .then(([feedbacksRecebidos, feedbacksEnviados]) => {
                        const combined = [...feedbacksRecebidos, ...feedbacksEnviados];
                        return Array.from(new Map(combined.map(f => [f.id, f])).values());
                    });

                // Para gestores, criar lista de usuários a partir dos feedbacks
                usersPromise = feedbacksPromise.then(feedbacks => {
                    const uniqueEmails = new Set();
                    feedbacks.forEach(f => {
                        if (f.destinatario_email) uniqueEmails.add(f.destinatario_email);
                        if (f.remetente_email) uniqueEmails.add(f.remetente_email);
                    });
                    // Adicionar o próprio gestor
                    uniqueEmails.add(user.email);
                    
                    // Criar objetos de usuário básicos a partir dos emails
                    return Array.from(uniqueEmails).map(email => ({
                        email: email,
                        full_name: email.split('@')[0],
                        setor: user.setor
                    }));
                });
            }
            // Usuário comum
            else { // 'usuario'
                usersPromise = Promise.resolve([user]);
                
                const feedbacksRecebidosPromise = base44.entities.Feedback.filter({ destinatario_email: user.email }, "-updated_date", 2500); // Changed to use base44.entities
                const feedbacksEnviadosPromise = base44.entities.Feedback.filter({ remetente_email: user.email }, "-updated_date", 2500); // Changed to use base44.entities

                feedbacksPromise = Promise.all([feedbacksRecebidosPromise, feedbacksEnviadosPromise])
                    .then(([feedbacksRecebidos, feedbacksEnviados]) => {
                        const combined = [...feedbacksRecebidos, ...feedbacksEnviados];
                        return Array.from(new Map(combined.map(f => [f.id, f])).values());
                    });
            }

            const [feedbacks, users] = await Promise.all([feedbacksPromise, usersPromise]);

            // Aplicar filtro para Admin Setorial e Admin Multi-Setorial
            const filteredFeedbacks = (isAdminSetorial(user) || isAdminMultiSetor(user))
                ? filterFeedbacksByPermission(feedbacks, user, users)
                : feedbacks;

            setAllFeedbacks(filteredFeedbacks);
            setAllUsers(users);
        } catch (error) {
            console.error("Erro ao carregar dados iniciais:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadInitialData();
    }, [loadInitialData]);

    const calculateStats = useCallback(() => {
        if (!currentUser) return;
        setIsLoading(true);

        // 1. Aplica os filtros da UI para obter o conjunto de dados base
        const allFiltered = applyAllFilters(allFeedbacks, currentUser, allUsers, filters);

        // 2. Separa finalizadas e rascunhos ANTES de aplicar filtros específicos
        const finalFeedbacks = allFiltered.filter(f => f.status_avaliacao !== 'Rascunho');
        const rascunhoFeedbacks = allFiltered.filter(f => f.status_avaliacao === 'Rascunho');

        // 3. Cálculos principais (apenas finalizadas)
        const totalGeral = finalFeedbacks.length;

        const totalFeedbacks = finalFeedbacks.filter(f => (f.tipo_avaliacao || 'feedback') === 'feedback').length;
        const totalPontuais = finalFeedbacks.filter(f => f.tipo_avaliacao === 'avaliacao_pontual').length;
        const totalPeriodicas = finalFeedbacks.filter(f => f.tipo_avaliacao === 'avaliacao_periodica').length;
        const totalAIC = finalFeedbacks.filter(f => f.tipo_avaliacao === 'aic').length;

        // 4. Conta TODOS os rascunhos (independente do tipo)
        const totalRascunhos = rascunhoFeedbacks.length;
        const totalAICRascunhos = rascunhoFeedbacks.filter(f => f.tipo_avaliacao === 'aic').length;
        const totalFeedbacksRascunhos = rascunhoFeedbacks.filter(f => (f.tipo_avaliacao || 'feedback') === 'feedback').length;
        const totalPontuaisRascunhos = rascunhoFeedbacks.filter(f => f.tipo_avaliacao === 'avaliacao_pontual').length;
        const totalPeriodicasRascunhos = rascunhoFeedbacks.filter(f => f.tipo_avaliacao === 'avaliacao_periodica').length;


        const mediaNotas = totalGeral > 0
            ? finalFeedbacks.reduce((sum, f) => sum + (f.nota || 0), 0) / totalGeral
            : 0;

        // Distribuição de classificações (mapeia antigos)
        const classificacoes = {
            'Não atende': 0,
            'Atende abaixo': 0,
            'Atende': 0,
            'Supera parcialmente': 0,
            'Supera': 0
        };

        finalFeedbacks.forEach(f => {
            const mapped = mapOldClassification(f.classificacao);
            if (classificacoes.hasOwnProperty(mapped)) classificacoes[mapped]++;
        });

        // Distribuição de notas (0..5)
        const notasDistribution = Array(6).fill(0);
        finalFeedbacks.forEach(f => {
            const nota = Math.round(f.nota || 0);
            if (nota >= 0 && nota <= 5) notasDistribution[nota]++;
        });

        // Contagem por Tipo de Avaliação
        const contagemPorTipo = {};
        finalFeedbacks.forEach(f => {
            const tipo = f.tipo_avaliacao || 'feedback';
            contagemPorTipo[tipo] = (contagemPorTipo[tipo] || 0) + 1;
        });

        // Contagem por Título
        const contagemPorTitulo = {};
        finalFeedbacks.forEach(f => {
            const titulo = f.titulo || 'Sem título';
            contagemPorTitulo[titulo] = (contagemPorTitulo[titulo] || 0) + 1;
        });

        // Contagem por Setor (baseado no destinatário)
        const contagemPorSetor = {};
        const userMap = new Map(allUsers.map(u => [u.email, u]));
        finalFeedbacks.forEach(f => {
            const recipient = userMap.get(f.destinatario_email);
            const setor = recipient?.setor || 'N/A';
            contagemPorSetor[setor] = (contagemPorSetor[setor] || 0) + 1;
        });

        // 5. Atualiza estados
        setStats({
            totalGeral,
            totalFeedbacks,
            totalPontuais,
            totalPeriodicas,
            totalAIC,
            totalRascunhos,
            totalAICRascunhos,
            totalFeedbacksRascunhos,
            totalPontuaisRascunhos,
            totalPeriodicasRascunhos,
            mediaNotas: parseFloat(mediaNotas.toFixed(1)),
        });

        setChartData({
            classificacoes,
            notasDistribution,
            contagemPorTipo,
            contagemPorTitulo,
            contagemPorSetor
        });

        setIsLoading(false);
    }, [filters, currentUser, allFeedbacks, allUsers]);

    useEffect(() => {
        calculateStats();
    }, [calculateStats]);

    const exportarCSV = () => {
        if (!currentUser || !allUsers.length) return;

        const feedbacksParaExportar = applyAllFilters(allFeedbacks, currentUser, allUsers, filters);
        const userMap = new Map(allUsers.map(u => [u.email, u]));

        const csvHeader = ["ID", "Data Ocorrido", "Título", "Remetente", "Destinatario", "Setor Destinatario", "Classificacao", "Nota", "Status Avaliacao", "Descricao\n"];
        const csvRows = feedbacksParaExportar.map(f => {
            const recipient = userMap.get(f.destinatario_email);
            const row = [
                f.id,
                new Date(f.data_ocorrido).toLocaleString('pt-BR'),
                f.titulo,
                f.remetente_nome,
                f.destinatario_nome,
                recipient?.setor || 'N/A',
                mapOldClassification(f.classificacao),
                f.nota,
                f.status_avaliacao || 'Enviado',
                `"${(f.descricao || '').replace(/"/g, '""')}"`
            ];
            return row.join(',');
        });

        const csvString = [csvHeader.join(','), ...csvRows].join('\n');
        const blob = new Blob([`\uFEFF${csvString}`], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', 'relatorio_avaliacoes.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (!currentUser) {
        return <div className="p-8 text-center">Carregando...</div>;
    }

    return (
        <div className="p-4 md:p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
            <div className="max-w-7xl mx-auto">
                <header className="mb-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Dashboard de Análise</h1>
                            <p className="text-gray-500 dark:text-gray-400">
                                Olá, {currentUser.full_name}! 👋 Aqui está o resumo de desempenho {
                                    isAdminGlobal(currentUser) ? 'da empresa' :
                                    isAdminMultiSetor(currentUser) ? `dos setores ${getAdminSetores(currentUser).join(', ')}` :
                                    isAdminSetorial(currentUser) ? `do setor ${currentUser.setor}` :
                                    currentUser.cargo === 'gestor' ? 'da sua equipe' : 'individual'
                                }.
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                             <Button onClick={loadInitialData} variant="outline" size="sm" disabled={isLoading}>
                                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                                Atualizar
                            </Button>
                            <Button onClick={exportarCSV} variant="outline" size="sm" disabled={isLoading}>
                                <Download className="w-4 h-4 mr-2" />
                                Exportar
                            </Button>
                        </div>
                    </div>

                    <DashboardFilters 
                        filters={filters}
                        onFilterChange={setFilters}
                        userRole={currentUser.cargo}
                        allUsers={allUsers}
                        onClearFilters={() => setFilters(defaultFilters)}
                    />
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <StatCard title="Total de Avaliações Enviadas" value={stats.totalGeral} icon={MessageCircle} color="text-blue-500" bgColor="bg-blue-50" isLoading={isLoading} />
                    <StatCard title="Total em Rascunho" value={stats.totalRascunhos} icon={Edit} color="text-yellow-500" bgColor="bg-yellow-50" isLoading={isLoading} />
                    <StatCard title="Feedbacks Enviados" value={stats.totalFeedbacks} icon={MessageCircle} color="text-purple-500" bgColor="bg-purple-50" isLoading={isLoading} />
                    <StatCard title="Feedbacks em Rascunho" value={stats.totalFeedbacksRascunhos} icon={Edit} color="text-purple-300" bgColor="bg-purple-50" isLoading={isLoading} />
                    <StatCard title="Aval. Pontuais Enviadas" value={stats.totalPontuais} icon={MessageCircle} color="text-orange-500" bgColor="bg-orange-50" isLoading={isLoading} />
                    <StatCard title="Pontuais em Rascunho" value={stats.totalPontuaisRascunhos} icon={Edit} color="text-orange-300" bgColor="bg-orange-50" isLoading={isLoading} />
                    <StatCard title="Aval. Periódicas Enviadas" value={stats.totalPeriodicas} icon={MessageCircle} color="text-teal-500" bgColor="bg-teal-50" isLoading={isLoading} />
                    <StatCard title="Periódicas em Rascunho" value={stats.totalPeriodicasRascunhos} icon={Edit} color="text-teal-300" bgColor="bg-teal-50" isLoading={isLoading} />
                    <StatCard title="A.I.C Enviadas" value={stats.totalAIC} icon={FileText} color="text-indigo-500" bgColor="bg-indigo-50" isLoading={isLoading} />
                    <StatCard title="A.I.C em Rascunho" value={stats.totalAICRascunhos} icon={Edit} color="text-indigo-300" bgColor="bg-indigo-50" isLoading={isLoading} />
                    
                    <Card className="md:col-span-2 lg:col-span-2 p-6 flex flex-col justify-center items-center shadow-sm hover:shadow-md transition-shadow duration-300 rounded-xl">
                         <CardContent className="p-0 text-center w-full">
                            {isLoading ? (
                                <div className="space-y-2">
                                     <div className="w-12 h-12 mx-auto rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
                                     <div className="h-4 w-24 mx-auto bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                                     <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                                </div>
                            ) : (
                                <>
                                    <div className="relative w-24 h-24 mx-auto mb-2">
                                        <svg className="w-full h-full" viewBox="0 0 36 36">
                                            <path className="text-gray-200 dark:text-gray-700"
                                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                fill="none" stroke="currentColor" strokeWidth="3" />
                                            <path className="text-green-500"
                                                strokeDasharray={`${(stats.mediaNotas / 5) * 100}, 100`}
                                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                                        </svg>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="text-2xl font-bold text-gray-800 dark:text-white">{stats.mediaNotas}</span>
                                        </div>
                                    </div>
                                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Média Geral de Notas</h3>
                                </>
                            )}
                         </CardContent>
                    </Card>
                </div>

                <div className="grid lg:grid-cols-5 gap-4 mb-6">
                    <div className="lg:col-span-2">
                        <ClassificationDistributionChart data={chartData.classificacoes} isLoading={isLoading}/>
                    </div>
                    <div className="lg:col-span-3">
                         <NotesDistributionChart data={chartData.notasDistribution} isLoading={isLoading} />
                    </div>
                </div>

                {/* Novos gráficos: Tipo, Título, Setor */}
                <div className="grid lg:grid-cols-3 gap-4 mt-6">
                    <SimpleBarChart title="Tipo de Avaliação" data={chartData.contagemPorTipo} isLoading={isLoading} />
                    <SimpleBarChart title="Títulos (motivos)" data={chartData.contagemPorTitulo} isLoading={isLoading} />
                    <SimpleBarChart title="Setores (destinatários)" data={chartData.contagemPorSetor} isLoading={isLoading} />
                </div>
            </div>
        </div>
    );
}
