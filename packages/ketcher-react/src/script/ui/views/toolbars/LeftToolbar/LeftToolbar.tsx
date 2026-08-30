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

import { type RefObject, useEffect, useRef, useState } from 'react';
import {
  type ToolbarGroupItemCallProps,
  type ToolbarGroupItemProps,
  ToolbarGroupItem,
} from '../ToolbarGroupItem';
import type { ToolbarItem, ToolbarItemVariant } from '../toolbar.types';
import {
  bondCommon,
  bondQuery,
  bondSpecial,
  bondStereo,
  selectOptions,
} from './leftToolbarOptions';

import { ArrowScroll } from '../ArrowScroll';
import { Bond } from './Bond';
import { TemplatesList } from '../BottomToolbar/TemplatesList';
import { AtomsList } from '../RightToolbar/AtomsList';
import { basicAtoms } from '../../../action/atoms';
import action from '../../../action';
import classes from './LeftToolbar.module.less';
import clsx from 'clsx';
import { useInView } from 'react-intersection-observer';
import { useResizeObserver } from '../../../../../hooks';

interface LeftToolbarProps
  extends Omit<ToolbarGroupItemProps, 'id' | 'options'> {
  className?: string;
  active?: {
    opts: any;
    tool: string;
  };
  freqAtoms: any[];
}

type LeftToolbarCallProps = ToolbarGroupItemCallProps;

type Props = LeftToolbarProps & LeftToolbarCallProps;

type ItemProps = {
  id: ToolbarItemVariant;
  options?: ToolbarItem[];
  dataTestId?: string;
};

interface GroupProps {
  items?: ItemProps[];
  className?: string;
  height?: number;
  rest: Omit<Props, 'className'>;
}

const Group = ({ items, className, height, rest }: GroupProps) => {
  const { status } = rest;
  const visibleItems =
    items?.reduce<ItemProps[]>(
      (acc, item) =>
        status[item.id]?.hidden ||
        item.options?.every((option) => status[option.id]?.hidden)
          ? acc
          : acc.concat(item),
      [],
    ) ?? [];

  return visibleItems.length ? (
    <div className={clsx(classes.group, className)}>
      {visibleItems.map((item) => {
        switch (item.id) {
          case 'bond-common':
            return <Bond {...rest} height={height} key={item.id} />;
          case 'bonds':
            return (
              <ToolbarGroupItem
                id={item.id}
                options={item.options}
                key={item.id}
                dataTestId="bonds"
                {...rest}
              />
            );
          default:
            return (
              <ToolbarGroupItem
                id={item.id}
                options={item.options}
                key={item.id}
                {...rest}
              />
            );
        }
      })}
    </div>
  ) : null;
};

const LeftToolbar = (props: Props) => {
  const { className, ...rest } = props;
  const { active, onAction, freqAtoms, status } = rest;
  const { ref, height } = useResizeObserver<HTMLDivElement>();
  const scrollRef = useRef(null) as RefObject<HTMLDivElement | null>;
  const [startRef, startInView] = useInView({ threshold: 1 });
  const [, endInView] = useInView({ threshold: 1 });
  const sizeRef = useRef(null) as RefObject<HTMLDivElement | null>;
  const [fitScale, setFitScale] = useState(1);

  // Proportionally scale the toolbar content so it fits the available height
  // instead of being clipped. Only scales down when the content is taller.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) {
      return;
    }
    const contentHeight = el.scrollHeight;
    if (height && contentHeight > height) {
      setFitScale(height / contentHeight);
    } else {
      setFitScale(1);
    }
  }, [height]);

  const scrollUp = () => {
    if (!scrollRef.current || !sizeRef.current) {
      return;
    }

    scrollRef.current.scrollTop -= sizeRef.current.offsetHeight;
  };

  const scrollDown = () => {
    if (!scrollRef.current || !sizeRef.current) {
      return;
    }

    scrollRef.current.scrollTop += sizeRef.current.offsetHeight;
  };

  return (
    <div
      data-testid="left-toolbar"
      className={clsx(classes.root, className)}
      ref={ref}
    >
      <div
        className={classes.buttons}
        ref={scrollRef}
        data-testid="left-toolbar-buttons"
      >
        <div
          className={classes.fitScale}
          style={{ transform: `scale(${fitScale})` }}
        >
          <Group
            className={clsx(classes.groupItem, classes.toolsGroup)}
            items={[
              { id: 'hand' },
              { id: 'select', options: selectOptions },
              { id: 'erase' },
            ]}
            height={height}
            rest={rest}
          />

          <Group
            className={clsx(classes.groupItem, classes.toolsGroup)}
            items={[
              {
                id: 'bonds',
                options: [
                  ...bondCommon,
                  ...bondQuery,
                  ...bondSpecial,
                  ...bondStereo,
                ],
              },
              { id: 'chain' },
              { id: 'radical' },
              { id: 'charge-plus' },
              { id: 'charge-minus' },
            ]}
            height={height}
            rest={rest}
          />

          <div
            className={clsx(
              classes.group,
              classes.groupItem,
              classes.templatesGroup,
            )}
          >
            <TemplatesList {...rest} />
          </div>

          <div className={classes.listener} ref={startRef}>
            <div
              className={clsx(
                classes.group,
                classes.groupItem,
                classes.atomsList,
              )}
            >
              <AtomsList
                atoms={basicAtoms.slice(0, 1)}
                active={active}
                onAction={onAction}
                status={status}
              />
              <AtomsList
                atoms={basicAtoms.slice(1, 5)}
                active={active}
                onAction={onAction}
                status={status}
              />
              <AtomsList
                atoms={basicAtoms.slice(5)}
                active={active}
                onAction={onAction}
                status={status}
              />
              <AtomsList
                atoms={freqAtoms}
                status={status}
                active={active}
                onAction={onAction}
              />
              <ToolbarGroupItem id="any-atom" {...rest} />
              <ToolbarGroupItem id="period-table" {...rest} />
            </div>
          </div>

          <button
            className={classes.libraryButton}
            data-testid="template-lib"
            onClick={() => onAction(action['template-lib'].action)}
            title={action['template-lib'].title}
          >
            Templates
          </button>
        </div>
      </div>
      {fitScale === 1 &&
        height &&
        (scrollRef?.current?.scrollHeight || 0) > height && (
          <ArrowScroll
            startInView={startInView}
            endInView={endInView}
            scrollForward={scrollDown}
            scrollBack={scrollUp}
          />
        )}
    </div>
  );
};

export type { LeftToolbarProps, LeftToolbarCallProps };
export { LeftToolbar };
