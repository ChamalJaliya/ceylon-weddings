"use client";

import { useState } from "react";
import { Input } from "../components/input";
import { cn } from "../lib/utils";
import { AttributeHelp } from "./attribute-help";
import { ChoiceCard } from "./choice-card";
import { StudioCollapse } from "./creator-form";

export type AttributeFieldOption = {
  key: string;
  label: string;
  helpText?: string | null;
  count?: number | null;
  disabled?: boolean;
};

export type AttributeFieldValue =
  | { optionKeys: string[] }
  | { boolean: boolean }
  | { number: number }
  | { range: { min?: number; max?: number } }
  | { text: string };

export type AttributeFieldDefinition = {
  key: string;
  valueType: "SELECT" | "MULTISELECT" | "BOOLEAN" | "NUMBER" | "RANGE" | "TEXT";
  question: string;
  instruction?: string | null;
  helpText?: string | null;
  unit?: string | null;
  minValue?: number | null;
  maxValue?: number | null;
  maxSelect?: number | null;
  layout?: string | null;
  options?: AttributeFieldOption[];
};

function optionKeysOf(value: AttributeFieldValue | undefined): string[] {
  if (value && "optionKeys" in value) return value.optionKeys;
  return [];
}

export function isAttributeAnswered(value: AttributeFieldValue | undefined): boolean {
  if (!value) return false;
  if ("optionKeys" in value) return value.optionKeys.length > 0;
  if ("boolean" in value) return true;
  if ("number" in value) return Number.isFinite(value.number);
  if ("range" in value) return value.range.min !== undefined || value.range.max !== undefined;
  if ("text" in value) return value.text.trim().length > 0;
  return false;
}

function attributeSummary(definition: AttributeFieldDefinition, value?: AttributeFieldValue): string {
  if (!isAttributeAnswered(value) || !value) return "Not answered yet";
  if ("optionKeys" in value) {
    const labels = (definition.options ?? [])
      .filter((option) => value.optionKeys.includes(option.key))
      .map((option) => option.label);
    return labels.join(", ") || `${value.optionKeys.length} selected`;
  }
  if ("boolean" in value) return value.boolean ? "Yes" : "No";
  if ("number" in value) {
    return definition.unit ? `${value.number} ${definition.unit}` : String(value.number);
  }
  if ("range" in value) {
    const min = value.range.min ?? "—";
    const max = value.range.max ?? "—";
    return `${min}–${max}${definition.unit ? ` ${definition.unit}` : ""}`;
  }
  if ("text" in value) return value.text;
  return "Answered";
}

export function AttributeField({
  definition,
  value,
  onChange,
  mode = "vendor",
  hint,
  hideHeader = false,
  collapsible = false,
  className,
}: {
  definition: AttributeFieldDefinition;
  value?: AttributeFieldValue;
  onChange: (next: AttributeFieldValue) => void;
  mode?: "vendor" | "filter";
  hint?: string | null;
  /** When true, skip question/help/instruction — useful inside an outer wizard header. */
  hideHeader?: boolean;
  /** Collapse the question into a row; unanswered questions start open. */
  collapsible?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(() => !isAttributeAnswered(value));
  const options = definition.options ?? [];
  const layout = definition.layout ?? "CARDS";
  const gridClass =
    layout === "GRID"
      ? "grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
      : layout === "LIST"
        ? "grid gap-2"
        : "grid gap-3 sm:grid-cols-2";

  const fields = (
    <>
      {definition.valueType === "SELECT" || definition.valueType === "MULTISELECT" ? (
        <div className={gridClass}>
          {options.map((option) => {
            const selected = optionKeysOf(value).includes(option.key);
            const multi = definition.valueType === "MULTISELECT";
            return (
              <ChoiceCard
                key={option.key}
                title={option.label}
                helpText={option.helpText}
                selected={selected}
                multi={multi}
                disabled={option.disabled}
                count={option.count}
                onSelect={() => {
                  if (multi) {
                    const current = optionKeysOf(value);
                    const next = selected
                      ? current.filter((key) => key !== option.key)
                      : definition.maxSelect && current.length >= definition.maxSelect
                        ? current
                        : [...current, option.key];
                    onChange({ optionKeys: next });
                    return;
                  }
                  onChange({ optionKeys: selected ? [] : [option.key] });
                }}
              />
            );
          })}
        </div>
      ) : null}

      {definition.valueType === "BOOLEAN" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <ChoiceCard
            title="Yes"
            selected={value && "boolean" in value ? value.boolean === true : false}
            onSelect={() => onChange({ boolean: true })}
          />
          <ChoiceCard
            title="No"
            selected={value && "boolean" in value ? value.boolean === false : false}
            onSelect={() => onChange({ boolean: false })}
          />
        </div>
      ) : null}

      {definition.valueType === "TEXT" ? (
        <Input
          value={value && "text" in value ? value.text : ""}
          onChange={(event) => onChange({ text: event.target.value })}
          placeholder={mode === "filter" ? "Search…" : "Your answer"}
        />
      ) : null}

      {definition.valueType === "NUMBER" ? (
        <div className="flex max-w-xs items-center gap-2">
          <Input
            type="number"
            value={value && "number" in value ? String(value.number) : ""}
            min={definition.minValue ?? undefined}
            max={definition.maxValue ?? undefined}
            onChange={(event) => {
              const num = Number(event.target.value);
              if (!Number.isFinite(num)) return;
              onChange({ number: num });
            }}
          />
          {definition.unit ? <span className="text-sm text-muted-foreground">{definition.unit}</span> : null}
        </div>
      ) : null}

      {definition.valueType === "RANGE" ? (
        <div className="grid max-w-lg gap-3 sm:grid-cols-2">
          <label className="grid gap-1.5">
            <span className="text-[13px] font-medium leading-none tracking-[0.01em] text-foreground/80">
              Min{definition.unit ? ` (${definition.unit})` : ""}
            </span>
            <Input
              type="number"
              value={value && "range" in value && value.range.min !== undefined ? String(value.range.min) : ""}
              min={definition.minValue ?? undefined}
              max={definition.maxValue ?? undefined}
              onChange={(event) => {
                const raw = event.target.value.trim();
                const min = raw === "" ? undefined : Number(raw);
                const current = value && "range" in value ? value.range : {};
                onChange({
                  range: {
                    ...current,
                    min: min !== undefined && Number.isFinite(min) ? min : undefined,
                  },
                });
              }}
            />
          </label>
          <label className="grid gap-1.5">
            <span className="text-[13px] font-medium leading-none tracking-[0.01em] text-foreground/80">
              Max{definition.unit ? ` (${definition.unit})` : ""}
            </span>
            <Input
              type="number"
              value={value && "range" in value && value.range.max !== undefined ? String(value.range.max) : ""}
              min={definition.minValue ?? undefined}
              max={definition.maxValue ?? undefined}
              onChange={(event) => {
                const raw = event.target.value.trim();
                const max = raw === "" ? undefined : Number(raw);
                const current = value && "range" in value ? value.range : {};
                onChange({
                  range: {
                    ...current,
                    max: max !== undefined && Number.isFinite(max) ? max : undefined,
                  },
                });
              }}
            />
          </label>
        </div>
      ) : null}
    </>
  );

  if (collapsible) {
    return (
      <StudioCollapse
        open={open}
        onOpenChange={setOpen}
        className={className}
        title={definition.question}
        subtitle={attributeSummary(definition, value)}
        action={<AttributeHelp text={definition.helpText} />}
      >
        {definition.instruction ? (
          <p className="text-sm text-muted-foreground">{definition.instruction}</p>
        ) : null}
        {hint ? <p className="text-xs text-primary">{hint}</p> : null}
        {fields}
      </StudioCollapse>
    );
  }

  return (
    <div className={cn("grid gap-4", className)}>
      {!hideHeader ? (
        <div className="grid gap-1">
          <div className="flex items-start gap-2">
            <h3 className="font-serif text-2xl font-semibold tracking-tight">{definition.question}</h3>
            <AttributeHelp text={definition.helpText} />
          </div>
          {definition.instruction ? (
            <p className="text-sm text-muted-foreground">{definition.instruction}</p>
          ) : null}
          {hint ? <p className="text-xs text-primary">{hint}</p> : null}
        </div>
      ) : hint ? (
        <p className="text-xs text-primary">{hint}</p>
      ) : null}

      {fields}
    </div>
  );
}
