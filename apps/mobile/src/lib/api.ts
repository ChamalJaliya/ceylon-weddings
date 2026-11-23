/**
 * Native API client. The Nest API authenticates with httpOnly cookies (cw_access / cw_refresh);
 * React Native's fetch keeps them in the OS cookie store when credentials: "include" is set,
 * so the same endpoints the web app uses work unchanged.
 */
import type {
  BudgetLine,
  GuestHousehold,
  Appointment,
  Meal,
  MineWedding,
  PublicRsvpBody,
  PublicWebsite,
  Task,
  TaskStatus,
  UpdatePreferencesBody,
  User,
  Vendor,
} from "@ceylonweddings/contracts";

export const WEB_URL = (process.env.EXPO_PUBLIC_WEB_URL ?? "https://ceylonweddings.com").replace(/\/$/, "");
export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:4000").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

let refreshing: Promise<boolean> | null = null;

async function refresh(): Promise<boolean> {
  refreshing ??= fetch(`${API_URL}/auth/refresh`, { method: "POST", credentials: "include" })
    .then((r) => r.ok)
    .catch(() => false)
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

export async function request<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json", Accept: "application/json", ...init.headers },
  });
  if (res.status === 401 && retry && !path.startsWith("/auth/")) {
    if (await refresh()) return request<T>(path, init, false);
  }
  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      message = Array.isArray(body.message) ? body.message.join(", ") : (body.message ?? message);
    } catch {}
    throw new ApiError(res.status, message);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

const json = (body: unknown) => JSON.stringify(body);

export type VendorSort = "featured" | "rating" | "price_asc" | "price_desc" | "name";
export type VendorFilters = {
  q?: string;
  category?: string;
  district?: string;
  city?: string;
  sort?: VendorSort;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  verified?: boolean;
  featured?: boolean;
  destination?: boolean;
  pageSize?: number;
};
export type Facet = { value: string; count: number };

type Page<T> = { items: T[]; total: number; page: number; pageCount: number };
const itemsOf = <T>(r: T[] | Page<T>): T[] => (Array.isArray(r) ? r : (r.items ?? []));

export const api = {
  login: (email: string, password: string) =>
    request<User>("/auth/login", { method: "POST", body: json({ email, password }) }),
  me: () => request<User>("/auth/me"),
  updateMe: (
    body: Partial<{
      name: string;
      phone: string | null;
      locale: "en" | "si" | "ta";
      currency: "LKR" | "USD" | "AUD" | "GBP" | "EUR";
    }>,
  ) => request<User>("/auth/me", { method: "PATCH", body: json(body) }),
  changePassword: (currentPassword: string, newPassword: string) =>
    request<unknown>("/auth/password", { method: "POST", body: json({ currentPassword, newPassword }) }),
  updatePreferences: (body: UpdatePreferencesBody) =>
    request<User>("/auth/preferences", { method: "PATCH", body: json(body) }),
  security: () =>
    request<{
      twoFactorEnabled: boolean;
      hasPassword: boolean;
      sessions: { id: string; current?: boolean; userAgent?: string | null; createdAt?: string; lastUsedAt?: string }[];
    }>("/auth/security"),
  revokeOtherSessions: () => request<unknown>("/auth/sessions/revoke-others", { method: "POST" }),

  appointments: () =>
    request<Appointment[] | { items: Appointment[] }>("/weddings/mine/appointments").then((r) =>
      Array.isArray(r) ? r : (r.items ?? []),
    ),
  createAppointment: (body: {
    title: string;
    kind: Appointment["kind"];
    startsAt: string;
    endsAt: string;
    venueName?: string | null;
    notes?: string | null;
    eventId?: string | null;
  }) => request<Appointment>("/weddings/mine/appointments", { method: "POST", body: json(body) }),
  deleteAppointment: (id: string) => request<unknown>(`/weddings/mine/appointments/${id}`, { method: "DELETE" }),
  logout: () => request<void>("/auth/logout", { method: "POST" }),

  wedding: () => request<MineWedding>("/weddings/mine"),

  createTask: (body: { title: string; category?: string; dueAt?: string | null }) =>
    request<Task>("/weddings/mine/tasks", { method: "POST", body: json(body) }),
  deleteTask: (id: string) => request<unknown>(`/weddings/mine/tasks/${id}`, { method: "DELETE" }),
  setTaskStatus: (id: string, status: TaskStatus) =>
    request<Task>(`/weddings/mine/tasks/${id}`, { method: "PATCH", body: json({ status }) }),

  budget: () =>
    request<BudgetLine[] | { lines: BudgetLine[] }>("/weddings/mine/budget").then((r) =>
      Array.isArray(r) ? r : (r.lines ?? []),
    ),

  guests: (q?: string) =>
    request<GuestHousehold[] | Page<GuestHousehold>>(
      `/weddings/mine/guests?pageSize=100${q ? `&q=${encodeURIComponent(q)}` : ""}`,
    ).then(itemsOf),

  updateGuest: (id: string, body: Partial<Pick<GuestHousehold, "status" | "plusCount" | "notes">>) =>
    request<GuestHousehold>(`/weddings/mine/guests/${id}`, { method: "PATCH", body: json(body) }),

  vendors: (f: VendorFilters = {}) => {
    const qs = new URLSearchParams({ pageSize: String(f.pageSize ?? 24) });
    for (const [k, v] of Object.entries(f)) {
      if (k === "pageSize" || v === undefined || v === null || v === "" || v === false) continue;
      qs.set(k, String(v));
    }
    return request<Page<Vendor> & { facets?: { cities?: Facet[]; districts?: Facet[] } }>(`/vendors?${qs}`).then(
      (r) => ({
        items: r.items ?? [],
        total: r.total ?? r.items?.length ?? 0,
        districts: r.facets?.districts ?? [],
        cities: r.facets?.cities ?? [],
      }),
    );
  },
  vendor: (slug: string) => request<Vendor>(`/vendors/${slug}`),
  shortlist: (vendorId: string) =>
    request<unknown>("/weddings/mine/team", { method: "POST", body: json({ vendorId }) }),
  inquire: (vendorId: string, message: string) =>
    request<{ whatsappUrl: string | null }>("/weddings/mine/inquiries", {
      method: "POST",
      body: json({ vendorId, message }),
    }),

  // Guest side — public, no login
  publicWedding: (slug: string) => request<PublicWebsite>(`/public/weddings/${encodeURIComponent(slug)}`),
  rsvp: (slug: string, body: PublicRsvpBody) =>
    request<unknown>(`/public/weddings/${encodeURIComponent(slug)}/rsvp`, { method: "POST", body: json(body) }),
};

export type { Meal };
