import { useState, useEffect, useCallback } from 'react';

const API_URL = import.meta.env.VITE_API_URL || '';

interface User {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
}

interface Tenant {
  id: string;
  name: string;
  slug?: string;
}

interface AuthState {
  user: User | null;
  tenant: Tenant | null;
  isLoading: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    tenant: null,
    isLoading: true,
  });

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/auth/me`, {
        credentials: 'include',
      });
      if (res.ok) {
        const { user, tenant } = await res.json();
        setState((s) => ({ ...s, user, tenant, isLoading: false }));
        return;
      }
    } catch {
      /* ignore */
    }
    setState((s) => ({ ...s, user: null, tenant: null, isLoading: false }));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback((user: User, tenant: Tenant) => {
    setState({ user, tenant, isLoading: false });
  }, []);

  const logout = useCallback(async () => {
    await fetch(`${API_URL}/api/auth/logout`, { method: 'POST', credentials: 'include' });
    setState({ user: null, tenant: null, isLoading: false });
  }, []);

  const getHeaders = useCallback((): HeadersInit => {
    return {};
  }, []);

  return {
    ...state,
    login,
    logout,
    refresh,
    getHeaders,
  };
}
