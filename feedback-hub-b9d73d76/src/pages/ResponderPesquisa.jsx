import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast, Toaster } from "sonner";
import { FileText, Send, CheckCircle2 } from 'lucide-react';

const FORMULARIOS = {
  "7-15 dias": {
    titulo: "Pesquisa de Integração - 7 a 15 dias",
    nota_escala: "Para as questões que utilizam escala de 1 a 5, considere:\n1 = Muito baixo / Muito insatisfatório\n5 = Muito alto / Muito satisfatório",
    perguntas: [
      { 
        id: "adaptacao_ambiente",
        pergunta: "1. Adaptação ao ambiente de trabalho", 
        descricao: "Como você avalia sua adaptação ao ambiente de trabalho até o momento?",
        tipo: "escala_1_5" 
      },
      { 
        id: "integracao_equipe",
        pergunta: "2. Integração com a equipe", 
        descricao: "Como você tem percebido sua integração e relacionamento inicial com a equipe?",
        tipo: "escala_1_5" 
      },
      { 
        id: "clareza_atividades",
        pergunta: "3. Clareza das atividades", 
        descricao: "O quanto as atividades e responsabilidades do seu dia a dia estão claras para você?",
        tipo: "multipla_escolha",
        opcoes: ["Sim", "Parcialmente", "Ainda tenho dúvidas", "Não compreendi"]
      },
      { 
        id: "adaptacao_rotinas",
        pergunta: "4. Adaptação às rotinas/processos", 
        descricao: "Como você avalia sua adaptação às rotinas, fluxos e processos internos?",
        tipo: "escala_1_5" 
      },
      { 
        id: "atividades_faceis",
        pergunta: "5. Atividades mais fáceis", 
        descricao: "Quais atividades você considera mais simples ou naturais de executar até agora?",
        tipo: "resposta_longa" 
      },
      { 
        id: "atividades_desafiadoras",
        pergunta: "6. Atividades mais desafiadoras", 
        descricao: "Quais atividades têm sido mais difíceis ou desafiadoras neste início?",
        tipo: "resposta_longa" 
      },
      { 
        id: "suporte_recebido",
        pergunta: "7. Suporte recebido", 
        descricao: "Você sente que recebeu o suporte necessário durante sua adaptação?",
        tipo: "multipla_escolha",
        opcoes: ["Sim", "Em partes", "Não"]
      },
      { 
        id: "qualidade_integracao",
        pergunta: "8. Qualidade do processo de integração", 
        descricao: "Como você avalia a qualidade geral do processo de integração (onboarding)?",
        tipo: "escala_1_5" 
      },
      { 
        id: "esclarecer_duvidas",
        pergunta: "9. Possibilidade de esclarecer dúvidas", 
        descricao: "Com que frequência você tem espaço e abertura para tirar dúvidas?",
        tipo: "multipla_escolha",
        opcoes: ["Sempre", "Na maioria das vezes", "Às vezes", "Raramente"]
      },
      { 
        id: "bem_estar",
        pergunta: "10. Bem-estar emocional", 
        descricao: "Como você descreveria seu bem-estar emocional durante este período inicial?",
        tipo: "resposta_longa" 
      },
      { 
        id: "sugestoes",
        pergunta: "11. Sugestões e comentários", 
        descricao: "Espaço aberto para registrar qualquer sugestão, ponto de atenção ou comentário adicional.",
        tipo: "resposta_longa" 
      }
    ]
  },
  "45-90 dias": {
    titulo: "Pesquisa de Integração - 45 a 90 dias",
    perguntas: [
      { secao: "1. Compreensão do Papel e do Negócio" },
      { 
        id: "clareza_responsabilidades",
        pergunta: "A) Clareza das responsabilidades", 
        descricao: "Você sente que suas responsabilidades e expectativas sobre o seu papel estão bem definidas?",
        tipo: "multipla_escolha",
        opcoes: ["Sim", "Parcialmente", "Não"]
      },
      { 
        id: "processos_nao_claros",
        pergunta: "B) Processos ainda não claros", 
        descricao: "Há algum processo do time ou da empresa que ainda não esteja totalmente claro para você?",
        tipo: "resposta_longa" 
      },
      { secao: "2. Desenvolvimento Técnico e Autonomia" },
      { 
        id: "autonomia",
        pergunta: "A) Autonomia", 
        descricao: "Como você avalia o nível de autonomia que possui hoje para executar suas atividades?",
        tipo: "multipla_escolha",
        opcoes: ["Alta", "Média", "Baixa"]
      },
      { 
        id: "habilidades_desenvolver",
        pergunta: "B) Habilidades a desenvolver", 
        descricao: "Quais competências técnicas ou comportamentais você acredita que precisa desenvolver neste momento?",
        tipo: "resposta_longa" 
      },
      { 
        id: "evolucao_tecnica",
        pergunta: "C) Evolução técnica", 
        descricao: "Você percebe evolução técnica desde o início da sua atuação?",
        tipo: "multipla_escolha",
        opcoes: ["Sim", "Parcialmente", "Não"]
      },
      { secao: "3. Desempenho e Entregas" },
      { 
        id: "entregas_recentes",
        pergunta: "A) Entregas recentes", 
        descricao: "Como você avalia a qualidade e consistência das suas entregas nas últimas semanas?",
        tipo: "resposta_longa" 
      },
      { 
        id: "fatores_dificultam",
        pergunta: "B) Fatores que dificultam", 
        descricao: "Quais fatores têm dificultado ou atrapalhado suas entregas recentemente?",
        tipo: "resposta_longa" 
      },
      { 
        id: "qualidade_feedbacks",
        pergunta: "C) Qualidade dos feedbacks", 
        descricao: "Você sente que está recebendo feedbacks claros e úteis para sua evolução?",
        tipo: "multipla_escolha",
        opcoes: ["Sim", "Às vezes", "Não"]
      },
      { secao: "4. Rotina, Processos e Eficiência" },
      { 
        id: "organizacao_tarefas",
        pergunta: "A) Organização das tarefas", 
        descricao: "Você sente que consegue organizar bem suas tarefas e prioridades do dia a dia?",
        tipo: "multipla_escolha",
        opcoes: ["Sim", "Parcialmente", "Não"]
      },
      { 
        id: "processos_melhorar",
        pergunta: "B) Processos que podem melhorar", 
        descricao: "Há algum processo interno que você acredita que poderia ser otimizado ou ajustado?",
        tipo: "resposta_longa" 
      },
      { secao: "5. Relação com a Equipe e Liderança" },
      { 
        id: "interacao_equipe",
        pergunta: "A) Interação com a equipe", 
        descricao: "Como você avalia sua interação e relacionamento com a equipe?",
        tipo: "multipla_escolha",
        opcoes: ["Muito boa", "Boa", "Regular", "Ruim"]
      },
      { 
        id: "suporte_lideranca",
        pergunta: "B) Suporte da liderança", 
        descricao: "Você sente que recebe o suporte necessário da liderança para realizar seu trabalho?",
        tipo: "multipla_escolha",
        opcoes: ["Sim", "Parcialmente", "Não"]
      },
      { 
        id: "comunicacao_alinhamento",
        pergunta: "C) Comunicação/alinhamento", 
        descricao: "Há algum ponto relacionado à comunicação ou alinhamento que você gostaria de destacar?",
        tipo: "resposta_longa" 
      },
      { secao: "6. Cultura, Motivação e Engajamento" },
      { 
        id: "alinhamento_cultural",
        pergunta: "A) Alinhamento cultural", 
        descricao: "Você sente que está alinhado com a cultura e os valores da empresa?",
        tipo: "multipla_escolha",
        opcoes: ["Sim", "Parcialmente", "Ainda estou me adaptando"]
      },
      { 
        id: "motivacao",
        pergunta: "B) Motivação", 
        descricao: "Como você descreveria seu nível de motivação no momento?",
        tipo: "multipla_escolha",
        opcoes: ["Muito motivado", "Motivado", "Pouco motivado", "Desmotivado"]
      },
      { 
        id: "fatores_motivacao",
        pergunta: "C) Fatores que influenciam a motivação", 
        descricao: "Quais fatores têm impactado positivamente ou negativamente sua motivação?",
        tipo: "resposta_longa" 
      },
      { secao: "7. Próximos Passos" },
      { 
        id: "apoio_necessario",
        pergunta: "Apoio necessário para evolução", 
        descricao: "Que tipo de apoio, recurso ou orientação você considera importante para continuar evoluindo?",
        tipo: "resposta_longa" 
      },
      { 
        id: "observacoes_finais",
        pergunta: "Observações finais", 
        descricao: "Espaço aberto para qualquer comentário ou ponto adicional que considere relevante para melhorias em sua caminhada dentro da empresa.",
        tipo: "resposta_longa" 
      }
    ]
  }
};

export default function ResponderPesquisa() {
  const [currentUser, setCurrentUser] = useState(null);
  const [pesquisa, setPesquisa] = useState(null);
  const [respostas, setRespostas] = useState({});
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [concluido, setConcluido] = useState(false);
  
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const pesquisaId = searchParams.get('id');

  useEffect(() => {
    const loadData = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);

        if (!pesquisaId) {
          toast.error("Link inválido ou expirado");
          setLoading(false);
          return;
        }

        const pesquisaData = await base44.entities.PesquisaPeriodica.get(pesquisaId);
        
        if (pesquisaData.destinatario_email !== user.email) {
          toast.error("Este formulário não foi enviado para você");
          setLoading(false);
          return;
        }

        // Verifica se já respondeu
        const respostasExistentes = await base44.entities.RespostaPesquisaPeriodica.filter({
          pesquisa_id: pesquisaId
        });

        if (respostasExistentes && respostasExistentes.length > 0) {
          toast.info("Você já respondeu este formulário");
          setConcluido(true);
        }

        setPesquisa(pesquisaData);
      } catch (error) {
        console.error("Erro ao carregar pesquisa:", error);
        toast.error("Erro ao carregar formulário");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [pesquisaId]);

  const handleRespostaChange = (perguntaId, valor) => {
    setRespostas(prev => ({
      ...prev,
      [perguntaId]: valor
    }));
  };

  const renderCampo = (item, index) => {
    if (item.secao) {
      return (
        <div key={`secao-${index}`} className="col-span-full mt-6 mb-2">
          <h3 className="text-lg font-semibold text-blue-700 dark:text-blue-400 border-b-2 border-blue-200 pb-2">
            {item.secao}
          </h3>
        </div>
      );
    }

    const valor = respostas[item.id] || '';

    return (
      <div key={item.id} className="space-y-2">
        <Label htmlFor={item.id} className="text-base font-medium">
          {item.pergunta}
        </Label>
        {item.descricao && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{item.descricao}</p>
        )}
        
        {item.tipo === 'resposta_curta' && (
          <Input
            id={item.id}
            value={valor}
            onChange={(e) => handleRespostaChange(item.id, e.target.value)}
            placeholder="Sua resposta"
            className="w-full"
          />
        )}

        {item.tipo === 'resposta_longa' && (
          <Textarea
            id={item.id}
            value={valor}
            onChange={(e) => handleRespostaChange(item.id, e.target.value)}
            placeholder="Sua resposta"
            rows={4}
            className="w-full"
          />
        )}

        {item.tipo === 'escala_1_5' && (
          <RadioGroup value={valor} onValueChange={(val) => handleRespostaChange(item.id, val)}>
            <div className="flex gap-4 flex-wrap">
              {[1, 2, 3, 4, 5].map(num => (
                <div key={num} className="flex items-center space-x-2">
                  <RadioGroupItem value={String(num)} id={`${item.id}-${num}`} />
                  <Label htmlFor={`${item.id}-${num}`} className="cursor-pointer">{num}</Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        )}

        {item.tipo === 'multipla_escolha' && (
          <RadioGroup value={valor} onValueChange={(val) => handleRespostaChange(item.id, val)}>
            <div className="space-y-2">
              {item.opcoes.map(opcao => (
                <div key={opcao} className="flex items-center space-x-2">
                  <RadioGroupItem value={opcao} id={`${item.id}-${opcao}`} />
                  <Label htmlFor={`${item.id}-${opcao}`} className="cursor-pointer">{opcao}</Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        )}
      </div>
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const formulario = FORMULARIOS[pesquisa.tipo_pesquisa];
    const perguntasObrigatorias = formulario.perguntas.filter(p => p.id && !p.secao);
    
    const respostasArray = perguntasObrigatorias.map(p => ({
      pergunta: p.pergunta,
      resposta: respostas[p.id] || ''
    }));

    setEnviando(true);

    try {
      // Salva resposta
      await base44.entities.RespostaPesquisaPeriodica.create({
        pesquisa_id: pesquisa.id,
        colaborador_email: currentUser.email,
        colaborador_nome: currentUser.full_name,
        tipo_pesquisa: pesquisa.tipo_pesquisa,
        remetente_email: pesquisa.remetente_email,
        remetente_nome: pesquisa.remetente_nome,
        respostas: respostasArray,
        data_resposta: new Date().toISOString(),
        status: "Concluída"
      });

      // Prepara email com respostas
      const respostasHTML = respostasArray.map((r, idx) => `
        <div style="margin-bottom: 20px; padding: 15px; background: #f9fafc; border-radius: 6px; border-left: 4px solid #000529;">
          <p style="font-weight: 600; color: #000529; margin-bottom: 8px;">${r.pergunta}</p>
          <p style="color: #333; white-space: pre-wrap;">${r.resposta || '<em style="color: #999;">Não respondido</em>'}</p>
        </div>
      `).join('');

      const emailHTML = `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <title>Resposta da Pesquisa Periódica</title>
        </head>
        <body style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f4f6f9; margin: 0; padding: 20px;">
          <div style="max-width: 800px; margin: 0 auto; background: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <div style="background: #000529; color: #ffffff; text-align: center; padding: 30px;">
              <h1 style="margin: 0; font-size: 24px;">🟣 Resposta da Pesquisa Periódica</h1>
            </div>
            
            <div style="padding: 30px;">
              <div style="background: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin-bottom: 25px; border-radius: 4px;">
                <p style="margin: 0; font-size: 14px; color: #1565c0;">
                  <strong>📋 Informações da Resposta</strong>
                </p>
                <p style="margin: 8px 0 0 0; font-size: 13px; color: #1976d2;">
                  <strong>Colaborador:</strong> ${currentUser.full_name}<br>
                  <strong>Email:</strong> ${currentUser.email}<br>
                  <strong>Setor:</strong> ${currentUser.setor || 'N/A'}<br>
                  <strong>Tipo de Pesquisa:</strong> ${pesquisa.tipo_pesquisa}<br>
                  <strong>Data de Resposta:</strong> ${new Date().toLocaleString('pt-BR')}
                </p>
              </div>
              
              <h2 style="color: #000529; font-size: 18px; margin-bottom: 20px;">Respostas do Formulário</h2>
              ${respostasHTML}
            </div>
            
            <div style="text-align: center; font-size: 12px; color: #777; padding: 20px; border-top: 1px solid #eee; background: #fafafa;">
              © ${new Date().getFullYear()} Nabarrete & Ferro Advogados Associados
            </div>
          </div>
        </body>
        </html>
      `;

      // Envia para RH
      await base44.integrations.Core.SendEmail({
        from_name: "Sistema de Pesquisa - N&F",
        to: pesquisa.remetente_email,
        subject: `Resposta: Pesquisa ${pesquisa.tipo_pesquisa} - ${currentUser.full_name}`,
        body: emailHTML
      });

      toast.success("Respostas enviadas com sucesso!", {
        description: "Obrigado por responder o formulário"
      });
      
      setConcluido(true);

    } catch (error) {
      console.error("Erro ao enviar respostas:", error);
      toast.error("Erro ao enviar respostas", {
        description: "Tente novamente mais tarde"
      });
    } finally {
      setEnviando(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Carregando formulário...</div>;
  }

  if (!pesquisa) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Formulário não encontrado</h2>
            <p className="text-gray-600">O link pode estar inválido ou expirado.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (concluido) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Formulário Concluído!</h2>
            <p className="text-gray-600">
              Obrigado por responder. Suas respostas foram enviadas para o RH.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formulario = FORMULARIOS[pesquisa.tipo_pesquisa];

  return (
    <div className="p-6 md:p-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <Toaster richColors position="top-center" />
      
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
            <FileText className="w-8 h-8 text-blue-600" />
            {formulario.titulo}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Por favor, responda às perguntas abaixo com sinceridade
          </p>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="border-b border-gray-200">
            <CardTitle>Formulário de Integração</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit}>
              {formulario.nota_escala && (
                <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-200 whitespace-pre-line font-medium">
                    <strong>Nota:</strong> {formulario.nota_escala}
                  </p>
                </div>
              )}
              <div className="grid grid-cols-1 gap-6">
                {formulario.perguntas.map((item, index) => renderCampo(item, index))}
              </div>

              <div className="mt-8 pt-6 border-t border-gray-200">
                <Button
                  type="submit"
                  disabled={enviando}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  size="lg"
                >
                  {enviando ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Enviando respostas...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Enviar Respostas
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