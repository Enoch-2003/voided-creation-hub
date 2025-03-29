
import * as React from "react"
import { X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Command, CommandGroup, CommandItem } from "@/components/ui/command"
import { Command as CommandPrimitive } from "cmdk"
import { cn } from "@/lib/utils"

export type Option = {
  label: string
  value: string
}

interface MultiSelectProps {
  options: Option[]
  selected: Option[]
  onChange: (selected: Option[]) => void
  placeholder?: string
  className?: string
  id?: string
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Select options",
  className,
  id,
}: MultiSelectProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState("")

  // Ensure selected is always an array, even if undefined is passed
  const safeSelected = React.useMemo(() => {
    return Array.isArray(selected) ? selected : [];
  }, [selected]);

  const handleUnselect = React.useCallback((option: Option) => {
    const filtered = safeSelected.filter((s) => s.value !== option.value)
    onChange(filtered)
  }, [safeSelected, onChange]);

  const handleKeyDown = React.useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    const input = inputRef.current
    if (input) {
      if (e.key === "Delete" || e.key === "Backspace") {
        if (input.value === "" && safeSelected.length > 0) {
          const newSelected = [...safeSelected]
          newSelected.pop()
          onChange(newSelected)
        }
      }
      if (e.key === "Escape") {
        setOpen(false)
      }
    }
  }, [safeSelected, onChange]);

  const handleSelect = React.useCallback((option: Option) => {
    const isSelected = safeSelected.some((s) => s.value === option.value)
    if (isSelected) {
      handleUnselect(option)
    } else {
      onChange([...safeSelected, option])
    }
    setInputValue("")
  }, [safeSelected, onChange, handleUnselect]);

  // Safety check for options
  const safeOptions = React.useMemo(() => {
    return Array.isArray(options) ? options : [];
  }, [options]);

  const selectableOptions = React.useMemo(() => {
    return safeOptions.filter(
      (option) => !safeSelected.some((s) => s.value === option.value)
    );
  }, [safeOptions, safeSelected]);

  return (
    <div 
      className={cn("relative", className)}
      id={id}
      onKeyDown={handleKeyDown}
    >
      <div
        className={cn(
          "flex min-h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
          "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
          "flex-wrap gap-1"
        )}
        onClick={() => {
          setOpen(true)
          inputRef.current?.focus()
        }}
      >
        {safeSelected.map((option) => (
          <Badge
            key={option.value}
            variant="secondary"
            className="flex items-center gap-1"
          >
            {option.label}
            <button
              className="rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleUnselect(option)
                }
              }}
              onMouseDown={(e) => {
                e.preventDefault()
                e.stopPropagation()
              }}
              onClick={() => handleUnselect(option)}
            >
              <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
            </button>
          </Badge>
        ))}
        <CommandPrimitive>
          <input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className={cn(
              "placeholder:text-muted-foreground flex-1 bg-transparent outline-none"
            )}
            placeholder={safeSelected.length === 0 ? placeholder : undefined}
          />
        </CommandPrimitive>
      </div>
      <div className="relative">
        {open && (
          <div className="absolute top-0 z-10 w-full rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in">
            <Command className="overflow-auto max-h-60">
              <CommandGroup>
                {selectableOptions.length > 0 ? (
                  selectableOptions.map((option) => (
                    <CommandItem
                      key={option.value}
                      onSelect={() => handleSelect(option)}
                      className="cursor-pointer"
                    >
                      {option.label}
                    </CommandItem>
                  ))
                ) : (
                  <div className="py-2 px-4 text-center text-sm text-muted-foreground">
                    No options available
                  </div>
                )}
              </CommandGroup>
            </Command>
          </div>
        )}
      </div>
    </div>
  )
}
