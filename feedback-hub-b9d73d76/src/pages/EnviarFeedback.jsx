
import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert"; // Kept for existing UI
import { Send, Star, User as UserIcon, Building, Briefcase, Calendar, AlertCircle, CheckCircle2, FileText, XCircle, Clock, Save } from "lucide-react"; // Combined and updated icons
import { toast } from "sonner";
import MultiSelectFilter from "@/components/ui/MultiSelectFilter";
import FileUploadSection from "@/components/feedback/FileUploadSection";
import { isAdminGlobal, isAdminSetorial, isAdminMultiSetor, getAdminSetores, isGestorAcessoTodosSetores } from "@/components/utils/permissoes";

const setores = ["RH", "Controldesk", "Controladoria", "M.I.S", "Extra", "Acordo Jud", "Contencioso", "Focais", "Filiais", "Iniciais", "Adm", "Contrárias", "Tecnologia", "Recuperação Judicial"];

const getNotaInfo = (nota) => {
    if (nota < 2) return { text: "Não atende", color: "text-red-600", bgColor: "bg-red-100", borderColor: "border-red-500" };
    if (nota < 3) return { text: "Atende abaixo", color: "text-orange-600", bgColor: "bg-orange-100", borderColor: "border-orange-500" };
    if (nota < 4) return { text: "Atende", color: "text-yellow-600", bgColor: "bg-yellow-100", borderColor: "border-yellow-500" };
    if (nota < 5) return { text: "Supera parcialmente", color: "text-blue-600", bgColor: "bg-blue-100", borderColor: "border-blue-500" };
    return { text: "Supera", color: "text-green-600", bgColor: "bg-green-100", borderColor: "border-green-500" };
};

const titulosPorTipo = {
    feedback: [
        { value: "Desenvolvimento", label: "Desenvolvimento" },
        { value: "Recuperação", label: "Recuperação" },
        { value: "Treinamento", label: "Treinamento" },
        { value: "Integração", label: "Integração" },
        { value: "Advertência Comportamental", label: "Advertência Comportamental" },
        { value: "Advertência Operacional", label: "Advertência Operacional" },
        { value: "Rescisão", label: "Rescisão" }
    ],
    avaliacao_pontual: [
        { value: "Produtividade", label: "Produtividade" },
        { value: "Conduta Pessoal", label: "Conduta Pessoal" },
        { value: "Engajamento", label: "Engajamento" }
    ],
    avaliacao_periodica: [
        { value: "Produtividade", label: "Produtividade" },
        { value: "Conduta Pessoal", label: "Conduta Pessoal" },
        { value: "Engajamento", label: "Engajamento" }
    ]
};

export default function EnviarFeedback() {
    const [currentUser, setCurrentUser] = useState(null);
    const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(false);
    const [sucesso, setSucesso] = useState(false);
    const [avisoEmail, setAvisoEmail] = useState("");
    const [formData, setFormData] = useState({
        setor: "",
        colaborador_email: "",
        cargo: "",
        funcao: "",
        tipo_avaliacao: "",
        titulo: [],
        nota: [3],
        descricao: "",
        arquivos: [],
        anonimo: false
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const user = await base44.auth.me();
            setCurrentUser(user);
            let selectableUsers = [];

            // Admin Global: todos os usuários
            if (isAdminGlobal(user)) {
                selectableUsers = await base44.entities.User.list();
            }
            // Admin Multi-Setorial: usuários dos seus setores
            else if (isAdminMultiSetor(user)) {
                selectableUsers = await base44.entities.User.list();
                const setoresPermitidos = getAdminSetores(user);
                selectableUsers = selectableUsers.filter(u => setoresPermitidos.includes(u.setor));
            }
            // Admin Setorial: apenas usuários do seu setor
            else if (isAdminSetorial(user)) {
                selectableUsers = await base44.entities.User.list();
                selectableUsers = selectableUsers.filter(u => u.setor === user.setor);
            }
            // Gestor com acesso a todos os setores: extrair de feedbacks
            else if (isGestorAcessoTodosSetores(user)) {
                const allFeedbacks = await base44.entities.Feedback.list("-created_date"); // Fetch feedbacks ordered by creation date
                const uniqueEmails = new Set();
                
                allFeedbacks.forEach(f => {
                    if (f.destinatario_email) uniqueEmails.add(f.destinatario_email);
                    if (f.remetente_email && f.remetente_email !== "anonimo@empresa.com") uniqueEmails.add(f.remetente_email); // Exclude anonymous sender placeholder
                });
                
                selectableUsers = Array.from(uniqueEmails).map(email => {
                    // Try to find the most recent feedback where this email was the recipient or sender to get associated data
                    const feedbackRecebido = allFeedbacks.find(f => f.destinatario_email === email);
                    const feedbackEnviado = allFeedbacks.find(f => f.remetente_email === email);
                    
                    return {
                        email: email,
                        full_name: feedbackRecebido?.destinatario_nome || feedbackEnviado?.remetente_nome || email.split('@')[0],
                        setor: feedbackRecebido?.setor || feedbackEnviado?.setor, // Use 'setor' from feedback record
                        cargo: feedbackRecebido?.cargo_colaborador || feedbackEnviado?.registrado_por_cargo || 'Usuário',
                        funcao: feedbackRecebido?.funcao || '',
                        gestores_responsaveis: [] // Not directly available from feedback, but required by type
                    };
                });
            }
            // Gestor: apenas sua equipe (usando filter ao invés de list)
            else if (user.cargo === 'gestor') {
                try {
                    const teamUsers = await base44.entities.User.filter({ gestores_responsaveis: user.email });
                    selectableUsers = [...teamUsers];
                } catch (error) {
                    console.error("Erro ao buscar equipe do gestor:", error);
                    selectableUsers = [];
                }
            }
            // Usuário comum: nenhum usuário (não pode enviar avaliações)
            else {
                selectableUsers = [];
            }
            
            // Remove o próprio usuário da lista de selecionáveis
            setUsuarios(selectableUsers.filter(u => u.email !== user.email));

            // Se não for admin global ou multi-setorial, nem gestor de todos os setores, e tiver setor, pré-selecionar o setor do usuário
            if (!isAdminGlobal(user) && !isAdminMultiSetor(user) && !isGestorAcessoTodosSetores(user) && user.setor) {
                setFormData(prev => ({ ...prev, setor: user.setor }));
            }

        } catch (error) {
            console.error("Erro crítico ao carregar dados:", error);
            toast.error("Falha ao carregar dados dos usuários.");
        }
    };
    
    // Determinar quais setores mostrar no dropdown
    const setoresDisponiveis = useMemo(() => {
        if (!currentUser) return [];

        // Admin Global: todos os setores
        if (isAdminGlobal(currentUser)) {
            return setores;
        }
        
        // Admin Multi-Setorial: apenas os setores permitidos
        if (isAdminMultiSetor(currentUser)) {
            return getAdminSetores(currentUser);
        }

        // NOVO: Gestores com acesso a todos os setores (Priscilla e Vinicius)
        if (isGestorAcessoTodosSetores(currentUser)) {
            // For these users, we need to list all sectors that *any* user is in, rather than predefined ones
            // If we have users loaded from feedback, get sectors from them. Otherwise, default to all known sectors.
            const uniqueSetoresFromUsers = new Set(usuarios.map(u => u.setor).filter(Boolean));
            return uniqueSetoresFromUsers.size > 0 ? Array.from(uniqueSetoresFromUsers).sort() : setores;
        }
        
        // Admin Setorial ou Gestor: apenas seu setor
        if (isAdminSetorial(currentUser) || currentUser.cargo === 'gestor') {
            return currentUser.setor ? [currentUser.setor] : [];
        }
        
        // For other roles, it depends on if they are meant to interact with this form at all
        // Given that `loadData` filters `selectableUsers` to empty for common users,
        // they likely shouldn't be selecting a sector. However, the current code
        // implies that if not global/setorial/gestor, all sectors are visible.
        // We will default to all sectors for now, but the `loadData` user filtering
        // will prevent them from selecting a collaborator.
        return setores;
    }, [currentUser, usuarios]);

    const usuariosDoSetor = useMemo(() => {
        if (!formData.setor) return [];
        return usuarios.filter(u => u.setor === formData.setor);
    }, [formData.setor, usuarios]);

    const handleInputChange = (field, value) => {
        const newFormData = { ...formData, [field]: value };
        
        if (field === 'setor') {
             newFormData.colaborador_email = '';
             newFormData.cargo = '';
             newFormData.funcao = '';
        }
        
        if (field === 'colaborador_email') {
            const user = usuarios.find(u => u.email === value);
            newFormData.cargo = user?.cargo || '';
            newFormData.funcao = user?.funcao || '';
            // If the user's sector isn't already set, or if it changed, update it.
            // This is especially relevant for GestorAcessoTodosSetores where user sectors might come from feedbacks.
            if (user?.setor && newFormData.setor !== user.setor) {
                newFormData.setor = user.setor;
            }
        }

        if (field === "tipo_avaliacao") {
            newFormData.titulo = []; // Reset titulo when tipo_avaliacao changes
        }
        setFormData(newFormData);
    };

    const criarTemplateEmail = (destinatario, feedback) => {
        const dataAtual = new Date();
        const dataFormatada = dataAtual.toLocaleString('pt-BR', {
            day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });

        const notaInfoForEmail = getNotaInfo(feedback.nota);

        // Função para formatar o texto da descrição preservando formatação
        const formatarDescricao = (texto) => {
            if (!texto) return '';
            
            return texto
                .split('\n')
                .map(linha => {
                    // Detecta linhas com marcadores
                    if (linha.trim().startsWith('•')) {
                        return `<li style="margin: 8px 0; line-height: 1.6;">${linha.trim().substring(1).trim()}</li>`;
                    }
                    // Detecta títulos (palavras seguidas de ":")
                    if (linha.trim().match(/^[A-Za-zÀ-ÿ\s]+:$/)) {
                        return `<p style="margin: 16px 0 8px 0;"><strong style="font-size: 15px; color: #000529;">${linha.trim()}</strong></p>`;
                    }
                    // Detecta linhas vazias (preserva espaçamento)
                    if (linha.trim() === '') {
                        return '<br>';
                    }
                    // Linhas normais
                    return `<p style="margin: 8px 0; line-height: 1.6;">${linha.trim()}</p>`;
                })
                .join('');
        };

        const descricaoFormatada = formatarDescricao(feedback.descricao);

        // Adiciona seção de anexos se houver arquivos
        const anexosHTML = feedback.arquivos_anexados && feedback.arquivos_anexados.length > 0 ? `
            <h2 style="color: #000529; font-size: 18px; margin-top: 24px; border-bottom: 2px solid #000529; padding-bottom: 8px;">📎 Arquivos Anexados</h2>
            <div style="background: #f9fafc; border-left: 4px solid #000529; padding: 15px; margin: 20px 0; border-radius: 4px;">
                ${feedback.arquivos_anexados.map((arquivo, index) => `
                    <p style="margin: 6px 0;"><strong>Anexo ${index + 1}:</strong> <a href="${arquivo.url}" target="_blank" style="color: #000529; text-decoration: underline;">${arquivo.nome}</a> (${(arquivo.tamanho / 1024).toFixed(2)} KB)</p>
                `).join('')}
            </div>
        ` : '';

        const htmlBody = `
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Nova Avaliação Recebida</title>
              <style>
                body { font-family: "Segoe UI", Arial, sans-serif; background-color: #f4f6f9; margin: 0; padding: 0; color: #333333; }
                .container { max-width: 650px; margin: 30px auto; background: #ffffff; border-radius: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); overflow: hidden; }
                .header { background: #000529; color: #ffffff; text-align: center; padding: 20px; }
                .header h1 { margin: 0; font-size: 20px; font-weight: 600; }
                .content { padding: 25px 30px; line-height: 1.6; }
                .content h2 { color: #000529; font-size: 18px; margin-top: 24px; border-bottom: 2px solid #000529; padding-bottom: 8px; }
                .feedback-box { background: #f9fafc; border-left: 4px solid #000529; padding: 15px; margin: 20px 0; border-radius: 4px; }
                .feedback-box p { margin: 6px 0; }
                .descricao-box { background: #ffffff; border: 1px solid #e0e0e0; padding: 20px; margin: 20px 0; border-radius: 6px; }
                .descricao-box ul { list-style: none; padding-left: 0; margin: 12px 0; }
                .footer { text-align: center; font-size: 12px; color: #777777; padding: 20px; border-top: 1px solid #eeeeee; background: #fafafa; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🟣 Nabarrete & Ferro Advogados Associados</h1>
                </div>
                <div class="content">
                  <p>Prezado(a) <strong>${destinatario.full_name || 'Colaborador'}</strong>,</p>
                  <p>Você recebeu uma nova avaliação registrada em nosso sistema interno.</p>
                  
                  <h2>🔹 Detalhes da Avaliação</h2>
                  <div class="feedback-box">
                    ${feedback.anonimo ? '<p><strong>⚠️ Esta avaliação foi enviada anonimamente</strong></p>' : `<p><strong>• Avaliador:</strong> ${feedback.remetente_nome}</p>`}
                    <p><strong>• Tipo:</strong> ${feedback.tipo_avaliacao ? feedback.tipo_avaliacao.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Feedback'}</p>
                    <p><strong>• Título:</strong> ${Array.isArray(feedback.titulo) ? feedback.titulo.join(', ') : feedback.titulo}</p>
                    <p><strong>• Classificação:</strong> ${notaInfoForEmail.text} (${feedback.nota} / 5)</p>
                    <p><strong>• Setor:</strong> ${feedback.setor || 'N/D'}</p>
                    <p><strong>• Cargo:</strong> ${feedback.cargo_colaborador || 'N/D'}</p>
                    <p><strong>• Função:</strong> ${feedback.funcao || 'N/D'}</p>
                    <p><strong>• Data:</strong> ${dataFormatada}</p>
                  </div>
                  
                  <h2>📄 Descrição da Avaliação</h2>
                  <div class="descricao-box">
                    ${descricaoFormatada}
                  </div>
                  
                  ${anexosHTML}
                  
                  <p style="margin-top: 24px; padding: 12px; background: #e8f4f8; border-left: 4px solid #0288d1; border-radius: 4px;">
                    <strong>ℹ️ Informação:</strong> Esta avaliação foi registrada ${feedback.anonimo ? 'anonimamente' : 'de forma confidencial'} com o objetivo de contribuir para o seu desenvolvimento profissional.
                  </p>
                </div>
                <div class="footer">
                  Esta é uma mensagem automática. Por favor, não responda este e-mail.<br>
                  © ${new Date().getFullYear()} Nabarrete & Ferro Advogados Associados. Todos os direitos reservados.
                </div>
              </div>
            </body>
            </html>
        `;

        return {
            subject: `Nova Avaliação Recebida - ${Array.isArray(feedback.titulo) ? feedback.titulo.join(', ') : feedback.titulo}`,
            body: htmlBody
        };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const { setor, colaborador_email, cargo, funcao, tipo_avaliacao, titulo, nota, descricao, arquivos, anonimo } = formData;

        if (!setor || !colaborador_email || !cargo || !tipo_avaliacao || !titulo.length || !descricao) {
            toast.error("Por favor, preencha todos os campos obrigatórios (*).");
            return;
        }

        const notaValue = Array.isArray(nota) ? nota[0] : nota;
        if (notaValue < 0 || notaValue > 5) {
            toast.error("A nota deve estar entre 0 e 5.");
            return;
        }

        setLoading(true);
        setAvisoEmail("");
        
        try {
            const destinatario = usuarios.find(u => u.email === colaborador_email);
            const dataAtual = new Date();
            const classificacaoTexto = getNotaInfo(notaValue).text;

            const feedbackData = {
                tipo_avaliacao: tipo_avaliacao,
                titulo: titulo,
                classificacao: classificacaoTexto,
                nota: notaValue,
                destinatario_email: colaborador_email,
                destinatario_nome: destinatario?.full_name || destinatario?.email || "",
                descricao: descricao,
                remetente_email: anonimo ? "anonimo@empresa.com" : currentUser.email, // Use a placeholder for anonymous emails
                remetente_nome: anonimo ? "Anônimo" : (currentUser.full_name || currentUser.email), // Oculta nome se anônimo
                anonimo: anonimo, // Salva flag
                data_ocorrido: dataAtual.toISOString(),
                retroativo: false,
                registrado_por_cargo: currentUser.cargo,
                setor: setor,
                cargo_colaborador: cargo,
                funcao: funcao,
                status_email: 'pendente',
                notificacao_manual_necessaria: false,
                arquivos_anexados: arquivos // Save attached files
            };

            const newFeedback = await base44.entities.Feedback.create(feedbackData);

            try {
                const emailTemplate = criarTemplateEmail(destinatario, feedbackData);

                await base44.integrations.Core.SendEmail({
                    from_name: "Nabarrete & Ferro Advogados",
                    to: colaborador_email,
                    subject: emailTemplate.subject,
                    body: emailTemplate.body
                });

                await base44.entities.Feedback.update(newFeedback.id, { status_email: 'enviado' });
                setAvisoEmail(`✅ Avaliação ${anonimo ? 'anônima' : ''} salva e e-mail enviado com sucesso para ${destinatario.full_name}.`);
                
            } catch (emailError) {
                const errorMessage = emailError.message || "Erro desconhecido ao enviar e-mail.";
                console.warn("Falha no envio do e-mail:", errorMessage);
                
                await base44.entities.Feedback.update(newFeedback.id, { 
                    status_email: 'falha', 
                    motivo_falha_email: errorMessage 
                });
                
                setAvisoEmail(`⚠️ Avaliação salva, mas o envio do e-mail falhou: ${errorMessage}. O destinatário verá a avaliação ao entrar no sistema.`);
            }

            setSucesso(true);
            setFormData({
                setor: "",
                colaborador_email: "",
                cargo: "",
                funcao: "",
                tipo_avaliacao: "",
                titulo: [],
                nota: [3],
                descricao: "",
                arquivos: [],
                anonimo: false // Reset
            });

            setTimeout(() => {
                setSucesso(false);
                setAvisoEmail("");
            }, 8000);
            
        } catch (error) {
            console.error("Erro ao salvar avaliação:", error);
            toast.error("Erro ao salvar a avaliação. Tente novamente.");
        }
        setLoading(false);
    };

    const getNotaColor = (nota) => {
        const { color } = getNotaInfo(nota);
        return color;
    };

    if (!currentUser) {
        return <div className="p-8">Carregando...</div>;
    }

    const notaAtual = Array.isArray(formData.nota) ? formData.nota[0] : formData.nota;
    const notaInfo = getNotaInfo(notaAtual);
    const isSetorLocked = !isAdminGlobal(currentUser) && !isAdminMultiSetor(currentUser) && !isGestorAcessoTodosSetores(currentUser);

    return (
        <div className="p-6 md:p-8 bg-slate-50 dark:bg-gray-900 min-h-screen">
            {/* Toaster component is typically configured globally or at a higher level, removed from here */}
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        Enviar Avaliação
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Preencha todos os campos para registrar uma nova avaliação.
                    </p>
                </div>

                {sucesso && (
                    <Alert className="mb-6 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-800 dark:text-green-200">
                            <strong>Operação concluída!</strong>
                            <div className="mt-2 whitespace-pre-line">{avisoEmail}</div>
                        </AlertDescription>
                    </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-8">
                    <Card className="shadow-lg rounded-xl">
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white">Identificação do Colaborador</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                           <div className="space-y-1.5">
                                <Label htmlFor="setor" className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300"><Building className="w-4 h-4" />Setor *</Label>
                                <Select 
                                    value={formData.setor} 
                                    onValueChange={(value) => handleInputChange('setor', value)}
                                    disabled={isSetorLocked}
                                >
                                    <SelectTrigger id="setor" className={isSetorLocked ? "bg-slate-100 dark:bg-gray-800" : ""}>
                                        <SelectValue placeholder="Selecione um setor" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {setoresDisponiveis.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                {isSetorLocked && currentUser.setor && (
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                        Você pode avaliar apenas colaboradores do setor {currentUser.setor}
                                    </p>
                                )}
                                {isSetorLocked && !currentUser.setor && (
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                        Você não tem permissão para selecionar um setor.
                                    </p>
                                )}
                            </div>
                             <div className="space-y-1.5">
                                <Label htmlFor="colaborador" className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300"><UserIcon className="w-4 h-4" />Colaborador *</Label>
                                <Select value={formData.colaborador_email} onValueChange={(value) => handleInputChange('colaborador_email', value)} disabled={!formData.setor}>
                                    <SelectTrigger id="colaborador"><SelectValue placeholder="Selecione um colaborador" /></SelectTrigger>
                                    <SelectContent>
                                        {usuariosDoSetor.map(u => (
                                            <SelectItem key={u.email} value={u.email}>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{u.full_name || u.email}</span>
                                                    {u.cargo && u.setor && (
                                                        <span className="text-sm text-gray-500 dark:text-gray-400">
                                                            {u.cargo} • {u.setor}
                                                        </span>
                                                    )}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="cargo" className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300"><Briefcase className="w-4 h-4" />Cargo *</Label>
                                <Input id="cargo" value={formData.cargo} onChange={(e) => handleInputChange('cargo', e.target.value)} placeholder="Cargo do colaborador" required />
                            </div>
                             <div className="space-y-1.5">
                                <Label htmlFor="funcao" className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300"><Briefcase className="w-4 h-4" />Função</Label>
                                <Input id="funcao" value={formData.funcao} onChange={(e) => handleInputChange('funcao', e.target.value)} placeholder="Função do colaborador" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300"><UserIcon className="w-4 h-4" />Avaliador</Label>
                                <Input value={currentUser.full_name || currentUser.email} disabled className="bg-slate-100 dark:bg-gray-800" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300"><Calendar className="w-4 h-4" />Data</Label>
                                <Input value={new Date().toLocaleDateString('pt-BR')} disabled className="bg-slate-100 dark:bg-gray-800" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-lg rounded-xl">
                         <CardHeader>
                            <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white">Detalhes da Avaliação</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <Label htmlFor="tipo_avaliacao" className="text-base font-semibold">
                                        Tipo da Avaliação *
                                    </Label>
                                    <Select value={formData.tipo_avaliacao} onValueChange={(value) => handleInputChange("tipo_avaliacao", value)}>
                                        <SelectTrigger className="mt-2 text-base"><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="feedback">Feedback</SelectItem>
                                            <SelectItem value="avaliacao_pontual">Avaliação Pontual</SelectItem>
                                            <SelectItem value="avaliacao_periodica">Avaliação Periódica</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                {formData.tipo_avaliacao && (
                                    <div>
                                        <Label htmlFor="titulo" className="text-base font-semibold">Títulos da Avaliação *</Label>
                                        <MultiSelectFilter
                                            title="Selecionar Títulos"
                                            placeholder="Selecione um ou mais títulos"
                                            options={titulosPorTipo[formData.tipo_avaliacao] || []}
                                            selectedValues={formData.titulo}
                                            onSelectionChange={(values) => handleInputChange("titulo", values)}
                                            className="mt-2 text-base"
                                        />
                                    </div>
                                )}
                            </div>

                            <div>
                                <Label className="text-base font-semibold flex items-center gap-2">
                                    <Star className="w-5 h-5 text-yellow-500" />
                                    Nota da Avaliação (0 a 5) *
                                </Label>
                                <div className="mt-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-500 dark:text-gray-400">0</span>
                                        <span className={`text-2xl font-bold ${getNotaColor(notaAtual)}`}>{notaAtual.toFixed(1)}/5.0</span>
                                        <span className="text-sm text-gray-500 dark:text-gray-400">5</span>
                                    </div>
                                    <Slider value={formData.nota} onValueChange={(value) => handleInputChange("nota", value)} max={5} min={0} step={0.1} className="w-full"/>
                                </div>
                            </div>
                            
                            <div className={`p-4 rounded-lg text-center ${notaInfo.bgColor}`}>
                                <h3 className={`font-bold text-lg ${notaInfo.color}`}>{notaInfo.text}</h3>
                            </div>

                            <div>
                                <Label htmlFor="descricao" className="text-base font-semibold">Descrição da Avaliação *</Label>
                                <Textarea id="descricao" value={formData.descricao} onChange={(e) => handleInputChange("descricao", e.target.value)} placeholder="Seja específico e construtivo..." rows={6} className="mt-2 text-base" required/>
                            </div>
                            
                            {/* Nova seção de upload de arquivos */}
                            <FileUploadSection
                                arquivos={formData.arquivos}
                                onArquivosChange={(arquivos) => handleInputChange('arquivos', arquivos)}
                            />

                            {/* Novo: Checkbox para envio anônimo */}
                            <div className="flex items-center space-x-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                                <input
                                    type="checkbox"
                                    id="anonimo"
                                    checked={formData.anonimo}
                                    onChange={(e) => handleInputChange('anonimo', e.target.checked)}
                                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                />
                                <label htmlFor="anonimo" className="flex items-center gap-2 cursor-pointer">
                                    <UserIcon className="w-5 h-5 text-yellow-600" />
                                    <div>
                                        <span className="font-semibold text-gray-900 dark:text-white">Enviar anonimamente</span>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">O destinatário não verá quem enviou esta avaliação</p>
                                    </div>
                                </label>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end gap-4 pt-6">
                        <Button type="submit" size="lg" className="bg-blue-700 hover:bg-blue-800 px-8" disabled={loading}>
                            {loading ? (
                                <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />Enviando...</>
                            ) : (
                                <><Send className="w-4 h-4 mr-2" />Enviar Avaliação</>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
