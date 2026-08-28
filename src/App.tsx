import { useEffect, useRef, useState } from 'react'
import { downloadMedia, FetchError, resolveMedia, validatePublicUrl } from './fetchClient'
import type { ResolvedMedia } from './fetchClient'

type Stage = 'idle' | 'resolving' | 'ready' | 'downloading' | 'complete' | 'error'

function duration(seconds: number | null): string {
  if (!seconds || seconds < 0) return 'Duration unavailable'
  const minutes = Math.floor(seconds / 60)
  return `${minutes}:${String(Math.round(seconds % 60)).padStart(2, '0')}`
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  const value = bytes / 1024 / 1024
  return value < 1 ? `${Math.round(bytes / 1024)} KB` : `${value.toFixed(value < 10 ? 1 : 0)} MB`
}

export default function App() {
  const [url, setUrl] = useState('')
  const [stage, setStage] = useState<Stage>('idle')
  const [media, setMedia] = useState<ResolvedMedia | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState<{ loaded: number; total?: number } | null>(null)
  const [downloadedSize, setDownloadedSize] = useState<number | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => () => abortRef.current?.abort(), [])

  const reset = () => {
    abortRef.current?.abort()
    setUrl(''); setStage('idle'); setMedia(null); setError(null); setProgress(null); setDownloadedSize(null)
  }

  const resolve = async () => {
    abortRef.current?.abort()
    setError(null); setMedia(null); setDownloadedSize(null)
    try { validatePublicUrl(url) } catch (caught) {
      setStage('error'); setError(caught instanceof Error ? caught.message : 'That link is invalid.'); return
    }
    const controller = new AbortController()
    abortRef.current = controller
    setStage('resolving')
    try {
      const result = await resolveMedia(url, controller.signal)
      if (!result.mediaUrl) throw new FetchError('NO_DOWNLOAD', 'No downloadable result is available for that public link.')
      setMedia(result)
      setStage('ready')
    } catch (caught) {
      if (controller.signal.aborted) return
      setStage('error')
      setError(caught instanceof Error ? caught.message : 'The resolver could not complete this request.')
    } finally {
      if (abortRef.current === controller) abortRef.current = null
    }
  }

  const download = async () => {
    if (!media) return
    const controller = new AbortController()
    abortRef.current = controller
    setError(null); setProgress({ loaded: 0 }); setStage('downloading')
    try {
      const result = await downloadMedia(media, controller.signal, (loaded, total) => setProgress({ loaded, total }))
      const objectUrl = URL.createObjectURL(result.blob)
      try {
        const anchor = document.createElement('a')
        anchor.href = objectUrl
        anchor.download = result.filename
        anchor.click()
      } finally {
        window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0)
      }
      setDownloadedSize(result.blob.size)
      setStage('complete')
    } catch (caught) {
      if (controller.signal.aborted) { setStage('ready'); setError('Download cancelled. The resolved track is still available.'); return }
      setStage('error')
      setError(caught instanceof Error ? caught.message : 'The audio download failed.')
    } finally {
      setProgress(null)
      if (abortRef.current === controller) abortRef.current = null
    }
  }

  const cancel = () => abortRef.current?.abort()
  const progressLabel = progress?.total ? `${Math.round(progress.loaded / progress.total * 100)}% · ${formatBytes(progress.loaded)} of ${formatBytes(progress.total)}` : progress ? `${formatBytes(progress.loaded)} received` : ''

  return <main>
    <header>
      <button className="brand" type="button" onClick={reset} aria-label="Clyvora Fetch home"><span>F</span>Clyvora <strong>Fetch</strong></button>
      <span className="experimental">Experimental</span>
    </header>

    <section className="hero" aria-labelledby="hero-title">
      <p className="eyebrow">Public links, with permission</p>
      <h1 id="hero-title">Bring public audio closer.</h1>
      <p className="hero-copy">Download audio from supported public links when you have permission to do so. Currently focused on public SoundCloud tracks.</p>

      <div className="resolver-card">
        <label htmlFor="public-url">Public track link</label>
        <div className="url-row">
          <input id="public-url" type="url" placeholder="https://soundcloud.com/artist/track" value={url} disabled={stage === 'resolving' || stage === 'downloading'} onChange={(event) => { setUrl(event.target.value); if (stage === 'error') { setStage('idle'); setError(null) } }} onKeyDown={(event) => { if (event.key === 'Enter' && url.trim()) void resolve() }} />
          {stage === 'resolving' ? <button className="cancel" type="button" onClick={cancel}>Cancel</button>
            : <button className="primary" type="button" disabled={!url.trim() || stage === 'downloading'} onClick={() => void resolve()}>Check link</button>}
        </div>
        <p className="input-help">Profiles, playlists, private links, paid previews, encrypted streams, and unsupported websites are not accepted.</p>

        {stage === 'resolving' && <div className="loading" role="status" aria-live="polite"><span aria-hidden="true" />Retrieving public track information…</div>}
        {error && <div className="error" role="alert"><strong>Couldn’t complete that request.</strong><span>{error}</span>{media && <button type="button" onClick={() => setStage('ready')}>Return to result</button>}</div>}

        {media && ['ready', 'downloading', 'complete', 'error'].includes(stage) && <article className="result-card" aria-labelledby="track-title">
          {media.artworkUrl ? <img src={media.artworkUrl} alt="" referrerPolicy="no-referrer" /> : <div className="artwork-placeholder" aria-hidden="true">♫</div>}
          <div className="track-details">
            <p>SoundCloud · {duration(media.durationSeconds)}</p>
            <h2 id="track-title">{media.title || 'Untitled track'}</h2>
            <span>{media.artist || 'Creator unavailable'}</span>
            <small>Available output: MP3 audio</small>
          </div>
          <div className="result-actions">
            {stage === 'downloading' ? <button className="cancel" type="button" onClick={cancel}>Cancel download</button>
              : <button className="primary" type="button" onClick={() => void download()}>{stage === 'complete' ? 'Download again' : 'Download MP3'}</button>}
            <button className="secondary" type="button" disabled={stage === 'downloading'} onClick={reset}>Start over</button>
          </div>
          {stage === 'downloading' && <div className="download-progress" role="status" aria-live="polite"><progress value={progress?.loaded ?? 0} max={progress?.total} />{progressLabel}</div>}
          {stage === 'complete' && <p className="success" role="status">Download started{downloadedSize !== null ? ` · ${formatBytes(downloadedSize)}` : ''}.</p>}
        </article>}
      </div>

      <aside className="legal-note">
        <strong>Before downloading</strong>
        <p>You are responsible for having permission to download and use the content. Clyvora Fetch is not affiliated with or endorsed by SoundCloud. The submitted public URL is sent to Clyvora’s resolver and the source platform; local files are never involved.</p>
      </aside>
    </section>

    <footer><p>Experimental software. Supported services can change or stop working.</p><a href="https://www.clyvora.tech/">Clyvora products</a></footer>
  </main>
}
