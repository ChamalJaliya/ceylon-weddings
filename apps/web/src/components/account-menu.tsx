"use client";

import { useEffect, useState } from "react";
import { Bell, HandHelping, LogOut, Monitor, Moon, Settings, Sun, UserRound, type LucideIcon } from "lucide-react";
import { useTheme } from "next-themes";
import type { Role, ThemeMode } from "@ceylonweddings/contracts";
import { api, useAuthStore } from "@ceylonweddings/web";
import { Icon } from "@ceylonweddings/ui/components/icon";
import { Popover, PopoverContent, PopoverTrigger } from "@ceylonweddings/ui/components/popover";
import { cn } from "@ceylonweddings/ui/utils";
import { Link, useRouter } from "@/i18n/navigation";

const ROLE_LABEL: Record<Role, string> = {
  COUPLE: "Couple",
  FAMILY: "Family member",
  VENDOR: "Vendor",
  ADMIN: "Ceylon Weddings team",
};

const MODES: ReadonlyArray<{ value: ThemeMode; label: string; icon: LucideIcon }> = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

const itemClass =
  "flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-compact text-foreground transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none";

function MenuIcon({ icon, danger = false }: { icon: LucideIcon; danger?: boolean }) {
  return (
    <span
      className={cn(
        "grid size-7 shrink-0 place-items-center rounded-md border",
        danger
          ? "border-status-danger-border bg-status-danger-bg text-status-danger-fg"
          : "border-border bg-card text-muted-foreground",
      )}
    >
      <Icon icon={icon} size="xs" lottie={false} />
    </span>
  );
}

/**
 * Header account menu (Kloqra AccountMenu): identity card, Profile / Settings /
 * Notifications / Help, a Light · Dark · System switch, and Log out.
 */
export function AccountMenu({ overlay = false }: { overlay?: boolean }) {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!user) return null;
  const initials = user.name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  const close = () => setOpen(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Account menu for ${user.name}`}
          data-testid="account-menu-trigger"
          className={cn(
            "grid size-9 place-items-center rounded-full bg-primary text-caption font-medium text-primary-foreground ring-2 ring-transparent transition-[box-shadow,transform] hover:scale-[1.04] focus-visible:outline-none focus-visible:ring-ring",
            open && "ring-primary/30",
            overlay && "ring-hero-foreground/30",
          )}
        >
          {initials}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={10} className="w-[min(17.5rem,calc(100vw-1.5rem))] overflow-hidden p-0">
        <div className="border-b border-border p-3">
          <div className="flex items-center gap-3 rounded-xl bg-primary-subtle/60 px-3 py-2.5">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary text-compact font-medium text-primary-foreground">
              {initials}
            </span>
            <div className="min-w-0">
              <p className="truncate text-compact font-medium text-foreground">{user.name}</p>
              <p className="truncate text-caption text-muted-foreground">{ROLE_LABEL[user.role]}</p>
            </div>
          </div>
        </div>

        <nav className="grid gap-0.5 p-1.5" aria-label="Account">
          <Link href="/settings/profile" className={itemClass} onClick={close}>
            <MenuIcon icon={UserRound} />
            Profile
          </Link>
          <Link href="/settings/appearance" className={itemClass} onClick={close}>
            <MenuIcon icon={Settings} />
            Settings
          </Link>
          <Link href="/settings/notifications" className={itemClass} onClick={close}>
            <MenuIcon icon={Bell} />
            Notification settings
          </Link>
          <Link href="/faq" className={itemClass} onClick={close}>
            <MenuIcon icon={HandHelping} />
            Help centre
          </Link>
        </nav>

        <div className="border-t border-border px-3 py-2.5">
          <p className="cw-eyebrow pb-2">Appearance</p>
          <div role="radiogroup" aria-label="Mode" className="grid grid-cols-3 gap-1 rounded-xl bg-muted p-1">
            {MODES.map((mode) => {
              const selected = mounted && theme === mode.value;
              return (
                <button
                  key={mode.value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => {
                    setTheme(mode.value);
                    void api.account
                      .updatePreferences({ themeMode: mode.value })
                      .then(setUser)
                      .catch(() => undefined);
                  }}
                  className={cn(
                    "flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-caption font-medium transition-colors",
                    selected ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon icon={mode.icon} size="xs" lottie={false} />
                  {mode.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="border-t border-border p-1.5">
          <button
            type="button"
            className={cn(itemClass, "text-danger-fg hover:bg-danger-subtle")}
            onClick={async () => {
              close();
              await api.logout();
              setUser(null);
              router.push("/login");
            }}
          >
            <MenuIcon icon={LogOut} danger />
            Log out
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
