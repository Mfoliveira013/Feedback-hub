import React, { useState, useEffect, useMemo, useCallback } from "react";
import { User } from "@/api/entities";
import { Feedback } from "@/api/entities"; // Keep Feedback entity name
import { SendEmail } from "@/api/integrations";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessagesSquare, Filter, Calendar, XCircle, Search, Edit, Trash2, Save, Send, AlertTriangle, Star, Target, Download } from "lucide-react"; // Adicionado Download
import { format } from "date-fns";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import ReenviarEmailModal from '../components/feedback/ReenviarEmailModal';
import { Slider } from "@/components/ui/slider"; // Import Slider
import MultiSelectFilter from "@/components/ui/MultiSelectFilter"; // Added import for MultiSelectFilter
import { isAdminGlobal, isAdminSetorial, filterFeedbacksByPermission, canDelete } from "@/components/utils/permissoes";

const getNotaInfo = (nota) => {
    if (nota < 2) return { text: "Não atende", color: "text-red-600", bgColor: "bg-red-100" };
    if (nota < 3) return { text: "Atende abaixo", color: "text-orange-600", bgColor: "bg-orange-100" };
    if (nota < 4) return { text: "Atende", color: "text-yellow-600", bgColor: "bg-yellow-100" };
    if (nota < 5) return { text: "Supera parcialmente", color: "text-blue-600", bgColor: "bg-blue-100" };
    return { text: "Supera", color: "text-green-600", bgColor: "bg-green-100" };
};

const mapOldToNewClassification = (c) => {
    // If 'c' is already one of the new classifications, return it.
    if (["Não atende", "Atende abaixo", "Atende", "Supera parcialmente", "Supera"].includes(c)) {
        return c;
    }
    // Map old classifications
    if (c === 'ruim') return 'Não atende';
    if (c === 'media') return 'Atende';
    if (c === 'boa') return 'Supera';
    return c; // Return original if no mapping found (e.g., empty or unknown)
};

const setoresOptions = [
    { value: "RH", label: "RH" }, { value: "Controldesk", label: "Controldesk" }, { value: "Controladoria", label: "Controladoria" }, { value: "M.I.S", label: "M.I.S" },
    { value: "Extra", label: "Extra" }, { value: "Acordo Jud", label: "Acordo Jud" }, { value: "Contencioso", label: "Contencioso" }, { value: "Focais", label: "Focais" },
    { value: "Filiais", label: "Filiais" }, { value: "Iniciais", label: "Iniciais" }, { value: "Adm", label: "Adm" },
    { value: "Contrárias", label: "Contrárias" }, { value: "Tecnologia", label: "Tecnologia" }, { value: "Recuperação Judicial", label: "Recuperação Judicial" }
];

const tipoAvaliacaoLabels = {
    feedback: "Feedback",
    avaliacao_pontual: "Avaliação Pontual",
    avaliacao_periodica: "Avaliação Periódica",
};

const tipoAvaliacaoOptions = [
    { value: "feedback", label: "Feedback" },
    { value: "avaliacao_pontual", label: "Avaliação Pontual" },
    { value: "avaliacao_periodica", label: "Avaliação Periódica" },
];

const allTituloOptions = [
    { value: "Desenvolvimento", label: "Desenvolvimento" },
    { value: "Recuperação", label: "Recuperação" },
    { value: "Treinamento", label: "Treinamento" },
    { value: "Integração", label: "Integração" },
    { value: "Advertência Comportamental", label: "Advertência Comportamental" },
    { value: "Advertência Operacional", label: "Advertência Operacional" },
    { value: "Rescisão", label: "Rescisão" },
    { value: "Produtividade", label: "Produtividade" },
    { value: "Conduta Pessoal", label: "Conduta Pessoal" },
    { value: "Engajamento", label: "Engajamento" }
];


export default function TodosFeedbacks() { // Function name retained as per outline
    const [currentUser, setCurrentUser] = useState(null);
    const [allUsers, setAllUsers] = useState([]); // New state for all users or team users
    const [allFeedbacks, setAllFeedbacks] = useState([]); // Renamed from 'feedbacks'
    const [filteredFeedbacks, setFilteredFeedbacks] = useState([]); // Renamed from 'feedbacksFiltrados'
    const [filtros, setFiltros] = useState({
        busca: "", // Renamed from 'nome' to 'busca'
        dataInicio: "",
        dataFim: "",
        tipo_avaliacao: [] // Changed to array for multi-select
    });

    // Estados para edição
    const [feedbackEditando, setFeedbackEditando] = useState(null); // Renamed from avaliacaoEditando
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editFormData, setEditFormData] = useState({
        titulo: [], // Changed to array for multi-select
        nota: [3], // Changed from classificacao to nota, with default for slider
        descricao: ""
    });
    const [salvandoEdicao, setSalvandoEdicao] = useState(false);

    // Estados para exclusão
    const [excluindoFeedback, setExcluindoFeedback] = useState(false); // Renamed from excluindoAvaliacao
    const [reenviandoEmailId, setReenviandoEmailId] = useState(null); // Renamed from reenviandoEmailAvaliacaoId
    const [isExporting, setIsExporting] = useState(false); // Novo estado para exportação

    // Novos estados para carregamento e modal de reenvio de e-mail
    const [isLoading, setIsLoading] = useState(true);
    const [isReenviarModalOpen, setIsReenviarModalOpen] = useState(false);
    const [feedbackParaReenviar, setFeedbackParaReenviar] = useState(null); // Renamed from avaliacaoParaReenvio


    const loadInitialData = useCallback(async () => { // Renamed from loadData
        setIsLoading(true);
        try {
            const user = await User.me();
            setCurrentUser(user);

            let relevantFeedbacks = [];
            let usersForFilter = [];

            // Admin Global: todos os feedbacks
            if (isAdminGlobal(user)) {
                relevantFeedbacks = await Feedback.list("-created_date", 5000);
                usersForFilter = await User.list();
            }
            // Admin Setorial: apenas feedbacks do setor
            else if (isAdminSetorial(user)) {
                const allFeedbacksFromDB = await Feedback.list("-created_date", 5000);
                usersForFilter = await User.filter({ setor: user.setor });
                relevantFeedbacks = filterFeedbacksByPermission(allFeedbacksFromDB, user, usersForFilter);
            }
            // Gestor: feedbacks da equipe
            else if (user.cargo === 'gestor') {
                const teamUsers = await User.filter({ gerente_responsavel: user.email });
                const teamAndManager = [user, ...teamUsers];
                usersForFilter = teamAndManager;
                const teamEmails = new Set(teamAndManager.map(u => u.email));

                const allFeedbacksFromDB = await Feedback.list("-created_date", 5000);
                relevantFeedbacks = allFeedbacksFromDB.filter(f =>
                    teamEmails.has(f.destinatario_email) ||
                    teamEmails.has(f.remetente_email)
                );
            }
            // Usuário comum: apenas seus feedbacks
            else { // usuario
                relevantFeedbacks = await Feedback.filter({ destinatario_email: user.email }, "-created_date");
                usersForFilter = [user];
            }

            setAllUsers(usersForFilter);

            // Filtra para remover avaliações A.I.C. desta tela para todos os cargos
            const feedbacksFilteredAIC = relevantFeedbacks.filter(f => f.tipo_avaliacao !== 'aic');
            setAllFeedbacks(feedbacksFilteredAIC); // Renamed state update
            // setFilteredFeedbacks will be handled by aplicarFiltros useEffect
        } catch (error) {
            console.error("Erro ao carregar dados:", error); // Updated message
            alert("Erro ao carregar dados. Verifique a conexão ou tente novamente.");
        } finally {
            setIsLoading(false);
        }
    }, []); // Empty dependency array as `User` and `Feedback` are static methods, and `useState` setters are stable.

    const aplicarFiltros = useCallback(() => {
        let resultado = [...allFeedbacks]; // Renamed reference from 'feedbacks'

        // Filtro por busca (remetente ou destinatário)
        if (filtros.busca) { // Renamed from 'nome'
            const buscaLowerCase = filtros.busca.toLowerCase();
            resultado = resultado.filter(f => 
                f.remetente_nome?.toLowerCase().includes(buscaLowerCase) ||
                f.destinatario_nome?.toLowerCase().includes(buscaLowerCase)
            );
        }

        // Filtro por data (usando data_ocorrido)
        if (filtros.dataInicio) {
            resultado = resultado.filter(f => new Date(f.data_ocorrido) >= new Date(filtros.dataInicio));
        }
        if (filtros.dataFim) {
            resultado = resultado.filter(f => new Date(f.data_ocorrido) <= new Date(filtros.dataFim + "T23:59:59"));
        }

        // Novo filtro por tipo de avaliação - Updated for multi-select
        if (filtros.tipo_avaliacao.length > 0) {
            resultado = resultado.filter(f => filtros.tipo_avaliacao.includes(f.tipo_avaliacao || 'feedback'));
        }

        setFilteredFeedbacks(resultado); // Renamed state update from 'setFeedbacksFiltrados'
    }, [filtros, allFeedbacks]); // Renamed dependency from 'feedbacks'

    useEffect(() => {
        loadInitialData(); // Renamed from loadData
    }, [loadInitialData]); // Dependency correctly refers to the new name

    useEffect(() => {
        aplicarFiltros();
    }, [filtros, allFeedbacks, aplicarFiltros]); // Renamed dependency from 'feedbacks'

    const handleFiltroChange = (campo, valor) => {
        setFiltros(prev => ({ ...prev, [campo]: valor }));
    };

    const limparFiltros = () => {
        setFiltros({ busca: "", dataInicio: "", dataFim: "", tipo_avaliacao: [] }); // Updated with new filter
    };

    const handleExportToCSV = () => {
        if (filteredFeedbacks.length === 0) {
            alert("Nenhuma avaliação para exportar com os filtros atuais.");
            return;
        }

        setIsExporting(true);

        try {
            const headers = [
                "ID", "Data Ocorrido", "Tipo de Avaliação", "Título", "De (Nome)", "Para (Nome)", "Classificação", "Nota", "Descrição", "Status E-mail", "Registrado Por"
            ];

            const csvRows = [headers.join(',')];

            for (const feedback of filteredFeedbacks) {
                const row = [
                    `"${feedback.id}"`,
                    `"${format(new Date(feedback.data_ocorrido), "dd/MM/yyyy HH:mm")}"`,
                    `"${tipoAvaliacaoLabels[feedback.tipo_avaliacao] || 'N/A'}"`,
                    `"${Array.isArray(feedback.titulo) ? feedback.titulo.join('; ') : (feedback.titulo || '')}"`,
                    `"${feedback.remetente_nome || ''}"`,
                    `"${feedback.destinatario_nome || ''}"`,
                    `"${getNotaInfo(feedback.nota).text || mapOldToNewClassification(feedback.classificacao) || ''}"`,
                    `"${feedback.nota !== undefined && feedback.nota !== null ? feedback.nota.toFixed(1) : ''}"`,
                    `"${(feedback.descricao || '').replace(/"/g, '""')}"`,
                    `"${feedback.status_email || 'N/A'}"`,
                    `"${feedback.registrado_por_cargo || 'N/A'}"`
                ];
                csvRows.push(row.join(','));
            }

            const csvString = csvRows.join('\n');
            const blob = new Blob([`\uFEFF${csvString}`], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm');
            link.setAttribute('download', `relatorio_avaliacoes_${timestamp}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

        } catch (error) {
            console.error("Erro ao exportar CSV:", error);
            alert("Ocorreu um erro ao tentar exportar os dados.");
        } finally {
            setIsExporting(false);
        }
    };

    const handleEditFeedback = (feedback) => { // Renamed parameter
        setFeedbackEditando(feedback); // Renamed state update
        const tituloAsArray = Array.isArray(feedback.titulo) ? feedback.titulo : (feedback.titulo ? [feedback.titulo] : []);
        setEditFormData({
            titulo: tituloAsArray,
            nota: [feedback.nota || 3], // Set nota for slider, default to 3 if not present
            descricao: feedback.descricao
        });
        setIsEditModalOpen(true);
    };

    const handleSaveEdit = async () => {
        if (!editFormData.titulo.length || !editFormData.descricao) {
            alert("Por favor, preencha o título e a descrição.");
            return;
        }

        const notaValue = Array.isArray(editFormData.nota) ? editFormData.nota[0] : editFormData.nota;
        const newClassificationText = getNotaInfo(notaValue).text;

        setSalvandoEdicao(true);
        try {
            await Feedback.update(feedbackEditando.id, { // Uses feedbackEditando
                titulo: editFormData.titulo, // This is now an array
                nota: notaValue, // Save the numeric score
                classificacao: newClassificationText, // Save the derived text classification
                descricao: editFormData.descricao
            });

            setIsEditModalOpen(false);
            setFeedbackEditando(null); // Renamed state update
            loadInitialData(); // Recarrega os dados - Renamed from loadData
        } catch (error) {
            console.error("Erro ao editar feedback:", error); // Updated message
            alert("Erro ao salvar alterações. Tente novamente.");
        }
        setSalvandoEdicao(false);
    };

    const handleDeleteFeedback = async (feedbackId) => { // Renamed parameter
        setExcluindoFeedback(true); // Renamed state update
        try {
            await Feedback.delete(feedbackId);
            loadInitialData(); // Recarrega os dados - Renamed from loadData
        } catch (error) {
            console.error("Erro ao excluir feedback:", error); // Updated message
            alert("Erro ao excluir feedback. Tente novamente.");
        } finally {
            setExcluindoFeedback(false); // Renamed state update
        }
    };

    const openReenviarModal = (feedback) => { // Renamed parameter
        setFeedbackParaReenviar(feedback); // Renamed state update
        setIsReenviarModalOpen(true);
    };

    const confirmResendEmail = async () => {
        if (!feedbackParaReenviar) return; // Renamed reference

        setReenviandoEmailId(feedbackParaReenviar.id); // Renamed state update and reference
        await Feedback.update(feedbackParaReenviar.id, { status_email: 'pendente' }); // Renamed reference

        try {
            const dataEnvio = new Date();
            const dataFormatadaEnvio = dataEnvio.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
            
            const htmlBody = `
                <!DOCTYPE html>
                <html lang="pt-BR">
                <head>
                  <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>Nova Avaliação Recebida</title> <!-- Updated title -->
                  <style>
                    body { font-family: "Segoe UI", Arial, sans-serif; background-color: #f4f6f9; margin: 0; padding: 0; color: #333333; }
                    .container { max-width: 650px; margin: 30px auto; background: #ffffff; border-radius: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); overflow: hidden; }
                    .header { background: #000529; color: #ffffff; text-align: center; padding: 20px; }
                    .header h1 { margin: 0; font-size: 20px; font-weight: 600; }
                    .content { padding: 25px 30px; line-height: 1.6; }
                    .content h2 { color: #000529; font-size: 18px; margin-top: 0; border-bottom: 1px solid #eeeeee; padding-bottom: 8px; }
                    .feedback-box { background: #f9fafc; border-left: 4px solid #000529; padding: 15px; margin: 20px 0; border-radius: 4px; }
                    .feedback-box p { margin: 6px 0; }
                    .footer { text-align: center; font-size: 12px; color: #777777; padding: 20px; border-top: 1px solid #eeeeee; background: #fafafa; }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <div class="header"><h1>Nabarrete & Ferro Advogados Associados</h1></div>
                    <div class="content">
                      <p>Prezado(a) <strong>${feedbackParaReenviar.destinatario_nome || 'Colaborador'}</strong>,</p>
                      <p>Você recebeu uma nova avaliação registrada em nosso sistema interno. (Este é um reenvio de uma notificação anterior).</p> <!-- Updated text -->
                      <h2>Detalhes da Avaliação</h2> <!-- Updated title -->
                      <div class="feedback-box">
                        <p><strong>Título:</strong> ${Array.isArray(feedbackParaReenviar.titulo) ? feedbackParaReenviar.titulo.join(', ') : feedbackParaReenviar.titulo}</p>
                        ${feedbackParaReenviar.retroativo ? `<p><strong>Data do Ocorrido:</strong> ${new Date(feedbackParaReenviar.data_ocorrido).toLocaleDateString('pt-BR')}</p>` : ''}
                        <p><strong>Nota:</strong> ${feedbackParaReenviar.nota} / 5</p>
                        <p><strong>Descrição:</strong> ${feedbackParaReenviar.descricao}</p>
                        <p><strong>Data do Reenvio:</strong> ${dataFormatadaEnvio}</p>
                      </div>
                      <p>Esta avaliação foi registrada de forma confidencial com o objetivo de contribuir para o seu desenvolvimento profissional.</p> <!-- Updated text -->
                    </div>
                    <div class="footer">
                      Esta é uma mensagem automática. Por favor, não responda este e-mail.<br>
                      © ${new Date().getFullYear()} Nabarrete & Ferro Advogados Associados. Todos os direitos reservados.
                    </div>
                  </div>
                </body>
                </html>
            `;

            await SendEmail({
                from_name: "Nabarrete & Ferro Advogados",
                to: feedbackParaReenviar.destinatario_email,
                subject: `(Reenvio) Avaliação Recebida - ${Array.isArray(feedbackParaReenviar.titulo) ? feedbackParaReenviar.titulo.join(', ') : feedbackParaReenviar.titulo}`, // Updated subject
                body: htmlBody
            });

            await Feedback.update(feedbackParaReenviar.id, { status_email: 'enviado', motivo_falha_email: null }); // Renamed reference
            alert("E-mail reenviado com sucesso!");
        } catch (emailError) {
            const errorMessage = emailError.message || "Erro desconhecido ao reenviar e-mail.";
            // Atualiza o status para 'falha' e registra o motivo
            await Feedback.update(feedbackParaReenviar.id, { status_email: 'falha', motivo_falha_email: `Falha no reenvio: ${errorMessage}` }); // Renamed reference
            alert(`Falha ao reenviar e-mail: ${errorMessage}`);
        } finally {
            setReenviandoEmailId(null); // Renamed state update
            setIsReenviarModalOpen(false); // Close the modal
            setFeedbackParaReenviar(null); // Clear the feedback from state // Renamed state update
            loadInitialData(); // Recarrega os dados para refletir o novo status - Renamed from loadData
        }
    };

    const getClassificacaoStyle = (classificacao) => {
        // Use mapOldToNewClassification to get a consistent string for styling
        const mappedClassification = mapOldToNewClassification(classificacao);
        switch (mappedClassification) {
            case "Não atende": return "bg-red-100 text-red-800 border-red-200";
            case "Atende abaixo": return "bg-orange-100 text-orange-800 border-orange-200";
            case "Atende": return "bg-yellow-100 text-yellow-800 border-yellow-200";
            case "Supera parcialmente": return "bg-blue-100 text-blue-800 border-blue-200";
            case "Supera": return "bg-green-100 text-green-800 border-green-200";
            default: return "bg-gray-100 text-gray-800 border-gray-200";
        }
    };

    const getEmailStatusBadge = (feedback) => { // Renamed parameter
        switch (feedback.status_email) {
            case 'enviado':
                return <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">E-mail Enviado</Badge>;
            case 'falha':
                return (
                    <HoverCard>
                        <HoverCardTrigger asChild>
                            <Badge variant="destructive" className="cursor-pointer bg-red-100 text-red-800 border-red-200">
                                <AlertTriangle className="h-3 w-3 mr-1" />Falha no Envio
                            </Badge>
                        </HoverCardTrigger>
                        <HoverCardContent className="w-80">
                            <div className="flex space-x-4">
                                <AlertTriangle className="h-6 w-6 text-red-500 mt-1 flex-shrink-0" />
                                <div>
                                    <h4 className="text-sm font-semibold">Motivo da Falha</h4>
                                    <p className="text-sm">
                                        {feedback.motivo_falha_email || 'Erro desconhecido.'}
                                    </p>
                                </div>
                            </div>
                        </HoverCardContent>
                    </HoverCard>
                );
            case 'pendente':
                return <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">Pendente Envio</Badge>;
            default:
                return <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">Não enviado</Badge>;
        }
    };

    if (isLoading) return <div className="p-8">Carregando...</div>;
    if (!currentUser) return <div className="p-8">Erro: Usuário não carregado.</div>;

    const pageDescription = currentUser.cargo === 'usuario'
        ? 'Visualize e gerencie os feedbacks que você recebeu.' // Updated text
        : currentUser.cargo === 'gestor'
        ? 'Visualize e gerencie todos os feedbacks do seu setor e dos seus liderados.' // Updated text
        : 'Visualize e gerencie todos os feedbacks da empresa.'; // Updated text

    return (
        <div className="p-6 md:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
                        <MessagesSquare className="w-8 h-8 text-blue-600" />
                        Todas as Avaliações
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        {pageDescription}
                    </p>
                </div>

                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Filter className="w-5 h-5"/>Filtros de Pesquisa</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                            <div>
                                <Label htmlFor="busca" className="flex items-center gap-2 mb-1"><Search className="w-4 h-4"/>Buscar por Nome</Label>
                                <Input
                                    id="busca"
                                    value={filtros.busca} // Renamed from 'nome'
                                    onChange={e => handleFiltroChange("busca", e.target.value)} // Renamed from 'nome'
                                    placeholder="Digite o nome do remetente ou destinatário"
                                />
                            </div>
                            <div>
                                <Label htmlFor="dataInicio" className="flex items-center gap-2 mb-1"><Calendar className="w-4 h-4"/>Data de Início</Label>
                                <Input
                                    id="dataInicio"
                                    type="date"
                                    value={filtros.dataInicio}
                                    onChange={e => handleFiltroChange("dataInicio", e.target.value)}
                                />
                            </div>
                            <div>
                                <Label htmlFor="dataFim" className="flex items-center gap-2 mb-1"><Calendar className="w-4 h-4"/>Data de Fim</Label>
                                <Input
                                    id="dataFim"
                                    type="date"
                                    value={filtros.dataFim}
                                    onChange={e => handleFiltroChange("dataFim", e.target.value)}
                                />
                            </div>
                            <div>
                                <Label className="flex items-center gap-2 mb-1"><Target className="w-4 h-4" />Tipo de Avaliação</Label>
                                <MultiSelectFilter
                                    title="Selecionar Tipos"
                                    placeholder="Todos os Tipos"
                                    options={tipoAvaliacaoOptions}
                                    selectedValues={filtros.tipo_avaliacao}
                                    onSelectionChange={(selected) => handleFiltroChange("tipo_avaliacao", selected)}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end items-center gap-2">
                            <Button variant="outline" onClick={limparFiltros}>
                                <XCircle className="w-4 h-4 mr-2"/>
                                Limpar Filtros
                            </Button>
                            <Button onClick={handleExportToCSV} disabled={isExporting} className="bg-green-600 hover:bg-green-700">
                                {isExporting ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                        Exportando...
                                    </>
                                ) : (
                                    <>
                                        <Download className="w-4 h-4 mr-2" />
                                        Exportar Excel
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-between items-center">
                        <p className="text-sm text-gray-500">{filteredFeedbacks.length} resultados encontrados.</p> {/* Renamed reference from 'feedbacksFiltrados' */}
                    </CardFooter>
                </Card>

                <div className="space-y-6">
                    {filteredFeedbacks.length > 0 ? ( // Renamed reference from 'feedbacksFiltrados'
                        filteredFeedbacks.map(feedback => ( // Renamed variable from 'feedbacksFiltrados'
                            <Card key={feedback.id} className="shadow-md hover:shadow-lg transition-shadow">
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <CardTitle className="text-xl flex items-center gap-2">
                                                {Array.isArray(feedback.titulo) ? feedback.titulo.join(', ') : feedback.titulo}
                                                {feedback.retroativo && <Badge variant="outline" className="border-orange-300 text-orange-600">Retroativo</Badge>}
                                                {feedback.tipo_avaliacao && (
                                                    <Badge variant="secondary" className="capitalize text-xs font-normal">
                                                        {tipoAvaliacaoLabels[feedback.tipo_avaliacao] || feedback.tipo_avaliacao}
                                                    </Badge>
                                                )}
                                            </CardTitle>
                                            <CardDescription className="mt-2">
                                                {currentUser.cargo !== 'usuario' && (
                                                    <>
                                                        De: <span className="font-medium text-gray-800 dark:text-gray-200">{feedback.remetente_nome}</span>
                                                        <br/>
                                                    </>
                                                )}
                                                Para: <span className="font-medium text-gray-800 dark:text-gray-200">{feedback.destinatario_nome}</span>
                                            </CardDescription>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {getEmailStatusBadge(feedback)}
                                            <Badge className={getClassificacaoStyle(feedback.classificacao)}>
                                                {feedback.nota !== undefined && feedback.nota !== null ? getNotaInfo(feedback.nota).text : mapOldToNewClassification(feedback.classificacao)}
                                            </Badge>
                                            {(currentUser.cargo === "administrador" || currentUser.cargo === "gestor") && (
                                                <div className="flex gap-1">
                                                    {feedback.status_email === 'falha' && (
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            onClick={() => openReenviarModal(feedback)} // Renamed variable
                                                            disabled={reenviandoEmailId === feedback.id} // Renamed variable
                                                            className="h-8 w-8 text-blue-600 border-blue-200 hover:bg-blue-50"
                                                            title="Reenviar E-mail"
                                                        >
                                                            {reenviandoEmailId === feedback.id ? ( // Renamed variable
                                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                                                            ) : (
                                                                <Send className="w-4 h-4" />
                                                            )}
                                                        </Button>
                                                    )}
                                                    {canDelete(currentUser) && currentUser.cargo === "administrador" && (
                                                        <>
                                                            <Button
                                                                variant="outline"
                                                                size="icon"
                                                                onClick={() => handleEditFeedback(feedback)} // Renamed variable
                                                                className="h-8 w-8"
                                                            >
                                                                <Edit className="w-4 h-4" />
                                                            </Button>
                                                            <AlertDialog>
                                                                <AlertDialogTrigger asChild>
                                                                    <Button
                                                                        variant="outline"
                                                                        size="icon"
                                                                        className="h-8 w-8 text-red-600 hover:bg-red-50"
                                                                        disabled={excluindoFeedback} // Renamed variable
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </Button>
                                                                </AlertDialogTrigger>
                                                                <AlertDialogContent>
                                                                    <AlertDialogHeader>
                                                                        <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                                                        <AlertDialogDescription>
                                                                            Tem certeza de que deseja excluir este feedback? Esta ação não pode ser desfeita. {/* Updated text */}
                                                                        </AlertDialogDescription>
                                                                    </AlertDialogHeader>
                                                                    <AlertDialogFooter>
                                                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                                        <AlertDialogAction
                                                                            onClick={() => handleDeleteFeedback(feedback.id)} // Renamed variable
                                                                            className="bg-red-600 hover:bg-red-700"
                                                                            disabled={excluindoFeedback} // Renamed variable
                                                                        >
                                                                            {excluindoFeedback ? "Excluindo..." : "Excluir"} {/* Renamed variable */}
                                                                        </AlertDialogAction>
                                                                    </AlertDialogFooter>
                                                                </AlertDialogContent>
                                                            </AlertDialog>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-gray-700 dark:text-gray-300">{feedback.descricao}</p>
                                </CardContent>
                                <CardFooter className="flex justify-between items-center">
                                    <p className="text-xs text-gray-500">
                                        Ocorrido em: {format(new Date(feedback.data_ocorrido), "dd/MM/yyyy 'às' HH:mm")}
                                    </p>
                                    {feedback.registrado_por_cargo && (
                                        <Badge variant="outline" className="capitalize font-normal">
                                            Registrado por: {feedback.registrado_por_cargo}
                                        </Badge>
                                    )}
                                </CardFooter>
                            </Card>
                        ))
                    ) : (
                        <div className="text-center py-16 text-gray-500">
                            <MessagesSquare className="w-12 h-12 mx-auto mb-4"/>
                            <h3 className="text-lg font-semibold">Nenhuma avaliação encontrada</h3> {/* Updated text */}
                            <p>Tente ajustar os filtros ou aguarde por novas avaliações.</p> {/* Updated text */}
                        </div>
                    )}
                </div>

                {/* Modal de Edição */}
                <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Editar Feedback</DialogTitle> {/* Updated title */}
                            <DialogDescription>
                                Faça as alterações necessárias no feedback. {/* Updated text */}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div>
                                <Label htmlFor="edit-titulo">Título</Label>
                                <MultiSelectFilter
                                    title="Selecionar Títulos"
                                    placeholder="Selecione um ou mais títulos"
                                    options={allTituloOptions}
                                    selectedValues={editFormData.titulo}
                                    onSelectionChange={(values) => setEditFormData(prev => ({...prev, titulo: values}))}
                                    className="mt-1"
                                />
                            </div>
                            <div>
                                <Label className="text-base font-semibold flex items-center gap-2">
                                    <Star className="w-5 h-5 text-yellow-500" />
                                    Nota do Feedback (0 a 5) * {/* Updated label text */}
                                </Label>
                                <div className="mt-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                         <span className="text-sm text-gray-500">0</span>
                                         <span className="text-2xl font-bold">
                                             {(editFormData.nota[0] || 0).toFixed(1)}/5.0
                                         </span>
                                         <span className="text-sm text-gray-500">5</span>
                                     </div>
                                    <Slider
                                        value={editFormData.nota}
                                        onValueChange={(value) => setEditFormData(prev => ({...prev, nota: value}))}
                                        max={5}
                                        min={0}
                                        step={0.1}
                                        className="w-full"
                                    />
                                    <div className={`p-2 rounded-lg text-center ${getNotaInfo(editFormData.nota[0] || 0).bgColor}`}>
                                        <h3 className={`font-bold text-md ${getNotaInfo(editFormData.nota[0] || 0).color}`}>
                                            {getNotaInfo(editFormData.nota[0] || 0).text}
                                        </h3>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <Label htmlFor="edit-descricao">Descrição</Label>
                                <Textarea
                                    id="edit-descricao"
                                    value={editFormData.descricao}
                                    onChange={(e) => setEditFormData(prev => ({...prev, descricao: e.target.value}))}
                                    rows={4}
                                    className="mt-1"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsEditModalOpen(false)} disabled={salvandoEdicao}>
                                Cancelar
                            </Button>
                            <Button onClick={handleSaveEdit} disabled={salvandoEdicao}>
                                {salvandoEdicao ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                        Salvando...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4 mr-2" />
                                        Salvar Alterações
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Modal de Reenvio de E-mail */}
                <ReenviarEmailModal
                    isOpen={isReenviarModalOpen}
                    onClose={() => {
                        setIsReenviarModalOpen(false);
                        setFeedbackParaReenviar(null); // Renamed state update
                    }}
                    onConfirm={confirmResendEmail}
                    feedback={feedbackParaReenviar} // Renamed prop, assuming ReenviarEmailModal component handles "feedback" as a prop name
                    isLoading={reenviandoEmailId === (feedbackParaReenviar ? feedbackParaReenviar.id : null)} // Renamed state and reference
                />
            </div>
        </div>
    );
}