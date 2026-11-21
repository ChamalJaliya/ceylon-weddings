"use client";

import { useId, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@ceylonweddings/ui/components/input";
import { Icon } from "@ceylonweddings/ui/components/icon";
import { cn } from "@ceylonweddings/ui/utils";
import { useRouter } from "@/i18n/navigation";
import { searchSettings } from "../settings-config";

/** Type "password", "dark", "sinhala"… and jump to the section that has it. */
export function SettingsSearch() {
  const router = useRouter();
  const listId = useId();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const results = searchSettings(query);
  const open = query.trim().length > 0;

  const go = (href: string) => {
    setQuery("");
    router.push(href);
  };

  return (
    <div className="relative">
      <Icon
        icon={Search}
        size="xs"
        lottie={false}
        className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        type="search"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label="Search settings"
        placeholder="Search settings…"
        value={query}
        className="pl-9"
        onChange={(event) => {
          setQuery(event.target.value);
          setActive(0);
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setActive((i) => Math.min(i + 1, Math.max(results.length - 1, 0)));
          } else if (event.key === "ArrowUp") {
            event.preventDefault();
            setActive((i) => Math.max(i - 1, 0));
          } else if (event.key === "Enter" && results[active]) {
            event.preventDefault();
            go(results[active].href);
          } else if (event.key === "Escape") {
            setQuery("");
          }
        }}
      />
      {open ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute top-full right-0 left-0 z-20 mt-2 grid gap-0.5 rounded-2xl border border-border bg-popover p-1.5 shadow-lg"
        >
          {results.length ? (
            results.map((item, index) => (
              <li key={item.id} role="option" aria-selected={index === active}>
                <button
                  type="button"
                  onMouseEnter={() => setActive(index)}
                  onClick={() => go(item.href)}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-xl px-3 py-2 text-left",
                    index === active ? "bg-accent" : "hover:bg-accent",
                  )}
                >
                  <Icon icon={item.icon} size="xs" lottie={false} className="mt-1 text-primary" />
                  <span className="grid gap-0.5">
                    <span className="text-compact font-medium text-foreground">{item.title}</span>
                    <span className="text-caption text-muted-foreground">{item.description}</span>
                  </span>
                </button>
              </li>
            ))
          ) : (
            <li className="px-3 py-2 text-caption text-muted-foreground">No setting matches “{query}”.</li>
          )}
        </ul>
      ) : null}
    </div>
  );
}
