"use client";

import type { ReactNode } from "react";
import { Icon } from "@ceylonweddings/ui/components/icon";
import { NativeSelect } from "@ceylonweddings/ui/components/native-select";
import { cn } from "@ceylonweddings/ui/utils";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { SettingsSearch } from "./components/settings-search";
import { SETTINGS_GROUPS, SETTINGS_SECTIONS, sectionForPath } from "./settings-config";

/**
 * Constant Settings chrome (Kloqra SettingsLayout):
 * 1. Title band + search above everything.
 * 2. Sticky grouped section tabs on the left (a picker on phones).
 * 3. Section content on the right.
 */
export default function SettingsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const active = sectionForPath(pathname);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 pt-8 pb-20 sm:px-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between md:pl-64">
        <div className="grid gap-1">
          <p className="cw-eyebrow">Settings</p>
          <h1 className="font-serif text-h2 text-foreground">{active?.title ?? "Settings"}</h1>
          <p className="max-w-xl text-muted-foreground">
            {active?.description ?? "Manage your account and how Ceylon Weddings looks for you."}
          </p>
        </div>
        <div className="w-full sm:w-72">
          <SettingsSearch />
        </div>
      </header>

      <div className="flex flex-col gap-6 md:flex-row md:gap-10">
        <nav aria-label="Settings sections" className="hidden shrink-0 md:block md:w-54">
          <div className="sticky top-24 grid gap-6">
            {SETTINGS_GROUPS.map((group) => (
              <div key={group.id} className="grid gap-1">
                <p className="cw-eyebrow px-3 pb-1">{group.title}</p>
                {SETTINGS_SECTIONS.filter((s) => s.group === group.id).map((section) => {
                  const isActive = section.id === active?.id;
                  return (
                    <Link
                      key={section.id}
                      href={section.href}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-2.5 rounded-xl px-3 py-2 text-compact transition-colors",
                        isActive
                          ? "bg-primary-subtle font-medium text-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground",
                      )}
                    >
                      <Icon
                        icon={section.icon}
                        size="xs"
                        lottie={false}
                        className={isActive ? "text-primary" : undefined}
                      />
                      {section.title}
                    </Link>
                  );
                })}
              </div>
            ))}
          </div>
        </nav>

        <NativeSelect
          aria-label="Settings section"
          className="md:hidden"
          value={active?.href ?? ""}
          onChange={(event) => router.push(event.target.value)}
        >
          {SETTINGS_GROUPS.map((group) => (
            <optgroup key={group.id} label={group.title}>
              {SETTINGS_SECTIONS.filter((s) => s.group === group.id).map((section) => (
                <option key={section.id} value={section.href}>
                  {section.title}
                </option>
              ))}
            </optgroup>
          ))}
        </NativeSelect>

        <div className="grid min-w-0 flex-1 content-start gap-6">{children}</div>
      </div>
    </div>
  );
}
