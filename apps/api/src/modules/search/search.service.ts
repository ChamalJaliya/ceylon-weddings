import { Injectable } from "@nestjs/common";
import { PrismaService } from "@ceylonweddings/database";
import type { SearchHit, SearchQuery, SearchResponse, User } from "@ceylonweddings/contracts";

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(user: User, query: SearchQuery): Promise<SearchResponse> {
    const q = query.q.trim();
    const limit = query.limit;
    if (q.length < 1) {
      return { q, items: [] };
    }

    const items: SearchHit[] = [];

    if (user.role === "COUPLE" || user.role === "FAMILY") {
      items.push(...(await this.searchCouple(user, q, limit)));
    } else if (user.role === "VENDOR") {
      items.push(...(await this.searchVendor(user, q, limit)));
    } else if (user.role === "ADMIN") {
      items.push(...(await this.searchAdmin(q, limit)));
    }

    return { q, items };
  }

  private async searchCouple(user: User, q: string, limit: number): Promise<SearchHit[]> {
    const membership = await this.prisma.weddingMember.findFirst({
      where: { userId: user.id },
      select: { weddingId: true },
    });

    const [vendors, guests, tasks, articles] = await Promise.all([
      this.searchVendors(q, limit),
      membership ? this.searchGuests(membership.weddingId, q, limit) : Promise.resolve([]),
      membership ? this.searchTasks(membership.weddingId, q, limit) : Promise.resolve([]),
      this.searchArticles(q, limit),
    ]);

    return [...guests, ...tasks, ...vendors, ...articles];
  }

  private async searchVendor(user: User, q: string, limit: number): Promise<SearchHit[]> {
    const [vendors, leads, articles] = await Promise.all([
      this.searchVendors(q, limit),
      this.searchLeads(user, q, limit),
      this.searchArticles(q, limit),
    ]);
    return [...leads, ...vendors, ...articles];
  }

  private async searchAdmin(q: string, limit: number): Promise<SearchHit[]> {
    const [vendors, users, weddings, articles] = await Promise.all([
      this.prisma.vendor.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { city: { contains: q, mode: "insensitive" } },
            { slug: { contains: q, mode: "insensitive" } },
          ],
        },
        orderBy: { name: "asc" },
        take: limit,
        select: {
          id: true,
          name: true,
          city: true,
          moderationStatus: true,
          categoryType: { select: { slug: true } },
        },
      }),
      this.prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
          ],
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        select: { id: true, name: true, email: true, role: true, status: true },
      }),
      this.prisma.wedding.findMany({
        where: {
          OR: [
            { slug: { contains: q, mode: "insensitive" } },
            { partnerOneName: { contains: q, mode: "insensitive" } },
            { partnerTwoName: { contains: q, mode: "insensitive" } },
            { city: { contains: q, mode: "insensitive" } },
          ],
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        select: {
          id: true,
          slug: true,
          partnerOneName: true,
          partnerTwoName: true,
          city: true,
        },
      }),
      this.searchArticles(q, limit),
    ]);

    return [
      ...vendors.map(
        (row): SearchHit => ({
          id: `admin-vendor-${row.id}`,
          kind: "vendor",
          title: row.name,
          subtitle: `${row.categoryType?.slug ?? "UNCATEGORIZED"} · ${row.city}`,
          href: `/admin/vendors/${row.id}`,
          badge: row.moderationStatus,
        }),
      ),
      ...users.map(
        (row): SearchHit => ({
          id: `admin-user-${row.id}`,
          kind: "user",
          title: row.name,
          subtitle: `${row.email} · ${row.role}`,
          href: `/admin/users/${row.id}`,
          badge: row.status,
        }),
      ),
      ...weddings.map(
        (row): SearchHit => ({
          id: `admin-wedding-${row.id}`,
          kind: "wedding",
          title: `${row.partnerOneName} & ${row.partnerTwoName}`,
          subtitle: [row.city, row.slug].filter(Boolean).join(" · ") || row.slug,
          href: `/admin/weddings/${row.id}`,
          badge: "Wedding",
        }),
      ),
      ...articles,
    ];
  }

  private async searchVendors(q: string, limit: number): Promise<SearchHit[]> {
    const rows = await this.prisma.vendor.findMany({
        where: {
        listed: true,
        moderationStatus: { not: "HIDDEN" },
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { city: { contains: q, mode: "insensitive" } },
          { district: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ],
      },
      orderBy: [{ featured: "desc" }, { name: "asc" }],
      take: limit,
      select: {
        id: true,
        name: true,
        slug: true,
        city: true,
        verified: true,
        categoryType: { select: { slug: true } },
      },
    });

    return rows.map((row) => ({
      id: `vendor-${row.id}`,
      kind: "vendor" as const,
      title: row.name,
      subtitle: `${row.categoryType?.slug ?? "UNCATEGORIZED"} · ${row.city}`,
      href: `/vendors/${row.slug}`,
      badge: row.verified ? "Verified" : "Vendor",
    }));
  }

  private async searchGuests(weddingId: string, q: string, limit: number): Promise<SearchHit[]> {
    const rows = await this.prisma.guestHousehold.findMany({
      where: {
        weddingId,
        OR: [
          { label: { contains: q, mode: "insensitive" } },
          { headName: { contains: q, mode: "insensitive" } },
          { phone: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
          { notes: { contains: q, mode: "insensitive" } },
        ],
      },
      orderBy: { label: "asc" },
      take: limit,
      select: { id: true, label: true, headName: true, side: true, status: true },
    });

    return rows.map((row) => ({
      id: `guest-${row.id}`,
      kind: "guest" as const,
      title: row.label,
      subtitle: `${row.headName} · ${row.side} · ${row.status}`,
      href: `/planning/guests?q=${encodeURIComponent(q)}`,
      badge: "Guest",
    }));
  }

  private async searchTasks(weddingId: string, q: string, limit: number): Promise<SearchHit[]> {
    const rows = await this.prisma.task.findMany({
      where: {
        weddingId,
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { category: { contains: q, mode: "insensitive" } },
        ],
      },
      orderBy: { title: "asc" },
      take: limit,
      select: { id: true, title: true, status: true, category: true },
    });

    return rows.map((row) => ({
      id: `task-${row.id}`,
      kind: "task" as const,
      title: row.title,
      subtitle: [row.category, row.status].filter(Boolean).join(" · ") || row.status,
      href: `/planning/checklist`,
      badge: "Task",
    }));
  }

  private async searchLeads(user: User, q: string, limit: number): Promise<SearchHit[]> {
    const vendor = await this.prisma.vendor.findFirst({
      where: { userId: user.id },
      select: { id: true },
    });
    if (!vendor) return [];

    const rows = await this.prisma.inquiry.findMany({
      where: {
        vendorId: vendor.id,
        OR: [
          { message: { contains: q, mode: "insensitive" } },
          { wedding: { partnerOneName: { contains: q, mode: "insensitive" } } },
          { wedding: { partnerTwoName: { contains: q, mode: "insensitive" } } },
          { wedding: { city: { contains: q, mode: "insensitive" } } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        wedding: { select: { partnerOneName: true, partnerTwoName: true, city: true } },
      },
    });

    return rows.map((row) => ({
      id: `lead-${row.id}`,
      kind: "lead" as const,
      title: `${row.wedding.partnerOneName} & ${row.wedding.partnerTwoName}`,
      subtitle: [row.wedding.city, row.message.slice(0, 80)].filter(Boolean).join(" · ") || "Lead",
      href: `/pro/leads`,
      badge: "Lead",
    }));
  }

  private async searchArticles(q: string, limit: number): Promise<SearchHit[]> {
    const rows = await this.prisma.article.findMany({
      where: {
        status: "PUBLISHED",
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { excerpt: { contains: q, mode: "insensitive" } },
        ],
      },
      orderBy: { updatedAt: "desc" },
      take: limit,
      select: { id: true, title: true, slug: true, category: true },
    });

    return rows.map((row) => ({
      id: `article-${row.id}`,
      kind: "article" as const,
      title: row.title,
      subtitle: row.category,
      href: `/ideas/${row.slug}`,
      badge: "Ideas",
    }));
  }
}
