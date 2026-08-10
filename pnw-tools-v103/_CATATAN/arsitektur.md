# CastFlow v101+ — Arsitektur (kontrak resmi kode baru)

Dokumen ini mendaftarkan kontrak yang diperkenalkan v101–v103. Aturan main ada di
`04_AGENT_RULES.md`; dokumen ini adalah registry-nya.

## Adaptasi dari 02_TECH_SPEC
Tech spec mengusulkan `src/` + Vite + ES Modules. Deploy produksi CastFlow
adalah **static assets tanpa build** (keputusan Cloudflare v82), jadi modul
diimplementasikan sebagai script defer flat: `js/cf-*.js`. Kontrak (bus,
store, adapter, events, namespace storage) identik dengan spec.

## Modul
| Modul | File | Tanggung jawab |
|---|---|---|
| Kernel | `js/cf-kernel.js` | bus, store, storage adapter + migrasi, flags, error handler |
| Output Health | `js/cf-health.js` | heartbeat, status output, chip, ack, reconnect |
| Preflight | `js/cf-preflight.js` | pemeriksaan pra-live + modal hasil |
| Media | `js/cf-media.js` | resolver aset (idb:/http), missing asset checker |
| Package | `js/cf-package.js` | schema project, export, import, validasi |
| Toast | `js/cf-toast.js` | notifikasi terpusat (antrian, auto-dismiss, ARIA) |
| Workspace | `js/cf-workspace.js` | panel registry, preset layout, snapshot, reset |
| Diagnostics | `js/cf-diag.js` | panel status sistem (baca dari store) |
| Tokens | `css/cf-tokens.css` | design tokens (satu-satunya sumber warna/spacing baru) |
| Komponen | `css/cf-v101.css`, `css/cf-v103.css` | style komponen (prefix cf-, tanpa !important) |

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
| `media:missing-detected` | media / preflight | `{ids[]}` |
| `media:resolved` | media | `{ref}` |
| `project:exported` | package | `{name, items, media}` |
| `project:imported` | package | `{name, items, missing}` |
| `project:import-failed` | package | `{reason}` |
| `workspace:layout-changed` | workspace | `{preset, grid}` |
| `workspace:layout-saved` | workspace | `{grid, at}` |
| `workspace:layout-reset` | workspace | `{}` |
| `cf:output:rendered` (DOM CustomEvent) | yv-standalone | `{kind, slideIndex, sig, active}` |

## Storage key registry
Namespace skema: **`castflow:v101:`** — mengikuti SKEMA, bukan nomor rilis;
JANGAN diganti per rilis. Key baru:
| Key | Isi | Penulis |
|---|---|---|
| `flags` | feature flags | kernel |
| `diagnostics:lastPreflight` | hasil preflight terakhir | preflight |
| `diagnostics:probe` | probe tulis (langsung dihapus) | preflight |
| `media:missing` | daftar ref media hilang | media |
| `project:lastExport` | meta ekspor terakhir | package |
| `workspace:layout` | preset/snapshot layout aktif | workspace |

### Migrasi legacy (S3-06)
`storage.MIGRATIONS` memetakan key baru -> key legacy `pnw*`. Aturan:
`migratedGet()` membaca key baru dulu; bila kosong, baca legacy LALU salin
ke key baru (write-through). Key legacy TIDAK pernah dihapus — rollback aman.
`legacyWrite()` hanya untuk interop transisi (mis. visual style v100, grid
layout v94 `{l, r, t}`).

## State slices (store)
`app {version, label, mode, initialized}` ·
`connection {firebase, output {status, lastSeen, sig, kind, slide, mode}}` ·
`program {lastSentSig, lastSentAt, lastAckSig, ackAt}` ·
`diagnostics {preflight, errors[]}` ·
`workspace {preset, snapshotAt}`

## Output reliability (v101)
- Heartbeat: output menulis tiap 2 dtk ke BroadcastChannel `castflow:v101:live`
  dan (best-effort) RTDB `pujianYouth/youthviews/heartbeat`.
- Ambang status: `connected <=5d`, `stale >5d`, `disconnected >10d`.
- ACK: sig = `kind|songId|slideIndex`; operator membungkus
  `PNWYouthViews.broadcast` (`__cfWrapped`); output menggemakan sig render.

## Project package (v102, schemaVersion 1)
```
{ format:"castflow-project", schemaVersion:1, name, exportedAt,
  app:{release,label}, rundown:[...], settings:{...}, visual:{...}|null,
  mediaRefs:[{ref}] }
```
- Validasi impor: format cocok, schemaVersion <= 1, rundown array. File salah
  DITOLAK tanpa menyentuh state; event `project:import-failed` dipancarkan.
- Rundown diterapkan lewat kontrak `PNWYouthViews.__tl.setPlan` (v102).
- Visual style diterapkan lewat `legacyWrite` + `CastFlowV100.applyVisualPreview`.
- Media refs dipindai `K.media.scanRefs`; yang hilang dilaporkan.

## Toast & Diagnostics (v103)
- `K.toast.show(msg, kind, ms)` — kind: success|warn|error|info; antrian
  maksimal 3; auto-dismiss (error 6 dtk, lainnya 3,5 dtk); klik = tutup.
  `projector.js notify()` mendelegasikan ke sini (jembatan S4-05) — call site
  lama tidak diubah.
- `K.diag.open()` — panel diagnostics; berlangganan store saat terbuka,
  unsubscribe saat tutup (tidak ada kebocoran listener).
- `K.workspace.applyPreset(id)` menulis format grid legacy `{l, r, t}` lewat
  `legacyWrite` lalu reload — tidak mengarang format baru.

## Exit plan legacy (strangler)
- Polling `setInterval` di `js/castflow.js`/`yv-timeline.js` tetap jalan sampai
  pemiliknya dimigrasi ke event bus per-sprint berikutnya.
- CSS lama tetap dimuat; komponen baru wajib token + tanpa `!important`.
- Jangan hapus file legacy sebelum ada task migrasi eksplisit.
