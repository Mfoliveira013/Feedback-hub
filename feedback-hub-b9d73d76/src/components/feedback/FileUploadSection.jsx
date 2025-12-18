import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { base44 } from "@/api/base44Client";
import { Upload, X, FileText, Paperclip, Loader2 } from 'lucide-react';
import { toast } from "sonner";

export default function FileUploadSection({ arquivos, onArquivosChange, disabled = false }) {
    const [uploading, setUploading] = useState(false);

    const handleFileUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        // Validação de tamanho (máximo 10MB por arquivo)
        const maxSize = 10 * 1024 * 1024; // 10MB
        const invalidFiles = files.filter(f => f.size > maxSize);
        
        if (invalidFiles.length > 0) {
            toast.error(`Alguns arquivos excedem o tamanho máximo de 10MB: ${invalidFiles.map(f => f.name).join(', ')}`);
            return;
        }

        setUploading(true);
        try {
            const uploadPromises = files.map(async (file) => {
                const { file_url } = await base44.integrations.Core.UploadFile({ file });
                return {
                    url: file_url,
                    nome: file.name,
                    tipo: file.type,
                    tamanho: file.size
                };
            });

            const uploadedFiles = await Promise.all(uploadPromises);
            onArquivosChange([...arquivos, ...uploadedFiles]);
            toast.success(`${uploadedFiles.length} arquivo(s) anexado(s) com sucesso!`);
        } catch (error) {
            console.error("Erro ao fazer upload:", error);
            toast.error("Falha ao fazer upload dos arquivos. Tente novamente.");
        } finally {
            setUploading(false);
        }
    };

    const handleRemoveFile = (index) => {
        const novosArquivos = arquivos.filter((_, i) => i !== index);
        onArquivosChange(novosArquivos);
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    return (
        <div className="space-y-4">
            <div>
                <Label className="text-base font-semibold flex items-center gap-2">
                    <Paperclip className="w-4 h-4" />
                    Anexar Arquivos (Opcional)
                </Label>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Anexe documentos, prints ou evidências que comprovem a avaliação (máx. 10MB por arquivo)
                </p>
            </div>

            <div className="flex gap-2">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('file-upload').click()}
                    disabled={disabled || uploading}
                    className="flex items-center gap-2"
                >
                    {uploading ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Enviando...
                        </>
                    ) : (
                        <>
                            <Upload className="w-4 h-4" />
                            Selecionar Arquivos
                        </>
                    )}
                </Button>
                <input
                    id="file-upload"
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.gif,.xls,.xlsx"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={disabled || uploading}
                />
            </div>

            {arquivos.length > 0 && (
                <Card>
                    <CardContent className="p-4">
                        <div className="space-y-2">
                            {arquivos.map((arquivo, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                >
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                {arquivo.nome}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {formatFileSize(arquivo.tamanho)}
                                            </p>
                                        </div>
                                    </div>
                                    {!disabled && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleRemoveFile(index)}
                                            className="flex-shrink-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}