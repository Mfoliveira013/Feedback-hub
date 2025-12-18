
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Grid3X3, ExternalLink, Briefcase, Users, FileText, BarChart3, MessageSquare, Calendar } from "lucide-react";

export default function AppsNef() {
    const apps = [
        {
            id: 1,
            nome: "Banco de Talentos",
            descricao: "Sistema de gestão de candidatos e processos seletivos",
            url: "https://talent-flow-411eac87.base44.app",
            icone: Briefcase,
            cor: "bg-blue-500",
        },
        {
            id: 2,
            nome: "Feedback Hub",
            descricao: "Sistema atual de avaliações e feedback corporativo",
            url: window.location.origin,
            icone: MessageSquare,
            cor: "bg-indigo-500",
        },
        {
            id: 3,
            nome: "Dashboard Executivo",
            descricao: "Painel de indicadores gerenciais da empresa",
            url: "#",
            icone: BarChart3,
            cor: "bg-purple-500",
            emBreve: true,
        },
        {
            id: 4,
            nome: "Gestão de Dados Funcionários",
            descricao: "Sistema de controle e organização de dados de funcionários",
            url: "https://rhino.base44.app/IntegracaoMobile",
            icone: FileText,
            cor: "bg-green-500",
            emBreve: false,
        },
        {
            id: 5,
            nome: "Agenda Corporativa",
            descricao: "Sistema de agendamento e gestão de reuniões",
            url: "#",
            icone: Calendar,
            cor: "bg-orange-500",
            emBreve: true,
        },
        {
            id: 6,
            nome: "Portal do Colaborador",
            descricao: "Central de serviços e informações para funcionários",
            url: "#",
            icone: Users,
            cor: "bg-pink-500",
            emBreve: true,
        },
    ];

    const handleAppClick = (app) => {
        if (app.emBreve) {
            alert("Este aplicativo estará disponível em breve!");
            return;
        }
        
        if (app.url === window.location.origin) {
            // Se for o próprio Feedback Hub, não faz nada
            return;
        }
        
        window.open(app.url, '_blank', 'noopener,noreferrer');
    };

    return (
        <div className="p-6 md:p-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
                        <Grid3X3 className="w-8 h-8 text-blue-600" />
                        Todos os App's NEF
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 text-lg">
                        Central de aplicações do Nabarrete & Ferro Advogados Associados
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {apps.map((app) => {
                        const IconeComponent = app.icone;
                        
                        return (
                            <Card 
                                key={app.id} 
                                className={`cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 ${
                                    app.emBreve ? 'opacity-75' : ''
                                }`}
                                onClick={() => handleAppClick(app)}
                            >
                                <CardHeader className="text-center pb-4">
                                    <div className={`w-16 h-16 ${app.cor} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                                        <IconeComponent className="w-8 h-8 text-white" />
                                    </div>
                                    <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
                                        {app.nome}
                                        {app.emBreve && (
                                            <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                                                Em Breve
                                            </span>
                                        )}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="text-center">
                                    <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm leading-relaxed">
                                        {app.descricao}
                                    </p>
                                    
                                    {!app.emBreve && app.url !== window.location.origin && (
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            className="group hover:bg-blue-50 hover:border-blue-300"
                                        >
                                            Acessar
                                            <ExternalLink className="w-4 h-4 ml-2 group-hover:text-blue-600" />
                                        </Button>
                                    )}
                                    
                                    {app.url === window.location.origin && (
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            disabled
                                            className="bg-blue-50 border-blue-300 text-blue-600"
                                        >
                                            Aplicativo Atual
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                <div className="mt-12 text-center">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Grid3X3 className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                            Ecossistema Digital NEF
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                            Estamos constantemente desenvolvendo novas soluções para otimizar os processos internos 
                            e melhorar a experiência de trabalho de nossa equipe. Em breve, novos aplicativos serão 
                            disponibilizados nesta central.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
