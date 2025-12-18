
import React, { useState } from "react";
import { Feedback } from "@/api/entities";
import { SendEmail } from "@/api/integrations";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, Send, AlertTriangle, CheckCircle } from "lucide-react";

export default function ReenviarEmailModal({ isOpen, onClose, feedback }) {
    const [reenviando, setReenviando] = useState(false);
    const [resultado, setResultado] = useState("");

    const criarTemplateEmail = (feedback) => {
        const dataAtual = new Date();
        const dataFormatada = dataAtual.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const classificacaoTexto = {
            'boa': '✅ Feedback Positivo',
            'media': '⚠️ Feedback Construtivo', 
            'ruim': '❌ Feedback de Melhoria'
        }[feedback.classificacao];

        return {
            subject: `Nova Avaliação Recebida - ${feedback.titulo}`,
            body: `
Olá, ${feedback.destinatario_nome || 'Colaborador'},

Você recebeu uma nova avaliação através do sistema de Avaliações da empresa.

═════════════════════════════════════════

📋 DETALHES DA AVALIAÇÃO

Título: ${feedback.titulo}
Classificação: ${classificacaoTexto}
Nota: ${feedback.nota}/5.0
Data de Envio: ${dataFormatada}

📝 DESCRIÇÃO:
${feedback.descricao}

═════════════════════════════════════════

Esta avaliação foi registrada de forma anônima por um membro da equipe de gestão para contribuir com seu desenvolvimento profissional.

📧 Este é um e-mail automático do sistema. 
🔒 CONFIDENCIAL: Este e-mail contém informações confidenciais destinadas exclusivamente ao destinatário mencionado.

Atenciosamente,
Equipe de Gestão
            `.trim()
        };
    };

    const handleReenviar = async () => {
        setReenviando(true);
        setResultado("");
        
        try {
            const emailTemplate = criarTemplateEmail(feedback);
            
            await SendEmail({
                from_name: "Sistema de Avaliações",
                to: feedback.destinatario_email,
                subject: emailTemplate.subject,
                body: emailTemplate.body
            });

            await Feedback.update(feedback.id, { 
                status_email: 'enviado',
                motivo_falha_email: null 
            });
            
            setResultado("success");
            setTimeout(() => {
                onClose();
                window.location.reload(); // Recarregar para atualizar a lista
            }, 2000);
            
        } catch (error) {
            console.error("Erro no reenvio:", error);
            
            await Feedback.update(feedback.id, { 
                status_email: 'falha',
                motivo_falha_email: error.message || "Erro no reenvio manual" 
            });
            
            setResultado("error");
        }
        
        setReenviando(false);
    };

    if (!feedback) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Mail className="w-5 h-5 text-blue-600" />
                        Reenviar E-mail de Avaliação
                    </DialogTitle>
                    <DialogDescription>
                        Tentar enviar novamente o e-mail para {feedback.destinatario_nome} ({feedback.destinatario_email})
                    </DialogDescription>
                </DialogHeader>
                
                <div className="py-4">
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mb-4">
                        <h4 className="font-semibold mb-2">Detalhes da Avaliação:</h4>
                        <p><strong>Título:</strong> {feedback.titulo}</p>
                        <p><strong>Nota:</strong> {feedback.nota}/5.0</p>
                        <p><strong>Status Atual:</strong> 
                            <span className={`ml-2 px-2 py-1 rounded text-xs ${
                                feedback.status_email === 'falha' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                                {feedback.status_email === 'falha' ? 'Falha no Envio' : 'Pendente'}
                            </span>
                        </p>
                        {feedback.motivo_falha_email && (
                            <p className="text-sm text-red-600 mt-2">
                                <strong>Erro:</strong> {feedback.motivo_falha_email}
                            </p>
                        )}
                    </div>

                    {resultado === "success" && (
                        <Alert className="bg-green-50 border-green-200">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <AlertDescription className="text-green-800">
                                E-mail reenviado com sucesso!
                            </AlertDescription>
                        </Alert>
                    )}

                    {resultado === "error" && (
                        <Alert className="bg-red-50 border-red-200">
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                            <AlertDescription className="text-red-800">
                                Falha no reenvio. Verifique o endereço de e-mail e tente novamente.
                            </AlertDescription>
                        </Alert>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={reenviando}>
                        Cancelar
                    </Button>
                    <Button onClick={handleReenviar} disabled={reenviando} className="bg-blue-600 hover:bg-blue-700">
                        {reenviando ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                Reenviando...
                            </>
                        ) : (
                            <>
                                <Send className="w-4 h-4 mr-2" />
                                Reenviar E-mail
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
