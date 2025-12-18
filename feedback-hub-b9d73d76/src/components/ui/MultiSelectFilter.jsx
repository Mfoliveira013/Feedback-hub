
import React from 'react';
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export default function MultiSelectFilter({
    title,
    placeholder = "Todos",
    options,
    selectedValues,
    onSelectionChange,
    className
}) {
    const handleSelect = (value) => {
        const newSelection = selectedValues.includes(value)
            ? selectedValues.filter((item) => item !== value)
            : [...selectedValues, value];
        onSelectionChange(newSelection);
    };

    const getTriggerText = () => {
        if (selectedValues.length === 0) {
            return placeholder;
        }
        if (selectedValues.length === 1) {
            const selectedOption = options.find(opt => opt.value === selectedValues[0]);
            return selectedOption ? selectedOption.label : `1 selecionado`;
        }
        return `${selectedValues.length} selecionados`;
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-between font-normal", className)}>
                    <span className="truncate">{getTriggerText()}</span>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
                <DropdownMenuLabel>{title}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {options.map((option) => (
                    <DropdownMenuCheckboxItem
                        key={option.value}
                        checked={selectedValues.includes(option.value)}
                        onSelect={(e) => {
                            e.preventDefault();
                            handleSelect(option.value);
                        }}
                    >
                        {option.label}
                    </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
