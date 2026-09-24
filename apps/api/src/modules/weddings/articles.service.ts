import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@ceylonweddings/database";

@Injectable()
export class ArticlesService {
  constructor(private readonly prisma: PrismaService) {}

  list(category?: string, q?: string, vendorSlug?: string) {
    return this.prisma.article
      .findMany({
        where: {
          status: "PUBLISHED",
          ...(category ? { category: category as never } : {}),
          ...(vendorSlug ? { vendorSlugs: { has: vendorSlug } } : {}),
          ...(q
            ? {
                OR: [
                  { title: { contains: q, mode: "insensitive" } },
                  { excerpt: { contains: q, mode: "insensitive" } },
                ],
              }
            : {}),
        },
        orderBy: [{ featured: "desc" }, { publishedAt: "desc" }],
      })
      .then((rows) => rows.map((row) => this.serialize(row)));
  }

  async bySlug(slug: string) {
    const article = await this.prisma.article.findFirst({
      where: { slug, status: "PUBLISHED" },
    });
    if (!article) {
      throw new NotFoundException("Article not found");
    }
    return this.serialize(article);
  }

  private serialize(article: {
    id: string;
    slug: string;
    title: string;
    excerpt: string;
    body: string;
    category: string;
    coverUrl: string;
    locale: string;
    featured: boolean;
    status: string;
    vendorSlugs: string[];
    publishedAt: Date | null;
  }) {
    return {
      ...article,
      vendorSlugs: article.vendorSlugs ?? [],
      publishedAt: article.publishedAt?.toISOString() ?? null,
    };
  }
}
