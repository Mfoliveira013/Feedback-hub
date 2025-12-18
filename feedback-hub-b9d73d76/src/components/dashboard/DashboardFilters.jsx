import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import MultiSelectFilter from "@/components/ui/MultiSelectFilter";

const tipoAvaliacaoOptions = [
    { value: "feedback", label: "Feedback" },
    { value: "avaliacao_pontual", label: "Avaliação Pontual" },
    { value: "avaliacao_periodica", label: "Avaliação Periódica" },
    { value: "aic", label: "Avaliação A.I.C" },
];

const titulosAvaliacaoOptions = [
    { value: "Desenvolvimento", label: "Desenvolvimento" },
    { value: "Recuperação", label: "Recuperação" },
    { value: "Treinamento", label: "Treinamento" },
    { value: "Integração", label: "Integração" },
    { value: "Advertência Comportamental", label: "Advertência Comportamental" },
    { value: "Advertência Operacional", label: "Advertência Operacional" },
    { value: "Rescisão", label: "Rescisão" },
    { value: "Produtividade", label: "Produtividade" },
    { value: "Conduta Pessoal", label: "Conduta Pessoal" },
    { value: "Engajamento", label: "Engajamento" },
];

const setoresOptions = [
    { value: "RH", label: "RH" }, { value: "Controldesk", label: "Controldesk" }, { value: "Controladoria", label: "Controladoria" }, { value: "M.I.S", label: "M.I.S" },
    { value: "Extra", label: "Extra" }, { value: "Acordo Jud", label: "Acordo Jud" }, { value: "Contencioso", label: "Contencioso" }, { value: "Focais", label: "Focais" }, 
    { value: "Filiais", label: "Filiais" }, { value: "Iniciais", label: "Iniciais" }, { value: "Adm", label: "Adm" },
    { value: "Contrárias", label: "Contrárias" }, { value: "Tecnologia", label: "Tecnologia" }, { value: "Recuperação Judicial", label: "Recuperação Judicial" }
];

export default function DashboardFilters({ filters, onFilterChange, allUsers, onClearFilters }) {
    const userOptions = allUsers.map(user => ({ value: user.email, label: user.full_name }));

    return (
        <Card className="mt-4 p-4 shadow-sm rounded-xl bg-card">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 items-end">
                {/* Data Início */}
                <div className="flex flex-col gap-1.5">
                    <Label htmlFor="data-inicio" className="font-medium text-xs text-muted-foreground">De:</Label>
                    <Input
                        id="data-inicio"
                        type="date"
                        value={filters.dataInicio || ''}
                        onChange={(e) => onFilterChange({ ...filters, dataInicio: e.target.value })}
                        className="h-9 bg-background"
                    />
                </div>
                {/* Data Fim */}
                <div className="flex flex-col gap-1.5">
                    <Label htmlFor="data-fim" className="font-medium text-xs text-muted-foreground">Até:</Label>
                    <Input
                        id="data-fim"
                        type="date"
                        value={filters.dataFim || ''}
                        onChange={(e) => onFilterChange({ ...filters, dataFim: e.target.value })}
                        className="h-9 bg-background"
                    />
                </div>
                {/* Tipo de Avaliação */}
                <div className="flex flex-col gap-1.5">
                    <Label className="font-medium text-xs text-muted-foreground">Tipo da Avaliação:</Label>
                    <MultiSelectFilter
                        title="Selecionar Tipos"
                        options={tipoAvaliacaoOptions}
                        selectedValues={filters.tipo_avaliacao}
                        onSelectionChange={(selected) => onFilterChange({ ...filters, tipo_avaliacao: selected })}
                        className="h-9 bg-background"
                    />
                </div>
                {/* Título da Avaliação */}
                <div className="flex flex-col gap-1.5">
                    <Label className="font-medium text-xs text-muted-foreground">Título da Avaliação:</Label>
                    <MultiSelectFilter
                        title="Selecionar Títulos"
                        options={titulosAvaliacaoOptions}
                        selectedValues={filters.tipo}
                        onSelectionChange={(selected) => onFilterChange({ ...filters, tipo: selected })}
                        className="h-9 bg-background"
                    />
                </div>
                 {/* Setor */}
                <div className="flex flex-col gap-1.5">
                    <Label className="font-medium text-xs text-muted-foreground">Setor (Destinatário):</Label>
                     <MultiSelectFilter
                        title="Selecionar Setores"
                        options={setoresOptions}
                        selectedValues={filters.setor}
                        onSelectionChange={(selected) => onFilterChange({ ...filters, setor: selected })}
                        className="h-9 bg-background"
                    />
                </div>
                {/* Usuário */}
                <div className="flex flex-col gap-1.5">
                    <Label className="font-medium text-xs text-muted-foreground">Usuário (Destinatário):</Label>
                    <MultiSelectFilter
                        title="Selecionar Usuários"
                        options={userOptions}
                        selectedValues={filters.usuario}
                        onSelectionChange={(selected) => onFilterChange({ ...filters, usuario: selected })}
                        className="h-9 bg-background"
                        placeholder="Todos os usuários"
                    />
                </div>
                <Button variant="ghost" onClick={onClearFilters} className="h-9 self-end text-xs text-muted-foreground">Limpar</Button>
            </div>
        </Card>
    );
}