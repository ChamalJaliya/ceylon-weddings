"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ArrowLeft, ChevronRight, LogOut } from "lucide-react";
import { api, useAuthStore } from "@ceylonweddings/web";
import { Button } from "@ceylonweddings/ui/components/button";
import { Icon } from "@ceylonweddings/ui/components/icon";
import { Popover, PopoverContent, PopoverTrigger } from "@ceylonweddings/ui/components/popover";
import { BrandMark } from "@ceylonweddings/ui/domain/brand-mark";
import { homeForRole } from "@/components/auth-nav";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { readReturnPath } from "./return-path";
import { sectionForPath } from "./settings-config";

/**
 * Settings as its own context (Kloqra settings-standalone-shell): the dashboard
 * rail is replaced by a slim header — brand · ← Back to where you were ·
 * Settings › Section — so account settings never feel like a wedding/vendor page.
 */
export function SettingsShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const section = sectionForPath(pathname);
  const home = homeForRole(user?.role);
  const [returnTo, setReturnTo] = useState<string | null>(null);

  useEffect(() => setReturnTo(readReturnPath()), []);

  const initials = (user?.name ?? "CW")
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <div className="flex min-h-dvh flex-col bg-background" data-testid="settings-shell">
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-3 px-4 sm:px-6">
          <Link href={home} className="flex shrink-0 items-center gap-2.5 text-foreground hover:opacity-85">
            <BrandMark className="h-8 w-auto text-primary" />
            <span className="hidden font-serif text-h4 tracking-spaced uppercase sm:inline">Ceylon Weddings</span>
          </Link>
          <span className="h-5 w-px shrink-0 bg-border" aria-hidden />
          <Link
            href={returnTo ?? home}
            className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-compact font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <Icon icon={ArrowLeft} size="xs" lottie={false} />
            {returnTo ? "Back" : "Back to dashboard"}
          </Link>
          {section ? (
            <nav aria-label="Breadcrumb" className="hidden min-w-0 items-center gap-1.5 text-compact md:flex">
              <span className="h-5 w-px bg-border" aria-hidden />
              <Link href="/settings/profile" className="pl-1.5 text-muted-foreground hover:text-foreground">
                Settings
              </Link>
              <Icon icon={ChevronRight} size="xs" lottie={false} className="text-muted-foreground" />
              <span className="truncate font-medium text-foreground" aria-current="page">
                {section.title}
              </span>
            </nav>
          ) : null}

          <div className="ml-auto flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="grid size-9 place-items-center rounded-full bg-secondary text-caption font-medium text-secondary-foreground"
                  aria-label={user?.name ?? "Account"}
                >
                  {initials}
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-60">
                <p className="truncate font-medium text-foreground">{user?.name}</p>
                <p className="mb-3 truncate text-caption text-muted-foreground">{user?.email}</p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  iconLeft={LogOut}
                  onClick={async () => {
                    await api.logout();
                    setUser(null);
                    router.push("/login");
                  }}
                >
                  Sign out
                </Button>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
