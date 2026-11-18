'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';

import { revalidateRehberPanel } from '@/app/(guide)/rehber/actions';
import { useAuth } from '@/providers/auth-provider';
import { ApiError } from '@/services/api-client';
import {
  getGuideProfile,
  updateGuideProfile,
  type GuideProfile,
} from '@/services/identity';

export default function RehberProfilPage() {
  const { accessToken } = useAuth();
  const [profile, setProfile] = useState<GuideProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [languagesText, setLanguagesText] = useState('');

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getGuideProfile(accessToken);
      setProfile(data);
      setLanguagesText(data.languages.join(', '));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Profil yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!accessToken || !profile) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const updated = await updateGuideProfile(accessToken, {
        firstName: profile.firstName,
        lastName: profile.lastName,
        identityNumber: profile.identityNumber,
        languages: languagesText
          .split(',')
          .map((lang) => lang.trim())
          .filter(Boolean),
        oda: profile.oda ?? '',
        sicilNo: profile.sicilNo ?? '',
        ruhsatNo: profile.ruhsatNo ?? '',
        ruhsatExpiresAt: profile.ruhsatExpiresAt ?? undefined,
        birthDate: profile.birthDate ?? undefined,
        phone: profile.phone ?? undefined,
        city: profile.city ?? undefined,
        bio: profile.bio ?? undefined,
      });
      setProfile(updated);
      setLanguagesText(updated.languages.join(', '));
      await revalidateRehberPanel();
      setMessage('Profil güncellendi.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Profil güncellenemedi');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <p className="text-sm text-gray-500" data-testid="rehber-profil-loading">
        Yükleniyor…
      </p>
    );
  }

  if (!profile) {
    return (
      <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
        {error ?? 'Profil bulunamadı'}
      </p>
    );
  }

  const fieldClass =
    'mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';

  return (
    <div
      className="mx-auto max-w-3xl space-y-4"
      data-testid="rehber-profil-page"
      data-status={profile.status}
    >
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Rehber kartı</h2>
        <p className="mt-1 text-sm text-gray-600">
          TUREB bilgilerinizi güncelleyin. Durum:{' '}
          <span className="font-medium">{profile.status}</span>
          {profile.status === 'PENDING' ? ' — admin onayı bekleniyor' : ''}
        </p>
      </div>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
          {message}
        </p>
      ) : null}

      <form
        onSubmit={handleSubmit}
        className="grid gap-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm sm:grid-cols-2"
      >
        <label className="text-sm">
          Ad
          <input
            className={fieldClass}
            value={profile.firstName}
            onChange={(e) =>
              setProfile({ ...profile, firstName: e.target.value })
            }
          />
        </label>
        <label className="text-sm">
          Soyad
          <input
            className={fieldClass}
            value={profile.lastName}
            onChange={(e) =>
              setProfile({ ...profile, lastName: e.target.value })
            }
          />
        </label>
        <label className="text-sm sm:col-span-2">
          E-posta
          <input className={fieldClass} value={profile.email} disabled />
        </label>
        <label className="text-sm">
          TCKN
          <input
            className={fieldClass}
            value={profile.identityNumber}
            onChange={(e) =>
              setProfile({ ...profile, identityNumber: e.target.value })
            }
          />
        </label>
        <label className="text-sm">
          Doğum tarihi
          <input
            type="date"
            className={fieldClass}
            value={profile.birthDate ?? ''}
            onChange={(e) =>
              setProfile({ ...profile, birthDate: e.target.value || null })
            }
          />
        </label>
        <label className="text-sm sm:col-span-2">
          Diller
          <input
            className={fieldClass}
            value={languagesText}
            onChange={(e) => setLanguagesText(e.target.value)}
          />
        </label>
        <label className="text-sm">
          Oda
          <input
            className={fieldClass}
            value={profile.oda ?? ''}
            onChange={(e) => setProfile({ ...profile, oda: e.target.value })}
          />
        </label>
        <label className="text-sm">
          Sicil no
          <input
            className={fieldClass}
            value={profile.sicilNo ?? ''}
            onChange={(e) =>
              setProfile({ ...profile, sicilNo: e.target.value })
            }
          />
        </label>
        <label className="text-sm">
          Ruhsat no
          <input
            className={fieldClass}
            value={profile.ruhsatNo ?? ''}
            onChange={(e) =>
              setProfile({ ...profile, ruhsatNo: e.target.value })
            }
          />
        </label>
        <label className="text-sm">
          Ruhsat geçerlilik
          <input
            type="date"
            className={fieldClass}
            value={profile.ruhsatExpiresAt ?? ''}
            onChange={(e) =>
              setProfile({
                ...profile,
                ruhsatExpiresAt: e.target.value || null,
              })
            }
          />
        </label>
        <label className="text-sm">
          Telefon
          <input
            className={fieldClass}
            value={profile.phone ?? ''}
            onChange={(e) =>
              setProfile({ ...profile, phone: e.target.value || null })
            }
          />
        </label>
        <label className="text-sm">
          Şehir
          <input
            className={fieldClass}
            value={profile.city ?? ''}
            onChange={(e) =>
              setProfile({ ...profile, city: e.target.value || null })
            }
          />
        </label>
        <label className="text-sm sm:col-span-2">
          Bio
          <textarea
            className={fieldClass}
            rows={3}
            value={profile.bio ?? ''}
            onChange={(e) =>
              setProfile({ ...profile, bio: e.target.value || null })
            }
          />
        </label>
        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Kaydediliyor…' : 'Kaydet'}
          </button>
        </div>
      </form>
    </div>
  );
}
