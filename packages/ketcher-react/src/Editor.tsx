import { useEffect, useState } from 'react';
import {
  type EditorProps,
  MicromoleculesEditor as MicromoleculesEditorComponent,
} from './MicromoleculesEditor';
import styles from './Editor.module.less';
import { type Ketcher, type Editor as MoleculesEditor } from 'ketcher-core';

type Props = Omit<EditorProps, 'ketcherId'>;

export const Editor = (props: Props) => {
  const [moleculesEditor, setMoleculesEditor] = useState<MoleculesEditor>();
  const [ketcher, setKetcher] = useState<Ketcher>();
  const [ketcherId, setKetcherId] = useState<string>('');

  useEffect(() => {
    if (ketcher && moleculesEditor) {
      props.onInit?.(ketcher);
    }
  }, [moleculesEditor]);

  const onInitMoleculesEditor = (ketcher: Ketcher) => {
    setKetcher(ketcher);
    setMoleculesEditor(ketcher.editor);
  };

  return (
    <div data-ketcher-editor className={styles.editorsWrapper}>
      <MicromoleculesEditorComponent
        {...props}
        ketcherId={ketcherId}
        onSetKetcherId={setKetcherId}
        onInit={onInitMoleculesEditor}
      />
    </div>
  );
};
