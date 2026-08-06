import { create } from "zustand";

export type ToastKind = "success" | "error" | "info";

export interface Toast {
  id: string;
  kind: ToastKind;
  message: string;
  duration: number;
}

interface ToastState {
  toasts: Toast[];
  push: (kind: ToastKind, message: string, duration?: number) => void;
  dismiss: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (kind, message, duration = 3200) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    set((s) => ({ toasts: [...s.toasts, { id, kind, message, duration }] }));
  },
  dismiss: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

/** 命令式调用：toast.success("已保存") */
export const toast = {
  success: (m: string, d?: number) => useToastStore.getState().push("success", m, d),
  error: (m: string, d?: number) => useToastStore.getState().push("error", m, d ?? 4500),
  info: (m: string, d?: number) => useToastStore.getState().push("info", m, d),
};
