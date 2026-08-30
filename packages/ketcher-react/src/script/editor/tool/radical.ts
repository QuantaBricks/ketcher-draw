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

import { Atom, fromAtomsAttrs } from 'ketcher-core';
import type Editor from '../Editor';
import type { Tool } from './Tool';

// Atom radical values (small-molecule Atom.PATTERN.RADICAL):
// 0 = none, 2 (DOUBLET) = 1 dot, 1 (SINGLET) = 2 dots, 3 (TRIPLET) = 2 dots
const RADICAL_ONE_DOT = 2;
const RADICAL_TWO_DOTS = 1;

const nextRadical = (current: number): number => {
  if (!current) return RADICAL_ONE_DOT;
  if (current === RADICAL_ONE_DOT) return RADICAL_TWO_DOTS;
  return 0;
};

class RadicalTool implements Tool {
  private readonly editor: Editor;

  constructor(editor) {
    this.editor = editor;
    this.editor.selection(null);
  }

  mousemove(event) {
    const molecule = this.editor.render.ctab.molecule;
    const ci = this.editor.findItem(event, ['atoms']);
    const atom = ci && ci.map === 'atoms' ? molecule.atoms.get(ci.id) : null;
    if (atom && this.isRadicalizableAtom(atom)) {
      this.editor.hover(ci);
    } else {
      this.editor.hover(null, null, event);
    }
    return true;
  }

  click(event) {
    const editor = this.editor;
    const rnd = editor.render;
    const molecule = rnd.ctab.molecule;
    const ci = editor.findItem(event, ['atoms']);

    if (ci && ci.map === 'atoms') {
      const atom = molecule.atoms.get(ci.id);
      if (atom && this.isRadicalizableAtom(atom)) {
        this.editor.hover(ci);
        this.editor.update(
          fromAtomsAttrs(
            rnd.ctab,
            ci.id,
            {
              radical: nextRadical(atom.radical ?? 0),
            },
            null,
          ),
        );
      }
    }
    return true;
  }

  private isRadicalizableAtom(atom: Atom): boolean {
    return !atom.atomList && !atom.rglabel;
  }
}

export default RadicalTool;
