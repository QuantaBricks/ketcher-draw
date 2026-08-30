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
  CREATE_MONOMER_TOOL_NAME,
  MULTITAIL_ARROW_TOOL_NAME,
} from 'ketcher-core';

import APointTool from './apoint';
import AtomTool from './atom';
import AttachTool from './attach';
import BondTool from './bond';
import ChainTool from './chain';
import ChargeTool from './charge';
import EnhancedStereoTool from './enhanced-stereo';
import EraserTool from './eraser';
import HandTool from './hand';
import PasteTool from './paste';
import { CommonArrowTool } from './arrow/commonArrow';
import RotateTool from './rotate';
import RadicalTool from './radical';
import SGroupTool from './sgroup';
import TemplateTool from './template';
import type { ToolConstructorInterface } from './Tool';
import { SelectCommonTool } from './select';
import CreateMonomerTool from './create-monomer';
import FragmentSelectionTool from './fragmentSelection';

export const toolsMap: Record<string, ToolConstructorInterface> = {
  hand: HandTool,
  select: SelectCommonTool,
  fragmentSelection: FragmentSelectionTool,
  sgroup: SGroupTool,
  atom: AtomTool,
  // Cast to ToolConstructorInterface: constructor param types are narrower
  // than `unknown[]`, but toolsMap only ever calls these with the correct args.
  bond: BondTool as unknown as ToolConstructorInterface,
  chain: ChainTool,
  // Cast to ToolConstructorInterface: constructor param types are narrower
  // than `unknown[]`, but toolsMap only ever calls these with the correct args.
  template: TemplateTool as unknown as ToolConstructorInterface,
  charge: ChargeTool,
  radical: RadicalTool,
  apoint: APointTool,
  attach: AttachTool,
  // Cast to ToolConstructorInterface: constructor param types are narrower
  // than `unknown[]`, but toolsMap only ever calls these with the correct args.
  eraser: EraserTool as unknown as ToolConstructorInterface,
  [MULTITAIL_ARROW_TOOL_NAME]:
    CommonArrowTool as unknown as ToolConstructorInterface,
  paste: PasteTool,
  // Cast to ToolConstructorInterface: constructor param types are narrower
  // than `unknown[]`, but toolsMap only ever calls these with the correct args.
  rotate: RotateTool as unknown as ToolConstructorInterface,
  enhancedStereo: EnhancedStereoTool,
  [CREATE_MONOMER_TOOL_NAME]: CreateMonomerTool,
};
