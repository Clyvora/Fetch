import { describe, expect, it } from 'vitest'
import { validatePublicUrl } from './fetchClient'

describe('public link validation', () => {
  it('accepts one public SoundCloud track URL', () => {
    expect(validatePublicUrl('https://soundcloud.com/artist/track').hostname).toBe('soundcloud.com')
  })
  it.each([
    'http://soundcloud.com/artist/track',
    'https://example.com/audio',
    'https://127.0.0.1/audio',
    'https://169.254.169.254/latest/meta-data',
    'https://user:pass@soundcloud.com/artist/track',
    'https://soundcloud.com/artist/track?secret_token=s-private',
    'https://soundcloud.com/artist/sets/playlist',
  ])('rejects unsupported or sensitive URL %s', (url) => expect(() => validatePublicUrl(url)).toThrow())
})

