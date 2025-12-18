
import React, { useState, useEffect, useCallback } from "react";
import { User } from "@/api/entities";
import { Feedback } from "@/api/entities";
import { UploadFile } from "@/api/integrations";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User as UserIcon, Star, MessageCircle, TrendingUp, Upload, Save, Eye, EyeOff, MapPin } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { format } from "date-fns";


export default function Perfil() {
    const [currentUser, setCurrentUser] = useState(null);
    const [feedbacks, setFeedbacks] = useState([]);
    const [feedbacksRecebidos, setFeedbacksRecebidos] = useState([]); // Novo estado para feedbacks recebidos
    const [editando, setEditando] = useState(false);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [saving, setSaving] = useState(false); // Renamed from salvando
    const [mostrarSenha, setMostrarSenha] = useState(false);
    const [sucesso, setSucesso] = useState(false);
    const [formData, setFormData] = useState({
        full_name: "",
        setor: "",
        filial: "", // Added filial
        cargo_funcional: "", // Added functional role
        funcao_funcional: "", // Added functional function
        nova_senha: "",
        confirmar_senha: ""
    });
    const [stats, setStats] = useState({
        feedbacksRecebidos: 0,
        feedbacksEnviados: 0,
        mediaAvaliacao: 0
    });

    const loadData = useCallback(async () => {
        try {
            const user = await User.me();
            setCurrentUser({
                ...user,
                gestores_responsaveis: user.gestores_responsaveis || [] // Ensure gestores_responsaveis is an array
            });
            setFormData({
                full_name: user.full_name || "",
                setor: user.setor || "",
                filial: user.filial || "Sede Campo Grande/MS", // Initializing new field with default
                cargo_funcional: user.cargo_funcional || "", // Initializing new fields
                funcao_funcional: user.funcao_funcional || "", // Initializing new fields
                nova_senha: "",
                confirmar_senha: ""
            });

            const allFeedbacks = await Feedback.list("-created_date");
            setFeedbacks(allFeedbacks);

            // Filtrar e armazenar os feedbacks recebidos
            const recebidos = allFeedbacks.filter(f => f.destinatario_email === user.email);
            setFeedbacksRecebidos(recebidos);

            calculateStats(allFeedbacks, user);
        } catch (error) {
            console.error("Erro ao carregar dados:", error);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const calculateStats = (feedbacks, user) => {
        const feedbacksRecebidos = feedbacks.filter(f => f.destinatario_email === user.email);
        const feedbacksEnviados = feedbacks.filter(f => f.remetente_email === user.email);

        // Usar nota direta ao invés de conversão da classificação
        const somaNotas = feedbacksRecebidos.reduce((soma, f) => soma + (f.nota || 0), 0);
        const mediaAvaliacao = feedbacksRecebidos.length > 0 ? 
            (somaNotas / feedbacksRecebidos.length).toFixed(1) : 0;

        setStats({
            feedbacksRecebidos: feedbacksRecebidos.length,
            feedbacksEnviados: feedbacksEnviados.length,
            mediaAvaliacao: parseFloat(mediaAvaliacao)
        });
    };

    const handleInputChange = (campo, valor) => {
        setFormData(prev => ({
            ...prev,
            [campo]: valor
        }));
    };

    const handlePhotoUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setUploadingPhoto(true);
        try {
            const { file_url } = await UploadFile({ file });
            await User.updateMyUserData({ foto_perfil: file_url });
            setCurrentUser(prev => ({ ...prev, foto_perfil: file_url }));
        } catch (error) {
            console.error("Erro ao fazer upload da foto:", error);
            alert("Erro ao fazer upload da foto. Tente novamente.");
        }
        setUploadingPhoto(false);
    };

    const validarSenha = (senha) => {
        const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        return regex.test(senha);
    };

    const handleSave = async () => {
        if (formData.nova_senha && formData.nova_senha !== formData.confirmar_senha) {
            alert("As senhas não coincidem.");
            return;
        }

        if (formData.nova_senha && !validarSenha(formData.nova_senha)) {
            alert("A senha deve ter pelo menos 8 caracteres, incluindo uma letra maiúscula, uma minúscula, um número e um caractere especial.");
            return;
        }

        setSaving(true); // Renamed from setSalvando
        try {
            const updateData = {
                full_name: formData.full_name,
                setor: formData.setor,
                filial: formData.filial, // Added to updateData
                cargo_funcional: formData.cargo_funcional, // Added to updateData
                funcao_funcional: formData.funcao_funcional // Added to updateData
            };
            
            // Preserve password update logic
            if (formData.nova_senha && validarSenha(formData.nova_senha)) {
                await User.updateMyUserData({
                    ...updateData,
                    password: formData.nova_senha // Assuming 'password' is the key for password changes
                });
            } else {
                await User.updateMyUserData(updateData);
            }
            
            // Refresh current user data to reflect all changes, including the newly added fields
            await loadData(); // Reload all user data after save as suggested by outline for `loadUserData()`
            
            setEditando(false);
            setSucesso(true);
            
            // Limpar campos de senha
            setFormData(prev => ({
                ...prev,
                nova_senha: "",
                confirmar_senha: ""
            }));

            setTimeout(() => setSucesso(false), 5000);
        } catch (error) {
            console.error("Erro ao salvar dados:", error);
            alert("Erro ao salvar dados. Tente novamente.");
        }
        setSaving(false); // Renamed from setSalvando
    };

    const getCargoColor = (cargo) => {
        // This function is named getCargoColor but is used for feedback classifications as well
        // Assuming the intent is to have a generic badge color getter based on string input
        switch (cargo) {
            case "administrador": return "bg-purple-100 text-purple-800 border-purple-200";
            case "gestor": return "bg-blue-100 text-blue-800 border-blue-200";
            case "usuario": return "bg-green-100 text-green-800 border-green-200";
            // Add specific cases for feedback classifications if needed, otherwise default
            case "Elogio": return "bg-green-100 text-green-800 border-green-200"; // Example classification
            case "Crítica": return "bg-red-100 text-red-800 border-red-200"; // Example classification
            case "Sugestão": return "bg-blue-100 text-blue-800 border-blue-200"; // Example classification
            default: return "bg-gray-100 text-gray-800 border-gray-200";
        }
    };

    if (!currentUser) {
        return <div className="p-8">Carregando...</div>;
    }

    return (
        <div className="p-6 md:p-8">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
                        <UserIcon className="w-8 h-8 text-blue-600" />
                        Meu Perfil
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Gerencie suas informações pessoais e acompanhe suas estatísticas.
                    </p>
                </div>

                {sucesso && (
                    <Alert className="mb-6 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                        <Save className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-800 dark:text-green-200">
                            Perfil atualizado com sucesso!
                        </AlertDescription>
                    </Alert>
                )}

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Coluna da Esquerda - Informações Pessoais */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="shadow-lg">
                            <CardHeader className="border-b">
                                <CardTitle className="flex items-center justify-between">
                                    <span>Informações Pessoais</span>
                                    <Button
                                        variant="outline"
                                        onClick={() => setEditando(!editando)}
                                    >
                                        {editando ? "Cancelar" : "Editar"}
                                    </Button>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="space-y-6">
                                    {/* Foto de Perfil */}
                                    <div className="flex items-center gap-6">
                                        <Avatar className="w-24 h-24">
                                            <AvatarImage src={currentUser.foto_perfil} />
                                            <AvatarFallback className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-2xl">
                                                {currentUser.full_name?.charAt(0) || currentUser.email?.charAt(0)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <h3 className="font-semibold mb-2">Foto de Perfil</h3>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handlePhotoUpload}
                                                className="hidden"
                                                id="photo-upload"
                                                disabled={uploadingPhoto}
                                            />
                                            <label htmlFor="photo-upload">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={uploadingPhoto}
                                                    asChild
                                                >
                                                    <span className="cursor-pointer">
                                                        {uploadingPhoto ? (
                                                            <>
                                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2" />
                                                                Enviando...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Upload className="w-4 h-4 mr-2" />
                                                                Alterar Foto
                                                            </>
                                                        )}
                                                    </span>
                                                </Button>
                                            </label>
                                        </div>
                                    </div>

                                    {/* Campos de Informações: Email, Cargo de Acesso e Gestores */}
                                    {/* This block replaces the old "Campos de Informações: Email e Cargo Administrativo" */}
                                    <div className="grid md:grid-cols-2 gap-6 border-t pt-6">
                                        <div className="space-y-1">
                                            <Label className="text-sm text-gray-500">E-mail</Label>
                                            <p className="font-semibold text-lg">{currentUser.email}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-sm text-gray-500">Cargo de Acesso</Label>
                                            <p className="font-semibold text-lg capitalize">{currentUser.cargo}</p>
                                        </div>
                                        <div className="space-y-1 md:col-span-2">
                                            <Label className="text-sm text-gray-500">Gestor(es) Responsável(is)</Label>
                                            <p className="font-semibold text-lg">
                                                {currentUser.gestores_responsaveis && currentUser.gestores_responsaveis.length > 0
                                                    ? currentUser.gestores_responsaveis.join(', ')
                                                    : 'Nenhum'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Conditional rendering for other user details based on editando state */}
                                    {editando ? (
                                        <>
                                            {/* Existing edit inputs for Full Name, Filial */}
                                            <div className="grid md:grid-cols-2 gap-4 mt-6 border-t pt-6">
                                                <div>
                                                    <Label htmlFor="nome">Nome Completo</Label>
                                                    <Input
                                                        id="nome"
                                                        value={formData.full_name}
                                                        onChange={(e) => handleInputChange("full_name", e.target.value)}
                                                        className="mt-1"
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="filial">Filial</Label>
                                                    <Select
                                                        value={formData.filial}
                                                        onValueChange={(value) => handleInputChange("filial", value)}
                                                    >
                                                        <SelectTrigger className="mt-1">
                                                            <SelectValue placeholder="Selecione uma filial" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="Sede Campo Grande/MS">Sede Campo Grande/MS</SelectItem>
                                                            <SelectItem value="Cuiabá/MT">Cuiabá/MT</SelectItem>
                                                            <SelectItem value="Cacoal/RO">Cacoal/RO</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>

                                            {/* Existing edit inputs for Setor, Cargo Funcional, Função Funcional */}
                                            <div className="grid md:grid-cols-2 gap-4">
                                                <div>
                                                    <Label htmlFor="setor">Setor</Label>
                                                    <Select
                                                        value={formData.setor}
                                                        onValueChange={(value) => handleInputChange("setor", value)}
                                                    >
                                                        <SelectTrigger className="mt-1">
                                                            <SelectValue placeholder="Selecione um setor" />
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
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div>
                                                    <Label htmlFor="cargo-funcional">Cargo Funcional</Label>
                                                    <Input
                                                        id="cargo-funcional"
                                                        value={formData.cargo_funcional}
                                                        onChange={(e) => handleInputChange("cargo_funcional", e.target.value)}
                                                        className="mt-1"
                                                        placeholder="Ex: Advogado Pleno"
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="funcao-funcional">Função Funcional</Label>
                                                    <Input
                                                        id="funcao-funcional"
                                                        value={formData.funcao_funcional}
                                                        onChange={(e) => handleInputChange("funcao_funcional", e.target.value)}
                                                        className="mt-1"
                                                        placeholder="Ex: Especialista em Contratos"
                                                    />
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        // Display mode: using the structure from the outline, adapted for currentUser
                                        <div className="grid md:grid-cols-2 gap-4 pt-4 border-t mt-4">
                                            <div className="md:col-span-2">
                                                <Label className="text-xs text-gray-500">Nome Completo</Label>
                                                <p className="font-semibold">{currentUser.full_name || 'Não definido'}</p>
                                            </div>
                                            <div>
                                                <Label className="text-xs text-gray-500">Filial</Label>
                                                <p className="font-semibold">{currentUser.filial || 'Não definida'}</p>
                                            </div>
                                            <div>
                                                <Label className="text-xs text-gray-500">Setor</Label>
                                                <p className="font-semibold">{currentUser.setor || 'Não definido'}</p>
                                            </div>
                                            <div>
                                                <Label className="text-xs text-gray-500">Cargo Funcional</Label>
                                                <p className="font-semibold">{currentUser.cargo_funcional || 'Não definido'}</p>
                                            </div>
                                            <div>
                                                <Label className="text-xs text-gray-500">Função Funcional</Label>
                                                <p className="font-semibold">{currentUser.funcao_funcional || 'Não definida'}</p>
                                            </div>
                                        </div>
                                    )}

                                    {editando && (
                                        <div className="border-t pt-6">
                                            <h4 className="font-semibold mb-4">Alterar Senha (Opcional)</h4>
                                            <div className="grid md:grid-cols-2 gap-4">
                                                <div>
                                                    <Label htmlFor="nova_senha">Nova Senha</Label>
                                                    <div className="relative mt-1">
                                                        <Input
                                                            id="nova_senha"
                                                            type={mostrarSenha ? "text" : "password"}
                                                            value={formData.nova_senha}
                                                            onChange={(e) => handleInputChange("nova_senha", e.target.value)}
                                                            placeholder="Mínimo 8 caracteres"
                                                        />
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8"
                                                            onClick={() => setMostrarSenha(!mostrarSenha)}
                                                        >
                                                            {mostrarSenha ? 
                                                                <EyeOff className="w-4 h-4" /> : 
                                                                <Eye className="w-4 h-4" />
                                                            }
                                                        </Button>
                                                    </div>
                                                </div>

                                                <div>
                                                    <Label htmlFor="confirmar_senha">Confirmar Senha</Label>
                                                    <Input
                                                        id="confirmar_senha"
                                                        type="password"
                                                        value={formData.confirmar_senha}
                                                        onChange={(e) => handleInputChange("confirmar_senha", e.target.value)}
                                                        placeholder="Digite a senha novamente"
                                                        className="mt-1"
                                                    />
                                                </div>
                                            </div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                                A senha deve ter pelo menos 8 caracteres, incluindo maiúscula, minúscula, número e caractere especial.
                                            </p>
                                        </div>
                                    )}

                                    {editando && (
                                        <div className="flex justify-end pt-6">
                                            <Button
                                                onClick={handleSave}
                                                disabled={saving} // Renamed from salvando
                                                className="bg-blue-600 hover:bg-blue-700"
                                            >
                                                {saving ? ( // Renamed from salvando
                                                    <>
                                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                                        Salvando...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Save className="w-4 h-4 mr-2" />
                                                        Salvar Alterações
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Coluna da Direita - Estatísticas */}
                    <div className="space-y-6">
                        <Card className="shadow-lg">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Star className="w-5 h-5 text-yellow-500" />
                                    Minhas Estatísticas
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="text-center p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg">
                                    <div className="flex items-center justify-center gap-2 mb-2">
                                        <Star className="w-6 h-6 text-yellow-500" />
                                        <span className="text-sm text-gray-600 dark:text-gray-400">Média Geral</span>
                                    </div>
                                    <p className="text-3xl font-bold text-yellow-600">
                                        {stats.mediaAvaliacao}/5.0
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                        <MessageCircle className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                                        <p className="text-2xl font-bold text-blue-600">{stats.feedbacksRecebidos}</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Recebidos</p>
                                    </div>

                                    <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                        <TrendingUp className="w-8 h-8 text-green-500 mx-auto mb-2" />
                                        <p className="text-2xl font-bold text-green-600">{stats.feedbacksEnviados}</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Enviados</p>
                                    </div>
                                </div>

                                <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total de Interações</p>
                                    <p className="xl font-bold">
                                        {stats.feedbacksRecebidos + stats.feedbacksEnviados}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Nova seção para listar feedbacks recebidos - VISÍVEL APENAS PARA USUÁRIOS COMUNS */}
                {currentUser?.cargo === 'usuario' && (
                    <Card className="mt-8 shadow-lg">
                        <CardHeader>
                            <CardTitle>Meus Feedbacks Recebidos</CardTitle>
                            <CardDescription>Aqui estão os feedbacks que você recebeu.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {feedbacksRecebidos.length > 0 ? (
                                <Accordion type="single" collapsible className="w-full">
                                    {feedbacksRecebidos.map(feedback => (
                                        <AccordionItem value={feedback.id} key={feedback.id}>
                                            <AccordionTrigger>
                                                <div className="flex justify-between items-center w-full pr-4">
                                                    <div className="flex items-center gap-4 text-left">
                                                        <span className="font-semibold">{feedback.titulo}</span>
                                                        <Badge className={getCargoColor(feedback.classificacao)}>{feedback.classificacao}</Badge>
                                                    </div>
                                                    <span className="text-sm text-gray-500">
                                                        {format(new Date(feedback.data_ocorrido), "dd/MM/yyyy")}
                                                    </span>
                                                </div>
                                            </AccordionTrigger>
                                            <AccordionContent className="space-y-2">
                                                <p className="text-gray-700 dark:text-gray-300">{feedback.descricao}</p>
                                                <div className="flex items-center justify-between text-sm text-gray-500 pt-2 border-t">
                                                    <span>De: {feedback.remetente_nome}</span>
                                                    <div className="flex items-center gap-1 font-semibold">
                                                        <Star className="w-4 h-4 text-yellow-500" />
                                                        <span>Nota: {feedback.nota}/5.0</span>
                                                    </div>
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>
                                    ))}
                                </Accordion>
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    <MessageCircle className="w-12 h-12 mx-auto mb-2" />
                                    <p>Você ainda não recebeu nenhum feedback.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
