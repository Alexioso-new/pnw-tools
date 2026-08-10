# CastFlow v101 — Arsitektur (kontrak resmi kode baru)

Dokumen ini mendaftarkan kontrak yang diperkenalkan v101. Aturan main ada di
`04_AGENT_RULES.md`; dokumen ini adalah registry-nya.

## Adaptasi dari 02_TECH_SPEC
Tech spec mengusulkan `src/` + Vite + ES Modules. Deploy produksi CastFlow
adalah **static assets tanpa build** (keputusan Cloudflare v82), jadi modul
diimplementasikan sebagai script defer flat: `js/cf-*.js`. Kontrak (bus,
store, adapter, events, namespace storage) identik dengan spec.

## Modul
| Modul | File | Tanggung jawab |
|---|---|---|
| Kernel | `js/cf-kernel.js` | bus, store, storage adapter, flags, error handler |
| Output Health | `js/cf-health.js` | heartbeat, status output, chip, ack, reconnect |
| Preflight | `js/cf-preflight.js` | pemeriksaan pra-live + modal hasil |
| Tokens | `css/cf-tokens.css` | design tokens (satu-satunya sumber warna/spacing baru) |
| Komponen | `css/cf-v101.css` | style komponen v101 (prefix cf-, tanpa !important) |

## Event registry (format domain:entity:action)
| Event | Emitter | Payload |
|---|---|---|
| `app:init` / `app:ready` | kernel | `{version, mode}` |
| `app:error` | kernel | `{message, at, source}` |
| `program:go-live` | health (wrap broadcast) | `{sig}` |
| `output:heartbeat` | health | `{ts, sig, kind, slide, mode, v}` |
| `output:connected` / `output:stale` / `output:disconnected` | health | `{from}` |
| `output:slide-ack` | health | `{sig, at}` |
| `output:request-reconnect` | health | `{at}` |
| `diagnostics:preflight-started` / `-finished` | preflight | `{at}` / `{status, checks[], generatedAt}` |
| `media:missing-detected` | preflight | `{ids[]}` |
| `cf:output:rendered` (DOM CustomEvent) | yv-standalone | `{kind, slideIndex, sig, active}` |

## Storage key registry (namespace `castflow:v101:`)
| Key | Isi | Penulis |
|---|---|---|
| `flags` | feature flags | kernel |
| `diagnostics:lastPreflight` | hasil preflight terakhir | preflight |
| `diagnostics:probe` | probe tulis (langsung dihapus) | preflight |

Key legacy `pnw*` TIDAK dimigrasi di v101; pembacaan lama hanya lewat
`storage.legacyRead()` bila dibutuhkan. Migrasi penuh = task S3-06.

## State slices (store)
`app {version, label, mode, initialized}` ·
`connection {firebase, output {status, lastSeen, sig, kind, slide, mode}}` ·
`program {lastSentSig, lastSentAt, lastAckSig, ackAt}` ·
`diagnostics {preflight, errors[]}`

## Output reliability
- Heartbeat: output menulis tiap 2 dtk ke BroadcastChannel `castflow:v101:live`
  dan (best-effort) RTDB `pujianYouth/youthviews/heartbeat`.
- Ambang status: `connected <=5d`, `stale >5d`, `disconnected >10d`.
- ACK: sig = `kind|songId|slideIndex`. Operator mencatat sig saat broadcast
  (wrap `PNWYouthViews.broadcast`, penanda `__cfWrapped`); output menggemakan
  sig render terakhir; cocok = ACK.
- Rules v101 menambah node `heartbeat` (read/write publik tervalidasi ketat)
  supaya layar output tanpa login tetap bisa melapor.

## Exit plan legacy (strangler)
- Polling `setInterval` di `js/castflow.js`/`yv-timeline.js` tetap jalan sampai
  pemiliknya dimigrasi ke event bus per-sprint berikutnya (S4+).
- CSS lama tetap dimuat; komponen baru wajib token + tanpa `!important`.
- Jangan hapus file legacy sebelum ada task migrasi eksplisit.
