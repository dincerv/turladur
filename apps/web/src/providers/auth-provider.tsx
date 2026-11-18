'use client';

import type { User } from '@turta/shared-types';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import {
  bindAuthTokenHandlers,
  refreshAccessToken,
} from '@/services/api-client';
import { captureProductEvent } from '@/lib/product-analytics';
import {
  getProfile,
  loginAgencyStaff,
  loginBusCompany,
  loginGuide,
  loginUser,
  logoutSession,
  probeSession,
  registerUser,
} from '@/services/identity';
import {
  isPlatformAdminRole,
  isSellerPanelRole,
  normalizeStaffPermissions,
} from '@/lib/partner-permissions';

function syntheticActorUser(input: {
  id: string;
  email: string;
  name: string;
  role: User['role'] | string;
  permissions?: User['permissions'];
}): User {
  const now = new Date().toISOString();
  return {
    id: input.id,
    email: input.email,
    firstName: input.name,
    lastName: null,
    phone: null,
    identityNumber: null,
    birthDate: null,
    address: null,
    billingLine1: null,
    billingLine2: null,
    billingCity: null,
    billingState: null,
    billingPostalCode: null,
    billingCountry: null,
    role: input.role as User['role'],
    partnerId: null,
    permissions: input.permissions ?? null,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };
}

type AuthContextValue = {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isBootstrapping: boolean;
  login: (email: string, password: string) => Promise<User>;
  /** Acente panel: User PARTNER login, then AgencyStaff fallback. */
  loginSellerPanel: (email: string, password: string) => Promise<User>;
  loginGuidePanel: (email: string, password: string) => Promise<User>;
  loginBusPanel: (email: string, password: string) => Promise<User>;
  register: (input: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    phone: string;
    identityNumber: string;
    address: string;
    otpCode: string;
  }) => Promise<User>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Access token stays in memory (security rule — no localStorage JWT).
 * Refresh lives in HttpOnly cookie — F5 restore via /identity/refresh.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const accessTokenRef = useRef<string | null>(null);

  useEffect(() => {
    bindAuthTokenHandlers({
      getAccessToken: () => accessTokenRef.current,
      setAccessToken: (token) => {
        accessTokenRef.current = token;
        setAccessToken(token);
      },
      onSessionExpired: () => {
        accessTokenRef.current = null;
        setAccessToken(null);
        setUser(null);
      },
    });
    return () => bindAuthTokenHandlers(null);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = await refreshAccessToken();
        if (cancelled || !token) return;

        try {
          const profile = await getProfile(token);
          if (!cancelled) {
            accessTokenRef.current = token;
            setAccessToken(token);
            setUser(profile);
          }
          return;
        } catch {
          // Non-USER actors have no /identity/profile
        }

        const session = await probeSession();
        if (cancelled || !session.authenticated) return;

        if (
          session.actorType === 'AGENCY_STAFF' &&
          isSellerPanelRole(session.role)
        ) {
          accessTokenRef.current = token;
          setAccessToken(token);
          setUser(
            syntheticActorUser({
              id: session.agencyStaffId ?? session.userId,
              email: session.email ?? '',
              name: session.name ?? 'Acente',
              role: session.role,
              permissions: normalizeStaffPermissions(session.permissions),
            }),
          );
          return;
        }

        if (session.actorType === 'GUIDE' && session.role === 'GUIDE') {
          accessTokenRef.current = token;
          setAccessToken(token);
          setUser(
            syntheticActorUser({
              id: session.userId,
              email: session.email ?? '',
              name: session.name ?? 'Rehber',
              role: 'GUIDE',
            }),
          );
          return;
        }

        if (
          session.actorType === 'BUS_COMPANY' &&
          session.role === 'BUS_COMPANY'
        ) {
          accessTokenRef.current = token;
          setAccessToken(token);
          setUser(
            syntheticActorUser({
              id: session.userId,
              email: session.email ?? '',
              name: session.name ?? 'Otobüs',
              role: 'BUS_COMPANY',
            }),
          );
        }
      } catch {
        // No cookie / expired — stay logged out
      } finally {
        if (!cancelled) setIsBootstrapping(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await loginUser({ email, password });
    accessTokenRef.current = result.accessToken;
    setAccessToken(result.accessToken);
    setUser(result.user);
    captureProductEvent('login_success', { role: result.user.role });
    return result.user;
  }, []);

  const clearSessionLocal = useCallback(() => {
    accessTokenRef.current = null;
    setAccessToken(null);
    setUser(null);
  }, []);

  const loginSellerPanel = useCallback(
    async (email: string, password: string) => {
      // AgencyStaff first — avoids burning /identity/login throttle (5/min)
      // on every acente E2E / portal attempt.
      try {
        const result = await loginAgencyStaff({ email, password });
        const synthetic = syntheticActorUser({
          id: result.staff.id,
          email: result.staff.email,
          name: result.staff.name,
          role: result.staff.role,
          permissions: normalizeStaffPermissions(result.staff.permissions),
        });
        accessTokenRef.current = result.accessToken;
        setAccessToken(result.accessToken);
        setUser(synthetic);
        captureProductEvent('login_success', { role: synthetic.role });
        return synthetic;
      } catch {
        clearSessionLocal();
      }

      const loggedIn = await login(email, password);
      if (isPlatformAdminRole(loggedIn.role)) {
        clearSessionLocal();
        throw new Error(
          'Platform admin hesabı /login üzerinden girer. Acente paneli için owner01@agency.demo.turta.com kullanın.',
        );
      }
      if (!isSellerPanelRole(loggedIn.role)) {
        clearSessionLocal();
        throw new Error(
          'Bu giriş yalnızca iş ortakları / acente personeli içindir.',
        );
      }
      return loggedIn;
    },
    [login, clearSessionLocal],
  );

  const loginGuidePanel = useCallback(
    async (email: string, password: string) => {
      const result = await loginGuide({ email, password });
      const name = [result.guide.firstName, result.guide.lastName]
        .filter(Boolean)
        .join(' ')
        .trim();
      const synthetic = syntheticActorUser({
        id: result.guide.id,
        email: result.guide.email,
        name: name || 'Rehber',
        role: 'GUIDE',
      });
      accessTokenRef.current = result.accessToken;
      setAccessToken(result.accessToken);
      setUser(synthetic);
      captureProductEvent('login_success', { role: 'GUIDE' });
      return synthetic;
    },
    [],
  );

  const loginBusPanel = useCallback(async (email: string, password: string) => {
    const result = await loginBusCompany({ email, password });
    const synthetic = syntheticActorUser({
      id: result.busCompany.id,
      email: result.busCompany.contactEmail,
      name: result.busCompany.companyName,
      role: 'BUS_COMPANY',
    });
    accessTokenRef.current = result.accessToken;
    setAccessToken(result.accessToken);
    setUser(synthetic);
    captureProductEvent('login_success', { role: 'BUS_COMPANY' });
    return synthetic;
  }, []);

  const register = useCallback(
    async (input: {
      email: string;
      password: string;
      firstName?: string;
      lastName?: string;
      phone: string;
      identityNumber: string;
      address: string;
      otpCode: string;
    }) => {
      const result = await registerUser(input);
      accessTokenRef.current = result.accessToken;
      setAccessToken(result.accessToken);
      setUser(result.user);
      captureProductEvent('login_success', { role: result.user.role });
      return result.user;
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await logoutSession();
    } catch {
      // Cookie clear best-effort
    }
    accessTokenRef.current = null;
    setAccessToken(null);
    setUser(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!accessTokenRef.current) return;
    try {
      const profile = await getProfile(accessTokenRef.current);
      setUser(profile);
    } catch {
      // AgencyStaff / Guide / Bus — no USER profile; keep current session user
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      accessToken,
      isAuthenticated: Boolean(accessToken && user),
      isBootstrapping,
      login,
      loginSellerPanel,
      loginGuidePanel,
      loginBusPanel,
      register,
      logout,
      refreshProfile,
    }),
    [
      user,
      accessToken,
      isBootstrapping,
      login,
      loginSellerPanel,
      loginGuidePanel,
      loginBusPanel,
      register,
      logout,
      refreshProfile,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
