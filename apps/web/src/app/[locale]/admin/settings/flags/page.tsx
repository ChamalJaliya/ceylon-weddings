"use client";

import { useCallback, useEffect, useState } from "react";
import { Flag } from "lucide-react";
import { api } from "@ceylonweddings/web";
import { FEATURE_FLAG_CATALOG, type FeatureFlag } from "@ceylonweddings/contracts";
import { Button } from "@ceylonweddings/ui/components/button";
import { FormStatus } from "@ceylonweddings/ui/components/form-status";
import { Input } from "@ceylonweddings/ui/components/input";
import { PageHeader } from "@ceylonweddings/ui/domain/page-header";
import { SectionCard } from "@ceylonweddings/ui/domain/section-card";
import { Link } from "../../../../../i18n/navigation";

export default function AdminFlagsPage() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [customKey, setCustomKey] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setFlags(await api.admin.flags());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (error) {
    return (
      <FormStatus tone="destructive">
        {error}. <Link href="/login">Sign in</Link>
      </FormStatus>
    );
  }

  const byKey = new Map(flags.map((flag) => [flag.key, flag]));
  const catalogKeys = new Set(FEATURE_FLAG_CATALOG.map((f) => f.key));
  const customFlags = flags.filter((flag) => !catalogKeys.has(flag.key as (typeof FEATURE_FLAG_CATALOG)[number]["key"]));

  return (
    <div className="grid gap-8">
      <PageHeader
        icon={Flag}
        kicker="Settings"
        title="Feature flags"
        description="Curated product toggles that gate public surfaces. Custom keys remain available for ops experiments."
      />

      <SectionCard title="Catalog" icon={Flag}>
        <ul className="grid gap-2 text-sm">
          {FEATURE_FLAG_CATALOG.map((item) => {
            const flag = byKey.get(item.key);
            const enabled = flag?.enabled ?? item.defaultEnabled;
            return (
              <li
                key={item.key}
                className="flex items-center justify-between gap-3 rounded-lg border border-border/60 px-3 py-2"
              >
                <div>
                  <p className="font-medium">{item.key}</p>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    await api.admin.upsertFlag({
                      key: item.key,
                      enabled: !enabled,
                      description: item.description,
                    });
                    await load();
                  }}
                >
                  {enabled ? "Disable" : "Enable"}
                </Button>
              </li>
            );
          })}
        </ul>
      </SectionCard>

      <SectionCard title="Custom flags" icon={Flag}>
        <div className="mb-3 flex flex-wrap gap-2">
          <Input
            value={customKey}
            onChange={(e) => setCustomKey(e.target.value)}
            className="max-w-xs"
            placeholder="custom.flag.key"
          />
          <Button
            size="sm"
            onClick={async () => {
              if (!customKey.trim()) return;
              await api.admin.upsertFlag({
                key: customKey.trim(),
                enabled: true,
                description: "Admin custom flag",
              });
              setCustomKey("");
              await load();
            }}
          >
            Enable custom flag
          </Button>
        </div>
        <ul className="grid gap-2 text-sm">
          {customFlags.map((flag) => (
            <li
              key={flag.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border/60 px-3 py-2"
            >
              <div>
                <p className="font-medium">{flag.key}</p>
                <p className="text-xs text-muted-foreground">{flag.description}</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  await api.admin.upsertFlag({
                    key: flag.key,
                    enabled: !flag.enabled,
                    description: flag.description,
                  });
                  await load();
                }}
              >
                {flag.enabled ? "Disable" : "Enable"}
              </Button>
            </li>
          ))}
          {customFlags.length === 0 ? (
            <li className="text-xs text-muted-foreground">No custom flags yet.</li>
          ) : null}
        </ul>
      </SectionCard>
    </div>
  );
}
