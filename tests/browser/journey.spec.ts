import { expect, test } from '@playwright/test'

test('resolves a supported public link in the primary browser journey', async ({ page }) => {
  await page.route('**/api/media/resolve', async (route) => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({
      kind: 'direct-media', mediaUrl: 'https://cf-media.sndcdn.com/test.mp3', filename: 'Artist - Track.mp3',
      mimeType: 'audio/mpeg', title: 'Track', artist: 'Artist', artworkUrl: null,
      durationSeconds: 125, sourceUrl: 'https://soundcloud.com/artist/track',
    }),
  }))
  await page.goto('/')
  await page.getByLabel('Public track link').fill('https://soundcloud.com/artist/track')
  await page.getByRole('button', { name: 'Check link' }).click()
  await expect(page.getByRole('heading', { name: 'Track' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Download MP3' })).toBeEnabled()
  await expect(page.getByText(/not affiliated with or endorsed by SoundCloud/i)).toBeVisible()
})

