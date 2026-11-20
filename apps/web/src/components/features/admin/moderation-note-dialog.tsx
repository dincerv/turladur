'use client';

import { useState } from 'react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

type Props = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  required?: boolean;
  pending?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (note: string) => void | Promise<void>;
};

/** Shared admin reject / suspend note dialog. */
export function ModerationNoteDialog({
  open,
  title,
  description = 'Bu işlem satıcıya iletilir. Gerekçe zorunludur.',
  confirmLabel = 'Onayla',
  required = true,
  pending = false,
  onOpenChange,
  onConfirm,
}: Props) {
  const [note, setNote] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  async function handleConfirm() {
    const trimmed = note.trim();
    if (required && trimmed.length < 3) {
      setLocalError('En az 3 karakterlik gerekçe girin');
      return;
    }
    setLocalError(null);
    await onConfirm(trimmed);
    setNote('');
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setNote('');
          setLocalError(null);
        }
        onOpenChange(next);
      }}
    >
      <DialogContent data-testid="admin-moderation-dialog">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={4}
          maxLength={500}
          placeholder="Gerekçe…"
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          data-testid="admin-moderation-note"
        />
        {localError ? (
          <p
            className="text-sm text-red-600"
            data-testid="admin-moderation-error"
          >
            {localError}
          </p>
        ) : null}
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            Vazgeç
          </Button>
          <Button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={pending}
            data-testid="admin-moderation-confirm"
          >
            {pending ? 'Kaydediliyor…' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
