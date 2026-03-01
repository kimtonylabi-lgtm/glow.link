"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

interface Option {
    id?: string
    name: string
}

interface CreatableComboboxProps {
    options: Option[]
    value?: string
    onChange: (value: string) => void
    placeholder?: string
    emptyMessage?: string
    className?: string
    onValueChange?: (value: string) => void
}

export function CreatableCombobox({
    options,
    value,
    onChange,
    placeholder = "검색 또는 직접 입력...",
    emptyMessage = "검색 결과가 없습니다.",
    className,
    onValueChange,
}: CreatableComboboxProps) {
    const [open, setOpen] = React.useState(false)
    const [search, setSearch] = React.useState("")

    const handleSelect = (currentValue: string) => {
        const trimmedValue = currentValue.trim()
        onChange(trimmedValue)
        setOpen(false)
        setSearch("")
    }

    // Check if there is an exact match in the options
    const hasExactMatch = options.some(
        (option) => option.name.toLowerCase() === search.trim().toLowerCase()
    )

    const showCreatable = search.trim() !== "" && !hasExactMatch

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                        "w-full justify-between bg-background/50 border-border/50 font-normal",
                        !value && "text-muted-foreground",
                        className
                    )}
                >
                    <span className="truncate">{value || placeholder}</span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0 bg-card/95 backdrop-blur-xl border border-border/50 shadow-2xl z-[100]">
                <Command shouldFilter={true}>
                    <CommandInput
                        placeholder={placeholder}
                        value={search}
                        onValueChange={(val) => {
                            setSearch(val)
                            onValueChange?.(val)
                        }}
                    />
                    <CommandList className="max-h-[300px]">
                        <CommandEmpty className="p-0">
                            {showCreatable ? (
                                <div
                                    className="flex items-center gap-2 px-4 py-3 cursor-pointer text-primary font-bold hover:bg-primary/10 transition-colors border-b border-border/40"
                                    onClick={() => handleSelect(search)}
                                >
                                    <Plus className="w-4 h-4" />
                                    <span>"{search.trim()}" 추가하기</span>
                                </div>
                            ) : (
                                <div className="py-6 text-center text-sm text-muted-foreground">
                                    {emptyMessage}
                                </div>
                            )}
                        </CommandEmpty>

                        <CommandGroup>
                            {options.map((option, idx) => (
                                <CommandItem
                                    key={option.id || `${option.name}-${idx}`}
                                    value={option.name}
                                    onSelect={(currentValue) => handleSelect(currentValue)}
                                    className="cursor-pointer"
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === option.name ? "opacity-100 text-primary" : "opacity-0"
                                        )}
                                    />
                                    {option.name}
                                </CommandItem>
                            ))}
                        </CommandGroup>

                        {showCreatable && options.length > 0 && (
                            <CommandGroup className="border-t border-border/40 mt-1 pt-1">
                                <CommandItem
                                    value={search.trim()}
                                    onSelect={(val) => handleSelect(val)}
                                    className="text-primary font-bold cursor-pointer"
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    <span>"{search.trim()}" 추가하기</span>
                                </CommandItem>
                            </CommandGroup>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
