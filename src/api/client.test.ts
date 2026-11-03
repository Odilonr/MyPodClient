import { beforeEach, describe, expect, it, vi } from 'vitest'

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status })

async function loadClient () {
  vi.resetModules()
  return import('./client')
}

describe('api client', () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
  })

  it('keeps the access token out of browser storage', async () => {
    fetchMock.mockResolvedValueOnce(json({ accessToken: 'secret-token' }))
    const api = await loadClient()
    await api.logIn('listener', 'correct-horse')
    expect(JSON.stringify({ ...localStorage })).not.toContain('secret-token')
    expect(JSON.stringify({ ...sessionStorage })).not.toContain('secret-token')
    expect(document.cookie).not.toContain('secret-token')
  })

  it('sends cookies, and the token after login', async () => {
    fetchMock.mockResolvedValueOnce(json({ accessToken: 'token-1' })).mockResolvedValueOnce(json({ currentplaytime: 7 }))
    const api = await loadClient()
    await api.logIn('listener', 'correct-horse')
    await expect(api.getPlayPosition('episode-1')).resolves.toBe(7)
    const [url, init] = fetchMock.mock.calls[1]
    expect(url).toBe('http://api.test/episodes/episode-1/timestamp')
    expect(init.credentials).toBe('include')
    expect(new Headers(init.headers).get('Authorization')).toBe('Bearer token-1')
  })

  it('refreshes an expired token once and tries again', async () => {
    fetchMock
      .mockResolvedValueOnce(json({ accessToken: 'old' }))
      .mockResolvedValueOnce(new Response(null, { status: 403 }))
      .mockResolvedValueOnce(json({ accessToken: 'new' }))
      .mockResolvedValueOnce(json({ currentplaytime: 12 }))
    const api = await loadClient()
    await api.logIn('listener', 'correct-horse')
    await expect(api.getPlayPosition('episode-1')).resolves.toBe(12)
    expect(fetchMock.mock.calls[2][0]).toBe('http://api.test/user/refresh')
    expect(new Headers(fetchMock.mock.calls[3][1].headers).get('Authorization')).toBe('Bearer new')
  })

  it('shares one refresh between requests that fail together', async () => {
    fetchMock.mockImplementation(async () => json({ accessToken: 'new' }))
    const api = await loadClient()
    await Promise.all([api.refreshSession(), api.refreshSession()])
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('reports a failed refresh and clears the session', async () => {
    fetchMock.mockResolvedValueOnce(json({ accessToken: 'old' })).mockResolvedValueOnce(new Response(null, { status: 403 }))
    const api = await loadClient()
    await api.logIn('listener', 'correct-horse')
    await expect(api.refreshSession()).resolves.toBe(false)
    expect(api.hasSession()).toBe(false)
  })

  it('treats an empty 204 list as no results', async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }))
    const api = await loadClient()
    await expect(api.getShows()).resolves.toEqual([])
  })

  it('carries field errors from the API', async () => {
    fetchMock.mockResolvedValueOnce(json({ message: 'Invalid registration data', error: [{ field: 'email', message: 'Enter a valid email' }] }, 400))
    const api = await loadClient()
    await expect(api.register('listener', 'bad', 'correct-horse')).rejects.toMatchObject({
      status: 400,
      fields: [{ field: 'email', message: 'Enter a valid email' }]
    })
  })

  it('builds audio links from the episode ID, not a file path', async () => {
    const api = await loadClient()
    expect(api.audioUrl('episode-1')).toBe('http://api.test/episodes/episode-1/audio')
  })
})
