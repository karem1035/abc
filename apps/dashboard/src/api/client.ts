import { useAuthStore } from '@/lib/auth'

/** Typed JSON fetch against the backend API using the stored auth token. */
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await useAuthStore.getState().authFetch(path, init)
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null
    throw new Error(body?.error ?? `Request failed (${res.status})`)
  }
  return (await res.json()) as T
}
