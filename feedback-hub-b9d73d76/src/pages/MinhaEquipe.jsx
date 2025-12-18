import React, { useState, useEffect, useMemo, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users, Star, Eye, ArrowLeft, Trash2, UserCheck, Search, ChevronRight, Save, MapPin, TrendingUp, TrendingDown, Minus, Calendar, FileText, Edit, UserPlus } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { format } from 'date-fns';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import MultiSelectFilter from "@/components/ui/MultiSelectFilter";
import { isAdminGlobal, isAdminSetorial, isAdminMultiSetor, getAdminSetores, getAdminTitle, isGestorAcessoTodosSetores } from "@/components/utils/permissoes"; // Assuming this file exists and contains the helper functions

export default function MinhaEquipe() {
    const [currentUser, setCurrentUser] = useState(null);
    const [allUsers, setAllUsers] = useState([]);
    const [gestores, setGestores] = useState([]);
    const [feedbacks, setFeedbacks] = useState([]);

    const [filtroEquipePor, setFiltroEquipePor] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    
    // Novo estado para controlar o setor selecionado no layout mestre-detalhe
    const [selectedSetor, setSelectedSetor] = useState(null);

    const [isAssignManagerModalOpen, setIsAssignManagerModalOpen] = useState(false);
    const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false); // State for details modal
    const [detailedUser, setDetailedUser] = useState(null); // State for user details

    const [assignManagerData, setAssignManagerData] = useState({ userId: null, managerEmails: [] });

    const [savingUser, setSavingUser] = useState(false);
    const [excluindoUsuario, setExcluindoUsuario] = useState(false);
    const [changingRole, setChangingRole] = useState(false);
    const [changingSetor, setChangingSetor] = useState(false);
    const [savingName, setSavingName] = useState(null);

    const [selectedMember, setSelectedMember] = useState(null);
    const [memberFeedbacks, setMemberFeedbacks] = useState([]);

    const loadData = useCallback(async () => {
        try {
            const user = await base44.auth.me();
            setCurrentUser(user);

            const allFeedbacks = await base44.entities.Feedback.list("-created_date");
            setFeedbacks(allFeedbacks);

            let usersToDisplay = [];
            let gestoresList = [];

            // Admin Global: todos os usuários
            if (isAdminGlobal(user)) {
                const allPlatformUsers = await base44.entities.User.list();
                usersToDisplay = allPlatformUsers;
                gestoresList = allPlatformUsers.filter(u => u.cargo === 'gestor');
            }
            // Admin Multi-Setorial ou Admin Setorial: extrair usuários dos feedbacks
            else if (isAdminMultiSetor(user) || isAdminSetorial(user)) {
                // Extrair usuários únicos dos feedbacks
                const uniqueEmails = new Set();
                allFeedbacks.forEach(f => {
                    if (f.destinatario_email) uniqueEmails.add(f.destinatario_email);
                    if (f.remetente_email) uniqueEmails.add(f.remetente_email);
                });
                uniqueEmails.add(user.email);
                
                const setoresPermitidos = isAdminMultiSetor(user) ? getAdminSetores(user) : [user.setor];
                
                usersToDisplay = Array.from(uniqueEmails).map(email => {
                    const feedbackRecebido = allFeedbacks.find(f => f.destinatario_email === email);
                    const feedbackEnviado = allFeedbacks.find(f => f.remetente_email === email);
                    
                    return {
                        email: email,
                        full_name: feedbackRecebido?.destinatario_nome || feedbackEnviado?.remetente_nome || email.split('@')[0],
                        setor: feedbackRecebido?.destinatario_setor || user.setor,
                        cargo: email === user.email ? user.cargo : 'usuario',
                        gestores_responsaveis: []
                    };
                }).filter(u => setoresPermitidos.includes(u.setor));
                
                gestoresList = usersToDisplay.filter(u => u.cargo === 'gestor');
            }
            // Gestor com acesso a todos os setores: extrair TODOS os usuários dos feedbacks
            else if (isGestorAcessoTodosSetores(user)) {
                const uniqueEmails = new Set();
                allFeedbacks.forEach(f => {
                    if (f.destinatario_email) uniqueEmails.add(f.destinatario_email);
                    if (f.remetente_email) uniqueEmails.add(f.remetente_email);
                });
                uniqueEmails.add(user.email);
                
                usersToDisplay = Array.from(uniqueEmails).map(email => {
                    const feedbackRecebido = allFeedbacks.find(f => f.destinatario_email === email);
                    const feedbackEnviado = allFeedbacks.find(f => f.remetente_email === email);
                    
                    return {
                        email: email,
                        full_name: feedbackRecebido?.destinatario_nome || feedbackEnviado?.remetente_nome || email.split('@')[0],
                        setor: feedbackRecebido?.destinatario_setor,
                        cargo: email === user.email ? user.cargo : 'usuario',
                        gestores_responsaveis: []
                    };
                });
                
                gestoresList = [user];
            }
            // Gestor normal: sua equipe
            else if (user.cargo === 'gestor') {
                try {
                    const teamMembers = await base44.entities.User.filter({ gestores_responsaveis: user.email });
                    usersToDisplay = [user, ...teamMembers];
                    // Para gestores, buscar lista de gestores para atribuição (se necessário)
                    // Mas não podemos usar User.list(), então vamos limitar aos gestores conhecidos
                    gestoresList = [user]; // O gestor pode apenas se atribuir
                } catch (error) {
                    console.error("Erro ao buscar equipe:", error);
                    usersToDisplay = [user];
                    gestoresList = [user];
                }
            }
            // Usuário comum
            else {
                usersToDisplay = [user];
                gestoresList = [];
            }

            setAllUsers(usersToDisplay);
            setGestores(gestoresList);

        } catch (error) {
            console.error("Erro crítico ao carregar dados da equipe:", error);
            try {
                const user = await base44.auth.me();
                setCurrentUser(user);
                setAllUsers([user]);
                setFeedbacks([]);
                setGestores([]);
            } catch (fallbackError) {
                console.error("Erro crítico ao carregar usuário no fallback:", fallbackError);
            }
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);
    
    const handleNameChange = (userId, newName) => {
        setAllUsers(prevUsers =>
            prevUsers.map(user =>
                user.id === userId ? { ...user, full_name: newName } : user
            )
        );
    };

    const handleSaveName = async (userId, userEmail, newName) => {
        if (!newName.trim()) {
            alert("O nome não pode estar vazio.");
            return;
        }
        setSavingName(userId);
        try {
            // 1. Atualiza o nome na entidade User
            await base44.entities.User.update(userId, { full_name: newName });

            // 2. Atualiza o nome nos feedbacks recebidos
            const feedbacksRecebidos = await base44.entities.Feedback.filter({ destinatario_email: userEmail });
            for (const feedback of feedbacksRecebidos) {
                await base44.entities.Feedback.update(feedback.id, { destinatario_nome: newName });
            }

            // 3. Atualiza o nome nos feedbacks enviados
            const feedbacksEnviados = await base44.entities.Feedback.filter({ remetente_email: userEmail });
            for (const feedback of feedbacksEnviados) {
                await base44.entities.Feedback.update(feedback.id, { remetente_nome: newName });
            }
            
            // Recarrega todos os dados para garantir consistência total na UI
            await loadData();
        } catch (error) {
            console.error("Erro ao salvar o nome:", error);
            alert("Ocorreu um erro ao salvar o nome.");
        } finally {
            setSavingName(null);
        }
    };

    const handleChangeRole = async (userId, newRole) => {
        if (!isAdminGlobal(currentUser)) {
            alert("Apenas administradores globais podem alterar cargos.");
            return;
        }

        setChangingRole(true);
        try {
            await base44.entities.User.update(userId, { cargo: newRole });
            loadData();
        } catch (error) {
            console.error("Erro ao alterar cargo:", error);
            alert("Erro ao alterar cargo. Tente novamente.");
        } finally {
            setChangingRole(false);
        }
    };

    const handleChangeSetor = async (userId, newSetor) => {
        if (!isAdminGlobal(currentUser) && !isAdminSetorial(currentUser) && !isAdminMultiSetor(currentUser)) {
            alert("Apenas administradores podem alterar o setor.");
            return;
        }
        setChangingSetor(true);
        try {
            await base44.entities.User.update(userId, { setor: newSetor === "Sem Setor" ? null : newSetor }); // Store null if "Sem Setor"
            loadData(); // Recarrega os dados para reorganizar os usuários
        } catch (error) {
            console.error("Erro ao alterar setor:", error);
            alert("Erro ao alterar setor. Tente novamente.");
        } finally {
            setChangingSetor(false);
        }
    };

    const handleChangeFilial = async (userId, newFilial) => {
        if (!isAdminGlobal(currentUser)) {
            alert("Apenas administradores globais podem alterar a filial.");
            return;
        }
        setChangingSetor(true); // Re-use loading state for simplicity
        try {
            await base44.entities.User.update(userId, { filial: newFilial });
            loadData();
        } catch (error) {
            console.error("Erro ao alterar filial:", error);
            alert("Erro ao alterar filial. Tente novamente.");
        } finally {
            setChangingSetor(false);
        }
    };

    const handleDeleteUser = async (userId, userEmail) => {
        if (!isAdminGlobal(currentUser)) {
            alert("Você não tem permissão para excluir usuários.");
            return;
        }
        setExcluindoUsuario(true);
        try {
            const feedbacksRecebidos = await base44.entities.Feedback.filter({ destinatario_email: userEmail });
            const feedbacksEnviados = await base44.entities.Feedback.filter({ remetente_email: userEmail });

            const feedbackIdsParaExcluir = [
                ...feedbacksRecebidos.map(f => f.id),
                ...feedbacksEnviados.map(f => f.id)
            ];

            for (const feedbackId of feedbackIdsParaExcluir) {
                await base44.entities.Feedback.delete(feedbackId);
            }
            
            await base44.entities.User.delete(userId);
            
            loadData();
        } catch (error) {
            console.error("Erro ao excluir usuário e seus dados:", error);
            alert("Erro ao excluir usuário. Verifique suas permissões ou contate o suporte se o erro persistir.");
        } finally {
            setExcluindoUsuario(false);
        }
    };

    const handleAssignManager = async () => {
        if (!assignManagerData.userId) return;
        setSavingUser(true);
        try {
            await base44.entities.User.update(assignManagerData.userId, { gestores_responsaveis: assignManagerData.managerEmails });
            setIsAssignManagerModalOpen(false);
            loadData();
        } catch (error) {
            console.error("Erro ao atribuir gestor:", error);
        } finally {
            setSavingUser(false);
        }
    };

    const handleViewMemberFeedbacks = (membro) => {
        const recebidos = feedbacks.filter(f => f.destinatario_email === membro.email);
        setSelectedMember(membro);
        setMemberFeedbacks(recebidos);
        setIsFeedbackModalOpen(true);
    };

    const openDetailsModal = (user) => {
        setDetailedUser(user);
        setIsDetailsModalOpen(true);
    };

    const openAssignManagerModal = (membro) => {
        setAssignManagerData({ userId: membro.id, managerEmails: membro.gestores_responsaveis || [] });
        setIsAssignManagerModalOpen(true);
    };

    const calcularEstatisticasMembro = (membro) => {
        const feedbacksRecebidos = feedbacks.filter(f => f.destinatario_email === membro.email);
        const somaNotas = feedbacksRecebidos.reduce((soma, f) => soma + (f.nota || 0), 0);
        const mediaAvaliacao = feedbacksRecebidos.length > 0 ? (somaNotas / feedbacksRecebidos.length).toFixed(1) : 0;
        return {
            feedbacksRecebidos: feedbacksRecebidos.length,
            mediaAvaliacao: parseFloat(mediaAvaliacao)
        };
    };

    const getCargoColor = (cargo) => {
        switch (cargo) {
            case "administrador": return "bg-purple-100 text-purple-800 border-purple-200";
            case "gestor": return "bg-blue-100 text-blue-800 border-blue-200";
            case "usuario": return "bg-green-100 text-green-800 border-green-200";
            default: return "bg-gray-100 text-gray-800 border-gray-200";
        }
    };

    const canViewMemberDetails = (membro) => {
        if (!currentUser) return false;
        if (isAdminGlobal(currentUser)) return true;
        if (isAdminMultiSetor(currentUser)) {
            const setoresPermitidos = getAdminSetores(currentUser);
            return setoresPermitidos.includes(membro.setor);
        }
        if (isAdminSetorial(currentUser)) {
            // Setorial admin can view details of members within their sector.
            return currentUser.setor === membro.setor;
        }
        if (isGestorAcessoTodosSetores(currentUser)) {
            // This type of gestor can see all members implied by their role based on feedback data
            return true;
        }
        if (currentUser.cargo === "gestor") {
            // Check if the member is part of the allUsers list after filtering,
            // which implicitly means they are either the gestor themselves or their subordinate.
            return allUsers.some(u => u.email === membro.email);
        }
        return false;
    };

    const getSetorDisplayName = (setor, filial) => {
        // Filial 'Sede Campo Grande/MS' is considered the default and shouldn't be explicitly appended to the setor name.
        if (filial && filial !== "Sede Campo Grande/MS") {
            return `${setor} - ${filial}`;
        }
        return setor;
    };
    
    const usuariosAgrupadosPorSetor = useMemo(() => {
        const equipeFiltrada = filtroEquipePor ?
            allUsers.filter(u => u.gestores_responsaveis?.includes(filtroEquipePor)) :
            allUsers;
    
        const equipePesquisada = equipeFiltrada.filter(membro =>
            (membro.full_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
            (membro.email?.toLowerCase() || '').includes(searchQuery.toLowerCase())
        );

        if (equipePesquisada.length === 0) return {};

        return equipePesquisada.reduce((acc, user) => {
            const setor = user.setor || "Sem Setor";
            const displayName = getSetorDisplayName(setor, user.filial);
            if (!acc[displayName]) {
                acc[displayName] = [];
            }
            acc[displayName].push(user);
            return acc;
        }, {});
    }, [allUsers, searchQuery, filtroEquipePor]);

    const gestorFiltrado = filtroEquipePor ?
        allUsers.find(u => u.email === filtroEquipePor) : null;
        
    // Define o primeiro setor como selecionado por padrão se nenhum estiver
    useEffect(() => {
        const setores = Object.keys(usuariosAgrupadosPorSetor).sort((a, b) => a.localeCompare(b));
        if (setores.length > 0 && !selectedSetor) {
            setSelectedSetor(setores[0]);
        } else if (setores.length === 0 && selectedSetor) {
            setSelectedSetor(null);
        }
    }, [usuariosAgrupadosPorSetor, selectedSetor]);

    const getClassificationStyle = (classificacao) => {
        switch (classificacao) {
            case 'boa': return 'bg-green-100 text-green-800';
            case 'media': return 'bg-yellow-100 text-yellow-800';
            case 'ruim': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const mapOldToNewClassification = (classificacao) => {
        switch (classificacao) {
            case 'boa': return 'Positivo';
            case 'media': return 'Neutro';
            case 'ruim': return 'A Melhorar';
            default: return classificacao;
        }
    };

    if (!currentUser) return <div className="p-8">Carregando...</div>;
    
    const renderMemberCard = (membro) => {
        const stats = calcularEstatisticasMembro(membro);
        return (
            <Card key={membro.id || membro.email} className="bg-white dark:bg-gray-900 hover:shadow-lg transition-shadow duration-300 flex flex-col">
                <CardHeader className="text-center relative p-4">
                    <div className="absolute top-2 right-2 flex gap-1">
                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => openDetailsModal(membro)}>
                            <Eye className="w-4 h-4 text-gray-500" />
                        </Button>
                        {isAdminGlobal(currentUser) && membro.id !== currentUser.id && ( // Updated condition
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive" size="icon" className="h-7 w-7" disabled={excluindoUsuario}>
                                        <Trash2 className="w-3 h-3" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Excluir {membro.full_name}?</AlertDialogTitle>
                                        <AlertDialogDescription>Esta ação é permanente e irá remover o usuário e todos os seus feedbacks. Deseja continuar?</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDeleteUser(membro.id, membro.email)} className="bg-red-600 hover:bg-red-700">Excluir</AlertDialogAction>
                                    </AlertDialogFooter>
                                    </AlertDialogContent>
                            </AlertDialog>
                        )}
                    </div>

                    <Avatar
                        className="w-16 h-16 mx-auto mb-2"
                        onClick={canViewMemberDetails(membro) ? () => handleViewMemberFeedbacks(membro) : undefined}
                        style={canViewMemberDetails(membro) ? {cursor: 'pointer'} : {}}
                    >
                        <AvatarImage src={membro.foto_perfil} />
                        <AvatarFallback>{membro.full_name?.charAt(0) || '?'}</AvatarFallback>
                    </Avatar>

                    {(isAdminGlobal(currentUser) || isAdminSetorial(currentUser) || isAdminMultiSetor(currentUser) || isGestorAcessoTodosSetores(currentUser)) ? ( // Updated condition to reflect broader admin ability to edit names if they can view the user.
                        <div className="relative mt-2">
                            <Input
                                value={membro.full_name || ""}
                                onChange={(e) => handleNameChange(membro.id, e.target.value)}
                                className="text-base font-semibold text-center pr-10"
                                placeholder="Nome completo"
                            />
                            <Button
                                size="icon"
                                variant="ghost"
                                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                                onClick={() => handleSaveName(membro.id, membro.email, membro.full_name)}
                                disabled={savingName === membro.id}
                            >
                                {savingName === membro.id ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900" />
                                ) : (
                                    <Save className="w-4 h-4 text-gray-500 hover:text-blue-600" />
                                )}
                            </Button>
                        </div>
                    ) : (
                        <CardTitle
                            className="text-base font-semibold"
                            onClick={canViewMemberDetails(membro) ? () => handleViewMemberFeedbacks(membro) : undefined}
                            style={canViewMemberDetails(membro) ? {cursor: 'pointer'} : {}}
                        >
                            {membro.full_name || membro.email}
                        </CardTitle>
                    )}
                    
                    <p className="text-xs text-gray-500 mt-1 flex items-center justify-center gap-1">
                        <MapPin className="w-3 h-3"/> {membro.filial || 'Sede Campo Grande/MS'}
                    </p>

                    <div className="flex justify-center gap-2 mt-2 flex-wrap">
                        {isAdminGlobal(currentUser) ? ( // Updated condition
                            <>
                                <Select
                                    value={membro.cargo}
                                    onValueChange={(newRole) => handleChangeRole(membro.id, newRole)}
                                    disabled={changingRole}
                                >
                                    <SelectTrigger className="w-28 h-7 text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="usuario">Usuário</SelectItem>
                                        <SelectItem value="gestor">Gestor</SelectItem>
                                        <SelectItem value="administrador">Admin</SelectItem>
                                    </SelectContent>
                                </Select>
                            </>
                        ) : (
                            <Badge className={getCargoColor(membro.cargo)}>{membro.cargo}</Badge>
                        )}
                        
                        {(isAdminGlobal(currentUser) || isAdminSetorial(currentUser) || isAdminMultiSetor(currentUser)) ? ( // Updated condition
                            <Select
                                value={membro.setor || "Sem Setor"}
                                onValueChange={(newSetor) => handleChangeSetor(membro.id, newSetor)}
                                disabled={changingSetor}
                            >
                                <SelectTrigger className="w-32 h-7 text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="RH">RH</SelectItem>
                                    <SelectItem value="Controldesk">Controldesk</SelectItem>
                                    <SelectItem value="Controladoria">Controladoria</SelectItem>
                                    <SelectItem value="M.I.S">M.I.S</SelectItem>
                                    <SelectItem value="Extra">Extra</SelectItem>
                                    <SelectItem value="Acordo Jud">Acordo Jud</SelectItem>
                                    <SelectItem value="Contencioso">Contencioso</SelectItem>
                                    <SelectItem value="Focais">Focais</SelectItem>
                                    <SelectItem value="Filiais">Filiais</SelectItem>
                                    <SelectItem value="Iniciais">Iniciais</SelectItem>
                                    <SelectItem value="Adm">Adm</SelectItem>
                                    <SelectItem value="Contrárias">Contrárias</SelectItem>
                                    <SelectItem value="Tecnologia">Tecnologia</SelectItem>
                                    <SelectItem value="Recuperação Judicial">Recuperação Judicial</SelectItem>
                                    <SelectItem value="Sem Setor">Sem Setor</SelectItem>
                                </SelectContent>
                            </Select>
                        ) : (
                            membro.setor && <Badge variant="outline">{membro.setor}</Badge>
                        )}

                        {isAdminGlobal(currentUser) ? ( // Updated condition
                            <Select
                                value={membro.filial || "Sede Campo Grande/MS"}
                                onValueChange={(newFilial) => handleChangeFilial(membro.id, newFilial)}
                                disabled={changingSetor} // Re-use loading state
                            >
                                <SelectTrigger className="w-48 h-7 text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Sede Campo Grande/MS">Sede Campo Grande/MS</SelectItem>
                                    <SelectItem value="Cuiabá/MT">Cuiabá/MT</SelectItem>
                                    <SelectItem value="Cacoal/RO">Cacoal/RO</SelectItem>
                                </SelectContent>
                            </Select>
                        ) : (
                            null
                        )}
                    </div>

                    {membro.gestores_responsaveis && membro.gestores_responsaveis.length > 0 && (
                        <p className="text-xs text-gray-500 mt-1 truncate"
                           title={membro.gestores_responsaveis.map(gEmail => {
                               const manager = gestores.find(gest => gest.email === gEmail);
                               return manager ? manager.full_name : gEmail.split('@')[0];
                           }).join(', ')}>
                            Gestor(es): {membro.gestores_responsaveis.map(gEmail => {
                                const manager = gestores.find(gest => gest.email === gEmail);
                                return manager ? manager.full_name : gEmail.split('@')[0];
                            }).join(', ')}
                        </p>
                    )}
                </CardHeader>

                <CardContent className="px-4 pb-2 space-y-2 flex-grow">
                    {canViewMemberDetails(membro) && (
                        <div className="grid grid-cols-2 gap-2">
                            <div className="text-center">
                                <div className="text-xl font-bold text-blue-600">{stats.feedbacksRecebidos}</div>
                                <div className="text-xs text-gray-500">Recebidos</div>
                            </div>
                            <div className="text-center">
                                <div className="text-xl font-bold text-green-600">{stats.mediaAvaliacao}/5</div>
                                <div className="text-xs text-gray-500">Média</div>
                            </div>
                        </div>
                    )}
                </CardContent>

                <CardFooter className="flex flex-col gap-2 p-4 pt-0">
                    {membro.cargo === "gestor" && isAdminGlobal(currentUser) && ( // Restrict this to global admins for now, or if a setorial admin can manage gestores in their sector.
                        <Button variant="secondary" size="sm" className="w-full h-8" onClick={() => setFiltroEquipePor(membro.email)}>
                            <Eye className="w-4 h-4 mr-2" /> Ver Equipe
                        </Button>
                    )}

                    {isAdminGlobal(currentUser) && ( // Only global admin can assign managers
                        <Button variant="outline" size="sm" className="w-full h-8" onClick={() => openAssignManagerModal(membro)}>
                            <UserCheck className="w-4 h-4 mr-2" /> Atribuir Gestor
                        </Button>
                    )}
                </CardFooter>
            </Card>
        );
    };

    const setoresOrdenados = Object.entries(usuariosAgrupadosPorSetor).sort(([setorA], [setorB]) => setorA.localeCompare(setorB));

    return (
        <div className="p-6 md:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-8 gap-4">
                    <div>
                         {currentUser.cargo === 'administrador' && filtroEquipePor && (
                                <Button variant="outline" size="sm" onClick={() => setFiltroEquipePor(null)}>
                                    <ArrowLeft className="w-4 h-4 mr-1" /> Ver Todos
                                </Button>
                            )}
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            <Users className="w-8 h-8 text-blue-600" />
                            {filtroEquipePor 
                                ? `Equipe de ${gestorFiltrado?.full_name}` 
                                : getAdminTitle(currentUser)
                            }
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                           {isAdminGlobal(currentUser) 
                               ? 'Visualize e gerencie todos os membros da empresa por setor.' 
                               : isAdminMultiSetor(currentUser)
                               ? `Visualize e gerencie os membros dos setores ${getAdminSetores(currentUser).join(', ')}.`
                               : isAdminSetorial(currentUser)
                               ? `Visualize e gerencie os membros do setor ${currentUser.setor}.`
                               : isGestorAcessoTodosSetores(currentUser)
                               ? 'Visualize todos os membros da empresa com base nos feedbacks.'
                               : currentUser.cargo === 'gestor'
                               ? 'Visualize sua equipe por setor.'
                               : 'Visualize seu perfil.'
                           }
                        </p>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4 mb-8 items-center justify-between">
                    <div className="relative max-w-md w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                            placeholder="Pesquisar por nome ou e-mail..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 w-full"
                        />
                    </div>
                </div>

                {/* Layout mestre-detalhe para desktop */}
                <div className="hidden md:flex flex-row gap-6 items-start">
                    {/* Painel de Setores (Mestre) */}
                    <div className="w-full md:w-1/3 lg:w-1/4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Setores</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {setoresOrdenados.map(([setor, membros]) => (
                                    <Button
                                        key={setor}
                                        variant={selectedSetor === setor ? "secondary" : "ghost"}
                                        className="w-full justify-start gap-3"
                                        onClick={() => setSelectedSetor(setor)}
                                    >
                                        <Users className="w-4 h-4 text-gray-500" />
                                        <span className="flex-1 text-left">{setor}</span>
                                        <Badge variant="outline">{membros.length}</Badge>
                                    </Button>
                                ))}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Painel de Membros (Detalhe) */}
                    <div className="w-full md:w-2/3 lg:w-3/4">
                        {selectedSetor && usuariosAgrupadosPorSetor[selectedSetor] ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                {usuariosAgrupadosPorSetor[selectedSetor].map(renderMemberCard)}
                            </div>
                        ) : (
                            <div className="text-center py-16 text-gray-500 dark:text-gray-400">
                                <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                                <h3 className="text-xl font-semibold">Selecione um setor</h3>
                                <p>Clique em um setor à esquerda para ver os membros.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Layout de Accordion para mobile */}
                <div className="md:hidden">
                    <Accordion type="single" collapsible value={selectedSetor || undefined} onValueChange={setSelectedSetor}>
                         {setoresOrdenados.map(([setor, membros]) => (
                            <AccordionItem value={setor} key={setor} className="border rounded-lg mb-2">
                                <AccordionTrigger className="w-full text-left p-4 hover:no-underline">
                                    <div className="flex justify-between items-center w-full">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-md">
                                                <Users className="w-5 h-5 text-blue-600 dark:text-blue-300" />
                                            </div>
                                            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{setor}</h2>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <Badge variant="secondary">{membros.length}</Badge>
                                            <ChevronRight className="h-5 w-5 transition-transform duration-200 accordion-chevron" />
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-b-lg">
                                    <div className="grid grid-cols-1 gap-4">
                                        {membros.map(renderMemberCard)}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </div>
                
                {Object.keys(usuariosAgrupadosPorSetor).length === 0 && (
                    <div className="text-center py-16 text-gray-500 dark:text-gray-400">
                        <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                        <h3 className="text-xl font-semibold">Nenhum usuário encontrado</h3>
                        <p>Tente ajustar sua pesquisa ou verificar os filtros.</p>
                    </div>
                )}


                {/* Modal de Detalhes do Usuário */}
                <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Detalhes do Usuário</DialogTitle>
                            <DialogDescription>
                                Informações completas do colaborador.
                            </DialogDescription>
                        </DialogHeader>
                        {detailedUser && (
                            <div className="py-4 space-y-4">
                                <div className="flex items-center gap-4">
                                    <Avatar className="w-20 h-20">
                                        <AvatarImage src={detailedUser.foto_perfil} />
                                        <AvatarFallback className="text-2xl">{detailedUser.full_name?.charAt(0) || '?'}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h3 className="text-xl font-bold">{detailedUser.full_name}</h3>
                                        <p className="text-sm text-gray-500">{detailedUser.email}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 pt-4 border-t mt-4">
                                    <div>
                                        <Label className="text-xs text-gray-500">Cargo</Label>
                                        <p className="font-semibold capitalize">{detailedUser.cargo}</p>
                                    </div>
                                    <div>
                                        <Label className="text-xs text-gray-500">Setor</Label>
                                        <p className="font-semibold">{detailedUser.setor || 'Não definido'}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <Label className="text-xs text-gray-500">Filial</Label>
                                        <p className="font-semibold">{detailedUser.filial || 'Não definida'}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <Label className="text-xs text-gray-500">Gerente Responsável</Label>
                                        <p className="font-semibold">
                                            {detailedUser.gestores_responsaveis && detailedUser.gestores_responsaveis.length > 0
                                                ? detailedUser.gestores_responsaveis.map(gEmail => {
                                                    const manager = gestores.find(gest => gest.email === gEmail);
                                                    return manager ? manager.full_name : gEmail.split('@')[0];
                                                }).join(', ')
                                                : 'Nenhum'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                        <DialogFooter>
                            <Button onClick={() => setIsDetailsModalOpen(false)}>Fechar</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Modal de Atribuir Gestor */}
                <Dialog open={isAssignManagerModalOpen} onOpenChange={setIsAssignManagerModalOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Atribuir a um Gestor</DialogTitle>
                            <DialogDescription>
                                Selecione um ou mais gestores para serem responsáveis por este usuário.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                            <MultiSelectFilter
                                title="Selecionar Gestores"
                                placeholder="Selecione um ou mais gestores"
                                options={gestores.map(g => ({ value: g.email, label: g.full_name || g.email }))}
                                selectedValues={assignManagerData.managerEmails}
                                onSelectionChange={(selected) => setAssignManagerData(p => ({...p, managerEmails: selected}))}
                            />
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsAssignManagerModalOpen(false)}>Cancelar</Button>
                            <Button onClick={handleAssignManager} disabled={savingUser}>Salvar</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                 {/* Modal para ver feedbacks do membro */}
                 <Dialog open={isFeedbackModalOpen} onOpenChange={setIsFeedbackModalOpen}>
                    <DialogContent className="sm:max-w-3xl h-[80vh] flex flex-col">
                        <DialogHeader>
                            <DialogTitle className="text-2xl">Feedbacks Recebidos por {selectedMember?.full_name}</DialogTitle>
                        </DialogHeader>
                        <div className="flex-1 overflow-y-auto pr-4 space-y-4">
                            {memberFeedbacks.length > 0 ? (
                                memberFeedbacks.map(feedback => (
                                    <Card key={feedback.id}>
                                        <CardHeader>
                                            <CardTitle>{feedback.titulo}</CardTitle>
                                            <div className="flex gap-2">
                                                <Badge className={getClassificationStyle(feedback.classificacao)}>
                                                    {mapOldToNewClassification(feedback.classificacao)}
                                                </Badge>
                                                <Badge variant="outline">{feedback.nota}/5</Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <p>{feedback.descricao}</p>
                                            <p className="text-xs text-gray-500 mt-2">
                                                Ocorrido em: {format(new Date(feedback.data_ocorrido), "dd/MM/yyyy")}
                                            </p>
                                        </CardContent>
                                    </Card>
                                ))
                            ) : (
                                <div className="text-center py-16 text-gray-500">Nenhum feedback recebido.</div>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}