"use client";

import * as React from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "./button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./dialog";
import { Icon } from "./icon";

export interface ConfirmDialogProps {
  open: boolean;
  title: React.ReactNode;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  /** Disables both buttons and blocks dismissal while an async confirm runs. */
  confirmLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Yes / no modal (ported from Kloqra).
 * Built on Dialog, not AlertDialog, so Esc, Cancel, X and backdrop all dismiss
 * (Kloqra KLOQ-684) — except while `confirmLoading`, which also blocks double submit.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  confirmLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !confirmLoading) onCancel();
      }}
    >
      <DialogContent
        size="sm"
        showClose={!confirmLoading}
        className="text-center"
        {...(description ? {} : { "aria-describedby": undefined })}
      >
        <DialogHeader className="items-center gap-3 pr-0 text-center">
          {destructive ? (
            <span className="modal__icon modal__icon--destructive mx-auto">
              <Icon icon={AlertTriangle} size="sm" lottie={false} />
            </span>
          ) : null}
          <DialogTitle>{title}</DialogTitle>
          {description ? (
            <DialogDescription className="mx-auto max-w-sm">{description}</DialogDescription>
          ) : null}
        </DialogHeader>
        <DialogFooter className="modal__footer">
          <Button type="button" variant="outline" disabled={confirmLoading} onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={destructive ? "destructive" : "default"}
            disabled={confirmLoading}
            aria-busy={confirmLoading || undefined}
            onClick={() => {
              if (!confirmLoading) onConfirm();
            }}
          >
            {confirmLoading ? "Please wait…" : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export type ConfirmOptions = {
  title: React.ReactNode;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  /**
   * Optional async work to run before closing. While it runs the dialog
   * shows "Please wait…" and cannot be dismissed. A thrown error keeps the
   * dialog open and rejects the confirm() promise.
   */
  onConfirm?: () => Promise<unknown> | unknown;
};

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = React.createContext<ConfirmFn | null>(null);

/**
 * Mount once (AppProviders). Pages call `const confirm = useConfirm()` and
 * `if (!(await confirm({ title, destructive: true }))) return;` — a drop-in,
 * on-brand replacement for window.confirm().
 */
export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<(ConfirmOptions & { open: boolean }) | null>(null);
  const [loading, setLoading] = React.useState(false);
  const resolver = React.useRef<{ resolve: (v: boolean) => void; reject: (e: unknown) => void } | null>(null);

  const confirm = React.useCallback<ConfirmFn>((options) => {
    resolver.current?.resolve(false);
    setState({ ...options, open: true });
    return new Promise<boolean>((resolve, reject) => {
      resolver.current = { resolve, reject };
    });
  }, []);

  const close = (value: boolean) => {
    resolver.current?.resolve(value);
    resolver.current = null;
    setState((s) => (s ? { ...s, open: false } : s));
  };

  const handleConfirm = async () => {
    if (!state?.onConfirm) return close(true);
    setLoading(true);
    try {
      await state.onConfirm();
      close(true);
    } catch (error) {
      resolver.current?.reject(error);
      resolver.current = null;
      setState((s) => (s ? { ...s, open: false } : s));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state ? (
        <ConfirmDialog
          open={state.open}
          title={state.title}
          description={state.description}
          confirmLabel={state.confirmLabel ?? (state.destructive ? "Delete" : "Confirm")}
          cancelLabel={state.cancelLabel}
          destructive={state.destructive}
          confirmLoading={loading}
          onConfirm={handleConfirm}
          onCancel={() => close(false)}
        />
      ) : null}
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmFn {
  const ctx = React.useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used inside <ConfirmProvider> (mounted by AppProviders).");
  return ctx;
}
