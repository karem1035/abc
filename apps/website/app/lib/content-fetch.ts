/** Respect the API's rate limit when generating many static pages at once. */
export async function contentFetch(input: string | URL, init?: RequestInit): Promise<Response> {
  for (let attempt = 0; ; attempt++) {
    const response = await fetch(input, init)
    if (response.status !== 429 || attempt >= 2) return response
    const retryAfter = Number(response.headers.get('Retry-After') ?? response.headers.get('RateLimit-Reset') ?? 60)
    const seconds = Number.isFinite(retryAfter) ? Math.max(1, Math.min(61, retryAfter)) : 60
    await response.body?.cancel()
    await new Promise(resolve => setTimeout(resolve, (seconds + 1) * 1000))
  }
}
