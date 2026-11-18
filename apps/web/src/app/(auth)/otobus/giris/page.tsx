'use client';

import { ActorLoginPage } from '@/components/features/auth/actor-login-page';
import { useAuth } from '@/providers/auth-provider';
import { OTOBUS_DASHBOARD } from '@/lib/panel-routes';

export default function OtobusGirisPage() {
  const { loginBusPanel, user, isAuthenticated } = useAuth();

  return (
    <ActorLoginPage
      portalLabel="Otobüs"
      title="Otobüs Firması Girişi"
      subtitle="Hesabınıza giriş yaparak otobüs paneline erişin."
      heroTitle="Otobüs Portalına Hoş Geldiniz"
      heroSubtitle="Araç atamalarını yanıtlayın, filonuzu ve müsaitliği yönetin."
      emailPlaceholder="bus@demo.turta.com"
      dashboardHref={OTOBUS_DASHBOARD}
      expectedRole="BUS_COMPANY"
      login={loginBusPanel}
      isAuthenticated={isAuthenticated}
      userRole={user?.role}
      testIdPrefix="otobus"
    />
  );
}
