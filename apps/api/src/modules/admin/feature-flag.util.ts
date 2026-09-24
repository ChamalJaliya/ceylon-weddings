import type { PrismaService } from "@ceylonweddings/database";
import { FEATURE_FLAG_CATALOG, type FeatureFlagCatalogKey } from "@ceylonweddings/contracts";

const DEFAULT_BY_KEY = Object.fromEntries(
  FEATURE_FLAG_CATALOG.map((flag) => [flag.key, flag.defaultEnabled]),
) as Record<FeatureFlagCatalogKey, boolean>;

export async function isFeatureEnabled(
  prisma: PrismaService,
  key: FeatureFlagCatalogKey,
): Promise<boolean> {
  const row = await prisma.featureFlag.findUnique({ where: { key } });
  if (!row) return DEFAULT_BY_KEY[key] ?? false;
  return row.enabled;
}
