
import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast, Toaster } from "sonner";
import { FileText, Send, User as UserIcon, Building, Briefcase, Calendar, Save, AlertTriangle, Award } from 'lucide-react';
import { cn } from "@/lib/utils";
import { isAdminGlobal, isAdminSetorial, isAdminMultiSetor, getAdminSetores, isGestorAcessoTodosSetores } from "@/components/utils/permissoes";
import FileUploadSection from '@/components/feedback/FileUploadSection';

const setores = ["RH", "Controldesk", "Controladoria", "M.I.S", "Extra", "Acordo Jud", "Contencioso", "Focais", "Filiais", "Iniciais", "Adm", "Contrárias", "Tecnologia", "Recuperação Judicial"];

const getNotaInfo = (nota) => {
    if (nota < 2) return { text: "Não atende", color: "text-red-600", bgColor: "bg-red-100" };
    if (nota < 3) return { text: "Atende abaixo", color: "text-orange-600", bgColor: "bg-orange-100" };
    if (nota < 4) return { text: "Atende", color: "text-yellow-600", bgColor: "bg-yellow-100" };
    if (nota < 5) return { text: "Supera parcialmente", color: "text-blue-600", bgColor: "bg-blue-100" };
    return { text: "Supera", color: "text-green-600", bgColor: "bg-green-100" };
};

const criarTemplateEmailAIC = (destinatario, avaliacao) => {
    const dataAtual = new Date();
    const dataFormatada = dataAtual.toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    const formatarObservacoes = (texto) => {
        if (!texto) return '<p style="color: #777;">Nenhuma observação adicional foi registrada.</p>';
        
        return texto
            .split('\n')
            .map(linha => {
                if (linha.trim().startsWith('•')) {
                    return `<li style="margin: 8px 0; line-height: 1.6;">${linha.trim().substring(1).trim()}</li>`;
                }
                if (linha.trim().match(/^[A-Za-zÀ-ÿ\s]+:$/)) {
                    return `<p style="margin: 16px 0 8px 0;"><strong style="font-size: 15px; color: #000529;">${linha.trim()}</strong></p>`;
                }
                if (linha.trim() === '') {
                    return '<br>';
                }
                return `<p style="margin: 8px 0; line-height: 1.6;">${linha.trim()}</p>`;
            })
            .join('');
    };

    const observacoesFormatadas = formatarObservacoes(avaliacao.observacoes);

    const anexosHTML = avaliacao.arquivos_anexados && avaliacao.arquivos_anexados.length > 0 ? `
        <h2 style="color: #000529; font-size: 18px; margin-top: 24px; border-bottom: 2px solid #000529; padding-bottom: 8px;">📎 Arquivos Anexados</h2>
        <div style="background: #f9fafc; border-left: 4px solid #000529; padding: 15px; margin: 20px 0; border-radius: 4px;">
            ${avaliacao.arquivos_anexados.map((arquivo, index) => `
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
          <title>Avaliação A.I.C Recebida</title>
          <style>
            body { font-family: "Segoe UI", Arial, sans-serif; background-color: #f4f6f9; margin: 0; padding: 0; color: #333333; }
            .container { max-width: 650px; margin: 30px auto; background: #ffffff; border-radius: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); overflow: hidden; }
            .header { background: #000529; color: #ffffff; text-align: center; padding: 20px; }
            .header h1 { margin: 0; font-size: 20px; font-weight: 600; }
            .content { padding: 25px 30px; line-height: 1.6; }
            .content h2 { color: #000529; font-size: 18px; margin-top: 24px; border-bottom: 2px solid #000529; padding-bottom: 8px; }
            .feedback-box { background: #f9fafc; border-left: 4px solid #000529; padding: 15px; margin: 20px 0; border-radius: 4px; }
            .feedback-box p { margin: 6px 0; }
            .competencias-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .competencias-table th, .competencias-table td { padding: 12px; text-align: left; border-bottom: 1px solid #e0e0e0; }
            .competencias-table th { background: #f5f5f5; font-weight: 600; color: #000529; }
            .competencias-table .destaque { background: #e3f2fd; font-weight: bold; }
            .observacoes-box { background: #ffffff; border: 1px solid #e0e0e0; padding: 20px; margin: 20px 0; border-radius: 6px; }
            .observacoes-box ul { list-style: none; padding-left: 0; margin: 12px 0; }
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
              <p>Você recebeu uma nova <strong>Avaliação Individual do Colaborador (A.I.C)</strong> registrada em nosso sistema interno.</p>
              
              <h2>🔹 Detalhes da Avaliação</h2>
              <div class="feedback-box">
                ${avaliacao.anonimo ? '<p><strong>⚠️ Esta avaliação foi enviada anonimamente</strong></p>' : `<p><strong>• Avaliador:</strong> ${avaliacao.remetente_nome}</p>`}
                <p><strong>• Tipo:</strong> Avaliação A.I.C (Análise Individual do Colaborador)</p>
                <p><strong>• Setor:</strong> ${destinatario.setor || 'N/D'}</p>
                <p><strong>• Cargo:</strong> ${avaliacao.cargo_colaborador || 'N/D'}</p>
                <p><strong>• Função:</strong> ${avaliacao.funcao || 'N/D'}</p>
                <p><strong>• Data:</strong> ${dataFormatada}</p>
              </div>
              
              <h2>📊 Avaliação de Competências</h2>
              <table class="competencias-table">
                <thead>
                  <tr>
                    <th>Competência</th>
                    <th style="text-align: center;">Nota</th>
                    <th>Observação</th>
                  </tr>
                </thead>
                <tbody>
                  <tr class="destaque">
                    <td><strong>Produtividade</strong> <span style="background: #2196f3; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: bold;">PESO 2</span></td>
                    <td style="text-align: center; font-size: 18px; font-weight: bold; color: #2196f3;">${avaliacao.nota_produtividade}/5</td>
                    <td>${avaliacao.nota_produtividade >= 4 ? '✅ Supera expectativas' : avaliacao.nota_produtividade >= 3 ? '⚠️ Atende' : '❌ Abaixo do esperado'}</td>
                  </tr>
                  <tr>
                    <td>Conduta Pessoal</td>
                    <td style="text-align: center; font-size: 18px; font-weight: bold;">${avaliacao.nota_conduta}/5</td>
                    <td>${avaliacao.nota_conduta >= 4 ? '✅ Supera expectativas' : avaliacao.nota_conduta >= 3 ? '⚠️ Atende' : '❌ Abaixo do esperado'}</td>
                  </tr>
                  <tr>
                    <td>Engajamento</td>
                    <td style="text-align: center; font-size: 18px; font-weight: bold;">${avaliacao.nota_engajamento}/5</td>
                    <td>${avaliacao.nota_engajamento >= 4 ? '✅ Supera expectativas' : avaliacao.nota_engajamento >= 3 ? '⚠️ Atende' : '❌ Abaixo do esperado'}</td>
                  </tr>
                </tbody>
              </table>
              
              <div style="background: #e8f5e9; border-left: 4px solid #4caf50; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0;"><strong style="color: #2e7d32;">📈 Média Final Ponderada:</strong> <span style="font-size: 24px; font-weight: bold; color: #1b5e20;">${avaliacao.nota.toFixed(2)}/5.00</span></p>
                <p style="margin: 8px 0 0 0; font-size: 14px; color: #558b2f;"><strong>Classificação:</strong> ${avaliacao.classificacao}</p>
                <p style="margin: 8px 0 0 0; font-size: 12px; color: #558b2f;"><em>* Produtividade possui peso 2 no cálculo da média final</em></p>
              </div>
              
              <h2>📝 Observações do Gestor</h2>
              <div class="observacoes-box">
                ${observacoesFormatadas}
              </div>
              
              ${anexosHTML}
              
              <p style="margin-top: 24px; padding: 12px; background: #e8f4f8; border-left: 4px solid #0288d1; border-radius: 4px;">
                <strong>ℹ️ Informação:</strong> Esta avaliação é confidencial e tem como objetivo contribuir para o seu desenvolvimento profissional e crescimento na organização.
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
        subject: `Avaliação A.I.C Recebida - ${avaliacao.classificacao}`,
        body: htmlBody
    };
};

const competencias = [
    { id: 'produtividade', nome: 'Produtividade', peso: 2, destaque: true },
    { id: 'conduta', nome: 'Conduta Pessoal', peso: 1, destaque: false },
    { id: 'engajamento', nome: 'Engajamento', peso: 1, destaque: false },
];

const legendaNotas = [
    { nota: 5, texto: "SUPERA", color: "bg-green-500" },
    { nota: 4, texto: "SUPERA PARCIALMENTE", color: "bg-blue-500" },
    { nota: 3, texto: "ATENDE", color: "bg-yellow-500" },
    { nota: 2, texto: "ATENDE ABAIXO", color: "bg-orange-500" },
    { nota: 1, texto: "NÃO ATENDE", color: "bg-red-500" },
];

const initialFormData = {
    setor: '',
    colaborador_email: '',
    cargo: '',
    funcao: '',
    nota_produtividade: null,
    nota_conduta: null,
    nota_engajamento: null,
    observacoes: '',
    status_avaliacao: 'Rascunho',
    remetente_email_original: null,
    remetente_nome_original: null,
    arquivos: [],
    anonimo: false,
};

export default function AvaliacaoAIC() {
    const [currentUser, setCurrentUser] = useState(null);
    const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState(initialFormData);
    
    const location = useLocation();
    const navigate = useNavigate();
    
    const avaliacaoId = useMemo(() => {
        const searchParams = new URLSearchParams(location.search);
        return searchParams.get('id');
    }, [location.search]);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const user = await base44.auth.me();
                setCurrentUser(user);
                
                let selectableUsers = [];

                if (isAdminGlobal(user)) {
                    selectableUsers = await base44.entities.User.list();
                }
                else if (isAdminMultiSetor(user)) {
                    const allowedSetores = getAdminSetores(user);
                    const allUsers = await base44.entities.User.list();
                    selectableUsers = allUsers.filter(u => allowedSetores.includes(u.setor));
                }
                else if (isAdminSetorial(user)) {
                    selectableUsers = await base44.entities.User.filter({ setor: user.setor });
                }
                else if (isGestorAcessoTodosSetores(user)) {
                    // Extrair usuários de feedbacks ao invés de tentar User.list()
                    const allFeedbacks = await base44.entities.Feedback.list("-created_date");
                    const uniqueEmails = new Set();
                    
                    allFeedbacks.forEach(f => {
                        if (f.destinatario_email) uniqueEmails.add(f.destinatario_email);
                        if (f.remetente_email) uniqueEmails.add(f.remetente_email);
                    });
                    
                    selectableUsers = Array.from(uniqueEmails).map(email => {
                        const feedbackRecebido = allFeedbacks.find(f => f.destinatario_email === email);
                        const feedbackEnviado = allFeedbacks.find(f => f.remetente_email === email);
                        
                        return {
                            email: email,
                            full_name: feedbackRecebido?.destinatario_nome || feedbackEnviado?.remetente_nome || email.split('@')[0],
                            setor: feedbackRecebido?.destinatario_setor,
                            cargo_funcional: feedbackRecebido?.cargo_colaborador,
                            funcao_funcional: feedbackRecebido?.funcao,
                            cargo: 'usuario',
                            gestores_responsaveis: []
                        };
                    });
                }
                else if (user.cargo === 'gestor') {
                    const teamUsers = await base44.entities.User.filter({ gestores_responsaveis: user.email });
                    selectableUsers = teamUsers;
                }
                else {
                    selectableUsers = [];
                }
                
                setUsuarios(selectableUsers.filter(u => u.email !== user.email));

                if (!isAdminGlobal(user) && !isAdminMultiSetor(user) && !isGestorAcessoTodosSetores(user) && user.cargo !== 'gestor' && user.setor) {
                    setFormData(prev => ({ ...prev, setor: user.setor }));
                }

                if (!avaliacaoId) {
                    setLoading(false);
                }
            } catch (error) {
                console.error("Erro ao carregar dados iniciais:", error);
                toast.error("Falha ao carregar dados essenciais.");
                setLoading(false);
            }
        };
        loadData();
    }, [avaliacaoId]);

    useEffect(() => {
        const loadSpecificAvaliacao = async () => {
            if (avaliacaoId && usuarios.length > 0 && currentUser) {
                setLoading(true);
                try {
                    const avaliacao = await base44.entities.Feedback.get(avaliacaoId);
                    
                    const isUserAllowedToView = 
                        isAdminGlobal(currentUser) ||
                        (isAdminMultiSetor(currentUser) && getAdminSetores(currentUser).includes(avaliacao?.destinatario_setor)) ||
                        (isAdminSetorial(currentUser) && currentUser.setor === avaliacao?.destinatario_setor) ||
                        (isGestorAcessoTodosSetores(currentUser)) ||
                        (currentUser.cargo === 'gestor' && currentUser.setor === avaliacao?.destinatario_setor) ||
                        (currentUser.cargo === 'gestor' && usuarios.some(u => u.email === avaliacao?.destinatario_email));
                    
                    if (!isUserAllowedToView) {
                        toast.error("Você não tem permissão para ver esta avaliação.");
                        navigate(createPageUrl('TodasAvaliacoesAIC'));
                        return;
                    }

                    if (avaliacao && avaliacao.tipo_avaliacao === 'aic') {
                        const setorDoUsuario = usuarios.find(u => u.email === avaliacao.destinatario_email)?.setor;

                        setFormData({
                            setor: setorDoUsuario || '',
                            colaborador_email: avaliacao.destinatario_email || '',
                            cargo: avaliacao.cargo_colaborador || '',
                            funcao: avaliacao.funcao || '',
                            nota_produtividade: avaliacao.nota_produtividade,
                            nota_conduta: avaliacao.nota_conduta,
                            nota_engajamento: avaliacao.nota_engajamento,
                            observacoes: avaliacao.observacoes || '',
                            status_avaliacao: avaliacao.status_avaliacao,
                            remetente_email_original: avaliacao.remetente_email,
                            remetente_nome_original: avaliacao.remetente_nome,
                            arquivos: avaliacao.arquivos_anexados || [],
                            anonimo: avaliacao.anonimo || false,
                        });
                    } else {
                        toast.error("Avaliação A.I.C. não encontrada ou inválida.");
                        navigate(createPageUrl('TodasAvaliacoesAIC'));
                    }
                } catch (error) {
                    console.error("Erro ao carregar avaliação:", error);
                    toast.error("Falha ao carregar os dados da avaliação.");
                } finally {
                    setLoading(false);
                }
            } else if (!avaliacaoId && currentUser && usuarios.length > 0) {
                setLoading(false);
            }
        };

        if (usuarios.length > 0 || currentUser) {
            loadSpecificAvaliacao();
        }

    }, [avaliacaoId, usuarios, navigate, currentUser]);

    const setoresDisponiveis = useMemo(() => {
        if (!currentUser) return [];
        
        if (isAdminGlobal(currentUser)) {
            return setores;
        }
        
        if (isAdminMultiSetor(currentUser)) {
            return getAdminSetores(currentUser);
        }
        
        if (isGestorAcessoTodosSetores(currentUser)) {
            return setores;
        }
        
        if (currentUser.cargo === 'gestor') {
            const setoresDaEquipe = [...new Set(
                usuarios
                    .filter(u => u.gestores_responsaveis?.includes(currentUser.email))
                    .map(u => u.setor)
                    .filter(Boolean)
            )];
            return setoresDaEquipe.length > 0 ? setoresDaEquipe : [];
        }
        
        if (isAdminSetorial(currentUser)) {
            return currentUser.setor ? [currentUser.setor] : [];
        }
        
        return setores;
    }, [currentUser, usuarios]);

    const colaboradorSelecionado = useMemo(() => {
        if (!formData.colaborador_email || !usuarios.length) return null;
        return usuarios.find(u => u.email === formData.colaborador_email) || null;
    }, [formData.colaborador_email, usuarios]);

    const mediaFinal = useMemo(() => {
        const { nota_produtividade, nota_conduta, nota_engajamento } = formData;
        
        const notasPonderadas = [];
        const pesos = [];

        if (nota_produtividade !== null && typeof nota_produtividade === 'number') {
            notasPonderadas.push(nota_produtividade * 2);
            pesos.push(2);
        }
        if (nota_conduta !== null && typeof nota_conduta === 'number') {
            notasPonderadas.push(nota_conduta * 1);
            pesos.push(1);
        }
        if (nota_engajamento !== null && typeof nota_engajamento === 'number') {
            notasPonderadas.push(nota_engajamento * 1);
            pesos.push(1);
        }

        if (notasPonderadas.length === 0) return 0;

        const somaPonderada = notasPonderadas.reduce((acc, nota) => acc + nota, 0);
        const somaPesos = pesos.reduce((acc, peso) => acc + peso, 0);

        if (somaPesos === 0) return 0;

        return parseFloat((somaPonderada / somaPesos));
    }, [formData.nota_produtividade, formData.nota_conduta, formData.nota_engajamento]);

    const resultadoFinalDisplay = useMemo(() => {
        const { nota_produtividade, nota_conduta, nota_engajamento } = formData;

        const allNotesProvided = nota_produtividade !== null && nota_conduta !== null && nota_engajamento !== null;

        if (!allNotesProvided) {
            return {
                mainText: 'Aguardando avaliação...',
                subText: null,
                color: 'text-slate-500',
                classification: 'Aguardando',
                showPDI: false,
            };
        }

        const finalMedia = mediaFinal;

        if (nota_produtividade === 1) {
            const outrasNotas = [];
            if (nota_conduta !== null) outrasNotas.push(nota_conduta);
            if (nota_engajamento !== null) outrasNotas.push(nota_engajamento);
            
            let mediaOutrasNotas = 0;
            if (outrasNotas.length > 0) {
                mediaOutrasNotas = outrasNotas.reduce((sum, n) => sum + n, 0) / outrasNotas.length;
            }
            const infoOutrasNotas = getNotaInfo(mediaOutrasNotas);

            return {
                mainText: `${finalMedia.toFixed(1)} — Não atende`,
                subText: `A nota em Produtividade impactou o resultado final. As demais competências estão na faixa "${infoOutrasNotas.text}".`,
                color: 'text-red-600',
                classification: 'Não atende',
                showPDI: true,
            };
        }

        const notaInfo = getNotaInfo(finalMedia);
        const shouldShowPDI = finalMedia < 2;

        return {
            mainText: `${finalMedia.toFixed(1)} — ${notaInfo.text}`,
            subText: null,
            color: notaInfo.color,
            classification: notaInfo.text,
            showPDI: shouldShowPDI,
        };
    }, [formData, mediaFinal]);

    const handleInputChange = (field, value) => {
        const newFormData = { ...formData, [field]: value };
        if (field === 'setor') {
             newFormData.colaborador_email = '';
             newFormData.cargo = '';
             newFormData.funcao = '';
        }
        if (field === 'colaborador_email') {
            const user = usuarios.find(u => u.email === value);
            newFormData.cargo = user?.cargo_funcional || '';
            newFormData.funcao = user?.funcao_funcional || '';
            newFormData.setor = user?.setor || newFormData.setor; 
        }
        setFormData(newFormData);
    };

    const handleNotaChange = (competenciaId, nota) => {
        setFormData(prev => ({ ...prev, [`nota_${competenciaId}`]: parseInt(nota) }));
    };

    const handleSave = async (status) => {
        const { 
            setor, 
            colaborador_email, 
            cargo, 
            funcao, 
            nota_produtividade, 
            nota_conduta, 
            nota_engajamento, 
            observacoes,
            remetente_email_original,
            remetente_nome_original,
            arquivos,
            anonimo,
        } = formData;

        if (!setor || !colaborador_email || !cargo || !funcao) {
            toast.error("Por favor, preencha os campos de identificação (Setor, Colaborador, Cargo, Função).");
            return;
        }
        
        if (!colaboradorSelecionado) {
            toast.error("Colaborador não encontrado. Por favor, selecione um colaborador válido.");
            return;
        }
        
        if (status === 'Enviada' && (nota_produtividade === null || nota_conduta === null || nota_engajamento === null)) {
            toast.error("Para enviar, todas as competências devem ser avaliadas.");
            return;
        }

        setLoading(true);
        const finalMedia = mediaFinal;
        const classificacaoFinal = resultadoFinalDisplay.classification;

        try {
            let currentRemetenteEmail = (avaliacaoId && remetente_email_original) ? remetente_email_original : currentUser?.email;
            let currentRemetenteNome = (avaliacaoId && remetente_nome_original) ? remetente_nome_original : currentUser?.full_name;

            const avaliacaoData = {
                tipo_avaliacao: 'aic',
                titulo: ['Avaliação de Indicadores Comportamentais'], 
                destinatario_email: colaborador_email,
                destinatario_nome: colaboradorSelecionado?.full_name || colaborador_email, 
                destinatario_setor: colaboradorSelecionado?.setor || setor, 
                remetente_email: anonimo ? null : currentRemetenteEmail,
                remetente_nome: anonimo ? "Anônimo" : currentRemetenteNome,
                anonimo: anonimo,
                data_ocorrido: new Date().toISOString(),
                descricao: `Avaliação A.I.C. Média: ${finalMedia.toFixed(1)}. Produtividade: ${nota_produtividade}, Conduta: ${nota_conduta}, Engajamento: ${nota_engajamento}.`,
                nota: finalMedia,
                classificacao: classificacaoFinal,
                cargo_colaborador: cargo,
                funcao: funcao,
                nota_produtividade,
                nota_conduta,
                nota_engajamento,
                observacoes,
                registrado_por_cargo: currentUser?.cargo,
                status_avaliacao: status,
                status_email: 'pendente', 
                motivo_falha_email: null,
                arquivos_anexados: arquivos, 
            };

            if (avaliacaoId && currentRemetenteEmail !== currentUser?.email && status === 'Enviada' && isAdminGlobal(currentUser)) {
                avaliacaoData.enviado_por_admin = currentUser?.email; 
            }

            let savedAvaliacao;
            if (avaliacaoId) {
                await base44.entities.Feedback.update(avaliacaoId, avaliacaoData);
                savedAvaliacao = { id: avaliacaoId, ...avaliacaoData };
                toast.success(`Avaliação ${status === 'Enviada' ? 'enviada' : 'salva como rascunho'} com sucesso!`);
            } else {
                savedAvaliacao = await base44.entities.Feedback.create(avaliacaoData);
                toast.success(`Avaliação ${status === 'Enviada' ? 'enviada' : 'salva como rascunho'} com sucesso!`);
                navigate(createPageUrl(`AvaliacaoAIC?id=${savedAvaliacao.id}`), { replace: true });
            }

            if (status === 'Enviada') {
                try {
                    if (colaboradorSelecionado?.email) {
                        const emailTemplate = criarTemplateEmailAIC(colaboradorSelecionado, avaliacaoData);
                        await base44.integrations.Core.SendEmail({
                            from_name: "Nabarrete & Ferro Advogados",
                            to: colaboradorSelecionado.email,
                            subject: emailTemplate.subject,
                            body: emailTemplate.body
                        });
                        await base44.entities.Feedback.update(savedAvaliacao.id, { status_email: 'enviado' });
                        toast.success(`Avaliação ${anonimo ? 'anônima ' : ''}enviada por e-mail com sucesso!`, {
                            description: `Média final: ${finalMedia.toFixed(1)} – ${classificacaoFinal}`,
                        });
                    } else {
                        throw new Error("Email do colaborador não encontrado ou inválido.");
                    }
                } catch (emailError) {
                    console.error("Falha ao enviar e-mail da avaliação A.I.C.:", emailError);
                    await base44.entities.Feedback.update(savedAvaliacao.id, { status_email: 'falha', motivo_falha_email: emailError.message });
                    toast.warning(`Avaliação ${anonimo ? 'anônima ' : ''}enviada, mas a notificação por e-mail falhou.`, {
                         description: `Média final: ${finalMedia.toFixed(1)} – ${classificacaoFinal}`,
                    });
                }
                
                setFormData(prev => ({...prev, status_avaliacao: 'Enviada'}));
                
                setTimeout(() => navigate(createPageUrl('TodasAvaliacoesAIC')), 2500);

            } else {
                setFormData(prev => ({...prev, status_avaliacao: 'Rascunho'}));
            }

        } catch (error) {
            console.error(`Erro ao ${status === 'Enviada' ? 'enviar' : 'salvar'} avaliação:`, error);
            toast.error(`Ocorreu um erro ao ${status === 'Enviada' ? 'enviar' : 'salvar'} a avaliação.`);
        } finally {
            setLoading(false);
        }
    };

    const usuariosDoSetor = useMemo(() => {
        if (!formData.setor) return [];
        
        if (currentUser?.cargo === 'gestor' && !isGestorAcessoTodosSetores(currentUser)) {
            return usuarios.filter(u => 
                u.setor === formData.setor && 
                u.gestores_responsaveis?.includes(currentUser.email)
            );
        }
        
        return usuarios.filter(u => u.setor === formData.setor);
    }, [formData.setor, usuarios, currentUser]);

    const isFormDisabled = formData.status_avaliacao === 'Enviada';
    
    const canSendEvaluation = avaliacaoId 
        ? (formData.remetente_email_original === currentUser?.email || isAdminGlobal(currentUser))
        : true;
    
    const isSetorLocked = false;

    if (loading || !currentUser) return <div className="p-8 text-center">Carregando...</div>;

    return (
        <div className="p-4 md:p-8 bg-slate-50 dark:bg-gray-900 min-h-screen">
            <Toaster richColors position="top-center" />
            <div className="max-w-5xl mx-auto animate-in fade-in-50">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
                        <FileText className="w-8 h-8 text-blue-600" />
                        Avaliação A.I.C
                    </h1>
                    <p className="text-slate-500 dark:text-gray-400 mt-1">
                        Análise Individual do Colaborador para registro de desempenho dos colaboradores.
                    </p>
                    {avaliacaoId && formData.remetente_email_original && formData.remetente_email_original !== currentUser?.email && (
                        <div className="mt-3 p-3 bg-blue-50 border-l-4 border-blue-500 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200 text-sm rounded-r-lg">
                            <p className="font-semibold">⚠️ Avaliação criada por: {formData.remetente_nome_original}</p>
                            <p className="text-xs mt-1">Você está visualizando/editando como Administrador Global. Ao enviar, o autor original será mantido.</p>
                        </div>
                    )}
                </header>

                <fieldset disabled={isFormDisabled} className="space-y-6">
                    <Card className="shadow-lg rounded-xl">
                        <CardHeader className="border-b border-slate-200">
                            <CardTitle className="text-lg font-semibold text-slate-800">Identificação</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="space-y-1.5">
                                <Label htmlFor="setor" className="flex items-center gap-2 text-sm font-medium text-slate-600"><Building className="w-4 h-4" />Setor</Label>
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
                                {currentUser?.cargo === 'gestor' && setoresDisponiveis.length > 0 && (
                                    <p className="text-xs text-slate-500 mt-1">
                                        Você pode avaliar colaboradores dos setores: {setoresDisponiveis.join(', ')}
                                    </p>
                                )}
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="colaborador" className="flex items-center gap-2 text-sm font-medium text-slate-600"><UserIcon className="w-4 h-4" />Colaborador</Label>
                                <Select value={formData.colaborador_email} onValueChange={(value) => handleInputChange('colaborador_email', value)} disabled={!formData.setor}>
                                    <SelectTrigger id="colaborador"><SelectValue placeholder="Selecione um colaborador" /></SelectTrigger>
                                    <SelectContent>{usuariosDoSetor.map(u => <SelectItem key={u.email} value={u.email}>{u.full_name}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="cargo" className="flex items-center gap-2 text-sm font-medium text-slate-600"><Briefcase className="w-4 h-4" />Cargo</Label>
                                <Input id="cargo" value={formData.cargo} onChange={(e) => handleInputChange('cargo', e.target.value)} placeholder="Digite o cargo funcional" />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="funcao" className="flex items-center gap-2 text-sm font-medium text-slate-600"><Briefcase className="w-4 h-4" />Função</Label>
                                <Input id="funcao" value={formData.funcao} onChange={(e) => handleInputChange('funcao', e.target.value)} placeholder="Digite a função do colaborador" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="flex items-center gap-2 text-sm font-medium text-slate-600"><UserIcon className="w-4 h-4" />Avaliador</Label>
                                <Input value={formData.remetente_nome_original || currentUser?.full_name || ''} disabled className="bg-slate-100 dark:bg-gray-800" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="flex items-center gap-2 text-sm font-medium text-slate-600"><Calendar className="w-4 h-4" />Data</Label>
                                <Input value={new Date().toLocaleDateString('pt-BR')} disabled className="bg-slate-100 dark:bg-gray-800" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-lg rounded-xl">
                        <CardHeader className="border-b border-slate-200">
                            <CardTitle className="text-lg font-semibold text-slate-800">Quadro de Avaliação de Competências</CardTitle>
                            <div className="w-16 h-1 bg-blue-600 rounded-full mt-1"></div>
                            <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border-l-4 border-blue-600">
                                <div className="flex items-start gap-3">
                                    <Award className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                                    <div className="text-sm space-y-2">
                                        <p className="font-bold text-blue-900 dark:text-blue-100 text-base">💡 Sistema de Pesos na Avaliação</p>
                                        <div className="space-y-1 text-blue-800 dark:text-blue-200">
                                            <p><strong>Produtividade = Peso 2</strong> (impacto dobrado na média final)</p>
                                            <p><strong>Demais competências = Peso 1</strong> (impacto normal)</p>
                                        </div>
                                        <div className="mt-3 p-3 bg-white/50 dark:bg-gray-800/50 rounded border border-blue-200 dark:border-blue-800">
                                            <p className="font-semibold text-blue-900 dark:text-blue-100 mb-1">Exemplo de cálculo:</p>
                                            <p className="text-xs text-blue-700 dark:text-blue-300">
                                                Produtividade: 5 | Conduta: 3 | Engajamento: 4
                                            </p>
                                            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                                                Média = <strong>(5×2) + 3 + 4</strong> ÷ <strong>(2+1+1)</strong> = <strong>17 ÷ 4 = 4.25</strong>
                                            </p>
                                            <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 italic">
                                                ⚠️ Nota alta em Produtividade eleva muito o resultado. Nota baixa reduz em dobro.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="text-xs text-slate-500 uppercase">
                                        <tr>
                                            <th scope="col" className="px-4 py-3 text-left">Competência</th>
                                            {[1, 2, 3, 4, 5].map(n => <th key={n} scope="col" className="px-4 py-3 text-center font-semibold">{n}</th>)}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {competencias.map(comp => (
                                            <tr key={comp.id} className={cn(
                                                "border-b border-slate-200 dark:border-gray-700",
                                                comp.destaque && "bg-blue-50 dark:bg-blue-900/10"
                                            )}>
                                                <th scope="row" className="px-4 py-4 text-slate-700 whitespace-nowrap dark:text-white">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold">{comp.nome}</span>
                                                        {comp.destaque && (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-600 text-white text-xs font-bold rounded-full">
                                                                <Award className="w-3 h-3" />
                                                                PESO {comp.peso}
                                                            </span>
                                                        )}
                                                    </div>
                                                </th>
                                                {[1, 2, 3, 4, 5].map(n => (
                                                    <td key={n} className="px-4 py-4 text-center">
                                                        <div className="flex justify-center">
                                                          <input 
                                                              type="radio" 
                                                              name={`nota_${comp.id}`} 
                                                              value={n} 
                                                              id={`nota_${comp.id}_${n}`}
                                                              checked={formData[`nota_${comp.id}`] === n} 
                                                              onChange={(e) => handleNotaChange(comp.id, e.target.value)} 
                                                              className="sr-only peer"
                                                          />
                                                          <label 
                                                              htmlFor={`nota_${comp.id}_${n}`} 
                                                              className={cn(
                                                                  "w-6 h-6 rounded-full border-2 cursor-pointer transition-all",
                                                                  "hover:border-blue-400",
                                                                  comp.destaque 
                                                                      ? "border-blue-400 peer-checked:bg-blue-600 peer-checked:border-blue-600 peer-checked:ring-2 peer-checked:ring-blue-300 peer-checked:ring-offset-2"
                                                                      : "border-slate-300 peer-checked:bg-blue-600 peer-checked:border-blue-600 peer-checked:ring-2 peer-checked:ring-blue-300 peer-checked:ring-offset-2"
                                                              )}
                                                          ></label>
                                                        </div>
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            
                            {(formData.nota_produtividade !== null || formData.nota_conduta !== null || formData.nota_engajamento !== null) && (
                                <div className="mt-4 p-4 bg-slate-100 dark:bg-gray-800 rounded-lg border border-slate-300 dark:border-gray-700">
                                    <h5 className="font-semibold text-slate-700 dark:text-slate-200 text-sm mb-2">📊 Cálculo da Média em Tempo Real:</h5>
                                    <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                                        {formData.nota_produtividade !== null && (
                                            <p>
                                                <strong className="text-blue-600">Produtividade:</strong> {formData.nota_produtividade} × 2 = <strong>{formData.nota_produtividade * 2}</strong> pontos
                                            </p>
                                        )}
                                        {formData.nota_conduta !== null && (
                                            <p>
                                                <strong>Conduta Pessoal:</strong> {formData.nota_conduta} × 1 = <strong>{formData.nota_conduta}</strong> pontos
                                            </p>
                                        )}
                                        {formData.nota_engajamento !== null && (
                                            <p>
                                                <strong>Engajamento:</strong> {formData.nota_engajamento} × 1 = <strong>{formData.nota_engajamento}</strong> pontos
                                            </p>
                                        )}
                                        <div className="border-t border-slate-300 dark:border-gray-600 pt-2 mt-2">
                                            <p className="font-semibold text-slate-700 dark:text-slate-200">
                                                Soma Ponderada: {
                                                    (formData.nota_produtividade !== null ? formData.nota_produtividade * 2 : 0) +
                                                    (formData.nota_conduta !== null ? formData.nota_conduta : 0) +
                                                    (formData.nota_engajamento !== null ? formData.nota_engajamento : 0)
                                                } pontos ÷ {
                                                    (formData.nota_produtividade !== null ? 2 : 0) +
                                                    (formData.nota_conduta !== null ? 1 : 0) +
                                                    (formData.nota_engajamento !== null ? 1 : 0)
                                                } pesos = <strong className="text-blue-600">{mediaFinal.toFixed(2)}</strong>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="mt-6 p-4 border border-slate-200 rounded-lg bg-slate-50 dark:bg-gray-800">
                                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                                    <h4 className="font-bold text-slate-700">Resultado Final</h4>
                                    <div className="flex flex-wrap gap-2 items-center">
                                        {legendaNotas.map(item => (
                                            <div key={item.nota} className="flex items-center gap-1">
                                                <div className={cn("w-3 h-3 rounded-full", item.color)}></div>
                                                <span className="text-xs text-slate-600">{item.nota}: {item.texto}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <p className={cn("text-2xl font-bold mt-1", resultadoFinalDisplay.color)}>
                                    {resultadoFinalDisplay.mainText}
                                </p>
                                {resultadoFinalDisplay.subText && (
                                    <p className="text-sm text-slate-600 mt-1 italic">{resultadoFinalDisplay.subText}</p>
                                )}
                                {resultadoFinalDisplay.showPDI && (
                                    <div className="mt-3 p-3 bg-amber-100 border-l-4 border-amber-500 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200 text-sm rounded-r-lg flex items-start gap-3">
                                        <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="font-bold">Recomendação de PDI</p>
                                            <p>O resultado "Não atende" indica a necessidade de um Plano de Desenvolvimento Individual para acompanhamento e melhoria do desempenho.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-lg rounded-xl">
                         <CardHeader className="border-b border-slate-200">
                             <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white">Para uso do gestor – Aprovação/Observações</CardTitle>
                         </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div>
                                <Label htmlFor="observacoes" className="text-base font-semibold">Observações</Label>
                                <Textarea 
                                    id="observacoes"
                                    value={formData.observacoes} 
                                    onChange={(e) => handleInputChange('observacoes', e.target.value)} 
                                    placeholder="Digite aqui suas observações, pontos de melhoria e próximos passos..." 
                                    rows={5} 
                                    className="focus:ring-2 focus:ring-blue-300 mt-2"
                                />
                            </div>

                            <FileUploadSection
                                arquivos={formData.arquivos}
                                onArquivosChange={(arquivos) => handleInputChange('arquivos', arquivos)}
                                disabled={isFormDisabled}
                            />

                            {!isFormDisabled && (
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
                            )}
                        </CardContent>
                    </Card>
                </fieldset>

                {!isFormDisabled && (
                    <div className="mt-8 flex justify-end gap-4">
                         <Button onClick={() => handleSave('Rascunho')} disabled={loading} size="lg" variant="outline" className="bg-slate-100 hover:bg-slate-200 text-slate-700">
                             <Save className="w-4 h-4 mr-2" />
                             {loading ? 'Salvando...' : 'Salvar Rascunho'}
                        </Button>
                        {canSendEvaluation && (
                            <Button 
                                onClick={() => handleSave('Enviada')} 
                                disabled={loading} 
                                size="lg" 
                                className="bg-blue-700 hover:bg-blue-800 text-white group"
                            >
                                <Send className="w-4 h-4 mr-2 transition-transform group-hover:-rotate-12" />
                                {loading ? 'Enviando...' : 'Enviar Avaliação'}
                            </Button>
                        )}
                    </div>
                )}
                 {isFormDisabled && (
                     <div className="mt-8 text-center p-4 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded-lg shadow-inner">
                        Esta avaliação foi enviada e está bloqueada para edição.
                    </div>
                 )}
            </div>
        </div>
    );
}
