import replace from '@rollup/plugin-replace';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { defineConfig } from 'vite';
import vitePluginRaw from 'vite-plugin-raw';
import svgr from 'vite-plugin-svgr';
import commonjs from 'vite-plugin-commonjs';
import ketcherCoreTSConfig from '../packages/ketcher-core/tsconfig.json';
import ketcherReactTSConfig from '../packages/ketcher-react/tsconfig.json';
import ketcherStandaloneTSConfig from '../packages/ketcher-standalone/tsconfig.json';

const PACKAGE_DIRECTORIES = {
  'ketcher-core': resolve(__dirname, '../packages/ketcher-core'),
  'ketcher-react': resolve(__dirname, '../packages/ketcher-react'),
  'ketcher-standalone': resolve(__dirname, '../packages/ketcher-standalone'),
};

const PACKAGE_TS_CONFIGS = {
  'ketcher-core': ketcherCoreTSConfig,
  'ketcher-react': ketcherReactTSConfig,
  'ketcher-standalone': ketcherStandaloneTSConfig,
};

const PACKAGE_TS_PATHS = Object.fromEntries(
  Object.entries(PACKAGE_TS_CONFIGS).map(([packageName, tsConfig]) => {
    const paths = Object.entries(tsConfig.compilerOptions.paths || {}).map(
      ([pattern, replacements]) => ({
        find: pattern.replace(/\/\*$/, ''),
        hasWildcard: pattern.endsWith('/*'),
        replacements: replacements.map((replacement) => ({
          value: replacement.replace(/\/\*$/, ''),
          hasWildcard: replacement.endsWith('/*'),
        })),
      }),
    );

    return [packageName, paths];
  }),
);

const getImporterPackageName = (importer) => {
  return importer?.match(/packages[\\/](.*?)(?:[\\/]|$)/)?.[1];
};

const resolvePackageAlias = (source, importer) => {
  if (!importer || source.startsWith('.') || source.startsWith('\0')) {
    return null;
  }

  const packageName = getImporterPackageName(importer);

  if (!packageName) {
    return null;
  }

  const packageDirectory = PACKAGE_DIRECTORIES[packageName];

  if (source === 'src' || source.startsWith('src/')) {
    return resolve(packageDirectory, source);
  }

  const aliases = PACKAGE_TS_PATHS[packageName] || [];

  for (const alias of aliases) {
    const matches = alias.hasWildcard
      ? source.startsWith(`${alias.find}/`)
      : source === alias.find;

    if (!matches) {
      continue;
    }

    const suffix = alias.hasWildcard ? source.slice(alias.find.length + 1) : '';
    const replacement = alias.replacements[0];

    if (!replacement) {
      return null;
    }

    const replacementPath =
      replacement.hasWildcard && suffix
        ? `${replacement.value}/${suffix}`
        : replacement.value;

    return resolve(packageDirectory, replacementPath);
  }

  return null;
};

const PackageScopedAliasesPlugin = () => {
  return {
    name: 'ketcher-package-scoped-aliases',
    async resolveId(source, importer, options) {
      const updatedId = resolvePackageAlias(source, importer);

      if (!updatedId) {
        return null;
      }

      const resolved = await this.resolve(updatedId, importer, {
        skipSelf: true,
        ...options,
      });

      return resolved || { id: updatedId };
    },
  };
};

const getDefineValue = (value) => {
  return value === undefined ? 'undefined' : JSON.stringify(value);
};

const PROCESS_ENV_DEFINE_KEYS = [
  'API_PATH',
  'KETCHER_ENABLE_REDUX_LOGGER',
  'MODE',
  'NODE_ENV',
  'PUBLIC_URL',
  'REACT_APP_API_PATH',
  'SEPARATE_INDIGO_RENDER',
];

const processEnvDefines = Object.fromEntries(
  PROCESS_ENV_DEFINE_KEYS.map((key) => [
    `process.env.${key}`,
    getDefineValue(process.env[key]),
  ]),
);

export default defineConfig({
  define: {
    ...processEnvDefines,
  },
  css: {
    preprocessorOptions: {
      less: {
        paths: Object.values(PACKAGE_DIRECTORIES),
      },
    },
  },
  plugins: [
    PackageScopedAliasesPlugin(),
    react(),
    svgr({
      include: '**/*.svg',
      svgrOptions: { exportType: 'default' },
    }),
    vitePluginRaw({ match: /\.sdf|\.ket/ }),
    replace({
      include: '**/ketcher-react/src/**',
      preventAssignment: true,
      values: { require: 'await import' },
    }),
    replace({
      include: '**/ketcher-core/src/**',
      preventAssignment: true,
      values: { require: 'await import' },
    }),
    commonjs(),
  ],
  resolve: {
    alias: [
      {
        find: 'ketcher-react/dist/index.css',
        replacement: resolve(
          __dirname,
          '../packages/ketcher-react/src/index.less',
        ),
      },
      {
        find: 'ketcher-react',
        replacement: resolve(
          __dirname,
          '../packages/ketcher-react/src/index.tsx',
        ),
      },
      {
        find: 'ketcher-core',
        replacement: resolve(
          __dirname,
          '../packages/ketcher-core/src/index.ts',
        ),
      },
      {
        find: 'ketcher-standalone',
        replacement: resolve(
          __dirname,
          '../packages/ketcher-standalone/src/index.ts',
        ),
      },
      {
        find: 'web-worker:./../indigoWorker',
        replacement: './../indigoWorker?worker',
      },
      {
        find: '_indigo-ketcher-import-alias_',
        replacement: 'indigo-ketcher',
      },
    ],
  },
  build: {
    outDir: resolve(__dirname, './dist/embed'),
    cssCodeSplit: false,
    lib: {
      entry: resolve(__dirname, './src/embed.tsx'),
      formats: ['es'],
      fileName: () => 'ketcher-embed.js',
    },
    sourcemap: true,
    // single big file is expected; silence the size warning
    chunkSizeWarningLimit: 20000,
    rollupOptions: {
      output: {
        exports: 'named',
        banner:
          'var process = process || { env: {} }; var global = global || window;',
      },
      plugins: [
        {
          name: 'ketcher-embed-inject-css',
          generateBundle(_, bundle) {
            const jsKey = Object.keys(bundle).find(
              (k) => bundle[k].type === 'chunk' && k.endsWith('.js'),
            );
            const js = jsKey ? bundle[jsKey] : null;
            for (const fileName of Object.keys(bundle)) {
              const asset = bundle[fileName];
              if (asset.type === 'asset' && fileName.endsWith('.css')) {
                const css = String(asset.source);
                if (js) {
                  js.code =
                    `;(function(){var s=document.createElement('style');` +
                    `s.setAttribute('data-ketcher-embed','');` +
                    `s.textContent=${JSON.stringify(
                      css,
                    )};document.head.appendChild(s);})();\n` +
                    js.code;
                }
                delete bundle[fileName];
              }
            }
          },
        },
      ],
    },
  },
});
