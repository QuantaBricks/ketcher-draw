/**
 * Type declarations for the Ketcher embed bundle (`ketcher-embed.js`).
 *
 * Copy this file next to your loader and import the types from it, e.g.:
 *
 *   import type { KetcherEmbedApi, KetcherDialogOptions } from './ketcher-embed';
 *
 *   const url = '/ketcher-embed/ketcher-embed.js';
 *   const mod = (await import(/* @vite-ignore *\/ url)) as typeof import('./ketcher-embed');
 *   const smiles = await mod.openKetcherEditor({ smiles: 'CCO' });
 */

/** Handle to an editor embedded in your page via `createKetcherEmbed`. */
export interface KetcherEmbedApi {
  /** Get the current structure as SMILES */
  getSmiles(extended?: boolean): Promise<string>;
  /** Get the current structure as MOL file text */
  getMolfile(): Promise<string>;
  /** Load a structure from SMILES (invalid SMILES is ignored) */
  setSmiles(smiles: string): Promise<void>;
  /** Access the underlying Ketcher instance (untyped here on purpose) */
  getKetcher(): unknown;
  /** Unmount the editor (call when the panel/modal is closed) */
  destroy(): void;
}

export interface KetcherEmbedOptions {
  /** Called with the SMILES every time the structure changes */
  onChange?: (smiles: string) => void;
  /** Base URL for static resources (standalone mode usually does not need it) */
  staticResourcesUrl?: string;
  /** Extra buttons config to hide/show */
  buttons?: string[];
  /** Initial structure loaded as SMILES */
  smiles?: string;
}

export interface KetcherDialogOptions extends KetcherEmbedOptions {
  /** Label of the confirm button (default `OK`) */
  okLabel?: string;
  /** Label of the cancel button (default `Cancel`) */
  cancelLabel?: string;
}

/** Embeds the editor into `container` (non-modal). */
export declare function createKetcherEmbed(
  container: HTMLElement,
  options?: KetcherEmbedOptions,
): Promise<KetcherEmbedApi>;

/**
 * Opens a modal editor. Resolves with the structure SMILES when closed,
 * or `null` when cancelled.
 */
export declare function openKetcherEditor(
  options?: KetcherDialogOptions,
): Promise<string | null>;
