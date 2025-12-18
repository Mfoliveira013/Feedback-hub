import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, Palette, Bell, Shield, Save } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Configuracoes() {
    const [currentUser, setCurrentUser] = useState(null);
    const [configuracoes, setConfiguracoes] = useState({
        tema: "claro",
        notificacoes_email: true,
        notificacoes_push: false,
        idioma: "pt-BR"
    });
    const [salvando, setSalvando] = useState(false);
    const [sucesso, setSucesso] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const user = await User.me();
            setCurrentUser(user);
            
            setConfiguracoes({
                tema: user.tema || "claro",
                notificacoes_email: user.notificacoes_email !== false,
                notificacoes_push: user.notificacoes_push || false,
                idioma: user.idioma || "pt-BR"
            });
        } catch (error) {
            console.error("Erro ao carregar configurações:", error);
        }
    };

    const handleConfigChange = (campo, valor) => {
        setConfiguracoes(prev => ({
            ...prev,
            [campo]: valor
        }));

        // Aplicar tema imediatamente
        if (campo === "tema") {
            document.documentElement.setAttribute('data-theme', valor);
        }
    };

    const handleSave = async () => {
        setSalvando(true);
        try {
            await User.updateMyUserData({
                tema: configuracoes.tema,
                notificacoes_email: configuracoes.notificacoes_email,
                notificacoes_push: configuracoes.notificacoes_push,
                idioma: configuracoes.idioma
            });

            setCurrentUser(prev => ({ ...prev, ...configuracoes }));
            setSucesso(true);
            setTimeout(() => setSucesso(false), 3000);
        } catch (error) {
            console.error("Erro ao salvar configurações:", error);
            alert("Erro ao salvar configurações. Tente novamente.");
        }
        setSalvando(false);
    };

    if (!currentUser) {
        return <div className="p-8">Carregando...</div>;
    }

    return (
        <div className="p-6 md:p-8">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
                        <Settings className="w-8 h-8 text-blue-600" />
                        Configurações
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Personalize sua experiência no Feedback Hub.
                    </p>
                </div>

                {sucesso && (
                    <Alert className="mb-6 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                        <Save className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-800 dark:text-green-200">
                            Configurações salvas com sucesso!
                        </AlertDescription>
                    </Alert>
                )}

                <div className="space-y-6">
                    {/* Aparência */}
                    <Card className="shadow-lg">
                        <CardHeader className="border-b">
                            <CardTitle className="flex items-center gap-2">
                                <Palette className="w-5 h-5 text-purple-600" />
                                Aparência
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label className="text-base font-semibold">Tema da Interface</Label>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                            Escolha entre tema claro ou escuro
                                        </p>
                                    </div>
                                    <Select
                                        value={configuracoes.tema}
                                        onValueChange={(value) => handleConfigChange("tema", value)}
                                    >
                                        <SelectTrigger className="w-40">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="claro">🌞 Claro</SelectItem>
                                            <SelectItem value="escuro">🌙 Escuro</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label className="text-base font-semibold">Idioma</Label>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                            Selecione o idioma da interface
                                        </p>
                                    </div>
                                    <Select
                                        value={configuracoes.idioma}
                                        onValueChange={(value) => handleConfigChange("idioma", value)}
                                    >
                                        <SelectTrigger className="w-40">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="pt-BR">🇧🇷 Português</SelectItem>
                                            <SelectItem value="en-US">🇺🇸 English</SelectItem>
                                            <SelectItem value="es-ES">🇪🇸 Español</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Notificações */}
                    <Card className="shadow-lg">
                        <CardHeader className="border-b">
                            <CardTitle className="flex items-center gap-2">
                                <Bell className="w-5 h-5 text-blue-600" />
                                Notificações
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label className="text-base font-semibold">Notificações por E-mail</Label>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                            Receba notificações de novos feedbacks por e-mail
                                        </p>
                                    </div>
                                    <Switch
                                        checked={configuracoes.notificacoes_email}
                                        onCheckedChange={(checked) => handleConfigChange("notificacoes_email", checked)}
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label className="text-base font-semibold">Notificações Push</Label>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                            Receba notificações push no navegador
                                        </p>
                                    </div>
                                    <Switch
                                        checked={configuracoes.notificacoes_push}
                                        onCheckedChange={(checked) => handleConfigChange("notificacoes_push", checked)}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Privacidade e Segurança */}
                    <Card className="shadow-lg">
                        <CardHeader className="border-b">
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="w-5 h-5 text-green-600" />
                                Privacidade e Segurança
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="space-y-4">
                                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                    <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                                        Proteção de Dados
                                    </h3>
                                    <p className="text-sm text-blue-800 dark:text-blue-200">
                                        Seus feedbacks são criptografados e protegidos. Apenas você e os destinatários podem visualizá-los.
                                    </p>
                                </div>

                                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                    <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                                        Acesso Seguro
                                    </h3>
                                    <p className="text-sm text-green-800 dark:text-green-200">
                                        Sua conta está protegida com autenticação via Google. Recomendamos manter a autenticação de dois fatores ativada.
                                    </p>
                                </div>

                                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                                    <h3 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
                                        Retenção de Dados
                                    </h3>
                                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                        Os feedbacks são mantidos por tempo indeterminado para histórico e análises. 
                                        Você pode solicitar a remoção através do suporte.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Informações da Conta */}
                    <Card className="shadow-lg">
                        <CardHeader className="border-b">
                            <CardTitle>Informações da Conta</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="grid md:grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-gray-600 dark:text-gray-400">Versão do Sistema:</span>
                                    <span className="font-medium ml-2">v1.0.0</span>
                                </div>
                                <div>
                                    <span className="text-gray-600 dark:text-gray-400">Último Login:</span>
                                    <span className="font-medium ml-2">Agora</span>
                                </div>
                                <div>
                                    <span className="text-gray-600 dark:text-gray-400">Tipo de Conta:</span>
                                    <span className="font-medium ml-2 capitalize">{currentUser.cargo}</span>
                                </div>
                                <div>
                                    <span className="text-gray-600 dark:text-gray-400">Setor:</span>
                                    <span className="font-medium ml-2">{currentUser.setor}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Salvar Configurações */}
                    <div className="flex justify-end">
                        <Button
                            onClick={handleSave}
                            disabled={salvando}
                            className="bg-blue-600 hover:bg-blue-700 px-8 py-2"
                        >
                            {salvando ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                    Salvando...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    Salvar Configurações
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}