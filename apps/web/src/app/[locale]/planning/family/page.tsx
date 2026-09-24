"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Network, UserPlus } from "lucide-react";
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
import { CheckboxField } from "@ceylonweddings/ui/components/checkbox";
import { FormStatus } from "@ceylonweddings/ui/components/form-status";
import { Input } from "@ceylonweddings/ui/components/input";
import { Label } from "@ceylonweddings/ui/components/label";
import { SimpleSelect } from "@ceylonweddings/ui/components/select";
import { FieldBlock, FormGrid, FormPanel } from "@ceylonweddings/ui/domain/creator-form";
import { EmptyState } from "@ceylonweddings/ui/domain/empty-state";
import { PageHeader } from "@ceylonweddings/ui/domain/page-header";
import { SignInPrompt, useWedding } from "../../../../components/use-wedding";

const SIDE_LABELS: Record<GuestSide, string> = {
  BRIDE: "Bride’s side",
  GROOM: "Groom’s side",
  BOTH: "Shared / friends",
};

const RELATIONS = familyRelationSchema.options;

type Tab = "tree" | "access";

export default function FamilyPage() {
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
    api.wedding.family().then(setPeople).catch(() => setPeople([]));
    api.wedding.guests().then(setGuests).catch(() => setGuests([]));
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

  return (
    <div className="cw-stack">
      <PageHeader
        icon={Network}
        kicker={t("hub.kicker")}
        title={t("nav.family")}
        description="Who is who — bride’s house, groom’s house, then who can log in."
      />

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant={tab === "tree" ? "default" : "outline"} onClick={() => setTab("tree")}>
          Family tree
        </Button>
        <Button type="button" variant={tab === "access" ? "default" : "outline"} onClick={() => setTab("access")}>
          Hub access
        </Button>
      </div>

      {tab === "tree" ? (
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="grid gap-6">
            {groups.every((g) => g.people.length === 0) ? (
              <EmptyState
                icon={Network}
                title="Start the tree"
                description="Add Amma, Thaththa, aunties — by side — so the whole family map is clear."
              />
            ) : (
              groups.map((group) =>
                group.people.length === 0 ? null : (
                  <section key={group.side} className="grid gap-3">
                    <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                      {SIDE_LABELS[group.side]}
                    </h2>
                    <ul className="grid gap-2">
                      {group.people.map((person) => (
                        <li
                          key={person.id}
                          className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-border/70 bg-background/40 px-4 py-3"
                        >
                          <div>
                            <p className="font-medium">{person.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {FAMILY_RELATION_LABELS[person.relation]}
                              {person.parentName ? ` · under ${person.parentName}` : ""}
                              {person.householdLabel ? ` · guest: ${person.householdLabel}` : ""}
                              {person.phone ? ` · ${person.phone}` : ""}
                            </p>
                            {person.notes ? <p className="mt-1 text-xs text-muted-foreground">{person.notes}</p> : null}
                          </div>
                          {canEdit ? (
                            <div className="flex gap-1">
                              <Button type="button" size="sm" variant="ghost" onClick={() => startEdit(person)}>
                                Edit
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={async () => {
                                  if (!window.confirm(`Remove ${person.name}?`)) return;
                                  await api.wedding.deleteFamilyPerson(person.id);
                                  await refreshPeople();
                                }}
                              >
                                Remove
                              </Button>
                            </div>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </section>
                ),
              )
            )}
          </div>

          {canEdit ? (
            <form className="grid h-fit gap-3 rounded-3xl border border-border/70 p-4" onSubmit={onSavePerson}>
              <h2 className="font-medium">{editingId ? "Edit person" : "Add to tree"}</h2>
              <div className="grid gap-1">
                <Label>Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="grid gap-1">
                  <Label>Side</Label>
                  <SimpleSelect
                    value={side}
                    onValueChange={(v) => setSide(v as GuestSide)}
                    options={[
                      { value: "BRIDE", label: SIDE_LABELS.BRIDE },
                      { value: "GROOM", label: SIDE_LABELS.GROOM },
                      { value: "BOTH", label: SIDE_LABELS.BOTH },
                    ]}
                  />
                </div>
                <div className="grid gap-1">
                  <Label>Relation</Label>
                  <SimpleSelect
                    value={relation}
                    onValueChange={(v) => setRelation(v as FamilyRelation)}
                    options={RELATIONS.map((item) => ({
                      value: item,
                      label: FAMILY_RELATION_LABELS[item],
                    }))}
                  />
                </div>
              </div>
              <div className="grid gap-1">
                <Label>Under (parent)</Label>
                <SimpleSelect
                  value={parentId}
                  onValueChange={setParentId}
                  options={[
                    { value: "", label: "None" },
                    ...people
                      .filter((p) => p.id !== editingId)
                      .map((p) => ({ value: p.id, label: `${p.name} (${SIDE_LABELS[p.side]})` })),
                  ]}
                />
              </div>
              <div className="grid gap-1">
                <Label>Link guest household</Label>
                <SimpleSelect
                  value={householdId}
                  onValueChange={setHouseholdId}
                  options={[
                    { value: "", label: "None" },
                    ...guests.map((g) => ({ value: g.id, label: `${g.label} · ${g.headName}` })),
                  ]}
                />
              </div>
              <div className="grid gap-1">
                <Label>Phone</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+94…" />
              </div>
              <div className="grid gap-1">
                <Label>Notes</Label>
                <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Lives in Melbourne…" />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="submit">{editingId ? "Save" : "Add person"}</Button>
                {editingId ? (
                  <Button type="button" variant="ghost" onClick={resetForm}>
                    Cancel
                  </Button>
                ) : null}
              </div>
              {status && tab === "tree" ? <p className="text-sm text-muted-foreground">{status}</p> : null}
            </form>
          ) : null}
        </div>
      ) : (
        <div className="grid max-w-2xl gap-8">
          <div className="grid gap-3">
            <h2 className="font-medium">Who can open the hub</h2>
            {members.length === 0 ? (
              <EmptyState icon={UserPlus} title={t("nav.family")} description={t("planning.familyHelp")} />
            ) : (
              members.map((member) => (
                <div
                  key={member.id}
                  className="cw-row-lift grid gap-2 rounded-xl border border-border/70 bg-background/50 p-4 text-sm"
                >
                  <div className="flex justify-between gap-3">
                    <span className="font-medium">
                      {member.name} · {member.email}
                    </span>
                    <span className="text-muted-foreground">{member.role}</span>
                  </div>
                  {member.role === "FAMILY" && isCouple ? (
                    <div className="flex flex-wrap gap-4">
                      <CheckboxField
                        label={t("planning.canEditGuests")}
                        checked={member.canEditGuests}
                        onCheckedChange={(checked) => toggleFlag(member.id, "canEditGuests", checked === true)}
                      />
                      <CheckboxField
                        label={t("planning.canViewBudget")}
                        checked={member.canViewBudget}
                        onCheckedChange={(checked) => toggleFlag(member.id, "canViewBudget", checked === true)}
                      />
                      <CheckboxField
                        label={t("planning.canManageVendors")}
                        checked={member.canManageVendors}
                        onCheckedChange={(checked) =>
                          toggleFlag(member.id, "canManageVendors", checked === true)
                        }
                      />
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      {[
                        member.canEditGuests ? t("planning.canEditGuests") : null,
                        member.canViewBudget ? t("planning.canViewBudget") : null,
                        member.canManageVendors ? t("planning.canManageVendors") : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>

          {isCouple ? (
            <form onSubmit={onInviteAccess}>
              <FormPanel>
                <FormGrid cols={2}>
                  <FieldBlock label={t("auth.name")}>
                    <Input value={accessName} onChange={(e) => setAccessName(e.target.value)} required />
                  </FieldBlock>
                  <FieldBlock label={t("auth.email")}>
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </FieldBlock>
                </FormGrid>
                <div className="flex flex-wrap gap-4 text-sm">
                  <CheckboxField
                    label={t("planning.canEditGuests")}
                    checked={canEditGuests}
                    onCheckedChange={(checked) => setCanEditGuests(checked === true)}
                  />
                  <CheckboxField
                    label={t("planning.canViewBudget")}
                    checked={canViewBudget}
                    onCheckedChange={(checked) => setCanViewBudget(checked === true)}
                  />
                  <CheckboxField
                    label={t("planning.canManageVendors")}
                    checked={canManageVendors}
                    onCheckedChange={(checked) => setCanManageVendors(checked === true)}
                  />
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Button type="submit">{t("planning.invite")}</Button>
                  {status && tab === "access" ? <FormStatus tone="success">{status}</FormStatus> : null}
                </div>
              </FormPanel>
            </form>
          ) : null}
        </div>
      )}
    </div>
  );
}
