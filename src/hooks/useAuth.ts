'use client';

import { useEffect, useState } from 'react';
import type { UserRole } from '@/lib/types';

export interface AuthUser {
  id?: string | number;
  email?: string;
  nickname?: string;
  level?: string;
  role?: string;
  is_pro?: boolean;
}

interface UseAuthReturn {
  user: AuthUser | null;
  userRole: UserRole;
  loading: boolean;
  error: string | null;
}

let hasRedirected = false;

function getRoleFromUser(user?: AuthUser | null): UserRole {
  if (!user) return 'BASIC';
  if (user.role === 'ADMIN' || user.level === 'LEVEL_99') return 'ADMIN';
  if (user.role === 'PRO' || user.is_pro || user.level === 'LEVEL_50') return 'PRO';
  return 'BASIC';
}

function clearSessionAndRedirect() {
  if (hasRedirected) return;
  hasRedirected = true;
  localStorage.removeItem('access_token');
  localStorage.removeItem('user');
  window.location.href = '/';
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('BASIC');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('access_token');

    if (!token) {
      clearSessionAndRedirect();
      setLoading(false);
      return;
    }

    const verify = async () => {
      try {
        const res = await fetch('/api/me', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: 'no-store',
        });

        if (!res.ok) {
          clearSessionAndRedirect();
          return;
        }

        const verifiedUser = (await res.json()) as AuthUser;
        localStorage.setItem('user', JSON.stringify(verifiedUser));
        setUser(verifiedUser);
        setUserRole(getRoleFromUser(verifiedUser));
      } catch {
        setError('서버 연결에 실패했습니다.');
        clearSessionAndRedirect();
      } finally {
        setLoading(false);
      }
    };

    void verify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { user, userRole, loading, error };
}

export { getRoleFromUser };
