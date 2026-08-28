# Network boundary

Clyvora Fetch is intentionally networked. Approved destinations are:

- The Fetch application origin for code, static assets, and same-origin page analytics.
- `api.clyvora.tech` for submitted supported public URLs.
- `*.sndcdn.com` for validated artwork and audio returned by the resolver.

The Content Security Policy must not permit arbitrary HTTPS connections. Submitted URLs, query strings, and media filenames must not be included in analytics or logs.
