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
├── ketcher-embed.d.ts        # TypeScript declarations
└── LICENSE / NOTICE
```

### 2. Try the demo

The folder is pure static files — serve it over HTTP and open `embed-usage.html`:

```bash
cd ketcher-embed
npx serve .          # or: python -m http.server
```

Then open the URL it prints, e.g. **http://localhost:3000/embed-usage.html**.

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

Everything (chunks, Indigo worker) is resolved **relative to `ketcher-embed.js`** (`new URL("…", import.meta.url)`), so the folder works under any base path (e.g. `/ketcher-embed/`, `/static/kdraw/`). No path editing needed — just keep the folder contents together. The import path in your page must match where the folder is served: in the example above the folder sits at `<server-root>/ketcher-embed/`. (In the step-2 demo the server root *is* the folder itself, which is why `embed-usage.html` imports `./ketcher-embed.js`.)

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

Embeds the editor into a container element on your page (non-modal). All getters/setters are asynchronous:

| Method | Description |
|--------|-------------|
| `await api.getSmiles()` | Get the current structure as SMILES |
| `await api.setSmiles('CCO')` | Load a structure from SMILES |
| `await api.getMolfile()` | Get the current structure as MOL |
| `api.getKetcher()` | Access the underlying Ketcher instance |
| `api.destroy()` | Unmount the editor (call when the modal/panel is closed) |

### 5. TypeScript & framework integration (React example)

The zip ships **`ketcher-embed.d.ts`**. Copy it into your source tree, then load the bundle at runtime so your bundler leaves it out of your bundle:

```ts
// ketcher-loader.ts
import type * as KetcherEmbed from './ketcher-embed';
import type { KetcherEmbedApi } from './ketcher-embed';

const url = '/ketcher-embed/ketcher-embed.js'; // wherever you copied the folder
let ready: Promise<typeof KetcherEmbed> | undefined;

export function loadKetcherEmbed() {
  ready ??= import(/* @vite-ignore */ url).then((m) => m as typeof KetcherEmbed);
  return ready;
}
export type { KetcherEmbedApi };
```

```tsx
// Modal editor from a button
const onClick = async () => {
  const mod = await loadKetcherEmbed();
  const smiles = await mod.openKetcherEditor({ smiles: 'CCO' });
  if (smiles !== null) save(smiles);
};

// Inline editor inside a component (mount/destroy with the lifecycle)
useEffect(() => {
  let api: KetcherEmbedApi | null = null;
  let cancelled = false;
  loadKetcherEmbed().then((m) => {
    if (cancelled || !hostRef.current) return;
    m.createKetcherEmbed(hostRef.current, { onChange: setSmiles }).then((a) => {
      api = a;
    });
  });
  return () => {
    cancelled = true;
    api?.destroy();
  };
}, []);
```

The same loader pattern works in Vue/Svelte/Angular: keep the folder as a static asset, and tie `createKetcherEmbed`/`destroy` to your framework's mount/unmount hooks. Verified with Vite 7 + React 19 + TypeScript (strict): the app bundle stays ~220 kB because `ketcher-embed.js` is never processed by the bundler.

### Notes

- Requires a browser with ES Module support (all modern browsers).
- The first time the editor opens, it loads the ~15 MB Indigo engine, so there is a brief wait.
- Invalid SMILES is ignored without throwing.
- Closing with **OK** or **✕** resolves with the current SMILES (empty string if the canvas is empty); only the **Cancel** button resolves with `null`.
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
