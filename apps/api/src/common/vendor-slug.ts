import { slugifyVendorName } from "@ceylonweddings/contracts";
import type { PrismaService } from "@ceylonweddings/database";

export async function uniqueVendorSlug(prisma: PrismaService, source: string): Promise<string> {
  const base = slugifyVendorName(source);
  let candidate = base;
  let n = 2;
  while (await prisma.vendor.findUnique({ where: { slug: candidate }, select: { id: true } })) {
    candidate = `${base}-${n}`;
    n += 1;
  }
  return candidate;
}
