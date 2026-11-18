import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { isPlatformAdminRole } from '../../../core/auth/utils/role-access';
import {
  ACTIVITIES_LISTING_COVER_KEY,
  DEFAULT_PAGE,
  DEFAULT_PAGE_LIMIT,
} from '@turta/shared-constants';
import type {
  Category as SharedCategory,
  Post as SharedPost,
  RoutePageOverlay as SharedRoutePageOverlay,
  SitePageCover as SharedSitePageCover,
} from '@turta/shared-types';
import { Prisma } from '../../../generated/prisma';

import { CacheService } from '../../../core/cache/cache.service';
import { PrismaService } from '../../../core/database/prisma.service';
import { BusinessException } from '../../../shared/exceptions/business.exception';
import {
  CreateCategoryDto,
  CreateCommentDto,
  CreatePostDto,
  SearchPostsDto,
  UpdateCategoryDto,
  UpdateCommentDto,
  UpdatePageCoverDto,
  UpdatePostDto,
  UpdateRoutePageDto,
} from '../dto/content.dto';
import { slugify } from '../utils/slugify';
import { ROUTE_DEFINITIONS } from '../../catalog/data/route-definitions';

const PAGE_COVER_CACHE_TTL_SECONDS = 60;
const ROUTE_PAGE_CACHE_TTL_SECONDS = 60;
const ALLOWED_PAGE_COVER_KEYS = new Set([ACTIVITIES_LISTING_COVER_KEY]);
const ALLOWED_ROUTE_KEYS = new Set(ROUTE_DEFINITIONS.map((route) => route.id));

@Injectable()
export class ContentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  // ─── Posts ────────────────────────────────────────────

  async searchPosts(dto: SearchPostsDto, isAdmin = false) {
    const page = dto.page ?? DEFAULT_PAGE;
    const limit = dto.limit ?? DEFAULT_PAGE_LIMIT;
    const includeDrafts = Boolean(dto.includeDrafts && isAdmin);

    const where: Prisma.PostWhereInput = {
      deletedAt: null,
      ...(includeDrafts ? {} : { published: true }),
      ...(dto.q
        ? {
            OR: [
              { title: { contains: dto.q, mode: 'insensitive' } },
              { excerpt: { contains: dto.q, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(dto.categorySlug
        ? {
            categories: {
              some: { slug: dto.categorySlug, deletedAt: null },
            },
          }
        : {}),
    };

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.post.count({ where }),
      this.prisma.post.findMany({
        where,
        orderBy: { publishedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { categories: { where: { deletedAt: null } } },
      }),
    ]);

    return {
      success: true,
      data: rows.map((r) => this.toPost(r)),
      error: null,
      meta: { page, limit, total },
    };
  }

  async getPostBySlugOrId(slugOrId: string, isAdmin = false) {
    const post = await this.prisma.post.findFirst({
      where: {
        deletedAt: null,
        OR: [{ id: slugOrId }, { slug: slugOrId }],
        ...(isAdmin ? {} : { published: true }),
      },
      include: { categories: { where: { deletedAt: null } } },
    });
    if (!post) {
      throw new NotFoundException({
        code: 'POST_NOT_FOUND',
        message: 'Yazı bulunamadı',
      });
    }
    return { success: true, data: this.toPost(post), error: null };
  }

  async createPost(dto: CreatePostDto, authorId: string) {
    const slug = await this.uniquePostSlug(slugify(dto.title));
    const published = dto.published ?? false;

    const post = await this.prisma.post.create({
      data: {
        title: dto.title.trim(),
        slug,
        content: dto.content,
        excerpt: dto.excerpt?.trim(),
        coverImage: dto.coverImage,
        seoTitle: dto.seoTitle?.trim() || null,
        seoDescription: dto.seoDescription?.trim() || null,
        published,
        publishedAt: published ? new Date() : null,
        authorId,
        ...(dto.categoryIds?.length
          ? {
              categories: {
                connect: dto.categoryIds.map((id) => ({ id })),
              },
            }
          : {}),
      },
      include: { categories: true },
    });

    return { success: true, data: this.toPost(post), error: null };
  }

  async updatePost(
    postId: string,
    dto: UpdatePostDto,
    actor: { userId: string; role: string },
  ) {
    const post = await this.requirePost(postId);
    this.assertPostAccess(post.authorId, actor);

    const data: Prisma.PostUpdateInput = {};
    if (dto.title !== undefined) {
      data.title = dto.title.trim();
      data.slug = await this.uniquePostSlug(slugify(dto.title), postId);
    }
    if (dto.content !== undefined) data.content = dto.content;
    if (dto.excerpt !== undefined) data.excerpt = dto.excerpt.trim();
    if (dto.coverImage !== undefined) data.coverImage = dto.coverImage;
    if (dto.seoTitle !== undefined) {
      data.seoTitle = dto.seoTitle?.trim() || null;
    }
    if (dto.seoDescription !== undefined) {
      data.seoDescription = dto.seoDescription?.trim() || null;
    }
    if (dto.published !== undefined) {
      data.published = dto.published;
      if (dto.published && !post.publishedAt) {
        data.publishedAt = new Date();
      }
    }
    if (dto.categoryIds !== undefined) {
      data.categories = {
        set: dto.categoryIds.map((id) => ({ id })),
      };
    }

    const updated = await this.prisma.post.update({
      where: { id: post.id },
      data,
      include: { categories: { where: { deletedAt: null } } },
    });

    return { success: true, data: this.toPost(updated), error: null };
  }

  async softDeletePost(
    postId: string,
    actor: { userId: string; role: string },
  ) {
    const post = await this.requirePost(postId);
    this.assertPostAccess(post.authorId, actor);
    await this.prisma.post.update({
      where: { id: post.id },
      data: {
        deletedAt: new Date(),
        published: false,
        deletedBy: actor.userId,
      },
    });
    return {
      success: true,
      data: { id: postId, deleted: true },
      error: null,
    };
  }

  // ─── Categories ───────────────────────────────────────

  async listCategories() {
    const rows = await this.prisma.category.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
    });
    return {
      success: true,
      data: rows.map((r) => this.toCategory(r)),
      error: null,
    };
  }

  async createCategory(dto: CreateCategoryDto) {
    const slug = await this.uniqueCategorySlug(slugify(dto.name));
    const row = await this.prisma.category.create({
      data: {
        name: dto.name.trim(),
        slug,
        description: dto.description?.trim(),
      },
    });
    return { success: true, data: this.toCategory(row), error: null };
  }

  async updateCategory(categoryId: string, dto: UpdateCategoryDto) {
    const existing = await this.prisma.category.findFirst({
      where: { id: categoryId, deletedAt: null },
    });
    if (!existing) {
      throw new NotFoundException({
        code: 'CATEGORY_NOT_FOUND',
        message: 'Kategori bulunamadı',
      });
    }

    const data: Prisma.CategoryUpdateInput = {};
    if (dto.name !== undefined) {
      data.name = dto.name.trim();
      data.slug = await this.uniqueCategorySlug(slugify(dto.name), categoryId);
    }
    if (dto.description !== undefined) {
      data.description = dto.description.trim();
    }

    const updated = await this.prisma.category.update({
      where: { id: existing.id },
      data,
    });
    return { success: true, data: this.toCategory(updated), error: null };
  }

  async softDeleteCategory(categoryId: string, deletedBy?: string) {
    const existing = await this.prisma.category.findFirst({
      where: { id: categoryId, deletedAt: null },
    });
    if (!existing) {
      throw new NotFoundException({
        code: 'CATEGORY_NOT_FOUND',
        message: 'Kategori bulunamadı',
      });
    }
    await this.prisma.category.update({
      where: { id: existing.id },
      data: {
        deletedAt: new Date(),
        ...(deletedBy ? { deletedBy } : {}),
      },
    });
    return {
      success: true,
      data: { id: categoryId, deleted: true },
      error: null,
    };
  }

  // ─── Comments ─────────────────────────────────────────

  async listComments(postId: string) {
    await this.requirePublishedOrAnyPost(postId);
    const rows = await this.prisma.comment.findMany({
      where: { postId, deletedAt: null },
      orderBy: { createdAt: 'asc' },
    });
    return {
      success: true,
      data: rows.map((r) => ({
        id: r.id,
        postId: r.postId,
        authorId: r.authorId,
        content: r.content,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      })),
      error: null,
    };
  }

  async createComment(postId: string, dto: CreateCommentDto, authorId: string) {
    await this.requirePublishedOrAnyPost(postId, true);
    const row = await this.prisma.comment.create({
      data: {
        postId,
        authorId,
        content: dto.content.trim(),
      },
    });
    return {
      success: true,
      data: {
        id: row.id,
        postId: row.postId,
        authorId: row.authorId,
        content: row.content,
        createdAt: row.createdAt.toISOString(),
      },
      error: null,
    };
  }

  async updateComment(
    postId: string,
    commentId: string,
    dto: UpdateCommentDto,
    actor: { userId: string; role: string },
  ) {
    const comment = await this.prisma.comment.findFirst({
      where: { id: commentId, postId, deletedAt: null },
    });
    if (!comment) {
      throw new NotFoundException({
        code: 'COMMENT_NOT_FOUND',
        message: 'Yorum bulunamadı',
      });
    }
    const isAdmin = isPlatformAdminRole(actor.role);
    if (!isAdmin && comment.authorId !== actor.userId) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Bu yorumu düzenleyemezsiniz',
      });
    }

    const updated = await this.prisma.comment.update({
      where: { id: comment.id },
      data: { content: dto.content.trim() },
    });
    return {
      success: true,
      data: {
        id: updated.id,
        content: updated.content,
        updatedAt: updated.updatedAt.toISOString(),
      },
      error: null,
    };
  }

  async softDeleteComment(
    postId: string,
    commentId: string,
    actor: { userId: string; role: string },
  ) {
    const comment = await this.prisma.comment.findFirst({
      where: { id: commentId, postId, deletedAt: null },
    });
    if (!comment) {
      throw new NotFoundException({
        code: 'COMMENT_NOT_FOUND',
        message: 'Yorum bulunamadı',
      });
    }
    const isAdmin = isPlatformAdminRole(actor.role);
    if (!isAdmin && comment.authorId !== actor.userId) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Bu yorumu silemezsiniz',
      });
    }
    await this.prisma.comment.update({
      where: { id: comment.id },
      data: { deletedAt: new Date(), deletedBy: actor.userId },
    });
    return {
      success: true,
      data: { id: commentId, deleted: true },
      error: null,
    };
  }

  private assertPostAccess(
    authorId: string,
    actor: { userId: string; role: string },
  ) {
    const isAdmin = isPlatformAdminRole(actor.role);
    if (!isAdmin && authorId !== actor.userId) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Bu yazıyı yönetemezsiniz',
      });
    }
  }

  private async requirePost(postId: string) {
    const post = await this.prisma.post.findFirst({
      where: { id: postId, deletedAt: null },
    });
    if (!post) {
      throw new NotFoundException({
        code: 'POST_NOT_FOUND',
        message: 'Yazı bulunamadı',
      });
    }
    return post;
  }

  private async requirePublishedOrAnyPost(
    postId: string,
    mustBePublished = false,
  ) {
    const post = await this.prisma.post.findFirst({
      where: {
        id: postId,
        deletedAt: null,
        ...(mustBePublished ? { published: true } : {}),
      },
    });
    if (!post) {
      throw new NotFoundException({
        code: 'POST_NOT_FOUND',
        message: 'Yazı bulunamadı',
      });
    }
    return post;
  }

  private async uniquePostSlug(base: string, excludeId?: string) {
    let slug = base;
    let i = 0;
    while (true) {
      const existing = await this.prisma.post.findFirst({
        where: {
          slug,
          deletedAt: null,
          ...(excludeId ? { id: { not: excludeId } } : {}),
        },
      });
      if (!existing) return slug;
      i += 1;
      slug = `${base}-${i}`;
    }
  }

  private async uniqueCategorySlug(base: string, excludeId?: string) {
    let slug = base;
    let i = 0;
    while (true) {
      const existing = await this.prisma.category.findFirst({
        where: {
          slug,
          deletedAt: null,
          ...(excludeId ? { id: { not: excludeId } } : {}),
        },
      });
      if (!existing) return slug;
      i += 1;
      slug = `${base}-${i}`;
    }
  }

  private toPost(row: {
    id: string;
    title: string;
    slug: string;
    content?: string;
    excerpt: string | null;
    coverImage?: string | null;
    seoTitle?: string | null;
    seoDescription?: string | null;
    published: boolean;
    authorId: string;
    publishedAt: Date | null;
    createdAt?: Date;
    updatedAt?: Date;
    categories?: Array<{ id: string; name: string; slug: string }>;
  }): SharedPost & { categories?: SharedCategory[] } {
    return {
      id: row.id,
      title: row.title,
      slug: row.slug,
      content: row.content,
      excerpt: row.excerpt,
      coverImage: row.coverImage ?? null,
      seoTitle: row.seoTitle ?? null,
      seoDescription: row.seoDescription ?? null,
      published: row.published,
      authorId: row.authorId,
      publishedAt: row.publishedAt?.toISOString() ?? null,
      createdAt: row.createdAt?.toISOString(),
      updatedAt: row.updatedAt?.toISOString(),
      ...(row.categories
        ? { categories: row.categories.map((c) => this.toCategory(c)) }
        : {}),
    };
  }

  private toCategory(row: {
    id: string;
    name: string;
    slug: string;
  }): SharedCategory {
    return { id: row.id, name: row.name, slug: row.slug };
  }

  // ─── Page covers ──────────────────────────────────────

  async getPageCover(key: string) {
    this.assertPageCoverKey(key);
    const cacheKey = this.pageCoverCacheKey(key);

    try {
      const cached = await this.cache.get<SharedSitePageCover>(cacheKey);
      if (cached) {
        return { success: true as const, data: cached, error: null };
      }
    } catch {
      // Redis down must not 500 the public listing.
    }

    const data = await this.loadPageCover(key);
    try {
      await this.cache.set(cacheKey, data, PAGE_COVER_CACHE_TTL_SECONDS);
    } catch {
      // ignore cache write failures
    }

    return { success: true as const, data, error: null };
  }

  async updatePageCover(key: string, dto: UpdatePageCoverDto, actorId: string) {
    this.assertPageCoverKey(key);

    let row;
    try {
      row = await this.prisma.sitePageCover.upsert({
        where: { key },
        create: {
          key,
          enabled: dto.enabled,
          headline: dto.headline ?? null,
          subtitle: dto.subtitle ?? null,
          createdBy: actorId,
          updatedBy: actorId,
        },
        update: {
          enabled: dto.enabled,
          ...(dto.headline !== undefined ? { headline: dto.headline } : {}),
          ...(dto.subtitle !== undefined ? { subtitle: dto.subtitle } : {}),
          updatedBy: actorId,
          deletedAt: null,
          deletedBy: null,
        },
      });
    } catch {
      throw new BusinessException(
        'CONTENT_STORAGE_UNAVAILABLE',
        'Sayfa kapağı kaydedilemedi: veritabanı migration gerekli (pnpm --filter api prisma migrate deploy).',
        503,
      );
    }

    const data = this.toPageCover(row);
    await this.cache.del(this.pageCoverCacheKey(key));
    return { success: true as const, data, error: null };
  }

  private assertPageCoverKey(key: string) {
    if (!ALLOWED_PAGE_COVER_KEYS.has(key)) {
      throw new BusinessException(
        'UNKNOWN_PAGE_COVER',
        'Bilinmeyen sayfa kapağı',
        400,
      );
    }
  }

  private pageCoverCacheKey(key: string) {
    return `content:page-cover:${key}`;
  }

  private disabledCover(key: string): SharedSitePageCover {
    return { key, enabled: false, headline: null, subtitle: null };
  }

  private async loadPageCover(key: string): Promise<SharedSitePageCover> {
    try {
      const row = await this.prisma.sitePageCover.findFirst({
        where: { key, deletedAt: null },
      });
      if (!row) {
        return this.disabledCover(key);
      }
      return this.toPageCover(row);
    } catch {
      return this.disabledCover(key);
    }
  }

  private toPageCover(row: {
    key: string;
    enabled: boolean;
    headline: string | null;
    subtitle: string | null;
  }): SharedSitePageCover {
    return {
      key: row.key,
      enabled: row.enabled,
      headline: row.headline,
      subtitle: row.subtitle,
    };
  }

  // ─── Route pages (SEO + copy overlay) ─────────────────

  async listRoutePages() {
    const cacheKey = 'content:route-pages:all';

    try {
      const cached = await this.cache.get<SharedRoutePageOverlay[]>(cacheKey);
      if (cached) {
        return { success: true as const, data: cached, error: null };
      }
    } catch {
      // Redis down must not 500 public pages.
    }

    const data = await this.loadAllRoutePages();
    try {
      await this.cache.set(cacheKey, data, ROUTE_PAGE_CACHE_TTL_SECONDS);
    } catch {
      // ignore cache write failures
    }

    return { success: true as const, data, error: null };
  }

  async getRoutePage(routeKey: string) {
    this.assertRouteKey(routeKey);
    const cacheKey = this.routePageCacheKey(routeKey);

    try {
      const cached = await this.cache.get<SharedRoutePageOverlay>(cacheKey);
      if (cached) {
        return { success: true as const, data: cached, error: null };
      }
    } catch {
      // Redis down must not 500 public pages.
    }

    const data = await this.loadRoutePage(routeKey);
    try {
      await this.cache.set(cacheKey, data, ROUTE_PAGE_CACHE_TTL_SECONDS);
    } catch {
      // ignore cache write failures
    }

    return { success: true as const, data, error: null };
  }

  async updateRoutePage(
    routeKey: string,
    dto: UpdateRoutePageDto,
    actorId: string,
  ) {
    this.assertRouteKey(routeKey);

    let row;
    try {
      row = await this.prisma.routePage.upsert({
        where: { routeKey },
        create: {
          routeKey,
          seoTitle: dto.seoTitle ?? null,
          seoDescription: dto.seoDescription ?? null,
          summary: dto.summary ?? null,
          body: dto.body ?? null,
          createdBy: actorId,
          updatedBy: actorId,
        },
        update: {
          ...(dto.seoTitle !== undefined ? { seoTitle: dto.seoTitle } : {}),
          ...(dto.seoDescription !== undefined
            ? { seoDescription: dto.seoDescription }
            : {}),
          ...(dto.summary !== undefined ? { summary: dto.summary } : {}),
          ...(dto.body !== undefined ? { body: dto.body } : {}),
          updatedBy: actorId,
          deletedAt: null,
          deletedBy: null,
        },
      });
    } catch {
      throw new BusinessException(
        'CONTENT_STORAGE_UNAVAILABLE',
        'Rota içeriği kaydedilemedi: veritabanı migration gerekli (pnpm --filter api prisma migrate deploy).',
        503,
      );
    }

    const data = this.toRoutePage(row, true);
    await this.invalidateRoutePageCache(routeKey);
    return { success: true as const, data, error: null };
  }

  private assertRouteKey(routeKey: string) {
    if (!ALLOWED_ROUTE_KEYS.has(routeKey)) {
      throw new BusinessException(
        'UNKNOWN_ROUTE_KEY',
        'Bilinmeyen rota anahtarı',
        400,
      );
    }
  }

  private routePageCacheKey(routeKey: string) {
    return `content:route-page:${routeKey}`;
  }

  private missingRoutePage(routeKey: string): SharedRoutePageOverlay {
    return {
      routeKey,
      exists: false,
      seoTitle: null,
      seoDescription: null,
      summary: null,
      body: null,
    };
  }

  private async loadRoutePage(
    routeKey: string,
  ): Promise<SharedRoutePageOverlay> {
    try {
      const row = await this.prisma.routePage.findFirst({
        where: { routeKey, deletedAt: null },
      });
      if (!row) {
        return this.missingRoutePage(routeKey);
      }
      return this.toRoutePage(row, true);
    } catch {
      return this.missingRoutePage(routeKey);
    }
  }

  private async loadAllRoutePages(): Promise<SharedRoutePageOverlay[]> {
    try {
      const rows = await this.prisma.routePage.findMany({
        where: { deletedAt: null },
        orderBy: { routeKey: 'asc' },
      });
      return rows.map((row) => this.toRoutePage(row, true));
    } catch {
      return [];
    }
  }

  private async invalidateRoutePageCache(routeKey: string) {
    await this.cache.del(this.routePageCacheKey(routeKey));
    await this.cache.del('content:route-pages:all');
  }

  private toRoutePage(
    row: {
      routeKey: string;
      seoTitle: string | null;
      seoDescription: string | null;
      summary: string | null;
      body: string | null;
    },
    exists: boolean,
  ): SharedRoutePageOverlay {
    return {
      routeKey: row.routeKey,
      exists,
      seoTitle: row.seoTitle,
      seoDescription: row.seoDescription,
      summary: row.summary,
      body: row.body,
    };
  }
}
