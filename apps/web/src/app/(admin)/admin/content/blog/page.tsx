'use client';

import { FormEvent, useEffect, useState } from 'react';

import { revalidateBlogContent } from '@/app/(admin)/admin/content/actions';
import {
  createAdminContentPost,
  deleteAdminContentPost,
  listAdminContentPosts,
  updateAdminContentPost,
} from '@/services/partner-admin';
import { useAuth } from '@/providers/auth-provider';

type PostRow = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  published: boolean;
  publishedAt: string | null;
};

export default function AdminBlogManagementPage() {
  const { accessToken } = useAuth();
  const [rows, setRows] = useState<PostRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    excerpt: '',
    content: '',
    seoTitle: '',
    seoDescription: '',
    published: true,
  });

  async function reload() {
    if (!accessToken) return;
    setRows(await listAdminContentPosts(accessToken));
  }

  useEffect(() => {
    void reload().catch((err: Error) => setError(err.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!accessToken) return;
    try {
      await createAdminContentPost(
        {
          title: form.title,
          excerpt: form.excerpt || undefined,
          content: form.content,
          seoTitle: form.seoTitle || undefined,
          seoDescription: form.seoDescription || undefined,
          published: form.published,
        },
        accessToken,
      );
      await revalidateBlogContent();
      setForm({
        title: '',
        excerpt: '',
        content: '',
        seoTitle: '',
        seoDescription: '',
        published: true,
      });
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Oluşturulamadı');
    }
  }

  return (
    <div data-testid="admin-blog-page">
      <h2 className="text-lg font-semibold text-neutral-900">Blog Yönetimi</h2>
      <p className="mt-1 text-sm text-neutral-600">
        Platform admin yazarlığı — draft / published ve SEO meta alanları.
        Rehberler blog yazısı oluşturamaz.
      </p>
      {error ? (
        <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <form
        onSubmit={handleCreate}
        className="mt-6 max-w-2xl space-y-3 rounded-xl border border-neutral-200 bg-white p-4"
        data-testid="admin-blog-create-form"
      >
        <input
          required
          placeholder="Başlık"
          className="h-11 w-full rounded-lg border px-3 text-sm"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          data-testid="admin-blog-title"
        />
        <input
          placeholder="Özet"
          className="h-11 w-full rounded-lg border px-3 text-sm"
          value={form.excerpt}
          onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
          data-testid="admin-blog-excerpt"
        />
        <input
          placeholder="SEO başlık (opsiyonel)"
          className="h-11 w-full rounded-lg border px-3 text-sm"
          value={form.seoTitle}
          onChange={(e) => setForm((f) => ({ ...f, seoTitle: e.target.value }))}
          data-testid="admin-blog-seo-title"
        />
        <input
          placeholder="SEO açıklama (opsiyonel)"
          className="h-11 w-full rounded-lg border px-3 text-sm"
          value={form.seoDescription}
          onChange={(e) =>
            setForm((f) => ({ ...f, seoDescription: e.target.value }))
          }
          data-testid="admin-blog-seo-description"
        />
        <textarea
          required
          minLength={20}
          rows={6}
          placeholder="İçerik"
          className="w-full rounded-lg border px-3 py-2 text-sm"
          value={form.content}
          onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
          data-testid="admin-blog-content"
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.published}
            onChange={(e) =>
              setForm((f) => ({ ...f, published: e.target.checked }))
            }
            data-testid="admin-blog-published"
          />
          Hemen yayınla
        </label>
        <button
          type="submit"
          className="rounded-lg bg-neutral-950 px-4 py-2 text-sm font-semibold text-white"
          data-testid="admin-blog-submit"
        >
          Yazı oluştur
        </button>
      </form>

      <ul
        className="mt-8 divide-y rounded-xl border border-neutral-200 bg-white"
        data-testid="admin-blog-list"
      >
        {rows.map((row) => (
          <li
            key={row.id}
            className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
            data-testid={`admin-blog-row-${row.id}`}
            data-published={row.published ? 'true' : 'false'}
          >
            <div>
              <p className="font-medium">{row.title}</p>
              <p className="text-xs text-neutral-500">
                /{row.slug} · {row.published ? 'Yayında' : 'Taslak'}
                {row.seoTitle ? ` · SEO: ${row.seoTitle}` : ''}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className="rounded-lg border px-3 py-1 text-xs"
                data-testid={`admin-blog-toggle-${row.id}`}
                onClick={() => {
                  if (!accessToken) return;
                  void updateAdminContentPost(
                    row.id,
                    { published: !row.published },
                    accessToken,
                  )
                    .then(() => revalidateBlogContent(row.slug))
                    .then(reload)
                    .catch((err: Error) => setError(err.message));
                }}
              >
                {row.published ? 'Taslağa al' : 'Yayınla'}
              </button>
              <button
                type="button"
                className="rounded-lg px-3 py-1 text-xs text-red-700"
                data-testid={`admin-blog-delete-${row.id}`}
                onClick={() => {
                  if (!accessToken) return;
                  if (!confirm('Silinsin mi?')) return;
                  void deleteAdminContentPost(row.id, accessToken)
                    .then(() => revalidateBlogContent(row.slug))
                    .then(reload)
                    .catch((err: Error) => setError(err.message));
                }}
              >
                Sil
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
