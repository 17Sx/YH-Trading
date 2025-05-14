"use client";

import React from "react";
import { Button } from "@/components/ui/button"; 
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"; 
import { Loader2 } from "lucide-react"; 

export interface DeleteTradeConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  tradeIdentifier: string | null; 
  isPending: boolean;
}

export function DeleteTradeConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  tradeIdentifier,
  isPending,
}: DeleteTradeConfirmationModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Confirmer la suppression</DialogTitle>
          <DialogDescription>
            {tradeIdentifier
              ? `Êtes-vous sûr de vouloir supprimer le trade : "${tradeIdentifier}" ?`
              : "Êtes-vous sûr de vouloir supprimer ce trade ?"}
            <br />
            Cette action est irréversible.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isPending}
          >
            Annuler
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Supprimer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 