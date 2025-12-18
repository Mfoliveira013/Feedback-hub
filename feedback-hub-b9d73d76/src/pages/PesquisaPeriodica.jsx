import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast, Toaster } from "sonner";
import { FileText, Send, Users, Calendar, AlertCircle } from 'lucide-react';

const FORMULARIOS = {
  "7-15 dias": {
    titulo: "Pesquisa de Integração - 7 a 15 dias",
    nota_escala: "Para as questões que utilizam escala de 1 a 5, considere:\n1 = Muito baixo / Muito insatisfatório\n5 = Muito alto / Muito satisfatório",
    perguntas: [
      { 
        pergunta: "1. Adaptação ao ambiente de trabalho", 
        descricao: "Como você avalia sua adaptação ao ambiente de trabalho até o momento?",
        tipo: "escala_1_5" 
      },
      { 
        pergunta: "2. Integração com a equipe", 
        descricao: "Como você tem percebido sua integração e relacionamento inicial com a equipe?",
        tipo: "escala_1_5" 
      },
      { 
        pergunta: "3. Clareza das atividades", 
        descricao: "O quanto as atividades e responsabilidades do seu dia a dia estão claras para você?",
        tipo: "multipla_escolha",
        opcoes: ["Sim", "Parcialmente", "Ainda tenho dúvidas", "Não compreendi"]
      },
      { 
        pergunta: "4. Adaptação às rotinas/processos", 
        descricao: "Como você avalia sua adaptação às rotinas, fluxos e processos internos?",
        tipo: "escala_1_5" 
      },
      { 
        pergunta: "5. Atividades mais fáceis", 
        descricao: "Quais atividades você considera mais simples ou naturais de executar até agora?",
        tipo: "resposta_longa" 
      },
      { 
        pergunta: "6. Atividades mais desafiadoras", 
        descricao: "Quais atividades têm sido mais difíceis ou desafiadoras neste início?",
        tipo: "resposta_longa" 
      },
      { 
        pergunta: "7. Suporte recebido", 
        descricao: "Você sente que recebeu o suporte necessário durante sua adaptação?",
        tipo: "multipla_escolha",
        opcoes: ["Sim", "Em partes", "Não"]
      },
      { 
        pergunta: "8. Qualidade do processo de integração", 
        descricao: "Como você avalia a qualidade geral do processo de integração (onboarding)?",
        tipo: "escala_1_5" 
      },
      { 
        pergunta: "9. Possibilidade de esclarecer dúvidas", 
        descricao: "Com que frequência você tem espaço e abertura para tirar dúvidas?",
        tipo: "multipla_escolha",
        opcoes: ["Sempre", "Na maioria das vezes", "Às vezes", "Raramente"]
      },
      { 
        pergunta: "10. Bem-estar emocional", 
        descricao: "Como você descreveria seu bem-estar emocional durante este período inicial?",
        tipo: "resposta_longa" 
      },
      { 
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
        pergunta: "A) Clareza das responsabilidades", 
        descricao: "Você sente que suas responsabilidades e expectativas sobre o seu papel estão bem definidas?",
        tipo: "multipla_escolha",
        opcoes: ["Sim", "Parcialmente", "Não"]
      },
      { 
        pergunta: "B) Processos ainda não claros", 
        descricao: "Há algum processo do time ou da empresa que ainda não esteja totalmente claro para você?",
        tipo: "resposta_longa" 
      },
      { secao: "2. Desenvolvimento Técnico e Autonomia" },
      { 
        pergunta: "A) Autonomia", 
        descricao: "Como você avalia o nível de autonomia que possui hoje para executar suas atividades?",
        tipo: "multipla_escolha",
        opcoes: ["Alta", "Média", "Baixa"]
      },
      { 
        pergunta: "B) Habilidades a desenvolver", 
        descricao: "Quais competências técnicas ou comportamentais você acredita que precisa desenvolver neste momento?",
        tipo: "resposta_longa" 
      },
      { 
        pergunta: "C) Evolução técnica", 
        descricao: "Você percebe evolução técnica desde o início da sua atuação?",
        tipo: "multipla_escolha",
        opcoes: ["Sim", "Parcialmente", "Não"]
      },
      { secao: "3. Desempenho e Entregas" },
      { 
        pergunta: "A) Entregas recentes", 
        descricao: "Como você avalia a qualidade e consistência das suas entregas nas últimas semanas?",
        tipo: "resposta_longa" 
      },
      { 
        pergunta: "B) Fatores que dificultam", 
        descricao: "Quais fatores têm dificultado ou atrapalhado suas entregas recentemente?",
        tipo: "resposta_longa" 
      },
      { 
        pergunta: "C) Qualidade dos feedbacks", 
        descricao: "Você sente que está recebendo feedbacks claros e úteis para sua evolução?",
        tipo: "multipla_escolha",
        opcoes: ["Sim", "Às vezes", "Não"]
      },
      { secao: "4. Rotina, Processos e Eficiência" },
      { 
        pergunta: "A) Organização das tarefas", 
        descricao: "Você sente que consegue organizar bem suas tarefas e prioridades do dia a dia?",
        tipo: "multipla_escolha",
        opcoes: ["Sim", "Parcialmente", "Não"]
      },
      { 
        pergunta: "B) Processos que podem melhorar", 
        descricao: "Há algum processo interno que você acredita que poderia ser otimizado ou ajustado?",
        tipo: "resposta_longa" 
      },
      { secao: "5. Relação com a Equipe e Liderança" },
      { 
        pergunta: "A) Interação com a equipe", 
        descricao: "Como você avalia sua interação e relacionamento com a equipe?",
        tipo: "multipla_escolha",
        opcoes: ["Muito boa", "Boa", "Regular", "Ruim"]
      },
      { 
        pergunta: "B) Suporte da liderança", 
        descricao: "Você sente que recebe o suporte necessário da liderança para realizar seu trabalho?",
        tipo: "multipla_escolha",
        opcoes: ["Sim", "Parcialmente", "Não"]
      },
      { 
        pergunta: "C) Comunicação/alinhamento", 
        descricao: "Há algum ponto relacionado à comunicação ou alinhamento que você gostaria de destacar?",
        tipo: "resposta_longa" 
      },
      { secao: "6. Cultura, Motivação e Engajamento" },
      { 
        pergunta: "A) Alinhamento cultural", 
        descricao: "Você sente que está alinhado com a cultura e os valores da empresa?",
        tipo: "multipla_escolha",
        opcoes: ["Sim", "Parcialmente", "Ainda estou me adaptando"]
      },
      { 
        pergunta: "B) Motivação", 
        descricao: "Como você descreveria seu nível de motivação no momento?",
        tipo: "multipla_escolha",
        opcoes: ["Muito motivado", "Motivado", "Pouco motivado", "Desmotivado"]
      },
      { 
        pergunta: "C) Fatores que influenciam a motivação", 
        descricao: "Quais fatores têm impactado positivamente ou negativamente sua motivação?",
        tipo: "resposta_longa" 
      },
      { secao: "7. Próximos Passos" },
      { 
        pergunta: "Apoio necessário para evolução", 
        descricao: "Que tipo de apoio, recurso ou orientação você considera importante para continuar evoluindo?",
        tipo: "resposta_longa" 
      },
      { 
        pergunta: "Observações finais", 
        descricao: "Espaço aberto para qualquer comentário ou ponto adicional que considere relevante para melhorias em sua caminhada dentro da empresa.",
        tipo: "resposta_longa" 
      }
    ]
  }
};

const gerarEmailFormulario = (colaborador, tipoPesquisa, remetente, pesquisaId) => {
  const formulario = FORMULARIOS[tipoPesquisa];
  const baseURL = window.location.origin;
  const linkFormulario = `${baseURL}${createPageUrl('ResponderPesquisa')}?id=${pesquisaId}`;
  
  const perguntasHTML = formulario.perguntas.map((item, index) => {
    if (item.secao) {
      return `<h3 style="color: #000529; font-size: 16px; margin-top: 20px; margin-bottom: 10px;">${item.secao}</h3>`;
    }
    
    let inputHTML = '';
    
    switch (item.tipo) {
      case 'resposta_curta':
        inputHTML = `<input type="text" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;" placeholder="Sua resposta">`;
        break;
      case 'resposta_longa':
        inputHTML = `<textarea style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; min-height: 80px;" placeholder="Sua resposta"></textarea>`;
        break;
      case 'escala_1_5':
        inputHTML = `
          <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-top: 8px;">
            ${[1, 2, 3, 4, 5].map(num => `
              <label style="display: flex; align-items: center; gap: 5px;">
                <input type="radio" name="q${index}" value="${num}">
                <span>${num}</span>
              </label>
            `).join('')}
          </div>
        `;
        break;
      case 'multipla_escolha':
        inputHTML = `
          <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 8px;">
            ${item.opcoes.map(opcao => `
              <label style="display: flex; align-items: center; gap: 8px;">
                <input type="radio" name="q${index}" value="${opcao}">
                <span>${opcao}</span>
              </label>
            `).join('')}
          </div>
        `;
        break;
    }
    
    return `
      <div style="margin-bottom: 20px; padding: 15px; background: #f9fafc; border-radius: 6px;">
        <p style="font-weight: 600; color: #000529; margin-bottom: 8px;">${item.pergunta}</p>
        ${inputHTML}
      </div>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${formulario.titulo}</title>
    </head>
    <body style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f4f6f9; margin: 0; padding: 20px;">
      <div style="max-width: 700px; margin: 0 auto; background: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden;">
        <div style="background: #000529; color: #ffffff; text-align: center; padding: 30px;">
          <h1 style="margin: 0; font-size: 24px; font-weight: 600;">🟣 Nabarrete & Ferro Advogados</h1>
          <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">${formulario.titulo}</p>
        </div>
        
        <div style="padding: 30px;">
          <p style="font-size: 16px; color: #333; margin-bottom: 10px;">Olá, <strong>${colaborador.full_name}</strong>!</p>
          <p style="font-size: 14px; color: #666; margin-bottom: 25px;">
            Gostaríamos de conhecer sua experiência até o momento. Por favor, responda às perguntas abaixo com sinceridade. 
            Suas respostas nos ajudarão a melhorar continuamente nosso processo de integração.
          </p>
          
          <div style="background: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin-bottom: 25px; border-radius: 4px;">
            <p style="margin: 0; font-size: 13px; color: #1565c0;">
              <strong>📋 Instruções:</strong> Preencha o formulário abaixo e responda conforme sua experiência real. 
              Não há respostas certas ou erradas, queremos apenas entender como podemos apoiá-lo melhor.
            </p>
          </div>
          
          <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 30px 0 25px 0; border-radius: 4px;">
            <p style="margin: 0; font-size: 13px; color: #856404;">
              ⚠️ <strong>Importante:</strong> Para garantir que suas respostas sejam registradas corretamente no sistema, 
              clique no botão abaixo para responder o formulário na plataforma.
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${linkFormulario}" 
               style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); 
                      color: white; padding: 16px 48px; text-decoration: none; border-radius: 8px; 
                      font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(37, 99, 235, 0.3);
                      transition: all 0.3s ease;">
              📋 Responder Formulário
            </a>
          </div>
          
          <div style="text-align: center; margin-top: 20px;">
            <p style="font-size: 12px; color: #888;">
              Ou copie e cole este link no seu navegador:<br>
              <a href="${linkFormulario}" style="color: #2563eb; word-break: break-all;">${linkFormulario}</a>
            </p>
          </div>
        </div>
        
        <div style="text-align: center; font-size: 12px; color: #777; padding: 20px; border-top: 1px solid #eee; background: #fafafa;">
          Esta é uma mensagem automática do setor de RH.<br>
          © ${new Date().getFullYear()} Nabarrete & Ferro Advogados Associados. Todos os direitos reservados.
        </div>
      </div>
    </body>
    </html>
  `;
};

export default function PesquisaPeriodica() {
  const [currentUser, setCurrentUser] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [colaboradorSelecionado, setColaboradorSelecionado] = useState('');
  const [tipoPesquisa, setTipoPesquisa] = useState('');
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);

        // Verifica se o usuário tem permissão
        const isRH = user.email === 'edielwinicius@nefadv.com.br';
        const isAdminGeral = ['mfo.oliveira0013@gmail.com', 'gabrielcarvalho@nefadv.com.br'].includes(user.email);
        
        if (!isRH && !isAdminGeral) {
          toast.error("Acesso Negado", {
            description: "Apenas RH e Administrador Geral podem acessar esta página."
          });
          return;
        }

        // Carrega todos os usuários
        const allUsers = await base44.entities.User.list();
        setUsuarios(allUsers.filter(u => u.email !== user.email));
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        toast.error("Erro ao carregar dados do sistema");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleEnviarFormulario = async () => {
    if (!colaboradorSelecionado || !tipoPesquisa) {
      toast.error("Preencha todos os campos", {
        description: "Selecione um colaborador e o tipo de pesquisa"
      });
      return;
    }

    setEnviando(true);

    try {
      const colaborador = usuarios.find(u => u.email === colaboradorSelecionado);
      
      // Cria registro da pesquisa
      const pesquisaData = {
        destinatario_email: colaborador.email,
        destinatario_nome: colaborador.full_name,
        destinatario_setor: colaborador.setor,
        remetente_email: currentUser.email,
        remetente_nome: currentUser.full_name,
        tipo_pesquisa: tipoPesquisa,
        data_envio: new Date().toISOString(),
        status_email: 'pendente'
      };

      const pesquisa = await base44.entities.PesquisaPeriodica.create(pesquisaData);

      // Envia o email
      const emailHTML = gerarEmailFormulario(colaborador, tipoPesquisa, currentUser, pesquisa.id);
      
      await base44.integrations.Core.SendEmail({
        from_name: "RH - Nabarrete & Ferro Advogados",
        to: colaborador.email,
        subject: `Pesquisa de Integração - ${tipoPesquisa}`,
        body: emailHTML
      });

      // Atualiza status
      await base44.entities.PesquisaPeriodica.update(pesquisa.id, {
        status_email: 'enviado'
      });

      toast.success("Formulário enviado com sucesso!", {
        description: `Email enviado para ${colaborador.full_name}`
      });

      // Limpa o formulário
      setColaboradorSelecionado('');
      setTipoPesquisa('');

    } catch (error) {
      console.error("Erro ao enviar formulário:", error);
      toast.error("Falha ao enviar formulário", {
        description: error.message
      });
    } finally {
      setEnviando(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Carregando...</div>;
  }

  if (!currentUser) {
    return <div className="p-8 text-center">Erro ao carregar usuário</div>;
  }

  const isRH = currentUser.email === 'edielwinicius@nefadv.com.br';
  const isAdminGeral = ['mfo.oliveira0013@gmail.com', 'gabrielcarvalho@nefadv.com.br'].includes(currentUser.email);

  if (!isRH && !isAdminGeral) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Acesso Negado</h2>
            <p className="text-gray-600">
              Esta página é exclusiva para RH e Administrador Geral.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const colaborador = usuarios.find(u => u.email === colaboradorSelecionado);

  return (
    <div className="p-6 md:p-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <Toaster richColors position="top-center" />
      
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center justify-center gap-3">
            <FileText className="w-8 h-8 text-blue-600" />
            Pesquisa Periódica
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Envie formulários de integração para colaboradores
          </p>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="border-b border-gray-200">
            <CardTitle>Enviar Formulário de Pesquisa</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="colaborador" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Selecionar Colaborador
              </Label>
              <Select value={colaboradorSelecionado} onValueChange={setColaboradorSelecionado}>
                <SelectTrigger id="colaborador">
                  <SelectValue placeholder="Escolha um colaborador" />
                </SelectTrigger>
                <SelectContent>
                  {usuarios.map(user => (
                    <SelectItem key={user.email} value={user.email}>
                      {user.full_name} - {user.setor || 'Sem setor'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {colaboradorSelecionado && (
              <div className="space-y-2 animate-in fade-in-50">
                <Label htmlFor="tipo-pesquisa" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Tipo de Pesquisa
                </Label>
                <Select value={tipoPesquisa} onValueChange={setTipoPesquisa}>
                  <SelectTrigger id="tipo-pesquisa">
                    <SelectValue placeholder="Escolha a periodicidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7-15 dias">7-15 dias (Onboarding Inicial)</SelectItem>
                    <SelectItem value="45-90 dias">45-90 dias (Onboarding Intermediário)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {colaboradorSelecionado && tipoPesquisa && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 animate-in fade-in-50">
                <p className="text-sm text-blue-900 dark:text-blue-200">
                  <strong>📧 Resumo do envio:</strong>
                </p>
                <ul className="mt-2 space-y-1 text-sm text-blue-800 dark:text-blue-300">
                  <li>• <strong>Para:</strong> {colaborador?.full_name} ({colaborador?.email})</li>
                  <li>• <strong>Setor:</strong> {colaborador?.setor || 'Não definido'}</li>
                  <li>• <strong>Tipo:</strong> {tipoPesquisa}</li>
                  <li>• <strong>Perguntas:</strong> {FORMULARIOS[tipoPesquisa].perguntas.filter(p => p.pergunta).length} perguntas</li>
                </ul>
              </div>
            )}

            <div className="pt-4">
              <Button
                onClick={handleEnviarFormulario}
                disabled={!colaboradorSelecionado || !tipoPesquisa || enviando}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                size="lg"
              >
                {enviando ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Enviar Formulário
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Informações sobre os Formulários</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div>
                <h4 className="font-semibold text-blue-600 mb-1">📋 Formulário 7-15 dias</h4>
                <p className="text-gray-600 dark:text-gray-400">
                  Avalia a adaptação inicial do colaborador ao ambiente, equipe e atividades. 
                  Contém 13 perguntas focadas em integração e bem-estar.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-blue-600 mb-1">📋 Formulário 45-90 dias</h4>
                <p className="text-gray-600 dark:text-gray-400">
                  Avalia autonomia, desenvolvimento técnico, desempenho e alinhamento cultural. 
                  Formulário mais detalhado com seções específicas sobre crescimento profissional.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}