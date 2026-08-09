"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export function SimpleSelect({
  value,
  defaultValue,
  onValueChange,
  name,
  placeholder,
  disabled,
  required,
  className,
  options,
}: {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  name?: string;
  placeholder: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  options: { value: string; label: React.ReactNode }[];
}) {
  return (
    <Select
      items={options}
      value={value}
      defaultValue={defaultValue}
      onValueChange={(v) => onValueChange?.((v as string) ?? "")}
      name={name}
      disabled={disabled}
      required={required}
    >
      <SelectTrigger className={cn("h-8 w-full", className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
