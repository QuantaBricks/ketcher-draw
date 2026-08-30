# Ketcher Draw

A customized chemical structure editor based on [Ketcher](https://github.com/epam/ketcher) (Apache-2.0).

**Use case**: embed a chemical structure editor in any web page. The user draws, closes the panel, and you get back the SMILES — no npm packages required.

## Quick Start

### 1. Get the build

The build output is 2 files in `example/dist/embed/`:

```
ketcher-embed.js          # main bundle (includes React, CSS inlined)
assets/indigoWorker-*.js  # Indigo chemistry engine (WASM Worker)
```

Copy these into your front-end static directory (or a CDN), **keeping the `assets/` relative path unchanged**.

> To rebuild: `cd example && npm run build:embed`

### 2. Use it in a page

```html
<button id="draw">Draw</button>

<script type="module">
  import { openKetcherEditor } from './ketcher-embed.js';

  document.getElementById('draw').onclick = async () => {
    const smiles = await openKetcherEditor();
    console.log(smiles); // SMILES when closed, null when cancelled
  };
</script>
```

### 3. API

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
| `api.getKetcher()` | Access the underlying Ketcher instance |
| `api.destroy()` | Unmount the editor |

### Notes

- Requires a browser with ES Module support (all modern browsers).
- The first time the editor opens, it loads the ~15 MB Indigo engine, so there is a brief wait.
- Invalid SMILES is ignored without throwing.

## License

Apache-2.0. Based on [epam/ketcher](https://github.com/epam/ketcher), original copyright retained.
