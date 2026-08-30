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
  findStereoAtoms,
  MULTITAIL_ARROW_TOOL_NAME,
  CREATE_MONOMER_TOOL_NAME,
} from 'ketcher-core';

import { bond as bondSchema } from '../data/schema/struct-schema';
import isHidden from './isHidden';
import { toBondType } from '../data/convert/structconv';
import { isFlipDisabled } from './flips';
import { MONOMER_WIZARD_DISALLOWED_BOND_TYPES } from '../views/components/ContextMenu/utils';
import type { UiAction } from './action.types';

type ToolActionEntry = Omit<UiAction, 'action'> & {
  action?: UiAction['action'];
};

const toolActions: Record<string, ToolActionEntry> = {
  hand: {
    title: 'Hand tool',
    enabledInViewOnly: true,
    shortcut: 'Mod+Alt+h',
    action: { tool: 'hand' },
    hidden: (options) => isHidden(options, 'hand'),
  },
  'select-rectangle': {
    title: 'Rectangle Selection',
    enabledInViewOnly: true,
    shortcut: ['Shift+Tab', 'Escape'],
    action: { tool: 'select', opts: 'rectangle' },
    hidden: (options) => isHidden(options, 'select-rectangle'),
  },
  'select-lasso': {
    title: 'Lasso Selection',
    enabledInViewOnly: true,
    shortcut: ['Shift+Tab', 'Escape'],
    action: { tool: 'select', opts: 'lasso' },
  },
  'select-structure': {
    title: 'Structure Selection',
    shortcut: ['Shift+Tab', 'Escape'],
    action: { tool: 'select', opts: 'fragment' },
    hidden: (options) => isHidden(options, 'select-structure'),
  },
  'select-fragment': {
    title: 'Fragment Selection',
    shortcut: ['Shift+Tab', 'Escape'],
    action: { tool: 'fragmentSelection' },
    hidden: (options) => isHidden(options, 'select-fragment'),
  },
  erase: {
    title: 'Erase',
    shortcut: ['Delete', 'Backspace'],
    action: { tool: 'eraser', opts: 1 }, // TODO last selector mode is better
    hidden: (options) => isHidden(options, 'erase'),
  },
  chain: {
    title: 'Chain',
    action: { tool: 'chain' },
    hidden: (options) => isHidden(options, 'chain'),
  },
  'enhanced-stereo': {
    shortcut: 'Alt+e',
    title: 'Stereochemistry',
    action: { tool: 'enhancedStereo' },
    disabled: (editor) => {
      if (editor.isMonomerCreationWizardActive) {
        return true;
      }
      const struct = editor?.struct?.();
      const atomIds =
        editor?.selection?.()?.atoms ?? Array.from(struct.atoms.keys());
      return findStereoAtoms(struct, atomIds).length === 0;
    },
    hidden: (options) => isHidden(options, 'enhanced-stereo'),
  },
  'charge-plus': {
    shortcut: ['Equal', 'Shift+Equal', 'NumpadAdd'],
    title: 'Charge Plus',
    action: { tool: 'charge', opts: 1 },
    hidden: (options) => isHidden(options, 'charge-plus'),
  },
  'charge-minus': {
    shortcut: ['Minus', 'NumpadSubtract'],
    title: 'Charge Minus',
    action: { tool: 'charge', opts: -1 },
    hidden: (options) => isHidden(options, 'charge-minus'),
  },
  radical: {
    shortcut: 'r',
    title: 'Add Radical',
    action: { tool: 'radical' },
    hidden: (options) => isHidden(options, 'radical'),
  },
  'transform-rotate': {
    title: 'Rotate Tool',
    action: { tool: 'rotate' },
    hidden: (options) => isHidden(options, 'transform-rotate'),
  },
  'transform-flip-h': {
    shortcut: 'Alt+h',
    title: 'Horizontal Flip',
    action: { tool: 'rotate', opts: 'horizontal' },
    disabled: isFlipDisabled,
    hidden: (options) => isHidden(options, 'transform-flip-h'),
  },
  'transform-flip-v': {
    shortcut: 'Alt+v',
    title: 'Vertical Flip',
    action: { tool: 'rotate', opts: 'vertical' },
    disabled: isFlipDisabled,
    hidden: (options) => isHidden(options, 'transform-flip-v'),
  },
  sgroup: {
    shortcut: 'Mod+g',
    title: 'S-Group',
    action: { tool: 'sgroup' },
    disabled: (editor) => editor.isMonomerCreationWizardActive,
    hidden: (options) => isHidden(options, 'sgroup'),
  },
  arrows: {
    disabled: (editor) => editor.isMonomerCreationWizardActive,
    hidden: (options) => isHidden(options, 'arrows'),
  },
  [MULTITAIL_ARROW_TOOL_NAME]: {
    title: 'Multi-Tailed Arrow Tool',
    action: {
      tool: MULTITAIL_ARROW_TOOL_NAME,
      opts: MULTITAIL_ARROW_TOOL_NAME,
    },
    disabled: (editor) => editor.isMonomerCreationWizardActive,
    hidden: (options) => isHidden(options, MULTITAIL_ARROW_TOOL_NAME),
  },
  'reaction-mapping-tools': {
    disabled: (editor) => editor.isMonomerCreationWizardActive,
    hidden: (options) => isHidden(options, 'reaction-mapping-tools'),
  },
  rgroup: {
    disabled: (editor) => editor.isMonomerCreationWizardActive,
    hidden: (options) => isHidden(options, 'rgroup'),
  },
  'rgroup-attpoints': {
    shortcut: 'Mod+r',
    title: 'Attachment Point Tool',
    action: { tool: 'apoint' },
    disabled: (editor) => editor.isMonomerCreationWizardActive,
    hidden: (options) => isHidden(options, 'rgroup-attpoints'),
  },
  [CREATE_MONOMER_TOOL_NAME]: {
    shortcut: 'Mod+m',
    title: 'Create a monomer',
    action: {
      tool: CREATE_MONOMER_TOOL_NAME,
    },
    disabled: (editor) =>
      editor.isMonomerCreationWizardActive ||
      !editor.isMonomerCreationWizardEnabled,
    hidden: (options) => isHidden(options, CREATE_MONOMER_TOOL_NAME),
  },
  bonds: {
    hidden: (options) => isHidden(options, 'bonds'),
  },
};

const bondCuts: Record<string, string> = {
  single: '1',
  double: '2',
  triple: '3',
  up: '1',
  down: '1',
  updown: '1',
  crossed: '2',
  any: '0',
  aromatic: '4',
};

const typeSchema = bondSchema.properties.type;
const bondTypes = typeSchema.enum as string[];
const bondTypeNames = typeSchema.enumNames as string[];

const monomerWizardDisallowedBondTypes: Set<string> = new Set(
  MONOMER_WIZARD_DISALLOWED_BOND_TYPES,
);

export default bondTypes.reduce<Record<string, ToolActionEntry>>(
  (res, type, i) => {
    res[`bond-${type}`] = {
      title: `${bondTypeNames[i]} Bond`,
      shortcut: bondCuts[type],
      action: {
        tool: 'bond',
        opts: toBondType(type),
      },
      hidden: (options) => isHidden(options, `bond-${type}`),
      ...(monomerWizardDisallowedBondTypes.has(type) && {
        disabled: (editor) => editor.isMonomerCreationWizardActive,
      }),
    };
    return res;
  },
  toolActions,
);
