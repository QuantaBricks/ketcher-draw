/****************************************************************************
 * Copyright 2021 EPAM Systems
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 ***************************************************************************/

import {
  SERVER_OPTIONS,
  getDefaultOptions,
  validation,
} from '../../data/schema/options-schema';
import {
  KETCHER_SAVED_OPTIONS_KEY,
  KetcherLogger,
  ketcherProvider,
  normalizeSettingsForCore,
  normalizeSettingsForForm,
} from 'ketcher-core';

import { pick } from 'lodash/fp';
import { storage } from '../../storage-ext';
import { reinitializeTemplateLibrary } from '../templates/init-lib';
import { APP_OPTIONS_ACTION } from './actions';

export const initOptionsState = {
  app: {
    server: false,
    templates: false,
    functionalGroups: false,
    saltsAndSolvents: false,
  },
  check: {
    checkOptions: [
      'valence',
      'radicals',
      'isotopes',
      'pseudoatoms',
      'stereo',
      'query',
      'overlapping_atoms',
      'overlapping_bonds',
      'rgroups',
      'chiral',
      '3d',
      'chiral_flag',
    ],
  },
  settings: Object.assign(
    getDefaultOptions(),
    validation(storage.getItem(KETCHER_SAVED_OPTIONS_KEY)),
  ),
  getSettings() {
    this.settings = Object.assign(
      getDefaultOptions(),
      validation(storage.getItem(KETCHER_SAVED_OPTIONS_KEY)),
    );
  },
  getServerSettings() {
    const seriliazedServerOptions = getSerilizedServerOptions(this.settings);
    const defaultServerOptions = pick(SERVER_OPTIONS, this.settings);

    return {
      ...defaultServerOptions,
      ...seriliazedServerOptions,
    };
  },
};

function getSerilizedServerOptions(options) {
  let renderStereoStyle;
  if (!options.showStereoFlags) {
    renderStereoStyle = 'none';
  } else if (options.ignoreChiralFlag) {
    renderStereoStyle = 'ext';
  } else {
    renderStereoStyle = 'old';
  }

  let newOptions = {
    'render-coloring': options.atomColoring,
    'render-font-size': options.fontsz,
    'render-font-size-unit': options.fontszUnit,
    'render-font-size-sub': options.fontszsub,
    'render-font-size-sub-unit': options.fontszsubUnit,
    'image-resolution': Number(options.imageResolution),
    'bond-length': options.bondLength,
    'bond-length-unit': options.bondLengthUnit,
    'render-bond-thickness': options.bondThickness,
    'render-bond-thickness-unit': options.bondThicknessUnit,
    'render-bond-spacing': options.bondSpacing / 100,
    'render-stereo-bond-width': options.stereoBondWidth,
    'render-stereo-bond-width-unit': options.stereoBondWidthUnit,
    'render-hash-spacing': options.hashSpacing,
    'render-hash-spacing-unit': options.hashSpacingUnit,
    'reaction-component-margin-size': options.reactionComponentMarginSize,
    'reaction-component-margin-size-unit':
      options.reactionComponentMarginSizeUnit,
    'render-stereo-style': renderStereoStyle,
  };

  if (options.imageResolution === '600') {
    newOptions = {
      ...newOptions,
      // TODO: change to the values from settings once they are implemented
      'render-output-sheet-width': 11,
      'render-output-sheet-height': 8.5,
    };
  }

  return newOptions;
}

export function appUpdate(data) {
  return (dispatch) => {
    dispatch({ type: 'APP_OPTIONS', data });
    dispatch({ type: 'UPDATE' });
  };
}

/* SETTINGS */
export function saveSettings(newSettings, ketcherId) {
  return async (dispatch) => {
    // Try to update via ketcher-core settings service if available
    // Use window.ketcher since Redux state doesn't store the Ketcher instance
    const settingsService =
      ketcherProvider.getKetcher(ketcherId)?.settingsService;

    if (settingsService) {
      try {
        // Transform settings to match SettingsService schema
        const transformedSettings = normalizeSettingsForCore(newSettings);

        // Direct update - both Core and Redux use flat format now
        await settingsService.updateSettings(transformedSettings);
        // Core service handles localStorage and emits events
        // The event will trigger syncSettingsFromCore via useSettings hook
      } catch (error) {
        KetcherLogger.error(
          'Failed to update settings via core service:',
          error,
        );
        // Fall back to direct localStorage write
        storage.setItem(KETCHER_SAVED_OPTIONS_KEY, newSettings);
      }
    } else {
      // No core service available, use legacy localStorage
      storage.setItem(KETCHER_SAVED_OPTIONS_KEY, newSettings);
    }

    // Reinitialize template library and update init state
    reinitializeTemplateLibrary();
    initOptionsState.getSettings();

    // Dispatch Redux action for backward compatibility
    dispatch({
      type: 'SAVE_SETTINGS',
      data: newSettings,
    });
  };
}

/**
 * Sync settings from ketcher-core SettingsService to Redux
 * Used for backward compatibility - Redux becomes a passive consumer
 * @param {Settings} coreSettings - Settings from ketcher-core in flat format
 */
export function syncSettingsFromCore(coreSettings) {
  // Transform from SettingsService format to Redux format
  const normalizedSettings = normalizeSettingsForForm(coreSettings, {
    removeCoreOnlyFields: true,
  });
  const reduxSettings = pick(
    Object.keys(getDefaultOptions()),
    normalizedSettings,
  );

  return {
    type: 'SYNC_SETTINGS_FROM_CORE',
    data: reduxSettings,
  };
}

/* CHECK */
export function checkOpts(data) {
  return {
    type: 'SAVE_CHECK_OPTS',
    data,
  };
}

/* REDUCER */
function optionsReducer(state = {}, action) {
  const { type, data } = action;
  if (type === APP_OPTIONS_ACTION)
    return { ...state, app: { ...state.app, ...data } };

  if (type === 'SAVE_SETTINGS') {
    return { ...state, settings: { ...state.settings, ...data } };
  }

  if (type === 'SYNC_SETTINGS_FROM_CORE') {
    return { ...state, settings: { ...state.settings, ...data } };
  }

  if (type === 'SAVE_CHECK_OPTS') return { ...state, check: data };
  return state;
}

export default optionsReducer;
