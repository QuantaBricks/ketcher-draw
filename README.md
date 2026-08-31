# Ketcher Draw

A customized chemical structure editor based on [Ketcher](https://github.com/epam/ketcher) (Apache-2.0).

**Use case**: embed a chemical structure editor in any web page. The user draws, closes the panel, and you get back the SMILES — no npm packages required.

## Quick Start

### 1. Get the build

Build with:

```bash
cd example && npm run build:embed
```

Output is in `example/dist/embed/` — copy the whole directory to your static path (e.g. `/ketcher/`):

```
ketcher-embed.js          # main bundle (includes React, CSS inlined)
chunk-*.mjs               # shared ESM chunks
ucs2length-*.mjs
raphael.min-*.mjs
assets/indigoWorker-*.js  # Indigo chemistry engine (WASM Worker)
```

> The Indigo worker is referenced **relative to the bundle** (`new URL("assets/…", import.meta.url)`), so it works under any base path (e.g. `/ketcher/`). No path editing needed — just keep `assets/` next to `ketcher-embed.js`.

### 2. Deploy under a subpath

If your app is served under `/ketcher/`, put the files at:

```
public/ketcher/ketcher-embed.js
public/ketcher/chunk-*.mjs
public/ketcher/ucs2length-*.mjs
public/ketcher/raphael.min-*.mjs
public/ketcher/assets/indigoWorker-*.js
```

### 3. Use it in a page

Load via a small loader module (do not `import` the file directly from `public`):

```js
// loader.js
let readyPromise;
function load() {
  if (!readyPromise) {
    readyPromise = import(/* @vite-ignore */ '/ketcher/ketcher-embed.js').then((m) => {
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

```html
<script type="module">
  import { openKetcherEditor } from '/ketcher/ketcher-embed.js';
  // or: document.addEventListener('ketcher-ready', () => { ... });

  document.getElementById('draw').onclick = async () => {
    const smiles = await openKetcherEditor();
    console.log(smiles); // SMILES when closed, null when cancelled
  };
</script>
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

## License

Apache-2.0. Based on [epam/ketcher](https://github.com/epam/ketcher), original copyright retained.
