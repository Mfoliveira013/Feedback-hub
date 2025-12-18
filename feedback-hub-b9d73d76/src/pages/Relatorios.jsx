
import React, { useState, useEffect, useCallback } from "react";
import { User } from "@/api/entities";
import { Feedback } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Download, Filter, FileText, Calendar, Edit, Trash2, Save } from "lucide-react";
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
import MultiSelectFilter from "@/components/ui/MultiSelectFilter";
import { isAdminGlobal, isAdminSetorial, filterFeedbacksByPermission } from "@/components/utils/permissoes";

const getClassificationStyle = (classification) => {
    switch (classification) {
        case "Não atende": return "bg-red-100 text-red-800 border-red-200";
        case "Atende abaixo": return "bg-orange-100 text-orange-800 border-orange-200";
        case "Atende": return "bg-yellow-100 text-yellow-800 border-yellow-200";
        case "Supera parcialmente": return "bg-blue-100 text-blue-800 border-blue-200";
        case "Supera": return "bg-green-100 text-green-800 border-green-200";
        // Old values mapping
        case "ruim": return "bg-red-100 text-red-800 border-red-200";
        case "media": return "bg-yellow-100 text-yellow-800 border-yellow-200";
        case "boa": return "bg-green-100 text-green-800 border-green-200";
        default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
};

const mapOldToNewClassification = (c) => {
    if (c === 'ruim') return 'Não atende';
    if (c === 'media') return 'Atende';
    if (c === 'boa') return 'Supera';
    return c;
};

const tipoAvaliacaoLabels = {
    feedback: "Feedback",
    avaliacao_pontual: "Avaliação Pontual",
    avaliacao_periodica: "Avaliação Periódica",
    aic: "Avaliação A.I.C."
};

const tipoAvaliacaoOptions = [
    { value: "feedback", label: "Feedback" },
    { value: "avaliacao_pontual", label: "Avaliação Pontual" },
    { value: "avaliacao_periodica", label: "Avaliação Periódica" },
    { value: "aic", label: "Avaliação A.I.C." },
];

const classificacaoOptions = [
    { value: "Não atende", label: "Não atende" },
    { value: "Atende abaixo", label: "Atende abaixo" },
    { value: "Atende", label: "Atende" },
    { value: "Supera parcialmente", label: "Supera parcialmente" },
    { value: "Supera", label: "Supera" },
];

// Define options for titles, used in edit modal
const tituloOptions = [
    { value: "Desenvolvimento", label: "Desenvolvimento" },
    { value: "Recuperação", label: "Recuperação" },
    { value: "Treinamento", label: "Treinamento" },
    { value: "Integração", label: "Integração" },
    { value: "Advertência Comportamental", label: "Advertência Comportamental" },
    { value: "Advertência Operacional", label: "Advertência Operacional" },
    { value: "Rescisão", label: "Rescisão" },
];

export default function Relatorios() {
    const [currentUser, setCurrentUser] = useState(null);
    const [feedbacks, setFeedbacks] = useState([]);
    const [feedbacksFiltrados, setFeedbacksFiltrados] = useState([]);
    const [usuarios, setUsuarios] = useState([]);
    const [filtros, setFiltros] = useState({
        dataInicio: "",
        dataFim: "",
        usuario: [], // Changed to array
        classificacao: [], // Changed to array
        tipo_avaliacao: [] // Changed to array
    });
    const [exportando, setExportando] = useState(false);

    // Estados para edição
    const [feedbackEditando, setFeedbackEditando] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editFormData, setEditFormData] = useState({
        titulo: [], // Changed to array to support multiple titles
        descricao: ""
    });
    const [salvandoEdicao, setSalvandoEdicao] = useState(false);

    // Estados para exclusão
    const [excluindoFeedback, setExcluindoFeedback] = useState(false);

    const loadData = async () => {
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
                const allFeedbacks = await Feedback.list("-created_date", 5000);
                usersForFilter = await User.filter({ setor: user.setor });
                relevantFeedbacks = filterFeedbacksByPermission(allFeedbacks, user, usersForFilter);
            }
            // Gestor: feedbacks da equipe
            else if (user.cargo === 'gestor') {
                const teamUsers = await User.filter({ gestores_responsaveis: user.email });
                const teamAndManager = [user, ...teamUsers];
                usersForFilter = teamAndManager;
                const teamEmails = teamAndManager.map(u => u.email);

                const allFeedbacks = await Feedback.list("-created_date", 5000);
                relevantFeedbacks = allFeedbacks.filter(f =>
                    teamEmails.includes(f.destinatario_email) ||
                    teamEmails.includes(f.remetente_email)
                );
            }
            // Usuário comum: apenas seus feedbacks
            else {
                relevantFeedbacks = await Feedback.filter({ destinatario_email: user.email }, "-created_date");
                usersForFilter = [user];
            }
            
            setUsuarios(usersForFilter);
            setFeedbacks(relevantFeedbacks);

        } catch (error) {
            console.error("Erro ao carregar dados:", error);
        }
    };

    const aplicarFiltros = useCallback(() => {
        let resultado = [...feedbacks];

        // Filtro por data (usando data_ocorrido)
        if (filtros.dataInicio) {
            resultado = resultado.filter(f =>
                new Date(f.data_ocorrido) >= new Date(filtros.dataInicio)
            );
        }

        if (filtros.dataFim) {
            resultado = resultado.filter(f =>
                new Date(f.data_ocorrido) <= new Date(filtros.dataFim + "T23:59:59")
            );
        }

        // Filtro por usuário - Updated for multi-select
        if (filtros.usuario.length > 0) {
            resultado = resultado.filter(f =>
                filtros.usuario.includes(f.destinatario_email) ||
                filtros.usuario.includes(f.remetente_email)
            );
        }

        // Filtro por classificação - Updated for multi-select
        if (filtros.classificacao.length > 0) {
            resultado = resultado.filter(f => filtros.classificacao.includes(mapOldToNewClassification(f.classificacao)));
        }

        // Novo filtro por tipo de avaliação - Updated for multi-select
        if (filtros.tipo_avaliacao.length > 0) {
            resultado = resultado.filter(f => filtros.tipo_avaliacao.includes(f.tipo_avaliacao || 'feedback'));
        }

        setFeedbacksFiltrados(resultado);
    }, [filtros, feedbacks]);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        aplicarFiltros();
    }, [aplicarFiltros]);

    const handleFiltroChange = (campo, valor) => {
        setFiltros(prev => ({
            ...prev,
            [campo]: valor
        }));
    };

    const limparFiltros = () => {
        setFiltros({
            dataInicio: "",
            dataFim: "",
            usuario: [],
            classificacao: [],
            tipo_avaliacao: []
        });
    };

    const handleEditFeedback = (feedback) => {
        setFeedbackEditando(feedback);
        setEditFormData({
            titulo: Array.isArray(feedback.titulo) ? feedback.titulo : (feedback.titulo ? [feedback.titulo] : []),
            descricao: feedback.descricao
        });
        setIsEditModalOpen(true);
    };

    const handleSaveEdit = async () => {
        if (!editFormData.titulo.length || !editFormData.descricao) { // Changed condition for array
            alert("Por favor, preencha o título e a descrição.");
            return;
        }

        setSalvandoEdicao(true);
        try {
            await Feedback.update(feedbackEditando.id, {
                titulo: editFormData.titulo,
                descricao: editFormData.descricao
            });

            setIsEditModalOpen(false);
            setFeedbackEditando(null);
            loadData(); // Recarrega os dados
        } catch (error) {
            console.error("Erro ao editar avaliação:", error);
            alert("Erro ao salvar alterações. Tente novamente.");
        }
        setSalvandoEdicao(false);
    };

    const handleDeleteFeedback = async (feedbackId) => {
        setExcluindoFeedback(true);
        try {
            await Feedback.delete(feedbackId);
            loadData(); // Recarrega os dados
        } catch (error) {
            console.error("Erro ao excluir avaliação:", error);
            alert("Erro ao excluir avaliação. Tente novamente.");
        } finally {
            setExcluindoFeedback(false);
        }
    };

    const exportarExcel = async () => {
        setExportando(true);
        try {
            // Preparar dados para exportação
            const dadosExportacao = feedbacksFiltrados.map(feedback => ({
                "Data Ocorrido": format(new Date(feedback.data_ocorrido), "dd/MM/yyyy HH:mm"),
                "Tipo": tipoAvaliacaoLabels[feedback.tipo_avaliacao || 'feedback'] || "Feedback",
                "Título": Array.isArray(feedback.titulo) ? feedback.titulo.join('; ') : feedback.titulo, // Join titles for export
                "De": feedback.remetente_nome,
                "Para": feedback.destinatario_nome,
                "Classificação": mapOldToNewClassification(feedback.classificacao),
                "Nota": feedback.nota,
                "Descrição": feedback.descricao,
                "É Retroativo": feedback.retroativo ? "Sim" : "Não",
                "Registrado por": feedback.registrado_por_cargo
            }));

            // Converter para CSV
            const headers = Object.keys(dadosExportacao[0] || {});
            const csvContent = [
                headers.join(','),
                ...dadosExportacao.map(row =>
                    headers.map(header => `"${(row[header] || '').toString().replace(/"/g, '""')}"`).join(',')
                )
            ].join('\n');

            // Criar e baixar arquivo
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `relatorio-avaliacoes-${format(new Date(), "dd-MM-yyyy")}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error("Erro ao exportar:", error);
            alert("Erro ao exportar relatório. Tente novamente.");
        }
        setExportando(false);
    };

    if (!currentUser) {
        return <div className="p-8">Carregando...</div>;
    }

    return (
        <div className="p-6 md:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
                        <FileText className="w-8 h-8 text-blue-600" />
                        Relatórios de Avaliação
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Visualize e exporte dados de avaliações com filtros personalizados.
                    </p>
                </div>

                {/* Filtros */}
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Filter className="w-5 h-5" />
                            Filtros de Pesquisa
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
                            <div>
                                <Label htmlFor="dataInicio" className="flex items-center gap-2 mb-1">
                                    <Calendar className="w-4 h-4" />
                                    Data Início
                                </Label>
                                <Input
                                    id="dataInicio"
                                    type="date"
                                    value={filtros.dataInicio}
                                    onChange={(e) => handleFiltroChange("dataInicio", e.target.value)}
                                />
                            </div>

                            <div>
                                <Label htmlFor="dataFim" className="flex items-center gap-2 mb-1">
                                    <Calendar className="w-4 h-4" />
                                    Data Fim
                                </Label>
                                <Input
                                    id="dataFim"
                                    type="date"
                                    value={filtros.dataFim}
                                    onChange={(e) => handleFiltroChange("dataFim", e.target.value)}
                                />
                            </div>

                            <div>
                                <Label className="mb-1 block">Tipo da Avaliação</Label>
                                <MultiSelectFilter
                                    title="Selecionar Tipos"
                                    placeholder="Todos os tipos"
                                    options={tipoAvaliacaoOptions}
                                    selectedValues={filtros.tipo_avaliacao}
                                    onSelectionChange={(selected) => handleFiltroChange("tipo_avaliacao", selected)}
                                />
                            </div>

                            <div>
                                <Label className="mb-1 block">Usuário</Label>
                                 <MultiSelectFilter
                                    title="Selecionar Usuários"
                                    placeholder="Todos os usuários"
                                    options={usuarios.map(u => ({ value: u.email, label: u.full_name || u.email }))}
                                    selectedValues={filtros.usuario}
                                    onSelectionChange={(selected) => handleFiltroChange("usuario", selected)}
                                />
                            </div>

                            <div>
                                <Label className="mb-1 block">Classificação</Label>
                                <MultiSelectFilter
                                    title="Selecionar Classificações"
                                    placeholder="Todas as classificações"
                                    options={classificacaoOptions}
                                    selectedValues={filtros.classificacao}
                                    onSelectionChange={(selected) => handleFiltroChange("classificacao", selected)}
                                />
                            </div>
                        </div>

                        <div className="flex justify-between items-center">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {feedbacksFiltrados.length} resultado{feedbacksFiltrados.length !== 1 ? "s" : ""} encontrado{feedbacksFiltrados.length !== 1 ? "s" : ""}
                            </p>
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={limparFiltros}>
                                    Limpar Filtros
                                </Button>
                                <Button
                                    onClick={exportarExcel}
                                    disabled={feedbacksFiltrados.length === 0 || exportando}
                                    className="bg-green-600 hover:bg-green-700"
                                >
                                    {exportando ? (
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
                        </div>
                    </CardContent>
                </Card>

                {/* Tabela de Resultados */}
                <Card>
                    <CardHeader>
                        <CardTitle>Resultados da Pesquisa</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Data do Ocorrido</TableHead>
                                        <TableHead>Tipo</TableHead>
                                        <TableHead>Título</TableHead>
                                        <TableHead>De</TableHead>
                                        <TableHead>Para</TableHead>
                                        <TableHead>Classificação</TableHead>
                                        <TableHead>Descrição</TableHead>
                                        <TableHead>Registrado por</TableHead>
                                        {(isAdminGlobal(currentUser) || isAdminSetorial(currentUser)) && ( // Only admins can edit/delete
                                            <TableHead>Ações</TableHead>
                                        )}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {feedbacksFiltrados.map((feedback) => (
                                        <TableRow key={feedback.id}>
                                            <TableCell>
                                                {format(new Date(feedback.data_ocorrido), "dd/MM/yyyy HH:mm")}
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {tipoAvaliacaoLabels[feedback.tipo_avaliacao || 'feedback'] || 'Feedback'}
                                            </TableCell>
                                            <TableCell className="font-medium flex items-center gap-2">
                                                <div className="truncate" title={Array.isArray(feedback.titulo) ? feedback.titulo.join(', ') : feedback.titulo}>
                                                    {Array.isArray(feedback.titulo) ? feedback.titulo.join(', ') : feedback.titulo}
                                                </div>
                                                {feedback.retroativo && <Badge variant="secondary">Retroativo</Badge>}
                                            </TableCell>
                                            <TableCell>
                                                {feedback.remetente_nome}
                                            </TableCell>
                                            <TableCell>
                                                {feedback.destinatario_nome}
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={getClassificationStyle(mapOldToNewClassification(feedback.classificacao))}>
                                                    {mapOldToNewClassification(feedback.classificacao)} ({feedback.nota}/5)
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="max-w-xs">
                                                <div className="truncate" title={feedback.descricao}>
                                                    {feedback.descricao}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {feedback.registrado_por_cargo && (
                                                    <Badge variant="outline" className="capitalize font-normal">
                                                        {feedback.registrado_por_cargo}
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            {(isAdminGlobal(currentUser) || isAdminSetorial(currentUser)) && ( // Only admins can edit/delete
                                                <TableCell>
                                                    <div className="flex gap-1">
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            onClick={() => handleEditFeedback(feedback)}
                                                            className="h-8 w-8"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </Button>
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <Button
                                                                    variant="outline"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-red-600 hover:text-red-700"
                                                                    disabled={excluindoFeedback}
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </Button>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                                                    <AlertDialogDescription>
                                                                        Tem certeza de que deseja excluir esta avaliação? Esta ação não pode ser desfeita.
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel disabled={excluindoFeedback}>Cancelar</AlertDialogCancel>
                                                                    <AlertDialogAction
                                                                        onClick={() => handleDeleteFeedback(feedback.id)}
                                                                        className="bg-red-600 hover:bg-red-700"
                                                                        disabled={excluindoFeedback}
                                                                    >
                                                                        {excluindoFeedback ? "Excluindo..." : "Excluir"}
                                                                    </AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    </div>
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {feedbacksFiltrados.length === 0 && (
                            <div className="text-center py-12">
                                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                    Nenhum resultado encontrado
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400">
                                    Tente ajustar os filtros para encontrar as avaliações desejadas.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Modal de Edição */}
                <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Editar Avaliação</DialogTitle>
                            <DialogDescription>
                                Altere o título e a descrição. A classificação está vinculada à nota e não pode ser editada diretamente.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="edit-titulo">Título</Label>
                                <MultiSelectFilter // Replaced Select with MultiSelectFilter
                                    title="Selecionar Títulos"
                                    placeholder="Todos os títulos"
                                    options={tituloOptions}
                                    selectedValues={editFormData.titulo}
                                    onSelectionChange={(selected) => setEditFormData(prev => ({...prev, titulo: selected}))}
                                />
                            </div>
                            <div>
                                <Label htmlFor="edit-descricao">Descrição</Label>
                                <Textarea
                                    id="edit-descricao"
                                    value={editFormData.descricao}
                                    onChange={(e) => setEditFormData(prev => ({...prev, descricao: e.target.value}))}
                                    rows={4}
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
            </div>
        </div>
    );
}
