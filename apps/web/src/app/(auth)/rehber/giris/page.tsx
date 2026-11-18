'use client';

import { ActorLoginPage } from '@/components/features/auth/actor-login-page';
import { useAuth } from '@/providers/auth-provider';
import { REHBER_DASHBOARD, REHBER_REGISTER } from '@/lib/panel-routes';

export default function RehberGirisPage() {
  const { loginGuidePanel, user, isAuthenticated } = useAuth();

  return (
    <ActorLoginPage
      portalLabel="Rehber"
      title="Rehber Girişi"
      subtitle="Hesabınıza giriş yaparak rehber paneline erişin."
      heroTitle="Rehber Portalına Hoş Geldiniz"
      heroSubtitle="Atanan turları görün, müsaitliğinizi yönetin ve atama yanıtlarınızı verin."
      emailPlaceholder="guide@demo.turta.com"
      dashboardHref={REHBER_DASHBOARD}
      expectedRole="GUIDE"
      login={loginGuidePanel}
      isAuthenticated={isAuthenticated}
      userRole={user?.role}
      registerHref={REHBER_REGISTER}
      registerLabel="Hesabınız yok mu? Rehber üyeliği"
      testIdPrefix="rehber"
    />
  );
}
