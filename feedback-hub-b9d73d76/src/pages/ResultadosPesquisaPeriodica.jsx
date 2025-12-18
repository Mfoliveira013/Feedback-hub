import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast, Toaster } from "sonner";
import { FileText, Search, Calendar, User, Building } from 'lucide-react';
import { format } from 'date-fns';

export default function ResultadosPesquisaPeriodica() {
  const [currentUser, setCurrentUser] = useState(null);
  const [respostas, setRespostas] = useState([]);
  const [respostasFiltradas, setRespostasFiltradas] = useState([]);
  const [filtros, setFiltros] = useState({ busca: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);

        // Verifica permissão
        const isRH = user.email === 'edielwinicius@nefadv.com.br';
        const isAdminGeral = ['mfo.oliveira0013@gmail.com', 'gabrielcarvalho@nefadv.com.br'].includes(user.email);
        
        if (!isRH && !isAdminGeral) {
          toast.error("Acesso Negado", {
            description: "Apenas RH e Administrador Geral podem acessar esta página."
          });
          return;
        }

        const respostasData = await base44.entities.RespostaPesquisaPeriodica.list('-created_date', 1000);
        setRespostas(respostasData);
        setRespostasFiltradas(respostasData);
      } catch (error) {
        console.error("Erro ao carregar respostas:", error);
        toast.error("Erro ao carregar dados");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    if (filtros.busca) {
      const buscaLower = filtros.busca.toLowerCase();
      const filtradas = respostas.filter(r => 
        r.colaborador_nome?.toLowerCase().includes(buscaLower) ||
        r.colaborador_email?.toLowerCase().includes(buscaLower)
      );
      setRespostasFiltradas(filtradas);
    } else {
      setRespostasFiltradas(respostas);
    }
  }, [filtros, respostas]);

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
            <FileText className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Acesso Negado</h2>
            <p className="text-gray-600">
              Esta página é exclusiva para RH e Administrador Geral.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <Toaster richColors position="top-center" />
      
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
            <FileText className="w-8 h-8 text-blue-600" />
            Resultados das Pesquisas Periódicas
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Visualize todas as respostas dos formulários de integração
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <Label htmlFor="busca" className="flex items-center gap-2 mb-2">
                  <Search className="w-4 h-4" />
                  Buscar por colaborador
                </Label>
                <Input
                  id="busca"
                  value={filtros.busca}
                  onChange={(e) => setFiltros({ ...filtros, busca: e.target.value })}
                  placeholder="Nome ou email do colaborador"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6">
          {respostasFiltradas.length > 0 ? (
            respostasFiltradas.map((resposta) => (
              <Card key={resposta.id} className="shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="border-b border-gray-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl flex items-center gap-2">
                        <User className="w-5 h-5 text-blue-600" />
                        {resposta.colaborador_nome}
                      </CardTitle>
                      <div className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                        <p className="flex items-center gap-2">
                          <Building className="w-4 h-4" />
                          {resposta.colaborador_email}
                        </p>
                        <p className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          Respondido em: {format(new Date(resposta.data_resposta), "dd/MM/yyyy 'às' HH:mm")}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                        {resposta.tipo_pesquisa}
                      </Badge>
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        {resposta.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <strong>Enviado por:</strong> {resposta.remetente_nome} ({resposta.remetente_email})
                    </div>
                    
                    <div className="border-t pt-4">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Respostas do Formulário:</h4>
                      <div className="space-y-3">
                        {resposta.respostas?.map((item, idx) => (
                          <div key={idx} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                            <p className="font-medium text-gray-900 dark:text-white mb-2">
                              {item.pergunta}
                            </p>
                            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                              {item.resposta || <em className="text-gray-500">Não respondido</em>}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-16 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold">Nenhuma resposta encontrada</h3>
              <p>Ainda não há respostas registradas para as pesquisas periódicas.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}