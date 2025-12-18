import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
    Mail, 
    Search, 
    AlertTriangle, 
    CheckCircle, 
    Clock, 
    Send, 
    RefreshCw,
    XCircle 
} from "lucide-react";
import { format } from "date-fns";

export default function DiagnosticoEmails() {
    const [currentUser, setCurrentUser] = useState(null);
    const [email, setEmail] = useState("beatriz.mayumi@extranef.com.br");
    const [avaliacoes, setAvaliacoes] = useState([]);
    const [usuario, setUsuario] = useState(null);
    const [buscando, setBuscando] = useState(false);
    const [reenviando, setReenviando] = useState(null);
    const [resultado, setResultado] = useState("");

    React.useEffect(() => {
        loadCurrentUser();
    }, []);

    const loadCurrentUser = async () => {
        try {
            const user = await base44.auth.me();
            setCurrentUser(user);
            
            // Apenas admins podem acessar
            if (user.cargo !== 'administrador') {
                alert("Acesso negado. Apenas administradores podem acessar esta página.");
                window.history.back();
            }
        } catch (error) {
            console.error("Erro ao carregar usuário:", error);
        }
    };

    const buscarAvaliacoes = async () => {
        if (!email) {
            alert("Digite um e-mail válido");
            return;
        }

        setBuscando(true);
        setResultado("");

        try {
            // Busca o usuário
            const usuarios = await base44.entities.User.filter({ email: email });
            if (usuarios.length === 0) {
                setResultado("error");
                alert("Usuário não encontrado no sistema.");
                setBuscando(false);
                return;
            }

            setUsuario(usuarios[0]);

            // Busca todas as avaliações para esse usuário
            const avaliacoesEncontradas = await base44.entities.Feedback.filter({
                destinatario_email: email
            }, "-created_date");

            setAvaliacoes(avaliacoesEncontradas);
            
            if (avaliacoesEncontradas.length === 0) {
                setResultado("warning");
            } else {
                setResultado("success");
            }
        } catch (error) {
            console.error("Erro ao buscar avaliações:", error);
            alert("Erro ao buscar dados. Tente novamente.");
            setResultado("error");
        }

        setBuscando(false);
    };

    const reenviarEmail = async (avaliacao) => {
        setReenviando(avaliacao.id);

        try {
            // Cria o template de e-mail
            const dataFormatada = new Date().toLocaleString('pt-BR', {
                day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
            });

            const formatarDescricao = (texto) => {
                if (!texto) return '';
                
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

            const descricaoFormatada = formatarDescricao(avaliacao.descricao);

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
                    .footer { text-align: center; font-size: 12px; color: #777777; padding: 20px; border-top: 1px solid #eeeeee; background: #fafafa; }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <div class="header">
                      <h1>🟣 Nabarrete & Ferro Advogados Associados</h1>
                    </div>
                    <div class="content">
                      <p>Prezado(a) <strong>${avaliacao.destinatario_nome || 'Colaborador'}</strong>,</p>
                      <p>Você recebeu uma nova avaliação registrada em nosso sistema interno. <strong>(REENVIO)</strong></p>
                      
                      <h2>🔹 Detalhes da Avaliação</h2>
                      <div class="feedback-box">
                        <p><strong>• Tipo:</strong> ${avaliacao.tipo_avaliacao ? avaliacao.tipo_avaliacao.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Feedback'}</p>
                        <p><strong>• Título:</strong> ${Array.isArray(avaliacao.titulo) ? avaliacao.titulo.join(', ') : avaliacao.titulo}</p>
                        <p><strong>• Classificação:</strong> ${avaliacao.classificacao} (${avaliacao.nota} / 5)</p>
                        <p><strong>• Data:</strong> ${dataFormatada}</p>
                      </div>
                      
                      <h2>📄 Descrição da Avaliação</h2>
                      <div class="descricao-box">
                        ${descricaoFormatada}
                      </div>
                      
                      <p style="margin-top: 24px; padding: 12px; background: #e8f4f8; border-left: 4px solid #0288d1; border-radius: 4px;">
                        <strong>ℹ️ Informação:</strong> Esta avaliação foi registrada de forma confidencial com o objetivo de contribuir para o seu desenvolvimento profissional.
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

            // Envia o e-mail
            await base44.integrations.Core.SendEmail({
                from_name: "Nabarrete & Ferro Advogados",
                to: email,
                subject: `(Reenvio) Nova Avaliação Recebida - ${Array.isArray(avaliacao.titulo) ? avaliacao.titulo.join(', ') : avaliacao.titulo}`,
                body: htmlBody
            });

            // Atualiza o status no banco
            await base44.entities.Feedback.update(avaliacao.id, {
                status_email: 'enviado',
                motivo_falha_email: null
            });

            alert("✅ E-mail reenviado com sucesso!");
            buscarAvaliacoes(); // Recarrega os dados

        } catch (error) {
            console.error("Erro ao reenviar e-mail:", error);
            
            // Atualiza o status de falha
            await base44.entities.Feedback.update(avaliacao.id, {
                status_email: 'falha',
                motivo_falha_email: `Falha no reenvio manual: ${error.message || 'Erro desconhecido'}`
            });

            alert(`❌ Falha ao reenviar: ${error.message || 'Erro desconhecido'}`);
            buscarAvaliacoes(); // Recarrega os dados
        }

        setReenviando(null);
    };

    const getStatusBadge = (status, motivo) => {
        switch (status) {
            case 'enviado':
                return (
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Enviado
                    </Badge>
                );
            case 'falha':
                return (
                    <div className="flex items-center gap-2">
                        <Badge className="bg-red-100 text-red-800 border-red-200">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Falha
                        </Badge>
                        {motivo && (
                            <span className="text-xs text-red-600" title={motivo}>
                                {motivo.substring(0, 50)}...
                            </span>
                        )}
                    </div>
                );
            case 'pendente':
                return (
                    <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                        <Clock className="w-3 h-3 mr-1" />
                        Pendente
                    </Badge>
                );
            default:
                return (
                    <Badge className="bg-gray-100 text-gray-800 border-gray-200">
                        <XCircle className="w-3 h-3 mr-1" />
                        Não enviado
                    </Badge>
                );
        }
    };

    if (!currentUser) {
        return <div className="p-8">Carregando...</div>;
    }

    return (
        <div className="p-6 md:p-8">
            <div className="max-w-7xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
                        <Mail className="w-8 h-8 text-blue-600" />
                        Diagnóstico de E-mails
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Verifique o status de envio de e-mails de avaliações para colaboradores específicos.
                    </p>
                </header>

                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>Buscar Avaliações por E-mail</CardTitle>
                        <CardDescription>
                            Digite o e-mail do colaborador para verificar todas as avaliações enviadas
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <Label htmlFor="email">E-mail do Colaborador</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="colaborador@exemplo.com"
                                    className="mt-1"
                                />
                            </div>
                            <Button 
                                onClick={buscarAvaliacoes} 
                                disabled={buscando}
                                className="self-end"
                            >
                                {buscando ? (
                                    <>
                                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                        Buscando...
                                    </>
                                ) : (
                                    <>
                                        <Search className="w-4 h-4 mr-2" />
                                        Buscar
                                    </>
                                )}
                            </Button>
                        </div>

                        {resultado === "success" && avaliacoes.length > 0 && (
                            <Alert className="mt-4 bg-green-50 border-green-200">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <AlertDescription className="text-green-800">
                                    ✅ {avaliacoes.length} avaliação(ões) encontrada(s) para {usuario?.full_name || email}
                                </AlertDescription>
                            </Alert>
                        )}

                        {resultado === "warning" && (
                            <Alert className="mt-4 bg-yellow-50 border-yellow-200">
                                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                                <AlertDescription className="text-yellow-800">
                                    ⚠️ Nenhuma avaliação encontrada para este e-mail
                                </AlertDescription>
                            </Alert>
                        )}
                    </CardContent>
                </Card>

                {avaliacoes.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Avaliações de {usuario?.full_name || email}</CardTitle>
                            <CardDescription>
                                Histórico completo de envios de e-mail
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {avaliacoes.map((avaliacao) => (
                                    <div 
                                        key={avaliacao.id} 
                                        className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h3 className="font-semibold text-lg">
                                                    {Array.isArray(avaliacao.titulo) ? avaliacao.titulo.join(', ') : avaliacao.titulo}
                                                </h3>
                                                <p className="text-sm text-gray-500">
                                                    Tipo: {avaliacao.tipo_avaliacao || 'Feedback'} • 
                                                    Data: {format(new Date(avaliacao.created_date), "dd/MM/yyyy HH:mm")}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {getStatusBadge(avaliacao.status_email, avaliacao.motivo_falha_email)}
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => reenviarEmail(avaliacao)}
                                                    disabled={reenviando === avaliacao.id}
                                                >
                                                    {reenviando === avaliacao.id ? (
                                                        <>
                                                            <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                                                            Enviando...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Send className="w-3 h-3 mr-1" />
                                                            Reenviar
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                        
                                        <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-900 rounded">
                                            <p className="text-sm text-gray-700 dark:text-gray-300">
                                                <strong>Nota:</strong> {avaliacao.nota}/5 • 
                                                <strong className="ml-2">Classificação:</strong> {avaliacao.classificacao}
                                            </p>
                                            {avaliacao.motivo_falha_email && (
                                                <p className="text-xs text-red-600 mt-2">
                                                    <strong>Motivo da falha:</strong> {avaliacao.motivo_falha_email}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}