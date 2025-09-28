// src/zustands/EditorZustand.ts
import { create } from 'zustand';
import { ExampleTMs } from '@utils/ExampleTMs';

interface EditorZustand {
  // For the MonacoEditor
  code: string;
  setCode: (code: string, force?: boolean) => void;
  // Used to force reloading the editor, e.g. after selecting the same example again
  // (Monaco does not reload if the value is the same)
  nonce: number;
  bumpNonce: () => void;
}

export const useEditorZustand = create<EditorZustand>((set, get) => ({
  code: ExampleTMs[0].code,
  nonce: 0,
  setCode: (code, force = false) => {
    const same = get().code === code;
    set({
      code,
      nonce: force || same ? get().nonce + 1 : get().nonce,
    });
  },
  bumpNonce: () => set((s) => ({ nonce: s.nonce + 1 })),
}));
