import type { Tool } from '../Tool';
import type Editor from '../../Editor';
import { MULTITAIL_ARROW_KEY } from 'ketcher-core';
import type {
  ArrowAddTool,
  ArrowMoveTool,
  CommonArrowDragContext,
  MultitailArrowClosestItem,
} from './arrow.types';
import { MultitailArrowAddTool } from './multitailArrowAdd';
import { handleMovingPosibilityCursor } from '../../utils';
import { MultitailArrowMoveTool } from './multitailArrowMoveTool';
import { ArrowTool } from './arrowTool';
import { getItemCursor } from '../../utils/getItemCursor';

export class CommonArrowTool extends ArrowTool implements Tool {
  static isDragContextMultitail(
    dragContext: CommonArrowDragContext<MultitailArrowClosestItem>,
  ): dragContext is CommonArrowDragContext<MultitailArrowClosestItem> {
    return dragContext.closestItem.map === MULTITAIL_ARROW_KEY;
  }

  private dragContext:
    | CommonArrowDragContext<MultitailArrowClosestItem>
    | 'add'
    | null = null;

  private readonly addTool: ArrowAddTool;
  private readonly multitailMoveTool: ArrowMoveTool<MultitailArrowClosestItem>;

  constructor(editor: Editor) {
    super(editor);
    this.multitailMoveTool = new MultitailArrowMoveTool(this.editor);
    this.editor.selection(null);
    this.addTool = new MultitailArrowAddTool(this.editor);
  }

  mousedown(event: PointerEvent) {
    const closestItem = this.editor.findItem(event, [
      MULTITAIL_ARROW_KEY,
    ]) as MultitailArrowClosestItem;

    if (closestItem) {
      this.dragContext = this.multitailMoveTool.mousedown(event, closestItem);

      this.editor.hover(null);
      this.editor.selection({ [closestItem.map]: [closestItem.id] });
    } else {
      this.dragContext = 'add';
      this.addTool.mousedown(event);
      this.editor.selection(null);
    }
  }

  mousemove(event: PointerEvent) {
    if (!this.dragContext) {
      const closestItem = this.editor.findItem(event, [
        MULTITAIL_ARROW_KEY,
      ]) as MultitailArrowClosestItem;
      this.editor.hover(closestItem, null, event);
      handleMovingPosibilityCursor(
        closestItem,
        this.render.paper.canvas,
        getItemCursor(this.render, closestItem),
      );
      return;
    }
    if (this.dragContext === 'add') {
      return this.addTool.mousemove(event);
    }

    if (this.dragContext.action) {
      this.dragContext.action.perform(this.reStruct);
    }
    if (CommonArrowTool.isDragContextMultitail(this.dragContext)) {
      this.dragContext.action = this.multitailMoveTool.mousemove(
        event,
        this.dragContext,
      );
    }
    if (this.dragContext.action) {
      this.editor.update(this.dragContext.action, true);
    }
  }

  mouseup(event: PointerEvent) {
    try {
      if (!this.dragContext) return;
      if (this.dragContext === 'add') {
        return this.addTool.mouseup(event);
      }
      if (CommonArrowTool.isDragContextMultitail(this.dragContext)) {
        this.dragContext.action = this.multitailMoveTool.mouseup(
          event,
          this.dragContext,
        );
      }
      const { action } = this.dragContext;
      if (action) {
        this.editor.update(true);
        this.editor.update(action);
      }
    } finally {
      this.dragContext = null;
    }
  }
}
