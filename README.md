# Ketcher Draw

A customized chemical structure editor based on [Ketcher](https://github.com/epam/ketcher) (Apache-2.0).

**Use case**: embed a chemical structure editor in any web page. The user draws, closes the panel, and you get back the SMILES — no npm install, no build step, no backend.

## Quick Start

### 1. Download the zip

Get **[`ketcher-embed.zip`](https://github.com/QuantaBricks/ketcher-draw/releases/latest/download/ketcher-embed.zip)** from the [latest release](https://github.com/QuantaBricks/ketcher-draw/releases/latest) and unzip it. You get one self-contained folder:

```
ketcher-embed/
├── ketcher-embed.js          # entry point (React + CSS inlined)
├── chunk-*.mjs               # shared ESM chunks
├── ucs2length-*.mjs
├── raphael.min-*.mjs
├── assets/indigoWorker-*.js  # Indigo chemistry engine (WASM inlined)
├── embed-usage.html          # minimal working demo
└── LICENSE / NOTICE
```

### 2. Try the demo

The folder is pure static files — serve it over HTTP and open `embed-usage.html`:

```bash
cd ketcher-embed
npx serve .          # or: python -m http.server
```

> Opening it via `file://` will **not** work: browsers block ES modules and web workers on the `file:` protocol. Any static HTTP server is fine.

### 3. Use it in your page

Copy the folder into your static assets (e.g. `public/ketcher-embed/`) and import the entry point:

```html
<script type="module">
  import { openKetcherEditor } from '/ketcher-embed/ketcher-embed.js';

  document.getElementById('draw').onclick = async () => {
    const smiles = await openKetcherEditor();
    console.log(smiles); // SMILES when closed, null when cancelled
  };
</script>
```

Everything (chunks, Indigo worker) is resolved **relative to `ketcher-embed.js`** (`new URL("…", import.meta.url)`), so the folder works under any base path (e.g. `/ketcher-embed/`, `/static/kdraw/`). No path editing needed — just keep the folder contents together.

If your bundler (Vite/webpack) would try to process the import at build time, load it at runtime instead so the file is served as-is:

```js
// loader.js
let readyPromise;
function load() {
  if (!readyPromise) {
    readyPromise = import(/* @vite-ignore */ '/ketcher-embed/ketcher-embed.js').then((m) => {
      // API is ready
      document.dispatchEvent(new CustomEvent('ketcher-ready', { detail: m }));
      return m;
    });
  }
  return readyPromise;
}

export async function getKetcherApi() {
  const m = await load();
  return m; // { openKetcherEditor, createKetcherEmbed }
}
```

### 4. API

#### `openKetcherEditor(options?) → Promise<string | null>`

Opens a modal editor. Resolves with the current structure SMILES when closed (returns `null` on cancel).

| Option | Type | Description |
|--------|------|-------------|
| `smiles` | `string` | Preload a structure (SMILES) when opening |
| `onChange` | `(smiles: string) => void` | Called on every structure change inside the editor |
| `okLabel` / `cancelLabel` | `string` | Button labels, default `OK` / `Cancel` |

```js
const smiles = await openKetcherEditor({
  smiles: 'CCO',                    // preload ethanol
  onChange: (s) => console.log('drawing:', s),
});
```

#### `createKetcherEmbed(container, options?) → Promise<api>`

Embeds the editor into a container element on your page (non-modal).

| Method | Description |
|--------|-------------|
| `api.getSmiles()` | Get the current structure as SMILES |
| `api.setSmiles('CCO')` | Load a structure from SMILES |
| `api.getMolfile()` | Get the current structure as MOL (via `getKetcher().getMolfile()`) |
| `api.getKetcher()` | Access the underlying Ketcher instance |
| `api.destroy()` | Unmount the editor (call when the modal/panel is closed) |

### Notes

- Requires a browser with ES Module support (all modern browsers).
- The first time the editor opens, it loads the ~15 MB Indigo engine, so there is a brief wait.
- Invalid SMILES is ignored without throwing.
- Only `openKetcherEditor` / `createKetcherEmbed` are the public API; do not depend on internal exports.

## Build from source

The release zip is built automatically by CI (`.github/workflows/release-embed.yml`) whenever a version tag (`v*`) is pushed. To build it locally:

```bash
npm install                    # at the repo root (npm workspaces monorepo)
npm run build:embed -w example
```

Output is in `example/dist/embed/` — the same runtime files as in the zip (the zip adds `embed-usage.html` and drops source maps).

## License

Apache-2.0. Based on [epam/ketcher](https://github.com/epam/ketcher), original copyright retained.
