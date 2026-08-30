# Ketcher Draw

基于 [Ketcher](https://github.com/epam/ketcher) 定制的化学结构编辑器（Apache-2.0）。

**用途**：在任意网页里弹出一个化学结构画板，用户画完/关闭画板后返回 SMILES，无需安装任何 npm 包。

## 快速开始

### 1. 获取产物

构建产物是 2 个文件，位于 `example/dist/embed/`：

```
ketcher-embed.js          # 主包（含 React，CSS 已内联）
assets/indigoWorker-*.js  # Indigo 化学引擎（WASM Worker）
```

把这两个文件放到前端项目的静态目录（或 CDN），**保持 `assets/` 相对路径不变**。

> 需要重新构建时：`cd example && npm run build:embed`

### 2. 页面里使用

```html
<button id="draw">Draw</button>

<script type="module">
  import { openKetcherEditor } from './ketcher-embed.js';

  document.getElementById('draw').onclick = async () => {
    const smiles = await openKetcherEditor();
    console.log(smiles); // 关闭画板后返回 SMILES，取消则返回 null
  };
</script>
```

### 3. API

#### `openKetcherEditor(options?) → Promise<string | null>`

弹出一个模态画板，关闭时 resolve 当前结构 SMILES（点取消返回 `null`）。

| 参数 | 类型 | 说明 |
|------|------|------|
| `smiles` | `string` | 打开时预载入的结构（SMILES） |
| `onChange` | `(smiles: string) => void` | 画板内每次结构变化时回调 |
| `okLabel` / `cancelLabel` | `string` | 按钮文字，默认 `OK` / `Cancel` |

```js
const smiles = await openKetcherEditor({
  smiles: 'CCO',                       // 预载入乙醇
  onChange: (s) => console.log('绘制中:', s),
});
```

#### `createKetcherEmbed(container, options?) → Promise<api>`

把画板嵌入到页面指定容器（非弹窗）。

| 方法 | 说明 |
|------|------|
| `api.getSmiles()` | 获取当前结构 SMILES |
| `api.setSmiles('CCO')` | 从 SMILES 载入结构 |
| `api.getKetcher()` | 底层 Ketcher 实例 |
| `api.destroy()` | 卸载编辑器 |

### 注意事项

- 浏览器需支持 ES Module（现代浏览器均支持）。
- 首次打开画板会加载约 15MB 的 Indigo 化学引擎，会有短暂等待。
- 非法 SMILES 会被忽略，不报错。

## License

Apache-2.0。基于 [epam/ketcher](https://github.com/epam/ketcher) 修改，保留原版权声明。
