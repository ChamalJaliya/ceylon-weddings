"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, KeyRound, Mail, Network, Pencil, Phone, Plus, Trash2, UserPlus, Users, X } from "lucide-react";
import { api } from "@ceylonweddings/web";
import {
  FAMILY_RELATION_LABELS,
  familyBySide,
  familyRelationSchema,
  type FamilyPerson,
  type FamilyRelation,
  type GuestHousehold,
  type GuestSide,
} from "@ceylonweddings/contracts";
import { Button } from "@ceylonweddings/ui/components/button";
import { FormStatus } from "@ceylonweddings/ui/components/form-status";
import { Input } from "@ceylonweddings/ui/components/input";
import { Combobox } from "@ceylonweddings/ui/components/combobox";
import { cn } from "@ceylonweddings/ui/utils";
import { SignInPrompt, useWedding } from "@/components/use-wedding";
import { initials } from "@/lib/labels";
import { PlanningHero } from "@/features/planning/components/planning-hero";
import { useConfirm } from "@ceylonweddings/ui/components/confirm-dialog";

const SIDE_LABELS: Record<GuestSide, string> = {
  BRIDE: "Bride’s side",
  GROOM: "Groom’s side",
  BOTH: "Shared / friends",
};

const RELATIONS = familyRelationSchema.options;

type Tab = "tree" | "access";

export default function FamilyPage() {
  const confirm = useConfirm();
  const t = useTranslations();
  const { data, error, reload } = useWedding();
  const [tab, setTab] = useState<Tab>("tree");
  const [people, setPeople] = useState<FamilyPerson[]>([]);
  const [guests, setGuests] = useState<GuestHousehold[]>([]);
  const [name, setName] = useState("");
  const [side, setSide] = useState<GuestSide>("BRIDE");
  const [relation, setRelation] = useState<FamilyRelation>("MOTHER");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [parentId, setParentId] = useState("");
  const [householdId, setHouseholdId] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [accessName, setAccessName] = useState("");
  const [canEditGuests, setCanEditGuests] = useState(true);
  const [canViewBudget, setCanViewBudget] = useState(true);
  const [canManageVendors, setCanManageVendors] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    api.wedding
      .family()
      .then(setPeople)
      .catch(() => setPeople([]));
    api.wedding
      .guests()
      .then(setGuests)
      .catch(() => setGuests([]));
  }, []);

  const groups = useMemo(() => familyBySide(people), [people]);

  if (!data) return <SignInPrompt error={error} />;

  const isCouple = data.myAccess.role === "COUPLE";
  const canEdit = data.myAccess.canEditGuests;
  const members = data.members ?? [];

  function resetForm() {
    setEditingId(null);
    setName("");
    setSide("BRIDE");
    setRelation("MOTHER");
    setPhone("");
    setNotes("");
    setParentId("");
    setHouseholdId("");
  }

  function startEdit(person: FamilyPerson) {
    setEditingId(person.id);
    setName(person.name);
    setSide(person.side);
    setRelation(person.relation);
    setPhone(person.phone ?? "");
    setNotes(person.notes ?? "");
    setParentId(person.parentId ?? "");
    setHouseholdId(person.householdId ?? "");
    setTab("tree");
  }

  async function refreshPeople() {
    setPeople(await api.wedding.family());
  }

  async function onSavePerson(event: FormEvent) {
    event.preventDefault();
    setStatus(null);
    const body = {
      name,
      side,
      relation,
      phone: phone || null,
      notes: notes || null,
      parentId: parentId || null,
      householdId: householdId || null,
    };
    try {
      if (editingId) await api.wedding.updateFamilyPerson(editingId, body);
      else await api.wedding.createFamilyPerson(body);
      resetForm();
      await refreshPeople();
      setStatus(editingId ? "Updated" : "Added to tree");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Could not save");
    }
  }

  async function onInviteAccess(event: FormEvent) {
    event.preventDefault();
    await api.wedding.inviteMember({
      email,
      name: accessName,
      canEditGuests,
      canViewBudget,
      canManageVendors,
    });
    setStatus(t("planning.invitedTempPassword"));
    setEmail("");
    setAccessName("");
    await reload();
  }

  async function toggleFlag(
    memberId: string,
    flag: "canEditGuests" | "canViewBudget" | "canManageVendors",
    value: boolean,
  ) {
    await api.wedding.updateMember(memberId, { [flag]: value });
    await reload();
  }

  const countSide = (s: GuestSide) => people.filter((p) => p.side === s).length;
  const iconBtn =
    "grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground transition hover:bg-secondary hover:text-foreground";
  const SIDE_STYLE: Record<GuestSide, string> = {
    BRIDE: "bg-love/15 text-love-fg",
    GROOM: "bg-info/15 text-info",
    BOTH: "bg-secondary text-foreground",
  };

  async function removePerson(person: FamilyPerson) {
    if (!(await confirm({ title: `Remove ${person.name}?`, destructive: true, confirmLabel: "Remove" }))) return;
    await api.wedding.deleteFamilyPerson(person.id);
    await refreshPeople();
  }

  function renderBranch(list: FamilyPerson[], parent: string | null, depth: number): React.ReactNode {
    const ids = new Set(list.map((p) => p.id));
    const level = list.filter((p) => (parent === null ? !p.parentId || !ids.has(p.parentId) : p.parentId === parent));
    if (!level.length) return null;
    return (
      <ul className={cn("grid gap-1.5", depth > 0 && "mt-1.5 ml-5 border-l border-border pl-4")}>
        {level.map((person) => (
          <li key={person.id}>
            <div
              className={cn(
                "group flex items-center gap-3 rounded-2xl border bg-background p-3 transition",
                editingId === person.id
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-border hover:border-primary/30",
              )}
            >
              <span
                className={cn(
                  "grid size-9 shrink-0 place-items-center rounded-full text-sm font-medium",
                  SIDE_STYLE[person.side],
                )}
              >
                {initials(person.name)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-x-2 text-sm font-medium">
                  {person.name}
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-normal text-muted-foreground">
                    {FAMILY_RELATION_LABELS[person.relation]}
                  </span>
                </p>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
                  {person.householdLabel ? (
                    <span className="inline-flex items-center gap-1">
                      <Users className="size-3" /> {person.householdLabel}
                    </span>
                  ) : null}
                  {person.phone ? (
                    <a href={`tel:${person.phone}`} className="inline-flex items-center gap-1 hover:text-foreground">
                      <Phone className="size-3" /> {person.phone}
                    </a>
                  ) : null}
                  {person.notes ? <span className="truncate">{person.notes}</span> : null}
                </p>
              </div>
              {canEdit ? (
                <div className="flex opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
                  <button
                    type="button"
                    className={iconBtn}
                    aria-label={`Edit ${person.name}`}
                    onClick={() => startEdit(person)}
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button
                    type="button"
                    className={cn(iconBtn, "hover:bg-destructive/10 hover:text-destructive")}
                    aria-label={`Remove ${person.name}`}
                    onClick={() => void removePerson(person)}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ) : null}
            </div>
            {renderBranch(list, person.id, depth + 1)}
          </li>
        ))}
      </ul>
    );
  }

  const PermToggle = ({
    on,
    label,
    onChange,
    disabled,
  }: {
    on: boolean;
    label: string;
    onChange?: (v: boolean) => void;
    disabled?: boolean;
  }) => (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={disabled}
      onClick={() => onChange?.(!on)}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition",
        on ? "border-primary/30 bg-primary/10 text-primary" : "border-border text-muted-foreground",
        !disabled && "hover:border-primary/50",
        disabled && "cursor-default",
      )}
    >
      {on ? (
        <Check className="size-3.5" />
      ) : (
        <span className="size-3.5 rounded-full border border-current opacity-50" />
      )}
      {label}
    </button>
  );

  return (
    <div className="cw-stack">
      <PlanningHero
        icon={Network}
        kicker={t("hub.kicker")}
        title={t("nav.family")}
        description="Who is who — bride’s house, groom’s house, then who can log in."
      >
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
          <div className="flex flex-wrap gap-x-8 gap-y-3">
            <div>
              <p className="text-xs text-paper/60">Bride’s side</p>
              <p className="font-serif text-2xl">{countSide("BRIDE")}</p>
            </div>
            <div>
              <p className="text-xs text-paper/60">Groom’s side</p>
              <p className="font-serif text-2xl">{countSide("GROOM")}</p>
            </div>
            <div>
              <p className="text-xs text-paper/60">Shared</p>
              <p className="font-serif text-2xl">{countSide("BOTH")}</p>
            </div>
            <div>
              <p className="text-xs text-paper/60">Hub access</p>
              <p className="font-serif text-2xl">{members.length}</p>
            </div>
          </div>
          <div className="inline-flex rounded-full bg-paper/10 p-1">
            {(
              [
                { id: "tree", label: "Family tree", icon: Network },
                { id: "access", label: "Hub access", icon: KeyRound },
              ] as const
            ).map((x) => (
              <button
                key={x.id}
                type="button"
                onClick={() => setTab(x.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm transition",
                  tab === x.id ? "bg-paper text-ink" : "text-paper/70 hover:text-paper",
                )}
              >
                <x.icon className="size-4" /> {x.label}
              </button>
            ))}
          </div>
        </div>
      </PlanningHero>

      {tab === "tree" ? (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
          <div className="grid gap-4">
            {groups.every((g) => g.people.length === 0) ? (
              <div className="grid place-items-center gap-3 rounded-3xl border border-dashed border-border p-12 text-center">
                <span className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <Network className="size-6" />
                </span>
                <p className="font-serif text-2xl">Start the tree</p>
                <p className="max-w-sm text-sm text-muted-foreground">
                  Add Amma, Thaththa, aunties — by side — so the whole family map is clear.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 xl:grid-cols-2">
                {groups.map((group) =>
                  group.people.length === 0 ? null : (
                    <section
                      key={group.side}
                      className={cn(
                        "min-w-0 rounded-3xl border border-border bg-card p-4 shadow-card",
                        group.side === "BOTH" && "xl:col-span-2",
                      )}
                    >
                      <header className="mb-3 flex items-center gap-2 px-1">
                        <span
                          className={cn(
                            "size-2.5 rounded-full",
                            group.side === "BRIDE"
                              ? "bg-love"
                              : group.side === "GROOM"
                                ? "bg-info"
                                : "bg-muted-foreground",
                          )}
                        />
                        <p className="flex-1 font-serif text-xl">{SIDE_LABELS[group.side]}</p>
                        <span className="text-sm text-muted-foreground tabular-nums">{group.people.length}</span>
                      </header>
                      {renderBranch(group.people, null, 0)}
                    </section>
                  ),
                )}
              </div>
            )}
          </div>

          {canEdit ? (
            <form
              onSubmit={onSavePerson}
              className="grid gap-3 rounded-3xl border border-border bg-card p-5 shadow-card lg:sticky lg:top-24"
            >
              <div className="flex items-center justify-between">
                <p className="font-serif text-xl">{editingId ? "Edit person" : "Add to tree"}</p>
                {editingId ? (
                  <button type="button" className={iconBtn} aria-label="Cancel editing" onClick={resetForm}>
                    <X className="size-4" />
                  </button>
                ) : null}
              </div>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" required />
              <div className="grid grid-cols-3 rounded-full bg-secondary p-1">
                {(["BRIDE", "GROOM", "BOTH"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSide(s)}
                    className={cn(
                      "rounded-full px-2 py-1.5 text-xs transition",
                      side === s ? "bg-background shadow-sm" : "text-muted-foreground",
                    )}
                  >
                    {s === "BRIDE" ? "Bride’s" : s === "GROOM" ? "Groom’s" : "Shared"}
                  </button>
                ))}
              </div>
              <label className="grid gap-1 text-xs text-muted-foreground">
                Relation
                <Combobox
                  value={relation}
                  onValueChange={(v) => setRelation(v as FamilyRelation)}
                  searchPlaceholder="Search relations…"
                  options={RELATIONS.map((item) => ({ value: item, label: FAMILY_RELATION_LABELS[item] }))}
                />
              </label>
              <label className="grid gap-1 text-xs text-muted-foreground">
                Under (parent)
                <Combobox
                  value={parentId || "__none__"}
                  onValueChange={(v) => setParentId(v === "__none__" ? "" : v)}
                  searchPlaceholder="Search people…"
                  options={[
                    { value: "__none__", label: "None" },
                    ...people
                      .filter((p) => p.id !== editingId)
                      .map((p) => ({ value: p.id, label: `${p.name} · ${SIDE_LABELS[p.side]}` })),
                  ]}
                />
              </label>
              <label className="grid gap-1 text-xs text-muted-foreground">
                Linked guest household
                <Combobox
                  value={householdId || "__none__"}
                  onValueChange={(v) => setHouseholdId(v === "__none__" ? "" : v)}
                  searchPlaceholder="Search households…"
                  options={[
                    { value: "__none__", label: "None" },
                    ...guests.map((g) => ({ value: g.id, label: `${g.label} · ${g.headName}` })),
                  ]}
                />
              </label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone, +94…" />
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notes, e.g. lives in Melbourne"
              />
              <Button type="submit" shape="pill" className="gap-1.5">
                {editingId ? (
                  "Save changes"
                ) : (
                  <>
                    <Plus className="size-4" /> Add person
                  </>
                )}
              </Button>
              {status && tab === "tree" ? <FormStatus>{status}</FormStatus> : null}
            </form>
          ) : null}
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
          <section className="grid gap-2">
            {members.length === 0 ? (
              <div className="grid place-items-center gap-3 rounded-3xl border border-dashed border-border p-12 text-center">
                <UserPlus className="size-6 text-primary" />
                <p className="text-sm text-muted-foreground">{t("planning.familyHelp")}</p>
              </div>
            ) : (
              members.map((member) => {
                const editable = member.role === "FAMILY" && isCouple;
                return (
                  <div key={member.id} className="grid gap-3 rounded-3xl border border-border bg-card p-4 shadow-card">
                    <div className="flex items-center gap-3">
                      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                        {initials(member.name)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{member.name}</p>
                        <p className="truncate text-sm text-muted-foreground">{member.email}</p>
                      </div>
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-1 text-xs",
                          member.role === "COUPLE"
                            ? "bg-[color:var(--cw-gold-300)]/25 text-foreground"
                            : "bg-secondary text-muted-foreground",
                        )}
                      >
                        {member.role === "COUPLE" ? "Couple" : member.role === "FAMILY" ? "Family" : member.role}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pl-13">
                      <PermToggle
                        on={member.canEditGuests}
                        label={t("planning.canEditGuests")}
                        disabled={!editable}
                        onChange={(v) => void toggleFlag(member.id, "canEditGuests", v)}
                      />
                      <PermToggle
                        on={member.canViewBudget}
                        label={t("planning.canViewBudget")}
                        disabled={!editable}
                        onChange={(v) => void toggleFlag(member.id, "canViewBudget", v)}
                      />
                      <PermToggle
                        on={member.canManageVendors}
                        label={t("planning.canManageVendors")}
                        disabled={!editable}
                        onChange={(v) => void toggleFlag(member.id, "canManageVendors", v)}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </section>

          {isCouple ? (
            <form
              onSubmit={onInviteAccess}
              className="grid gap-3 rounded-3xl border border-border bg-card p-5 shadow-card lg:sticky lg:top-24"
            >
              <p className="flex items-center gap-2 font-serif text-xl">
                <Mail className="size-4 text-primary" /> Invite to the hub
              </p>
              <Input
                value={accessName}
                onChange={(e) => setAccessName(e.target.value)}
                placeholder={t("auth.name")}
                required
              />
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("auth.email")}
                required
              />
              <div className="flex flex-wrap gap-1.5">
                <PermToggle on={canEditGuests} label={t("planning.canEditGuests")} onChange={setCanEditGuests} />
                <PermToggle on={canViewBudget} label={t("planning.canViewBudget")} onChange={setCanViewBudget} />
                <PermToggle
                  on={canManageVendors}
                  label={t("planning.canManageVendors")}
                  onChange={setCanManageVendors}
                />
              </div>
              <Button type="submit" shape="pill">
                {t("planning.invite")}
              </Button>
              {status && tab === "access" ? <FormStatus tone="success">{status}</FormStatus> : null}
            </form>
          ) : null}
        </div>
      )}
    </div>
  );
}
