import { create } from "zustand";

type MutableRef<T> = { current: T };

export interface Model {
  id: string;
  name: string;
  hasApiKey: boolean;
  modelClass?: string | null;
}

interface ChatHeaderState {
  selectedModelId: string;
  setSelectedModelId: (id: string | ((prev: string) => string)) => void;
  selectedConnectionId: string;
  setSelectedConnectionId: (id: string | ((prev: string) => string)) => void;
  modelHasApiKey: boolean;
  setModelHasApiKey: (v: boolean) => void;
  models: Model[];
  setModels: (models: Model[]) => void;
  clearChatRef: MutableRef<(() => void) | null>;
  onRefreshRef: MutableRef<(() => void) | null>;
}

// Stable refs shared across all consumers
const clearChatRef: MutableRef<(() => void) | null> = { current: null };
const onRefreshRef: MutableRef<(() => void) | null> = { current: null };

export const useChatHeaderStore = create<ChatHeaderState>((set, get) => ({
  selectedModelId: "",
  setSelectedModelId: (id) =>
    set({
      selectedModelId:
        typeof id === "function" ? id(get().selectedModelId) : id,
    }),
  selectedConnectionId: "",
  setSelectedConnectionId: (id) =>
    set({
      selectedConnectionId:
        typeof id === "function" ? id(get().selectedConnectionId) : id,
    }),
  modelHasApiKey: true,
  setModelHasApiKey: (v) => set({ modelHasApiKey: v }),
  models: [],
  setModels: (models) => set({ models }),
  clearChatRef,
  onRefreshRef,
}));
