
import React, { useState, useEffect, useMemo } from "react";
import { User } from "@/api/entities";
import { Feedback } from "@/api/entities";
import { SendEmail } from "@/api/integrations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { History, Send, CheckCircle, Star, Calendar, AlertCircle, User as UserIcon } from "lucide-react"; // Added UserIcon
import { Alert, AlertDescription } from "@/components/ui/alert";
import MultiSelectFilter from "@/components/ui/MultiSelectFilter";
import FileUploadSection from "@/components/feedback/FileUploadSection";
import { isAdminGlobal, isAdminSetorial, isAdminMultiSetor, getAdminSetores, isGestorAcessoTodosSetores } from "@/components/utils/permissoes";
import { Toaster, toast } from 'sonner'; // Import Toaster and toast
import { format } from 'date-fns'; // Import format for date formatting

// Mock 'setores' array for functionality. In a real application, this would typically be imported.
// Assuming it's an array of objects like { label: string, value: string }
const setores = [
    { label: "Recursos Humanos", value: "RH" },
    { label: "Financeiro", value: "FINANCEIRO" },
    { label: "Jurídico", value: "JURIDICO" },
    { label: "Marketing", value: "MARKETING" },
    { label: "Tecnologia", value: "TECNOLOGIA" },
    { label: "Administrativo", value: "ADMINISTRATIVO" },
    { label: "Comercial", value: "COMERCIAL" },
];

const getNotaInfo = (nota) => {
    if (nota < 2) return { text: "Não atende", labelColor: "text-red-600", bgColor: "bg-red-100", borderColor: "border-red-500" };
    if (nota < 3) return { text: "Atende abaixo", labelColor: "text-orange-600", bgColor: "bg-orange-100", borderColor: "border-orange-500" };
    if (nota < 4) return { text: "Atende", labelColor: "text-yellow-600", bgColor: "bg-yellow-100", borderColor: "border-yellow-500" };
    if (nota < 5) return { text: "Supera parcialmente", labelColor: "text-blue-600", bgColor: "bg-blue-100", borderColor: "border-blue-500" };
    return { text: "Supera", labelColor: "text-green-600", bgColor: "bg-green-100", borderColor: "border-green-500" };
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

export default function FeedbacksRetroativos() {
    const [currentUser, setCurrentUser] = useState(null);
    const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(false);
    const [sucesso, setSucesso] = useState(false);
    
    const [formData, setFormData] = useState({
        tipo_avaliacao: "",
        titulo: [], // Array para MultiSelectFilter
        nota: [3], // Array para o slider
        destinatario_email: "",
        descricao: "",
        data_ocorrido: "",
        enviar_email: true,
        arquivos: [], // Novo campo para arquivos
        anonimo: false // ✅ Novo campo
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const user = await User.me();
            setCurrentUser(user);
            let selectableUsers = [];

            // Admin Global or Gestor with all sector access: all users
            if (isAdminGlobal(user) || isGestorAcessoTodosSetores(user)) {
                selectableUsers = await User.list();
            }
            // Multi-sector Admin: users from their assigned sectors
            else if (isAdminMultiSetor(user)) {
                const adminSetoresObjects = getAdminSetores(user); // Assuming this returns an array of {label, value}
                const sectorValuesToFilter = adminSetoresObjects.map(s => s.value);
                if (sectorValuesToFilter.length > 0) {
                    selectableUsers = await User.filter({ setor: { $in: sectorValuesToFilter } });
                }
            }
            // Setorial Admin: users from their specific sector
            else if (isAdminSetorial(user)) {
                if (user.setor) {
                    selectableUsers = await User.filter({ setor: user.setor });
                }
            }
            // Gestor (without all-sector access): only their direct reports
            else if (user.cargo === 'gestor') {
                const teamUsers = await User.filter({ gestores_responsaveis: user.email });
                selectableUsers = teamUsers; // Explicitly fetching team members. Current user will be filtered out next.
            }
            // Other roles: selectableUsers remains empty, form access is restricted later.

            // Filter out the current user from the list of selectable recipients.
            setUsuarios(selectableUsers.filter(u => u.email !== user.email));
        } catch (error) {
            console.error("Erro ao carregar dados:", error);
            setUsuarios([]); // Clear users on critical error
        }
    };

    const setoresDisponiveis = useMemo(() => {
        if (!currentUser) return [];

        if (isAdminGlobal(currentUser)) {
            return setores;
        }

        if (isAdminMultiSetor(currentUser)) {
            return getAdminSetores(currentUser);
        }

        // ✅ NOVO: Gestores com acesso a todos os setores
        if (isGestorAcessoTodosSetores(currentUser)) {
            return setores;
        }

        if (isAdminSetorial(currentUser) || currentUser.cargo === 'gestor') {
            // If currentUser.setor is a string, find the corresponding object in 'setores'
            const userSectorObject = setores.find(s => s.value === currentUser.setor);
            return userSectorObject ? [userSectorObject] : [];
        }

        return []; // Default for users without specific sector access roles
    }, [currentUser]);

    const handleInputChange = (field, value) => {
        const newFormData = { ...formData, [field]: value };
        // Resetar título se o tipo for alterado
        if (field === "tipo_avaliacao") {
            newFormData.titulo = []; // Reset to empty array
        }
        setFormData(newFormData);
    };

    const criarTemplateEmailRetroativo = (destinatario, feedback) => {
        const dataEnvio = new Date();
        const dataFormatadaEnvio = dataEnvio.toLocaleString('pt-BR', {
            day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });

        const dataOcorrido = format(new Date(feedback.data_ocorrido), "dd/MM/yyyy");

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
              <title>Nova Avaliação Retroativa Recebida</title>
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
                  <p>Prezado(a) <strong>${destinatario?.full_name || 'Colaborador'}</strong>,</p>
                  <p>Você recebeu uma nova avaliação (referente a uma data passada) registrada em nosso sistema interno.</p>
                  
                  <h2>🔹 Detalhes da Avaliação</h2>
                  <div class="feedback-box">
                    ${feedback.anonimo ? '<p><strong>⚠️ Esta avaliação foi enviada anonimamente</strong></p>' : `<p><strong>• Avaliador:</strong> ${feedback.remetente_nome}</p>`}
                    <p><strong>• Tipo:</strong> ${feedback.tipo_avaliacao ? feedback.tipo_avaliacao.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'N/D'}</p>
                    <p><strong>• Título:</strong> ${Array.isArray(feedback.titulo) ? feedback.titulo.join(', ') : feedback.titulo}</p>
                    <p><strong>• Classificação:</strong> ${feedback.classificacao} (${feedback.nota} / 5)</p>
                    <p><strong>• Data do Ocorrido:</strong> ${dataOcorrido}</p>
                    <p><strong>• Registrado em:</strong> ${dataFormatadaEnvio}</p>
                  </div>
                  
                  <h2>📄 Descrição da Avaliação</h2>
                  <div class="descricao-box">
                    ${descricaoFormatada}
                  </div>
                  
                  ${anexosHTML}
                  
                  <p style="margin-top: 24px; padding: 12px; background: #fff3cd; border-left: 4px solid #ff9800; border-radius: 4px;">
                    <strong>⚠️ AVALIAÇÃO RETROATIVA:</strong> Esta avaliação se refere a um evento ocorrido em <strong>${dataOcorrido}</strong> e está sendo registrada agora para fins de histórico e desenvolvimento profissional.
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
            subject: `Nova Avaliação Retroativa Recebida - ${Array.isArray(feedback.titulo) ? feedback.titulo.join(', ') : feedback.titulo}`,
            body: htmlBody
        };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const { tipo_avaliacao, titulo, nota, destinatario_email, descricao, data_ocorrido, enviar_email, arquivos, anonimo } = formData;

        if (!tipo_avaliacao || !titulo.length || !destinatario_email || !descricao || !data_ocorrido) {
            toast.error("Por favor, preencha todos os campos obrigatórios (*).");
            return;
        }

        const notaValue = Array.isArray(nota) ? nota[0] : nota;
        if (notaValue < 0 || notaValue > 5) {
            toast.error("A nota deve estar entre 0 e 5.");
            return;
        }

        // Validar se a data não é futura
        if (new Date(data_ocorrido) > new Date()) {
            toast.error("A data da avaliação não pode ser futura.");
            return;
        }
        
        const classificacaoTexto = getNotaInfo(notaValue).text;
        const destinatario = usuarios.find(u => u.email === destinatario_email);

        setLoading(true);
        try {
            const feedbackData = {
                tipo_avaliacao: tipo_avaliacao,
                titulo: titulo, // This will be an array of strings
                classificacao: classificacaoTexto,
                nota: notaValue,
                destinatario_email: destinatario_email,
                destinatario_nome: destinatario?.full_name || destinatario?.email || "",
                descricao: descricao,
                remetente_email: currentUser.email,
                remetente_nome: anonimo ? "Anônimo" : (currentUser.full_name || currentUser.email), // ✅ Oculta nome se anônimo
                anonimo: anonimo, // ✅ Salva flag
                data_ocorrido: new Date(data_ocorrido).toISOString(),
                retroativo: true,
                registrado_por_cargo: currentUser.cargo,
                status_email: enviar_email ? 'pendente' : 'nao_enviado',
                notificacao_manual_necessaria: !enviar_email, // Flag if email wasn't sent but might be needed
                arquivos_anexados: arquivos // Salva os arquivos
            };

            const newFeedback = await Feedback.create(feedbackData);

            // Tenta enviar o e-mail se a opção estiver marcada
            if (enviar_email) {
                try {
                    const emailTemplate = criarTemplateEmailRetroativo(destinatario, feedbackData);
                    await SendEmail({
                        from_name: "Nabarrete & Ferro Advogados",
                        to: destinatario_email,
                        subject: emailTemplate.subject,
                        body: emailTemplate.body
                    });
                    await Feedback.update(newFeedback.id, { status_email: 'enviado' });
                    toast.success(`Avaliação retroativa ${anonimo ? 'anônima' : ''} salva e e-mail enviado com sucesso!`);
                } catch (emailError) {
                    const errorMessage = emailError.message || "Erro desconhecido ao enviar e-mail.";
                    console.warn("Falha no envio do e-mail:", errorMessage);
                    await Feedback.update(newFeedback.id, { status_email: 'falha', motivo_falha_email: errorMessage });
                    toast.warning(`Avaliação salva, mas o envio do e-mail falhou: ${errorMessage}. Verifique a página 'Todas as Avaliações' para tentar reenviar.`);
                }
            } else {
                 // Se a opção de enviar e-mail não foi marcada, o status_email já é 'nao_enviado'
                 toast.success("Avaliação retroativa salva sem envio de e-mail!");
            }

            setSucesso(true);
            setFormData({
                tipo_avaliacao: "",
                titulo: [], // Reset to empty array
                nota: [3],
                destinatario_email: "",
                descricao: "",
                data_ocorrido: "",
                enviar_email: true,
                arquivos: [], // Limpa os arquivos
                anonimo: false // ✅ Reset
            });

            setTimeout(() => setSucesso(false), 5000);
        } catch (error) {
            console.error("Erro ao cadastrar avaliação:", error);
            toast.error("Erro ao cadastrar. Tente novamente.");
        }
        setLoading(false);
    };

    const getNotaColor = (nota) => {
        const { labelColor } = getNotaInfo(nota);
        return labelColor || 'text-gray-600';
    };

    if (!currentUser) {
        return <div className="p-8">Carregando...</div>;
    }

    // Check permissions for rendering the form
    // Updated to include new permission types for accessing the form
    const isCurrentUserAuthorized = isAdminGlobal(currentUser) || isAdminSetorial(currentUser) || isAdminMultiSetor(currentUser) || isGestorAcessoTodosSetores(currentUser) || currentUser.cargo === 'gestor';

    if (!isCurrentUserAuthorized) {
        return (
            <div className="p-8">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        Acesso Restrito
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Apenas administradores globais, administradores setoriais, multi-setoriais e gestores podem cadastrar avaliações retroativas.
                    </p>
                </div>
            </div>
        );
    }

    const notaAtual = Array.isArray(formData.nota) ? formData.nota[0] : formData.nota;
    const notaInfo = getNotaInfo(notaAtual);
    // const isSetorLocked = !isAdminGlobal(currentUser) && !isAdminMultiSetor(currentUser) && !isGestorAcessoTodosSetores(currentUser); // Not used in this context

    return (
        <div className="p-6 md:p-8 bg-slate-50 dark:bg-gray-900 min-h-screen">
            <Toaster richColors position="top-center" /> {/* Added Toaster */}
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
                        <History className="w-8 h-8 text-blue-600" />
                        Avaliações Retroativas
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Cadastre avaliações sobre eventos que ocorreram no passado. Defina a data do acontecimento para manter o histórico preciso.
                    </p>
                </div>

                {sucesso && (
                    <Alert className="mb-6 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-800 dark:text-green-200">
                            Avaliação retroativa cadastrada com sucesso!
                        </AlertDescription>
                    </Alert>
                )}

                <Alert className="mb-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800 dark:text-blue-200">
                        <strong>Avaliação Retroativa:</strong> Use esta funcionalidade para registrar eventos importantes que aconteceram no passado. A data que você definir será usada nas estatísticas e relatórios.
                    </AlertDescription>
                </Alert>

                <Card className="shadow-lg rounded-xl">
                    <CardHeader className="border-b bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20">
                        <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            <History className="w-7 h-7 text-orange-600" />
                            Cadastrar Avaliação Retroativa
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8">
                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <Label htmlFor="tipo_avaliacao" className="text-base font-semibold">
                                        Tipo da Avaliação *
                                    </Label>
                                    <Select
                                        value={formData.tipo_avaliacao}
                                        onValueChange={(value) => handleInputChange("tipo_avaliacao", value)}
                                    >
                                        <SelectTrigger className="mt-2 text-base">
                                            <SelectValue placeholder="Selecione o tipo" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="feedback">Feedback</SelectItem>
                                            <SelectItem value="avaliacao_pontual">Avaliação Pontual</SelectItem>
                                            <SelectItem value="avaliacao_periodica">Avaliação Periódica</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {formData.tipo_avaliacao && (
                                    <div>
                                        <Label htmlFor="titulo" className="text-base font-semibold">
                                            Títulos da Avaliação *
                                        </Label>
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
                            <div className="grid md:grid-cols-2 gap-6">

                                {/* Destinatário */}
                                <div>
                                    <Label htmlFor="destinatario" className="text-base font-semibold">
                                        Para *
                                    </Label>
                                    <Select
                                        value={formData.destinatario_email}
                                        onValueChange={(value) => handleInputChange("destinatario_email", value)}
                                    >
                                        <SelectTrigger className="mt-2 text-base">
                                            <SelectValue placeholder="Selecione" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {usuarios.map((usuario) => (
                                                <SelectItem key={usuario.email} value={usuario.email}>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">
                                                            {usuario.full_name || usuario.email}
                                                        </span>
                                                        <span className="text-sm text-gray-500 dark:text-gray-400">
                                                            {usuario.cargo} • {usuario.setor}
                                                        </span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Data da Avaliação */}
                            <div>
                                <Label htmlFor="data_ocorrido" className="text-base font-semibold flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    Data do Evento *
                                </Label>
                                <Input
                                    id="data_ocorrido"
                                    type="date"
                                    value={formData.data_ocorrido}
                                    onChange={(e) => handleInputChange("data_ocorrido", e.target.value)}
                                    max={new Date().toISOString().split('T')[0]} // Não permitir datas futuras
                                    className="mt-2 text-base"
                                    required
                                />
                            </div>

                            {/* Nota da Avaliação */}
                            <div>
                                <Label className="text-base font-semibold flex items-center gap-2">
                                    <Star className="w-5 h-5 text-yellow-500" />
                                    Nota da Avaliação (0 a 5) *
                                </Label>
                                <div className="mt-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-500">0</span>
                                        <span className={`text-2xl font-bold ${getNotaColor(notaAtual)}`}>
                                            {notaAtual.toFixed(1)}/5.0
                                        </span>
                                        <span className="text-sm text-gray-500">5</span>
                                    </div>
                                    <Slider
                                        value={formData.nota}
                                        onValueChange={(value) => handleInputChange("nota", value)}
                                        max={5}
                                        min={0}
                                        step={0.1}
                                        className="w-full"
                                    />
                                </div>
                            </div>

                            <div className={`p-4 rounded-lg text-center ${notaInfo.bgColor}`}>
                                <h3 className={`font-bold text-lg ${notaInfo.labelColor}`}>
                                    {notaInfo.text}
                                </h3>
                            </div>

                            {/* Descrição */}
                            <div>
                                <Label htmlFor="descricao" className="text-base font-semibold">
                                    Descrição da Avaliação *
                                </Label>
                                <Textarea
                                    id="descricao"
                                    value={formData.descricao}
                                    onChange={(e) => handleInputChange("descricao", e.target.value)}
                                    placeholder="Descreva detalhadamente o evento e comportamentos observados..."
                                    rows={6}
                                    className="mt-2 text-base"
                                    required
                                />
                            </div>

                            {/* Nova seção de upload de arquivos */}
                            <FileUploadSection
                                arquivos={formData.arquivos}
                                onArquivosChange={(arquivos) => handleInputChange('arquivos', arquivos)}
                            />

                            {/* ✅ Novo: Checkbox para envio anônimo */}
                            <div className="flex items-center space-x-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                                <Checkbox
                                    id="anonimo"
                                    checked={formData.anonimo}
                                    onCheckedChange={(checked) => handleInputChange('anonimo', checked)}
                                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                />
                                <Label htmlFor="anonimo" className="flex items-center gap-2 cursor-pointer">
                                    <UserIcon className="w-5 h-5 text-yellow-600" />
                                    <div>
                                        <span className="font-semibold text-gray-900 dark:text-white">Enviar anonimamente</span>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">O destinatário não verá quem enviou esta avaliação</p>
                                    </div>
                                </Label>
                            </div>

                            {/* Opção de envio por e-mail */}
                            <div className="flex items-center space-x-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                <Checkbox
                                    id="enviar_email"
                                    checked={formData.enviar_email}
                                    onCheckedChange={(checked) => handleInputChange("enviar_email", checked)}
                                />
                                <Label
                                    htmlFor="enviar_email"
                                    className="flex items-center gap-2 cursor-pointer"
                                >
                                    <Send className="w-5 h-5 text-blue-600" />
                                    <div>
                                        <span className="font-semibold text-gray-900 dark:text-white">Notificar o colaborador por e-mail</span>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Recomendado para que o colaborador seja informado sobre a avaliação.</p>
                                    </div>
                                </Label>
                            </div>

                            <div className="flex justify-end gap-4 pt-6">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setFormData({
                                        tipo_avaliacao: "",
                                        titulo: [], // Reset to empty array
                                        nota: [3],
                                        destinatario_email: "",
                                        descricao: "",
                                        data_ocorrido: "",
                                        enviar_email: true,
                                        arquivos: [], // Limpa os arquivos
                                        anonimo: false // Reset
                                    })}
                                    disabled={loading}
                                >
                                    Limpar Formulário
                                </Button>
                                <Button
                                    type="submit"
                                    className="bg-blue-700 hover:bg-blue-800 px-8"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                            Cadastrando...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-4 h-4 mr-2" />
                                            Cadastrar Avaliação
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
