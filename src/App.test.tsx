import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'

const mocks = vi.hoisted(() => ({ resolveMedia: vi.fn(), downloadMedia: vi.fn() }))
vi.mock('./fetchClient', async (original) => {
  const actual = await original<typeof import('./fetchClient')>()
  return { ...actual, resolveMedia: mocks.resolveMedia, downloadMedia: mocks.downloadMedia }
})

const result = {
  kind: 'direct-media' as const,
  mediaUrl: 'https://cf-media.sndcdn.com/audio.mp3', filename: 'Artist - Track.mp3', mimeType: 'audio/mpeg',
  title: 'Track', artist: 'Artist', artworkUrl: null, durationSeconds: 125, sourceUrl: 'https://soundcloud.com/artist/track',
}

describe('Clyvora Fetch', () => {
  beforeEach(() => {
    mocks.resolveMedia.mockReset().mockResolvedValue(result)
    mocks.downloadMedia.mockReset().mockResolvedValue({ blob: new Blob([new Uint8Array([1, 2])]), filename: result.filename })
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: vi.fn(() => 'blob:audio') })
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() })
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)
  })

  it('rejects unsupported websites before calling the resolver', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.type(screen.getByLabelText(/public track link/i), 'https://example.com/audio')
    await user.click(screen.getByRole('button', { name: /check link/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/not supported yet/i)
    expect(mocks.resolveMedia).not.toHaveBeenCalled()
  })

  it('does not claim success until a downloadable result exists', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.type(screen.getByLabelText(/public track link/i), result.sourceUrl)
    expect(screen.queryByRole('button', { name: /download mp3/i })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /check link/i }))
    expect(await screen.findByRole('heading', { name: 'Track' })).toBeVisible()
    expect(screen.getByRole('button', { name: /download mp3/i })).toBeEnabled()
  })

  it('downloads only after explicit confirmation and supports a clear reset', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.type(screen.getByLabelText(/public track link/i), result.sourceUrl)
    await user.click(screen.getByRole('button', { name: /check link/i }))
    await user.click(await screen.findByRole('button', { name: /download mp3/i }))
    expect(await screen.findByText(/download started/i)).toBeVisible()
    await user.click(screen.getByRole('button', { name: /start over/i }))
    expect(screen.getByLabelText(/public track link/i)).toHaveValue('')
  })
})

