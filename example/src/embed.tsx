import { createRoot, type Root } from 'react-dom/client';
import { createElement } from 'react';
import { Editor } from 'ketcher-react';
import { StandaloneStructServiceProvider } from 'ketcher-standalone';
import type { Ketcher } from 'ketcher-core';

import 'ketcher-react/dist/index.css';

export interface KetcherEmbedApi {
  /** Get the current structure as SMILES */
  getSmiles: (extended?: boolean) => Promise<string>;
  /** Get the current structure as MOL */
  getMolfile: () => Promise<string>;
  /** Load a structure from SMILES */
  setSmiles: (smiles: string) => Promise<void>;
  /** Access the underlying Ketcher instance */
  getKetcher: () => Ketcher;
  /** Remove the editor from the DOM */
  destroy: () => void;
}

export interface KetcherEmbedOptions {
  /** Called with the SMILES every time the structure changes */
  onChange?: (smiles: string) => void;
  /** Base URL for static resources (optional, standalone usually does not need it) */
  staticResourcesUrl?: string;
  /** Extra buttons config to hide/show */
  buttons?: string[];
  /** Initial structure loaded as SMILES */
  smiles?: string;
}

export interface KetcherDialogOptions extends KetcherEmbedOptions {
  /** Label of the confirm button */
  okLabel?: string;
  /** Label of the cancel button */
  cancelLabel?: string;
  /** Called with the SMILES while drawing inside the dialog */
  onChange?: (smiles: string) => void;
}

function mountEditor(
  container: HTMLElement,
  options: KetcherEmbedOptions,
  onInit: (ketcher: Ketcher, root: Root) => void,
): Promise<KetcherEmbedApi> {
  const { onChange, staticResourcesUrl = '', buttons = [], smiles } = options;
  const root: Root = createRoot(container);
  const structServiceProvider = new StandaloneStructServiceProvider();

  return new Promise<KetcherEmbedApi>((resolve, reject) => {
    root.render(
      createElement(Editor, {
        staticResourcesUrl,
        buttons,
        structServiceProvider,
        errorHandler: (message: string | Error) =>
          reject(new Error(String(message))),
        onInit: (ketcher: Ketcher) => {
          const api: KetcherEmbedApi = {
            getSmiles: (extended = false) => ketcher.getSmiles(extended),
            getMolfile: () => ketcher.getMolfile(),
            setSmiles: (s: string) => ketcher.setMolecule(s),
            getKetcher: () => ketcher,
            destroy: () => root.unmount(),
          };

          if (typeof onChange === 'function') {
            ketcher.changeEvent.add(() => {
              ketcher
                .getSmiles()
                .then(onChange)
                .catch(() => {
                  /* ignore transient errors while editing */
                });
            });
          }

          onInit(ketcher, root);

          if (smiles) {
            ketcher.setMolecule(smiles).catch(() => {
              /* ignore if the provided smiles is invalid */
            });
          }

          resolve(api);
        },
      }),
    );
  });
}

export async function createKetcherEmbed(
  container: HTMLElement,
  options: KetcherEmbedOptions = {},
): Promise<KetcherEmbedApi> {
  return mountEditor(container, options, () => {});
}

/**
 * Opens a modal editor dialog. Resolves with the SMILES when the dialog is
 * closed (either via the confirm button or the close button). Cancelling
 * resolves with `null`.
 */
export function openKetcherEditor(
  options: KetcherDialogOptions = {},
): Promise<string | null> {
  const {
    okLabel = 'OK',
    cancelLabel = 'Cancel',
    onChange,
    ...embedOptions
  } = options;

  return new Promise<string | null>((resolve) => {
    const overlay = document.createElement('div');
    overlay.style.cssText =
      'position:fixed;inset:0;background:rgba(0,0,0,0.45);' +
      'z-index:99999;display:flex;align-items:center;justify-content:center;';

    const dialog = document.createElement('div');
    dialog.style.cssText =
      'background:#fff;border-radius:8px;box-shadow:0 8px 40px rgba(0,0,0,.3);' +
      'width:min(920px, 94vw);height:min(640px, 90vh);display:flex;flex-direction:column;overflow:hidden;';

    const header = document.createElement('div');
    header.style.cssText =
      'display:flex;align-items:center;justify-content:space-between;' +
      'padding:10px 16px;border-bottom:1px solid #e2e2e2;font-family:system-ui;';

    const title = document.createElement('span');
    title.textContent = 'Structure Editor';
    title.style.cssText = 'font-weight:600;color:#333;';

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '\u2715';
    closeBtn.title = 'Close';
    closeBtn.style.cssText =
      'border:none;background:#f2f2f2;font-size:16px;line-height:1;width:30px;height:30px;' +
      'border-radius:50%;cursor:pointer;color:#333;display:flex;align-items:center;' +
      'justify-content:center;flex:0 0 auto;';
    closeBtn.addEventListener('mouseenter', () => {
      closeBtn.style.background = '#e2e2e2';
    });
    closeBtn.addEventListener('mouseleave', () => {
      closeBtn.style.background = '#f2f2f2';
    });
    closeBtn.addEventListener('click', () => {
      const ketcher = (
        overlay as HTMLElement & {
          __ketcher?: Ketcher;
        }
      ).__ketcher;
      const smiles = ketcher ? ketcher.getSmiles().catch(() => null) : null;
      close(smiles, null);
    });

    header.appendChild(title);
    header.appendChild(closeBtn);

    const body = document.createElement('div');
    body.style.cssText = 'flex:1;min-height:0;position:relative;';

    const footer = document.createElement('div');
    footer.style.cssText =
      'display:flex;justify-content:flex-end;gap:10px;padding:10px 16px;' +
      'border-top:1px solid #e2e2e2;';

    const cancelButton = document.createElement('button');
    cancelButton.textContent = cancelLabel;
    cancelButton.style.cssText =
      'padding:7px 16px;border:1px solid #ccc;border-radius:6px;background:#fff;cursor:pointer;font-size:14px;';
    cancelButton.addEventListener('click', () => close(null, null));

    const okButton = document.createElement('button');
    okButton.textContent = okLabel;
    okButton.style.cssText =
      'padding:7px 18px;border:none;border-radius:6px;background:#1677ff;color:#fff;cursor:pointer;font-size:14px;';
    okButton.addEventListener('click', () => {
      const ketcher = (
        overlay as HTMLElement & {
          __ketcher?: Ketcher;
        }
      ).__ketcher;
      const smiles = ketcher ? ketcher.getSmiles().catch(() => null) : null;
      close(smiles, null);
    });

    footer.appendChild(cancelButton);
    footer.appendChild(okButton);

    dialog.appendChild(header);
    dialog.appendChild(body);
    dialog.appendChild(footer);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    const finish = (promise: Promise<string | null>) => {
      promise
        .then((smiles) => {
          overlay.remove();
          resolve(smiles);
        })
        .catch(() => {
          overlay.remove();
          resolve(null);
        });
    };

    const close = (
      smilesPromise: Promise<string | null> | null,
      _result: unknown,
    ) => {
      if (smilesPromise) {
        finish(smilesPromise);
      } else {
        overlay.remove();
        resolve(null);
      }
    };

    mountEditor(body, embedOptions, (ketcher) => {
      (overlay as HTMLElement & { __ketcher?: Ketcher }).__ketcher = ketcher;
    });
  });
}
