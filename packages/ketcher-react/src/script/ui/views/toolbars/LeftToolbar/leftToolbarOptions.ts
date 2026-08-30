import { bondCommon, bondQuery, bondSpecial, bondStereo } from './Bond/options';
import { makeItems } from '../ToolbarGroupItem/utils';
import type { ToolbarItem } from '../toolbar.types';

const selectOptions: ToolbarItem[] = makeItems([
  'select-rectangle',
  'select-lasso',
  'select-structure',
  'select-fragment',
]);

export { bondCommon, bondQuery, bondSpecial, bondStereo, selectOptions };
