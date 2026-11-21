"use client";

import { useCallback, useEffect, useState } from "react";
import { Flag } from "lucide-react";
import { api } from "@ceylonweddings/web";
import { FEATURE_FLAG_CATALOG, type FeatureFlag } from "@ceylonweddings/contracts";
import { Button } from "@ceylonweddings/ui/components/button";
import { FormStatus } from "@ceylonweddings/ui/components/form-status";
import { Input } from "@ceylonweddings/ui/components/input";
import { CenteredLoader } from "@ceylonweddings/ui/components/spinner";
import { EmptyState } from "@ceylonweddings/ui/domain/empty-state";
import { PageHeader } from "@ceylonweddings/ui/domain/page-header";
import { SectionCard } from "@ceylonweddings/ui/domain/section-card";
import { SettingsList, SettingsListRow } from "@ceylonweddings/ui/domain/settings-list-row";
import { Link } from "@/i18n/navigation";

export default function AdminFlagsPage() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [customKey, setCustomKey] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setFlags(await api.admin.flags());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
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
  const customFlags = flags.filter(
    (flag) => !catalogKeys.has(flag.key as (typeof FEATURE_FLAG_CATALOG)[number]["key"]),
  );

  return (
    <div className="grid gap-8">
      <PageHeader
        icon={Flag}
        kicker="Settings"
        title="Feature flags"
        description="Curated product toggles that gate public surfaces. Custom keys remain available for ops experiments."
      />

      <SectionCard title="Catalog" icon={Flag}>
        {loading ? (
          <CenteredLoader label="Loading flags" />
        ) : (
          <SettingsList>
            {FEATURE_FLAG_CATALOG.map((item) => {
              const flag = byKey.get(item.key);
              const enabled = flag?.enabled ?? item.defaultEnabled;
              return (
                <SettingsListRow
                  key={item.key}
                  title={item.key}
                  description={item.description}
                  actions={
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
                  }
                />
              );
            })}
          </SettingsList>
        )}
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
        {!loading && customFlags.length === 0 ? (
          <EmptyState icon={Flag} title="No custom flags yet" description="Add an ops experiment key above." />
        ) : (
          <SettingsList>
            {customFlags.map((flag) => (
              <SettingsListRow
                key={flag.id}
                title={flag.key}
                description={flag.description}
                actions={
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
                }
              />
            ))}
          </SettingsList>
        )}
      </SectionCard>
    </div>
  );
}
