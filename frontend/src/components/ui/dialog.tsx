"use client";

import * as RadixDialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
}

export function Dialog({ open, onOpenChange, title, description, children }: DialogProps) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-40 bg-black/50" />
        <RadixDialog.Content
          {...(description ? {} : { "aria-describedby": undefined })}
          className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[min(32rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-card border border-line bg-surface p-6 text-text"
        >
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <RadixDialog.Title className="text-lg font-semibold">{title}</RadixDialog.Title>
              {description && (
                <RadixDialog.Description className="mt-1 text-sm text-muted">
                  {description}
                </RadixDialog.Description>
              )}
            </div>
            <RadixDialog.Close asChild>
              <Button variant="ghost" size="icon" aria-label="Fechar">
                <X className="size-4" strokeWidth={1.8} />
              </Button>
            </RadixDialog.Close>
          </div>
          {children}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  pending?: boolean;
  onConfirm: () => void;
}

/** Confirmação de ações destrutivas (DEVELOPMENT_PLAN §3.9.6). */
export function ConfirmDialog({ confirmLabel, pending, onConfirm, ...props }: ConfirmDialogProps) {
  return (
    <Dialog {...props}>
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="secondary" onClick={() => props.onOpenChange(false)}>
          Cancelar
        </Button>
        <Button variant="danger" pending={pending} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </Dialog>
  );
}
