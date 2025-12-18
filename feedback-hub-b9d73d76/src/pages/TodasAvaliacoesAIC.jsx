import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Filter, Calendar, XCircle, Search, Eye, Trash2, AlertTriangle, Send } from 'lucide-react';
import { format } from 'date-fns';
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
import { isAdminGlobal, isAdminSetorial, isAdminMultiSetor, canSendDrafts, filterAvaliacoesWithDrafts, canDelete } from "@/components/utils/permissoes";
import ReenviarEmailModal from '../components/feedback/ReenviarEmailModal';

const getNotaInfo = (nota) => {
    if (nota < 2) return { text: "Não atende", color: "text-red-600", bgColor: "bg-red-100" };
    if (nota < 3) return { text: "Atende abaixo", color: "text-orange-600", bgColor: "bg-orange-100" };
    if (nota < 4) return { text: "Atende", color: "text-yellow-600", bgColor: "bg-yellow-100" };
    if (nota < 5) return { text: "Supera parcialmente", color: "text-blue-600", bgColor: "bg-blue-100" };
    return { text: "Supera", color: "text-green-600", bgColor: "bg-green-100" };
};

export default function TodasAvaliacoesAIC() {
    const [currentUser, setCurrentUser] = useState(null);
    const [allUsers, setAllUsers] = useState([]);
    const [avaliacoes, setAvaliacoes] = useState([]);
    const [avaliacoesFiltradas, setAvaliacoesFiltradas] = useState([]);
    const [filtros, setFiltros] = useState({
        busca: "",
        dataInicio: "",
        dataFim: "",
    });

    const [excluindo, setExcluindo] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isReenviarModalOpen, setIsReenviarModalOpen] = useState(false);
    const [avaliacaoParaReenvio, setAvaliacaoParaReenvio] = useState(null);
    const [reenviandoEmailId, setReenviandoEmailId] = useState(null);

    const navigate = useNavigate();

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const user = await base44.auth.me();
            setCurrentUser(user);

            let relevantAvaliacoes = [];
            let usersForFilter = [];

            if (isAdminGlobal(user)) {
                relevantAvaliacoes = await base44.entities.Feedback.filter({ tipo_avaliacao: 'aic' }, "-created_date", 5000);
                usersForFilter = await base44.entities.User.list();
            }
            else if (isAdminMultiSetor(user)) {
                const allAvaliacoesFromDB = await base44.entities.Feedback.filter({ tipo_avaliacao: 'aic' }, "-created_date", 5000);
                usersForFilter = await base44.entities.User.list();
                relevantAvaliacoes = filterAvaliacoesWithDrafts(allAvaliacoesFromDB, user, usersForFilter);
            }
            else if (isAdminSetorial(user)) {
                const allAvaliacoesFromDB = await base44.entities.Feedback.filter({ tipo_avaliacao: 'aic' }, "-created_date", 5000);
                usersForFilter = await base44.entities.User.filter({ setor: user.setor });
                relevantAvaliacoes = filterAvaliacoesWithDrafts(allAvaliacoesFromDB, user, usersForFilter);
            }
            else if (user.cargo === 'gestor') {
                const allAvaliacoesFromDB = await base44.entities.Feedback.filter({ tipo_avaliacao: 'aic' }, "-created_date", 5000);
                usersForFilter = await base44.entities.User.list();
                relevantAvaliacoes = filterAvaliacoesWithDrafts(allAvaliacoesFromDB, user, usersForFilter);
            }
            else {
                const allAvaliacoesFromDB = await base44.entities.Feedback.filter({ tipo_avaliacao: 'aic' }, "-created_date", 5000);
                usersForFilter = [user];
                relevantAvaliacoes = filterAvaliacoesWithDrafts(allAvaliacoesFromDB, user, usersForFilter);
            }

            setAllUsers(usersForFilter);
            setAvaliacoes(relevantAvaliacoes);
        } catch (error) {
            console.error("Erro ao carregar dados:", error);
            alert("Erro ao carregar dados. Verifique a conexão ou tente novamente.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    const aplicarFiltros = useCallback(() => {
        let resultado = [...avaliacoes];

        if (filtros.busca) {
            const buscaLowerCase = filtros.busca.toLowerCase();
            resultado = resultado.filter(av =>
                av.remetente_nome?.toLowerCase().includes(buscaLowerCase) ||
                av.destinatario_nome?.toLowerCase().includes(buscaLowerCase)
            );
        }

        if (filtros.dataInicio) {
            resultado = resultado.filter(av => new Date(av.data_ocorrido) >= new Date(filtros.dataInicio));
        }
        if (filtros.dataFim) {
            resultado = resultado.filter(av => new Date(av.data_ocorrido) <= new Date(filtros.dataFim + "T23:59:59"));
        }

        setAvaliacoesFiltradas(resultado);
    }, [filtros, avaliacoes]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    useEffect(() => {
        aplicarFiltros();
    }, [filtros, avaliacoes, aplicarFiltros]);

    const handleFiltroChange = (campo, valor) => {
        setFiltros(prev => ({ ...prev, [campo]: valor }));
    };

    const limparFiltros = () => {
        setFiltros({ busca: "", dataInicio: "", dataFim: "" });
    };

    const handleDeleteAvaliacao = async (avaliacaoId) => {
        setExcluindo(true);
        try {
            await base44.entities.Feedback.delete(avaliacaoId);
            loadData();
        } catch (error) {
            console.error("Erro ao excluir avaliação:", error);
            alert("Erro ao excluir avaliação. Tente novamente.");
        } finally {
            setExcluindo(false);
        }
    };

    const openReenviarModal = (avaliacao) => {
        setAvaliacaoParaReenvio(avaliacao);
        setIsReenviarModalOpen(true);
    };

    const confirmResendEmail = async () => {
        if (!avaliacaoParaReenvio) return;

        setReenviandoEmailId(avaliacaoParaReenvio.id);
        await base44.entities.Feedback.update(avaliacaoParaReenvio.id, { status_email: 'pendente' });

        try {
            const destinatario = allUsers.find(u => u.email === avaliacaoParaReenvio.destinatario_email);
            const dataEnvio = new Date();
            const dataFormatadaEnvio = dataEnvio.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

            const htmlBody = `
                <!DOCTYPE html>
                <html lang="pt-BR">
                <head>
                  <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>Avaliação A.I.C Recebida (Reenvio)</title>
                  <style>
                    body { font-family: "Segoe UI", Arial, sans-serif; background-color: #f4f6f9; margin: 0; padding: 0; color: #333333; }
                    .container { max-width: 650px; margin: 30px auto; background: #ffffff; border-radius: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); overflow: hidden; }
                    .header { background: #000529; color: #ffffff; text-align: center; padding: 20px; }
                    .header h1 { margin: 0; font-size: 20px; font-weight: 600; }
                    .content { padding: 25px 30px; line-height: 1.6; }
                    .content h2 { color: #000529; font-size: 18px; margin-top: 24px; border-bottom: 2px solid #000529; padding-bottom: 8px; }
                    .feedback-box { background: #f9fafc; border-left: 4px solid #000529; padding: 15px; margin: 20px 0; border-radius: 4px; }
                    .feedback-box p { margin: 6px 0; }
                    .footer { text-align: center; font-size: 12px; color: #777777; padding: 20px; border-top: 1px solid #eeeeee; background: #fafafa; }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <div class="header"><h1>🟣 Nabarrete & Ferro Advogados Associados</h1></div>
                    <div class="content">
                      <p>Prezado(a) <strong>${destinatario?.full_name || 'Colaborador'}</strong>,</p>
                      <p>Você recebeu uma <strong>Avaliação A.I.C</strong> (Análise Individual do Colaborador). Este é um reenvio de uma notificação anterior.</p>
                      <h2>🔹 Detalhes da Avaliação</h2>
                      <div class="feedback-box">
                        <p><strong>• Avaliador:</strong> ${avaliacaoParaReenvio.remetente_nome}</p>
                        <p><strong>• Produtividade:</strong> ${avaliacaoParaReenvio.nota_produtividade}/5</p>
                        <p><strong>• Conduta Pessoal:</strong> ${avaliacaoParaReenvio.nota_conduta}/5</p>
                        <p><strong>• Engajamento:</strong> ${avaliacaoParaReenvio.nota_engajamento}/5</p>
                        <p><strong>• Média Final:</strong> ${avaliacaoParaReenvio.nota.toFixed(2)}/5 - ${avaliacaoParaReenvio.classificacao}</p>
                        <p><strong>• Data do Reenvio:</strong> ${dataFormatadaEnvio}</p>
                      </div>
                      <p>Esta avaliação foi registrada para acompanhamento do seu desenvolvimento profissional.</p>
                    </div>
                    <div class="footer">
                      Esta é uma mensagem automática. Por favor, não responda este e-mail.<br>
                      © ${new Date().getFullYear()} Nabarrete & Ferro Advogados Associados. Todos os direitos reservados.
                    </div>
                  </div>
                </body>
                </html>
            `;

            await base44.integrations.Core.SendEmail({
                from_name: "Nabarrete & Ferro Advogados",
                to: avaliacaoParaReenvio.destinatario_email,
                subject: `(Reenvio) Avaliação A.I.C Recebida - ${avaliacaoParaReenvio.classificacao}`,
                body: htmlBody
            });

            await base44.entities.Feedback.update(avaliacaoParaReenvio.id, { status_email: 'enviado', motivo_falha_email: null });
            alert("E-mail reenviado com sucesso!");
        } catch (emailError) {
            const errorMessage = emailError.message || "Erro desconhecido ao reenviar e-mail.";
            await base44.entities.Feedback.update(avaliacaoParaReenvio.id, { status_email: 'falha', motivo_falha_email: `Falha no reenvio: ${errorMessage}` });
            alert(`Falha ao reenviar e-mail: ${errorMessage}`);
        } finally {
            setReenviandoEmailId(null);
            setIsReenviarModalOpen(false);
            setAvaliacaoParaReenvio(null);
            loadData();
        }
    };

    const getEmailStatusBadge = (avaliacao) => {
        switch (avaliacao.status_email) {
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
                                    <p className="text-sm">{avaliacao.motivo_falha_email || 'Erro desconhecido.'}</p>
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
        ? 'Visualize suas avaliações A.I.C recebidas.'
        : currentUser.cargo === 'gestor'
        ? 'Visualize e gerencie todas as avaliações A.I.C do seu setor.'
        : 'Visualize e gerencie todas as avaliações A.I.C da empresa.';

    return (
        <div className="p-6 md:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
                        <FileText className="w-8 h-8 text-blue-600" />
                        Todas as Avaliações A.I.C
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">{pageDescription}</p>
                </div>

                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Filter className="w-5 h-5"/>Filtros de Pesquisa</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div>
                                <Label htmlFor="busca" className="flex items-center gap-2 mb-1"><Search className="w-4 h-4"/>Buscar por Nome</Label>
                                <Input
                                    id="busca"
                                    value={filtros.busca}
                                    onChange={e => handleFiltroChange("busca", e.target.value)}
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
                        </div>
                        <Button variant="outline" onClick={limparFiltros}>
                            <XCircle className="w-4 h-4 mr-2"/>
                            Limpar Filtros
                        </Button>
                    </CardContent>
                    <CardFooter className="flex justify-between items-center">
                        <p className="text-sm text-gray-500">{avaliacoesFiltradas.length} resultados encontrados.</p>
                    </CardFooter>
                </Card>

                <div className="space-y-6">
                    {avaliacoesFiltradas.length > 0 ? (
                        avaliacoesFiltradas.map(avaliacao => {
                            const notaInfo = getNotaInfo(avaliacao.nota);
                            const userCanSendDraft = canSendDrafts(currentUser, avaliacao, allUsers);

                            return (
                                <Card key={avaliacao.id} className="shadow-md hover:shadow-lg transition-shadow">
                                    <CardHeader>
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <CardTitle className="text-xl flex items-center gap-2">
                                                    Avaliação A.I.C
                                                    {avaliacao.status_avaliacao === 'Rascunho' && (
                                                        <Badge variant="outline" className="border-yellow-300 text-yellow-600 bg-yellow-50">
                                                            Rascunho
                                                        </Badge>
                                                    )}
                                                </CardTitle>
                                                <div className="mt-2 text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                                    {currentUser.cargo !== 'usuario' && (
                                                        <p>De: <span className="font-medium text-gray-800 dark:text-gray-200">{avaliacao.remetente_nome}</span></p>
                                                    )}
                                                    <p>Para: <span className="font-medium text-gray-800 dark:text-gray-200">{avaliacao.destinatario_nome}</span></p>
                                                    <p>Setor: <span className="font-medium text-gray-800 dark:text-gray-200">{avaliacao.destinatario_setor || 'N/A'}</span></p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {avaliacao.status_avaliacao !== 'Rascunho' && getEmailStatusBadge(avaliacao)}
                                                <Badge className={`${notaInfo.bgColor} ${notaInfo.color} border-none`}>
                                                    {avaliacao.nota?.toFixed(1)} - {notaInfo.text}
                                                </Badge>
                                                <div className="flex gap-1">
                                                    {avaliacao.status_avaliacao !== 'Rascunho' && avaliacao.status_email === 'falha' && (currentUser.cargo === "administrador" || currentUser.cargo === "gestor") && (
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            onClick={() => openReenviarModal(avaliacao)}
                                                            disabled={reenviandoEmailId === avaliacao.id}
                                                            className="h-8 w-8 text-blue-600 border-blue-200 hover:bg-blue-50"
                                                            title="Reenviar E-mail"
                                                        >
                                                            {reenviandoEmailId === avaliacao.id ? (
                                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                                                            ) : (
                                                                <Send className="w-4 h-4" />
                                                            )}
                                                        </Button>
                                                    )}
                                                    <Link to={createPageUrl(`AvaliacaoAIC?id=${avaliacao.id}`)}>
                                                        <Button variant="outline" size="icon" className="h-8 w-8">
                                                            <Eye className="w-4 h-4" />
                                                        </Button>
                                                    </Link>
                                                    {canDelete(currentUser) && (currentUser.cargo === "administrador" || (avaliacao.status_avaliacao === 'Rascunho' && avaliacao.remetente_email === currentUser.email)) && (
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <Button variant="outline" size="icon" className="h-8 w-8 text-red-600 hover:bg-red-50" disabled={excluindo}>
                                                                    <Trash2 className="w-4 h-4" />
                                                                </Button>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                                                    <AlertDialogDescription>
                                                                        Tem certeza de que deseja excluir esta avaliação A.I.C? Esta ação não pode ser desfeita.
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                                    <AlertDialogAction onClick={() => handleDeleteAvaliacao(avaliacao.id)} className="bg-red-600 hover:bg-red-700" disabled={excluindo}>
                                                                        {excluindo ? "Excluindo..." : "Excluir"}
                                                                    </AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-3 gap-4 text-sm">
                                            <div>
                                                <p className="text-gray-500">Produtividade</p>
                                                <p className="text-lg font-semibold text-blue-600">{avaliacao.nota_produtividade}/5</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">Conduta Pessoal</p>
                                                <p className="text-lg font-semibold text-gray-700">{avaliacao.nota_conduta}/5</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">Engajamento</p>
                                                <p className="text-lg font-semibold text-gray-700">{avaliacao.nota_engajamento}/5</p>
                                            </div>
                                        </div>
                                        {avaliacao.observacoes && (
                                            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Observações:</p>
                                                <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{avaliacao.observacoes}</p>
                                            </div>
                                        )}
                                    </CardContent>
                                    <CardFooter className="flex justify-between items-center">
                                        <p className="text-xs text-gray-500">
                                            Avaliada em: {format(new Date(avaliacao.data_ocorrido), "dd/MM/yyyy 'às' HH:mm")}
                                        </p>
                                        {avaliacao.registrado_por_cargo && (
                                            <Badge variant="outline" className="capitalize font-normal">
                                                Registrado por: {avaliacao.registrado_por_cargo}
                                            </Badge>
                                        )}
                                    </CardFooter>
                                </Card>
                            );
                        })
                    ) : (
                        <div className="text-center py-16 text-gray-500">
                            <FileText className="w-12 h-12 mx-auto mb-4"/>
                            <h3 className="text-lg font-semibold">Nenhuma avaliação A.I.C encontrada</h3>
                            <p>Tente ajustar os filtros ou aguarde por novas avaliações.</p>
                        </div>
                    )}
                </div>

                <ReenviarEmailModal
                    isOpen={isReenviarModalOpen}
                    onClose={() => {
                        setIsReenviarModalOpen(false);
                        setAvaliacaoParaReenvio(null);
                    }}
                    onConfirm={confirmResendEmail}
                    feedback={avaliacaoParaReenvio}
                    isLoading={reenviandoEmailId === (avaliacaoParaReenvio ? avaliacaoParaReenvio.id : null)}
                />
            </div>
        </div>
    );
}