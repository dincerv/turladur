import type { Metadata } from 'next';

import { ProfileShell } from '@/components/features/profile/profile-shell';

export const metadata: Metadata = {
  title: 'Profil',
  description: 'Kişisel bilgiler, fatura adresi ve güvenlik ayarları.',
};

export default function ProfilePage() {
  return <ProfileShell />;
}
