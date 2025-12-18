
import React, { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/api/entities";
import { 
    LayoutDashboard, 
    Users, 
    MessageCircle, 
    FileText, 
    User as UserIcon, 
    Settings,
    Menu,
    Sun,
    Moon,
    LogOut,
    MessagesSquare,
    History,
    Bell,
    Grid3X3 // Novo ícone para Apps NEF
} from "lucide-react";
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarHeader,
    SidebarFooter,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import CompletarPerfil from "./pages/CompletarPerfil";

export default function Layout({ children, currentPageName }) {
    const location = useLocation();
    const [currentUser, setCurrentUser] = useState(null);
    const [tema, setTema] = useState("claro"); // Default to 'claro'

    const loadUserData = useCallback(async () => {
        try {
            const user = await User.me();
            setCurrentUser(user);
            // Definição do tema inicial:
            // 1. Prioriza o tema salvo no perfil do usuário.
            // 2. Se não houver, usa a preferência do sistema operacional.
            // 3. Se nenhuma das anteriores, usa 'claro' como padrão.
            if (user.tema) {
                setTema(user.tema);
            } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                setTema('escuro');
            } else {
                setTema('claro'); // Ensure it defaults to 'claro' if no user theme and no OS dark preference
            }
        } catch (error) {
            console.log("Usuário não logado, usando tema padrão.");
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                setTema('escuro');
            } else {
                setTema('claro'); // Ensure it defaults to 'claro' if not logged in and no OS dark preference
            }
        }
    }, []);

    useEffect(() => {
        loadUserData();
    }, [loadUserData]);

    // Efeito para aplicar a classe 'dark' e o atributo de tema ao HTML
    useEffect(() => {
        const root = window.document.documentElement;
        if (tema === 'escuro') {
            root.classList.add('dark');
            root.setAttribute('data-theme', 'escuro');
        } else {
            root.classList.remove('dark');
            root.setAttribute('data-theme', 'claro');
        }
    }, [tema]);

    const toggleTema = async () => {
        const novoTema = tema === "claro" ? "escuro" : "claro";
        setTema(novoTema);
        if (currentUser) {
            // Salva a preferência do usuário no banco de dados sem esperar
            User.updateMyUserData({ tema: novoTema }).catch(error => {
                console.error("Falha ao salvar o tema do usuário:", error);
            });
        }
    };

    const handleLogout = async () => {
        await User.logout();
        window.location.reload();
    };

    const getNavigationItems = () => {
        const baseItems = [
            {
                title: "Dashboard",
                url: createPageUrl("Dashboard"),
                icon: LayoutDashboard,
            },
        ];

        // Apenas gestores e administradores podem ver "Enviar Avaliação"
        if (currentUser?.cargo !== 'usuario') {
            baseItems.push({
                title: "Enviar Avaliação",
                url: createPageUrl("EnviarFeedback"),
                icon: MessageCircle,
            });
        }

        // Adicionar itens apenas para admin e gestor
        if (currentUser?.cargo === "administrador" || currentUser?.cargo === "gestor") {
            baseItems.push({
                title: "Avaliações Retroativas",
                url: createPageUrl("FeedbacksRetroativos"),
                icon: History,
            });
            baseItems.push({
                title: currentUser.cargo === 'administrador' ? 'Todos os Usuários' : 'Minha Equipe',
                url: createPageUrl("MinhaEquipe"),
                icon: Users,
            });
            baseItems.push({
                title: "Todas as Avaliações",
                url: createPageUrl("TodosFeedbacks"),
                icon: MessagesSquare, // Using the new icon
            });
            baseItems.push({
                title: "Avaliação A.I.C",
                url: createPageUrl("AvaliacaoAIC"),
                icon: FileText, 
            });
            baseItems.push({
                title: "Todas as Avaliações A.I.C",
                url: createPageUrl("TodasAvaliacoesAIC"),
                icon: FileText, // Usando o mesmo ícone por enquanto
            });
        }

        // Apenas RH e Admin Geral podem ver Pesquisa Periódica (Julio não vê)
        const isRH = currentUser?.email === 'edielwinicius@nefadv.com.br';
        const isAdminGeral = ['mfo.oliveira0013@gmail.com', 'gabrielcarvalho@nefadv.com.br'].includes(currentUser?.email);

        if (isRH || isAdminGeral) {
            baseItems.push({
                title: "Pesquisa Periódica",
                url: createPageUrl("PesquisaPeriodica"),
                icon: FileText,
            });
            baseItems.push({
                title: "Resultados das Pesquisas",
                url: createPageUrl("ResultadosPesquisaPeriodica"),
                icon: FileText,
            });
        }

        // Apenas administradores podem ver Diagnóstico de E-mails (Julio não vê)
        if (currentUser?.cargo === "administrador" && currentUser?.email !== 'juliogoncalves@nefadv.com.br') {
            baseItems.push({
                title: "Diagnóstico de E-mails",
                url: createPageUrl("DiagnosticoEmails"),
                icon: Bell,
            });
        }
        
        baseItems.push(
            {
                title: "Relatórios",
                url: createPageUrl("Relatorios"),
                icon: FileText,
            },
            {
                title: "Todos os App's NEF",
                url: createPageUrl("AppsNef"),
                icon: Grid3X3,
            },
            {
                title: "Perfil",
                url: createPageUrl("Perfil"),
                icon: UserIcon,
            },
            {
                title: "Configurações",
                url: createPageUrl("Configuracoes"),
                icon: Settings,
            }
        );

        return baseItems;
    };

    if (!currentUser) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
                <div className="text-center space-y-6 p-8">
                    <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
                        <MessageCircle className="w-10 h-10 text-white" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900 mb-2">Feedback Hub</h1>
                        <p className="text-gray-600 text-lg mb-8">Sistema de Feedback Corporativo</p>
                        <Button 
                            onClick={() => User.login()}
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                        >
                            Entrar no Sistema
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // Forçar o preenchimento completo do perfil (cargo was removed as per outline)
    if (currentUser && (!currentUser.setor || !currentUser.full_name)) {
        return <CompletarPerfil onProfileComplete={loadUserData} />;
    }

    return (
        <>
            <style>{`
                /* Estilos para o tema claro (padrão) */
                :root {
                    --background: 0 0% 100%;
                    --foreground: 222.2 84% 4.9%;
                    --card: 0 0% 100%;
                    --card-foreground: 222.2 84% 4.9%;
                    --popover: 0 0% 100%;
                    --popover-foreground: 222.2 84% 4.9%;
                    --primary: 221.2 83.2% 53.3%;
                    --primary-foreground: 210 40% 98%;
                    --secondary: 210 40% 96.1%;
                    --secondary-foreground: 222.2 47.4% 11.2%;
                    --muted: 210 40% 96.1%;
                    --muted-foreground: 215.4 16.3% 46.9%;
                    --accent: 210 40% 96.1%;
                    --accent-foreground: 222.2 47.4% 11.2%;
                    --destructive: 0 84.2% 60.2%;
                    --destructive-foreground: 210 40% 98%;
                    --border: 214.3 31.8% 91.4%;
                    --input: 214.3 31.8% 91.4%;
                    --ring: 222.2 84% 4.9%;
                }

                /* Estilos para o tema escuro - Ativado pela classe .dark */
                .dark {
                    --background: 222.2 84% 4.9%;
                    --foreground: 210 40% 98%;
                    --card: 222.2 84% 4.9%;
                    --card-foreground: 210 40% 98%;
                    --popover: 222.2 84% 4.9%;
                    --popover-foreground: 210 40% 98%;
                    --primary: 217.2 91.2% 59.8%;
                    --primary-foreground: 222.2 47.4% 11.2%;
                    --secondary: 217.2 32.6% 17.5%;
                    --secondary-foreground: 210 40% 98%;
                    --muted: 217.2 32.6% 17.5%;
                    --muted-foreground: 215 20.2% 65.1%;
                    --accent: 217.2 32.6% 17.5%;
                    --accent-foreground: 210 40% 98%;
                    --destructive: 0 62.8% 30.6%;
                    --destructive-foreground: 210 40% 98%;
                    --border: 217.2 32.6% 17.5%;
                    --input: 217.2 32.6% 17.5%;
                    --ring: 212.7 26.8% 83.9%;
                }
            `}</style>
            
            <SidebarProvider>
                <div className="min-h-screen flex w-full bg-background text-foreground">
                    <Sidebar className="border-r border-border bg-card">
                        <SidebarHeader className="border-b border-border p-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                                    <MessageCircle className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h2 className="font-bold text-card-foreground text-lg">Feedback Hub</h2>
                                    <p className="text-xs text-muted-foreground">Sistema Corporativo</p>
                                </div>
                            </div>
                        </SidebarHeader>
                        
                        <SidebarContent className="p-4">
                            <SidebarGroup>
                                <SidebarGroupLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2">
                                    Navegação
                                </SidebarGroupLabel>
                                <SidebarGroupContent>
                                    <SidebarMenu>
                                        {getNavigationItems().map((item) => (
                                            <SidebarMenuItem key={item.title}>
                                                <SidebarMenuButton 
                                                    asChild 
                                                    className={`hover:bg-accent hover:text-accent-foreground transition-colors duration-200 rounded-xl mb-1 ${
                                                        location.pathname === item.url ? 'bg-secondary text-secondary-foreground' : ''
                                                    }`}
                                                >
                                                    <Link to={item.url} className="flex items-center gap-3 px-3 py-3">
                                                        <item.icon className="w-5 h-5" />
                                                        <span className="font-medium">{item.title}</span>
                                                    </Link>
                                                </SidebarMenuButton>
                                            </SidebarMenuItem>
                                        ))}
                                    </SidebarMenu>
                                </SidebarGroupContent>
                            </SidebarGroup>
                        </SidebarContent>

                        <SidebarFooter className="border-t border-border p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Avatar className="w-10 h-10">
                                        <AvatarImage src={currentUser.foto_perfil} />
                                        <AvatarFallback className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white">
                                            {currentUser.full_name?.charAt(0) || currentUser.email?.charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-foreground text-sm truncate">
                                            {currentUser.full_name || currentUser.email}
                                        </p>
                                        <p className="text-xs text-muted-foreground truncate capitalize">
                                            {currentUser.cargo} • {currentUser.setor}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={toggleTema}
                                        className="w-8 h-8"
                                    >
                                        {tema === "claro" ? 
                                            <Moon className="w-4 h-4" /> : 
                                            <Sun className="w-4 h-4" />
                                        }
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={handleLogout}
                                        className="w-8 h-8 text-red-500 hover:text-red-700"
                                    >
                                        <LogOut className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </SidebarFooter>
                    </Sidebar>

                    <main className="flex-1 flex flex-col">
                        <header className="bg-card border-b border-border px-6 py-4 md:hidden">
                            <div className="flex items-center gap-4">
                                <SidebarTrigger className="hover:bg-accent p-2 rounded-lg transition-colors duration-200">
                                    <Menu className="w-5 h-5" />
                                </SidebarTrigger>
                                <h1 className="text-xl font-semibold text-foreground">Feedback Hub</h1>
                            </div>
                        </header>

                        <div className="flex-1 overflow-auto bg-background">
                            {children}
                        </div>
                    </main>
                </div>
            </SidebarProvider>
        </>
    );
}
