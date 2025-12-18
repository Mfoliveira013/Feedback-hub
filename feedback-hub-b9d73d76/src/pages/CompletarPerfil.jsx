
import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { 
    Card, 
    CardContent, 
    CardHeader, 
    CardTitle, 
    CardDescription, 
    CardFooter 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select";
import { User as UserIcon, Save, AlertCircle, Shield, Users, Settings, MapPin } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function CompletarPerfil() {
    const [currentUser, setCurrentUser] = useState(null);
    const [formData, setFormData] = useState({
        full_name: "",
        setor: "",
        filial: "Sede Campo Grande/MS", // Added filial to initial state
        cargo: "usuario"
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const user = await User.me();
                setCurrentUser(user);
                setFormData({
                    full_name: user.full_name || "",
                    setor: user.setor || "",
                    filial: user.filial || "Sede Campo Grande/MS", // Initialize filial from user data or default
                    cargo: user.cargo || "usuario"
                });
            } catch (e) {
                console.error("Erro ao carregar usuário:", e);
                // Optionally handle error if user data can't be fetched, e.g., redirect to login
            }
        };
        fetchUser();
    }, []);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        // Validation
        if (!formData.full_name || !formData.setor || !formData.cargo || !formData.filial) { // Added filial to validation
            setError("Por favor, preencha todos os campos.");
            return;
        }

        if (formData.full_name.length < 2) {
            setError("Nome deve ter pelo menos 2 caracteres.");
            return;
        }

        setLoading(true);
        setError(""); // Clear previous errors

        try {
            // REGRA FINAL: Salva o cargo (incluindo 'administrador') diretamente no banco.
            await User.updateMyUserData({
                full_name: formData.full_name,
                setor: formData.setor,
                filial: formData.filial, // Added filial to update data
                cargo: formData.cargo
            });
            // Recarrega a página para forçar a atualização de todas as permissões após o cadastro.
            window.location.reload(); 
        } catch (e) {
            setError("Ocorreu um erro ao salvar seu perfil. Tente novamente.");
            console.error("Erro ao salvar perfil:", e);
        } finally {
            setLoading(false);
        }
    };

    const getCargoDescription = (cargo) => {
        switch (cargo) {
            case "administrador":
                return "Acesso total ao sistema. Se você definir um setor, terá acesso apenas aos dados desse setor (Administrador Setorial). Se não definir setor, terá acesso global a toda empresa.";
            case "gestor":
                return "Pode ver e gerenciar feedbacks apenas do seu setor e de sua equipe.";
            case "usuario":
                return "Pode enviar e receber feedbacks, ver apenas suas próprias informações.";
            default:
                return "";
        }
    };

    const getCargoIcon = (cargo) => {
        switch (cargo) {
            case "administrador":
                return <Settings className="w-5 h-5 text-purple-600" />;
            case "gestor":
                return <Users className="w-5 h-5 text-blue-600" />;
            case "usuario":
                return <UserIcon className="w-5 h-5 text-green-600" />;
            default:
                return <UserIcon className="w-5 h-5 text-gray-600" />;
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
            <Card className="w-full max-w-2xl shadow-2xl">
                <CardHeader className="text-center border-b bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                    <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <UserIcon className="w-10 h-10 text-white" />
                    </div>
                    <CardTitle className="text-3xl font-bold text-gray-900 dark:text-white">
                        Bem-vindo(a) ao Feedback Hub!
                    </CardTitle>
                    <CardDescription className="text-lg">
                        Complete seu cadastro para começar a usar o sistema de feedback corporativo.
                    </CardDescription>
                </CardHeader>
                
                <CardContent className="p-8 space-y-6">
                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {/* Nome Completo */}
                    <div className="space-y-2">
                        <Label htmlFor="full_name" className="text-base font-semibold">
                            Nome Completo *
                        </Label>
                        <Input
                            id="full_name"
                            placeholder="Digite seu nome completo"
                            value={formData.full_name}
                            onChange={(e) => handleInputChange("full_name", e.target.value)}
                            className="text-base h-12"
                        />
                    </div>

                    {/* Setor */}
                    <div className="space-y-2">
                        <Label htmlFor="setor" className="text-base font-semibold">
                            Setor de Trabalho *
                        </Label>
                        <Select
                            value={formData.setor}
                            onValueChange={(value) => handleInputChange("setor", value)}
                        >
                            <SelectTrigger id="setor" className="h-12 text-base">
                                <SelectValue placeholder="Selecione seu setor" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="RH">RH</SelectItem>
                                <SelectItem value="Controldesk">Controldesk</SelectItem>
                                <SelectItem value="Controladoria">Controladoria</SelectItem>
                                <SelectItem value="M.I.S">M.I.S</SelectItem>
                                <SelectItem value="Extra">Extra</SelectItem>
                                <SelectItem value="Acordo Jud">Acordo Jud</SelectItem>
                                <SelectItem value="Iniciais">Iniciais</SelectItem>
                                <SelectItem value="Contencioso">Contencioso</SelectItem>
                                <SelectItem value="Focais">Focais</SelectItem>
                                <SelectItem value="Filiais">Filiais</SelectItem> 
                                <SelectItem value="Adm">Adm</SelectItem>
                                <SelectItem value="Contrárias">Contrárias</SelectItem>
                                <SelectItem value="Tecnologia">Tecnologia</SelectItem>
                                <SelectItem value="Recuperação Judicial">Recuperação Judicial</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Filial */}
                    <div className="space-y-2">
                        <Label htmlFor="filial" className="text-base font-semibold flex items-center gap-2">
                           <MapPin className="w-5 h-5 text-blue-600" />
                            Filial *
                        </Label>
                        <Select
                            value={formData.filial}
                            onValueChange={(value) => handleInputChange("filial", value)}
                        >
                            <SelectTrigger id="filial" className="h-12 text-base">
                                <SelectValue placeholder="Selecione sua filial" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Sede Campo Grande/MS">Sede Campo Grande/MS</SelectItem>
                                <SelectItem value="Cuiabá/MT">Cuiabá/MT</SelectItem>
                                <SelectItem value="Cacoal/RO">Cacoal/RO</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Tipo de Conta */}
                    <div className="space-y-3">
                        <Label htmlFor="cargo" className="text-base font-semibold flex items-center gap-2">
                            <Shield className="w-5 h-5 text-blue-600" />
                            Tipo de Conta / Cargo *
                        </Label>
                        <Select
                            value={formData.cargo}
                            onValueChange={(value) => handleInputChange("cargo", value)}
                        >
                            <SelectTrigger id="cargo" className="h-12 text-base">
                                <SelectValue placeholder="Selecione seu tipo de conta" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="usuario">
                                    <div className="flex items-center gap-3">
                                        <UserIcon className="w-4 h-4 text-green-600" />
                                        <div>
                                            <div className="font-medium">Colaborador/Usuário</div>
                                            <div className="text-sm text-gray-500">Acesso básico ao sistema</div>
                                        </div>
                                    </div>
                                </SelectItem>
                                <SelectItem value="gestor">
                                    <div className="flex items-center gap-3">
                                        <Users className="w-4 h-4 text-blue-600" />
                                        <div>
                                            <div className="font-medium">Gestor/Supervisor</div>
                                            <div className="text-sm text-gray-500">Gerencia equipe do setor</div>
                                        </div>
                                    </div>
                                </SelectItem>
                                <SelectItem value="administrador">
                                    <div className="flex items-center gap-3">
                                        <Settings className="w-4 h-4 text-purple-600" />
                                        <div>
                                            <div className="font-medium">Administrador</div>
                                            <div className="text-sm text-gray-500">Acesso total ao sistema</div>
                                        </div>
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Descrição das Permissões */}
                    {formData.cargo && (
                        <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border">
                            <div className="flex items-start gap-3">
                                {getCargoIcon(formData.cargo)}
                                <div>
                                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                                        Permissões do {formData.cargo === "usuario" ? "Colaborador" : formData.cargo === "gestor" ? "Gestor" : "Administrador"}:
                                    </h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        {getCargoDescription(formData.cargo)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Informação de Segurança */}
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200 text-sm">
                            <Shield className="w-4 h-4" />
                            <span className="font-medium">Informação Importante:</span>
                        </div>
                        <p className="text-sm text-blue-700 dark:text-blue-300 mt-2">
                            Todas as informações são seguras e podem ser alteradas posteriormente nas configurações do seu perfil. 
                            Administradores também podem ajustar permissões conforme necessário.
                        </p>
                    </div>
                </CardContent>

                <CardFooter className="p-8 pt-0">
                    <Button
                        className="w-full h-12 text-base bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                        onClick={handleSave}
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                                Finalizando cadastro...
                            </>
                        ) : (
                            <>
                                <Save className="w-5 h-5 mr-2" />
                                Finalizar Cadastro e Entrar
                            </>
                        )}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
