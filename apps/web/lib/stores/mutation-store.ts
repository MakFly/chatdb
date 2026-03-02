import { create } from "zustand";

export interface PendingMutation {
  query: string;
  mutationType: string;
  previewCount: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export type FeedbackState = "success" | "error" | "cancelled" | null;

interface MutationState {
  pendingMutation: PendingMutation | null;
  setPendingMutation: (m: PendingMutation | null) => void;
  feedbackState: FeedbackState;
  feedbackMessage: string | null;
  setFeedback: (state: FeedbackState, message?: string | null) => void;
}

export const useMutationStore = create<MutationState>((set) => ({
  pendingMutation: null,
  setPendingMutation: (pendingMutation) => set({ pendingMutation }),
  feedbackState: null,
  feedbackMessage: null,
  setFeedback: (feedbackState, feedbackMessage = null) =>
    set({ feedbackState, feedbackMessage }),
}));
