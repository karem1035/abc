import { create } from 'zustand'
import { useShallow } from 'zustand/react/shallow'

export type UserRole = 'admin' | 'call_center' | 'marketer'

export type AuthUser = {
  id: string
  name: string
  username: string
  role: UserRole
  isActive: boolean
  phone: string | null
  email: string | null
  createdAt: string
}

type LoginResult = { ok: true; user: AuthUser } | { ok: false; error: string }

type AuthState = {
  user: AuthUser | null
  token: string | null
  loading: boolean
  login: (username: string, password: string) => Promise<LoginResult>
  logout: () => void
  updateCachedUser: (user: AuthUser) => void
  authFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>
  boot: () => Promise<void>
}

const TOKEN_KEY = 'abc.access_token'
const USER_KEY = 'abc.user'

function getApiUrl(path: string) {
  const base = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '')
  if (!base) return path
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  return `${base}${path}`
}

function readUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? (JSON.parse(raw) as AuthUser) : null
  } catch {
    return null
  }
}

function readToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

function persistSession(token: string, user: AuthUser) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

function clearSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: readUser(),
  token: readToken(),
  loading: Boolean(readToken()),

  login: async (username, password) => {
    const res = await fetch(getApiUrl('/auth/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    if (!res.ok) {
      return { ok: false, error: 'Invalid username or password' }
    }
    const data = (await res.json()) as { accessToken: string; user: AuthUser }
    persistSession(data.accessToken, data.user)
    set({ user: data.user, token: data.accessToken, loading: false })
    return { ok: true, user: data.user }
  },

  logout: () => {
    void get().authFetch('/auth/logout', { method: 'POST' }).catch(() => {})
    clearSession()
    set({ user: null, token: null, loading: false })
  },

  updateCachedUser: (user) => {
    localStorage.setItem(USER_KEY, JSON.stringify(user))
    set((s) => (s.user ? { user } : s))
  },

  authFetch: async (input, init) => {
    const token = get().token
    const headers = new Headers(init?.headers)
    if (token) headers.set('Authorization', `Bearer ${token}`)

    const url =
      typeof input === 'string'
        ? getApiUrl(input)
        : input instanceof URL
          ? new URL(input.toString())
          : input

    return fetch(url, { ...init, headers })
  },

  // Validate the persisted token once on app boot via /auth/me
  boot: async () => {
    const token = get().token
    if (!token) {
      set({ loading: false })
      return
    }
    try {
      const res = await fetch(getApiUrl('/auth/me'), {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('unauthorized')
      const user = (await res.json()) as AuthUser
      persistSession(token, user)
      set({ user, token, loading: false })
    } catch {
      clearSession()
      set({ user: null, token: null, loading: false })
    }
  },
}))

// Kick off session validation as soon as the app loads the auth module
void useAuthStore.getState().boot()

export function useAuth() {
  return useAuthStore(
    useShallow((s) => ({
      user: s.user,
      token: s.token,
      loading: s.loading,
      login: s.login,
      logout: s.logout,
      updateCachedUser: s.updateCachedUser,
      authFetch: s.authFetch,
    })),
  )
}
