# Clyvora Fetch

> Download audio from supported public links when you have permission.

Clyvora Fetch is an **experimental** networked tool. It currently accepts one public SoundCloud track URL, asks ClyvoraAPI for public metadata and an available non-encrypted progressive audio location, then downloads the audio from the source CDN in the browser.

It is not affiliated with or endorsed by SoundCloud. It does not support DRM, authentication, paywalls, private tracks, token-bearing links, regional bypasses, deleted media, paid previews, or encrypted streams.

## Development

Run ClyvoraAPI on port 8787, then:

```bash
pnpm install
pnpm dev --port 4176
pnpm test
pnpm lint
pnpm build
pnpm test:browser
```

Production uses `https://api.clyvora.tech/v1/media/resolve` by default. Override it only with the exact reviewed endpoint through `VITE_CLYVORA_API_URL`.

## Network and privacy boundary

The submitted public URL is sent to ClyvoraAPI and the supported source platform. Resolved audio is downloaded from an approved SoundCloud CDN hostname. Do not describe Fetch as offline or local-only. No submitted URL is sent to unrelated analytics, and Vercel page analytics must not include it in a path or custom event.

The Content Security Policy permits only the app origin, `api.clyvora.tech`, and SoundCloud CDN hosts required for artwork/audio. Compatibility for old Convert clients remains isolated to the old Worker and the API compatibility route; Fetch does not use that legacy origin.

## Limits and failure states

- 25-second resolver timeout in the browser; 20-second upstream API timeout.
- 256 MiB browser audio-download limit.
- Structured messages for invalid URLs, unsupported sites, unavailable/private/protected tracks, rate limiting, timeouts, resolver changes, and download failures.
- The interface displays success only after a validated downloadable result is returned.

Source platforms may change without notice. Keep the Experimental label until reliability, costs, policy boundaries, and deployed monitoring are proven.
